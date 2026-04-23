'use client'

import { DeckPreview } from '@/lib/types'

const F = 'var(--font-jost), sans-serif'
const BRAVURA = 'Bravura, serif'

/**
 * Renders a deck preview inside the tile's description slot. Single-line for
 * text and glyphs; notation renders inline SVG. Falls through (null) for kind
 * 'none' so the caller can show the description instead.
 */
export default function DeckPreviewView({ preview }: { preview: DeckPreview }) {
  if (preview.kind === 'none') return null

  // Shared container — flex-1 so "Start →" is pushed to the bottom of the tile
  // the same way the description did. margin-bottom matches old description.
  const containerStyle = {
    flex: 1,
    width: '100%',
    margin: 0,
    marginBottom: '14px',
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
  } as const

  if (preview.kind === 'text') {
    return (
      <div style={containerStyle}>
        <span
          style={{
            fontFamily: F,
            fontSize: '14px',
            fontWeight: 400,
            color: '#4A4540',
            lineHeight: 1.5,
            letterSpacing: '0.01em',
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {preview.content}
        </span>
      </div>
    )
  }

  if (preview.kind === 'glyphs') {
    return (
      <div style={containerStyle} aria-label={preview.ariaLabel}>
        <span
          style={{
            fontFamily: BRAVURA,
            fontSize: '22px',
            color: '#2A2318',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          {preview.codepoints.map((cp, i) => (
            <span key={i} style={{ display: 'inline-block' }}>{cp}</span>
          ))}
        </span>
      </div>
    )
  }

  if (preview.kind === 'notation') {
    return (
      <div
        style={containerStyle}
        aria-label={preview.ariaLabel}
      >
        <span
          aria-hidden="true"
          style={{ display: 'inline-flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: preview.svg }}
        />
      </div>
    )
  }

  return null
}
