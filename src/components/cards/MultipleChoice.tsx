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

// Clefs and other tall Bravura glyphs need a smaller render size than the
// compact dynamics / accidental glyphs, otherwise they overlap the
// "Choose the correct answer" label in the MC card.
const TALL_GLYPH = /[-]|\uD834[\uDD1E-\uDD24]/
function pickGlyphSize(text: string): string {
  if (TALL_GLYPH.test(text)) return 'clamp(44px, 8vw, 72px)'
  return 'clamp(68px, 12vw, 96px)'
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
    if (!chosen) return { ...base, background: '#ECE3CC', borderColor: '#D9CFAE', color: '#2A2318' }
    if (option === correct) return { ...base, background: '#EAF3DE', borderColor: '#97C459', color: '#3B6D11' }
    if (option === chosen) return { ...base, background: '#FCEBEB', borderColor: '#F09595', color: '#A32D2D' }
    return { ...base, background: '#ECE3CC', borderColor: '#D9CFAE', color: '#D9CFAE' }
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
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            fontFamily: 'Bravura, serif',
            fontSize: pickGlyphSize(card.front),
            lineHeight: 1,
            color: '#2A2318',
            marginBottom: card.symbolLabel ? '12px' : '0',
          }}>
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
      <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300,
        fontSize: (() => {
          // Match FlipCard's adaptive sizing so long lesson-deck questions
          // ("Are overtones from a vibrating string in tune with…") shrink
          // to fit instead of overflowing the question card.
          const len = card.front.length
          const cap = len < 50 ? 40 : len < 100 ? 32 : len < 200 ? 24 : len < 300 ? 20 : 17
          return `clamp(16px, 3.5vw, ${cap}px)`
        })(),
        textAlign: 'center', letterSpacing: '0.01em', color: '#2A2318', lineHeight: 1.4,
        maxWidth: '100%', wordBreak: 'break-word', hyphens: 'auto' }}>
        {card.front}
      </p>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Question card — hidden for audio cards (AudioCard renders above).
          Label is absolute-positioned so it never shifts when the glyph
          size changes between cards. */}
      {card.type !== 'audio' && <div
        className="nl-study-card-hover"
        style={{
          position: 'relative',
          background: '#ECE3CC',
          borderRadius: '20px',
          border: '1px solid #D9CFAE',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '56px 32px 36px',
          minHeight: 'clamp(220px, 28dvh, 300px)',
        }}
      >
        <span style={{ position: 'absolute', top: 22, left: 0, right: 0,
          textAlign: 'center',
          fontSize: 'var(--nl-text-badge)', fontWeight: 400, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: '#7A7060' }}>
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
