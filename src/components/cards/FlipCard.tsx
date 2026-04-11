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
    background: '#353330',
    borderRadius: '16px',
    border: '1px solid #484542',
    boxShadow: '0 4px 32px rgba(26,26,24,0.10)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 400,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#9E9A92',
    marginBottom: '24px',
  }

  const frontContent = card.type === 'staff' && card.note && card.clef ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <StaffCard note={card.note} clef={card.clef} />
      <p style={{ fontSize: '14px', fontWeight: 300, color: '#9E9A92', letterSpacing: '0.03em' }}>
        What note is this?
      </p>
    </div>
  ) : (
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(28px, 5vw, 52px)', textAlign: 'center', color: '#F0EDE6', letterSpacing: '0.01em', lineHeight: 1.2 }}>
      {card.front}
    </p>
  )

  const backContent = card.type === 'staff' ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '48px', textAlign: 'center', color: '#F0EDE6' }}>
        {card.front}
      </p>
      <p style={{ fontSize: '14px', fontWeight: 300, color: '#9E9A92', letterSpacing: '0.03em', textAlign: 'center' }}>
        {card.back}
      </p>
    </div>
  ) : (
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(22px, 4vw, 40px)', textAlign: 'center', color: '#F0EDE6', lineHeight: 1.3, padding: '0 16px' }}>
      {card.back}
    </p>
  )

  return (
    <div style={{ width: '100%', maxWidth: '680px', perspective: '1200px' }}>
      <div
        onClick={!revealed ? onReveal : undefined}
        style={{
          width: '100%',
          minHeight: '340px',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: revealed ? 'default' : 'pointer',
        }}
      >
        {/* Front */}
        <div style={faceStyle}>
          <span style={labelStyle}>Question</span>
          {frontContent}
          {!revealed && (
            <span style={{ position: 'absolute', bottom: '20px', fontSize: '11px', fontWeight: 300, letterSpacing: '0.08em', color: '#484542', textTransform: 'uppercase' }}>
              tap to reveal
            </span>
          )}
        </div>

        {/* Back */}
        <div style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
          <span style={labelStyle}>Answer</span>
          {backContent}
        </div>
      </div>
    </div>
  )
}