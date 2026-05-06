'use client'

import { useEffect, useRef } from 'react'
import s from './library.module.css'

export type LibraryView = 'shelves' | 'cards' | 'list'

export interface FilterChipDef {
  id: string
  label: string
  count: number
  group: 'status' | 'tier'
}

export interface ToolbarProps {
  query: string
  onQuery: (q: string) => void
  view: LibraryView
  onView: (v: LibraryView) => void
  filters: FilterChipDef[]
  activeFilterId: string
  onFilter: (id: string) => void
}

export default function Toolbar(props: ToolbarProps) {
  const { query, onQuery, view, onView, filters, activeFilterId, onFilter } = props
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  const status = filters.filter(f => f.group === 'status')
  const tier = filters.filter(f => f.group === 'tier')

  return (
    <>
      <div className={s.toolbar}>
        <label className={s.search}>
          <span className={s.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder="Search the library — terms, symbols, sets…"
          />
          <kbd>⌘K</kbd>
        </label>
        <div className={s.viewToggle}>
          <button
            type="button"
            className={view === 'shelves' ? s.active : ''}
            onClick={() => onView('shelves')}
          >
            <span className={s.viewToggleIc}>▥</span>Shelves
          </button>
          <button
            type="button"
            className={view === 'cards' ? s.active : ''}
            onClick={() => onView('cards')}
          >
            <span className={s.viewToggleIc}>▦</span>Cards
          </button>
          <button
            type="button"
            className={view === 'list' ? s.active : ''}
            onClick={() => onView('list')}
          >
            <span className={s.viewToggleIc}>≡</span>List
          </button>
        </div>
      </div>

      <div className={`${s.toolbar} ${s.toolbarTight}`}>
        {status.map(f => (
          <button
            key={f.id}
            type="button"
            className={`${s.filterChip} ${activeFilterId === f.id ? s.active : ''}`}
            onClick={() => onFilter(f.id)}
          >
            {f.label} <span className={s.ct}>{f.count}</span>
          </button>
        ))}
        {tier.length > 0 && <span className={s.filterDivider} aria-hidden="true" />}
        {tier.map(f => (
          <button
            key={f.id}
            type="button"
            className={`${s.filterChip} ${activeFilterId === f.id ? s.active : ''}`}
            onClick={() => onFilter(f.id)}
          >
            {f.label} <span className={s.ct}>{f.count}</span>
          </button>
        ))}
      </div>
    </>
  )
}
