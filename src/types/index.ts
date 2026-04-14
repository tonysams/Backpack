export interface GearItem {
  id: string
  name: string
  category: string
  weight: number // lbs
  notes?: string
  createdDate: string
}

export interface Trip {
  id: string
  name: string
  startDate: string
  endDate: string
  route?: string
  distance?: number // miles
  elevation?: number // feet
  notes?: string
  itineraryEmail?: string
  packingListId: string
  createdDate: string
}

export interface PackingList {
  id: string
  tripId: string
  createdDate: string
}

export interface PackingListItem {
  id: string
  packingListId: string
  gearItemId: string
  isPacked: boolean
  quantity: number
  customWeight?: number
  createdDate: string
}

export interface EmergencyContact {
  id: string
  tripId: string
  name: string
  phone: string
  relationship: string
  createdDate: string
}

export interface AppState {
  trips: Trip[]
  packingLists: PackingList[]
  packingListItems: PackingListItem[]
  gearItems: GearItem[]
  emergencyContacts: EmergencyContact[]
  activeTripId: string | null
  seeded: boolean
  skippedAuth: boolean

  syncFromSupabase: () => Promise<void>
  clearUserData: () => void
  setSkippedAuth: (v: boolean) => void

  createTrip: (data: Omit<Trip, 'id' | 'packingListId' | 'createdDate'>) => void
  updateTrip: (id: string, updates: Partial<Omit<Trip, 'id' | 'packingListId' | 'createdDate'>>) => void
  deleteTrip: (id: string) => void
  setActiveTrip: (id: string | null) => void

  addGearItem: (data: Omit<GearItem, 'id' | 'createdDate'>) => void
  updateGearItem: (id: string, updates: Partial<Omit<GearItem, 'id' | 'createdDate'>>) => void
  deleteGearItem: (id: string) => void

  addPackingListItem: (packingListId: string, gearItemId: string, quantity: number) => void
  updatePackingListItem: (id: string, updates: Partial<Pick<PackingListItem, 'quantity' | 'customWeight' | 'isPacked'>>) => void
  deletePackingListItem: (id: string) => void
  togglePacked: (id: string) => void

  addEmergencyContact: (tripId: string, data: Omit<EmergencyContact, 'id' | 'tripId' | 'createdDate'>) => void
  deleteEmergencyContact: (id: string) => void
  updateItineraryEmail: (tripId: string, email: string) => void

  seedDefaultGear: () => void
}
