import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, Trip, PackingList, PackingListItem, GearItem, EmergencyContact } from '../types'
import { defaultGear } from '../data/defaultGear'
import { db, fetchAllUserData, pushAllToSupabase } from '../lib/db'

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      trips: [],
      packingLists: [],
      packingListItems: [],
      gearItems: [],
      emergencyContacts: [],
      activeTripId: null,
      seeded: false,
      skippedAuth: false,

      // ── Cloud sync ─────────────────────────────────────────────────────────

      syncFromSupabase: async () => {
        const cloudData = await fetchAllUserData()
        const cloudHasData = cloudData.gearItems.length > 0 || cloudData.trips.length > 0

        if (cloudHasData) {
          // Cloud is the source of truth — hydrate local state from it
          set({ ...cloudData, seeded: true })
        } else {
          // Cloud is empty — migrate whatever is already in local state up to Supabase
          // (handles first login after using the app as a guest)
          const local = get()
          const localHasData = local.gearItems.length > 0 || local.trips.length > 0
          if (localHasData) {
            await pushAllToSupabase(local)
          }
          // Either way mark seeded so we don't overwrite with defaults on next render
          set({ seeded: true })
        }
      },

      clearUserData: () => {
        set({
          trips: [],
          packingLists: [],
          packingListItems: [],
          gearItems: [],
          emergencyContacts: [],
          activeTripId: null,
          seeded: false,
        })
      },

      setSkippedAuth: (v) => set({ skippedAuth: v }),

      // ── Seed ───────────────────────────────────────────────────────────────

      seedDefaultGear: () => {
        const { seeded, gearItems } = get()
        if (seeded || gearItems.length > 0) return
        const items: GearItem[] = defaultGear.map(g => ({ ...g, id: uid(), createdDate: now() }))
        set({ gearItems: items, seeded: true })
        // Also push defaults to Supabase if the user is logged in
        items.forEach(item => db.gearItems.upsert(item))
      },

      // ── Trips ──────────────────────────────────────────────────────────────

      createTrip: (data) => {
        const tripId = uid()
        const listId = uid()
        const trip: Trip = { ...data, id: tripId, packingListId: listId, createdDate: now() }
        const list: PackingList = { id: listId, tripId, createdDate: now() }
        set(s => ({
          trips: [...s.trips, trip],
          packingLists: [...s.packingLists, list],
          activeTripId: tripId,
        }))
        // Chain: packing_lists has a FK to trips so trip must exist first
        db.trips.upsert(trip).then(() => db.packingLists.upsert(list))
      },

      updateTrip: (id, updates) => {
        set(s => ({ trips: s.trips.map(t => t.id === id ? { ...t, ...updates } : t) }))
        const updated = get().trips.find(t => t.id === id)
        if (updated) db.trips.upsert(updated)
      },

      deleteTrip: (id) => {
        const { packingLists, activeTripId } = get()
        const listIds = packingLists.filter(l => l.tripId === id).map(l => l.id)
        set(s => ({
          trips: s.trips.filter(t => t.id !== id),
          packingLists: s.packingLists.filter(l => l.tripId !== id),
          packingListItems: s.packingListItems.filter(i => !listIds.includes(i.packingListId)),
          emergencyContacts: s.emergencyContacts.filter(c => c.tripId !== id),
          activeTripId: activeTripId === id ? null : activeTripId,
        }))
        db.trips.delete(id) // cascade handles lists/items/contacts in DB
      },

      setActiveTrip: (id) => set({ activeTripId: id }),

      updateItineraryEmail: (tripId, email) => {
        set(s => ({ trips: s.trips.map(t => t.id === tripId ? { ...t, itineraryEmail: email } : t) }))
        const updated = get().trips.find(t => t.id === tripId)
        if (updated) db.trips.upsert(updated)
      },

      // ── Gear ───────────────────────────────────────────────────────────────

      addGearItem: (data) => {
        const item: GearItem = { ...data, id: uid(), createdDate: now() }
        set(s => ({ gearItems: [...s.gearItems, item] }))
        db.gearItems.upsert(item)
      },

      updateGearItem: (id, updates) => {
        set(s => ({ gearItems: s.gearItems.map(g => g.id === id ? { ...g, ...updates } : g) }))
        const updated = get().gearItems.find(g => g.id === id)
        if (updated) db.gearItems.upsert(updated)
      },

      deleteGearItem: (id) => {
        set(s => ({ gearItems: s.gearItems.filter(g => g.id !== id) }))
        db.gearItems.delete(id)
      },

      // ── Packing list items ─────────────────────────────────────────────────

      addPackingListItem: (packingListId, gearItemId, quantity) => {
        const item: PackingListItem = {
          id: uid(), packingListId, gearItemId, quantity, isPacked: false, createdDate: now(),
        }
        set(s => ({ packingListItems: [...s.packingListItems, item] }))
        db.packingListItems.upsert(item)
      },

      updatePackingListItem: (id, updates) => {
        set(s => ({
          packingListItems: s.packingListItems.map(i => i.id === id ? { ...i, ...updates } : i),
        }))
        const updated = get().packingListItems.find(i => i.id === id)
        if (updated) db.packingListItems.upsert(updated)
      },

      deletePackingListItem: (id) => {
        set(s => ({ packingListItems: s.packingListItems.filter(i => i.id !== id) }))
        db.packingListItems.delete(id)
      },

      togglePacked: (id) => {
        set(s => ({
          packingListItems: s.packingListItems.map(i =>
            i.id === id ? { ...i, isPacked: !i.isPacked } : i
          ),
        }))
        const updated = get().packingListItems.find(i => i.id === id)
        if (updated) db.packingListItems.upsert(updated)
      },

      // ── Emergency contacts ────────────────────────────────────────────────

      addEmergencyContact: (tripId, data) => {
        const contact: EmergencyContact = { ...data, id: uid(), tripId, createdDate: now() }
        set(s => ({ emergencyContacts: [...s.emergencyContacts, contact] }))
        db.emergencyContacts.upsert(contact)
      },

      deleteEmergencyContact: (id) => {
        set(s => ({ emergencyContacts: s.emergencyContacts.filter(c => c.id !== id) }))
        db.emergencyContacts.delete(id)
      },
    }),
    { name: 'backpacking-app-v1' }
  )
)
