'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type AccidentalMode = 'sharp' | 'flat' | 'both' | 'none'
type TimingMode = 'seconds' | 'bpm'
type NotationMode = 'alpha' | 'solfege'

type NoteEntry = { key: string; letter: string; acc: string; pitch: string }
type Chord = { id: string; label: string; display: string }
type ChordGroup = { id: string; label: string; chords: Chord[] }
type DisplayNote = NoteEntry & { octave: number; displayLetter: string; displayAcc: string; chord: Chord | null }

const NATURAL_NOTES: NoteEntry[] = [
  { key: 'C', letter: 'C', acc: '', pitch: 'C' },
  { key: 'D', letter: 'D', acc: '', pitch: 'D' },
  { key: 'E', letter: 'E', acc: '', pitch: 'E' },
  { key: 'F', letter: 'F', acc: '', pitch: 'F' },
  { key: 'G', letter: 'G', acc: '', pitch: 'G' },
  { key: 'A', letter: 'A', acc: '', pitch: 'A' },
  { key: 'B', letter: 'B', acc: '', pitch: 'B' },
]
const SHARP_POOL_ORDERED: NoteEntry[] = [
  { key: 'C', letter: 'C', acc: '', pitch: 'C' },
  { key: 'C#s', letter: 'C', acc: '♯', pitch: 'C#' },
  { key: 'D', letter: 'D', acc: '', pitch: 'D' },
  { key: 'D#s', letter: 'D', acc: '♯', pitch: 'D#' },
  { key: 'E', letter: 'E', acc: '', pitch: 'E' },
  { key: 'F', letter: 'F', acc: '', pitch: 'F' },
  { key: 'F#s', letter: 'F', acc: '♯', pitch: 'F#' },
  { key: 'G', letter: 'G', acc: '', pitch: 'G' },
  { key: 'G#s', letter: 'G', acc: '♯', pitch: 'G#' },
  { key: 'A', letter: 'A', acc: '', pitch: 'A' },
  { key: 'A#s', letter: 'A', acc: '♯', pitch: 'A#' },
  { key: 'B', letter: 'B', acc: '', pitch: 'B' },
]
const FLAT_POOL_ORDERED: NoteEntry[] = [
  { key: 'C', letter: 'C', acc: '', pitch: 'C' },
  { key: 'Dbf', letter: 'D', acc: '♭', pitch: 'C#' },
  { key: 'D', letter: 'D', acc: '', pitch: 'D' },
  { key: 'Ebf', letter: 'E', acc: '♭', pitch: 'D#' },
  { key: 'E', letter: 'E', acc: '', pitch: 'E' },
  { key: 'F', letter: 'F', acc: '', pitch: 'F' },
  { key: 'Gbf', letter: 'G', acc: '♭', pitch: 'F#' },
  { key: 'G', letter: 'G', acc: '', pitch: 'G' },
  { key: 'Abf', letter: 'A', acc: '♭', pitch: 'G#' },
  { key: 'A', letter: 'A', acc: '', pitch: 'A' },
  { key: 'Bbf', letter: 'B', acc: '♭', pitch: 'A#' },
  { key: 'B', letter: 'B', acc: '', pitch: 'B' },
]
const BOTH_POOL: NoteEntry[] = [
  { key: 'C', letter: 'C', acc: '', pitch: 'C' }, { key: 'C#s', letter: 'C', acc: '♯', pitch: 'C#' }, { key: 'Dbf', letter: 'D', acc: '♭', pitch: 'C#' },
  { key: 'D', letter: 'D', acc: '', pitch: 'D' }, { key: 'D#s', letter: 'D', acc: '♯', pitch: 'D#' }, { key: 'Ebf', letter: 'E', acc: '♭', pitch: 'D#' },
  { key: 'E', letter: 'E', acc: '', pitch: 'E' }, { key: 'F', letter: 'F', acc: '', pitch: 'F' }, { key: 'F#s', letter: 'F', acc: '♯', pitch: 'F#' },
  { key: 'Gbf', letter: 'G', acc: '♭', pitch: 'F#' }, { key: 'G', letter: 'G', acc: '', pitch: 'G' }, { key: 'G#s', letter: 'G', acc: '♯', pitch: 'G#' },
  { key: 'Abf', letter: 'A', acc: '♭', pitch: 'G#' }, { key: 'A', letter: 'A', acc: '', pitch: 'A' }, { key: 'A#s', letter: 'A', acc: '♯', pitch: 'A#' },
  { key: 'Bbf', letter: 'B', acc: '♭', pitch: 'A#' }, { key: 'B', letter: 'B', acc: '', pitch: 'B' },
]

