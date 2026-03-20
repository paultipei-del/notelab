'use client'

import { useState } from 'react'
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
  const correct = card.type === 'staff' ? card.front : card.back

  function handleChoice(option: string) {
    if (chosen) return
    setChosen(option)
    onAnswer(option === correct)
    setTimeout(onReveal, 400)
  }

  function getButtonStyle(option: string): React.CSSProperties {
    const base: React.CSSProperties = {
      width: '100%',
      textAlign: 'left',
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1.5px solid',
      fontFamily: 'var(--font-jost), sans-serif',
      fontSize: '15px',
      fontWeight: 300,
      lineHeight: 1.4,
      cursor: chosen ? 'default' : 'pointer',
      transition: 'all 0.15s',
    }
    if (!chosen) return { ...base, background: 'white', borderColor: '#D3D1C7', color: '#1A1A18' }
    if (option === correct) return { ...base, background: '#EAF3DE', borderColor: '#97C459', color: '#3B6D11' }
    if (option === chosen) return { ...base, background: '#FCEBEB', borderColor: '#F09595', color: '#A32D2D' }
    return { ...base, background: 'white', borderColor: '#D3D1C7', color: '#888780', opacity: 0.6 }
  }

  const questionContent = card.type === 'staff' && card.note && card.clef ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <StaffCard note={card.note} clef={card.clef} />
      <p style={{ fontSize: '14px', fontWeight: 300, color: '#888780' }}>Identify this note</p>
    </div>
  ) : (
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(28px, 5vw, 48px)', textAlign: 'center', color: '#1A1A18', lineHeight: 1.2 }}>
      {card.front}
    </p>
  )

  return (
    <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Question card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #D3D1C7',
        boxShadow: '0 4px 32px rgba(26,26,24,0.10)',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '180px',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888780', marginBottom: '20px' }}>
          Choose the correct answer
        </span>
        {questionContent}
      </div>

      {/* Options grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {options.map((option, i) => (
          <button key={i} style={getButtonStyle(option)} onClick={() => handleChoice(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}