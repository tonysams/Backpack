import { useState } from 'react'
import { Plus, Mountain, ChevronRight, Info } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatDate, formatWeight, itemWeight } from '../utils/weight'
import Modal from '../components/Modal'
import type { Trip } from '../types'
import type { Tab } from '../App'

interface Props {
  onNavigate: (tab: Tab) => void
}

export default function OverviewTab({ onNavigate }: Props) {
  const trips = useStore(s => s.trips)
  const packingLists = useStore(s => s.packingLists)
  const packingListItems = useStore(s => s.packingListItems)
  const gearItems = useStore(s => s.gearItems)
  const activeTripId = useStore(s => s.activeTripId)
  const setActiveTrip = useStore(s => s.setActiveTrip)
  const createTrip = useStore(s => s.createTrip)

  const [showNewTrip, setShowNewTrip] = useState(false)

  const activeTrip = trips.find(t => t.id === activeTripId)
  const activeList = packingLists.find(l => l.tripId === activeTripId)
  const activeItems = packingListItems.filter(i => i.packingListId === activeList?.id)
  const totalWeight = activeItems.reduce((s, i) => s + itemWeight(i, gearItems), 0)
  const packedCount = activeItems.filter(i => i.isPacked).length
  const progress = activeItems.length > 0 ? packedCount / activeItems.length : 0

  const sorted = [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Overview</h1>
          <p className="text-xs text-gray-400">Backpacking Companion</p>
        </div>
        <button
          onClick={() => setShowNewTrip(true)}
          className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors"
        >
          <Plus size={15} /> New Trip
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Active trip card */}
        {activeTrip && activeList ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 px-5 py-4 text-white">
              <p className="text-green-200 text-xs font-medium uppercase tracking-wide mb-1">Active Trip</p>
              <h2 className="text-xl font-bold">{activeTrip.name}</h2>
              {activeTrip.startDate && (
                <p className="text-green-100 text-sm mt-0.5">
                  {formatDate(activeTrip.startDate)} – {formatDate(activeTrip.endDate)}
                </p>
              )}
              {activeTrip.route && (
                <p className="text-green-100 text-sm mt-0.5 flex items-center gap-1">
                  <Mountain size={13} /> {activeTrip.route}
                </p>
              )}
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Packing Progress</span>
                <span className="font-semibold text-gray-700">{packedCount}/{activeItems.length} items</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{formatWeight(totalWeight)} total</span>
                <span className="font-semibold text-green-600">{Math.round(progress * 100)}% packed</span>
              </div>
              <button
                onClick={() => onNavigate('packing')}
                className="w-full mt-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                Open Packing List →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
            <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <span>Tap a trip below to set it as active, or create a new one.</span>
          </div>
        )}

        {/* Trip list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Trips</h2>

          {sorted.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Mountain size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No trips yet</p>
              <p className="text-sm mt-1">Tap "New Trip" to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map(trip => {
                const isActive = trip.id === activeTripId
                return (
                  <button
                    key={trip.id}
                    onClick={() => setActiveTrip(isActive ? null : trip.id)}
                    className={`w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border transition-all text-left ${
                      isActive ? 'border-green-400 ring-1 ring-green-300' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? 'bg-green-500' : 'bg-gray-200'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm ${isActive ? 'text-green-700' : 'text-gray-800'}`}>
                          {trip.name}
                        </p>
                        {isActive && (
                          <span className="text-[10px] bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                        {trip.distance ? ` · ${trip.distance} mi` : ''}
                      </p>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showNewTrip && <NewTripModal onClose={() => setShowNewTrip(false)} createTrip={createTrip} />}
    </div>
  )
}

// ---- New Trip Modal ----

interface NewTripProps {
  onClose: () => void
  createTrip: (data: Omit<Trip, 'id' | 'packingListId' | 'createdDate'>) => void
}

function NewTripModal({ onClose, createTrip }: NewTripProps) {
  const today = new Date().toISOString().slice(0, 10)
  const threeDays = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(threeDays)
  const [route, setRoute] = useState('')
  const [distance, setDistance] = useState('')
  const [elevation, setElevation] = useState('')
  const [notes, setNotes] = useState('')

  const valid = name.trim().length > 0

  const submit = () => {
    if (!valid) return
    createTrip({
      name: name.trim(),
      startDate,
      endDate,
      route: route || undefined,
      distance: distance ? parseFloat(distance) : undefined,
      elevation: elevation ? parseFloat(elevation) : undefined,
      notes: notes || undefined,
    })
    onClose()
  }

  return (
    <Modal
      title="New Trip"
      onClose={onClose}
      footer={
        <button
          onClick={submit}
          disabled={!valid}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Create Trip
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Trip Name *">
          <input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="High Sierra Loop" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date">
            <input type="date" className={input} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </Field>
          <Field label="End Date">
            <input type="date" className={input} value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Route / Trail">
          <input className={input} value={route} onChange={e => setRoute(e.target.value)} placeholder="John Muir Trail" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Distance (miles)">
            <input type="number" className={input} value={distance} onChange={e => setDistance(e.target.value)} placeholder="24.5" />
          </Field>
          <Field label="Elevation Gain (ft)">
            <input type="number" className={input} value={elevation} onChange={e => setElevation(e.target.value)} placeholder="3200" />
          </Field>
        </div>
        <Field label="Notes">
          <textarea className={`${input} resize-none`} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Permit number, trailhead info..." />
        </Field>
      </div>
    </Modal>
  )
}

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
