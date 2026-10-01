'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  positionTitle?: string
}

interface Props {
  users: User[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
  placeholder?: string
}

// Fuzzy match: checks if all query letters appear in order in target
function fuzzyMatch(query: string, target: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++
  }
  return qi === q.length
}

export function UserCombobox({ users, selectedIds, onChange, placeholder = 'Search officials…' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => users.filter(u => selectedIds.includes(u.id)), [users, selectedIds])

  const matches = useMemo(() => {
    if (!query.trim()) return users.filter(u => !selectedIds.includes(u.id)).slice(0, 30)
    const q = query.trim()
    return users
      .filter(u => !selectedIds.includes(u.id))
      .filter(u =>
        fuzzyMatch(q, u.name) ||
        fuzzyMatch(q, u.email) ||
        fuzzyMatch(q, u.positionTitle || '')
      )
      .slice(0, 30)
  }, [users, selectedIds, query])

  useEffect(() => { setActiveIdx(0) }, [query, open])

  const add = (id: number) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id])
    setQuery('')
    inputRef.current?.focus()
  }

  const remove = (id: number) => {
    onChange(selectedIds.filter(x => x !== id))
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, matches.length - 1))
      setOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (matches[activeIdx]) add(matches[activeIdx].id)
    } else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1].id)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Keep active item visible
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const item = list.children[activeIdx] as HTMLElement | undefined
    if (item) item.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  return (
    <div className="relative">
      {/* Selected chips + input */}
      <div
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
        className="min-h-[42px] border border-gray-200 rounded-md p-1.5 flex flex-wrap gap-1 cursor-text bg-white focus-within:border-blue-900 focus-within:ring-1 focus-within:ring-blue-900"
      >
        {selected.map(u => (
          <span
            key={u.id}
            className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 text-xs font-medium px-2 py-1 rounded border border-blue-200"
          >
            <span className="max-w-[200px] truncate">{u.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(u.id) }}
              className="hover:text-blue-700"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm px-1 py-1"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">No matches</p>
          ) : (
            <div ref={listRef}>
              {matches.map((u, i) => (
                <button
                  key={u.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); add(u.id) }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 last:border-b-0 ${i === activeIdx ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <p className="font-medium text-gray-900 truncate">{u.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="truncate">{u.email}</span>
                    {u.positionTitle && (
                      <>
                        <span>·</span>
                        <span className="truncate">{u.positionTitle}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
