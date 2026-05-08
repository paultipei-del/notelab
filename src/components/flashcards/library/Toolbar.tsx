'use client'

import { useEffect, useRef, useState } from 'react'
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

const VIEW_OPTIONS: Array<{ id: LibraryView; label: string; icon: string }> = [
  { id: 'shelves', label: 'Shelves', icon: '▥' },
  { id: 'cards',   label: 'Cards',   icon: '▦' },
  { id: 'list',    label: 'List',    icon: '≡' },
]

interface PillProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
}
function Pill({ label, count, active, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${s.filterChip} ${active ? s.active : ''}`}
    >
      {label} <span className={s.ct}>{count}</span>
    </button>
  )
}

const SCROLL_THRESHOLD = 4

export default function Toolbar(props: ToolbarProps) {
  const { query, onQuery, view, onView, filters, activeFilterId, onFilter } = props
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const filterScrollRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ canLeft: false, canRight: true })

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        // Whichever input is currently visible (CSS-driven) accepts focus.
        desktopInputRef.current?.focus()
        mobileInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  // Mobile filter-row scroll state — same pattern as the bookshelf rows.
  useEffect(() => {
    const update = () => {
      const el = filterScrollRef.current
      if (!el) return
      setScrollState({
        canLeft: el.scrollLeft > SCROLL_THRESHOLD,
        canRight:
          el.scrollLeft + el.clientWidth < el.scrollWidth - SCROLL_THRESHOLD,
      })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [filters.length])

  const onFilterScroll = () => {
    const el = filterScrollRef.current
    if (!el) return
    setScrollState({
      canLeft: el.scrollLeft > SCROLL_THRESHOLD,
      canRight:
        el.scrollLeft + el.clientWidth < el.scrollWidth - SCROLL_THRESHOLD,
    })
  }

  const status = filters.filter(f => f.group === 'status')
  const tier = filters.filter(f => f.group === 'tier')

  return (
    <>
      {/* ───── Desktop ───── */}
      <div className={s.desktopOnly}>
        <div className={s.toolbar}>
          <label className={s.search}>
            <span className={s.searchIcon} aria-hidden="true" />
            <input
              ref={desktopInputRef}
              value={query}
              onChange={e => onQuery(e.target.value)}
              placeholder="Search the library — terms, symbols, sets…"
            />
            <kbd>⌘K</kbd>
          </label>
          <div className={s.viewToggle}>
            {VIEW_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                className={view === opt.id ? s.active : ''}
                onClick={() => onView(opt.id)}
              >
                <span className={s.viewToggleIc}>{opt.icon}</span>{opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${s.toolbar} ${s.toolbarTight}`}>
          {status.map(f => (
            <Pill
              key={f.id}
              label={f.label}
              count={f.count}
              active={activeFilterId === f.id}
              onClick={() => onFilter(f.id)}
            />
          ))}
          {tier.length > 0 && <span className={s.filterDivider} aria-hidden="true" />}
          {tier.map(f => (
            <Pill
              key={f.id}
              label={f.label}
              count={f.count}
              active={activeFilterId === f.id}
              onClick={() => onFilter(f.id)}
            />
          ))}
        </div>
      </div>

      {/* ───── Mobile ───── */}
      <div className={s.mobileOnly}>
        <div className={s.mobileSearchRow}>
          <label className={s.searchMobile}>
            <span className={s.searchIcon} aria-hidden="true" />
            <input
              ref={mobileInputRef}
              value={query}
              onChange={e => onQuery(e.target.value)}
              placeholder="Search the library — terms, symbols, sets…"
            />
          </label>
        </div>

        <div className={s.mobileViewRow}>
          <div className={s.mobileViewToggle}>
            {VIEW_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                className={view === opt.id ? s.active : ''}
                onClick={() => onView(opt.id)}
              >
                <span className={s.viewToggleIc}>{opt.icon}</span>{opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={s.mobileFilterScrollWrap}>
          <div
            ref={filterScrollRef}
            onScroll={onFilterScroll}
            className={s.mobileFilterScroll}
          >
            <div className={s.mobileFilterRow}>
              {status.map(f => (
                <Pill
                  key={f.id}
                  label={f.label}
                  count={f.count}
                  active={activeFilterId === f.id}
                  onClick={() => onFilter(f.id)}
                />
              ))}
              {tier.length > 0 && <span className={s.filterDivider} aria-hidden="true" />}
              {tier.map(f => (
                <Pill
                  key={f.id}
                  label={f.label}
                  count={f.count}
                  active={activeFilterId === f.id}
                  onClick={() => onFilter(f.id)}
                />
              ))}
            </div>
          </div>
          {scrollState.canLeft && (
            <div className={`${s.filterEdgeFade} ${s.filterEdgeFadeLeft}`} aria-hidden="true" />
          )}
          {scrollState.canRight && (
            <div className={`${s.filterEdgeFade} ${s.filterEdgeFadeRight}`} aria-hidden="true" />
          )}
        </div>
      </div>
    </>
  )
}
