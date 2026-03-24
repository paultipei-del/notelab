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
    setValue('')
    setSubmitted(false)
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

  const questionContent = card.type === 'staff' && card.note && card.clef ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <StaffCard note={card.note} clef={card.clef} />
      <p style={{ fontSize: '14px', fontWeight: 300, color: '#888780' }}>Name this note</p>
    </div>
  ) : (
    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(28px, 5vw, 48px)', textAlign: 'center', color: '#1A1A18', lineHeight: 1.2 }}>
      {card.front}
    </p>
  )

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: submitted ? (isCorrect ? '#EAF3DE' : '#FCEBEB') : 'white',
    border: `1.5px solid ${submitted ? (isCorrect ? '#97C459' : '#F09595') : '#D3D1C7'}`,
    borderRadius: '12px',
    padding: '14px 20px',
    fontFamily: 'var(--font-cormorant), serif',
    fontSize: '22px',
    fontWeight: 300,
    color: submitted ? (isCorrect ? '#3B6D11' : '#A32D2D') : '#1A1A18',
    outline: 'none',
    transition: 'border-color 0.15s',
    letterSpacing: '0.01em',
  }

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
          Type your answer
        </span>
        {questionContent}
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          ref={inputRef}
          style={inputStyle}
          placeholder="Your answer…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={submitted}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          onClick={handleSubmit}
          disabled={submitted || !value.trim()}
          style={{
            background: '#1A1A18',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 24px',
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '13px',
            fontWeight: 300,
            letterSpacing: '0.08em',
            cursor: submitted || !value.trim() ? 'default' : 'pointer',
            opacity: submitted || !value.trim() ? 0.4 : 1,
            whiteSpace: 'nowrap',
            transition: 'opacity 0.15s',
          }}
        >
          Check
        </button>
      </div>

      {/* Feedback */}
      <div style={{ textAlign: 'center', minHeight: '22px', fontSize: '14px', fontWeight: 300, letterSpacing: '0.02em' }}>
        {submitted && (
          isCorrect
            ? <span style={{ color: '#3B6D11' }}>✓ Correct</span>
            : <span style={{ color: '#A32D2D' }}>Answer: {correctAnswer}</span>
        )}
      </div>
    </div>
  )
}  