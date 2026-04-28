'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type AccidentalMode = 'sharp' | 'flat' | 'both' | 'none'
type TimingMode = 'seconds' | 'bpm'
type NotationMode = 'alpha' | 'solfege'

type NoteEntry = { key: string; letter: string; acc: string; pitch: string }
type Chord = { id: string; label: string; display: string }
type ChordGroup = { id: string; label: string; chords: Chord[] }
type DisplayNote = NoteEntry & { octave: number; displayLetter: string; displayAcc: string; chord: Chord | null }

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

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

const SOLFEGE_LETTER: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Ti' }
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const CHORD_GROUPS: ChordGroup[] = [
  { id: 'grp_triad', label: 'Triad Qualities', chords: [{ id: 'triad_m', label: 'm', display: 'm' }, { id: 'triad_aug', label: '+', display: '+' }, { id: 'triad_dim', label: '°', display: '°' }] },
  { id: 'grp_7th', label: '7th Chords', chords: [{ id: 'c7', label: 'Δ7', display: 'Δ7' }, { id: 'dom7', label: '7', display: '7' }, { id: 'min7', label: 'm7', display: 'm7' }, { id: 'hdim7', label: 'ø7', display: 'ø7' }, { id: 'dim7', label: '°7', display: '°7' }, { id: 'mmaj7', label: 'mΔ7', display: 'mΔ7' }, { id: '7b5', label: '7b5', display: '7b5' }, { id: 'aug7', label: '+7', display: '+7' }, { id: 'augM7', label: '+Δ7', display: '+Δ7' }] },
  { id: 'grp_9th', label: '9th Chords', chords: [{ id: 'dom9', label: '9', display: '9' }, { id: 'maj9', label: 'Δ9', display: 'Δ9' }, { id: 'min9', label: 'm9', display: 'm9' }, { id: '7b9', label: '7b9', display: '7b9' }, { id: '7s9', label: '7#9', display: '7#9' }] },
  { id: 'grp_11th', label: '11th Chords', chords: [{ id: 'dom11', label: '11', display: '11' }, { id: 'min11', label: 'm11', display: 'm11' }, { id: '7sus4', label: '7sus4', display: '7sus4' }, { id: '9sus4', label: '9sus4', display: '9sus4' }] },
  { id: 'grp_13th', label: '13th Chords', chords: [{ id: 'dom13', label: '13', display: '13' }, { id: 'maj13', label: 'Δ13', display: 'Δ13' }, { id: 'min13', label: 'm13', display: 'm13' }, { id: '7alt', label: '7alt', display: '7alt' }] },
  { id: 'grp_6th', label: '6th & Added Tone', chords: [{ id: 'maj6', label: '6', display: '6' }, { id: 'min6', label: 'm6', display: 'm6' }, { id: 'add9', label: 'add9', display: 'add9' }, { id: 'madd9', label: 'madd9', display: 'madd9' }] },
  { id: 'grp_fig', label: 'Figured Bass — Inversions', chords: [{ id: 'fig_53', label: '⁵⁄₃', display: '⁵⁄₃' }, { id: 'fig_6', label: '⁶', display: '⁶' }, { id: 'fig_64', label: '⁶⁄₄', display: '⁶⁄₄' }, { id: 'fig_7', label: '⁷', display: '⁷' }] },
  { id: 'grp_slash', label: 'Slash Inversions', chords: [{ id: 'slash_3', label: '/3', display: '/3' }, { id: 'slash_5', label: '/5', display: '/5' }] },
]

