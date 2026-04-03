'use client'

import { Suspense } from 'react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import MultiNoteStaff from '@/components/cards/MultiNoteStaff'
import { getDeckById } from '@/lib/decks'
import { Deck } from '@/lib/types'

const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

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

// 3-row accidental button layout
// Top row: sharps, Middle: naturals, Bottom: flats
const SHARP_ROW: (string | null)[] = ['C#', 'D#', null, 'F#', 'G#', 'A#', null]
const FLAT_ROW: (string | null)[]  = ['Db', 'Eb', null, 'Gb', 'Ab', 'Bb', null]

function notePitchClass(note: string) {
  return note.replace(/\d+$/, '').trim()
}

const ENHARMONICS: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
}

function answersMatch(played: string, target: string) {
  return played === target
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildGroup(pool: string[], size: number): string[] {
  const group: string[] = []
  const shuffled = shuffleArr(pool)
  for (const note of shuffled) {
    if (group.length === 0 || note !== group[group.length - 1]) {
      group.push(note)
    }
    if (group.length >= size) break
  }
  // Fill remaining if not enough unique notes
  while (group.length < size) {
    const candidates = pool.filter(n => n !== group[group.length - 1])
    group.push(candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0])
  }
  return group
}

type NoteStatus = 'pending' | 'active' | 'correct' | 'wrong'

interface NoteState {
  note: string
  status: NoteStatus
}

