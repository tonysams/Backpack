import type { Trip, PackingListItem, GearItem } from '../types'

// Compact payload — short keys keep the URL as small as possible
export interface SharedPayload {
  v: 1
  t: {
    n: string    // name
    s: string    // startDate
    e: string    // endDate
    r?: string   // route
    d?: number   // distance (miles)
    el?: number  // elevation (ft)
    no?: string  // notes
  }
  i: Array<{
    n: string    // gear name
    c: string    // category
    w: number    // weight (lbs)
    q: number    // quantity
    cw?: number  // customWeight override
    no?: string  // gear notes
  }>
}

export function buildShareUrl(
  trip: Trip,
  items: PackingListItem[],
  gearItems: GearItem[]
): string {
  const payload: SharedPayload = {
    v: 1,
    t: {
      n: trip.name,
      s: trip.startDate,
      e: trip.endDate,
      r: trip.route,
      d: trip.distance,
      el: trip.elevation,
      no: trip.notes,
    },
    i: items.flatMap(item => {
      const gear = gearItems.find(g => g.id === item.gearItemId)
      if (!gear) return []
      return [{
        n: gear.name,
        c: gear.category,
        w: gear.weight,
        q: item.quantity,
        cw: item.customWeight,
        no: gear.notes,
      }]
    }),
  }

  // Remove undefined keys to keep URL short
  const json = JSON.stringify(payload, (_, v) => v === undefined ? undefined : v)
  const encoded = btoa(encodeURIComponent(json))
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}?share=${encoded}`
}

export function parseShareParam(encoded: string): SharedPayload | null {
  try {
    const json = decodeURIComponent(atob(encoded))
    const data = JSON.parse(json) as SharedPayload
    if (data.v !== 1 || !data.t || !data.i) return null
    return data
  } catch {
    return null
  }
}

export function getShareParam(): string | null {
  return new URLSearchParams(window.location.search).get('share')
}

/** Import a shared payload into the live store. Returns the new trip ID. */
export function importSharedTrip(
  payload: SharedPayload,
  store: {
    gearItems: GearItem[]
    addGearItem: (data: Omit<GearItem, 'id' | 'createdDate'>) => void
    createTrip: (data: Omit<Trip, 'id' | 'packingListId' | 'createdDate'>) => void
    addPackingListItem: (listId: string, gearId: string, qty: number) => void
    updatePackingListItem: (id: string, updates: Partial<Pick<PackingListItem, 'quantity' | 'customWeight' | 'isPacked'>>) => void
    getState: () => { trips: Trip[]; packingListItems: PackingListItem[]; gearItems: GearItem[] }
  }
): string {
  // 1. Ensure every gear item exists in the library (match by name + category)
  for (const item of payload.i) {
    const exists = store.gearItems.some(g => g.name === item.n && g.category === item.c)
    if (!exists) {
      store.addGearItem({ name: item.n, category: item.c, weight: item.w, notes: item.no })
    }
  }

  // 2. Create the trip (also auto-creates its PackingList)
  store.createTrip({
    name: payload.t.n,
    startDate: payload.t.s,
    endDate: payload.t.e,
    route: payload.t.r,
    distance: payload.t.d,
    elevation: payload.t.el,
    notes: payload.t.no,
  })

  // 3. Get the newly created trip + its packing list ID
  const freshState = store.getState()
  const newTrip = freshState.trips[freshState.trips.length - 1]
  const packingListId = newTrip.packingListId

  // 4. Add each item to the packing list
  for (const item of payload.i) {
    const gear = freshState.gearItems.find(g => g.name === item.n && g.category === item.c)
    if (!gear) continue
    store.addPackingListItem(packingListId, gear.id, item.q)

    // Apply custom weight override if present
    if (item.cw != null) {
      const freshItems = store.getState().packingListItems
      const matches = freshItems.filter((i: PackingListItem) => i.packingListId === packingListId && i.gearItemId === gear.id)
      const added = matches[matches.length - 1]
      if (added) store.updatePackingListItem(added.id, { customWeight: item.cw })
    }
  }

  return newTrip.id
}
