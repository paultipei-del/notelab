'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { RhythmExercise, RhythmNote } from '@/lib/parseMXL'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const BPM = 72

// Bravura codepoints
const BRAVURA = {
  quarterRest: String.fromCodePoint(0xE4E5),
  halfRest:    String.fromCodePoint(0xE4E4),
  wholeRest:   String.fromCodePoint(0xE4E3),
  timeSig: (n: number) => String.fromCodePoint(0xE080 + n),
}

// ── Notation math ─────────────────────────────────────────────────────────────
const STAFF_Y = 52
const STEM_H = 36

function buildLayout(exercise: RhythmExercise, svgW: number, rowMeasures: typeof exercise.measures) {
  const beatsPerMeasure = exercise.timeSignature.beats
  const usableW = svgW - 96  // leave room for time sig + final barline
  const measureW = usableW / rowMeasures.length
  const noteW = measureW / beatsPerMeasure
  return { measureW, noteW, beatsPerMeasure }
}

function NoteHead({ x, y, filled }: { x: number; y: number; filled: boolean }) {
  return filled
    ? <ellipse cx={x} cy={y} rx={9} ry={6} fill="#1A1A18" transform={`rotate(-15 ${x} ${y})`} />
    : <ellipse cx={x} cy={y} rx={9} ry={6} fill="none" stroke="#1A1A18" strokeWidth={1.6} transform={`rotate(-15 ${x} ${y})`} />
}

function Stem({ x, y }: { x: number; y: number }) {
  return <line x1={x + 8.5} y1={y} x2={x + 8.5} y2={y - STEM_H} stroke="#1A1A18" strokeWidth={1.6} />
}

function RestSymbol({ x, type }: { x: number; type: string }) {
  if (type === 'whole')   return <rect x={x - 7} y={STAFF_Y + 3} width={14} height={5} fill="#1A1A18" />
  if (type === 'half')    return <rect x={x - 7} y={STAFF_Y - 8} width={14} height={5} fill="#1A1A18" />
  if (type === 'quarter') return <text x={x} y={STAFF_Y + 8} fontSize={18} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle">{BRAVURA.quarterRest}</text>
  return <text x={x} y={STAFF_Y + 8} fontSize={14} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle">{BRAVURA.quarterRest}</text>
}

function Dot({ x }: { x: number }) {
  return <circle cx={x + 10} cy={STAFF_Y - 3} r={2} fill="#1A1A18" />
}

function TieCurve({ x1, x2 }: { x1: number; x2: number }) {
  const mx = (x1 + x2) / 2
  return <path d={`M ${x1+5} ${STAFF_Y+6} Q ${mx} ${STAFF_Y+18} ${x2+5} ${STAFF_Y+6}`} fill="none" stroke="#1A1A18" strokeWidth={1.1} />
}

