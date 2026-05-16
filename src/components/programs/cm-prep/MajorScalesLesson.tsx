'use client'

import { useState, useRef, useMemo } from 'react'
import { ExerciseNavBar } from './nav/ExerciseNavBar'

const F       = 'var(--font-jost), sans-serif'
const DARK    = '#1A1A18'
const GREY    = '#B0ACA4'
const ACCENT  = '#BA7517'
const MAJ_C   = '#2A5C0A'
const HALF_C  = '#B5402A'
const CORRECT = '#2d5a3e'
const WRONG   = '#a0381c'
const STROKE  = 1.3

// ── Staff geometry (wider than other lessons — 8 notes need room) ──────────
const step  = 8
const sL    = 32
const sR    = 600
const tTop  = 40                            // room above for letter labels
const svgW  = sR + 16
const svgH  = tTop + 8 * step + 80          // room below for W/H step toggles

function posToY(pos: number) { return tTop + (10 - pos) * step }
function lineY(n: number)    { return tTop + (5 - n) * 2 * step }

// ── Shared data ────────────────────────────────────────────────────────────
type Clef = 'treble' | 'bass'
type AccType = 'flat' | 'sharp' | 'natural'
type KeyName = 'C' | 'F' | 'G'

interface ScaleNote { pos: number; letter: string; acc?: AccType }

// 8-note ascending major scales per key + clef
const SCALES: Record<KeyName, Record<Clef, ScaleNote[]>> = {
  C: {
    treble: [
      { pos: 0, letter: 'C' }, { pos: 1, letter: 'D' }, { pos: 2, letter: 'E' }, { pos: 3, letter: 'F' },
      { pos: 4, letter: 'G' }, { pos: 5, letter: 'A' }, { pos: 6, letter: 'B' }, { pos: 7, letter: 'C' },
    ],
    bass: [
      { pos: 5, letter: 'C' }, { pos: 6, letter: 'D' }, { pos: 7, letter: 'E' }, { pos: 8, letter: 'F' },
      { pos: 9, letter: 'G' }, { pos: 10, letter: 'A' }, { pos: 11, letter: 'B' }, { pos: 12, letter: 'C' },
    ],
  },
  F: {
    treble: [
      { pos: 3, letter: 'F' }, { pos: 4, letter: 'G' }, { pos: 5, letter: 'A' }, { pos: 6, letter: 'B', acc: 'flat' },
      { pos: 7, letter: 'C' }, { pos: 8, letter: 'D' }, { pos: 9, letter: 'E' }, { pos: 10, letter: 'F' },
    ],
    bass: [
      { pos: 1, letter: 'F' }, { pos: 2, letter: 'G' }, { pos: 3, letter: 'A' }, { pos: 4, letter: 'B', acc: 'flat' },
      { pos: 5, letter: 'C' }, { pos: 6, letter: 'D' }, { pos: 7, letter: 'E' }, { pos: 8, letter: 'F' },
    ],
  },
  G: {
    treble: [
      { pos: 4, letter: 'G' }, { pos: 5, letter: 'A' }, { pos: 6, letter: 'B' }, { pos: 7, letter: 'C' },
      { pos: 8, letter: 'D' }, { pos: 9, letter: 'E' }, { pos: 10, letter: 'F', acc: 'sharp' }, { pos: 11, letter: 'G' },
    ],
    bass: [
      { pos: 2, letter: 'G' }, { pos: 3, letter: 'A' }, { pos: 4, letter: 'B' }, { pos: 5, letter: 'C' },
      { pos: 6, letter: 'D' }, { pos: 7, letter: 'E' }, { pos: 8, letter: 'F', acc: 'sharp' }, { pos: 9, letter: 'G' },
    ],
  },
}

// Every major scale has the same step sequence
const SCALE_STEPS: ('W' | 'H')[] = ['W', 'W', 'H', 'W', 'W', 'W', 'H']

// Note x-positions across the staff (8 equally-spaced noteheads)
const NOTE_X_START = 100
const NOTE_X_END   = sR - 30
const NOTE_XS = Array.from({ length: 8 }, (_, i) =>
  NOTE_X_START + (i + 0.5) * ((NOTE_X_END - NOTE_X_START) / 8)
)

