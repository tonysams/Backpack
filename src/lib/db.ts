import { supabase } from './supabase'
import type { GearItem, Trip, PackingList, PackingListItem, EmergencyContact } from '../types'

// ─── Current user ID ──────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  // getSession reads from local cache — no network call needed
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

// ─── Push all local data to Supabase (first-login migration) ─────────────────
// Must run in dependency order: gear → trips → packing_lists → items → contacts

export async function pushAllToSupabase(state: {
  gearItems: import('../types').GearItem[]
  trips: import('../types').Trip[]
  packingLists: import('../types').PackingList[]
  packingListItems: import('../types').PackingListItem[]
  emergencyContacts: import('../types').EmergencyContact[]
}) {
  for (const g of state.gearItems)         await db.gearItems.upsert(g)
  for (const t of state.trips)             await db.trips.upsert(t)
  for (const l of state.packingLists)      await db.packingLists.upsert(l)
  for (const i of state.packingListItems)  await db.packingListItems.upsert(i)
  for (const c of state.emergencyContacts) await db.emergencyContacts.upsert(c)
}

// ─── Fetch all user data ──────────────────────────────────────────────────────

export async function fetchAllUserData() {
  const [gear, trips, lists, items, contacts] = await Promise.all([
    supabase.from('gear_items').select('*').order('created_date'),
    supabase.from('trips').select('*').order('created_date'),
    supabase.from('packing_lists').select('*').order('created_date'),
    supabase.from('packing_list_items').select('*').order('created_date'),
    supabase.from('emergency_contacts').select('*').order('created_date'),
  ])

  return {
    gearItems:         (gear.data     ?? []).map(fromDbGear),
    trips:             (trips.data    ?? []).map(fromDbTrip),
    packingLists:      (lists.data    ?? []).map(fromDbList),
    packingListItems:  (items.data    ?? []).map(fromDbItem),
    emergencyContacts: (contacts.data ?? []).map(fromDbContact),
  }
}

// ─── Upsert helpers (fire-and-forget from store) ─────────────────────────────

async function dbUpsert(table: string, row: Row) {
  const uid = await getUserId()
  if (!uid) {
    console.warn(`[DB] skipping upsert on ${table} — no active session`)
    return
  }
  const { error } = await supabase.from(table).upsert({ ...row, user_id: uid })
  if (error) console.error(`[DB] upsert failed on ${table}:`, error.message, row)
}

async function dbDelete(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) console.error(`[DB] delete failed on ${table}:`, error.message, id)
}

export const db = {
  gearItems: {
    upsert: (item: GearItem)         => dbUpsert('gear_items', toDbGear(item)),
    delete: (id: string)             => dbDelete('gear_items', id),
  },
  trips: {
    upsert: (trip: Trip)             => dbUpsert('trips', toDbTrip(trip)),
    delete: (id: string)             => dbDelete('trips', id),
  },
  packingLists: {
    upsert: (list: PackingList)      => dbUpsert('packing_lists', toDbList(list)),
    delete: (id: string)             => dbDelete('packing_lists', id),
  },
  packingListItems: {
    upsert: (item: PackingListItem)  => dbUpsert('packing_list_items', toDbItem(item)),
    delete: (id: string)             => dbDelete('packing_list_items', id),
  },
  emergencyContacts: {
    upsert: (contact: EmergencyContact) => dbUpsert('emergency_contacts', toDbContact(contact)),
    delete: (id: string)                => dbDelete('emergency_contacts', id),
  },
}

// ─── Row mappers (camelCase ↔ snake_case) ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

function toDbGear(g: GearItem): Row {
  return { id: g.id, name: g.name, category: g.category, weight: g.weight, notes: g.notes ?? null, created_date: g.createdDate }
}
function fromDbGear(r: Row): GearItem {
  return { id: r.id, name: r.name, category: r.category, weight: r.weight, notes: r.notes ?? undefined, createdDate: r.created_date }
}

function toDbTrip(t: Trip): Row {
  return {
    id: t.id, name: t.name, start_date: t.startDate, end_date: t.endDate,
    route: t.route ?? null, distance: t.distance ?? null, elevation: t.elevation ?? null,
    notes: t.notes ?? null, itinerary_email: t.itineraryEmail ?? null,
    packing_list_id: t.packingListId, created_date: t.createdDate,
  }
}
function fromDbTrip(r: Row): Trip {
  return {
    id: r.id, name: r.name, startDate: r.start_date, endDate: r.end_date,
    route: r.route ?? undefined, distance: r.distance ?? undefined, elevation: r.elevation ?? undefined,
    notes: r.notes ?? undefined, itineraryEmail: r.itinerary_email ?? undefined,
    packingListId: r.packing_list_id, createdDate: r.created_date,
  }
}

function toDbList(l: PackingList): Row {
  return { id: l.id, trip_id: l.tripId, created_date: l.createdDate }
}
function fromDbList(r: Row): PackingList {
  return { id: r.id, tripId: r.trip_id, createdDate: r.created_date }
}

function toDbItem(i: PackingListItem): Row {
  return {
    id: i.id, packing_list_id: i.packingListId, gear_item_id: i.gearItemId,
    is_packed: i.isPacked, quantity: i.quantity, custom_weight: i.customWeight ?? null,
    created_date: i.createdDate,
  }
}
function fromDbItem(r: Row): PackingListItem {
  return {
    id: r.id, packingListId: r.packing_list_id, gearItemId: r.gear_item_id,
    isPacked: r.is_packed, quantity: r.quantity, customWeight: r.custom_weight ?? undefined,
    createdDate: r.created_date,
  }
}

function toDbContact(c: EmergencyContact): Row {
  return { id: c.id, trip_id: c.tripId, name: c.name, phone: c.phone, relationship: c.relationship, created_date: c.createdDate }
}
function fromDbContact(r: Row): EmergencyContact {
  return { id: r.id, tripId: r.trip_id, name: r.name, phone: r.phone, relationship: r.relationship, createdDate: r.created_date }
}
