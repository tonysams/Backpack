import { useState } from 'react'
import { Plus, Map, Pencil, Trash2, ChevronRight, CheckCircle, Share2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatDate, formatWeight, itemWeight } from '../utils/weight'
import { buildShareUrl } from '../utils/share'
import Modal from '../components/Modal'
import type { Trip } from '../types'

export default function TripsTab() {
  const trips = useStore(s => s.trips)
  const packingLists = useStore(s => s.packingLists)
  const packingListItems = useStore(s => s.packingListItems)
  const gearItems = useStore(s => s.gearItems)
  const activeTripId = useStore(s => s.activeTripId)
  const deleteTrip = useStore(s => s.deleteTrip)
  const setActiveTrip = useStore(s => s.setActiveTrip)

  const [showNew, setShowNew] = useState(false)
  const [detail, setDetail] = useState<Trip | null>(null)
  const [editTrip, setEditTrip] = useState<Trip | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleShare = (trip: Trip) => {
    const list = packingLists.find(l => l.tripId === trip.id)
    const items = packingListItems.filter(i => i.packingListId === list?.id)
    const url = buildShareUrl(trip, items, gearItems)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(trip.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const sorted = [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  const getTripStats = (trip: Trip) => {
    const list = packingLists.find(l => l.tripId === trip.id)
    const items = packingListItems.filter(i => i.packingListId === list?.id)
    return {
      total: items.length,
      packed: items.filter(i => i.isPacked).length,
      weight: items.reduce((s, i) => s + itemWeight(i, gearItems), 0),
    }
  }

  return (
    <div>
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
        <h1 className="text-xl font-bold text-gray-900">My Trips</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors"
        >
          <Plus size={15} /> New Trip
        </button>
      </div>

      <div className="p-4">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Map size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">No trips yet</p>
            <p className="text-sm mt-1">Tap "New Trip" to start planning</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(trip => {
              const stats = getTripStats(trip)
              const isActive = trip.id === activeTripId
              return (
                <div
                  key={trip.id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                    isActive ? 'border-green-300' : 'border-gray-100'
                  }`}
                >
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setDetail(trip)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-semibold text-sm ${isActive ? 'text-green-700' : 'text-gray-800'}`}>
                          {trip.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                        {trip.distance ? ` · ${trip.distance} mi` : ''}
                        {trip.elevation ? ` · ${trip.elevation.toLocaleString()} ft gain` : ''}
                      </p>
                      {stats.total > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {stats.packed}/{stats.total} packed · {formatWeight(stats.weight)}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={15} className="text-gray-300 shrink-0" />
                  </button>

                  <div className="flex border-t border-gray-50">
                    <button
                      onClick={() => setActiveTrip(isActive ? null : trip.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                        isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle size={13} /> {isActive ? 'Active' : 'Set Active'}
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => handleShare(trip)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                        copiedId === trip.id
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <Share2 size={13} />
                      {copiedId === trip.id ? 'Copied!' : 'Share'}
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => setEditTrip(trip)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${trip.name}"? This also removes its packing list.`)) {
                          deleteTrip(trip.id)
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showNew && <TripFormModal title="New Trip" onClose={() => setShowNew(false)} />}
      {editTrip && <TripFormModal title="Edit Trip" trip={editTrip} onClose={() => setEditTrip(null)} />}
      {detail && !editTrip && (
        <TripDetailModal
          trip={detail}
          stats={getTripStats(detail)}
          isActive={detail.id === activeTripId}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditTrip(detail); setDetail(null) }}
          onToggleActive={() => setActiveTrip(detail.id === activeTripId ? null : detail.id)}
        />
      )}
    </div>
  )
}

// ---- Trip Detail Modal ----

function TripDetailModal({
  trip, stats, isActive, onClose, onEdit, onToggleActive,
}: {
  trip: Trip
  stats: { total: number; packed: number; weight: number }
  isActive: boolean
  onClose: () => void
  onEdit: () => void
  onToggleActive: () => void
}) {
  return (
    <Modal title={trip.name} onClose={onClose}>
      <div className="space-y-4">
        <InfoRow label="Dates" value={`${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`} />
        {trip.route && <InfoRow label="Route" value={trip.route} />}
        {trip.distance && <InfoRow label="Distance" value={`${trip.distance} miles`} />}
        {trip.elevation && <InfoRow label="Elevation Gain" value={`${trip.elevation.toLocaleString()} ft`} />}
        {trip.notes && <InfoRow label="Notes" value={trip.notes} />}

        {stats.total > 0 && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Packing</p>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{stats.packed}/{stats.total} packed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{ width: stats.total ? `${(stats.packed / stats.total) * 100}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Weight</span>
              <span className="font-medium">{formatWeight(stats.weight)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => { onToggleActive(); onClose() }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isActive ? 'Deactivate' : 'Set as Active'}
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Edit Trip
          </button>
        </div>
      </div>
    </Modal>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  )
}

// ---- Trip Form Modal (shared New + Edit) ----

function TripFormModal({ title, trip, onClose }: { title: string; trip?: Trip; onClose: () => void }) {
  const createTrip = useStore(s => s.createTrip)
  const updateTrip = useStore(s => s.updateTrip)

  const today = new Date().toISOString().slice(0, 10)
  const threeDays = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)

  const [name, setName] = useState(trip?.name ?? '')
  const [startDate, setStartDate] = useState(trip?.startDate ?? today)
  const [endDate, setEndDate] = useState(trip?.endDate ?? threeDays)
  const [route, setRoute] = useState(trip?.route ?? '')
  const [distance, setDistance] = useState(trip?.distance?.toString() ?? '')
  const [elevation, setElevation] = useState(trip?.elevation?.toString() ?? '')
  const [notes, setNotes] = useState(trip?.notes ?? '')

  const valid = name.trim().length > 0

  const submit = () => {
    if (!valid) return
    const data = {
      name: name.trim(),
      startDate,
      endDate,
      route: route || undefined,
      distance: distance ? parseFloat(distance) : undefined,
      elevation: elevation ? parseFloat(elevation) : undefined,
      notes: notes || undefined,
    }
    if (trip) {
      updateTrip(trip.id, data)
    } else {
      createTrip(data)
    }
    onClose()
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <button
          onClick={submit}
          disabled={!valid}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {trip ? 'Save Changes' : 'Create Trip'}
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Trip Name *">
          <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="High Sierra Loop" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date">
            <input type="date" className={inp} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </Field>
          <Field label="End Date">
            <input type="date" className={inp} value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Route / Trail">
          <input className={inp} value={route} onChange={e => setRoute(e.target.value)} placeholder="John Muir Trail" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Distance (mi)">
            <input type="number" className={inp} value={distance} onChange={e => setDistance(e.target.value)} placeholder="24.5" />
          </Field>
          <Field label="Elevation Gain (ft)">
            <input type="number" className={inp} value={elevation} onChange={e => setElevation(e.target.value)} placeholder="3200" />
          </Field>
        </div>
        <Field label="Notes">
          <textarea className={`${inp} resize-none`} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Permit number, trailhead info..." />
        </Field>
      </div>
    </Modal>
  )
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
