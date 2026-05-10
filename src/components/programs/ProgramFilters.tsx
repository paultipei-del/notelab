'use client'

import { CATEGORY_META, FILTER_ORDER, type ProgramCategory } from '@/lib/programsCatalog'

interface ProgramFiltersProps {
  /** 'all' or one of the categories. Currently controlled by parent
   *  but parent doesn't change it — the row is decorative for v1. */
  active: ProgramCategory | 'all'
  /** Per-chip count, displayed as a small numeral suffix. */
  counts: Record<ProgramCategory | 'all', number>
  /** Click handler — currently a no-op but wired for future use. */
  onChange?: (next: ProgramCategory | 'all') => void
}

const ALL_LABEL = 'All'

/**
 * Filter chip row. Pill buttons; italic Cormorant inactive, dark-ink
 * upright Cormorant active. Mobile container is `display: flex;
 * overflow-x: auto` so chips scroll horizontally instead of wrapping
 * — matches the same pattern as the /learn MobileJumpNav.
 *
 * v1: filter state is rendered but not applied — the click handler is
 * optional. Active is hardcoded by the parent to 'all'.
 */
export default function ProgramFilters({ active, counts, onChange }: ProgramFiltersProps) {
  return (
    <nav className="nl-program-filters" aria-label="Filter programs">
      {FILTER_ORDER.map(key => {
        const label = key === 'all' ? ALL_LABEL : CATEGORY_META[key].label
        const count = counts[key] ?? 0
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            className={`nl-program-filter ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange?.(key)}
            aria-pressed={isActive}
          >
            {label}
            <span className="nl-program-filter__count">{count}</span>
          </button>
        )
      })}
    </nav>
  )
}
