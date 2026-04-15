'use client'

import { useState, useEffect } from 'react'
import { shuffle } from '@/lib/programs/cm-prep/questions'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface FlashCard {
  id: number
  front: string
  back: string
}

interface Props {
  cards: FlashCard[]
  passingScore: number
  accentColor?: string
  onComplete: (score: number, total: number) => void
}

export default function FlashSession({ cards, passingScore, accentColor = '#B5402A', onComplete }: Props) {
  const [deck, setDeck] = useState<FlashCard[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => { setDeck(shuffle(cards)) }, [cards])

  if (deck.length === 0) return null

  const card = deck[idx]
  const total = deck.length
  const pct = Math.round((correct / total) * 100)
  const passed = pct / 100 >= passingScore

  function handleGrade(knew: boolean) {
    if (knew) setCorrect(c => c + 1)
    if (idx + 1 >= total) {
      setDone(true)
      onComplete((knew ? correct + 1 : correct) / total, total)
      return
    }
    setIdx(i => i + 1)
    setFlipped(false)
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
          {passed ? 'Well done' : 'Keep reviewing'}
        </p>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', marginBottom: '6px' }}>
          {correct} / {total} known — {pct}%
        </p>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0ACA4', marginBottom: '28px' }}>
          {passed ? `Passing score: ${Math.round(passingScore * 100)}% ✓` : `Passing score: ${Math.round(passingScore * 100)}%`}
        </p>
        {!passed && (
          <button
            onClick={() => { setDeck(shuffle(cards)); setIdx(0); setFlipped(false); setCorrect(0); setDone(false) }}
            style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
          >Review again →</button>
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
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', whiteSpace: 'nowrap' }}>{idx + 1} / {total}</span>
      </div>

      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        style={{
          background: flipped ? '#FDFAF3' : 'white',
          border: '1px solid #DDD8CA', borderRadius: '16px',
          padding: '36px 28px', marginBottom: '20px',
          minHeight: '160px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: flipped ? 'default' : 'pointer',
          transition: 'background 0.2s',
          textAlign: 'center',
        }}
      >
        {!flipped ? (
          <>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '12px' }}>
              What does this mean?
            </p>
            <p style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 400, color: '#2A2318', margin: 0, lineHeight: 1.2 }}>
              {card.front}
            </p>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', marginTop: '20px', margin: '20px 0 0' }}>
              Tap to reveal
            </p>
          </>
        ) : (
          <>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '12px' }}>
              {card.front}
            </p>
            <p style={{ fontFamily: SERIF, fontSize: 'clamp(17px, 2.5vw, 22px)', fontWeight: 400, color: '#2A2318', margin: 0, lineHeight: 1.5 }}>
              {card.back}
            </p>
          </>
        )}
      </div>

      {/* Grade buttons */}
      {flipped ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={() => handleGrade(false)}
            style={{
              background: '#FDF3ED', border: '1px solid #F0C4A8', borderRadius: '10px',
              padding: '14px', fontFamily: F, fontSize: 'var(--nl-text-meta)',
              color: '#B5402A', cursor: 'pointer',
            }}
          >
            Still learning
          </button>
          <button
            onClick={() => handleGrade(true)}
            style={{
              background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: '10px',
              padding: '14px', fontFamily: F, fontSize: 'var(--nl-text-meta)',
              color: '#2A5C0A', cursor: 'pointer',
            }}
          >
            Got it ✓
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          style={{
            background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px',
            padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
          }}
        >
          Reveal definition
        </button>
      )}
    </div>
  )
}
