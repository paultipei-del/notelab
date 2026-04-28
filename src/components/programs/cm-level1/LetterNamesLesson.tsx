'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { ExerciseNavBar } from '@/components/programs/cm-prep/nav/ExerciseNavBar'
import { shuffle, type StaffNoteItem, MIXED_NOTE_POOL } from '@/lib/programs/cm-prep/questions'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#7A7060'
const ACCENT = '#BA7517'

// Aligned with the cm-prep lesson canon (TrebleClefLesson, BassClefLesson,
// LineSpaceLesson all use #2A6B1E for the CORRECT feedback color).
const CORRECT_C = '#2A6B1E'
const WRONG_C = '#B5402A'

const NOTE_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

// ── Shared bits ────────────────────────────────────────────────────────────────
function ProgressBar({ done, total, color = ACCENT }: { done: number; total: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <div style={{ flex: 1, height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', whiteSpace: 'nowrap' }}>
        {done + 1} / {total}
      </span>
    </div>
  )
}

function NameButtons({
  feedback,
  answer,
  onPick,
}: {
  feedback: { chosen: string; ok: boolean } | null
  answer: string
  onPick: (name: string) => void
}) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {NOTE_NAMES.map(name => {
          const isChosen = feedback?.chosen === name
          const isAnswer = name === answer
          let bg = 'white',
            border = '#DDD8CA',
            color = '#2A2318'
          if (feedback) {
            if (isAnswer) {
              bg = '#EAF3DE'
              border = '#C0DD97'
              color = CORRECT_C
            } else if (isChosen) {
              bg = '#FDF3ED'
              border = '#F0C4A8'
              color = WRONG_C
            }
          }
          return (
            <button
              key={name}
              onClick={() => onPick(name)}
              style={{
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: '10px',
                padding: '14px 4px',
                fontFamily: SERIF,
                fontSize: '20px',
                fontWeight: 400,
                color,
                cursor: feedback ? 'default' : 'pointer',
                transition: 'border-color 0.12s, background 0.12s',
              }}
            >
              {name}
            </button>
          )
        })}
      </div>
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: GREY, margin: 0, minHeight: '1.5em' }}>
        {feedback && !feedback.ok && (
          <>
            Correct answer: <strong style={{ color: CORRECT_C }}>{answer}</strong>
          </>
        )}
      </p>
    </>
  )
}

// ── Exercise 1: Name the note (multi-round) ────────────────────────────────────
function NameNoteExercise({
  pool,
  sessionLength,
  label,
  onDone,
}: {
  pool: StaffNoteItem[]
  sessionLength: number
  label: string
  onDone: (correct: number, total: number) => void
}) {
  const [items] = useState<StaffNoteItem[]>(() => {
    const exp: StaffNoteItem[] = []
    const reps = Math.ceil(sessionLength / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffle(exp).slice(0, sessionLength)
  })
  const [idx, setIdx] = useState(0)
  const [feedback, setFeedback] = useState<{ chosen: string; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef = useRef(false)
  const item = items[idx]
  const total = items.length

  function handlePick(name: string) {
    if (lockedRef.current) return
    lockedRef.current = true
    const ok = name === item.answer
    if (ok) correctRef.current += 1
    setFeedback({ chosen: name, ok })
    setTimeout(() => {
      const next = idx + 1
      if (next >= total) {
        onDone(correctRef.current, total)
        return
      }
      setIdx(next)
      setFeedback(null)
      lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (feedback) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toUpperCase()
      if (k.length === 1 && k >= 'A' && k <= 'G') handlePick(k)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [idx, feedback])

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        {label}
      </p>
      <ProgressBar done={idx} total={total} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — identify this note
      </p>
      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '8px 0', marginBottom: 24 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {/* Ledger glyphs match the cases that appear in MIXED_NOTE_POOL:
              treble C4 (pos 0), bass E2 (pos 0), bass C4 (pos 12). */}
          {((item.clef === 'treble' && item.pos === 0) ||
            (item.clef === 'bass' && (item.pos === 0 || item.pos === 12))) && (
            <LedgerLine cx={svgW / 2} cy={posToY(item.pos)} />
          )}
          <BravuraNote cx={svgW / 2} cy={posToY(item.pos)} />
        </svg>
      </div>
      <NameButtons feedback={feedback} answer={item.answer} onPick={handlePick} />
    </div>
  )
}

// ── Exercise 2: Place the note (multi-round) ───────────────────────────────────
// This is adapted from the Prep "Place the note" interaction so the flow stays
// consistent across levels.
const step = 8
const sL = 32
const sR = 360
const tTop = 54
const svgW = sR + 16 // 376
const svgH = tTop + 8 * step + 54
const STROKE = 1.3

function posToY(pos: number) {
  return tTop + (10 - pos) * step
}
function lineY(n: number) {
  return tTop + (5 - n) * 2 * step
}

function BravuraNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={60} fill={color} textAnchor="middle" dominantBaseline="central">
      {'\uE0A2'}
    </text>
  )
}

function LedgerLine({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return <line x1={cx - 16} y1={cy} x2={cx + 16} y2={cy} stroke={color} strokeWidth={2.5} />
}

function StaffBase() {
  return (
    <>
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)} stroke={DARK} strokeWidth={STROKE} />
      ))}
    </>
  )
}

