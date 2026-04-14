import { supabase } from './supabase'
import type { GearItem, Trip, PackingList, PackingListItem, EmergencyContact } from '../types'

// ─── Current user ID ──────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
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

export const db = {
  gearItems: {
    upsert: async (item: GearItem) => {
      const uid = await getUserId()
      if (!uid) return
      await supabase.from('gear_items').upsert({ ...toDbGear(item), user_id: uid })
    },
    delete: (id: string) =>
      supabase.from('gear_items').delete().eq('id', id),
  },
  trips: {
    upsert: async (trip: Trip) => {
      const uid = await getUserId()
      if (!uid) return
      await supabase.from('trips').upsert({ ...toDbTrip(trip), user_id: uid })
    },
    delete: (id: string) =>
      supabase.from('trips').delete().eq('id', id),
  },
  packingLists: {
    upsert: async (list: PackingList) => {
      const uid = await getUserId()
      if (!uid) return
      await supabase.from('packing_lists').upsert({ ...toDbList(list), user_id: uid })
    },
    delete: (id: string) =>
      supabase.from('packing_lists').delete().eq('id', id),
  },
  packingListItems: {
    upsert: async (item: PackingListItem) => {
      const uid = await getUserId()
      if (!uid) return
      await supabase.from('packing_list_items').upsert({ ...toDbItem(item), user_id: uid })
    },
    delete: (id: string) =>
      supabase.from('packing_list_items').delete().eq('id', id),
  },
  emergencyContacts: {
    upsert: async (contact: EmergencyContact) => {
      const uid = await getUserId()
      if (!uid) return
      await supabase.from('emergency_contacts').upsert({ ...toDbContact(contact), user_id: uid })
    },
    delete: (id: string) =>
      supabase.from('emergency_contacts').delete().eq('id', id),
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
