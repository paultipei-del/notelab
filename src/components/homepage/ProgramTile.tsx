'use client'

import Link from 'next/link'
import { useBookBinding } from '@/components/flashcards/library/bookBindings'
import type { ProgramTileMeta } from './programAdapters/types'

export interface ProgramTileProps {
  tile: ProgramTileMeta
}

/**
 * State 1 (new user) program tile. A larger sibling of the Cards/List
 * `<CardItem>`: cream background, 1px border, 3px colored left border
 * (binding hash from programId, with optional explicit override),
 * eyebrow + title + italic blurb + meta-row with "View →" arrow.
 *
 * No motion, no progress signal — pure presentation. Click navigates
 * to the program's existing detail route.
 */
export default function ProgramTile({ tile }: ProgramTileProps) {
  const binding = useBookBinding(tile.programId)
  const stripe = tile.borderColor ?? binding.stripe

  return (
    <Link
      href={tile.href}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 250, 238, 0.7)',
        border: '1px solid rgba(139, 105, 20, 0.2)',
        borderLeft: `3px solid ${stripe}`,
        borderRadius: 3,
        padding: '22px 26px 20px',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 1px 3px rgba(40, 20, 8, 0.05)',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(139, 105, 20, 0.4)'
        // Don't override the left stripe — that's part of borderLeft
        e.currentTarget.style.borderLeftColor = stripe
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 6px 12px rgba(40, 20, 8, 0.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(139, 105, 20, 0.2)'
        e.currentTarget.style.borderLeftColor = stripe
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(40, 20, 8, 0.05)'
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jost), system-ui, sans-serif',
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#a0381c',
          fontWeight: 600,
          opacity: 0.9,
          marginBottom: 8,
        }}
      >
        {tile.eyebrow}
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 24,
          fontWeight: 500,
          color: '#1a1208',
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
          margin: '0 0 10px 0',
        }}
      >
        {tile.title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic',
          fontSize: 15,
          color: '#5a4028',
          lineHeight: 1.45,
          margin: '0 0 18px 0',
          flex: 1,
        }}
      >
        {tile.blurb}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 12,
          borderTop: '1px solid rgba(139, 105, 20, 0.15)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            fontSize: 13,
            color: '#8a7560',
          }}
        >
          {renderMetaWithDuration(tile.meta)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            fontSize: 14,
            color: '#a0381c',
          }}
        >
          View →
        </div>
      </div>
    </Link>
  )
}

/**
 * Split a meta string like "10 levels · ~6 months" so the tilde-prefixed
 * duration segment renders in Jost sans. Cormorant Garamond italic
 * draws the tilde glyph as a long horizontal stroke that reads as a
 * dash; switching just that segment to sans keeps the tilde
 * unambiguous while the prefix stays in the editorial italic.
 *
 * Inline helper rather than a shared <DurationLabel> for now —
 * ProgramCard's duration label is structurally different (no prefix
 * to preserve), so abstracting now would force one of them into a
 * shape that doesn't fit. Revisit if a third "~" usage appears.
 */
function renderMetaWithDuration(meta: string): React.ReactNode {
  const tildeIdx = meta.indexOf('~')
  if (tildeIdx === -1) return meta
  const prefix = meta.slice(0, tildeIdx)
  const duration = meta.slice(tildeIdx)
  return (
    <>
      {prefix}
      <span
        style={{
          fontFamily: 'var(--font-jost), system-ui, sans-serif',
          fontStyle: 'normal',
          fontSize: 12,
          letterSpacing: '0.02em',
        }}
      >
        {duration}
      </span>
    </>
  )
}
