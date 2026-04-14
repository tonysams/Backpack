import { useMemo, useState } from 'react'
import { Plus, Search, X, Pencil, Trash2, Backpack } from 'lucide-react'
import { useStore } from '../store/useStore'
import Modal from '../components/Modal'
import InlineWeightEdit from '../components/InlineWeightEdit'
import InlineTextEdit from '../components/InlineTextEdit'
import type { GearItem } from '../types'

const STANDARD_CATEGORIES = [
  'The Basics', 'Clothing', 'Cooking System', 'Water',
  'Safety & Navigation', 'Hygiene', 'Food', 'Electronics', 'Other',
]

export default function GearTab() {
  const gearItems = useStore(s => s.gearItems)
  const deleteGearItem = useStore(s => s.deleteGearItem)
  const updateGearItem = useStore(s => s.updateGearItem)

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<GearItem | null>(null)

  const categories = useMemo(() => {
    return Array.from(new Set(gearItems.map(g => g.category))).sort()
  }, [gearItems])

  const filtered = useMemo(() => {
    return gearItems.filter(g => {
      const matchesCat = !catFilter || g.category === catFilter
      const matchesSearch = !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.category.toLowerCase().includes(search.toLowerCase()) ||
        (g.notes ?? '').toLowerCase().includes(search.toLowerCase())
      return matchesCat && matchesSearch
    })
  }, [gearItems, catFilter, search])

  const grouped = useMemo(() => {
    const map: Record<string, GearItem[]> = {}
    for (const g of filtered) {
      if (!map[g.category]) map[g.category] = []
      map[g.category].push(g)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gear Library</h1>
            <p className="text-xs text-gray-400">{gearItems.length} items</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors"
          >
            <Plus size={15} /> Add Gear
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              placeholder="Search gear..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
          <Chip label={`All (${gearItems.length})`} active={catFilter === null} onClick={() => setCatFilter(null)} />
          {categories.map(cat => {
            const count = gearItems.filter(g => g.category === cat).length
            return (
              <Chip
                key={cat}
                label={`${cat} (${count})`}
                active={catFilter === cat}
                onClick={() => setCatFilter(catFilter === cat ? null : cat)}
              />
            )
          })}
        </div>
      </div>

      {/* Items */}
      <div className="pb-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Backpack size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">
              {search ? `No results for "${search}"` : 'No gear items yet'}
            </p>
          </div>
        ) : (
          grouped.map(([cat, items]) => (
            <div key={cat}>
              <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</span>
                <span className="text-xs text-gray-400">{items.length} items</span>
              </div>
              {items.map(gear => (
                <div key={gear.id} className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-50">
                  <div className="flex-1 min-w-0">
                    <InlineTextEdit
                      value={gear.name}
                      onSave={name => updateGearItem(gear.id, { name })}
                      className="text-sm font-medium text-gray-800"
                    />
                    {gear.notes && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{gear.notes}</p>
                    )}
                  </div>
                  <InlineWeightEdit
                    value={gear.weight}
                    onSave={w => updateGearItem(gear.id, { weight: w })}
                  />
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditItem(gear)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${gear.name}" from your library?`)) {
                          deleteGearItem(gear.id)
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {showAdd && <GearFormModal title="Add Gear Item" onClose={() => setShowAdd(false)} />}
      {editItem && <GearFormModal title="Edit Gear Item" gear={editItem} onClose={() => setEditItem(null)} />}
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

// ---- Gear Form Modal ----

function GearFormModal({ title, gear, onClose }: { title: string; gear?: GearItem; onClose: () => void }) {
  const addGearItem = useStore(s => s.addGearItem)
  const updateGearItem = useStore(s => s.updateGearItem)

  const [name, setName] = useState(gear?.name ?? '')
  const [category, setCategory] = useState(gear?.category ?? 'The Basics')
  const [customCat, setCustomCat] = useState('')
  const [weight, setWeight] = useState(gear?.weight?.toString() ?? '')
  const [notes, setNotes] = useState(gear?.notes ?? '')

  const effectiveCat = category === 'Other' && customCat.trim() ? customCat.trim() : category
  const valid = name.trim().length > 0 && weight.trim().length > 0

  const submit = () => {
    if (!valid) return
    const data = {
      name: name.trim(),
      category: effectiveCat,
      weight: parseFloat(weight),
      notes: notes.trim() || undefined,
    }
    if (gear) {
      updateGearItem(gear.id, data)
    } else {
      addGearItem(data)
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
          {gear ? 'Save Changes' : 'Add to Library'}
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Item Name *">
          <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Sleeping Bag (20°F)" />
        </Field>

        <Field label="Category">
          <select className={inp} value={category} onChange={e => setCategory(e.target.value)}>
            {STANDARD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            {gear?.category && !STANDARD_CATEGORIES.includes(gear.category) && (
              <option value={gear.category}>{gear.category}</option>
            )}
          </select>
        </Field>

        {category === 'Other' && (
          <Field label="Custom Category Name">
            <input className={inp} value={customCat} onChange={e => setCustomCat(e.target.value)} placeholder="My Custom Category" />
          </Field>
        )}

        <Field label="Weight (lbs) *">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              className={`${inp} flex-1`}
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="0.00"
            />
            <span className="text-sm text-gray-400 shrink-0">lbs</span>
          </div>
        </Field>

        <Field label="Notes (optional)">
          <input className={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Description, size, brand..." />
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
