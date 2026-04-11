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
    if (!chosen) return { ...base, background: '#353330', borderColor: '#484542', color: '#F7F4EF' }
    if (option === correct) return { ...base, background: '#EAF3DE', borderColor: '#97C459', color: '#3B6D11' }
    if (option === chosen) return { ...base, background: '#FCEBEB', borderColor: '#F09595', color: '#A32D2D' }
    return { ...base, background: '#353330', borderColor: '#484542', color: '#484542' }
  }

  // Question display
  const questionContent = () => {
    if (card.type === 'staff' && card.note && card.clef) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <StaffCard note={card.note} clef={card.clef} />
          <p style={{ fontSize: '13px', fontWeight: 300, color: '#C4C0B8', letterSpacing: '0.05em' }}>Identify this note</p>
        </div>
      )
    }
    if (card.type === 'symbol') {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bravura, serif', fontSize: '96px', lineHeight: 1.4, color: '#F7F4EF', marginBottom: card.symbolLabel ? '12px' : '0' }}>
            {card.front}
          </div>
          {card.symbolLabel && (
            <p style={{ fontSize: '12px', fontWeight: 300, color: '#C4C0B8', letterSpacing: '0.05em' }}>
              {card.symbolLabel}
            </p>
          )}
        </div>
      )
    }
    return (
      <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(24px, 4vw, 40px)', textAlign: 'center', letterSpacing: '0.01em', color: '#F7F4EF', lineHeight: 1.3 }}>
        {card.front}
      </p>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Question card — hidden for audio cards (AudioCard renders above) */}
      {card.type !== 'audio' && <div style={{
        background: '#353330',
        borderRadius: '20px',
        border: '1px solid #484542',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        boxShadow: '0 4px 32px rgba(26,26,24,0.10)',
        minHeight: '180px',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C4C0B8', marginBottom: '20px' }}>
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
