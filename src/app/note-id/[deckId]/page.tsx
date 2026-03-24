'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import { getDeckById } from '@/lib/decks'
import { Deck } from '@/lib/types'

const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

// Piano key layout - single octave C4-B4
// whiteIndex = position among white keys (0-6)
const WHITE_KEY_NOTES = ['C','D','E','F','G','A','B']
const BLACK_KEY_NOTES = [
  { note: 'C#', afterWhite: 0 },
  { note: 'D#', afterWhite: 1 },
  { note: 'F#', afterWhite: 3 },
  { note: 'G#', afterWhite: 4 },
  { note: 'A#', afterWhite: 5 },
]
const KEY_W = 52
const KEY_H = 120
const BLACK_W = 32
const BLACK_H = 76

function notePitchClass(note: string) {
  return note.replace(/\d+$/, '').trim()
}

const ENHARMONICS: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
}

function answersMatch(played: string, target: string) {
  if (played === target) return true
  return ENHARMONICS[target] === played
}

export default function NoteIDExercise() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const deckId = params.deckId as string
  const inputMode = (searchParams.get('input') ?? 'letters') as 'letters' | 'piano'

  const [deck, setDeck] = useState<Deck | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(false)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const d = getDeckById(deckId)
    if (d) setDeck(d)
  }, [deckId])

  const cards = useMemo(() => {
    if (!deck) return []
    // Shuffle cards
    const arr = [...deck.cards]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [deck])

  const currentCard = cards[cardIndex]
  const targetNote = currentCard?.note ?? ''
  const targetPitchClass = notePitchClass(targetNote)

  const handleAnswer = useCallback((answer: string) => {
    if (feedback || done) return
    const isCorrect = answersMatch(answer, targetPitchClass)
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setTotal(t => t + 1)
    if (isCorrect) setCorrect(c => c + 1)

    setTimeout(() => {
      setFeedback(null)
      if (cardIndex >= cards.length - 1) {
        setDone(true)
      } else {
        setCardIndex(i => i + 1)
      }
    }, isCorrect ? 400 : 800)
  }, [feedback, done, cardIndex, cards.length, targetPitchClass])

  // Keyboard listener for letter mode
  useEffect(() => {
    if (inputMode !== 'letters') return
    function onKey(e: KeyboardEvent) {
      const letter = e.key.toUpperCase()
      if (NOTE_LETTERS.includes(letter)) handleAnswer(letter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inputMode, handleAnswer])

  if (!deck || cards.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#888780' }}>Loading…</p>
      </div>
    )
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const bgColor = feedback === 'correct' ? '#F0FBF4' : feedback === 'wrong' ? '#FFF0F0' : 'white'
  const borderColor = feedback === 'correct' ? '#4CAF50' : feedback === 'wrong' ? '#F09595' : '#D3D1C7'

  if (done) {
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    const bestKey = 'notelab-note-id-best-' + deckId
    const prevBest = typeof window !== 'undefined' ? parseFloat(localStorage.getItem(bestKey) ?? '0') : 0
    const currentTimeSec = parseFloat(finalTime)
    const isNewBest = prevBest === 0 || currentTimeSec < prevBest
    if (typeof window !== 'undefined' && isNewBest) localStorage.setItem(bestKey, finalTime)

    return (
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #D3D1C7', padding: '56px 48px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888780', marginBottom: '12px' }}>Session Complete</p>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '36px', color: '#1A1A18', marginBottom: '32px' }}>{deck.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '36px' }}>
            {[
              { num: Math.round((correct / total) * 100) + '%', label: 'Score' },
              { num: finalTime + 's', label: 'Time' },
              { num: prevBest > 0 ? (isNewBest ? finalTime : prevBest.toFixed(2)) + 's' : '—', label: isNewBest ? '🏆 Best' : 'Best' },
            ].map(({ num, label }) => (
              <div key={label}>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '32px', fontWeight: 300, color: '#1A1A18' }}>{num}</p>
                <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, color: '#888780', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => { setCardIndex(0); setCorrect(0); setTotal(0); setDone(false); setFeedback(null) }}
              style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
              Again
            </button>
            <button onClick={() => router.push('/note-id')}
              style={{ background: 'transparent', color: '#888780', border: '1px solid #D3D1C7', borderRadius: '10px', padding: '12px 28px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #D3D1C7' }}>
        <button onClick={() => router.push('/note-id')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, color: '#888780' }}>{cardIndex + 1} / {cards.length}</span>
          <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, color: '#888780' }}>{pct}%</span>
        </div>
        <div style={{ width: '60px' }} />
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: '#EDE8DF' }}>
        <div style={{ height: '100%', background: '#1A1A18', width: ((cardIndex / cards.length) * 100) + '%', transition: 'width 0.3s' }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: bgColor, border: '1px solid ' + borderColor, borderRadius: '20px', padding: '40px 48px', maxWidth: '520px', width: '100%', textAlign: 'center', transition: 'all 0.15s', boxShadow: '0 2px 20px rgba(26,26,24,0.06)' }}>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888780', marginBottom: '24px' }}>
            What note is this?
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            {currentCard.clef === 'grand'
              ? <GrandStaffCard note={targetNote} />
              : <StaffCard note={targetNote} clef={currentCard.clef ?? 'treble'} />
            }
          </div>

          {/* Feedback */}
          <div style={{ height: '24px', marginBottom: '16px' }}>
            {feedback === 'wrong' && (
              <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#E53935' }}>
                ✗ That's {targetPitchClass} — try again
              </p>
            )}
            {feedback === 'correct' && (
              <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#4CAF50' }}>
                ✓ {targetPitchClass}
              </p>
            )}
          </div>

          {/* Input */}
          {inputMode === 'letters' ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {NOTE_LETTERS.map(letter => (
                <button key={letter} onClick={() => handleAnswer(letter)}
                  style={{ width: '48px', height: '48px', borderRadius: '10px', border: '1px solid #D3D1C7', background: 'white', fontFamily: 'var(--font-cormorant), serif', fontSize: '22px', fontWeight: 400, color: '#1A1A18', cursor: 'pointer', transition: 'all 0.1s' }}>
                  {letter}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ position: 'relative', height: KEY_H + 'px', width: WHITE_KEY_NOTES.length * KEY_W + 'px', margin: '0 auto' }}>
              {/* White keys */}
              {WHITE_KEY_NOTES.map((note, i) => (
                <button key={note} onClick={() => handleAnswer(note)}
                  style={{ position: 'absolute', left: i * KEY_W, top: 0, width: KEY_W - 2, height: KEY_H, background: 'white', border: '1px solid #D3D1C7', borderRadius: '0 0 8px 8px', cursor: 'pointer', zIndex: 1, boxShadow: '0 3px 6px rgba(26,26,24,0.08)' }} />
              ))}
              {/* Black keys */}
              {BLACK_KEY_NOTES.map(({ note, afterWhite }) => (
                <button key={note} onClick={() => handleAnswer(note)}
                  style={{ position: 'absolute', left: (afterWhite + 1) * KEY_W - BLACK_W / 2, top: 0, width: BLACK_W, height: BLACK_H, background: '#1A1A18', borderRadius: '0 0 6px 6px', cursor: 'pointer', zIndex: 2, border: 'none', boxShadow: '0 4px 8px rgba(26,26,24,0.3)' }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
