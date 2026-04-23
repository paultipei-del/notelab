'use client'

import Link from 'next/link'
import { Deck } from '@/lib/types'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

// Map of topic-tag namespace value → CSS variable carrying the deck's domain
// accent color. Only the first `topic:*` tag on a deck contributes — one
// stripe per tile, deterministic.
const TOPIC_COLOR_VAR: Record<string, string> = {
  pitch:      'var(--deck-color-pitch)',
  rhythm:     'var(--deck-color-rhythm)',
  harmony:    'var(--deck-color-harmony)',
  expression: 'var(--deck-color-expression)',
  notation:   'var(--deck-color-notation)',
  form:       'var(--deck-color-form)',
  technique:  'var(--deck-color-technique)',
}

function firstTopic(deck: Deck): string | null {
  if (!deck.tags) return null
  for (const t of deck.tags) {
    if (t.startsWith('topic:')) return t.slice('topic:'.length)
  }
  return null
}

/**
 * Shared flashcard deck tile. Extracted so `/flashcards` (tier-grouped layout)
 * and `FlashcardsHub` (home + flashcards groups) render the identical surface —
 * changes to the tile stay in one place.
 */
export default function DeckTile({ deck }: { deck: Deck }) {
  const topic = firstTopic(deck)
  const accentColor = topic ? TOPIC_COLOR_VAR[topic] : undefined
  const surfaceStyle: React.CSSProperties = {
    padding: '24px',
    cursor: 'pointer',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  }
  if (accentColor) {
    (surfaceStyle as Record<string, string>)['--deck-accent'] = accentColor
  }

  return (
    <Link
      key={deck.id}
      href={`/study/${deck.id}`}
      style={{ textDecoration: 'none', display: 'flex', height: '100%' }}
    >
      <div
        className="nl-card-surface"
        data-deck-accent={topic ?? undefined}
        style={surfaceStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', marginBottom: '10px' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060' }}>
            {deck.cards.length} cards
          </span>
        </div>
        <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '24px', color: '#1A1A18', marginBottom: '8px', width: '100%', letterSpacing: '0.01em' }}>
          {deck.title}
        </h3>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', lineHeight: 1.55, flex: 1, margin: 0, width: '100%', marginBottom: '14px' }}>
          {deck.description}
        </p>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 500, color: ACCENT, alignSelf: 'flex-end' }}>
          Start →
        </span>
      </div>
    </Link>
  )
}