const getActivePool = (mode: AccidentalMode): NoteEntry[] => {
  if (mode === 'sharp') return SHARP_POOL_ORDERED
  if (mode === 'flat') return FLAT_POOL_ORDERED
  if (mode === 'none') return NATURAL_NOTES
  return [
    { key: 'C', letter: 'C', acc: '', pitch: 'C' }, { key: 'C#s', letter: 'C', acc: '♯', pitch: 'C#' }, { key: 'Dbf', letter: 'D', acc: '♭', pitch: 'C#' },
    { key: 'D', letter: 'D', acc: '', pitch: 'D' }, { key: 'D#s', letter: 'D', acc: '♯', pitch: 'D#' }, { key: 'Ebf', letter: 'E', acc: '♭', pitch: 'D#' },
    { key: 'E', letter: 'E', acc: '', pitch: 'E' }, { key: 'F', letter: 'F', acc: '', pitch: 'F' }, { key: 'F#s', letter: 'F', acc: '♯', pitch: 'F#' },
    { key: 'Gbf', letter: 'G', acc: '♭', pitch: 'F#' }, { key: 'G', letter: 'G', acc: '', pitch: 'G' }, { key: 'G#s', letter: 'G', acc: '♯', pitch: 'G#' },
    { key: 'Abf', letter: 'A', acc: '♭', pitch: 'G#' }, { key: 'A', letter: 'A', acc: '', pitch: 'A' }, { key: 'A#s', letter: 'A', acc: '♯', pitch: 'A#' },
    { key: 'Bbf', letter: 'B', acc: '♭', pitch: 'A#' }, { key: 'B', letter: 'B', acc: '', pitch: 'B' },
  ]
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
  const [status, setStatus] = useState('ready')
  const [noteOn, setNoteOn] = useState(true)
  const [clickOn, setClickOn] = useState(true)
  const [currentNote, setCurrentNote] = useState<DisplayNote | null>(null)
  const [nextPreview, setNextPreview] = useState<DisplayNote | null>(null)
  const [history, setHistory] = useState<DisplayNote[]>([])
  const [pulseTick, setPulseTick] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<any>(null)

  const activePool = useMemo(() => getActivePool(accidentalMode), [accidentalMode])

  const playOsc = useCallback((freq: number, type: OscillatorType, duration = 0.06, gainPeak = 0.3) => {
    const ctx = audioCtxRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)()
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
    try {
      playOsc(880, 'square', 0.04, 0.05)
    } catch {}
  }, [clickOn, playOsc])

  const playNote = useCallback((pitch: string) => {
    if (!noteOn) return
    try {
      const idx = ALL_NOTES.indexOf(pitch)
      const f = 440 * Math.pow(2, ((4 - 4) * 12 + idx - 9) / 12)
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
      setStatus('no notes selected.')
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
      setStatus(`next note in ${rem}s`)
      timerRef.current = setInterval(() => {
        rem -= 1
        if (rem <= 0) {
          rem = secsPerNote
          playTick()
          nextNote()
        }
        setStatus(`next note in ${rem}s`)
      }, 1000)
      return
    }

    const ms = (60 / bpm) * 1000
    timerRef.current = setInterval(() => {
      setCurrentBeat((prev) => {
        const cur = prev
        if (cur === 0) nextNote()
        else playTick()
        const nxt = (cur + 1) % beatsPerNote
        return nxt
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
    setStatus('playing')
    if (timingMode === 'bpm') setNextPreview(pickNote())
    nextNote()
    setCurrentBeat(1 % beatsPerNote)
  }, [beatsPerNote, isPlaying, nextNote, pickNote, timingMode])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioCtxRef.current) void audioCtxRef.current.close().catch(() => undefined)
      if (wakeLockRef.current) void wakeLockRef.current.release().catch(() => undefined)
    }
  }, [])

  const beatDots = Array.from({ length: beatsPerNote }, (_, i) => i)

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

  return (
    <div className={`ng ${timingMode === 'bpm' ? 'bpm' : ''}`}>
      <div className="stage">
        <button className={`noteRing ${isPlaying ? 'playing' : ''}`} onClick={() => !isPlaying && nextNote()} type="button">
          <div className="noteCircle" key={pulseTick}>
            <div className="noteInner">
              <span className="noteLetter">{currentNote?.displayLetter ?? '—'}</span>
              <span className="noteMod">{currentNote?.displayAcc ?? ''}</span>
              <span className="noteChord">{currentNote?.chord?.display ?? ''}</span>
            </div>
          </div>
        </button>

        <div className="dots">{beatDots.map((i) => <span key={i} className={`dot ${timingMode === 'bpm' && i === currentBeat ? (i === 0 ? 'active' : 'tick') : ''}`} />)}</div>
        {timingMode === 'bpm' && <div className="nextRow"><span className="muted">next</span><span>{nextPreview ? `${nextPreview.displayLetter}${nextPreview.displayAcc}${nextPreview.chord?.display ?? ''}` : ''}</span></div>}
        <div className="history">{history.map((h, i) => <span key={`${h.key}-${i}`}>{`${h.displayLetter}${h.displayAcc}${h.chord?.display ?? ''}`}{i < history.length - 1 ? ' · ' : ''}</span>)}</div>
      </div>

      <div className="btnRow">
        <div>
          <button className={`btn primary ${isPlaying ? 'active' : ''}`} onClick={() => setIsPlaying((p) => !p)}>{isPlaying ? 'stop' : 'start'}</button>
          <button className="btn" onClick={nextNote}>next →</button>
          <button className="btn" onClick={() => { setHistory([]); setGenCount(0); setCurrentNote(null); setNextPreview(null); setStatus('ready') }}>clear</button>
        </div>
        <div>
          <span className="muted">sound</span>
          <button className={`btn ${!noteOn ? 'mutedBtn' : ''}`} onClick={() => setNoteOn((v) => !v)}>note</button>
          <button className={`btn ${!clickOn ? 'mutedBtn' : ''}`} onClick={() => setClickOn((v) => !v)}>click</button>
        </div>
      </div>

      <div className="controls">
        <div className="card">
          <div className="row"><span>Timing</span><div><button className={`pill ${timingMode === 'seconds' ? 'on' : ''}`} onClick={() => setTimingMode('seconds')}>seconds</button><button className={`pill ${timingMode === 'bpm' ? 'on' : ''}`} onClick={() => setTimingMode('bpm')}>bpm</button></div></div>
          {timingMode === 'seconds' ? (
            <>
              <div className="row"><span>Seconds per note</span><span>{secsPerNote}</span></div>
              <input type="range" min={1} max={30} value={secsPerNote} onChange={(e) => setSecsPerNote(Number(e.target.value))} />
            </>
          ) : (
            <div className="split">
              <div><div className="row"><span>Tempo</span><span>{bpm}</span></div><input type="range" min={20} max={240} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} /></div>
              <div><div className="row"><span>Beats per note</span><span>{beatsPerNote}</span></div><input type="range" min={1} max={8} value={beatsPerNote} onChange={(e) => setBeatsPerNote(Number(e.target.value))} /></div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="row"><span>Notes</span><div><button className="tiny" onClick={selectAllNotes}>all</button><button className="tiny" onClick={selectNoNotes}>none</button></div></div>
          <div className="chips">{activePool.map((n) => {
            const label = notationMode === 'solfege' ? `${SOLFEGE_LETTER[n.letter] ?? n.letter}${n.acc}` : `${n.letter}${n.acc}`
            const on = activeNoteKeys.has(n.key)
            return <button key={n.key} className={`chip ${on ? 'on' : ''}`} onClick={() => setActiveNoteKeys((prev) => { const next = new Set(prev); on ? next.delete(n.key) : next.add(n.key); return next })}>{label}</button>
          })}</div>
        </div>

        <div className="card">
          <div className="row"><span>Display</span></div>
          <div className="split">
            <div><div className="muted">Notation</div><button className={`pill ${notationMode === 'alpha' ? 'on' : ''}`} onClick={() => setNotationMode('alpha')}>ABC</button><button className={`pill ${notationMode === 'solfege' ? 'on' : ''}`} onClick={() => setNotationMode('solfege')}>Do-Re-Mi</button></div>
            <div><div className="muted">Accidentals</div><button className={`pill ${accidentalMode === 'sharp' ? 'on' : ''}`} onClick={() => setAccMode('sharp')}>sharps</button><button className={`pill ${accidentalMode === 'flat' ? 'on' : ''}`} onClick={() => setAccMode('flat')}>flats</button><button className={`pill ${accidentalMode === 'both' ? 'on' : ''}`} onClick={() => setAccMode('both')}>both</button><button className={`pill ${accidentalMode === 'none' ? 'on' : ''}`} onClick={() => setAccMode('none')}>none</button></div>
          </div>
        </div>

        <div className="card">
          <div className="row"><span>Chord Quality & Inversion</span><div><button className="tiny" onClick={selectAllChords}>all</button><button className="tiny" onClick={selectNoChords}>none</button></div></div>
          {CHORD_GROUPS.map((group) => {
            const allOn = group.chords.every((c) => activeChordIds.has(c.id))
            return (
              <div key={group.id} style={{ marginBottom: 8 }}>
                <div className="row"><span className="muted">{group.label}</span><button className={`tiny ${allOn ? 'on' : ''}`} onClick={() => setActiveChordIds((prev) => { const next = new Set(prev); if (allOn) group.chords.forEach((c) => next.delete(c.id)); else group.chords.forEach((c) => next.add(c.id)); return next })}>{allOn ? 'deselect' : 'select'}</button></div>
                <div className="chips">{group.chords.map((c) => {
                  const on = activeChordIds.has(c.id)
                  return <button key={c.id} className={`chip ${on ? 'on' : ''}`} onClick={() => setActiveChordIds((prev) => { const next = new Set(prev); on ? next.delete(c.id) : next.add(c.id); return next })}>{c.label}</button>
                })}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="status">Notes active: <strong>{activeNoteKeys.size}</strong> · Generated: <strong>{genCount}</strong> · {status}</div>

      <style>{`
        .ng { background:#F2EDDF; color:#2A2318; min-height:calc(var(--nl-viewport-h) - var(--nl-site-header-h)); padding:16px 20px 20px; font-family:${F}; overflow:auto; }
        .stage { max-width:960px; margin:0 auto; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .noteRing { width:clamp(120px,18vw,200px); height:clamp(120px,18vw,200px); border-radius:999px; border:1.5px solid #CFC6B8; background:transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .noteRing.playing { background:#2A2318; border-color:#2A2318; }
        .noteInner { display:flex; align-items:baseline; }
        .noteLetter { font-family:${SERIF}; font-size:clamp(2.8rem,10vw,5.5rem); font-style:italic; color:#2A2318; }
        .noteMod { font-family:${SERIF}; font-size:clamp(1.7rem,6vw,3.3rem); color:#2A2318; }
        .noteChord { font-family:${SERIF}; font-size:clamp(.85rem,3vw,1.5rem); color:#2A2318; padding-left:.05em; }
        .noteRing.playing .noteLetter, .noteRing.playing .noteMod, .noteRing.playing .noteChord { color:#F2EDDF; }
        .dots { display:flex; gap:7px; min-height:12px; }
        .dot { width:5px; height:5px; border-radius:50%; background:#CFC6B8; }
        .dot.active { background:#2A2318; transform:scale(1.5); }
        .dot.tick { background:#8F8578; transform:scale(1.2); }
        .nextRow { display:flex; gap:.4rem; font-size:12px; min-height:18px; }
        .history { min-height:20px; font-size:14px; color:#8F8578; text-align:center; }
        .btnRow, .controls, .status { max-width:960px; margin:0 auto; }
        .btnRow { display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-top:10px; }
        .btn { border:1px solid #CFC6B8; border-radius:999px; background:transparent; color:#2A2318; padding:8px 14px; margin-right:6px; cursor:pointer; }
        .btn.primary { background:#2A2318; color:#F2EDDF; }
        .btn.primary.active { background:transparent; color:#2A2318; }
        .mutedBtn { text-decoration:line-through; color:#B5AD9F; }
        .controls { margin-top:10px; border:1px solid #D9D1C5; display:grid; grid-template-columns:1fr; }
        .card { border-bottom:1px solid #D9D1C5; padding:12px; }
        .card:last-child { border-bottom:none; }
        .row { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px; font-size:12px; text-transform:uppercase; letter-spacing:.1em; }
        .split { display:grid; grid-template-columns:1fr; gap:10px; }
        .chips { display:flex; flex-wrap:wrap; gap:5px; }
        .chip, .tiny, .pill { border:1px solid #CFC6B8; background:transparent; color:#7B7265; border-radius:999px; padding:4px 11px; cursor:pointer; font-family:${F}; }
        .chip.on, .tiny.on, .pill.on { background:#2A2318; color:#F2EDDF; border-color:#2A2318; }
        .status { margin-top:8px; padding:8px 0; border-top:1px solid #D9D1C5; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:#8F8578; }
        strong { color:#2A2318; font-weight:500; }
        input[type='range'] { width:100%; appearance:none; height:1px; background:#CFC6B8; }
        input[type='range']::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#2A2318; border:2px solid #F2EDDF; box-shadow:0 0 0 1px #2A2318; }
        input[type='range']::-moz-range-thumb { width:14px; height:14px; border-radius:50%; background:#2A2318; border:2px solid #F2EDDF; box-shadow:0 0 0 1px #2A2318; }
        @media (min-width:900px) { .controls { grid-template-columns:5fr 7fr; } .card:nth-child(1), .card:nth-child(2), .card:nth-child(3) { border-right:1px solid #D9D1C5; } .card:nth-child(4) { grid-row:1 / span 3; grid-column:2; border-bottom:none; } }
      `}</style>
    </div>
  )
}

