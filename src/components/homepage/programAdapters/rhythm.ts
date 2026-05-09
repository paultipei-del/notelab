'use client'

import type { ProgramTileMeta } from './types'

/**
 * Rhythm tile-meta only. Phase 2 omitted a rhythm progress adapter
 * because rhythm progress is fetched asynchronously from Supabase and
 * its data shape (categorized exercises across multiple programs)
 * doesn't map cleanly to the linear modules-list ProgramHero expects.
 *
 * State 1 doesn't read progress, so the tile renders fine without one.
 * If a future phase adds a rhythm hero, the progress adapter joins
 * this file alongside `getRhythmTileMeta`.
 */
export function getRhythmTileMeta(): ProgramTileMeta {
  return {
    programId: 'rhythm',
    eyebrow: 'Foundation',
    title: 'Rhythm',
    blurb:
      'From quarter notes through dotted rhythms, syncopation, and tuplets.',
    meta: '9 modules · ~6 weeks',
    href: '/programs/rhythm',
    borderColor: '#2d5a3e', // forest green
  }
}
