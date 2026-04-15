'use client'

import { useState, useEffect } from 'react'
import type { MCQuestion } from '@/lib/programs/cm-prep/questions'
import { shuffle } from '@/lib/programs/cm-prep/questions'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  questions: MCQuestion[]
  passingScore: number
  accentColor?: string
  onComplete: (score: number, total: number) => void
}

export default function MCQuiz({ questions, passingScore, accentColor = '#B5402A', onComplete }: Props) {
  const [shuffled, setShuffled] = useState<MCQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setShuffled(shuffle(questions).slice(0, Math.min(questions.length, 12)))
  }, [questions])

  if (shuffled.length === 0) return null

  const q = shuffled[idx]
  const total = shuffled.length
  const pct = Math.round((correct / total) * 100)
  const passed = pct / 100 >= passingScore

  function handleSelect(opt: string) {
    if (confirmed) return
    setSelected(opt)
  }

  function handleConfirm() {
    if (!selected || confirmed) return
    const isCorrect = selected === q.answer
    if (isCorrect) setCorrect(c => c + 1)
    setConfirmed(true)
  }

  function handleNext() {
    if (idx + 1 >= total) {
      const finalCorrect = confirmed && selected === q.answer ? correct : correct
      setDone(true)
      onComplete(
        (confirmed && selected === q.answer ? correct : correct) / total,
        total
      )
      return
    }
    setIdx(i => i + 1)
    setSelected(null)
    setConfirmed(false)
  }

  // Fix: we track correct count in state, need to account for last answer on finish
  function handleNextWithScore() {
    const wasCorrect = confirmed && selected === q.answer
    const finalCorrect = wasCorrect ? correct : correct  // already incremented
    if (idx + 1 >= total) {
      setDone(true)
      onComplete(correct / total, total)
      return
    }
    setIdx(i => i + 1)
    setSelected(null)
    setConfirmed(false)
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: passed ? '#EAF3DE' : '#FDF3ED',
          border: `2px solid ${passed ? '#C0DD97' : '#F0C4A8'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '32px',
        }}>
          {passed ? '✓' : '→'}
        </div>
        <p style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 300, color: '#2A2318', marginBottom: '8px' }}>
          {passed ? 'Well done' : 'Keep going'}
        </p>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', marginBottom: '6px' }}>
          {correct} / {total} correct — {pct}%
        </p>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0ACA4', marginBottom: '28px' }}>
          {passed
            ? `Passing score: ${Math.round(passingScore * 100)}% ✓`
            : `Passing score: ${Math.round(passingScore * 100)}% — try again to improve`}
        </p>
        {!passed && (
          <button
            onClick={() => {
              setShuffled(shuffle(questions).slice(0, Math.min(questions.length, 12)))
              setIdx(0)
              setSelected(null)
              setConfirmed(false)
              setCorrect(0)
              setDone(false)
            }}
            style={{
              background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px',
              padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
            }}
          >
            Try again →
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ flex: 1, height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${(idx / total) * 100}%`, height: '100%', background: accentColor, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', whiteSpace: 'nowrap' }}>
          {idx + 1} / {total}
        </span>
      </div>

      {/* Question */}
      <p style={{ fontFamily: SERIF, fontSize: 'clamp(17px, 2.5vw, 22px)', fontWeight: 400, color: '#2A2318', marginBottom: '24px', lineHeight: 1.4 }}>
        {q.q}
      </p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {q.options.map(opt => {
          const isSelected = selected === opt
          const isAnswer = opt === q.answer
          let bg = 'white'
          let border = '#DDD8CA'
          let color = '#2A2318'

          if (confirmed) {
            if (isAnswer) { bg = '#EAF3DE'; border = '#C0DD97'; color = '#2A5C0A' }
            else if (isSelected && !isAnswer) { bg = '#FDF3ED'; border = '#F0C4A8'; color = '#B5402A' }
          } else if (isSelected) {
            bg = '#F7F4ED'; border = '#1A1A18'
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              style={{
                background: bg, border: `1px solid ${border}`, borderRadius: '10px',
                padding: '14px 18px', fontFamily: F, fontSize: 'var(--nl-text-meta)',
                color, textAlign: 'left', cursor: confirmed ? 'default' : 'pointer',
                transition: 'border-color 0.12s, background 0.12s',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}
            >
              {confirmed && isAnswer && <span style={{ fontSize: '14px' }}>✓</span>}
              {confirmed && isSelected && !isAnswer && <span style={{ fontSize: '14px' }}>✗</span>}
              {opt}
            </button>
          )
        })}
      </div>

      {/* Action */}
      {!confirmed ? (
        <button
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            background: selected ? '#1A1A18' : '#EDE8DF',
            color: selected ? 'white' : '#B0ACA4',
            border: 'none', borderRadius: '10px',
            padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)',
            cursor: selected ? 'pointer' : 'default', transition: 'background 0.15s',
          }}
        >
          Check answer
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {selected !== q.answer && (
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0 }}>
              Correct: <strong style={{ color: '#2A5C0A' }}>{q.answer}</strong>
            </p>
          )}
          <button
            onClick={handleNextWithScore}
            style={{
              background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px',
              padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
            }}
          >
            {idx + 1 >= total ? 'See results' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}
