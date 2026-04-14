import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onSave: (newValue: string) => void
  className?: string
  placeholder?: string
}

export default function InlineTextEdit({ value, onSave, className = '', placeholder }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value)
      setTimeout(() => { inputRef.current?.select() }, 0)
    }
  }, [editing, value])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed.length > 0) onSave(trimmed)
    setEditing(false)
  }

  const cancel = () => setEditing(false)

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter')  { e.preventDefault(); commit() }
          if (e.key === 'Escape') { e.preventDefault(); cancel() }
        }}
        placeholder={placeholder}
        className={`bg-white border border-green-400 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-green-300 min-w-0 w-full ${className}`}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to rename"
      className={`text-left truncate group hover:text-green-700 transition-colors ${className}`}
    >
      {value}
      <span className="ml-1 opacity-0 group-hover:opacity-30 text-[10px] transition-opacity">✎</span>
    </button>
  )
}
