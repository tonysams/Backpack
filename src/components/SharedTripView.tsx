import { useState } from 'react'
import { Backpack, Calendar, Map, Mountain, FileText, Package, CheckCircle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { parseShareParam, importSharedTrip } from '../utils/share'
import { formatDate, formatWeight } from '../utils/weight'

interface Props {
  encoded: string
  onImported: (tripId: string) => void
}

export default function SharedTripView({ encoded, onImported }: Props) {
  const store = useStore()
  const [imported, setImported] = useState(false)

  const payload = parseShareParam(encoded)

  if (!payload) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8 text-center">
        <Backpack size={48} className="text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-700 mb-2">Invalid Share Link</h1>
        <p className="text-sm text-gray-400">This link appears to be broken or expired.</p>
        <button
          onClick={() => window.location.href = window.location.pathname}
          className="mt-6 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
        >
          Go to App
        </button>
      </div>
    )
  }

  const t = payload.t
  const items = payload.i

  // Group items by category
  const grouped: Record<string, typeof items> = {}
  for (const item of items) {
    if (!grouped[item.c]) grouped[item.c] = []
    grouped[item.c].push(item)
  }
  const groupEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))

  const totalWeight = items.reduce((sum, i) => sum + (i.cw ?? i.w) * i.q, 0)

  const handleImport = () => {
    const newTripId = importSharedTrip(payload, {
      gearItems: store.gearItems,
      addGearItem: store.addGearItem,
      createTrip: store.createTrip,
      addPackingListItem: store.addPackingListItem,
      updatePackingListItem: store.updatePackingListItem,
      getState: () => useStore.getState(),
    })
    setImported(true)
    setTimeout(() => {
      // Strip the share param from the URL, then navigate to the app
      window.history.replaceState({}, '', window.location.pathname)
      onImported(newTripId)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header banner */}
      <div className="bg-green-600 text-white px-4 pt-10 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Backpack size={18} />
            <span className="text-sm font-medium opacity-80">Shared Trip</span>
          </div>
          <h1 className="text-2xl font-bold">{t.n}</h1>
          <p className="text-sm opacity-80 mt-1 flex items-center gap-1.5">
            <Calendar size={13} />
            {formatDate(t.s)} – {formatDate(t.e)}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Trip metadata */}
        {(t.r || t.d || t.el || t.no) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {t.r && (
              <MetaRow icon={<Map size={14} />} label="Route" value={t.r} />
            )}
            {t.d && (
              <MetaRow icon={<Map size={14} />} label="Distance" value={`${t.d} miles`} />
            )}
            {t.el && (
              <MetaRow icon={<Mountain size={14} />} label="Elevation Gain" value={`${t.el.toLocaleString()} ft`} />
            )}
            {t.no && (
              <MetaRow icon={<FileText size={14} />} label="Notes" value={t.no} />
            )}
          </div>
        )}

        {/* Packing list */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
              <Package size={14} />
              Packing List
            </h2>
            <span className="text-xs text-gray-400">
              {items.length} items · {formatWeight(totalWeight)}
            </span>
          </div>

          <div className="space-y-3">
            {groupEntries.map(([cat, catItems]) => (
              <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</span>
                  <span className="text-xs text-gray-400">{catItems.length} items</span>
                </div>
                {catItems.map((item, idx) => {
                  const w = item.cw ?? item.w
                  return (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-800">{item.n}</span>
                        {item.no && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{item.no}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                        {item.q > 1 && <span>×{item.q}</span>}
                        <span className="font-medium text-gray-600">{formatWeight(w * item.q)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Import CTA */}
        <div className="pt-2 pb-8">
          {imported ? (
            <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold py-3.5 rounded-xl">
              <CheckCircle size={18} />
              Trip imported! Opening app…
            </div>
          ) : (
            <button
              onClick={handleImport}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Import Trip to My App
            </button>
          )}
          <p className="text-xs text-gray-400 text-center mt-2">
            Adds this trip and gear items to your library
          </p>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  )
}
