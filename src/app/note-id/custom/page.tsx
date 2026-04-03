'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import MultiNoteStaff from '@/components/cards/MultiNoteStaff'
import FullPiano from '@/components/cards/FullPiano'
import { SIGHT_READ_DECKS } from '@/lib/sightReadDecks'
import * as Tone from 'tone'
import { GRAND_STAFF_DECKS } from '@/lib/grandStaffDecks'

const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const SHARP_ROW: (string | null)[] = ['C#', 'D#', null, 'F#', 'G#', 'A#', null]
const FLAT_ROW: (string | null)[]  = ['Db', 'Eb', null, 'Gb', 'Ab', 'Bb', null]

const WHITE_KEY_NOTES = ['C','D','E','F','G','A','B']
const BLACK_KEY_NOTES = [
  { note: 'C#', afterWhite: 0 }, { note: 'D#', afterWhite: 1 },
  { note: 'F#', afterWhite: 3 }, { note: 'G#', afterWhite: 4 }, { note: 'A#', afterWhite: 5 },
]
const KEY_W = 52, KEY_H = 120, BLACK_W = 32, BLACK_H = 76

// Note classification for treble clef
const TREBLE_LINE_NOTES = new Set(['E4','G4','B4','D5','F5'])
const TREBLE_SPACE_NOTES = new Set(['F4','A4','C5','E5'])
const TREBLE_LEDGER_NOTES = new Set([
  'C4','D4',           // below staff — middle C ledger line + space above it
  'A5','B5','C6',      // above staff — actual ledger lines
  'A3','B3','G3','F3', // far below staff — ledger lines and spaces
])
const BASS_LINE_NOTES = new Set(['G2','B2','D3','F3','A3'])
const BASS_SPACE_NOTES = new Set(['A2','C3','E3','G3','B3'])
const BASS_LEDGER_NOTES = new Set([
  'E2',                // below staff — actual ledger line
  'C4','D4','E4',      // above staff — actual ledger lines
])
// Grand staff — treble staff E4-C6, bass staff G2-B3, ledger = C4/D4 between + extremes
const GRAND_TREBLE_LINE_NOTES = new Set(['E4','G4','B4','D5','F5'])
const GRAND_TREBLE_SPACE_NOTES = new Set(['F4','A4','C5','E5'])
const GRAND_TREBLE_LEDGER_NOTES = new Set(['A5','B5','C6'])
const GRAND_BASS_LINE_NOTES = new Set(['G2','B2','D3','F3','A3'])
const GRAND_BASS_SPACE_NOTES = new Set(['A2','C3','E3','G3','B3'])
const GRAND_BASS_LEDGER_NOTES = new Set(['E2','C4','D4'])

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
  const inputMode = (searchParams.get('input') ?? 'letters') as 'letters' | 'keyboard' | 'keyboard-full'
  const groupSize = parseInt(searchParams.get('group') ?? '1')
  const playCorrectNotes = searchParams.get('playCorrect') === '1'
  const stopMode = searchParams.get('stopMode') ?? 'exercises'
  const stopValue = parseInt(searchParams.get('stopValue') ?? '10')

  const [group, setGroup] = useState<NoteState[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [rounds, setRounds] = useState(0)
  const [done, setDone] = useState(false)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
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
        ledger: ['C4','D4','A5','B5','C6','A3','B3','G3','F3'],
      },
      bass: {
        lines:  ['G2','B2','D3','F3','A3'],
        spaces: ['A2','C3','E3','G3','B3'],
        ledger: ['E2','F2','C4','D4','E4'],
      },
      grand: {
        lines:  ['E4','G4','B4','D5','F5','G2','B2','D3','F3','A3'],
        spaces: ['F4','A4','C5','E5','A2','C3','E3','G3','B3'],
        ledger: ['C4','D4','A5','B5','C6','E2'],
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
    setTimeout(() => setFlash(null), 800)
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
        setTimeout(() => nextGroup(), 600)
      } else {
        setActiveIdx(i => i + 1)
        processingRef.current = false
      }
    } else {
      // Wrong: lock note and advance after delay
      processingRef.current = true
      const isLast = activeIdx >= group.length - 1
      if (isLast) {
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
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#888780' }}>No notes match your selection.</p>
        <button onClick={() => router.push('/note-id')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', color: '#888780' }}>← Back</button>
      </div>
    )
  }

  if (group.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#888780' }}>Loading…</p>
      </div>
    )
  }

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const currentNote = group[activeIdx]?.note ?? ''
  const activeStatus = group[activeIdx]?.status
  const bgColor = flash === 'wrong' ? '#FFF0F0' : flash === 'correct' ? '#F0FBF4' : 'white'
  const borderColor = flash === 'wrong' ? '#F09595' : flash === 'correct' ? '#4CAF50' : '#D3D1C7'
  const progressPct = stopMode === 'exercises' ? (rounds / stopValue) * 100 : (elapsed / (stopValue * 60)) * 100

  if (done) {
    const finalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    return (
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px,2vh,24px)' }}>
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #D3D1C7', padding: '56px 48px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px' }}>Session Complete</p>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '36px', color: '#1A1A18', marginBottom: '32px' }}>Custom Session</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '36px' }}>
            {[
              { num: pct + '%', label: 'Score' },
              { num: finalTime + 's', label: 'Time' },
              { num: correct + '/' + total, label: 'Correct' },
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

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid #D3D1C7' }}>
        <button onClick={() => router.push('/note-id')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
        <div style={{ display: 'flex', gap: '24px' }}>
          {stopMode === 'exercises'
            ? <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, color: '#888780' }}>Round {rounds + 1} / {stopValue}</span>
            : <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, color: '#888780' }}>{Math.max(0, stopValue * 60 - Math.floor(elapsed))}s left</span>
          }
          <span style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, color: '#888780' }}>{pct}%</span>
        </div>
        <div style={{ width: '60px' }} />
      </div>

      {/* Progress */}
      <div style={{ height: '2px', background: '#EDE8DF' }}>
        <div style={{ height: '100%', background: '#1A1A18', width: progressPct + '%', transition: 'width 0.3s' }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px,2vh,24px)' }}>
        <div style={{ background: bgColor, border: '1px solid ' + borderColor, borderRadius: '20px', padding: 'clamp(16px,3vh,40px) clamp(16px,3vw,32px)', maxWidth: '720px', width: '100%', textAlign: 'center', transition: 'all 0.15s', boxShadow: '0 2px 20px rgba(26,26,24,0.06)' }}>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: 'clamp(8px,2vh,24px)' }}>
            What note is this?
          </p>


          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', overflowX: 'auto' }}>
            {groupSize === 1 ? (
              clef === 'grand'
                ? <GrandStaffCard note={currentNote} />
                : <StaffCard note={currentNote} clef={clef} />
            ) : (
              <MultiNoteStaff notes={group} clef={clef} />
            )}
          </div>

          {/* Feedback — single note only */}
          <div style={{ height: '52px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            {groupSize === 1 && flash === 'correct' && <span style={{ fontSize: '36px', color: '#4CAF50', lineHeight: 1 }}>✓</span>}
            {groupSize === 1 && flash === 'wrong' && (
              <>
                <span style={{ fontSize: '36px', color: '#E53935', lineHeight: 1 }}>✗</span>
                <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#E53935', marginTop: '4px' }}>{currentNote.replace(/\d+$/, '')}</p>
              </>
            )}
          </div>

          {inputMode === 'letters' ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '6px' }}>
              {/* Sharps row — always rendered, hidden when no accidentals */}
              {useAccidentals && (
                <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'center' }}>
                  {['C#', null, 'D#', null, null, 'F#', null, 'G#', null, 'A#', null, null, null, null].slice(0,7).map((note, i) => {
                    const sharps = [null,'C#',null,'D#',null,null,'F#',null,'G#',null,'A#',null,null,null]
                    const s = [null,'C#','D#',null,'F#','G#','A#'][i]
                    return s ? (
                      <button key={s} onClick={() => handleAnswer(s)}
                        style={{ flex: 1, maxWidth: '52px', height: '34px', borderRadius: '8px', border: '1px solid #D3D1C7', background: '#F5F2EC', fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, color: '#888780', cursor: 'pointer' }}>
                        {s}
                      </button>
                    ) : <div key={i} style={{ flex: 1, maxWidth: '52px' }} />
                  })}
                </div>
              )}
              {/* Naturals row */}
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', width: '100%' }}>
                {NOTE_LETTERS.map(letter => (
                  <button key={letter} onClick={() => handleAnswer(letter)}
                    style={{ flex: 1, maxWidth: '52px', height: '48px', borderRadius: '10px', border: '1px solid #D3D1C7', background: 'white', fontFamily: 'var(--font-cormorant), serif', fontSize: '22px', fontWeight: 400, color: '#1A1A18', cursor: 'pointer', boxShadow: '0 2px 6px rgba(26,26,24,0.06)' }}>
                    {letter}
                  </button>
                ))}
              </div>
              {/* Flats row */}
              {useAccidentals && (
                <div style={{ display: 'flex', gap: '4px', width: '100%', justifyContent: 'center' }}>
                  {['Db','Eb',null,'Gb','Ab','Bb',null].map((note, i) => note ? (
                    <button key={note} onClick={() => handleAnswer(note)}
                      style={{ flex: 1, maxWidth: '52px', height: '34px', borderRadius: '8px', border: '1px solid #D3D1C7', background: '#F5F2EC', fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, color: '#888780', cursor: 'pointer' }}>
                      {note}
                    </button>
                  ) : <div key={i} style={{ flex: 1, maxWidth: '52px' }} />)}
                </div>
              )}
            </div>
          ) : inputMode === 'keyboard-full' ? (
            <FullPiano onNote={handleAnswer} />
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: KEY_H + 'px', width: WHITE_KEY_NOTES.length * KEY_W + 'px',
                transformOrigin: 'top left',
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

export default function CustomNoteID() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#888780' }}>Loading…</p>
      </div>
    }>
      <CustomNoteIDInner />
    </Suspense>
  )
}
