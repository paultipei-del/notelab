'use client'

import { useEffect } from 'react'
import { QueueCard } from '@/lib/types'
import { useIsMobile } from '@/hooks/useMediaQuery'
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
  const isMobile = useIsMobile()

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
    // Subtle bound-book spine hairline on the left edge — nods at the
    // book metaphor without literalising it.
    boxShadow: 'inset 1px 0 0 rgba(139, 105, 20, 0.15)',
  }

  // Pin "Question" / "Answer" labels to the top of each face so they
  // don't drift as content height changes. Faces use distinct eyebrow
  // colors: brick red on the question side draws attention to the
  // prompt; muted brown on the answer side reads as definitional.
  const labelBase: React.CSSProperties = {
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
    fontSize: 'var(--nl-text-badge)',
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    textAlign: 'center',
  }

  const frontCap = capForLength(card.front, 56)
  const backCap  = capForLength(card.back, 44)

  const frontContent = card.type === 'staff' && card.note && card.clef ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <StaffCard note={card.note} clef={card.clef} />
      <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.03em' }}>
        What note is this?
      </p>
    </div>
  ) : isMobile ? (
    // Mobile: Jost sans (non-italic) for legibility on phone — italic
    // Cormorant at 18-22px against the cream gradient on iPhone 11
    // read too soft. Editorial italic stays on desktop where the
    // larger size carries it.
    <p style={{
      fontFamily: 'var(--font-jost), sans-serif',
      fontStyle: 'normal',
      fontWeight: 400,
      fontSize: (() => {
        const len = card.front.length
        const cap = len < 50 ? 22 : len < 100 ? 19 : len < 200 ? 17 : 15.5
        return `${cap}px`
      })(),
      textAlign: 'center',
      color: '#1a1208',
      letterSpacing: '0.005em',
      lineHeight: 1.4,
      margin: 0,
      maxWidth: '100%',
      wordBreak: 'break-word',
      hyphens: 'auto',
    }}>
      {card.front}
    </p>
  ) : (
    // Desktop: italic serif mirrors the classical score convention for
    // Italian tempo terms, dynamic markings, and directives (dolce,
    // poco a poco, etc.). Floor 22 so short prompts feel substantial.
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic',
      fontWeight: 400, fontSize: `clamp(22px, 4.5vw, ${frontCap}px)`, textAlign: 'center',
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
  ) : isMobile ? (
    <p style={{
      fontFamily: 'var(--font-jost), sans-serif',
      fontStyle: 'normal',
      fontWeight: 400,
      fontSize: (() => {
        const len = card.back.length
        const cap = len < 50 ? 19 : len < 100 ? 17 : len < 200 ? 15.5 : 14.5
        return `${cap}px`
      })(),
      textAlign: 'center',
      color: '#1a1208',
      letterSpacing: '0.005em',
      lineHeight: 1.5,
      margin: 0,
      padding: '0 4px',
      maxWidth: '100%',
      wordBreak: 'break-word',
      hyphens: 'auto',
    }}>
      {card.back}
    </p>
  ) : (
    // Desktop: upright Cormorant on the answer side reads as
    // definitional — Q is a directive, A is a fact. Floor 18 so short
    // answers feel substantial.
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400,
      fontSize: `clamp(18px, 3.5vw, ${backCap}px)`, textAlign: 'center',
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
          <span style={{ ...labelBase, color: '#a0381c' }}>Question</span>
          {frontContent}
          {!revealed && (
            <span
              style={{
                position: 'absolute',
                bottom: 18,
                fontFamily: isMobile ? 'var(--font-jost), sans-serif' : 'var(--font-cormorant), serif',
                fontStyle: isMobile ? 'normal' : 'italic',
                fontSize: isMobile ? 11 : 12,
                color: '#5a4028',
                opacity: 0.6,
                letterSpacing: isMobile ? '0.06em' : '0.02em',
                textTransform: isMobile ? 'uppercase' : 'none',
              }}
            >
              Tap to flip
            </span>
          )}
        </div>

        {/* Back */}
        <div className="nl-flip-face" style={{ ...faceStyle, position: 'relative', transform: 'rotateY(180deg)' }}>
          <span style={{ ...labelBase, color: '#5a4028' }}>Answer</span>
          {backContent}
        </div>
      </div>
    </div>
  )
}
