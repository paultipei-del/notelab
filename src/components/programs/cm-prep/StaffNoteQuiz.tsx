'use client'

import { useState, useEffect } from 'react'
import StaffCard from '@/components/cards/StaffCard'
import type { StaffNoteItem } from '@/lib/programs/cm-prep/questions'
import { shuffle } from '@/lib/programs/cm-prep/questions'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const NOTE_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

interface Props {
  pool: StaffNoteItem[]
  sessionLength?: number
  passingScore: number
  accentColor?: string
  onComplete: (score: number, total: number) => void
}

export default function StaffNoteQuiz({
  pool,
  sessionLength = 15,
  passingScore,
  accentColor = '#B5402A',
  onComplete,
}: Props) {
  const [items, setItems] = useState<StaffNoteItem[]>([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Expand pool so same note can appear multiple times; shuffle; limit to sessionLength
    const expanded: StaffNoteItem[] = []
    const reps = Math.ceil(sessionLength / pool.length) + 1
    for (let i = 0; i < reps; i++) expanded.push(...pool)
    setItems(shuffle(expanded).slice(0, sessionLength))
  }, [pool, sessionLength])

  if (items.length === 0) return null

  const item = items[idx]
  const total = items.length
  const pct = Math.round((correct / total) * 100)
  const passed = pct / 100 >= passingScore

  function handleSelect(name: string) {
    if (confirmed) return
    setSelected(name)
  }

  function handleConfirm() {
    if (!selected || confirmed) return
    if (selected === item.answer) setCorrect(c => c + 1)
    setConfirmed(true)
  }

  function handleNext() {
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
            : `Passing score: ${Math.round(passingScore * 100)}% — practice more to improve`}
        </p>
        {!passed && (
          <button
            onClick={() => {
              const expanded: StaffNoteItem[] = []
              const reps = Math.ceil(sessionLength / pool.length) + 1
              for (let i = 0; i < reps; i++) expanded.push(...pool)
              setItems(shuffle(expanded).slice(0, sessionLength))
              setIdx(0); setSelected(null); setConfirmed(false); setCorrect(0); setDone(false)
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
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${(idx / total) * 100}%`, height: '100%', background: accentColor, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', whiteSpace: 'nowrap' }}>
          {idx + 1} / {total}
        </span>
      </div>

      {/* Clef label */}
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — name this note
      </p>

      {/* Staff */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <StaffCard note={item.note} clef={item.clef} />
      </div>

      {/* Note name buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '24px' }}>
        {NOTE_NAMES.map(name => {
          const isSelected = selected === name
          const isAnswer = name === item.answer
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
              key={name}
              onClick={() => handleSelect(name)}
              style={{
                background: bg, border: `1px solid ${border}`, borderRadius: '10px',
                padding: '14px 4px', fontFamily: SERIF, fontSize: '20px', fontWeight: 400,
                color, cursor: confirmed ? 'default' : 'pointer',
                transition: 'border-color 0.12s, background 0.12s',
              }}
            >
              {name}
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
          {selected !== item.answer && (
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0 }}>
              Correct answer: <strong style={{ color: '#2A5C0A' }}>{item.answer}</strong>
            </p>
          )}
          <button
            onClick={handleNext}
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
