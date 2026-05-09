'use client'

import Link from 'next/link'
import MiniSpine from '@/components/flashcards/library/MiniSpine'
import WoodPlank from '@/components/flashcards/library/WoodPlank'
import type { DeckWithSummary } from '@/components/flashcards/library/sectionGrouping'

const SPINE_CAP_DEFAULT = 5
const SPINE_CAP_COMPACT = 4

const SPINE_W_DEFAULT = 28
const SPINE_W_COMPACT = 26
const SPINE_H_BASE_DEFAULT = 130
const SPINE_H_BASE_COMPACT = 110

export interface MiniShelfProps {
  activeDecks: DeckWithSummary[]
  totalDue: number
  /** 'default' for desktop two-pane, 'compact' for mobile stack. */
  density?: 'default' | 'compact'
}

/**
 * Compact bookshelf used in State 4. Card container with a "tonight's
 * review" eyebrow, the due-count stat, a small set-name sub, a row of
 * 4–5 mini spines on a wood plank, and a Start review CTA at the
 * bottom that targets the most-recently-touched active deck.
 *
 * No museum placard (per spec — placards are interactive shelf
 * machinery; the MiniShelf is read-only context for the CTA).
 */
export default function MiniShelf({
  activeDecks,
  totalDue,
  density = 'default',
}: MiniShelfProps) {
  const isCompact = density === 'compact'
  const cap = isCompact ? SPINE_CAP_COMPACT : SPINE_CAP_DEFAULT
  const spines = activeDecks.slice(0, cap)
  const spineW = isCompact ? SPINE_W_COMPACT : SPINE_W_DEFAULT
  const spineHBase = isCompact ? SPINE_H_BASE_COMPACT : SPINE_H_BASE_DEFAULT

  const featuredHref =
    activeDecks[0] != null ? `/study/${activeDecks[0].deck.id}` : '/flashcards'

  // Up to 3 set names, comma-separated for the sub line.
  const setNames = activeDecks.slice(0, 3).map(d => d.deck.title).join(', ')

  return (
    <div
      style={{
        background: 'rgba(255, 250, 238, 0.7)',
        border: '1px solid rgba(139, 105, 20, 0.25)',
        borderRadius: 4,
        padding: isCompact ? '20px 22px' : '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jost), system-ui, sans-serif',
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#a0381c',
          fontWeight: 700,
        }}
      >
        Tonight&rsquo;s review
      </div>
      <div
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 22,
          fontWeight: 500,
          color: '#1a1208',
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}
      >
        {totalDue}{' '}
        <em style={{ fontStyle: 'italic', color: '#a0381c', fontWeight: 500 }}>
          {totalDue === 1 ? 'card due' : 'cards due'}
        </em>
      </div>
      {setNames && (
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            fontSize: 13,
            color: '#8a7560',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {setNames}
        </div>
      )}

      {/* Spine row — small books standing on the plank */}
      <div
        style={{
          marginTop: 6,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
        }}
      >
        {spines.map((d, i) => {
          // Slight per-book height variance (deterministic, based on title length)
          // so the row reads as a real shelf, not a uniform stamp.
          const variance = ((d.deck.title.length * 7) % 18) - 9
          return (
            <Link
              key={d.deck.id}
              href={`/study/${d.deck.id}`}
              style={{ display: 'block', textDecoration: 'none' }}
              aria-label={`Open ${d.deck.title}`}
            >
              <MiniSpine
                title={d.deck.title}
                width={spineW}
                height={Math.max(96, spineHBase + variance)}
              />
            </Link>
          )
        })}
        {/* Force the row to fill the card width so the plank below
            spans the full container even when only a few spines exist. */}
        <div style={{ flex: 1 }} />
      </div>
      <div style={{ width: '100%', marginTop: -4 }}>
        <WoodPlank />
      </div>

      <Link
        href={featuredHref}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 18px',
          marginTop: 8,
          borderRadius: 6,
          background: '#1a1208',
          color: '#f0e7d0',
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 14,
          textDecoration: 'none',
          minHeight: 44,
          whiteSpace: 'nowrap',
        }}
      >
        Start review →
      </Link>
    </div>
  )
}
