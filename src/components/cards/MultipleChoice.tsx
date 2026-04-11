'use client'

import { useState, useEffect } from 'react'
import { QueueCard } from '@/lib/types'
import StaffCard from './StaffCard'

interface MultipleChoiceProps {
  card: QueueCard
  options: string[]
  onAnswer: (correct: boolean) => void
  onReveal: () => void
}

export default function MultipleChoice({ card, options, onAnswer, onReveal }: MultipleChoiceProps) {
  const [chosen, setChosen] = useState<string | null>(null)

  // Reset when card changes
  useEffect(() => {
    setChosen(null)
  }, [card.id])

  // For symbol cards the correct answer is symbolName, not back
  const correct = card.type === 'staff'
    ? card.front
    : (card.type === 'symbol' || card.type === 'audio')
    ? (card.symbolName ?? card.back)
    : card.back

  function handleChoice(option: string) {
    if (chosen) return
    setChosen(option)
    onAnswer(option === correct)
    onReveal()
  }

  function getButtonStyle(option: string) {
    const base: React.CSSProperties = {
      width: '100%',
      textAlign: 'left',
      padding: '14px 18px',
      borderRadius: '12px',
      border: '1.5px solid',
      fontFamily: 'var(--font-cormorant), serif',
      fontSize: '18px',
      fontWeight: 400,
      letterSpacing: '0.01em',
      lineHeight: 1.4,
      cursor: chosen ? 'default' : 'pointer',
      transition: 'all 0.15s',
    }
    if (!chosen) return { ...base, background: '#FDFAF3', borderColor: '#DDD8CA', color: '#2A2318' }
    if (option === correct) return { ...base, background: '#EAF3DE', borderColor: '#97C459', color: '#3B6D11' }
    if (option === chosen) return { ...base, background: '#FCEBEB', borderColor: '#F09595', color: '#A32D2D' }
    return { ...base, background: '#FDFAF3', borderColor: '#DDD8CA', color: '#DDD8CA' }
  }

  // Question display
  const questionContent = () => {
    if (card.type === 'staff' && card.note && card.clef) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <StaffCard note={card.note} clef={card.clef} />
          <p style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.05em' }}>Identify this note</p>
        </div>
      )
    }
    if (card.type === 'symbol') {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bravura, serif', fontSize: '96px', lineHeight: 1.4, color: '#2A2318', marginBottom: card.symbolLabel ? '12px' : '0' }}>
            {card.front}
          </div>
          {card.symbolLabel && (
            <p style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.05em' }}>
              {card.symbolLabel}
            </p>
          )}
        </div>
      )
    }
    return (
      <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(24px, 4vw, 40px)', textAlign: 'center', letterSpacing: '0.01em', color: '#2A2318', lineHeight: 1.3 }}>
        {card.front}
      </p>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Question card — hidden for audio cards (AudioCard renders above) */}
      {card.type !== 'audio' && <div
        className="nl-study-card-hover"
        style={{
          background: '#FDFAF3',
          borderRadius: '20px',
          border: '1px solid #DDD8CA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          minHeight: '180px',
        }}
      >
        <span style={{ fontSize: 'var(--nl-text-badge)', fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7060', marginBottom: '20px' }}>
          Choose the correct answer
        </span>
        {questionContent()}
      </div>}

      {/* Options grid - fixed height to prevent layout shift */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', minHeight: '130px' }}>
        {options.map((option, i) => (
          <button
            key={i}
            style={getButtonStyle(option)}
            onClick={() => handleChoice(option)}
            disabled={!!chosen}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