function TrebleClef() {
  return (
    <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62} fill={DARK} dominantBaseline="auto">
      {'\uD834\uDD1E'}
    </text>
  )
}

function BassClef() {
  return (
    <text x={sL + 4} y={tTop + 2 * step + 2} fontFamily="Bravura, serif" fontSize={66} fill={DARK} dominantBaseline="auto">
      {'\uD834\uDD22'}
    </text>
  )
}

function octaveLabel(item: StaffNoteItem): string {
  const isMiddleC = (item.clef === 'treble' && item.pos === 0) || (item.clef === 'bass' && item.pos === 12)
  if (isMiddleC) return 'Middle C'
  if (item.clef === 'treble') return item.pos >= 8 ? 'High' : 'Treble'
  return item.pos <= 4 ? 'Low' : 'Bass'
}

function PlaceNoteExercise({
  pool,
  sessionLength,
  label,
  onDone,
}: {
  pool: StaffNoteItem[]
  sessionLength: number
  label: string
  onDone: (correct: number, total: number) => void
}) {
  const [items] = useState<StaffNoteItem[]>(() => {
    const exp: StaffNoteItem[] = []
    const reps = Math.ceil(sessionLength / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffle(exp).slice(0, sessionLength)
  })
  const [idx, setIdx] = useState(0)
  const [stagedPos, setStagedPos] = useState<number | null>(null)
  const [placedPos, setPlacedPos] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const correctRef = useRef(0)
  const lockedRef = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const item = items[idx]
  const total = items.length
  const cx = svgW / 2
  const maxPos = item.clef === 'treble' ? 11 : 12

  function clientToPos(clientY: number): number {
    const svg = svgRef.current
    if (!svg) return 0
    const r = svg.getBoundingClientRect()
    const sy = ((clientY - r.top) / r.height) * svgH
    let pos = Math.round(10 - (sy - tTop) / step)
    if (pos < 0) pos = 0
    if (pos > maxPos) pos = maxPos
    return pos
  }

  function onStaffClick(e: React.MouseEvent<SVGSVGElement>) {
    if (submitted || lockedRef.current) return
    setStagedPos(clientToPos(e.clientY))
  }

  function onConfirm() {
    if (submitted || lockedRef.current || stagedPos === null) return
    lockedRef.current = true
    const ok = stagedPos === item.pos
    if (ok) correctRef.current += 1
    setPlacedPos(stagedPos)
    setSubmitted(true)
    setTimeout(() => {
      const next = idx + 1
      if (next >= total) {
        onDone(correctRef.current, total)
        return
      }
      setIdx(next)
      setStagedPos(null)
      setPlacedPos(null)
      setSubmitted(false)
      lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  const isCorrect = submitted && placedPos === item.pos

  const renderNote = (pos: number, color: string) => {
    const cy = posToY(pos)
    return (
      <g>
        {item.clef === 'treble' && pos === 0 && <LedgerLine cx={cx} cy={cy} color={color} />}
        {item.clef === 'bass' && pos === 0 && <LedgerLine cx={cx} cy={cy} color={color} />}
        {item.clef === 'bass' && pos === 12 && <LedgerLine cx={cx} cy={cy} color={color} />}
        <BravuraNote cx={cx} cy={cy} color={color} />
      </g>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        {label}
      </p>
      <ProgressBar done={idx} total={total} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — place this letter
      </p>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 300, color: DARK, lineHeight: 1 }}>{item.answer}</span>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: '4px 0 0' }}>
          <strong>{octaveLabel(item)}</strong> — click the staff, then press Place
        </p>
      </div>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '8px 0', marginBottom: 12 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          style={{
            maxWidth: svgW,
            display: 'block',
            margin: '0 auto',
            cursor: submitted ? 'default' : 'crosshair',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
          onClick={onStaffClick}
        >
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {!submitted && stagedPos !== null && <g opacity={0.55}>{renderNote(stagedPos, ACCENT)}</g>}
          {submitted && placedPos !== null && renderNote(placedPos, isCorrect ? CORRECT_C : WRONG_C)}
          {submitted && !isCorrect && <g opacity={0.55}>{renderNote(item.pos, CORRECT_C)}</g>}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <button
          onClick={onConfirm}
          disabled={submitted || stagedPos === null}
          style={{
            padding: '10px 28px',
            borderRadius: 10,
            border: 'none',
            fontFamily: F,
            fontSize: 15,
            fontWeight: 600,
            cursor: submitted || stagedPos === null ? 'default' : 'pointer',
            background: submitted || stagedPos === null ? '#EDE8DF' : DARK,
            color: submitted || stagedPos === null ? '#B0ACA4' : 'white',
          }}
        >
          Place
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em', color: submitted ? (isCorrect ? CORRECT_C : WRONG_C) : '#B0ACA4' }}>
        {!submitted ? 'Click to stage a note position' : isCorrect ? '✓ Correct' : `✗ ${item.note} is ${item.pos % 2 === 0 ? 'on a line' : 'in a space'}`}
      </p>
    </div>
  )
}

// ── Exercise 3: Ledger line notes (grand staff, name-only) ─────────────────────
type LedgerItem = {
  note: string
  answer: string
  clef: 'treble' | 'bass'
  pos: number // diatonic step where C4 (treble) is 0; supports negative/above-range
}

const LEDGER_POOL: LedgerItem[] = [
  // Below treble staff (ledger notes)
  { note: 'A3', answer: 'A', clef: 'treble', pos: -2 },
  { note: 'B3', answer: 'B', clef: 'treble', pos: -1 },
  { note: 'C4', answer: 'C', clef: 'treble', pos: 0 },
  // Above bass staff (ledger notes)
  { note: 'C4', answer: 'C', clef: 'bass', pos: 12 },
  { note: 'D4', answer: 'D', clef: 'bass', pos: 13 },
  { note: 'E4', answer: 'E', clef: 'bass', pos: 14 },
  // Above treble staff (ledger notes)
  { note: 'A5', answer: 'A', clef: 'treble', pos: 12 },
  { note: 'B5', answer: 'B', clef: 'treble', pos: 13 },
  { note: 'C6', answer: 'C', clef: 'treble', pos: 14 },
  // Below bass staff (ledger notes)
  { note: 'E2', answer: 'E', clef: 'bass', pos: 0 },
  { note: 'D2', answer: 'D', clef: 'bass', pos: -1 },
  { note: 'C2', answer: 'C', clef: 'bass', pos: -2 },
]

// Ex 3 renders on a grand staff (two staves + gap), so even at the same
// `step` as the single-staff visuals it ends up roughly 2× as tall on
// screen. Pulled down to step_G=6 (sw=12) so the whole card sits at a
// comfortable size; clef/notehead/ledger sizes follow that ratio.
const step_G = 6
const tTop_G = 30
const GS_GAP = 4 * step_G
const bTop_G = tTop_G + 12 * step_G + GS_GAP
const sL_G = 32
const sR_G = 360
const gsW = sR_G + 16

function gsPosToY_T(pos: number) {
  return tTop_G + (10 - pos) * step_G
}
function gsPosToY_B(pos: number) {
  return bTop_G + (10 - pos) * step_G
}
function gsLineY_T(n: number) {
  return tTop_G + (5 - n) * 2 * step_G
}
function gsLineY_B(n: number) {
  return bTop_G + (5 - n) * 2 * step_G
}

function GrandStaffBase() {
  const braceH = gsLineY_B(1) - tTop_G
  const barBot = gsLineY_B(1)
  return (
    <>
      {[1, 2, 3, 4, 5].map(n => (
        <line key={`t${n}`} x1={sL_G} y1={gsLineY_T(n)} x2={sR_G} y2={gsLineY_T(n)} stroke={DARK} strokeWidth={1.3} />
      ))}
      {[1, 2, 3, 4, 5].map(n => (
        <line key={`b${n}`} x1={sL_G} y1={gsLineY_B(n)} x2={sR_G} y2={gsLineY_B(n)} stroke={DARK} strokeWidth={1.3} />
      ))}
      <line x1={sL_G} y1={tTop_G} x2={sL_G} y2={barBot} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR_G} y1={tTop_G} x2={sR_G} y2={barBot} stroke={DARK} strokeWidth={1.3} />
      <text x={sL_G - 8} y={tTop_G + braceH} fontFamily="Bravura, serif" fontSize={braceH} fill={DARK} textAnchor="middle" dominantBaseline="auto">
        {'\uE000'}
      </text>
      <text x={sL_G + 4} y={tTop_G + 6 * step_G} fontFamily="Bravura, serif" fontSize={44} fill={DARK} dominantBaseline="auto">
        {'\uD834\uDD1E'}
      </text>
      <text x={sL_G + 4} y={bTop_G + 2 * step_G + 2} fontFamily="Bravura, serif" fontSize={48} fill={DARK} dominantBaseline="auto">
        {'\uD834\uDD22'}
      </text>
    </>
  )
}

function GsBravuraNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={44} fill={color} textAnchor="middle" dominantBaseline="central">
      {'\uE0A2'}
    </text>
  )
}

