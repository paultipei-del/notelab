'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import {
  PROGRAMS_CATALOG,
  FILTER_ORDER,
  type ProgramCategory,
  type ProgramEntry,
} from '@/lib/programsCatalog'
import ProgramsHero from '@/components/programs/ProgramsHero'
import FeaturedProgramCard from '@/components/programs/FeaturedProgramCard'
import ProgramCard from '@/components/programs/ProgramCard'
import PlaceholderCard from '@/components/programs/PlaceholderCard'
import ProgramFilters from '@/components/programs/ProgramFilters'

/**
 * Derive the right-side status pill for a program (CTA-equivalent
 * info: ownership, free, or starting price). Owner-aware via
 * usePurchases, falls back to the catalog's `priceFrom`.
 */
function deriveStatus(
  program: ProgramEntry,
  hasSubscription: () => boolean,
  hasPurchased: (priceId: string) => boolean,
): { statusLabel: string; statusVariant: 'owned' | 'free' | 'price' | 'new' } {
  if (program.free) {
    return { statusLabel: 'Free', statusVariant: 'free' }
  }
  const owned =
    hasSubscription() || (program.priceId ? hasPurchased(program.priceId) : false)
  if (owned) {
    return { statusLabel: '✓ Owned', statusVariant: 'owned' }
  }
  return { statusLabel: program.priceFrom ?? 'View', statusVariant: 'price' }
}

export default function ProgramsPage() {
  const { user } = useAuth()
  const { hasPurchased, hasSubscription } = usePurchases(user?.id ?? null)

  // v1: filter state lives here but doesn't filter — chips render
  // pressed/unpressed and "All" stays the active default. Hooked up
  // for the follow-up that wires actual filtering.
  const [activeFilter, setActiveFilter] = useState<ProgramCategory | 'all'>('all')

  // Featured (CM) renders in its own slot above the grid; everything
  // else (programs + placeholders) flows into the 2-col grid.
  const featured = useMemo(
    () =>
      PROGRAMS_CATALOG.find(
        (e): e is ProgramEntry => e.kind === 'program' && !!e.featured,
      ),
    [],
  )
  const gridEntries = useMemo(
    () => PROGRAMS_CATALOG.filter(e => e.kind !== 'program' || !e.featured),
    [],
  )

  // Counts per filter chip — total catalog count split by category.
  // Placeholders don't have a category and are excluded from category
  // counts, but counted in "All" so the All chip shows the full
  // visible-tile count.
  const counts = useMemo(() => {
    const c: Record<ProgramCategory | 'all', number> = {
      all: 0,
      foundation: 0,
      reading: 0,
      theory: 0,
      aural: 0,
    }
    for (const entry of PROGRAMS_CATALOG) {
      c.all += 1
      if (entry.kind === 'program') {
        c[entry.category] += 1
      }
    }
    return c
  }, [])

  // Touch FILTER_ORDER so the import isn't unused — type-only use.
  void FILTER_ORDER

  return (
    <div className="nl-program-page">
      <ProgramsHero />

      {featured && (
        <FeaturedProgramCard
          program={featured}
          {...deriveStatus(featured, hasSubscription, hasPurchased)}
        />
      )}

      <div className="nl-program-section-header">
        <h2 className="nl-program-section-header__title">Other programs</h2>
      </div>

      <ProgramFilters
        active={activeFilter}
        counts={counts}
        onChange={setActiveFilter}
      />

      <div className="nl-program-grid">
        {gridEntries.map(entry =>
          entry.kind === 'program' ? (
            <ProgramCard
              key={entry.id}
              program={entry}
              {...deriveStatus(entry, hasSubscription, hasPurchased)}
            />
          ) : (
            <PlaceholderCard key={entry.id} placeholder={entry} />
          ),
        )}
      </div>
    </div>
  )
}
