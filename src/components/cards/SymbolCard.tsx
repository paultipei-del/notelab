'use client'

import { useEffect } from 'react'
import { Card } from '@/lib/types'

interface SymbolCardProps {
  card: Card
  revealed: boolean
  onReveal: () => void
}

// 3D-flip flashcard for symbol-type cards. Matches FlipCard's geometry and
// flip mechanics so the study-mode experience is uniform whether the front
// is text (tempo terms) or a Bravura glyph (dynamics, articulations, etc.).
// Clefs and other tall Bravura glyphs (g-clef, f-clef, c-clef families, plus
// Unicode's musical-symbol clefs via surrogate pairs) extend much further
// vertically than dynamic letters or accidentals. They need a smaller
// fontSize so they don't crowd the card or overlap the "Question" label.
const TALL_GLYPH = /[-]|\uD834[\uDD1E-\uDD24]/
function pickGlyphSize(text: string): string {
  if (TALL_GLYPH.test(text)) return 'clamp(44px, 8vw, 72px)'
  return 'clamp(80px, 14vw, 128px)'
}

export default function SymbolCard({ card, revealed, onReveal }: SymbolCardProps) {
  // Front can render multiple symbols side by side with a '|' separator,
  // e.g. 'f|ff' shows forte next to fortissimo.
  const symbols = card.front.split('|')
  const hasLabel = card.symbolLabel
  const glyphFontSize = pickGlyphSize(card.front)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        onReveal()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [revealed, onReveal])

  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: '#FDFAF3',
    borderRadius: '16px',
    border: '1px solid #DDD8CA',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    boxSizing: 'border-box',
  }

  // Label is pinned to the TOP of each face (absolute position) so it stays
  // put regardless of how tall the centered glyph is — "Question" never
  // shifts up or down between cards of different glyph heights.
  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
    fontFamily: 'var(--font-jost), sans-serif',
    fontSize: 'var(--nl-text-badge)',
    fontWeight: 400,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#7A7060',
    textAlign: 'center',
  }

  return (
    <div className="nl-flip-card" style={{ width: '100%', maxWidth: '640px' }}>
      <div
        onClick={onReveal}
        style={{
          width: '100%',
          minHeight: 'clamp(200px, 42dvh, 340px)',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        }}
      >
        {/* Front — Bravura glyph centered */}
        <div className="nl-flip-face" style={faceStyle}>
          <span style={labelStyle}>Question</span>
          <div
            className="nl-study-symbol-glyph"
            style={{
              fontFamily: 'Bravura, serif',
              fontSize: glyphFontSize,
              lineHeight: 1,
              color: '#2A2318',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {symbols.join(' ')}
          </div>
          {hasLabel && (
            <p style={{
              fontFamily: 'var(--font-jost), sans-serif',
              fontSize: 'var(--nl-text-meta)',
              fontWeight: 300,
              color: '#7A7060',
              letterSpacing: '0.05em',
              marginTop: '18px',
            }}>
              {card.symbolLabel}
            </p>
          )}
          {!revealed && (
            <span style={{
              position: 'absolute', bottom: '20px',
              fontFamily: 'var(--font-jost), sans-serif',
              fontSize: 'var(--nl-text-compact)',
              fontWeight: 400,
              letterSpacing: '0.08em',
              color: '#DDD8CA',
              textTransform: 'uppercase',
            }}>
              tap to reveal
            </span>
          )}
        </div>

        {/* Back — symbol name + explanation */}
        <div className="nl-flip-face" style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
          <span style={labelStyle}>Answer</span>
          <p style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(24px, 4.2vw, 40px)',
            color: '#2A2318',
            margin: '0 0 12px',
            lineHeight: 1.2,
            textAlign: 'center',
          }}>
            {card.symbolName ?? card.back.split('—')[0].trim()}
          </p>
          <p style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: 'clamp(15px, 2.4vw, 20px)',
            fontWeight: 300,
            color: '#7A7060',
            lineHeight: 1.6,
            textAlign: 'center',
            padding: '0 16px',
            margin: 0,
          }}>
            {card.back}
          </p>
        </div>
      </div>
    </div>
  )
}
