'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { DECKS } from '@/lib/decks'
import { loadProgress } from '@/lib/progressSync'
import { readDeckActivity, DeckActivityMap } from '@/lib/deckActivity'
import type { Deck, ProgressStore } from '@/lib/types'
import { summarize, deckToBookProps } from '@/components/flashcards/library/deckToBook'
import type { DeckWithSummary } from '@/components/flashcards/library/sectionGrouping'

export type HomepageState =
  | 'loading'
  | 'new'
  | 'flashcards-only'
  | 'program-only'
  | 'both'

export interface HomepageContext {
  /** The deck to feature in the State 3 hero (most-recently-touched
   *  active deck). Null in any state without an active deck. */
  featured: DeckWithSummary | null
  /** All visible (tiered) decks with summary, for the desktop shelf row. */
  allDecks: DeckWithSummary[]
  /** Active decks sorted most-recently-touched first. */
  activeDecks: DeckWithSummary[]
  /** Total cards due across the whole library. */
  totalDue: number
  /** Estimated minutes of review (~15 sec / card). */
  estMinutes: number
}

const TIERED_DECKS: Deck[] = DECKS.filter(d => !!d.tier)

interface Result {
  state: HomepageState
  ctx: HomepageContext
}

/**
 * Determines which homepage hero to render. Loads progress + deckActivity
 * once per user, then derives state synchronously from the resolved data.
 *
 * Phase 1 only realizes 'flashcards-only' and 'new' as distinct states;
 * 'program-only' and 'both' aren't reachable until a program-enrollment
 * data layer ships in Phase 2. They're included in the type so the
 * dispatcher signature stays stable across phases.
 */
export function useHomepageState(user: User | null | undefined): Result {
  const [progress, setProgress] = useState<ProgressStore>({})
  const [deckActivity, setDeckActivity] = useState<DeckActivityMap>({})
  const [progressLoaded, setProgressLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    loadProgress(user.id).then(p => {
      if (cancelled) return
      setProgress(p)
      setDeckActivity(readDeckActivity())
      setProgressLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const allDecks: DeckWithSummary[] = useMemo(() => {
    return TIERED_DECKS.map(deck => {
      const summary = summarize(deck, progress)
      const book = deckToBookProps(deck, progress)!
      return { deck, book, summary }
    })
  }, [progress])

  // Same lastTouchedAt as /flashcards: max(SM-2 lastSeenAt, deckActivity
  // visit timestamp) so opening a deck in flip mode (which doesn't write
  // to SM-2) still bubbles it to the top of "Currently reading".
  const activeDecks = useMemo(() => {
    return allDecks
      .filter(d => d.book.state === 'active')
      .sort((a, b) => {
        const aT = Math.max(a.summary.lastSeenAt ?? 0, deckActivity[a.deck.id] ?? 0)
        const bT = Math.max(b.summary.lastSeenAt ?? 0, deckActivity[b.deck.id] ?? 0)
        return bT - aT
      })
  }, [allDecks, deckActivity])

  const totalDue = useMemo(
    () => allDecks.reduce((sum, d) => sum + d.summary.dueCount, 0),
    [allDecks],
  )
  const estMinutes = Math.max(1, Math.round(totalDue * 0.25))

  const featured = activeDecks[0] ?? null

  let state: HomepageState
  if (!user) {
    state = 'loading'
  } else if (!progressLoaded) {
    state = 'loading'
  } else if (activeDecks.length > 0) {
    // Phase 1: any active flashcards → State 3, regardless of programs
    // (program-enrollment isn't detectable yet). When Phase 2 ships, also
    // check hasProgram and split into 'flashcards-only' vs 'both'.
    state = 'flashcards-only'
  } else {
    state = 'new'
  }

  return {
    state,
    ctx: { featured, allDecks, activeDecks, totalDue, estMinutes },
  }
}