// ── UI helpers ────────────────────────────────────────────────────────────
function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function ProgressBar({ done, total, color = ACCENT }: { done: number; total: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <div style={{ flex: 1, height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: color,
          borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', whiteSpace: 'nowrap' }}>
        {done + 1} / {total}
      </span>
    </div>
  )
}

// ── SVG primitives ─────────────────────────────────────────────────────────
function StaffLines() {
  return (
    <>
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
    </>
  )
}
function TrebleClef() {
  return (
    <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
      fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
  )
}
function BassClef() {
  return (
    <text x={sL + 2} y={tTop + 2 * step + 2} fontFamily="Bravura, serif" fontSize={66}
      fill={DARK} dominantBaseline="auto">{'\uD834\uDD22'}</text>
  )
}
function BravuraNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={60}
      fill={color} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
  )
}
function LedgerLine({ cx, cy, color = DARK, hw = 14 }: { cx: number; cy: number; color?: string; hw?: number }) {
  return <line x1={cx - hw} y1={cy} x2={cx + hw} y2={cy} stroke={color} strokeWidth={STROKE} />
}
function AccidentalGlyph({ cx, cy, acc, color = DARK }: { cx: number; cy: number; acc: AccType; color?: string }) {
  const glyph = acc === 'flat' ? '\uE260' : acc === 'sharp' ? '\uE262' : '\uE261'
  return (
    <text x={cx - 20} y={cy} fontFamily="Bravura, serif" fontSize={48}
      fill={color} textAnchor="middle" dominantBaseline="central">{glyph}</text>
  )
}

function needsLedger(clef: Clef, pos: number): boolean {
  if (clef === 'treble') return pos === 0 || pos === 12
  return pos === 0 || pos === 12
}

// ── Ex 1: Mark the whole and half steps ───────────────────────────────────
interface ScaleItem { key: KeyName; clef: Clef }

const EX1_POOL: ScaleItem[] = [
  { key: 'C', clef: 'treble' },
  { key: 'G', clef: 'treble' },
  { key: 'F', clef: 'bass' },
  { key: 'C', clef: 'bass' },
]

function MarkStepsEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(EX1_POOL), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [marks,    setMarks]    = useState<(null | 'W' | 'H')[]>(() => Array(7).fill(null))
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item  = items[idx]
  const notes = SCALES[item.key][item.clef]

  function toggleMark(i: number) {
    if (feedback !== null || lockedRef.current) return
    setMarks(prev => {
      const next = [...prev]
      next[i] = next[i] === null ? 'W' : next[i] === 'W' ? 'H' : null
      return next
    })
  }

  function onCheck() {
    if (feedback !== null || lockedRef.current) return
    if (marks.some(m => m === null)) return
    lockedRef.current = true
    const ok = marks.every((m, i) => m === SCALE_STEPS[i])
    if (ok) correctRef.current += 1
    setFeedback({ ok })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1)
        setMarks(Array(7).fill(null))
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1200 : 2400)
  }

  function onReset() {
    if (feedback !== null) return
    setMarks(Array(7).fill(null))
  }

  const allMarked = marks.every(m => m !== null)

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 1 · Mark the whole and half steps
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '4px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} · {item.key} major scale
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: '0 0 10px', lineHeight: 1.6 }}>
        Tap each circle to cycle between <strong style={{ color: MAJ_C }}>W</strong> and{' '}
        <strong style={{ color: HALF_C }}>H</strong>. Mark every gap between the eight notes.
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0 14px', marginBottom: 14, overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            userSelect: 'none', WebkitUserSelect: 'none' }}>
          <StaffLines />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR - 5} y1={tTop} x2={sR - 5} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={2.5} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}

          {notes.map((n, i) => {
            const cx = NOTE_XS[i]
            const cy = posToY(n.pos)
            return (
              <g key={i}>
                {needsLedger(item.clef, n.pos) && <LedgerLine cx={cx} cy={cy} />}
                {n.acc && <AccidentalGlyph cx={cx} cy={cy} acc={n.acc} />}
                <BravuraNote cx={cx} cy={cy} />
                <text x={cx} y={tTop - 18}
                  fontFamily={F} fontSize={14} fontWeight={700} fill={GREY}
                  textAnchor="middle">{n.letter + (n.acc === 'sharp' ? '♯' : n.acc === 'flat' ? '♭' : '')}</text>
              </g>
            )
          })}

          {/* W/H toggle badges between notes · placed below the staff with
              enough clearance that they never line up with a notehead */}
          {SCALE_STEPS.map((_, i) => {
            const midX = (NOTE_XS[i] + NOTE_XS[i + 1]) / 2
            const y = lineY(1) + 50
            const val = marks[i]
            const isCorrect = feedback?.ok ? true : feedback ? val === SCALE_STEPS[i] : null
            const showColor = val === null
              ? GREY
              : feedback !== null
                ? (isCorrect ? CORRECT : WRONG)
                : val === 'W' ? MAJ_C : HALF_C
            const bg = val === null
              ? 'white'
              : feedback !== null
                ? (isCorrect ? 'rgba(42,107,30,0.10)' : 'rgba(181,64,42,0.10)')
                : val === 'W' ? 'rgba(42,92,10,0.12)' : 'rgba(181,64,42,0.14)'
            return (
              <g key={'m' + i} onClick={() => toggleMark(i)}
                style={{ cursor: feedback !== null ? 'default' : 'pointer' }}>
                <circle cx={midX} cy={y} r={14}
                  fill={bg} stroke={showColor} strokeWidth={1.5} />
                <text x={midX} y={y}
                  fontFamily={F} fontSize={13} fontWeight={800} fill={showColor}
                  textAnchor="middle" dominantBaseline="central">
                  {val ?? '?'}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center',
        marginBottom: 12 }}>
        <button onClick={onReset}
          disabled={feedback !== null}
          style={{
            padding: '10px 16px', borderRadius: 10,
            border: '1.5px solid #D9CFAE', background: '#FDFBF5',
            color: GREY, fontFamily: F, fontSize: 14,
            cursor: feedback !== null ? 'default' : 'pointer',
          }}>Reset</button>
        <button onClick={onCheck}
          disabled={feedback !== null || !allMarked}
          style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 15, fontWeight: 600,
            background: feedback !== null || !allMarked ? '#EDE8DF' : DARK,
            color: feedback !== null || !allMarked ? '#B0ACA4' : 'white',
            cursor: feedback !== null || !allMarked ? 'default' : 'pointer',
          }}>
          Check ({marks.filter(m => m !== null).length}/7)
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct · W W H W W W H'}
        {feedback !== null && !feedback.ok && 'Not quite · every major scale follows W W H W W W H.'}
      </p>
    </div>
  )
}

// ── Ex 2: Write the major scale ────────────────────────────────────────────
const EX2_POOL: ScaleItem[] = [
  { key: 'C', clef: 'treble' },
  { key: 'F', clef: 'treble' },
  { key: 'G', clef: 'treble' },
  { key: 'C', clef: 'bass' },
  { key: 'F', clef: 'bass' },
  { key: 'G', clef: 'bass' },
]

function WriteScaleEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(EX2_POOL), [])
  const total = items.length

  const [idx,         setIdx]         = useState(0)
  const [stagedNotes, setStagedNotes] = useState<Array<{ pos: number; acc: AccType | null } | null>>(() => Array(8).fill(null))
  const [pickedAcc,   setPickedAcc]   = useState<AccType | null>(null)
  const [feedback,    setFeedback]    = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  const svgRef     = useRef<SVGSVGElement | null>(null)

  const item   = items[idx]
  const target = SCALES[item.key][item.clef]

  function clientToSlotAndPos(clientX: number, clientY: number): { slot: number; pos: number } | null {
    const svg = svgRef.current
    if (!svg) return null
    const r = svg.getBoundingClientRect()
    const sx = (clientX - r.left) / r.width * svgW
    const sy = (clientY - r.top) / r.height * svgH
    // Nearest slot by x
    let slot = 0, bestDist = Infinity
    for (let i = 0; i < NOTE_XS.length; i++) {
      const d = Math.abs(NOTE_XS[i] - sx)
      if (d < bestDist) { bestDist = d; slot = i }
    }
    let pos = Math.round(10 - (sy - tTop) / step)
    if (pos < 0) pos = 0
    if (pos > 13) pos = 13
    return { slot, pos }
  }

  function onStaffClick(e: React.MouseEvent<SVGSVGElement>) {
    if (feedback !== null || lockedRef.current) return
    if (!svgRef.current) svgRef.current = e.currentTarget
    const sp = clientToSlotAndPos(e.clientX, e.clientY)
    if (!sp) return
    setStagedNotes(prev => {
      const next = [...prev]
      const existing = next[sp.slot]
      if (!pickedAcc) {
        // Place or replace the note at this slot
        next[sp.slot] = { pos: sp.pos, acc: existing?.acc ?? null }
      } else {
        // Pick + tap on existing note → toggle accidental
        if (existing) {
          const nextAcc = existing.acc === pickedAcc ? null : pickedAcc
          next[sp.slot] = { pos: existing.pos, acc: nextAcc }
        } else {
          next[sp.slot] = { pos: sp.pos, acc: pickedAcc }
        }
      }
      return next
    })
  }

  function selectAcc(acc: AccType) {
    if (feedback !== null || lockedRef.current) return
    setPickedAcc(prev => prev === acc ? null : acc)
  }

  function onReset() {
    if (feedback !== null) return
    setStagedNotes(Array(8).fill(null))
    setPickedAcc(null)
  }

  function onCheck() {
    if (feedback !== null || lockedRef.current) return
    const placed = stagedNotes.filter(n => n !== null).length
    if (placed !== 8) return
    lockedRef.current = true
    const ok = stagedNotes.every((n, i) => {
      if (!n) return false
      const t = target[i]
      const studentAcc = n.acc ?? null
      const targetAcc  = t.acc ?? null
      return n.pos === t.pos && studentAcc === targetAcc
    })
    if (ok) correctRef.current += 1
    setFeedback({ ok })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1)
        setStagedNotes(Array(8).fill(null))
        setPickedAcc(null)
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1200 : 2400)
  }

  const renderNote = (slot: number, pos: number, acc: AccType | null, color: string, opacity = 1) => {
    const cx = NOTE_XS[slot]
    const cy = posToY(pos)
    return (
      <g key={slot} opacity={opacity}>
        {needsLedger(item.clef, pos) && <LedgerLine cx={cx} cy={cy} color={color} />}
        {acc && <AccidentalGlyph cx={cx} cy={cy} acc={acc} color={color} />}
        <BravuraNote cx={cx} cy={cy} color={color} />
      </g>
    )
  }

  const accBtn = (acc: AccType, glyph: string) => {
    const active = pickedAcc === acc
    return (
      <button key={acc} onClick={() => selectAcc(acc)}
        disabled={feedback !== null}
        aria-label={acc}
        style={{
          width: 48, height: 48, borderRadius: 10,
          border: `1.5px solid ${active ? DARK : '#D9CFAE'}`,
          background: active ? DARK : 'white',
          color: active ? 'white' : DARK,
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 28, lineHeight: 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
          cursor: feedback !== null ? 'default' : 'pointer',
        }}>
        {glyph}
      </button>
    )
  }

  const placedCount = stagedNotes.filter(n => n !== null).length

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 2 · Write the scale
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '10px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} · write the{' '}
        <strong style={{ color: ACCENT }}>{item.key} major scale</strong>
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 14, overflowX: 'auto' }}>
        <svg
          ref={r => { svgRef.current = r }}
          viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          onClick={onStaffClick}
          style={{
            maxWidth: svgW, display: 'block', margin: '0 auto',
            cursor: feedback !== null ? 'default' : 'crosshair',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
          }}>
          <StaffLines />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR - 5} y1={tTop} x2={sR - 5} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={2.5} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}

          {/* Subtle slot guides when no note is there (only while not submitted) */}
          {feedback === null && NOTE_XS.map((cx, i) => {
            if (stagedNotes[i]) return null
            return <circle key={'g' + i} cx={cx} cy={lineY(3)} r={3} fill="#EDE8DF" />
          })}

          {/* Staged notes (ghost while editing, colored after check) */}
          {stagedNotes.map((n, i) => {
            if (!n) return null
            if (feedback === null) return renderNote(i, n.pos, n.acc, ACCENT, 0.6)
            return renderNote(i, n.pos, n.acc, feedback.ok ? CORRECT : WRONG)
          })}

          {/* Correct-answer hint overlay when wrong */}
          {feedback && !feedback.ok && target.map((t, i) => (
            <g key={'hint' + i} opacity={0.45}>
              {renderNote(i, t.pos, t.acc ?? null, CORRECT, 1)}
            </g>
          ))}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center',
        marginBottom: 12, flexWrap: 'wrap' }}>
        {accBtn('flat', '\u266D')}
        {accBtn('natural', '\u266E')}
        {accBtn('sharp', '\u266F')}
        <div style={{ width: 1, height: 28, background: '#D9CFAE', margin: '0 4px' }} />
        <button onClick={onReset}
          disabled={feedback !== null}
          style={{
            padding: '10px 16px', borderRadius: 10,
            border: '1.5px solid #D9CFAE', background: '#FDFBF5',
            color: GREY, fontFamily: F, fontSize: 14,
            cursor: feedback !== null ? 'default' : 'pointer',
          }}>Reset</button>
        <button onClick={onCheck}
          disabled={feedback !== null || placedCount !== 8}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: feedback !== null || placedCount !== 8 ? '#EDE8DF' : DARK,
            color: feedback !== null || placedCount !== 8 ? '#B0ACA4' : 'white',
            fontFamily: F, fontSize: 15, fontWeight: 600,
            cursor: feedback !== null || placedCount !== 8 ? 'default' : 'pointer',
          }}>Check ({placedCount}/8)</button>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: '0 0 8px', lineHeight: 1.6 }}>
        Tap the staff to place a note in the nearest slot. Pick an accidental, then tap a note to apply it.
      </p>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct'}
        {feedback !== null && !feedback.ok && 'Not quite · the correct scale is shown in green.'}
      </p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2']

