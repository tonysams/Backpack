import { useMemo, useState } from 'react'
import { Plus, CheckCircle2, Circle, Pencil, Trash2, Search, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { itemWeight, formatWeight, lbOzToLbs } from '../utils/weight'
import Modal from '../components/Modal'
import InlineWeightEdit from '../components/InlineWeightEdit'
import InlineTextEdit from '../components/InlineTextEdit'
import type { PackingListItem, GearItem } from '../types'

export default function PackingTab() {
  const trips = useStore(s => s.trips)
  const packingLists = useStore(s => s.packingLists)
  const packingListItems = useStore(s => s.packingListItems)
  const gearItems = useStore(s => s.gearItems)
  const activeTripId = useStore(s => s.activeTripId)
  const togglePacked = useStore(s => s.togglePacked)
  const deletePackingListItem = useStore(s => s.deletePackingListItem)

  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<PackingListItem | null>(null)

  const activeTrip = trips.find(t => t.id === activeTripId)
  const activeList = packingLists.find(l => l.tripId === activeTripId)
  const items = useMemo(
    () => packingListItems
      .filter(i => i.packingListId === activeList?.id)
      .sort((a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()),
    [packingListItems, activeList]
  )

  const totalWeight = useMemo(() => items.reduce((s, i) => s + itemWeight(i, gearItems), 0), [items, gearItems])
  const packedCount = items.filter(i => i.isPacked).length
  const progress = items.length > 0 ? packedCount / items.length : 0

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => gearItems.find(g => g.id === i.gearItemId)?.category ?? 'Other'))
    return Array.from(cats).sort()
  }, [items, gearItems])

  const filtered = catFilter ? items.filter(i => (gearItems.find(g => g.id === i.gearItemId)?.category ?? 'Other') === catFilter) : items

  const grouped = useMemo(() => {
    const map: Record<string, PackingListItem[]> = {}
    for (const item of filtered) {
      const cat = gearItems.find(g => g.id === item.gearItemId)?.category ?? 'Other'
      if (!map[cat]) map[cat] = []
      map[cat].push(item)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered, gearItems])

  if (!activeTrip) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-8 text-gray-400">
        <CheckCircle2 size={52} className="mb-4 opacity-20" />
        <p className="font-semibold text-gray-500 text-lg">No active trip</p>
        <p className="text-sm mt-1">Select a trip from the Overview tab to see your packing list.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Packing List</h1>
            <p className="text-xs text-gray-400 truncate max-w-[200px]">{activeTrip.name}</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors"
          >
            <Plus size={15} /> Add Item
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50">
          {[
            { label: 'Packed', value: `${packedCount}/${items.length}` },
            { label: 'Weight', value: formatWeight(totalWeight) },
            { label: 'Progress', value: `${Math.round(progress * 100)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="py-2 text-center">
              <p className="text-sm font-bold text-gray-800">{value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-green-500 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none bg-white">
            <Chip label="All" active={catFilter === null} onClick={() => setCatFilter(null)} />
            {categories.map(cat => (
              <Chip key={cat} label={cat} active={catFilter === cat} onClick={() => setCatFilter(catFilter === cat ? null : cat)} />
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="pb-4">
        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle2 size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">No items yet</p>
            <p className="text-sm mt-1">Tap "Add Item" to add from your gear library</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No items in this category</div>
        ) : (
          grouped.map(([cat, catItems]) => (
            <div key={cat}>
              <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</span>
                <span className="text-xs text-gray-400">
                  {formatWeight(catItems.reduce((s, i) => s + itemWeight(i, gearItems), 0))}
                </span>
              </div>
              {catItems.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  gear={gearItems.find(g => g.id === item.gearItemId)}
                  onToggle={() => togglePacked(item.id)}
                  onEdit={() => setEditItem(item)}
                  onDelete={() => deletePackingListItem(item.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {showAdd && activeList && (
        <AddItemModal packingListId={activeList.id} onClose={() => setShowAdd(false)} />
      )}
      {editItem && (
        <EditItemModal item={editItem} onClose={() => setEditItem(null)} />
      )}
    </div>
  )
}

// ---- Item Row ----

function ItemRow({
  item, gear, onToggle, onEdit, onDelete,
}: {
  item: PackingListItem
  gear?: GearItem
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const gearItems = useStore(s => s.gearItems)
  const updatePackingListItem = useStore(s => s.updatePackingListItem)
  const updateGearItem = useStore(s => s.updateGearItem)
  const baseWeight = gear?.weight ?? 0
  const displayWeight = item.customWeight ?? baseWeight

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 ${item.isPacked ? 'bg-gray-50/50' : 'bg-white'}`}>
      <button onClick={onToggle} className="shrink-0 transition-transform active:scale-90">
        {item.isPacked
          ? <CheckCircle2 size={22} className="text-green-500" />
          : <Circle size={22} className="text-gray-300" />
        }
      </button>

      <div className="flex-1 min-w-0">
        {gear ? (
          <InlineTextEdit
            value={gear.name}
            onSave={name => updateGearItem(gear.id, { name })}
            className={`text-sm font-medium ${item.isPacked ? 'line-through text-gray-400' : 'text-gray-800'}`}
          />
        ) : (
          <span className="text-sm font-medium text-gray-400">Unknown Item</span>
        )}
        <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
          {item.quantity > 1 && <span>×{item.quantity}</span>}
          {item.customWeight != null && (
            <button
              onClick={() => updatePackingListItem(item.id, { customWeight: undefined })}
              className="text-orange-400 hover:text-orange-600 hover:underline transition-colors"
              title="Click to clear custom weight"
            >
              custom wt ×
            </button>
          )}
        </div>
      </div>

      {/* Clicking the weight sets a per-trip custom override */}
      <InlineWeightEdit
        value={displayWeight}
        onSave={w => updatePackingListItem(item.id, { customWeight: w !== baseWeight ? w : undefined })}
        dimmed={item.isPacked}
        isCustom={item.customWeight != null}
      />

      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ---- Filter Chip ----

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

// ---- Add Item Modal ----

const STANDARD_CATEGORIES = [
  'The Basics', 'Clothing', 'Cooking System', 'Water',
  'Safety & Navigation', 'Hygiene', 'Food', 'Electronics', 'Other',
]

function AddItemModal({ packingListId, onClose }: { packingListId: string; onClose: () => void }) {
  const gearItems = useStore(s => s.gearItems)
  const addPackingListItem = useStore(s => s.addPackingListItem)
  const addGearItem = useStore(s => s.addGearItem)
  const packingListItems = useStore(s => s.packingListItems)

  const [mode, setMode] = useState<'library' | 'new'>('library')

  // ---- Library mode state ----
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  // ---- New item mode state ----
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('The Basics')
  const [newLbs, setNewLbs] = useState(0)
  const [newOz, setNewOz] = useState(0)
  const [newNotes, setNewNotes] = useState('')
  const [newQty, setNewQty] = useState(1)

  const alreadyAdded = new Set(
    packingListItems.filter(i => i.packingListId === packingListId).map(i => i.gearItemId)
  )

  const filtered = gearItems.filter(g =>
    !alreadyAdded.has(g.id) &&
    (search === '' ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.category.toLowerCase().includes(search.toLowerCase()))
  )

  const grouped = filtered.reduce((acc, g) => {
    if (!acc[g.category]) acc[g.category] = []
    acc[g.category].push(g)
    return acc
  }, {} as Record<string, GearItem[]>)

  const submitLibrary = () => {
    if (!selected) return
    addPackingListItem(packingListId, selected, quantity)
    onClose()
  }

  const submitNew = () => {
    if (!newName.trim()) return
    const weightLbs = lbOzToLbs(Math.max(0, newLbs), Math.min(15.9, Math.max(0, newOz)))
    // Add to library first, then add to packing list
    // We need the new ID — generate it here so we can use it immediately
    const id = crypto.randomUUID()
    addGearItem({ name: newName.trim(), category: newCategory, weight: weightLbs, notes: newNotes.trim() || undefined })
    // The store generates its own ID, so fetch the just-added item by name+createdDate
    // Simpler: use addPackingListItem after a tick so the store has it
    setTimeout(() => {
      const fresh = useStore.getState().gearItems.find(g => g.name === newName.trim() && g.category === newCategory)
      if (fresh) addPackingListItem(packingListId, fresh.id, newQty)
      onClose()
    }, 0)
  }

  const newValid = newName.trim().length > 0

  return (
    <Modal
      title="Add Item"
      onClose={onClose}
      footer={
        mode === 'library' ? (
          <button
            onClick={submitLibrary}
            disabled={!selected}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {selected ? 'Add to Packing List' : 'Select an item above'}
          </button>
        ) : (
          <button
            onClick={submitNew}
            disabled={!newValid}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Create & Add to List
          </button>
        )
      }
    >
      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setMode('library')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'library' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          From Library
        </button>
        <button
          onClick={() => setMode('new')}
          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'new' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Create New
        </button>
      </div>

      {mode === 'library' ? (
        <div className="space-y-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              placeholder="Search gear..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}><X size={14} className="text-gray-400" /></button>}
          </div>

          {/* Selected item + quantity */}
          {selected && (
            <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2.5">
              <span className="text-sm font-medium text-green-800 truncate mr-3">
                {gearItems.find(g => g.id === selected)?.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-full bg-white border border-green-200 text-green-700 flex items-center justify-center font-bold"
                >−</button>
                <span className="text-sm font-semibold text-green-800 w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(99, q + 1))}
                  className="w-7 h-7 rounded-full bg-white border border-green-200 text-green-700 flex items-center justify-center font-bold"
                >+</button>
              </div>
            </div>
          )}

          {/* Gear list */}
          <div className="space-y-3">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{cat}</p>
                <div className="space-y-1">
                  {items.map(gear => (
                    <button
                      key={gear.id}
                      onClick={() => setSelected(selected === gear.id ? null : gear.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                        selected === gear.id
                          ? 'bg-green-50 border border-green-300'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <span className="text-sm text-gray-800">{gear.name}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{formatWeight(gear.weight)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">
                {search ? `No gear matching "${search}"` : 'All library items already added'}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ---- Create new item form ---- */
        <div className="space-y-4">
          <AddField label="Item Name *">
            <input
              className={inp}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Trekking poles"
              autoFocus
            />
          </AddField>

          <AddField label="Category">
            <select className={inp} value={newCategory} onChange={e => setNewCategory(e.target.value)}>
              {STANDARD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </AddField>

          <AddField label="Weight">
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" step="1"
                className={`${inp} w-20 text-right`}
                value={newLbs}
                onChange={e => setNewLbs(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="text-sm text-gray-400">lb</span>
              <input
                type="number" min="0" max="15.9" step="0.1"
                className={`${inp} w-20 text-right`}
                value={newOz}
                onChange={e => setNewOz(Math.min(15.9, Math.max(0, parseFloat(e.target.value) || 0)))}
              />
              <span className="text-sm text-gray-400">oz</span>
            </div>
          </AddField>

          <AddField label="Notes (optional)">
            <input
              className={inp}
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="Brand, size, description..."
            />
          </AddField>

          <AddField label="Quantity">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNewQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold transition-colors"
              >−</button>
              <span className="text-sm font-semibold w-4 text-center">{newQty}</span>
              <button
                onClick={() => setNewQty(q => Math.min(99, q + 1))}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold transition-colors"
              >+</button>
            </div>
          </AddField>
        </div>
      )}
    </Modal>
  )
}

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50'

function AddField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ---- Edit Item Modal ----

function EditItemModal({ item, onClose }: { item: PackingListItem; onClose: () => void }) {
  const gearItems = useStore(s => s.gearItems)
  const updatePackingListItem = useStore(s => s.updatePackingListItem)
  const gear = gearItems.find(g => g.id === item.gearItemId)

  const [quantity, setQuantity] = useState(item.quantity)
  const [useCustom, setUseCustom] = useState(item.customWeight != null)
  const [customWeight, setCustomWeight] = useState(item.customWeight?.toString() ?? '')

  const effectiveWeight = (useCustom ? parseFloat(customWeight) || 0 : gear?.weight ?? 0) * quantity

  const save = () => {
    updatePackingListItem(item.id, {
      quantity,
      customWeight: useCustom && customWeight ? parseFloat(customWeight) : undefined,
    })
    onClose()
  }

  return (
    <Modal
      title="Edit Item"
      onClose={onClose}
      footer={
        <button onClick={save} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors">
          Save Changes
        </button>
      }
    >
      <div className="space-y-5">
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="font-medium text-gray-800">{gear?.name ?? 'Unknown Item'}</p>
          <p className="text-sm text-gray-400">{gear?.category} · Library weight: {formatWeight(gear?.weight ?? 0)}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Quantity</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xl font-bold transition-colors"
            >−</button>
            <span className="text-xl font-semibold text-gray-800 w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => Math.min(99, q + 1))}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xl font-bold transition-colors"
            >+</button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500">Custom Weight Override</label>
            <button
              onClick={() => setUseCustom(c => !c)}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${useCustom ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useCustom ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {useCustom && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
                value={customWeight}
                onChange={e => setCustomWeight(e.target.value)}
                placeholder="0.0"
              />
              <span className="text-sm text-gray-400">lbs</span>
            </div>
          )}
        </div>

        <div className="bg-green-50 rounded-xl px-4 py-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700">Calculated total weight</span>
            <span className="font-bold text-green-800">{formatWeight(effectiveWeight)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
