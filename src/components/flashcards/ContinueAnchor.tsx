'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase'
import { getDeckById } from '@/lib/decks'

const F = 'var(--font-jost), sans-serif'

// Fallback deck when the user has no progress data (or their most recent deck
// was renamed/removed). Slug must exist in DECKS.
const START_HERE_DECK_ID = 'treble-clef-notes'
const START_HERE_DECK_TITLE = 'Treble Clef Notes'

type ContinueState =
  | { kind: 'continue' | 'resume'; deckId: string; deckTitle: string }
  | { kind: 'start' }
  | { kind: 'hidden' }

function useContinueState(): ContinueState {
  const { user, loading } = useAuth()
  // Async state only — auth-loading and logged-out states are derived below,
  // so we don't setState them inside the effect.
  const [asyncState, setAsyncState] = useState<ContinueState | null>(null)

  useEffect(() => {
    if (loading || !user) return

    let cancelled = false
    ;(async () => {
      let next: ContinueState = { kind: 'start' }
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('progress')
          .select('deck_id, repetitions, interval, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(50)

        if (cancelled) return

        if (!error && data && data.length > 0) {
          // "In learning" — SM-2 hasn't graduated the card to long intervals yet.
          // repetitions < 2 OR interval < 7 days counts as still-learning.
          const inProgress = data.find(
            row => (row.repetitions ?? 0) < 2 || (row.interval ?? 0) < 7,
          )
          if (inProgress) {
            const deck = getDeckById(inProgress.deck_id)
            if (deck) next = { kind: 'continue', deckId: deck.id, deckTitle: deck.title }
          } else {
            const deck = getDeckById(data[0].deck_id)
            if (deck) next = { kind: 'resume', deckId: deck.id, deckTitle: deck.title }
          }
        }
      } catch {
        // Fall through to `start` — anchor is nice-to-have, not critical path.
      }
      if (!cancelled) setAsyncState(next)
    })()

    return () => {
      cancelled = true
    }
  }, [user, loading])

  if (loading) return { kind: 'hidden' }
  if (!user) return { kind: 'start' }
  return asyncState ?? { kind: 'hidden' }
}

export default function ContinueAnchor() {
  const state = useContinueState()
  if (state.kind === 'hidden') return null

  const { label, href, title } =
    state.kind === 'continue'
      ? { label: 'Continue', href: `/study/${state.deckId}`, title: state.deckTitle }
      : state.kind === 'resume'
      ? { label: 'Pick up again', href: `/study/${state.deckId}`, title: state.deckTitle }
      : { label: 'Start here', href: `/study/${START_HERE_DECK_ID}`, title: START_HERE_DECK_TITLE }

  return (
    <Link
      href={href}
      className="nl-continue-anchor"
      style={{
        display: 'inline-block',
        fontFamily: F,
        fontSize: '15px',
        fontWeight: 300,
        color: '#7A7060',
        lineHeight: 1.7,
        textDecoration: 'none',
      }}
    >
      {label}: {title} →
    </Link>
  )
}
