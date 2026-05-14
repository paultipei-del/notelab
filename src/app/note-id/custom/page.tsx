'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import MultiNoteStaff from '@/components/cards/MultiNoteStaff'
import { SIGHT_READ_DECKS } from '@/lib/sightReadDecks'
import * as Tone from 'tone'
import { GRAND_STAFF_DECKS } from '@/lib/grandStaffDecks'
import SightReadingSessionComplete from '@/components/sight-reading/SightReadingSessionComplete'
import SightReadingFullPiano from '@/components/sight-reading/SightReadingFullPiano'
import type { AnswerMode, Clef } from '@/lib/sightReadingLevels'

const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const SHARP_ROW: (string | null)[] = ['C#', 'D#', null, 'F#', 'G#', 'A#', null]
const FLAT_ROW: (string | null)[]  = ['Db', 'Eb', null, 'Gb', 'Ab', 'Bb', null]

// Mini Piano JSX deleted in Phase 2.3b.3. Full Piano keys live in
// SightReadingFullPiano.tsx — both /note-id play screens render the
// same 2-octave cream keyboard.

// Note classification for treble clef
const TREBLE_LINE_NOTES = new Set(['E4','G4','B4','D5','F5'])
const TREBLE_SPACE_NOTES = new Set(['F4','A4','C5','E5'])
const TREBLE_LEDGER_NOTES = new Set([
  'C4','B3',           // below staff — middle C ledger line, space below
  'A5','B5','C6',      // above staff — ledger lines
])
const BASS_LINE_NOTES = new Set(['G2','B2','D3','F3','A3'])
const BASS_SPACE_NOTES = new Set(['A2','C3','E3','G3','B3'])
const BASS_LEDGER_NOTES = new Set([
  'E2',                // below staff — E2 ledger line only
  'C4','D4',           // above staff — middle C ledger line and space
])
// Grand staff — treble staff E4-C6, bass staff G2-B3, ledger = C4/D4 between + extremes
const GRAND_TREBLE_LINE_NOTES = new Set(['E4','G4','B4','D5','F5'])
const GRAND_TREBLE_SPACE_NOTES = new Set(['F4','A4','C5','E5'])
const GRAND_TREBLE_LEDGER_NOTES = new Set(['A5','B5','C6','C4'])
const GRAND_BASS_LINE_NOTES = new Set(['G2','B2','D3','F3','A3'])
const GRAND_BASS_SPACE_NOTES = new Set(['A2','C3','E3','G3','B3'])
const GRAND_BASS_LEDGER_NOTES = new Set(['E2','F2'])

const ENHARMONICS: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#', 'A#': 'Bb', 'Bb': 'A#',
}

function answersMatch(played: string, target: string) {
  return played === target
}

function notePitchClass(note: string) {
  return note.replace(/\d+$/, '').trim()
}

function isAccidental(note: string) {
  return note.includes('#') || note.includes('b')
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
    const last = group[group.length - 1]
    if (group.length === 0 || note !== last) {
      group.push(note)
    }
    if (group.length >= size) break
  }
  while (group.length < size) {
    const last = group[group.length - 1]
    const candidates = pool.filter(n => n !== last)
    group.push(candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : pool[0])
  }
  return group
}

type NoteStatus = 'pending' | 'active' | 'correct' | 'wrong'
interface NoteState { note: string; status: NoteStatus }

function CustomNoteIDInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const clef = (searchParams.get('clef') ?? 'treble') as 'treble' | 'bass' | 'grand'
  const filters = (searchParams.get('filters') ?? 'lines,spaces').split(',')
  const useAccidentals = searchParams.get('accidentals') === '1'
  // Normalize legacy ?input=keyboard (Mini Piano, removed in Phase
  // 2.3b.3) to keyboard-full so hand-typed/bookmarked URLs still
  // land users on a real input widget.
  const rawInputMode = searchParams.get('input') ?? 'letters'
  const inputMode: 'letters' | 'keyboard-full' =
    rawInputMode === 'letters' ? 'letters' : 'keyboard-full'
  const groupSize = parseInt(searchParams.get('group') ?? '1')
  const playCorrectNotes = searchParams.get('playCorrect') === '1'
  const stopMode = searchParams.get('stopMode') ?? 'exercises'
  const stopValue = parseInt(searchParams.get('stopValue') ?? '10')

  // Honor ?from=<path> for the back button (same convention as
  // StudyEngine + /note-id/[deckId]).
  function goBack() {
    const from = searchParams.get('from')
    if (from && from.startsWith('/') && !from.startsWith('//')) {
      router.push(from)
      return
    }
    router.back()
  }

  const [group, setGroup] = useState<NoteState[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [done, setDone] = useState(false)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [wrongNote, setWrongNote] = useState<string | null>(null)

  function playWrongSound() {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(180, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch {}
  }
  const [showAccidentals, setShowAccidentals] = useState(false)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const samplerRef = useRef<Tone.Sampler | null>(null)

  // Init Salamander sampler
  useEffect(() => {
    if (!playCorrectNotes) return
    const sampler = new Tone.Sampler({
      urls: {
        A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
        A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
        A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
        A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
        A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
        A5: 'A5.mp3', C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
        A6: 'A6.mp3', C7: 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
        A7: 'A7.mp3', C8: 'C8.mp3',
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => { samplerRef.current = sampler },
    }).toDestination()
    return () => { sampler.dispose() }
  }, [playCorrectNotes])
  const processingRef = useRef(false)
  const wrongIndicesRef = useRef<Set<number>>(new Set())

  // Timer for minutes mode
  useEffect(() => {
    if (stopMode !== 'minutes' || done) return
    const interval = setInterval(() => {
      const secs = (Date.now() - startTime) / 1000
      setElapsed(secs)
      if (secs >= stopValue * 60) setDone(true)
    }, 1000)
    return () => clearInterval(interval)
  }, [stopMode, stopValue, startTime, done])

  // Build pool from config
  const pool = useMemo(() => {
    // Explicit note sets — no filtering from decks, just defined directly
    const NOTES: Record<string, { lines: string[], spaces: string[], ledger: string[] }> = {
      treble: {
        lines:  ['E4','G4','B4','D5','F5'],
        spaces: ['F4','A4','C5','E5'],
        ledger: ['A3','B3','C4','A5','B5','C6'],
      },
      bass: {
        lines:  ['G2','B2','D3','F3','A3'],
        spaces: ['A2','C3','E3','G3','B3'],
        ledger: ['C2','D2','E2','C4','D4','E4'],
      },
      grand: {
        lines:  ['E4','G4','B4','D5','F5','G2','B2','D3','F3','A3'],
        spaces: ['F4','A4','C5','E5','A2','C3','E3','G3','B3'],
        ledger: ['A3','B3','C4','A5','B5','C6','C2','D2','E2'],
      },
    }

    const set = NOTES[clef]
    const naturalPool: string[] = []
    if (filters.includes('lines')) naturalPool.push(...set.lines)
    if (filters.includes('spaces')) naturalPool.push(...set.spaces)
    if (filters.includes('ledger')) naturalPool.push(...set.ledger)

    if (!useAccidentals) return naturalPool

    // Add accidentals for each natural note in pool
    const ACCIDENTAL_PAIRS: Record<string, string[]> = {
      'C4': ['C#4','Db4'], 'D4': ['D#4','Eb4'], 'F4': ['F#4','Gb4'],
      'G4': ['G#4','Ab4'], 'A4': ['A#4','Bb4'],
      'C5': ['C#5','Db5'], 'D5': ['D#5','Eb5'], 'F5': ['F#5','Gb5'],
      'G5': ['G#5','Ab5'], 'A5': ['A#5','Bb5'],
      'C3': ['C#3','Db3'], 'D3': ['D#3','Eb3'], 'F3': ['F#3','Gb3'],
      'G3': ['G#3','Ab3'], 'A3': ['A#3','Bb3'],
      'C2': ['C#2','Db2'], 'D2': ['D#2','Eb2'], 'F2': ['F#2','Gb2'],
      'G2': ['G#2','Ab2'], 'A2': ['A#2','Bb2'],
    }

    const accPool: string[] = []
    naturalPool.forEach(note => {
      const pairs = ACCIDENTAL_PAIRS[note]
      if (pairs) accPool.push(...pairs)
    })

    return [...naturalPool, ...accPool]
  }, [clef, filters, useAccidentals])


  // Init first group — only run once when pool is ready
  const initializedRef = useRef(false)
  useEffect(() => {
    if (pool.length === 0 || initializedRef.current) return
    initializedRef.current = true
    const notes = buildGroup(pool, groupSize)
    setGroup(notes.map((note, i) => ({ note, status: i === 0 ? 'active' : 'pending' })))
    setActiveIdx(0)
    wrongIndicesRef.current = new Set()
  }, [pool])

  function nextGroup() {
    const newRounds = rounds + 1
    setRounds(newRounds)
    if (stopMode === 'exercises' && newRounds >= stopValue) {
      setDone(true)
      return
    }
    const notes = buildGroup(pool, groupSize)
    setGroup(notes.map((note, i) => ({ note, status: i === 0 ? 'active' : 'pending' })))
    setActiveIdx(0)
    wrongIndicesRef.current = new Set()
    processingRef.current = false
  }

  const handleAnswer = useCallback((answer: string) => {
    if (done || group.length === 0) return
    const current = group[activeIdx]
    if (!current) return
    if (wrongIndicesRef.current.has(activeIdx)) return
    if (processingRef.current || current.status !== 'active') return

    const targetPitch = notePitchClass(current.note)
    const isCorrect = answersMatch(answer, targetPitch)
    setTotal(t => t + 1)
    if (isCorrect) setCorrect(c => c + 1)
    setFlash(isCorrect ? 'correct' : 'wrong')
    if (!isCorrect) {
      playWrongSound()
      setWrongNote(current.note.replace(/\d+$/, ''))
      setTimeout(() => setWrongNote(null), 800)
    }
    setTimeout(() => setFlash(null), 400)
    if (isCorrect && playCorrectNotes && samplerRef.current) {
      Tone.start().then(() => {
        samplerRef.current?.triggerAttackRelease(current.note, '2n')
      })
    }

    if (!isCorrect && groupSize > 1) wrongIndicesRef.current.add(activeIdx)

    setGroup(prev => prev.map((n, i) => {
      if (i === activeIdx) return { ...n, status: isCorrect ? 'correct' : 'wrong' }
      if (isCorrect && i === activeIdx + 1) return { ...n, status: 'active' }
      return n
    }))

    if (isCorrect) {
      processingRef.current = true
      const isLast = activeIdx >= group.length - 1
      if (isLast) {
        setTimeout(() => nextGroup(), 300)
      } else {
        setActiveIdx(i => i + 1)
        processingRef.current = false
      }
    } else {
      // Wrong: lock note and advance after delay
      processingRef.current = true
      const isLast = activeIdx >= group.length - 1
      if (isLast) {
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
  }, [done, group, activeIdx, rounds, stopValue, stopMode, pool, groupSize])

  useEffect(() => {
    if (inputMode !== 'letters') return
    function onKey(e: KeyboardEvent) {
      const letter = e.key.toUpperCase()
      if (NOTE_LETTERS.includes(letter)) handleAnswer(letter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inputMode, handleAnswer])

  if (pool.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#7A7060' }}>No notes match your selection.</p>
        <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>← Back</button>
      </div>
    )
  }

  if (group.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      </div>
    )
  }

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const currentNote = group[activeIdx]?.note ?? ''
  const activeStatus = group[activeIdx]?.status
  const progressPct = stopMode === 'exercises' ? (rounds / stopValue) * 100 : (elapsed / (stopValue * 60)) * 100

  if (done) {
    const finalTimeMs = Date.now() - startTime
    const finalTimeSec = finalTimeMs / 1000
    // Custom sessions don't have a deck-based best key — use a single
    // global custom-best so the user has a reference point. Per-config
    // bests can come later.
    const bestKey = 'notelab-note-id-best-custom'
    const prevBest = typeof window !== 'undefined' ? parseFloat(localStorage.getItem(bestKey) ?? '0') : 0
    const isNewBest = prevBest === 0 || finalTimeSec < prevBest
    if (typeof window !== 'undefined' && isNewBest) localStorage.setItem(bestKey, finalTimeSec.toString())

    const answerMode: AnswerMode =
      inputMode === 'keyboard-full' ? 'full-piano' : 'letters'

    function playAgain() {
      setRounds(0); setCorrect(0); setTotal(0); setDone(false)
      processingRef.current = false
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
        clef={clef as Clef}
        levelLabel="Custom"
        onPlayAgain={playAgain}
      />
    )
  }

  return (
    <div className="nl-sr-play-page">
      <header className="nl-sr-play-header">
        <button onClick={goBack} className="nl-sr-play-header__back">
          ← End session
        </button>
        <div className="nl-sr-play-header__meta">
          <div className="nl-sr-play-header__stat">
            <span className="nl-sr-play-header__label">
              {stopMode === 'exercises' ? 'Round' : 'Time left'}
            </span>
            <span className="nl-sr-play-header__value">
              {stopMode === 'exercises'
                ? `${rounds + 1} / ${stopValue}`
                : `${Math.max(0, stopValue * 60 - Math.floor(elapsed))}s`}
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
          {inputMode === 'keyboard-full'
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

        {/* Feedback block — single-note mode only. Multi-note groups
            rely on per-note status colors on the staff itself. */}
        {groupSize === 1 && (
          <div className="nl-sr-feedback-block">
            {activeStatus === 'correct' && (
              <span className="nl-sr-feedback-mark is-correct" aria-hidden>✓</span>
            )}
            {activeStatus === 'wrong' && wrongNote && (
              <>
                <span className="nl-sr-feedback-mark is-wrong" aria-hidden>✗</span>
                <span className="nl-sr-feedback-text is-wrong">
                  Correct answer was <b>{wrongNote}</b>
                </span>
              </>
            )}
          </div>
        )}

        {/* Input */}
        {inputMode === 'letters' ? (
          <div className="nl-sr-ltr-grid">
            {useAccidentals && (
              <div className="nl-sr-ltr-row">
                {[null,'C#','D#',null,'F#','G#','A#'].map((s, i) => s ? (
                  <button
                    key={s}
                    onClick={() => handleAnswer(s)}
                    className="nl-sr-ltr-btn nl-sr-ltr-btn--accidental"
                  >
                    {s}
                  </button>
                ) : <div key={i} className="nl-sr-ltr-spacer" />)}
              </div>
            )}
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
            {useAccidentals && (
              <div className="nl-sr-ltr-row">
                {['Db','Eb',null,'Gb','Ab','Bb',null].map((note, i) => note ? (
                  <button
                    key={note}
                    onClick={() => handleAnswer(note)}
                    className="nl-sr-ltr-btn nl-sr-ltr-btn--accidental"
                  >
                    {note}
                  </button>
                ) : <div key={i} className="nl-sr-ltr-spacer" />)}
              </div>
            )}
          </div>
        ) : (
          <SightReadingFullPiano onAnswer={handleAnswer} />
        )}
      </div>
    </div>
  )
}

export default function CustomNoteID() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      </div>
    }>
      <CustomNoteIDInner />
    </Suspense>
  )
}
