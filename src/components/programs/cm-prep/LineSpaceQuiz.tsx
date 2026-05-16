'use client'

import { useState, useEffect } from 'react'
import StaffCard from '@/components/cards/StaffCard'
import type { LineSpaceItem } from '@/lib/programs/cm-prep/questions'
import { shuffle } from '@/lib/programs/cm-prep/questions'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  pool: LineSpaceItem[]
  sessionLength?: number
  passingScore: number
  accentColor?: string
  onComplete: (score: number, total: number) => void
}

export default function LineSpaceQuiz({
  pool,
  sessionLength = 12,
  passingScore,
  accentColor = '#B5402A',
  onComplete,
}: Props) {
  const [items, setItems] = useState<LineSpaceItem[]>([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<'line' | 'space' | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  function buildItems() {
    const expanded: LineSpaceItem[] = []
    const reps = Math.ceil(sessionLength / pool.length) + 1
    for (let i = 0; i < reps; i++) expanded.push(...pool)
    return shuffle(expanded).slice(0, sessionLength)
  }

  useEffect(() => { setItems(buildItems()) }, [pool, sessionLength])

  if (items.length === 0) return null

  const item = items[idx]
  const total = items.length
  const pct = Math.round((correct / total) * 100)
  const passed = pct / 100 >= passingScore

  function handleSelect(choice: 'line' | 'space') {
    if (confirmed) return
    setSelected(choice)
  }

  function handleConfirm() {
    if (!selected || confirmed) return
    const isCorrect = (selected === 'line') === item.isLine
    if (isCorrect) setCorrect(c => c + 1)
    setConfirmed(true)
  }

  function handleNext() {
    if (idx + 1 >= total) { setDone(true); onComplete(correct / total, total); return }
    setIdx(i => i + 1); setSelected(null); setConfirmed(false)
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: passed ? 'var(--forest-soft)' : '#FDF3ED',
          border: `2px solid ${passed ? 'rgba(45, 90, 62, 0.32)' : '#F0C4A8'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '32px',
          color: passed ? 'var(--forest)' : '#B5402A',
        }}>
          {passed ? '✓' : '→'}
        </div>
        <p style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 300, color: '#2A2318', marginBottom: '8px' }}>
          {passed ? 'Well done' : 'Keep going'}
        </p>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', marginBottom: '6px' }}>
          {correct} / {total} correct · {pct}%
        </p>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0ACA4', marginBottom: '28px' }}>
          {passed ? `Passing score: ${Math.round(passingScore * 100)}% ✓` : `Passing score: ${Math.round(passingScore * 100)}%`}
        </p>
        {!passed && (
          <button
            onClick={() => { setItems(buildItems()); setIdx(0); setSelected(null); setConfirmed(false); setCorrect(0); setDone(false) }}
            style={{ background: 'var(--oxblood)', color: '#FDFBF5', border: '1px solid var(--oxblood)', borderRadius: '10px', padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
          >Try again →</button>
        )}
      </div>
    )
  }

  const correctChoice = item.isLine ? 'line' : 'space'

  function choiceBg(choice: 'line' | 'space') {
    if (!confirmed) return selected === choice ? '#F7F4ED' : 'white'
    if (choice === correctChoice) return 'var(--forest-soft)'
    if (selected === choice && choice !== correctChoice) return 'var(--oxblood-tint)'
    return 'white'
  }
  function choiceBorder(choice: 'line' | 'space') {
    if (!confirmed) return selected === choice ? '#1A1A18' : '#D9CFAE'
    if (choice === correctChoice) return 'var(--forest)'
    if (selected === choice && choice !== correctChoice) return 'var(--oxblood)'
    return '#D9CFAE'
  }
  function choiceColor(choice: 'line' | 'space') {
    if (!confirmed) return '#2A2318'
    if (choice === correctChoice) return 'var(--forest)'
    if (selected === choice && choice !== correctChoice) return 'var(--oxblood)'
    return '#2A2318'
  }

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${(idx / total) * 100}%`, height: '100%', background: accentColor, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', whiteSpace: 'nowrap' }}>{idx + 1} / {total}</span>
      </div>

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        Treble clef · is this note on a line or in a space?
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
        <StaffCard note={item.note} clef={item.clef} />
      </div>

      {/* Binary choice */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {(['line', 'space'] as const).map(choice => (
          <button
            key={choice}
            onClick={() => handleSelect(choice)}
            style={{
              background: choiceBg(choice), border: `1px solid ${choiceBorder(choice)}`,
              borderRadius: '12px', padding: '20px', fontFamily: SERIF,
              fontSize: '22px', fontWeight: 400, color: choiceColor(choice),
              cursor: confirmed ? 'default' : 'pointer',
              transition: 'border-color 0.12s, background 0.12s',
            }}
          >
            {confirmed && choice === correctChoice && '✓ '}
            {confirmed && selected === choice && choice !== correctChoice && '✗ '}
            {choice.charAt(0).toUpperCase() + choice.slice(1)}
          </button>
        ))}
      </div>

      {/* Explanation slot — always rendered to keep card height stable */}
      <div style={{ minHeight: '24px', marginBottom: '12px' }}>
        {confirmed && selected !== correctChoice && (
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: 'var(--oxblood)', margin: 0 }}>
            ✗ This note is on a <strong>{correctChoice}</strong>
          </p>
        )}
      </div>

      {!confirmed ? (
        <button
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            background: selected ? 'var(--oxblood)' : '#EDE8DF', color: selected ? '#FDFBF5' : '#B0ACA4',
            border: selected ? '1px solid var(--oxblood)' : 'none', borderRadius: '10px', padding: '12px 28px',
            fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: selected ? 'pointer' : 'default',
          }}
        >Check answer</button>
      ) : (
        <button
          onClick={handleNext}
          style={{ background: 'var(--oxblood)', color: '#FDFBF5', border: '1px solid var(--oxblood)', borderRadius: '10px', padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
        >
          {idx + 1 >= total ? 'See results' : 'Next →'}
        </button>
      )}
    </div>
  )
}
