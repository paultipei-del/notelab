'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DECKS } from '@/lib/decks'
import { readDeckActivity, type DeckActivityMap } from '@/lib/deckActivity'
import { relTimeLong } from '@/lib/relativeTime'

const RECENT_MS = 14 * 86_400_000 // 14 days
const PRACTICE_SECONDS_PER_CARD = 30
const CONTINUE_LIMIT = 3

function minutesEstimate(cardCount: number): string {
  const min = Math.max(
    1,
    Math.round((cardCount * PRACTICE_SECONDS_PER_CARD) / 60),
  )
  return `~${min} min`
}

export default function EarTrainingPage() {
  // localStorage only readable client-side; defer to mount so we
  // render predictable HTML on the server first.
  const [activity, setActivity] = useState<DeckActivityMap>({})
  useEffect(() => {
    setActivity(readDeckActivity())
  }, [])

  // Real ear-training decks have `id` prefixed with `ear-` AND no
  // `tier`. The tier'd `ear-to-paper` deck lives on /flashcards.
  const decks = DECKS.filter(d => d.id.startsWith('ear-') && !d.tier)

  // Continue strip: top 3 ear-decks touched in the last 14 days.
  const now = Date.now()
  const recent = decks
    .map(d => ({ deck: d, ts: activity[d.id] ?? 0 }))
    .filter(x => x.ts > 0 && now - x.ts < RECENT_MS)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, CONTINUE_LIMIT)

  // Group by `deck.group` label, preserving the order decks appear
  // in the registry.
  const groups: { label: string; decks: typeof decks }[] = []
  decks.forEach(deck => {
    const label = deck.group ?? 'Other'
    const existing = groups.find(g => g.label === label)
    if (existing) existing.decks.push(deck)
    else groups.push({ label, decks: [deck] })
  })

  return (
    <div className="nl-ear-page">
      <div className="nl-ear-wrap">
        <header className="nl-ear-hero">
          <h1 className="nl-ear-hero__title">Ear Training</h1>
          <p className="nl-ear-hero__sub">Listen, identify, repeat.</p>
        </header>

        <section className="nl-ear-continue">
          <div className="nl-ear-continue__head">
            <span className="nl-ear-continue__eyebrow">Continue practicing</span>
            {recent.length > 0 && (
              <span className="nl-ear-continue__hint">
                <span className="nl-ear-continue__hint--desktop">
                  your three most recent
                </span>
                <span className="nl-ear-continue__hint--mobile">swipe →</span>
              </span>
            )}
          </div>
          {recent.length > 0 ? (
            <div className="nl-ear-continue__grid">
              {recent.map(({ deck, ts }) => (
                <Link
                  key={deck.id}
                  href={`/study/${deck.id}`}
                  className="nl-ear-continue__card"
                >
                  <span className="nl-ear-continue__age">{relTimeLong(ts)}</span>
                  <div className="nl-ear-continue__title">{deck.title}</div>
                  <div className="nl-ear-continue__footer">
                    <span className="nl-ear-continue__meta">
                      {minutesEstimate(deck.cards.length)} ·{' '}
                      {deck.cards.length} cards
                    </span>
                    <span className="nl-ear-continue__resume">Resume →</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="nl-ear-continue__empty">
              Nothing recent — pick a deck below to begin.
            </div>
          )}
        </section>

        {groups.map(({ label, decks: groupDecks }) => (
          <section key={label} className="nl-ear-category">
            <span className="nl-ear-category__eyebrow">{label}</span>
            <div className="nl-ear-category__grid">
              {groupDecks.map(deck => {
                const ts = activity[deck.id] ?? 0
                const hasActivity = ts > 0
                return (
                  <Link
                    key={deck.id}
                    href={`/study/${deck.id}`}
                    className="nl-ear-deck"
                  >
                    <div className="nl-ear-deck__meta">
                      <span className="nl-ear-deck__time">
                        {minutesEstimate(deck.cards.length)}
                      </span>
                      <span
                        className={
                          'nl-ear-deck__status' +
                          (hasActivity ? '' : ' is-new')
                        }
                      >
                        {hasActivity ? relTimeLong(ts) : 'new'}
                      </span>
                    </div>
                    <h3 className="nl-ear-deck__title">{deck.title}</h3>
                    <span className="nl-ear-deck__start">Start →</span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
