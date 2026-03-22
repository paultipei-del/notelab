'use client'

import { useState, useRef, useEffect } from 'react'
import { QueueCard } from '@/lib/types'
import StaffCard from './StaffCard'

interface TypeAnswerProps {
  card: QueueCard
  onAnswer: (correct: boolean) => void
  onReveal: () => void
}

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[–—]/g, '-')
}

function checkAnswer(userInput: string, card: QueueCard): boolean {
  const user = normalize(userInput)
  const correct = normalize(card.type === 'staff' ? card.front : card.back)
  const correctShort = correct.split('—')[0].trim()
  return user === correct || user === correctShort || (correct.startsWith(user) && user.length > 3)
}

export default function TypeAnswer({ card, onAnswer, onReveal }: TypeAnswerProps) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [card])

  function handleSubmit() {
    if (submitted || !value.trim()) return
    const correct = checkAnswer(value, card)
    setIsCorrect(correct)
    setSubmitted(true)
    onAnswer(correct)
    setTimeout(onReveal, 300)
  }

  const correctAnswer = card.type === 'staff' ? card.front : card.back

  const questionContent = () => {
    if (card.type === 'staff' && card.note && card.clef) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <StaffCard note={card.note} clef={card.clef} />
          <p style={{ fontSize: '13px', fontWeight: 300, color: '#888780', letterSpacing: '0.05em' }}>Name this note</p>
        </div>
      )
    }
    if (card.type === 'symbol') {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bravura, serif', fontSize: '96px', lineHeight: 1.4, color: '#1A1A18', marginBottom: card.symbolLabel ? '12px' : '0' }}>
            {card.front}
          </div>
          {card.symbolLabel && (
            <p style={{ fontSize: '12px', fontWeight: 300, color: '#888780' }}>{card.symbolLabel}</p>
          )}
        </div>
      )
    }
    return (
      <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(24px, 4vw, 40px)', textAlign: 'center', color: '#1A1A18', letterSpacing: '0.01em', lineHeight: 1.3 }}>
        {card.front}
      </p>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Question */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        border: '1px solid #D3D1C7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        boxShadow: '0 4px 32px rgba(26,26,24,0.10)',
        minHeight: '180px',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888780', marginBottom: '20px' }}>
          Type your answer
        </span>
        {questionContent()}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Your answer…"
          disabled={submitted}
          style={{
            flex: 1,
            background: submitted
              ? isCorrect ? '#EAF3DE' : '#FCEBEB'
              : 'white',
            borderRadius: '12px',
            border: `1.5px solid ${submitted ? isCorrect ? '#C0DD97' : '#F09595' : '#D3D1C7'}`,
            padding: '14px 18px',
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '16px',
            fontWeight: 300,
            color: '#1A1A18',
            outline: 'none',
            transition: 'all 0.15s',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitted || !value.trim()}
          style={{
            background: value.trim() && !submitted ? '#1A1A18' : '#EDE8DF',
            color: value.trim() && !submitted ? 'white' : '#888780',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 24px',
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '13px',
            fontWeight: 300,
            letterSpacing: '0.06em',
            cursor: value.trim() && !submitted ? 'pointer' : 'default',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          Check
        </button>
      </div>

      {/* Feedback */}
      {submitted && (
        <div style={{
          background: isCorrect ? '#EAF3DE' : '#FCEBEB',
          border: `1px solid ${isCorrect ? '#C0DD97' : '#F09595'}`,
          borderRadius: '12px',
          padding: '14px 18px',
          fontSize: '14px',
          fontWeight: 300,
          color: isCorrect ? '#3B6D11' : '#A32D2D',
          lineHeight: 1.6,
        }}>
          {isCorrect ? '✓ Correct' : `✗ Answer: ${correctAnswer}`}
        </div>
      )}
    </div>
  )
}
