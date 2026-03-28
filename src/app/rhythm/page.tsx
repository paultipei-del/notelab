'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { RhythmExercise, RhythmNote } from '@/lib/parseMXL'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const BRAVURA = {
  quarterRest: String.fromCodePoint(0xE4E5),
  halfRest:    String.fromCodePoint(0xE4E4),
  wholeRest:   String.fromCodePoint(0xE4E3),
}

const STAFF_Y = 52
const STEM_H = 36

function buildLayout(exercise: RhythmExercise, svgW: number, rowMeasures: typeof exercise.measures) {
  const beatsPerMeasure = exercise.timeSignature.beats
  const usableW = svgW - 96
  const measureW = usableW / rowMeasures.length
  const noteW = measureW / beatsPerMeasure
  return { measureW, noteW, beatsPerMeasure }
}

function NoteHead({ x, y, filled, color }: { x: number; y: number; filled: boolean; color: string }) {
  return filled
    ? <ellipse cx={x} cy={y} rx={9} ry={6} fill={color} transform={`rotate(-15 ${x} ${y})`} />
    : <ellipse cx={x} cy={y} rx={9} ry={6} fill="none" stroke={color} strokeWidth={1.6} transform={`rotate(-15 ${x} ${y})`} />
}

function Stem({ x, y, color }: { x: number; y: number; color: string }) {
  return <line x1={x + 8.5} y1={y} x2={x + 8.5} y2={y - STEM_H} stroke={color} strokeWidth={1.6} />
}

function RestSymbol({ x, type }: { x: number; type: string }) {
  if (type === 'whole') return <rect x={x - 7} y={STAFF_Y + 3} width={14} height={5} fill="#1A1A18" />
  if (type === 'half')  return <rect x={x - 7} y={STAFF_Y - 8} width={14} height={5} fill="#1A1A18" />
  return <text x={x} y={STAFF_Y + 8} fontSize={18} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle">{BRAVURA.quarterRest}</text>
}