function GsLedgerLine({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return <line x1={cx - 12} y1={cy} x2={cx + 12} y2={cy} stroke={color} strokeWidth={1.5} />
}

function renderLedgerLinesFor({
  clef,
  pos,
  cx,
  color = DARK,
}: {
  clef: 'treble' | 'bass'
  pos: number
  cx: number
  color?: string
}) {
  const staffLowLine = 2
  const staffHighLine = 10
  if (pos >= staffLowLine && pos <= staffHighLine) return null

  const lines: number[] = []
  if (pos < staffLowLine) {
    for (let p = staffLowLine - 2; p >= pos; p -= 2) lines.push(p)
  } else {
    for (let p = staffHighLine + 2; p <= pos; p += 2) lines.push(p)
  }

  const toY = clef === 'treble' ? gsPosToY_T : gsPosToY_B
  return (
    <>
      {lines.map(p => (
        <GsLedgerLine key={`${clef}-${p}`} cx={cx} cy={toY(p)} color={color} />
      ))}
    </>
  )
}

function LedgerNameExercise({
  pool,
  sessionLength,
  label,
  onDone,
}: {
  pool: LedgerItem[]
  sessionLength: number
  label: string
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo(() => {
    const expanded: LedgerItem[] = []
    const reps = Math.ceil(sessionLength / pool.length) + 1
    for (let i = 0; i < reps; i++) expanded.push(...pool)
    return shuffle(expanded).slice(0, sessionLength)
  }, [pool, sessionLength])

  const [idx, setIdx] = useState(0)
  const [feedback, setFeedback] = useState<{ chosen: string; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef = useRef(false)
  const item = items[idx]
  const total = items.length

  const cx = gsW / 2
  const cy = item.clef === 'treble' ? gsPosToY_T(item.pos) : gsPosToY_B(item.pos)

  // Stable viewBox so the frame doesn't shift per note. The bounds extend
  // past the highest-pitch (C6, treble pos 14) and lowest-pitch (C2, bass
  // pos -2) positions plus enough padding to fit the notehead and any
  // ledger lines without clipping. PAD reduced from 70 to 28 — at sw=12,
  // the notehead is ~13 units tall, so 28 leaves clear breathing room
  // above C6 / below C2 while keeping the card height in check.
  const VIEW_PAD = 28
  const viewMinY = Math.min(gsPosToY_T(14), gsPosToY_B(14)) - VIEW_PAD
  const viewMaxY = Math.max(gsPosToY_T(-2), gsPosToY_B(-2)) + VIEW_PAD
  const viewH = viewMaxY - viewMinY

  function handlePick(name: string) {
    if (lockedRef.current) return
    lockedRef.current = true
    const ok = name === item.answer
    if (ok) correctRef.current += 1
    setFeedback({ chosen: name, ok })
    setTimeout(() => {
      const next = idx + 1
      if (next >= total) {
        onDone(correctRef.current, total)
        return
      }
      setIdx(next)
      setFeedback(null)
      lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (feedback) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toUpperCase()
      if (k.length === 1 && k >= 'A' && k <= 'G') handlePick(k)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [idx, feedback])

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        {label}
      </p>
      <ProgressBar done={idx} total={total} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        Grand staff — ledger notes
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '8px 0', marginBottom: 20 }}>
        <svg viewBox={`0 ${viewMinY} ${gsW} ${viewH}`} width="100%" style={{ maxWidth: gsW, display: 'block', margin: '0 auto' }}>
          <GrandStaffBase />
          {renderLedgerLinesFor({ clef: item.clef, pos: item.pos, cx, color: DARK })}
          <GsBravuraNote cx={cx} cy={cy} color={DARK} />
        </svg>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12 }}>What letter name is this note?</p>
      <NameButtons feedback={feedback} answer={item.answer} onPick={handlePick} />
    </div>
  )
}