const SOLFEGE_LETTER: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Ti' }
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const CHORD_GROUPS: ChordGroup[] = [
  { id: 'grp_triad', label: 'Triad qualities', chords: [
    { id: 'triad_m', label: 'm', display: 'm' },
    { id: 'triad_aug', label: '+', display: '+' },
    { id: 'triad_dim', label: '°', display: '°' },
  ] },
  { id: 'grp_7th', label: '7th chords', chords: [
    { id: 'c7', label: 'Δ7', display: 'Δ7' },
    { id: 'dom7', label: '7', display: '7' },
    { id: 'min7', label: 'm7', display: 'm7' },
    { id: 'hdim7', label: 'ø7', display: 'ø7' },
    { id: 'dim7', label: '°7', display: '°7' },
    { id: 'mmaj7', label: 'mΔ7', display: 'mΔ7' },
    { id: '7b5', label: '7♭5', display: '7♭5' },
    { id: 'aug7', label: '+7', display: '+7' },
    { id: 'augM7', label: '+Δ7', display: '+Δ7' },
  ] },
  { id: 'grp_9th', label: '9th chords', chords: [
    { id: 'dom9', label: '9', display: '9' },
    { id: 'maj9', label: 'Δ9', display: 'Δ9' },
    { id: 'min9', label: 'm9', display: 'm9' },
    { id: '7b9', label: '7♭9', display: '7♭9' },
    { id: '7s9', label: '7♯9', display: '7♯9' },
  ] },
  { id: 'grp_11th', label: '11th chords', chords: [
    { id: 'dom11', label: '11', display: '11' },
    { id: 'min11', label: 'm11', display: 'm11' },
    { id: '7sus4', label: '7sus4', display: '7sus4' },
    { id: '9sus4', label: '9sus4', display: '9sus4' },
  ] },
  { id: 'grp_13th', label: '13th chords', chords: [
    { id: 'dom13', label: '13', display: '13' },
    { id: 'maj13', label: 'Δ13', display: 'Δ13' },
    { id: 'min13', label: 'm13', display: 'm13' },
    { id: '7alt', label: '7alt', display: '7alt' },
  ] },
  { id: 'grp_6th', label: '6th & added tone', chords: [
    { id: 'maj6', label: '6', display: '6' },
    { id: 'min6', label: 'm6', display: 'm6' },
    { id: 'add9', label: 'add9', display: 'add9' },
    { id: 'madd9', label: 'madd9', display: 'madd9' },
  ] },
  { id: 'grp_fig', label: 'Figured bass · inversions', chords: [
    { id: 'fig_53', label: '⁵⁄₃', display: '⁵⁄₃' },
    { id: 'fig_6', label: '⁶', display: '⁶' },
    { id: 'fig_64', label: '⁶⁄₄', display: '⁶⁄₄' },
    { id: 'fig_7', label: '⁷', display: '⁷' },
  ] },
  { id: 'grp_slash', label: 'Slash inversions', chords: [
    { id: 'slash_3', label: '/3', display: '/3' },
    { id: 'slash_5', label: '/5', display: '/5' },
  ] },
]

const getActivePool = (mode: AccidentalMode): NoteEntry[] => {
  if (mode === 'sharp') return SHARP_POOL_ORDERED
  if (mode === 'flat') return FLAT_POOL_ORDERED
  if (mode === 'none') return NATURAL_NOTES
  return BOTH_POOL
}

