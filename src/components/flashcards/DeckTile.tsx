'use client'

import Link from 'next/link'
import { Deck } from '@/lib/types'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

/**
 * Shared flashcard deck tile. Extracted so `/flashcards` (tier-grouped layout)
 * and `FlashcardsHub` (home + flashcards groups) render the identical surface —
 * changes to the tile stay in one place.
 */
export default function DeckTile({ deck }: { deck: Deck }) {
  return (
    <Link
      key={deck.id}
      href={`/study/${deck.id}`}
      style={{ textDecoration: 'none', display: 'flex', height: '100%' }}
    >
      <div
        className="nl-card-surface"
        style={{
          padding: '24px',
          cursor: 'pointer',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'flex-start' as const,
        }}
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