function NoteIDExerciseInner() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const deckId = params.deckId as string
  const inputMode = (searchParams.get('input') ?? 'letters') as 'letters' | 'keyboard' | 'keyboard-full'
  const groupSize = parseInt(searchParams.get('group') ?? '1')

  const [deck, setDeck] = useState<Deck | null>(null)
  const [group, setGroup] = useState<NoteState[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [done, setDone] = useState(false)
  const [startTime] = useState(Date.now())
  const processingRef = useRef(false)
  const wrongIndicesRef = useRef<Set<number>>(new Set())

  const stopRounds = parseInt(searchParams.get('stopValue') ?? '10')

  useEffect(() => {
    const d = getDeckById(deckId)
    if (d) setDeck(d)
  }, [deckId])

  const pool = useMemo(() => {
    if (!deck) return []
    return deck.cards.map(c => c.note ?? c.front).filter(Boolean) as string[]
  }, [deck])

  // Build initial group
  useEffect(() => {
    if (pool.length === 0) return
    const notes = buildGroup(pool, groupSize)
    setGroup(notes.map((note, i) => ({ note, status: i === 0 ? 'active' : 'pending' })))
    setActiveIdx(0)
    wrongIndicesRef.current = new Set()
  }, [pool, groupSize])

  function nextGroup() {
    const newRounds = rounds + 1
    setRounds(newRounds)
    if (newRounds >= stopRounds) {
      setDone(true)
      return
    }
    const notes = buildGroup(pool, groupSize)
    setGroup(notes.map((note, i) => ({ note, status: i === 0 ? 'active' : 'pending' })))
    setActiveIdx(0)
    processingRef.current = false
    wrongIndicesRef.current = new Set()
  }

  const handleAnswer = useCallback((answer: string) => {
    if (done || group.length === 0) return
    const current = group[activeIdx]
    if (!current) return
    if (wrongIndicesRef.current.has(activeIdx)) return  // locked after wrong answer
    if (processingRef.current || current.status !== 'active') return
    // In multi-note mode, once a note is wrong it's locked


    const targetPitch = notePitchClass(current.note)
    const isCorrect = answersMatch(answer, targetPitch)
    setTotal(t => t + 1)
    if (isCorrect) setCorrect(c => c + 1)
    if (!isCorrect && groupSize > 1) wrongIndicesRef.current.add(activeIdx)

    // Update group state
    setGroup(prev => prev.map((n, i) => {
      if (i === activeIdx) return { ...n, status: isCorrect ? 'correct' : 'wrong' }
      if (isCorrect && i === activeIdx + 1) return { ...n, status: 'active' }
      return n
    }))

    processingRef.current = true
    if (isCorrect) {
      const isLastInGroup = activeIdx >= group.length - 1
      if (isLastInGroup) {
        setTimeout(() => { nextGroup(); processingRef.current = false }, 600)
      } else {
        setTimeout(() => {
          setActiveIdx(i => i + 1)
          processingRef.current = false
        }, 400)
      }
    } else {
      // Wrong: show correct answer briefly then advance
      setGroup(prev => prev.map((n, i) => {
        if (i === activeIdx) return { ...n, status: 'wrong' as const }
        return n
      }))
      const isLastInGroup = activeIdx >= group.length - 1
      if (isLastInGroup) {
        setTimeout(() => { nextGroup(); processingRef.current = false }, 1000)
      } else {
        setTimeout(() => {
          setGroup(prev => prev.map((n, i) => {
            if (i === activeIdx + 1) return { ...n, status: 'active' as const }
            return n
          }))
          setActiveIdx(i => i + 1)
          processingRef.current = false
        }, 1000)
      }
    }
  }, [done, group, activeIdx, rounds, stopRounds, pool, groupSize])

  // Keyboard listener
  useEffect(() => {
    if (inputMode !== 'letters') return
    function onKey(e: KeyboardEvent) {
      const letter = e.key.toUpperCase()
      if (NOTE_LETTERS.includes(letter)) handleAnswer(letter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inputMode, handleAnswer])

  if (!deck || pool.length === 0 || group.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#888780' }}>Loading…</p>
      </div>
    )
  }

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const currentNote = group[activeIdx]?.note ?? ''
  const clef = (deck.cards[0]?.clef ?? 'treble') as 'treble' | 'bass' | 'grand'

  if (done) {
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    const bestKey = 'notelab-note-id-best-' + deckId
    const prevBest = typeof window !== 'undefined' ? parseFloat(localStorage.getItem(bestKey) ?? '0') : 0
    const currentTimeSec = parseFloat(finalTime)
    const isNewBest = prevBest === 0 || currentTimeSec < prevBest
    if (typeof window !== 'undefined' && isNewBest) localStorage.setItem(bestKey, finalTime)

    return (
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px,2vh,24px)' }}>
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #D3D1C7', padding: '56px 48px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px' }}>Session Complete</p>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '36px', color: '#1A1A18', marginBottom: '32px' }}>{deck.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '36px' }}>
            {[
              { num: Math.round((correct / total) * 100) + '%', label: 'Score' },
              { num: finalTime + 's', label: 'Time' },
              { num: prevBest > 0 ? (isNewBest ? finalTime : prevBest.toFixed(2)) + 's' : '—', label: isNewBest ? '🏆 Best' : 'Best' },
            ].map(({ num, label }) => (
              <div key={label}>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '32px', fontWeight: 300, color: '#1A1A18' }}>{num}</p>
                <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, color: '#888780', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{label}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => { setRounds(0); setCorrect(0); setTotal(0); setDone(false); processingRef.current = false; const notes = buildGroup(pool, groupSize); setGroup(notes.map((note, i) => ({ note, status: (i === 0 ? 'active' : 'pending') as NoteStatus }))); setActiveIdx(0) }}
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

  const bgColor = group[activeIdx]?.status === 'wrong' ? '#FFF0F0' : 'white'
  const borderColor = group[activeIdx]?.status === 'wrong' ? '#F09595' : '#D3D1C7'

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #D3D1C7' }}>
        <button onClick={() => router.push('/note-id')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, color: '#888780' }}>Round {rounds + 1} / {stopRounds}</span>
          <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, color: '#888780' }}>{pct}%</span>
        </div>
        <div style={{ width: '60px' }} />
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: '#EDE8DF' }}>
        <div style={{ height: '100%', background: '#1A1A18', width: (rounds / stopRounds * 100) + '%', transition: 'width 0.3s' }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(4px,1vh,12px)' }}>
        <div style={{ background: bgColor, border: '1px solid ' + borderColor, borderRadius: '20px', padding: 'clamp(8px,1.5vh,24px) clamp(12px,2vw,24px)', maxWidth: '720px', width: '100%', textAlign: 'center', transition: 'all 0.15s', boxShadow: '0 2px 20px rgba(26,26,24,0.06)' }}>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: 'clamp(4px,1vh,12px)' }}>
            What note is this?
          </p>

          {/* Staff */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(4px,1vh,16px)', overflowX: 'auto' }}>
            {groupSize === 1 ? (
              clef === 'grand'
                ? <GrandStaffCard note={currentNote} />
                : <StaffCard note={currentNote} clef={clef} />
            ) : (
              <MultiNoteStaff notes={group} clef={clef} />
            )}
          </div>

          {/* Feedback indicator + correct answer for single note */}
          {groupSize === 1 && (
            <div style={{ textAlign: 'center' as const, marginBottom: groupSize === 1 ? '4px' : '0', minHeight: groupSize === 1 ? 'clamp(40px,8vh,64px)' : '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
              {group[activeIdx]?.status === 'correct' && (
                <span style={{ fontSize: '36px', color: '#4CAF50', lineHeight: 1 }}>✓</span>
              )}
              {group[activeIdx]?.status === 'wrong' && (
                <>
                  <span style={{ fontSize: '36px', color: '#E53935', lineHeight: 1, marginBottom: '4px' }}>✗</span>
                  <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#E53935', marginBottom: '2px' }}>Correct answer</p>
                  <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '28px', fontWeight: 300, color: '#1A1A18' }}>
                    {notePitchClass(currentNote)}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Input */}
          {inputMode === 'letters' ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '4px' }}>
              {/* Sharps row */}
              <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'center' }}>
                {SHARP_ROW.map((note, i) => note ? (
                  <button key={note} onClick={() => handleAnswer(note)}
                    style={{ flex: 1, maxWidth: '52px', height: '34px', borderRadius: '8px', border: '1px solid #D3D1C7', background: '#F5F2EC', fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, color: '#888780', cursor: 'pointer' }}>
                    {note}
                  </button>
                ) : <div key={i} style={{ flex: 1, maxWidth: '52px' }} />)}
              </div>
              {/* Naturals row */}
              <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'center' }}>
                {NOTE_LETTERS.map(letter => (
                  <button key={letter} onClick={() => handleAnswer(letter)}
                    style={{ flex: 1, maxWidth: '52px', height: '48px', borderRadius: '10px', border: '1px solid #D3D1C7', background: 'white', fontFamily: 'var(--font-cormorant), serif', fontSize: '22px', fontWeight: 400, color: '#1A1A18', cursor: 'pointer', boxShadow: '0 2px 6px rgba(26,26,24,0.06)' }}>
                    {letter}
                  </button>
                ))}
              </div>
              {/* Flats row */}
              <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'center' }}>
                {FLAT_ROW.map((note, i) => note ? (
                  <button key={note} onClick={() => handleAnswer(note)}
                    style={{ flex: 1, maxWidth: '52px', height: '34px', borderRadius: '8px', border: '1px solid #D3D1C7', background: '#F5F2EC', fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, color: '#888780', cursor: 'pointer' }}>
                    {note}
                  </button>
                ) : <div key={i} style={{ flex: 1, maxWidth: '52px' }} />)}
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: KEY_H + 'px', width: WHITE_KEY_NOTES.length * KEY_W + 'px',
                transformOrigin: 'top left',
                transform: `scale(${1})`,
                maxWidth: '100%',
              }} ref={(el) => {
                if (!el) return
                const parent = el.parentElement
                if (!parent) return
                const scale = Math.min(1, parent.offsetWidth / (WHITE_KEY_NOTES.length * KEY_W))
                el.style.transform = `scale(${scale})`
                el.parentElement!.style.height = (KEY_H * scale) + 'px'
              }}>
                {WHITE_KEY_NOTES.map((note, i) => (
                  <button key={note} onClick={() => handleAnswer(note)}
                    style={{ position: 'absolute', left: i * KEY_W, top: 0, width: KEY_W - 2, height: KEY_H, background: 'white', border: '1px solid #D3D1C7', borderRadius: '0 0 8px 8px', cursor: 'pointer', zIndex: 1, boxShadow: '0 3px 6px rgba(26,26,24,0.08)' }} />
                ))}
                {BLACK_KEY_NOTES.map(({ note, afterWhite }) => (
                  <button key={note} onClick={() => handleAnswer(note)}
                    style={{ position: 'absolute', left: (afterWhite + 1) * KEY_W - BLACK_W / 2, top: 0, width: BLACK_W, height: BLACK_H, background: '#1A1A18', borderRadius: '0 0 6px 6px', cursor: 'pointer', zIndex: 2, border: 'none', boxShadow: '0 4px 8px rgba(26,26,24,0.3)' }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NoteIDExercise() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#888780' }}>Loading…</p>
      </div>
    }>
      <NoteIDExerciseInner />
    </Suspense>
  )
}
