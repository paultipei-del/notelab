'use client'

import { useEffect } from 'react'
import { QueueCard } from '@/lib/types'
import StaffCard from './StaffCard'

interface FlipCardProps {
  card: QueueCard
  revealed: boolean
  onReveal: () => void
}

export default function FlipCard({ card, revealed, onReveal }: FlipCardProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
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
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--nl-text-badge)',
    fontWeight: 400,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#7A7060',
    marginBottom: '24px',
  }

  const frontContent = card.type === 'staff' && card.note && card.clef ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <StaffCard note={card.note} clef={card.clef} />
      <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.03em' }}>
        What note is this?
      </p>
    </div>
  ) : (
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(28px, 5vw, 52px)', textAlign: 'center', color: '#2A2318', letterSpacing: '0.01em', lineHeight: 1.2 }}>
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
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(22px, 4vw, 40px)', textAlign: 'center', color: '#2A2318', lineHeight: 1.3, padding: '0 16px' }}>
      {card.back}
    </p>
  )

  return (
    <div className="nl-flip-card" style={{ width: '100%', maxWidth: '680px' }}>
      <div
        onClick={!revealed ? onReveal : undefined}
        style={{
          width: '100%',
          minHeight: 'clamp(200px, 42dvh, 340px)',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: revealed ? 'default' : 'pointer',
        }}
      >
        {/* Front */}
        <div className="nl-flip-face" style={faceStyle}>
          <span style={labelStyle}>Question</span>
          {frontContent}
          {!revealed && (
            <span style={{ position: 'absolute', bottom: '20px', fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.08em', color: '#DDD8CA', textTransform: 'uppercase' }}>
              tap to reveal
            </span>
          )}
        </div>

        {/* Back */}
        <div className="nl-flip-face" style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
          <span style={labelStyle}>Answer</span>
          {backContent}
        </div>
      </div>
    </div>
  )
}