const allChords = CHORD_GROUPS.flatMap((g) => g.chords)

export default function NoteChordGeneratorPage() {
  const [accidentalMode, setAccidentalMode] = useState<AccidentalMode>('sharp')
  const [notationMode, setNotationMode] = useState<NotationMode>('alpha')
  const [timingMode, setTimingMode] = useState<TimingMode>('seconds')
  const [secsPerNote, setSecsPerNote] = useState(5)
  const [bpm, setBpm] = useState(60)
  const [beatsPerNote, setBeatsPerNote] = useState(4)
  const [activeNoteKeys, setActiveNoteKeys] = useState<Set<string>>(new Set(SHARP_POOL_ORDERED.map((n) => n.key)))
  const [activeChordIds, setActiveChordIds] = useState<Set<string>>(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [genCount, setGenCount] = useState(0)
  const [status, setStatus] = useState('stopped')
  const [noteOn, setNoteOn] = useState(true)
  const [clickOn, setClickOn] = useState(true)
  const [currentNote, setCurrentNote] = useState<DisplayNote | null>(null)
  const [nextPreview, setNextPreview] = useState<DisplayNote | null>(null)
  const [history, setHistory] = useState<DisplayNote[]>([])
  const [pulseTick, setPulseTick] = useState(0)
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set(['grp_triad', 'grp_7th']))

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const activePool = useMemo(() => getActivePool(accidentalMode), [accidentalMode])

  const playOsc = useCallback((freq: number, type: OscillatorType, duration = 0.06, gainPeak = 0.3) => {
    type WebKitAudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    const w = window as WebKitAudioWindow
    const Ctor = w.AudioContext ?? w.webkitAudioContext
    if (!Ctor) return
    const ctx = audioCtxRef.current ?? new Ctor()
    audioCtxRef.current = ctx
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(gainPeak, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + duration)
  }, [])

  const playTick = useCallback(() => {
    if (!clickOn) return
    try { playOsc(880, 'square', 0.04, 0.05) } catch {}
  }, [clickOn, playOsc])

  const playNote = useCallback((pitch: string) => {
    if (!noteOn) return
    try {
      const idx = ALL_NOTES.indexOf(pitch)
      const f = 440 * Math.pow(2, (idx - 9) / 12)
      playOsc(f, 'sine', 1.2, 0.35)
    } catch {}
  }, [noteOn, playOsc])

  const pickChord = useCallback((): Chord | null => {
    const ids = [...activeChordIds]
    if (!ids.length) return null
    const id = ids[Math.floor(Math.random() * ids.length)]
    return allChords.find((c) => c.id === id) ?? null
  }, [activeChordIds])

  const makeDisplayNote = useCallback((entry: NoteEntry): DisplayNote => {
    const displayLetter = notationMode === 'solfege' ? (SOLFEGE_LETTER[entry.letter] ?? entry.letter) : entry.letter
    return { ...entry, octave: 4, displayLetter, displayAcc: entry.acc, chord: pickChord() }
  }, [notationMode, pickChord])

  const pickNote = useCallback((): DisplayNote | null => {
    const pool = activePool.filter((n) => activeNoteKeys.has(n.key))
    if (!pool.length) return null
    return makeDisplayNote(pool[Math.floor(Math.random() * pool.length)])
  }, [activeNoteKeys, activePool, makeDisplayNote])

  const nextNote = useCallback(() => {
    const picked = timingMode === 'bpm' && nextPreview ? nextPreview : pickNote()
    if (!picked) {
      setStatus('no notes selected')
      return
    }
    setCurrentNote(picked)
    setGenCount((c) => c + 1)
    setHistory((h) => [...h.slice(-7), picked])
    setPulseTick((t) => t + 1)
    playNote(picked.pitch)
    if (timingMode === 'bpm') setNextPreview(pickNote())
  }, [nextPreview, pickNote, playNote, timingMode])

  useEffect(() => {
    if (!isPlaying) return
    if (timerRef.current) clearInterval(timerRef.current)

    if (timingMode === 'seconds') {
      let rem = secsPerNote
      setStatus(`next in ${rem}s`)
      timerRef.current = setInterval(() => {
        rem -= 1
        if (rem <= 0) {
          rem = secsPerNote
          playTick()
          nextNote()
        }
        setStatus(`next in ${rem}s`)
      }, 1000)
      return
    }

    const ms = (60 / bpm) * 1000
    timerRef.current = setInterval(() => {
      setCurrentBeat((prev) => {
        const cur = prev
        if (cur === 0) nextNote()
        else playTick()
        return (cur + 1) % beatsPerNote
      })
    }, ms)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [beatsPerNote, bpm, isPlaying, nextNote, playTick, secsPerNote, timingMode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying((p) => !p)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      setCurrentBeat(0)
      setStatus('stopped')
      return
    }
    setStatus('running')
    if (timingMode === 'bpm') setNextPreview(pickNote())
    nextNote()
    setCurrentBeat(1 % beatsPerNote)
  }, [beatsPerNote, isPlaying, nextNote, pickNote, timingMode])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioCtxRef.current) void audioCtxRef.current.close().catch(() => undefined)
    }
  }, [])

  const selectAllNotes = () => setActiveNoteKeys(new Set(activePool.map((n) => n.key)))
  const selectNoNotes = () => setActiveNoteKeys(new Set())

  const setAccMode = (mode: AccidentalMode) => {
    const activePitches = new Set(activePool.filter((n) => activeNoteKeys.has(n.key)).map((n) => n.pitch))
    const nextPool = getActivePool(mode)
    setAccidentalMode(mode)
    setActiveNoteKeys(new Set(nextPool.filter((n) => activePitches.has(n.pitch) || (accidentalMode === 'none' && n.acc !== '')).map((n) => n.key)))
  }

  const selectAllChords = () => setActiveChordIds(new Set(allChords.map((c) => c.id)))
  const selectNoChords = () => setActiveChordIds(new Set())

  const toggleChord = (id: string) => {
    setActiveChordIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleNote = (key: string) => {
    setActiveNoteKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const setGroupAll = (group: ChordGroup, on: boolean) => {
    setActiveChordIds((prev) => {
      const next = new Set(prev)
      group.chords.forEach((c) => {
        if (on) next.add(c.id)
        else next.delete(c.id)
      })
      return next
    })
  }

  const clearAll = () => {
    setHistory([])
    setGenCount(0)
    setCurrentNote(null)
    setNextPreview(null)
    setStatus('stopped')
  }

  const beatDots = Array.from({ length: beatsPerNote }, (_, i) => i)
  const noteLabel = (n: NoteEntry) => notationMode === 'solfege'
    ? `${SOLFEGE_LETTER[n.letter] ?? n.letter}${n.acc}`
    : `${n.letter}${n.acc}`

  const recentHistory = history.slice(-3)
  const activeChordCount = activeChordIds.size

  return (
    <div className="nl-note-chord-generator-page">
      <div className="nl-note-chord-generator-inner">
        <Link href="/tools" className="nl-note-chord-generator-back">← Back to tools</Link>

        <header className="nl-note-chord-generator-hero">
          <p className="nl-note-chord-generator-hero__eyebrow">Note &amp; Chord Generator</p>
          <h1 className="nl-note-chord-generator-hero__title">Random <em>by design.</em></h1>
          <p className="nl-note-chord-generator-hero__sub">
            Drill notes, chord qualities, or inversions on a timer. Configure your pool, hit start.
          </p>
        </header>

        {/* Display */}
        <div className="nl-note-chord-generator-display">
          <button
            type="button"
            className={'nl-note-chord-generator-display__circle' + (currentNote ? ' is-active' : '')}
            onClick={() => !isPlaying && nextNote()}
            aria-label="Generate next note"
          >
            <span className="nl-note-chord-generator-display__inner" key={pulseTick}>
              <span className="nl-note-chord-generator-display__letter">{currentNote?.displayLetter ?? '—'}</span>
              {currentNote?.displayAcc && (
                <span className="nl-note-chord-generator-display__mod">{currentNote.displayAcc}</span>
              )}
              {currentNote?.chord?.display && (
                <span className="nl-note-chord-generator-display__chord">{currentNote.chord.display}</span>
              )}
            </span>
          </button>

          <div className="nl-note-chord-generator-display__dots" aria-hidden>
            {beatDots.map((i) => (
              <span
                key={i}
                className={
                  'nl-note-chord-generator-display__dot' +
                  (timingMode === 'bpm' && i === currentBeat ? ' is-on' : '') +
                  (timingMode === 'seconds' && i < Math.min(history.length, beatsPerNote) ? ' is-on' : '')
                }
              />
            ))}
          </div>

          {recentHistory.length > 0 && (
            <p className="nl-note-chord-generator-display__history">
              prev: {recentHistory.map((h, i) => (
                <span key={`${h.key}-${i}`}>
                  {h.displayLetter}{h.displayAcc}{h.chord?.display ?? ''}
                  {i < recentHistory.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>
          )}
        </div>

        {/* Transport */}
        <div className="nl-note-chord-generator-transport">
          <div className="nl-note-chord-generator-transport__group">
            <button
              type="button"
              className={'nl-note-chord-generator-transport__btn' + (isPlaying ? ' is-primary' : '')}
              onClick={() => setIsPlaying((p) => !p)}
            >
              {isPlaying ? 'Stop' : 'Start'}
            </button>
            <button type="button" className="nl-note-chord-generator-transport__btn" onClick={nextNote}>
              Next →
            </button>
            <button type="button" className="nl-note-chord-generator-transport__btn" onClick={clearAll}>
              Clear
            </button>
          </div>
          <div className="nl-note-chord-generator-transport__group">
            <span className="nl-note-chord-generator-transport__label">Sound</span>
            <div className="nl-note-chord-generator-pill-toggle">
              <button
                type="button"
                className={'nl-note-chord-generator-pill-toggle__btn' + (noteOn ? ' is-active' : '')}
                onClick={() => setNoteOn((v) => !v)}
              >Note</button>
              <button
                type="button"
                className={'nl-note-chord-generator-pill-toggle__btn' + (clickOn ? ' is-active' : '')}
                onClick={() => setClickOn((v) => !v)}
              >Click</button>
            </div>
          </div>
        </div>

        {/* Desktop config grid */}
        <div className="nl-note-chord-generator-config">
          {/* Left: Setup card */}
          <section className="nl-note-chord-generator-card">
            <div className="nl-note-chord-generator-card__head">
              <h2 className="nl-note-chord-generator-card__title"><em>Setup.</em></h2>
              <span className="nl-note-chord-generator-card__count">{activeNoteKeys.size} notes active</span>
            </div>

            {/* Timing */}
            <div className="nl-note-chord-generator-sec">
              <div className="nl-note-chord-generator-sec__head">
                <span className="nl-note-chord-generator-sec__label">Timing</span>
                <div className="nl-note-chord-generator-pill-toggle">
                  <button
                    type="button"
                    className={'nl-note-chord-generator-pill-toggle__btn' + (timingMode === 'seconds' ? ' is-active' : '')}
                    onClick={() => setTimingMode('seconds')}
                  >Seconds</button>
                  <button
                    type="button"
                    className={'nl-note-chord-generator-pill-toggle__btn' + (timingMode === 'bpm' ? ' is-active' : '')}
                    onClick={() => setTimingMode('bpm')}
                  >BPM</button>
                </div>
              </div>
              {timingMode === 'seconds' ? (
                <>
                  <div className="nl-note-chord-generator-slider__row">
                    <span className="nl-note-chord-generator-slider__caption">Seconds per note</span>
                    <span className="nl-note-chord-generator-slider__value">{secsPerNote}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={secsPerNote}
                    onChange={(e) => setSecsPerNote(Number(e.target.value))}
                    className="nl-note-chord-generator-slider"
                    aria-label="Seconds per note"
                  />
                </>
              ) : (
                <>
                  <div className="nl-note-chord-generator-slider__row">
                    <span className="nl-note-chord-generator-slider__caption">Tempo</span>
                    <span className="nl-note-chord-generator-slider__value">{bpm} BPM</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={240}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="nl-note-chord-generator-slider"
                    aria-label="Tempo"
                  />
                  <div className="nl-note-chord-generator-slider__row">
                    <span className="nl-note-chord-generator-slider__caption">Beats per note</span>
                    <span className="nl-note-chord-generator-slider__value">{beatsPerNote}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={beatsPerNote}
                    onChange={(e) => setBeatsPerNote(Number(e.target.value))}
                    className="nl-note-chord-generator-slider"
                    aria-label="Beats per note"
                  />
                </>
              )}
            </div>

            {/* Notes */}
            <div className="nl-note-chord-generator-sec">
              <div className="nl-note-chord-generator-sec__head">
                <span className="nl-note-chord-generator-sec__label">Notes</span>
                <div className="nl-note-chord-generator-bulk">
                  <button type="button" className="nl-note-chord-generator-bulk__btn" onClick={selectAllNotes}>All</button>
                  <button type="button" className="nl-note-chord-generator-bulk__btn" onClick={selectNoNotes}>None</button>
                </div>
              </div>
              <div className="nl-note-chord-generator-note-grid">
                {activePool.map((n) => (
                  <button
                    key={n.key}
                    type="button"
                    className={'nl-note-chord-generator-note-chip' + (activeNoteKeys.has(n.key) ? ' is-active' : '')}
                    onClick={() => toggleNote(n.key)}
                  >
                    {noteLabel(n)}
                  </button>
                ))}
              </div>
            </div>

            {/* Display */}
            <div className="nl-note-chord-generator-sec">
              <div className="nl-note-chord-generator-sec__head">
                <span className="nl-note-chord-generator-sec__label">Display</span>
              </div>
              <div className="nl-note-chord-generator-sub-row">
                <span className="nl-note-chord-generator-sub-row__label">Notation</span>
                <div className="nl-note-chord-generator-pill-toggle">
                  <button
                    type="button"
                    className={'nl-note-chord-generator-pill-toggle__btn' + (notationMode === 'alpha' ? ' is-active' : '')}
                    onClick={() => setNotationMode('alpha')}
                  >ABC</button>
                  <button
                    type="button"
                    className={'nl-note-chord-generator-pill-toggle__btn' + (notationMode === 'solfege' ? ' is-active' : '')}
                    onClick={() => setNotationMode('solfege')}
                  >Do-Re-Mi</button>
                </div>
              </div>
              <div className="nl-note-chord-generator-sub-row">
                <span className="nl-note-chord-generator-sub-row__label">Accidentals</span>
                <div className="nl-note-chord-generator-pill-toggle">
                  {(['sharp', 'flat', 'both', 'none'] as AccidentalMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={'nl-note-chord-generator-pill-toggle__btn' + (accidentalMode === m ? ' is-active' : '')}
                      onClick={() => setAccMode(m)}
                    >
                      {m === 'sharp' ? '♯' : m === 'flat' ? '♭' : m === 'both' ? 'Both' : 'None'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right: Chord card */}
          <section className="nl-note-chord-generator-card">
            <div className="nl-note-chord-generator-card__head">
              <h2 className="nl-note-chord-generator-card__title">Chord <em>quality &amp; inversion.</em></h2>
              <div className="nl-note-chord-generator-bulk">
                <button type="button" className="nl-note-chord-generator-bulk__btn" onClick={selectAllChords}>All</button>
                <button type="button" className="nl-note-chord-generator-bulk__btn" onClick={selectNoChords}>None</button>
              </div>
            </div>
            <div className="nl-note-chord-generator-chord-grid">
              {CHORD_GROUPS.map((group) => {
                const groupActive = group.chords.filter((c) => activeChordIds.has(c.id)).length
                return (
                  <div key={group.id} className="nl-note-chord-generator-chord-group">
                    <div className="nl-note-chord-generator-chord-group__head">
                      <span className="nl-note-chord-generator-chord-group__label">{group.label}</span>
                      <span className="nl-note-chord-generator-chord-group__count">{groupActive}/{group.chords.length}</span>
                    </div>
                    <div className="nl-note-chord-generator-chord-group__chips">
                      {group.chords.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={'nl-note-chord-generator-chip nl-note-chord-generator-chip--mono' + (activeChordIds.has(c.id) ? ' is-active' : '')}
                          onClick={() => toggleChord(c.id)}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Mobile: Notes card */}
        <section className="nl-note-chord-generator-card nl-note-chord-generator-card--mobile">
          <div className="nl-note-chord-generator-card__head">
            <span className="nl-note-chord-generator-sec__label">Notes</span>
            <span className="nl-note-chord-generator-card__count">{activeNoteKeys.size}/{activePool.length}</span>
          </div>
          <div className="nl-note-chord-generator-note-grid">
            {activePool.map((n) => (
              <button
                key={n.key}
                type="button"
                className={'nl-note-chord-generator-note-chip' + (activeNoteKeys.has(n.key) ? ' is-active' : '')}
                onClick={() => toggleNote(n.key)}
              >
                {noteLabel(n)}
              </button>
            ))}
          </div>
          <div className="nl-note-chord-generator-bulk nl-note-chord-generator-bulk--row">
            <button type="button" className="nl-note-chord-generator-bulk__btn" onClick={selectAllNotes}>All</button>
            <button type="button" className="nl-note-chord-generator-bulk__btn" onClick={selectNoNotes}>None</button>
          </div>
        </section>

        {/* Mobile: Tempo card */}
        <section className="nl-note-chord-generator-card nl-note-chord-generator-card--mobile">
          <div className="nl-note-chord-generator-card__head">
            <span className="nl-note-chord-generator-sec__label">Tempo</span>
            <div className="nl-note-chord-generator-pill-toggle">
              <button
                type="button"
                className={'nl-note-chord-generator-pill-toggle__btn' + (timingMode === 'seconds' ? ' is-active' : '')}
                onClick={() => setTimingMode('seconds')}
              >Seconds</button>
              <button
                type="button"
                className={'nl-note-chord-generator-pill-toggle__btn' + (timingMode === 'bpm' ? ' is-active' : '')}
                onClick={() => setTimingMode('bpm')}
              >BPM</button>
            </div>
          </div>
          {timingMode === 'seconds' ? (
            <>
              <div className="nl-note-chord-generator-slider__row">
                <span className="nl-note-chord-generator-slider__caption">Seconds per note</span>
                <span className="nl-note-chord-generator-slider__value">{secsPerNote}</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={secsPerNote}
                onChange={(e) => setSecsPerNote(Number(e.target.value))}
                className="nl-note-chord-generator-slider"
                aria-label="Seconds per note"
              />
            </>
          ) : (
            <>
              <div className="nl-note-chord-generator-slider__row">
                <span className="nl-note-chord-generator-slider__caption">Tempo</span>
                <span className="nl-note-chord-generator-slider__value">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min={20}
                max={240}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="nl-note-chord-generator-slider"
                aria-label="Tempo"
              />
              <div className="nl-note-chord-generator-slider__row">
                <span className="nl-note-chord-generator-slider__caption">Beats per note</span>
                <span className="nl-note-chord-generator-slider__value">{beatsPerNote}</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                value={beatsPerNote}
                onChange={(e) => setBeatsPerNote(Number(e.target.value))}
                className="nl-note-chord-generator-slider"
                aria-label="Beats per note"
              />
            </>
          )}
        </section>

        {/* Mobile: Display card */}
        <section className="nl-note-chord-generator-card nl-note-chord-generator-card--mobile">
          <div className="nl-note-chord-generator-card__head">
            <span className="nl-note-chord-generator-sec__label">Display</span>
          </div>
          <div className="nl-note-chord-generator-sub-row">
            <span className="nl-note-chord-generator-sub-row__label">Notation</span>
            <div className="nl-note-chord-generator-pill-toggle">
              <button
                type="button"
                className={'nl-note-chord-generator-pill-toggle__btn' + (notationMode === 'alpha' ? ' is-active' : '')}
                onClick={() => setNotationMode('alpha')}
              >ABC</button>
              <button
                type="button"
                className={'nl-note-chord-generator-pill-toggle__btn' + (notationMode === 'solfege' ? ' is-active' : '')}
                onClick={() => setNotationMode('solfege')}
              >Do-Re-Mi</button>
            </div>
          </div>
          <div className="nl-note-chord-generator-sub-row">
            <span className="nl-note-chord-generator-sub-row__label">Accidentals</span>
            <div className="nl-note-chord-generator-pill-toggle">
              {(['sharp', 'flat', 'both', 'none'] as AccidentalMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={'nl-note-chord-generator-pill-toggle__btn' + (accidentalMode === m ? ' is-active' : '')}
                  onClick={() => setAccMode(m)}
                >
                  {m === 'sharp' ? '♯' : m === 'flat' ? '♭' : m === 'both' ? 'Both' : 'None'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile: Chord accordion */}
        <section className="nl-note-chord-generator-accordion">
          <div className="nl-note-chord-generator-accordion__head-card">
            <h2 className="nl-note-chord-generator-accordion__title">Chord <em>pool.</em></h2>
            <span className="nl-note-chord-generator-accordion__total">{activeChordCount} selected</span>
            <div className="nl-note-chord-generator-bulk">
              <button type="button" className="nl-note-chord-generator-bulk__btn" onClick={selectAllChords}>All</button>
              <button type="button" className="nl-note-chord-generator-bulk__btn" onClick={selectNoChords}>None</button>
            </div>
          </div>
          {CHORD_GROUPS.map((group) => {
            const isOpen = openAccordions.has(group.id)
            const groupActive = group.chords.filter((c) => activeChordIds.has(c.id)).length
            const hasActive = groupActive > 0
            return (
              <div key={group.id}>
                <button
                  type="button"
                  className={'nl-note-chord-generator-accordion__row' + (isOpen ? ' is-open' : '')}
                  onClick={() => toggleAccordion(group.id)}
                  aria-expanded={isOpen}
                >
                  <span className="nl-note-chord-generator-accordion__label">{group.label}</span>
                  <span className="nl-note-chord-generator-accordion__right">
                    <span className={'nl-note-chord-generator-accordion__count' + (hasActive ? ' has-active' : '')}>
                      {groupActive}/{group.chords.length}
                    </span>
                    <span className="nl-note-chord-generator-accordion__chev" aria-hidden>▾</span>
                  </span>
                </button>
                {isOpen && (
                  <div className="nl-note-chord-generator-accordion__body">
                    <div className="nl-note-chord-generator-chord-group__chips">
                      {group.chords.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={'nl-note-chord-generator-chip nl-note-chord-generator-chip--mono' + (activeChordIds.has(c.id) ? ' is-active' : '')}
                          onClick={() => toggleChord(c.id)}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <div className="nl-note-chord-generator-accordion__bulk">
                      <button type="button" className="nl-note-chord-generator-accordion__bulk-btn" onClick={() => setGroupAll(group, true)}>All</button>
                      <button type="button" className="nl-note-chord-generator-accordion__bulk-btn" onClick={() => setGroupAll(group, false)}>None</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </section>

        <p className="nl-note-chord-generator-status">
          {activeNoteKeys.size} notes · {activeChordIds.size} chord qualities · {status}
          {genCount > 0 && ` · generated ${genCount}`}
        </p>
      </div>
    </div>
  )
}