// ── Exercise 4: Word spelling (mixed clefs) ────────────────────────────────────
// Mirrors the cm-prep Treble lesson's word-spelling round, but the pool is
// half treble / half bass — fitting Level 1's "you should be fluent in both
// clefs" framing. Notes are addressed with the same `pos` system as the
// other exercises in this file (`posToY` / `lineY`).

interface WordItem {
  word: string
  clef: 'treble' | 'bass'
  notes: number[]
}

const WORDS: WordItem[] = [
  // 3-letter — one of each clef
  { word: 'BAG',  clef: 'treble', notes: [6, 5, 4]      },  // B4 A4 G4
  { word: 'ACE',  clef: 'treble', notes: [5, 7, 9]      },  // A4 C5 E5
  { word: 'EGG',  clef: 'bass',   notes: [7, 9, 9]      },  // E3 G3 G3
  { word: 'FED',  clef: 'bass',   notes: [8, 7, 6]      },  // F3 E3 D3
  // 4-letter — one of each clef
  { word: 'FACE', clef: 'treble', notes: [3, 5, 7, 9]   },  // F4 A4 C5 E5
  { word: 'CAGE', clef: 'treble', notes: [7, 5, 4, 2]   },  // C5 A4 G4 E4
  { word: 'BEAD', clef: 'bass',   notes: [4, 7, 3, 6]   },  // B2 E3 A2 D3
  { word: 'CAFE', clef: 'bass',   notes: [5, 3, 8, 7]   },  // C3 A2 F3 E3
]

