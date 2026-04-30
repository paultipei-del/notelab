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

  const card = deck[idx]
  const total = deck.length
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100)
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

  // Keyboard shortcuts: Space to flip, 1/← to mark "still learning",
  // 2/→ to mark "got it". Saves a lot of clicking when running through a deck.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (done || deck.length === 0) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!flipped) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(true) }
        return
      }
      if (e.key === '1' || e.key === 'ArrowLeft')  { e.preventDefault(); handleGrade(false) }
      if (e.key === '2' || e.key === 'ArrowRight') { e.preventDefault(); handleGrade(true)  }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, idx, deck.length, done])

  if (deck.length === 0) return null

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

  // Shared face style — mirrors FlipCard's so every flashcard surface in the
  // app looks the same. The .nl-flip-face CSS class supplies the shadow +
  // hover states; the rest matches the padding/border/radius used there.
  const faceStyle: React.CSSProperties = {
    position: 'absolute', inset: 0,
    background: '#ECE3CC',
    borderRadius: '16px',
    border: '1px solid #D9CFAE',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '48px 40px',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    textAlign: 'center',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: F, fontSize: 'var(--nl-text-badge)',
    letterSpacing: '0.18em', textTransform: 'uppercase',
    color: '#7A7060', marginBottom: '24px',
  }

  return (
    <div>
      {/* Progress + keyboard hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${(idx / total) * 100}%`, height: '100%', background: accentColor, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', whiteSpace: 'nowrap' }}>{idx + 1} / {total}</span>
      </div>

      {/* Flippable card — matches FlipCard's geometry (maxWidth 680,
          minHeight clamp(200, 42dvh, 340), 0.5s cubic-bezier flip) so the
          look & feel is identical to the study engine's flashcards. */}
      <div className="nl-flip-card" style={{ width: '100%', maxWidth: '680px', margin: '0 auto 22px' }}>
        <div
          onClick={() => !flipped && setFlipped(true)}
          style={{
            width: '100%',
            minHeight: 'clamp(200px, 42dvh, 340px)',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            cursor: flipped ? 'default' : 'pointer',
          }}
        >
          {/* Front */}
          <div className="nl-flip-face" style={faceStyle}>
            <span style={labelStyle}>What does this mean?</span>
            <p style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 300,
              color: '#2A2318', margin: 0, lineHeight: 1.2, letterSpacing: '0.01em', textAlign: 'center' }}>
              {card.front}
            </p>
            {!flipped && (
              <span style={{ position: 'absolute', bottom: '20px', fontFamily: F,
                fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.08em',
                color: '#D9CFAE', textTransform: 'uppercase', display: 'flex',
                alignItems: 'center', gap: '8px' }}>
                tap or press <kbd style={kbdStyle}>Space</kbd> to reveal
              </span>
            )}
          </div>

          {/* Back */}
          <div className="nl-flip-face" style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
            <span style={labelStyle}>{card.front}</span>
            <p style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 4vw, 40px)', fontWeight: 300,
              color: '#2A2318', margin: 0, lineHeight: 1.3, textAlign: 'center', padding: '0 16px' }}>
              {card.back}
            </p>
          </div>
        </div>
      </div>

      {/* Grade buttons (flipped) or Reveal button (face-up) */}
      {flipped ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
          maxWidth: 680, margin: '0 auto' }}>
          <button
            onClick={() => handleGrade(false)}
            style={{
              background: '#FDF3ED', border: '1px solid #F0C4A8', borderRadius: '10px',
              padding: '14px 18px', fontFamily: F, fontSize: 'var(--nl-text-meta)',
              fontWeight: 500, color: '#B5402A', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            Still learning <kbd style={kbdStyle}>1</kbd>
          </button>
          <button
            onClick={() => handleGrade(true)}
            style={{
              background: '#1A1A18', border: '1px solid #1A1A18', borderRadius: '10px',
              padding: '14px 18px', fontFamily: F, fontSize: 'var(--nl-text-meta)',
              fontWeight: 600, color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            Got it ✓ <kbd style={{ ...kbdStyle, background: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.25)' }}>2</kbd>
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <button
            onClick={() => setFlipped(true)}
            style={{
              background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px',
              padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
            }}
          >
            Reveal definition
          </button>
        </div>
      )}
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  fontFamily: F, fontSize: 11, fontWeight: 600,
  background: '#EDE8DF', color: '#7A7060',
  border: '1px solid #D9CFAE', borderRadius: 4,
  padding: '1px 6px', lineHeight: 1.4,
}