export default function MajorScalesLesson({
  previouslyCompleted = false,
  onComplete,
}: {
  passingScore: number
  previouslyCompleted?: boolean
  onComplete: (score: number, total: number) => void
}) {
  const [phase,       setPhase]       = useState<Phase>('ex1')
  const [keyN,        setKeyN]        = useState(0)
  const [furthestIdx, setFurthestIdx] = useState(
    previouslyCompleted ? Math.max(0, PHASE_ORDER.length - 1) : 0
  )
  const phaseScoresRef = useRef<Map<Phase, { correct: number; total: number }>>(new Map())

  function goToPhase(p: Phase) {
    setPhase(p)
    setKeyN(k => k + 1)
  }

  function next() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx + 1 >= PHASE_ORDER.length) {
      let correct = 0, total = 0
      for (const v of phaseScoresRef.current.values()) { correct += v.correct; total += v.total }
      onComplete(total > 0 ? correct / total : 1, total)
      return
    }
    const nextIdx = idx + 1
    setFurthestIdx(f => Math.max(f, nextIdx))
    goToPhase(PHASE_ORDER[nextIdx])
  }

  function back() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx > 0) goToPhase(PHASE_ORDER[idx - 1])
  }
  function forward() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx >= 0 && idx < furthestIdx && idx + 1 < PHASE_ORDER.length) {
      goToPhase(PHASE_ORDER[idx + 1])
    }
  }
  function scored(correct: number, total: number) {
    phaseScoresRef.current.set(phase, { correct, total })
    next()
  }

  const currentIdx   = PHASE_ORDER.indexOf(phase)
  const canGoBack    = currentIdx > 0
  const canGoForward = currentIdx >= 0 && currentIdx < furthestIdx

  return (
    <div>
      <ExerciseNavBar canBack={canGoBack} canForward={canGoForward}
        onBack={back} onForward={forward} />
      {phase === 'ex1' && <MarkStepsEx key={keyN} onDone={scored} />}
      {phase === 'ex2' && <WriteScaleEx key={keyN} onDone={scored} />}
    </div>
  )
}
