'use client'

import { Suspense } from 'react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import MultiNoteStaff from '@/components/cards/MultiNoteStaff'
import { getDeckById } from '@/lib/decks'
import { Deck } from '@/lib/types'
import SightReadingSessionComplete from '@/components/sight-reading/SightReadingSessionComplete'
import { SIGHT_READING_LEVELS, type AnswerMode, type Clef } from '@/lib/sightReadingLevels'

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

  // Honor ?from=<path> for the back button (same convention as
  // StudyEngine). Falls back to router.back() history navigation
  // for direct-URL visitors who don't have a from hint.
  function goBack() {
    const from = searchParams.get('from')
    if (from && from.startsWith('/') && !from.startsWith('//')) {
      router.push(from)
      return
    }
    router.back()
  }

  const [deck, setDeck] = useState<Deck | null>(null)
  const [group, setGroup] = useState<NoteState[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [done, setDone] = useState(false)
  const startTimeRef = useRef(Date.now())
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
        setTimeout(() => { nextGroup(); processingRef.current = false }, 300)
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
        setTimeout(() => { nextGroup(); processingRef.current = false }, 600)
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
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      </div>
    )
  }

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const currentNote = group[activeIdx]?.note ?? ''
  const clef = (deck.cards[0]?.clef ?? 'treble') as 'treble' | 'bass' | 'grand'

  if (done) {
    const finalTimeMs = Date.now() - startTimeRef.current
    const finalTimeSec = finalTimeMs / 1000
    const bestKey = 'notelab-note-id-best-' + deckId
    const prevBest = typeof window !== 'undefined' ? parseFloat(localStorage.getItem(bestKey) ?? '0') : 0
    const isNewBest = prevBest === 0 || finalTimeSec < prevBest
    if (typeof window !== 'undefined' && isNewBest) localStorage.setItem(bestKey, finalTimeSec.toString())

    // Parse clef + level from the sight-read deck id (defensive
    // defaults for hand-typed URLs that don't match the pattern).
    const m = deckId.match(/^sight-read-(treble|bass|grand)-(.+)$/)
    const sightClef = (m?.[1] ?? 'treble') as Clef
    const suffix = m?.[2] ?? 'free'
    const level = SIGHT_READING_LEVELS[sightClef].find(l => l.deckSuffix === suffix)
    const levelLabel = level?.num ?? 'Custom'
    // input=keyboard-full → Full Piano badge; legacy keyboard maps
    // to Letters since Mini Piano is going away (Phase 2.3).
    const answerMode: AnswerMode =
      inputMode === 'keyboard-full' ? 'full-piano' : 'letters'

    function playAgain() {
      setRounds(0); setCorrect(0); setTotal(0); setDone(false)
      processingRef.current = false
      startTimeRef.current = Date.now()
      const notes = buildGroup(pool, groupSize)
      setGroup(notes.map((note, i) => ({
        note,
        status: (i === 0 ? 'active' : 'pending') as NoteStatus,
      })))
      setActiveIdx(0)
    }

    return (
      <SightReadingSessionComplete
        score={total > 0 ? correct / total : 0}
        correct={correct}
        total={total}
        elapsed={finalTimeMs}
        prevBest={prevBest}
        isNewBest={isNewBest}
        mode={answerMode}
        clef={sightClef}
        levelLabel={levelLabel}
        onPlayAgain={playAgain}
      />
    )
  }

  const activeStatus = group[activeIdx]?.status

  return (
    <div className="nl-sr-play-page">
      <header className="nl-sr-play-header">
        <button onClick={goBack} className="nl-sr-play-header__back">
          ← End session
        </button>
        <div className="nl-sr-play-header__meta">
          <div className="nl-sr-play-header__stat">
            <span className="nl-sr-play-header__label">Round</span>
            <span className="nl-sr-play-header__value">
              {rounds + 1} / {stopRounds}
            </span>
          </div>
          <div className="nl-sr-play-header__stat">
            <span className="nl-sr-play-header__label">Accuracy</span>
            <span className="nl-sr-play-header__value is-green">
              {total > 0 ? `${pct}%` : '—'}
            </span>
          </div>
        </div>
      </header>

      <div className="nl-sr-play-card">
        <p className="nl-sr-play-eyebrow">
          {inputMode === 'keyboard-full' || inputMode === 'keyboard'
            ? 'Play this note on the piano'
            : 'What note is this?'}
        </p>

        <div
          className={
            'nl-sr-play-staff' +
            (activeStatus === 'correct' ? ' is-correct' : '') +
            (activeStatus === 'wrong' ? ' is-wrong' : '')
          }
        >
          {groupSize === 1 ? (
            clef === 'grand'
              ? <GrandStaffCard note={currentNote} />
              : <StaffCard note={currentNote} clef={clef} />
          ) : (
            <MultiNoteStaff notes={group} clef={clef} />
          )}
        </div>

        {/* Feedback block below the staff — reserved min-height so
            the staff stays anchored between rounds. Single-note
            mode only; multi-note hides feedback per the legacy
            behaviour. */}
        {groupSize === 1 && (
          <div className="nl-sr-feedback-block">
            {activeStatus === 'correct' && (
              <span className="nl-sr-feedback-mark is-correct" aria-hidden>✓</span>
            )}
            {activeStatus === 'wrong' && (
              <>
                <span className="nl-sr-feedback-mark is-wrong" aria-hidden>✗</span>
                <span className="nl-sr-feedback-text is-wrong">
                  Correct answer was <b>{notePitchClass(currentNote)}</b>
                </span>
              </>
            )}
          </div>
        )}

        {/* Input */}
        {inputMode === 'letters' ? (
          <div className="nl-sr-ltr-grid">
            <div className="nl-sr-ltr-row">
              {SHARP_ROW.map((note, i) => note ? (
                <button
                  key={note}
                  onClick={() => handleAnswer(note)}
                  className="nl-sr-ltr-btn nl-sr-ltr-btn--accidental"
                >
                  {note}
                </button>
              ) : <div key={i} className="nl-sr-ltr-spacer" />)}
            </div>
            <div className="nl-sr-ltr-row nl-sr-ltr-row--naturals">
              {NOTE_LETTERS.map(letter => (
                <button
                  key={letter}
                  onClick={() => handleAnswer(letter)}
                  className="nl-sr-ltr-btn nl-sr-ltr-btn--natural"
                >
                  {letter}
                </button>
              ))}
            </div>
            <div className="nl-sr-ltr-row">
              {FLAT_ROW.map((note, i) => note ? (
                <button
                  key={note}
                  onClick={() => handleAnswer(note)}
                  className="nl-sr-ltr-btn nl-sr-ltr-btn--accidental"
                >
                  {note}
                </button>
              ) : <div key={i} className="nl-sr-ltr-spacer" />)}
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
                    style={{ position: 'absolute', left: i * KEY_W, top: 0, width: KEY_W - 2, height: KEY_H, background: '#ECE3CC', border: '1px solid #D9CFAE', borderRadius: '0 0 8px 8px', cursor: 'pointer', zIndex: 1, boxShadow: '0 3px 6px rgba(26,26,24,0.08)' }} />
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
  )
}

export default function NoteIDExercise() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      </div>
    }>
      <NoteIDExerciseInner />
    </Suspense>
  )
}