function WordStaff({ clef, notes }: { clef: 'treble' | 'bass'; notes: number[] }) {
  const n = notes.length
  // Extra inset for shorter words so heads don't crowd the clef or barlines.
  const innerPad = n <= 3 ? 28 : n === 4 ? 14 : 0
  const startX = sL + 70 + innerPad
  const endX = sR - 16 - innerPad
  const gap = n > 1 ? (endX - startX) / (n - 1) : 0
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
      <StaffBase />
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      {clef === 'treble' ? <TrebleClef /> : <BassClef />}
      {notes.map((pos, i) => {
        const cx = n === 1 ? svgW / 2 : startX + i * gap
        const cy = posToY(pos)
        const needsLedger =
          (clef === 'treble' && pos === 0) ||
          (clef === 'bass' && (pos === 0 || pos === 12))
        return (
          <g key={i}>
            {needsLedger && <LedgerLine cx={cx} cy={cy} />}
            <BravuraNote cx={cx} cy={cy} />
          </g>
        )
      })}
    </svg>
  )
}

function WordSpellExercise({
  pool,
  label,
  onDone,
}: {
  pool: WordItem[]
  label: string
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo(() => shuffle([...pool]), [pool])
  const [idx, setIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [submitted, setSubmitted] = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef = useRef(false)

  const item = items[idx]
  const total = items.length

  function submit() {
    if (submitted !== null || lockedRef.current) return
    const guess = typed.trim().toUpperCase()
    if (guess === '') return
    lockedRef.current = true
    const ok = guess === item.word
    if (ok) correctRef.current += 1
    setSubmitted({ ok })
    setTimeout(() => {
      const next = idx + 1
      if (next >= total) {
        onDone(correctRef.current, total)
        return
      }
      setIdx(next)
      setTyped('')
      setSubmitted(null)
      lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  // Hardware keyboard: type letters A–G, Enter to submit, Backspace to delete.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (submitted !== null || lockedRef.current) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') {
        e.preventDefault()
        submit()
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        setTyped(t => t.slice(0, -1))
        return
      }
      const up = e.key.toUpperCase()
      if (up.length === 1 && up >= 'A' && up <= 'G') {
        setTyped(t => (t.length >= item.word.length ? t : t + up))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [idx, submitted, typed, item.word.length])

  const isCorrect = submitted?.ok ?? null
  const borderColor = submitted === null ? '#DDD8CA' : isCorrect ? '#C0DD97' : '#F0C4A8'
  const inputColor = submitted === null ? DARK : isCorrect ? CORRECT_C : WRONG_C

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        {label}
      </p>
      <ProgressBar done={idx} total={total} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — what word do these notes spell?
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '8px 0', marginBottom: 16 }}>
        <WordStaff clef={item.clef} notes={item.notes} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <input
          value={typed}
          readOnly
          placeholder="Type or tap letters"
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            border: `1.5px solid ${borderColor}`,
            background: 'white',
            fontFamily: SERIF,
            fontSize: 22,
            fontWeight: 400,
            color: inputColor,
            minWidth: 140,
            textAlign: 'center',
            letterSpacing: '0.15em',
            outline: 'none',
          }}
        />
        <button
          onClick={submit}
          disabled={submitted !== null || typed.trim() === ''}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: submitted !== null || typed.trim() === '' ? '#EDE8DF' : DARK,
            color: submitted !== null || typed.trim() === '' ? '#B0ACA4' : 'white',
            fontFamily: F,
            fontSize: 15,
            fontWeight: 600,
            cursor: submitted !== null || typed.trim() === '' ? 'default' : 'pointer',
          }}
        >
          Submit
        </button>
      </div>

      {/* Letter pad — A–G plus backspace, for tap-only sessions on mobile. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, maxWidth: 440, margin: '0 auto 12px' }}>
        {NOTE_NAMES.map(letter => {
          const padDisabled = submitted !== null || typed.length >= item.word.length
          return (
            <button
              key={letter}
              onClick={() => {
                if (padDisabled) return
                setTyped(t => t + letter)
              }}
              disabled={padDisabled}
              style={{
                padding: '10px 0',
                borderRadius: 8,
                border: '1.5px solid #DDD8CA',
                background: 'white',
                fontFamily: SERIF,
                fontSize: 18,
                fontWeight: 400,
                color: padDisabled ? '#B0ACA4' : DARK,
                cursor: padDisabled ? 'default' : 'pointer',
              }}
            >
              {letter}
            </button>
          )
        })}
        <button
          onClick={() => {
            if (submitted === null) setTyped(t => t.slice(0, -1))
          }}
          disabled={submitted !== null || typed.length === 0}
          aria-label="Backspace"
          style={{
            padding: '10px 0',
            borderRadius: 8,
            border: '1.5px solid #DDD8CA',
            background: 'white',
            fontFamily: F,
            fontSize: 15,
            color: submitted !== null || typed.length === 0 ? '#B0ACA4' : DARK,
            cursor: submitted !== null || typed.length === 0 ? 'default' : 'pointer',
          }}
        >
          ⌫
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em', color: submitted !== null ? (isCorrect ? CORRECT_C : WRONG_C) : '#B0ACA4' }}>
        {submitted !== null
          ? isCorrect ? '✓ Correct!' : `✗ The word is ${item.word}`
          : 'Type or tap the letters, then Submit'}
      </p>
    </div>
  )
}

// ── Phase controller ───────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4']

interface Props {
  passingScore: number
  previouslyCompleted?: boolean
  onComplete: (score: number, total: number) => void
}

export default function LetterNamesLesson({ passingScore, previouslyCompleted = false, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('ex1')
  const [key, setKey] = useState(0)
  const [furthestIdx, setFurthestIdx] = useState(previouslyCompleted ? Math.max(0, PHASE_ORDER.length - 1) : 0)
  const phaseScoresRef = useRef<Map<Phase, { correct: number; total: number }>>(new Map())

  // The lesson page loads progress from localStorage in a useEffect, so the
  // first render passes previouslyCompleted=false, then re-renders with it
  // true once the store hydrates. The useState initializer above only runs
  // on the first mount, so without this effect the Forward nav stays
  // disabled even though the lesson is already completed. Bumping
  // furthestIdx when the prop becomes true unlocks the Forward button on
  // re-entry.
  useEffect(() => {
    if (previouslyCompleted) {
      setFurthestIdx(idx => Math.max(idx, PHASE_ORDER.length - 1))
    }
  }, [previouslyCompleted])

  const currentIdx = PHASE_ORDER.indexOf(phase)
  const canGoBack = currentIdx > 0
  const canGoForward = currentIdx >= 0 && currentIdx < furthestIdx

  function goTo(p: Phase) {
    setPhase(p)
    setKey(k => k + 1)
  }

  function next() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx + 1 >= PHASE_ORDER.length) {
      let correct = 0,
        total = 0
      for (const v of phaseScoresRef.current.values()) {
        correct += v.correct
        total += v.total
      }
      onComplete(total > 0 ? correct / total : 1, total)
      return
    }
    const nextIdx = idx + 1
    setFurthestIdx(f => Math.max(f, nextIdx))
    goTo(PHASE_ORDER[nextIdx])
  }

  function back() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx > 0) goTo(PHASE_ORDER[idx - 1])
  }

  function forward() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx >= 0 && idx < furthestIdx && idx + 1 < PHASE_ORDER.length) goTo(PHASE_ORDER[idx + 1])
  }

  function scored(correct: number, total: number) {
    phaseScoresRef.current.set(phase, { correct, total })
    next()
  }

  // Exercise pools:
  // Use the same note set as the Prep "Review: Letter Names" interaction, but
  // increase session length so the student gets more exposure.
  const namePool = MIXED_NOTE_POOL
  const placePool = MIXED_NOTE_POOL

  return (
    <div>
      <ExerciseNavBar canBack={canGoBack} canForward={canGoForward} onBack={back} onForward={forward} />

      {phase === 'ex1' && (
        <NameNoteExercise
          key={key}
          pool={namePool}
          sessionLength={32}
          label="Exercise 1 — Name the note (mixed clefs)"
          onDone={scored}
        />
      )}

      {phase === 'ex2' && (
        <PlaceNoteExercise
          key={key}
          pool={placePool}
          sessionLength={24}
          label="Exercise 2 — Place the note (mixed clefs)"
          onDone={scored}
        />
      )}

      {phase === 'ex3' && (
        <LedgerNameExercise
          key={key}
          pool={LEDGER_POOL}
          sessionLength={18}
          label="Exercise 3 — Ledger line notes"
          onDone={scored}
        />
      )}

      {phase === 'ex4' && (
        <WordSpellExercise
          key={key}
          pool={WORDS}
          label="Exercise 4 — Spell the word (mixed clefs)"
          onDone={scored}
        />
      )}
    </div>
  )
}

