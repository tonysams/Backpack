import { useEffect, useRef, useState } from 'react'
import { formatWeight, lbsToLbOz, lbOzToLbs } from '../utils/weight'

interface Props {
  value: number      // stored as decimal lbs
  onSave: (newLbs: number) => void
  dimmed?: boolean
  isCustom?: boolean // orange tint when a per-trip override is active
}

export default function InlineWeightEdit({ value, onSave, dimmed, isCustom }: Props) {
  const [editing, setEditing] = useState(false)
  const [lbs, setLbs] = useState(0)
  const [oz, setOz] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const lbsRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      const { pounds, ounces } = lbsToLbOz(value)
      setLbs(pounds)
      setOz(ounces)
      setTimeout(() => { lbsRef.current?.select() }, 0)
    }
  }, [editing, value])

  const commit = () => {
    onSave(lbOzToLbs(Math.max(0, lbs), Math.min(15.9, Math.max(0, oz))))
    setEditing(false)
  }

  const cancel = () => setEditing(false)

  // Only commit when focus leaves the ENTIRE component, not when
  // tabbing between the two inputs inside it.
  const handleContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    commit()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  { e.preventDefault(); commit() }
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
  }

  if (editing) {
    return (
      <div
        ref={containerRef}
        onBlur={handleContainerBlur}
        onKeyDown={handleKey}
        className="flex items-center gap-1 shrink-0"
      >
        <input
          ref={lbsRef}
          type="number"
          min="0"
          step="1"
          value={lbs}
          onChange={e => setLbs(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-10 text-right text-sm border border-green-400 rounded-md px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-green-300 tabular-nums bg-white shadow-sm"
        />
        <span className="text-xs text-gray-400">lb</span>
        <input
          type="number"
          min="0"
          max="15.9"
          step="0.1"
          value={oz}
          onChange={e => setOz(Math.min(15.9, Math.max(0, parseFloat(e.target.value) || 0)))}
          className="w-12 text-right text-sm border border-green-400 rounded-md px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-green-300 tabular-nums bg-white shadow-sm"
        />
        <span className="text-xs text-gray-400">oz</span>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to edit weight"
      className={`text-sm font-medium tabular-nums rounded px-1 py-0.5 transition-colors group shrink-0 ${
        dimmed
          ? 'text-gray-300 hover:text-green-500 hover:bg-green-50'
          : isCustom
          ? 'text-orange-400 hover:text-orange-500 hover:bg-orange-50'
          : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
      }`}
    >
      {formatWeight(value)}
      <span className="ml-0.5 opacity-0 group-hover:opacity-40 text-[10px] transition-opacity">✎</span>
    </button>
  )
}
