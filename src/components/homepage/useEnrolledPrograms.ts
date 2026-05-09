'use client'

import { useEffect, useState } from 'react'
import { loadCMLevel1Hero } from './programAdapters/cmLevel1'
import { loadCMPrepHero } from './programAdapters/cmPrep'
import { loadNoteReadingHero } from './programAdapters/noteReading'
import type { ProgramHeroData } from './programAdapters/types'

interface Result {
  /** True once we've checked localStorage / progress stores. */
  loaded: boolean
  /**
   * The most-recently-touched program with at least one session, or
   * null if the user hasn't touched any program. Decoupled from
   * flashcard state — composition into State 4 happens in
   * useHomepageState, not here.
   */
  program: ProgramHeroData | null
}

/**
 * Synchronously load each program's localStorage progress, normalize
 * via the per-program adapters, and return the most-recently-touched
 * program (null if none).
 *
 * Note: rhythm is intentionally omitted — its progress is fetched
 * asynchronously from Supabase and its data shape doesn't map cleanly
 * to a linear modules-list. A user with only rhythm progress will
 * fall through to the legacy homepage; future work can add an adapter.
 */
export function useEnrolledPrograms(): Result {
  const [program, setProgram] = useState<ProgramHeroData | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const candidates = [
      loadCMLevel1Hero(),
      loadCMPrepHero(),
      loadNoteReadingHero(),
    ].filter((p): p is ProgramHeroData => p != null)

    candidates.sort((a, b) => b.lastTouched - a.lastTouched)
    setProgram(candidates[0] ?? null)
    setLoaded(true)
  }, [])

  return { loaded, program }
}
