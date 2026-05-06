'use client'

import { useEffect } from 'react'
import { QueueCard } from '@/lib/types'
import StaffCard from './StaffCard'

interface FlipCardProps {
  card: QueueCard
  revealed: boolean
  onReveal: () => void
}

// Lesson-deck flashcards can have answers of wildly different lengths — a
// short term ("Allegro") vs. a paragraph ("Major and minor 7ths, etc."). A
// fixed font-size cap that flatters the short ones overflows the card on the
// long ones. Scale the cap inversely with text length so prose still fits
// comfortably inside the same card geometry while short answers stay bold.
function capForLength(text: string, baseMax: number): number {
  const len = text.length
  if (len < 50)  return baseMax
  if (len < 100) return Math.round(baseMax * 0.78)
  if (len < 200) return Math.round(baseMax * 0.60)
  if (len < 300) return Math.round(baseMax * 0.50)
  return Math.round(baseMax * 0.42)
}

export default function FlipCard({ card, revealed, onReveal }: FlipCardProps) {
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
    gridArea: 'stack',
    background: '#ECE3CC',
    borderRadius: '16px',
    border: '1px solid #D9CFAE',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '56px 40px 40px',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    width: '100%',
    minHeight: 'inherit',
    boxSizing: 'border-box',
  }

  // Pin "Question" / "Answer" labels to the top of each face so they don't
  // drift up/down as the glyph or text content changes height.
  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
    fontSize: 'var(--nl-text-badge)',
    fontWeight: 400,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#7A7060',
    textAlign: 'center',
  }

  const frontCap = capForLength(card.front, 52)
  const backCap  = capForLength(card.back, 40)

  const frontContent = card.type === 'staff' && card.note && card.clef ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <StaffCard note={card.note} clef={card.clef} />
      <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.03em' }}>
        What note is this?
      </p>
    </div>
  ) : (
    // Italic serif mirrors the classical score convention for Italian tempo
    // terms, dynamic markings, and directives (dolce, poco a poco, etc.).
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic',
      fontWeight: 400, fontSize: `clamp(20px, 4.5vw, ${frontCap}px)`, textAlign: 'center',
      color: '#2A2318', letterSpacing: '0.01em', lineHeight: 1.3,
      maxWidth: '100%', wordBreak: 'break-word', hyphens: 'auto' }}>
      {card.front}
    </p>
  )

  const backContent = card.type === 'staff' ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '48px', textAlign: 'center', color: '#2A2318' }}>
        {card.front}
      </p>
      <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.03em', textAlign: 'center' }}>
        {card.back}
      </p>
    </div>
  ) : (
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300,
      fontSize: `clamp(16px, 3.5vw, ${backCap}px)`, textAlign: 'center',
      color: '#2A2318', lineHeight: 1.4, padding: '0 4px',
      maxWidth: '100%', wordBreak: 'break-word', hyphens: 'auto' }}>
      {card.back}
    </p>
  )

  return (
    <div className="nl-flip-card" style={{ width: '100%', maxWidth: '640px' }}>
      {/* Both faces share a single grid cell ("stack") so the container's
          height grows to fit the taller of the two — long answers no longer
          overflow the card, while the 3D flip transform still works because
          each face is its own positioned element. */}
      <div
        onClick={onReveal}
        style={{
          width: '100%',
          minHeight: 'clamp(200px, 42dvh, 340px)',
          position: 'relative',
          display: 'grid',
          gridTemplateAreas: '"stack"',
          transformStyle: 'preserve-3d',
          transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        }}
      >
        {/* Front */}
        <div className="nl-flip-face" style={{ ...faceStyle, position: 'relative' }}>
          <span style={labelStyle}>Question</span>
          {frontContent}
          {!revealed && (
            <span style={{ position: 'absolute', bottom: '20px', fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.08em', color: '#D9CFAE', textTransform: 'uppercase' }}>
              tap to reveal
            </span>
          )}
        </div>

        {/* Back */}
        <div className="nl-flip-face" style={{ ...faceStyle, position: 'relative', transform: 'rotateY(180deg)' }}>
          <span style={labelStyle}>Answer</span>
          {backContent}
        </div>
      </div>
    </div>
  )
}