function renderMeasure(
  notes: RhythmNote[], mx: number, noteW: number,
  highlight: number | null, tapResult: ('hit'|'miss'|'none')[]
) {
  const els: React.ReactElement[] = []
  let beatPos = 0
  notes.forEach((note, i) => {
    const x = mx + beatPos * noteW + noteW * 0.5
    const filled = note.type === 'quarter' || note.type === 'eighth' || note.type === 'sixteenth'
    const isActive = highlight !== null && beatPos <= highlight && highlight < beatPos + note.durationBeats
    const tr = tapResult[i]

    // Highlight background
    if (isActive) {
      els.push(<rect key={`hl-${i}`} x={mx + beatPos * noteW + 2} y={STAFF_Y - 22} width={note.durationBeats * noteW - 4} height={44} fill="#BA7517" opacity={0.18} rx={4} />)
    }
    // Tap result coloring
    if (tr === 'hit')  els.push(<rect key={`tr-${i}`} x={mx + beatPos * noteW + 2} y={STAFF_Y - 22} width={note.durationBeats * noteW - 4} height={44} fill="#7EC86E" opacity={0.2} rx={4} />)
    if (tr === 'miss') els.push(<rect key={`tr-${i}`} x={mx + beatPos * noteW + 2} y={STAFF_Y - 22} width={note.durationBeats * noteW - 4} height={44} fill="#F09595" opacity={0.2} rx={4} />)

    if (note.rest) {
      els.push(<RestSymbol key={`r-${i}`} x={x} type={note.type} />)
    } else {
      els.push(<NoteHead key={`nh-${i}`} x={x} y={STAFF_Y} filled={filled} />)
      if (note.type !== 'whole') els.push(<Stem key={`st-${i}`} x={x} y={STAFF_Y} />)
      if (note.dot) els.push(<Dot key={`d-${i}`} x={x} />)
      if (note.tieStart && i < notes.length - 1) {
        const nextX = mx + (beatPos + note.durationBeats) * noteW + noteW * 0.5
        els.push(<TieCurve key={`tie-${i}`} x1={x} x2={nextX} />)
      }
    }
    beatPos += note.durationBeats
  })
  return els
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RhythmPage() {
  const [exercise, setExercise] = useState<RhythmExercise | null>(null)
  const [view, setView] = useState<'notation' | 'grid'>('notation')
  const [playing, setPlaying] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [currentBeat, setCurrentBeat] = useState<{ measure: number; beat: number } | null>(null)
  const [taps, setTaps] = useState<number[]>([])
  const [tapResults, setTapResults] = useState<('hit'|'miss'|'none')[][]>([])
  const [score, setScore] = useState<{ hits: number; total: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgWidth, setSvgWidth] = useState(800)

  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef(0)
  const startTimeRef = useRef(0)

  const beatDuration = 60 / BPM
  const totalBeats = exercise ? exercise.timeSignature.beats * exercise.measures.length : 0

  // Measure container width for responsive layout
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(entries => {
      setSvgWidth(entries[0].contentRect.width - 48)
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [exercise])

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    return ctxRef.current
  }

  const playClick = (time: number, accent: boolean) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = accent ? 1000 : 700
    gain.gain.setValueAtTime(accent ? 0.35 : 0.15, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.start(time); osc.stop(time + 0.06)
  }

  const start = useCallback(() => {
    if (!exercise) return
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    setTaps([]); setScore(null); setTapResults([])
    setPlaying(true)

    const beatsPerMeasure = exercise.timeSignature.beats
    const countdownBeats = beatsPerMeasure  // one full measure countdown
    const now = ctx.currentTime + 0.1
    startTimeRef.current = now + countdownBeats * beatDuration

    // Schedule countdown clicks
    for (let i = 0; i < countdownBeats; i++) {
      playClick(now + i * beatDuration, i === 0)
    }
    // Schedule exercise clicks
    for (let i = 0; i < totalBeats; i++) {
      playClick(startTimeRef.current + i * beatDuration, i % beatsPerMeasure === 0)
    }

    // Animate countdown
    let countdownStart = now
    const tick = () => {
      const ctx2 = ctxRef.current; if (!ctx2) return
      const elapsed = ctx2.currentTime - countdownStart
      const countBeat = Math.floor(elapsed / beatDuration)

      if (elapsed < countdownBeats * beatDuration) {
        // Still in countdown
        setCountdown(countBeat + 1)
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      setCountdown(null)
      const exerciseElapsed = ctx2.currentTime - startTimeRef.current
      const beat = Math.floor(exerciseElapsed / beatDuration)

      if (beat >= totalBeats) {
        setCurrentBeat(null)
        setPlaying(false)
        return
      }
      setCurrentBeat({
        measure: Math.floor(beat / beatsPerMeasure),
        beat: beat % beatsPerMeasure,
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [exercise, totalBeats, beatDuration])

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    setPlaying(false); setCurrentBeat(null); setCountdown(null)
  }

  // Tap handler — only active after countdown
  useEffect(() => {
    if (!playing || !exercise || countdown !== null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      const ctx = ctxRef.current; if (!ctx) return
      const elapsed = ctx.currentTime - startTimeRef.current
      const beat = Math.round(elapsed / beatDuration)
      setTaps(prev => [...prev, Math.max(0, Math.min(beat, totalBeats - 1))])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, countdown, beatDuration, totalBeats, exercise])

  // Score when done
  useEffect(() => {
    if (playing || !exercise || taps.length === 0) return
    const expected: number[] = []
    let pos = 0
    exercise.measures.forEach(m => {
      m.notes.forEach(n => {
        if (!n.rest && !n.tieStop) expected.push(Math.round(pos))
        pos += n.durationBeats
      })
    })
    const hits = expected.filter(e => taps.includes(e)).length

    // Per-note tap results for visual feedback
    let pos2 = 0
    const perMeasure = exercise.measures.map(m => {
      return m.notes.map(n => {
        const beatIdx = Math.round(pos2)
        pos2 += n.durationBeats
        if (n.rest || n.tieStop) return 'none' as const
        return taps.includes(beatIdx) ? 'hit' as const : 'miss' as const
      })
    })
    setTapResults(perMeasure)
    setScore({ hits, total: expected.length })
  }, [playing])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]; if (!file) return
    const { parseMXL } = await import('@/lib/parseMXL')
    const buffer = await file.arrayBuffer()
    const ex = await parseMXL(buffer)
    setExercise(ex); setScore(null); setTaps([]); setTapResults([])
  }, [])

  // Layout: fit all measures in rows, no scrolling needed
  const MEASURES_PER_ROW = exercise
    ? Math.min(exercise.measures.length, exercise.timeSignature.beats <= 3 ? 5 : 4)
    : 4
  const SVG_H = 130
  const rows = exercise
    ? Array.from({ length: Math.ceil(exercise.measures.length / MEASURES_PER_ROW) },
        (_, i) => exercise.measures.slice(i * MEASURES_PER_ROW, (i + 1) * MEASURES_PER_ROW))
    : []

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#1A1A18', marginBottom: '4px' }}>Rhythm Trainer</h1>
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>
            {exercise ? `${exercise.title} · ${exercise.timeSignature.beats}/${exercise.timeSignature.beatType} · ${BPM} BPM` : 'Drop a .mxl file to load an exercise'} · tap Space
          </p>
        </div>

        {/* Drop zone */}
        {!exercise && (
          <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
            style={{ border: `2px dashed ${dragOver ? '#BA7517' : '#D3D1C7'}`, borderRadius: '16px', padding: '80px 32px', textAlign: 'center' as const, background: dragOver ? '#FEF3E2' : 'white', transition: 'all 0.2s' }}>
            <p style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 300, color: '#888780', marginBottom: '8px' }}>Drop a .mxl file here</p>
            <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#D3D1C7' }}>Export from MuseScore as .mxl</p>
          </div>
        )}

        {exercise && (
          <>
            {/* Controls row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
              {(['notation', 'grid'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid ' + (view === v ? '#1A1A18' : '#D3D1C7'), background: view === v ? '#1A1A18' : 'white', color: view === v ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
                  {v === 'notation' ? '𝄞 Notation' : '⊞ Grid'}
                </button>
              ))}
              <button onClick={() => { setExercise(null); stop() }}
                style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #D3D1C7', background: 'white', color: '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
                Load new
              </button>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                {score && !playing && (
                  <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: score.hits === score.total ? '#4CAF50' : '#1A1A18' }}>
                    {score.hits}/{score.total} · {Math.round(score.hits/score.total*100)}%
                  </p>
                )}
                {!playing ? (
                  <button onClick={start}
                    style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
                    {score ? 'Try Again' : 'Start'}
                  </button>
                ) : (
                  <button onClick={stop}
                    style={{ background: 'none', color: '#888780', border: '1px solid #D3D1C7', borderRadius: '10px', padding: '10px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/* Countdown overlay */}
            {countdown !== null && (
              <div style={{ textAlign: 'center' as const, marginBottom: '16px' }}>
                <span style={{ fontFamily: SERIF, fontSize: '48px', fontWeight: 300, color: '#BA7517' }}>{countdown}</span>
              </div>
            )}

            {/* Exercise area */}
            <div ref={containerRef} style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '24px' }}>

              {/* NOTATION VIEW */}
              {view === 'notation' && rows.map((rowMeasures, rowIdx) => {
                const { measureW, noteW } = buildLayout(exercise, svgWidth, rowMeasures)
                const isLastRow = rowIdx === rows.length - 1
                return (
                  <svg key={rowIdx} width={svgWidth} height={SVG_H} style={{ display: 'block' }}>
                    {/* Time signature — first row only */}
                    {rowIdx === 0 && (
                      <>
                        <text x={34} y={STAFF_Y - 18} fontSize={40} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="middle">
                          {String.fromCodePoint(0xE080 + exercise.timeSignature.beats)}
                        </text>
                        <text x={34} y={STAFF_Y + 8} fontSize={40} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="middle">
                          {String.fromCodePoint(0xE080 + exercise.timeSignature.beatType)}
                        </text>
                      </>
                    )}
                    {/* Opening barline */}
                    <line x1={56} y1={STAFF_Y - 28} x2={56} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1} />
                    {/* Single staff line */}
                    <line x1={56} y1={STAFF_Y} x2={svgWidth - 8} y2={STAFF_Y} stroke="#1A1A18" strokeWidth={1.2} />
                    {/* Measures */}
                    {rowMeasures.map((measure, mIdx) => {
                      const mx = 56 + mIdx * measureW
                      const globalMeasureIdx = rowIdx * MEASURES_PER_ROW + mIdx
                      const isCurrentMeasure = currentBeat?.measure === globalMeasureIdx
                      const highlightBeat = isCurrentMeasure ? currentBeat!.beat : null
                      const tapRes: ('hit'|'miss'|'none')[] = tapResults[globalMeasureIdx] ?? measure.notes.map(() => 'none' as const)
                      return (
                        <g key={mIdx}>
                          {renderMeasure(measure.notes, mx, noteW, highlightBeat, tapRes)}
                          {!(isLastRow && mIdx === rowMeasures.length - 1) && (
                              <line x1={mx + measureW} y1={STAFF_Y - 28} x2={mx + measureW} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1} />
                            )}
                        </g>
                      )
                    })}
                    {/* Final double barline on last row — thin then thick with gap */}
                    {isLastRow && (
                      <>
                        <line x1={svgWidth - 16} y1={STAFF_Y - 28} x2={svgWidth - 16} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1.2} />
                        <line x1={svgWidth - 9} y1={STAFF_Y - 28} x2={svgWidth - 9} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={7} />
                      </>
                    )}
                  </svg>
                )
              })}

              {/* GRID VIEW */}
              {view === 'grid' && exercise.measures.map((measure, mIdx) => (
                <div key={mIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontFamily: F, fontSize: '10px', color: '#888780', width: '18px', flexShrink: 0 }}>{mIdx + 1}</span>
                  <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                    {measure.notes.map((note, nIdx) => {
                      const isCurrentMeasure = currentBeat?.measure === mIdx
                      const isCurrent = isCurrentMeasure && currentBeat !== null
                      const tr: 'hit'|'miss'|'none' = tapResults[mIdx]?.[nIdx] ?? 'none'
                      const flex = note.durationBeats
                      let bg = note.rest ? '#F5F2EC' : '#1A1A18'
                      let border = '1px solid #D3D1C7'
                      if (isCurrent) border = '2px solid #BA7517'
                      if (tr === 'hit') bg = '#7EC86E'
                      if (tr === 'miss') bg = note.rest ? '#F5F2EC' : '#F09595'
                      return (
                        <div key={nIdx} style={{ flex, height: '40px', borderRadius: '8px', background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px', transition: 'all 0.15s' }}>
                          {note.rest && <span style={{ fontFamily: F, fontSize: '9px', color: '#888780' }}>rest</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

            </div>
          </>
        )}
      </div>
    </div>
  )
}