function Dot({ x, color }: { x: number; color: string }) {
  return <circle cx={x + 10} cy={STAFF_Y - 3} r={2} fill={color} />
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

    // Active beat highlight
    if (isActive) {
      els.push(<rect key={`hl-${i}`} x={mx + beatPos * noteW + 2} y={STAFF_Y - 24} width={note.durationBeats * noteW - 4} height={48} fill="#BA7517" opacity={0.12} rx={4} />)
    }

    // Note color based on tap result
    const noteColor = tr === 'hit' ? '#4CAF50' : tr === 'miss' ? '#E53935' : '#1A1A18'

    if (note.rest) {
      els.push(<RestSymbol key={`r-${i}`} x={x} type={note.type} />)
    } else {
      els.push(<NoteHead key={`nh-${i}`} x={x} y={STAFF_Y} filled={filled} color={noteColor} />)
      if (note.type !== 'whole') els.push(<Stem key={`st-${i}`} x={x} y={STAFF_Y} color={noteColor} />)
      if (note.dot) els.push(<Dot key={`d-${i}`} x={x} color={noteColor} />)
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
  const [bpm, setBpm] = useState(72)
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

  const beatDuration = 60 / bpm
  const totalBeats = exercise ? exercise.timeSignature.beats * exercise.measures.length : 0

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(entries => setSvgWidth(entries[0].contentRect.width - 48))
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
    const countdownBeats = beatsPerMeasure
    const now = ctx.currentTime + 0.1
    startTimeRef.current = now + countdownBeats * beatDuration

    for (let i = 0; i < countdownBeats; i++) playClick(now + i * beatDuration, i === 0)
    for (let i = 0; i < totalBeats; i++) playClick(startTimeRef.current + i * beatDuration, i % beatsPerMeasure === 0)

    const countdownStart = now
    const tick = () => {
      const ctx2 = ctxRef.current; if (!ctx2) return
      const elapsed = ctx2.currentTime - countdownStart
      if (elapsed < countdownBeats * beatDuration) {
        setCountdown(Math.floor(elapsed / beatDuration) + 1)
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      setCountdown(null)
      const beat = Math.floor((ctx2.currentTime - startTimeRef.current) / beatDuration)
      if (beat >= totalBeats) { setCurrentBeat(null); setPlaying(false); return }
      setCurrentBeat({ measure: Math.floor(beat / beatsPerMeasure), beat: beat % beatsPerMeasure })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [exercise, totalBeats, beatDuration])

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    setPlaying(false); setCurrentBeat(null); setCountdown(null)
  }

  // Keyboard tap
  useEffect(() => {
    if (!playing || !exercise || countdown !== null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      const ctx = ctxRef.current; if (!ctx) return
      const beat = Math.round((ctx.currentTime - startTimeRef.current) / beatDuration)
      setTaps(prev => [...prev, Math.max(0, Math.min(beat, totalBeats - 1))])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, countdown, beatDuration, totalBeats, exercise])

  // Score on finish
  useEffect(() => {
    if (playing || !exercise || taps.length === 0) return
    const expected: number[] = []
    let pos = 0
    exercise.measures.forEach(m => m.notes.forEach(n => {
      if (!n.rest && !n.tieStop) expected.push(Math.round(pos))
      pos += n.durationBeats
    }))
    const hits = expected.filter(e => taps.includes(e)).length
    let pos2 = 0
    const perMeasure = exercise.measures.map(m => m.notes.map(n => {
      const beatIdx = Math.round(pos2)
      pos2 += n.durationBeats
      if (n.rest || n.tieStop) return 'none' as const
      return taps.includes(beatIdx) ? 'hit' as const : 'miss' as const
    }))
    setTapResults(perMeasure)
    setScore({ hits, total: expected.length })
  }, [playing])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]; if (!file) return
    const { parseMXL } = await import('@/lib/parseMXL')
    const ex = await parseMXL(await file.arrayBuffer())
    setExercise(ex); setScore(null); setTaps([]); setTapResults([])
  }, [])

  // Mobile tap handler
  const handleTap = useCallback(() => {
    if (!playing || countdown !== null) return
    const ctx = ctxRef.current; if (!ctx) return
    const beat = Math.round((ctx.currentTime - startTimeRef.current) / beatDuration)
    setTaps(prev => [...prev, Math.max(0, Math.min(beat, totalBeats - 1))])
  }, [playing, countdown, beatDuration, totalBeats])

  const MEASURES_PER_ROW = exercise
    ? Math.min(exercise.measures.length, exercise.timeSignature.beats <= 3 ? 5 : 4)
    : 4
  const SVG_H = 130
  const rows = exercise
    ? Array.from({ length: Math.ceil(exercise.measures.length / MEASURES_PER_ROW) },
        (_, i) => exercise.measures.slice(i * MEASURES_PER_ROW, (i + 1) * MEASURES_PER_ROW))
    : []

  const pct = score && score.total > 0 ? Math.round(score.hits / score.total * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#1A1A18', marginBottom: '4px' }}>Rhythm Trainer</h1>
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>
            {exercise
              ? `${exercise.timeSignature.beats}/${exercise.timeSignature.beatType} · ${bpm} BPM`
              : 'Drop a .mxl file to load an exercise'}
            {!exercise && ' · tap Space or button below'}
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' as const }}>
              {/* View toggle */}
              {(['notation', 'grid'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid ' + (view === v ? '#1A1A18' : '#D3D1C7'), background: view === v ? '#1A1A18' : 'white', color: view === v ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
                  {v === 'notation' ? '𝄞 Notation' : '⊞ Grid'}
                </button>
              ))}

              {/* BPM control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                <button onClick={() => setBpm(b => Math.max(40, b - 4))} disabled={playing}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #D3D1C7', background: 'white', color: '#888780', fontFamily: F, fontSize: '16px', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1 }}>−</button>
                <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#1A1A18', minWidth: '54px', textAlign: 'center' as const }}>{bpm} BPM</span>
                <button onClick={() => setBpm(b => Math.min(200, b + 4))} disabled={playing}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #D3D1C7', background: 'white', color: '#888780', fontFamily: F, fontSize: '16px', cursor: playing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: playing ? 0.4 : 1 }}>+</button>
              </div>

              <button onClick={() => { setExercise(null); stop() }}
                style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #D3D1C7', background: 'white', color: '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer' }}>
                Load new
              </button>

              {/* Score + start/stop */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                {score && !playing && (
                  <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: pct === 100 ? '#4CAF50' : '#1A1A18' }}>
                    {score.hits}/{score.total} · {pct}%
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

            {/* Countdown */}
            {countdown !== null && (
              <div style={{ textAlign: 'center' as const, marginBottom: '12px' }}>
                <span style={{ fontFamily: SERIF, fontSize: '56px', fontWeight: 300, color: '#BA7517' }}>{countdown}</span>
              </div>
            )}

            {/* Exercise area */}
            <div ref={containerRef} style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '24px', marginBottom: '20px' }}>

              {/* NOTATION */}
              {view === 'notation' && rows.map((rowMeasures, rowIdx) => {
                const { measureW, noteW } = buildLayout(exercise, svgWidth, rowMeasures)
                const isLastRow = rowIdx === rows.length - 1
                return (
                  <svg key={rowIdx} width={svgWidth} height={SVG_H} style={{ display: 'block' }}>
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
                    <line x1={56} y1={STAFF_Y - 28} x2={56} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1} />
                    <line x1={56} y1={STAFF_Y} x2={svgWidth - 8} y2={STAFF_Y} stroke="#1A1A18" strokeWidth={1.2} />
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
                    {isLastRow && (
                      <>
                        <line x1={svgWidth - 16} y1={STAFF_Y - 28} x2={svgWidth - 16} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={1.2} />
                        <line x1={svgWidth - 9} y1={STAFF_Y - 28} x2={svgWidth - 9} y2={STAFF_Y + 28} stroke="#1A1A18" strokeWidth={7} />
                      </>
                    )}
                  </svg>
                )
              })}

              {/* GRID */}
              {view === 'grid' && exercise.measures.map((measure, mIdx) => (
                <div key={mIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontFamily: F, fontSize: '10px', color: '#888780', width: '18px', flexShrink: 0 }}>{mIdx + 1}</span>
                  <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                    {measure.notes.map((note, nIdx) => {
                      const isCurrent = currentBeat?.measure === mIdx
                      const tr: 'hit'|'miss'|'none' = tapResults[mIdx]?.[nIdx] ?? 'none'
                      let bg = note.rest ? '#F5F2EC' : '#1A1A18'
                      let border = '1px solid #D3D1C7'
                      if (isCurrent) border = '2px solid #BA7517'
                      if (tr === 'hit') bg = '#4CAF50'
                      if (tr === 'miss' && !note.rest) bg = '#E53935'
                      return (
                        <div key={nIdx} style={{ flex: note.durationBeats, height: '40px', borderRadius: '8px', background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px', transition: 'all 0.15s' }}>
                          {note.rest && <span style={{ fontFamily: F, fontSize: '9px', color: '#888780' }}>rest</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile tap button */}
            <button
              onPointerDown={handleTap}
              disabled={!playing || countdown !== null}
              style={{ width: '100%', height: '72px', borderRadius: '16px', border: '2px solid #D3D1C7', background: playing && countdown === null ? '#1A1A18' : '#F5F2EC', color: playing && countdown === null ? 'white' : '#D3D1C7', fontFamily: F, fontSize: '15px', fontWeight: 300, cursor: playing && countdown === null ? 'pointer' : 'default', transition: 'all 0.15s', letterSpacing: '0.08em' }}>
              {countdown !== null ? String(countdown) : playing ? 'TAP' : score ? `${pct}%` : '·'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
