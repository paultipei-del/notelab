'use client'

import { useState, useRef, useEffect } from 'react'
import StaffCard from '@/components/cards/StaffCard'
import type { StaffNoteItem } from '@/lib/programs/cm-prep/questions'
import { shuffle } from '@/lib/programs/cm-prep/questions'

const F     = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK  = '#1A1A18'
const GREY  = '#7A7060'
const STROKE = 1.3

const CORRECT_C = '#2d5a3e'
const WRONG_C   = '#a0381c'
const ACCENT_C  = '#BA7517'

// ── Single-staff geometry (Parts 1 & 2) ───────────────────────────────────────
const step  = 8
const sL    = 32
const sR    = 360
const tTop  = 54
const svgW  = sR + 16   // 376
const svgH  = tTop + 8 * step + 54

function posToY(pos: number)  { return tTop + (10 - pos) * step }
function lineY(n: number)     { return tTop + (5 - n) * 2 * step }

// ── Grand-staff geometry (Parts 3 & 4) ────────────────────────────────────────
// Extra gap between staves so treble Middle C ledger and bass Middle C ledger
// are visually distinct (each sits one step from its own staff, not overlapping).
//   Treble Middle C: y = tTop_G + 10*step_G
//   Bass   Middle C: y = bTop_G - 2*step_G
//   Gap between them = bTop_G - tTop_G - 12*step_G = 4*step_G = 40px
const step_G  = 10
const tTop_G  = 30
const GS_GAP  = 4 * step_G                       // 40px between the two Middle C ledgers
const bTop_G  = tTop_G + 12 * step_G + GS_GAP    // = 30 + 120 + 40 = 190
const gsW     = svgW
const gsH     = bTop_G + 10 * step_G + 32        // = 322 (room for E2 ledger + padding)
// Click boundary: midpoint between the two Middle C y positions
const GS_MID  = tTop_G + 10 * step_G + GS_GAP / 2  // = 30+100+20 = 150

function gsPosToY_T(pos: number) { return tTop_G + (10 - pos) * step_G }
function gsPosToY_B(pos: number) { return bTop_G + (10 - pos) * step_G }
function gsLineY_T(n: number)    { return tTop_G + (5 - n) * 2 * step_G }
function gsLineY_B(n: number)    { return bTop_G + (5 - n) * 2 * step_G }

// ── Octave label (kid-friendly, replaces note names like "B3") ────────────────
// Treble: pos=0=C4 (Middle C), pos=1–7=treble (D4–C5), pos=8–11=high (D5–A5)
// Bass:   pos=0–4=low (E2–B2), pos=5–11=bass (C3–B3), pos=12=C4 (Middle C)
function octaveLabel(item: StaffNoteItem): string {
  const isMiddleC = (item.clef === 'treble' && item.pos === 0) ||
                    (item.clef === 'bass'   && item.pos === 12)
  if (isMiddleC) return 'Middle C'
  if (item.clef === 'treble') return item.pos >= 8 ? 'High' : 'Treble'
  return item.pos <= 4 ? 'Low' : 'Bass'
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function BravuraNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={60}
      fill={color} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
  )
}

function LedgerLine({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return <line x1={cx - 16} y1={cy} x2={cx + 16} y2={cy} stroke={color} strokeWidth={2.5} />
}

// ── Single-staff components ───────────────────────────────────────────────────
function StaffBase() {
  return (
    <>
      {[1,2,3,4,5].map(n => (
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
    <text x={sL + 4} y={tTop + 2 * step + 2} fontFamily="Bravura, serif" fontSize={66}
      fill={DARK} dominantBaseline="auto">{'\uD834\uDD22'}</text>
  )
}

// Grand-staff note (slightly larger to match step_G=10)
function GsBravuraNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={72}
      fill={color} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
  )
}

function GsLedgerLine({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return <line x1={cx - 20} y1={cy} x2={cx + 20} y2={cy} stroke={color} strokeWidth={2.5} />
}

// ── Grand-staff SVG shell ─────────────────────────────────────────────────────
function GrandStaffBase() {
  const braceH = gsLineY_B(1) - tTop_G
  const barBot = gsLineY_B(1)

  return (
    <>
      {[1,2,3,4,5].map(n => (
        <line key={`t${n}`} x1={sL} y1={gsLineY_T(n)} x2={sR} y2={gsLineY_T(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
      {[1,2,3,4,5].map(n => (
        <line key={`b${n}`} x1={sL} y1={gsLineY_B(n)} x2={sR} y2={gsLineY_B(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
      <line x1={sL} y1={tTop_G} x2={sL} y2={barBot} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop_G} x2={sR} y2={barBot} stroke={DARK} strokeWidth={STROKE} />
      <text x={sL - 8} y={tTop_G + braceH} fontFamily="Bravura, serif" fontSize={braceH}
        fill={DARK} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
      {/* Treble clef · anchor at G line = tTop_G + 6*step_G */}
      <text x={sL + 4} y={tTop_G + 6 * step_G} fontFamily="Bravura, serif" fontSize={72}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
      {/* Bass clef · anchor at F line = bTop_G + 2*step_G */}
      <text x={sL + 4} y={bTop_G + 2 * step_G + 2} fontFamily="Bravura, serif" fontSize={78}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD22'}</text>
    </>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
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

const NOTE_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// ── Phase config ──────────────────────────────────────────────────────────────
type ExType = 'name' | 'place'
interface PhaseConfig { type: ExType; label: string; grand: boolean }

const PHASES: PhaseConfig[] = [
  { type: 'name',  label: 'Part 1 · Name the note',  grand: false },
  { type: 'place', label: 'Part 2 · Place the note',  grand: false },
  { type: 'name',  label: 'Part 3 · Name the note',  grand: true  },
  { type: 'place', label: 'Part 4 · Place the note',  grand: true  },
]

// ── Name exercise (single staff) ──────────────────────────────────────────────
function NameExercise({
  pool, sessionLength, accentColor, label, onDone,
}: {
  pool: StaffNoteItem[]; sessionLength: number; accentColor: string
  label: string; onDone: (correct: number, total: number) => void
}) {
  const [items] = useState<StaffNoteItem[]>(() => {
    const exp: StaffNoteItem[] = []
    const reps = Math.ceil(sessionLength / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffle(exp).slice(0, sessionLength)
  })
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ chosen: string; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  const item  = items[idx]
  const total = items.length

  function handlePick(name: string) {
    if (lockedRef.current) return
    lockedRef.current = true
    const ok = name === item.answer
    if (ok) correctRef.current += 1
    setFeedback({ chosen: name, ok })
    setTimeout(() => {
      const next = idx + 1
      if (next >= total) { onDone(correctRef.current, total); return }
      setIdx(next); setFeedback(null); lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  // Keyboard shortcut — type A–G to answer
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
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{label}</p>
      <ProgressBar done={idx} total={total} color={accentColor} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} · name this note
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <StaffCard note={item.note} clef={item.clef} />
      </div>
      <NameButtons feedback={feedback} answer={item.answer} onPick={handlePick} />
    </div>
  )
}

// ── Name exercise (grand staff) ───────────────────────────────────────────────
function NameExerciseGrand({
  pool, sessionLength, accentColor, label, onDone,
}: {
  pool: StaffNoteItem[]; sessionLength: number; accentColor: string
  label: string; onDone: (correct: number, total: number) => void
}) {
  const [items] = useState<StaffNoteItem[]>(() => {
    const exp: StaffNoteItem[] = []
    const reps = Math.ceil(sessionLength / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffle(exp).slice(0, sessionLength)
  })
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ chosen: string; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  const item  = items[idx]
  const total = items.length

  const cx   = gsW / 2
  const isTreble = item.clef === 'treble'
  const cy   = isTreble ? gsPosToY_T(item.pos) : gsPosToY_B(item.pos)
  // Middle C: treble pos=0 or bass pos=12 — both share a single ledger between staves
  const isMiddleC = (isTreble && item.pos === 0) || (!isTreble && item.pos === 12)
  const isBassE2  = !isTreble && item.pos === 0

  function handlePick(name: string) {
    if (lockedRef.current) return
    lockedRef.current = true
    const ok = name === item.answer
    if (ok) correctRef.current += 1
    setFeedback({ chosen: name, ok })
    setTimeout(() => {
      const next = idx + 1
      if (next >= total) { onDone(correctRef.current, total); return }
      setIdx(next); setFeedback(null); lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  // Keyboard shortcut — type A–G to answer
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
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{label}</p>
      <ProgressBar done={idx} total={total} color={accentColor} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        Grand staff · name this note
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${gsW} ${gsH}`} width="100%"
          style={{ maxWidth: gsW, display: 'block', margin: '0 auto' }}>
          <GrandStaffBase />
          {isMiddleC && <GsLedgerLine cx={cx} cy={isTreble ? gsPosToY_T(0) : gsPosToY_B(12)} color={DARK} />}
          {isBassE2  && <GsLedgerLine cx={cx} cy={gsPosToY_B(0)} color={DARK} />}
          <GsBravuraNote cx={cx} cy={cy} color={DARK} />
        </svg>
      </div>

      <NameButtons feedback={feedback} answer={item.answer} onPick={handlePick} />
    </div>
  )
}

// ── Place exercise (single staff) ─────────────────────────────────────────────
function PlaceExercise({
  pool, sessionLength, accentColor, label, onDone,
}: {
  pool: StaffNoteItem[]; sessionLength: number; accentColor: string
  label: string; onDone: (correct: number, total: number) => void
}) {
  const [items] = useState<StaffNoteItem[]>(() => {
    const exp: StaffNoteItem[] = []
    const reps = Math.ceil(sessionLength / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffle(exp).slice(0, sessionLength)
  })
  const [idx,       setIdx]       = useState(0)
  const [stagedPos, setStagedPos] = useState<number | null>(null)
  const [placedPos, setPlacedPos] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  const svgRef     = useRef<SVGSVGElement>(null)
  const item    = items[idx]
  const total   = items.length
  const cx      = svgW / 2
  const maxPos  = item.clef === 'treble' ? 11 : 12

  // Clamp-snap — always returns a valid pos so taps can't "miss"
  function clientToPos(clientY: number): number {
    const svg = svgRef.current
    if (!svg) return 0
    const r   = svg.getBoundingClientRect()
    const sy  = (clientY - r.top) / r.height * svgH
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
    setPlacedPos(stagedPos); setSubmitted(true)
    setTimeout(() => {
      const next = idx + 1
      if (next >= total) { onDone(correctRef.current, total); return }
      setIdx(next); setStagedPos(null); setPlacedPos(null)
      setSubmitted(false); lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  const isCorrect = submitted && placedPos === item.pos

  const renderNote = (pos: number, color: string) => {
    const cy = posToY(pos)
    return (
      <g>
        {item.clef === 'treble' && pos === 0  && <LedgerLine cx={cx} cy={cy} color={color} />}
        {item.clef === 'bass'   && pos === 0  && <LedgerLine cx={cx} cy={cy} color={color} />}
        {item.clef === 'bass'   && pos === 12 && <LedgerLine cx={cx} cy={cy} color={color} />}
        <BravuraNote cx={cx} cy={cy} color={color} />
      </g>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{label}</p>
      <ProgressBar done={idx} total={total} color={accentColor} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} · place this note
      </p>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 300, color: DARK, lineHeight: 1 }}>
          {item.answer}
        </span>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: '4px 0 0' }}>
          <strong>{octaveLabel(item)}</strong> · tap the staff, then press Place to confirm
        </p>
      </div>
      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 12 }}>
        <svg ref={svgRef} viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            cursor: submitted ? 'default' : 'crosshair',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
          onClick={onStaffClick}
        >
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {!submitted && stagedPos !== null && (
            <g opacity={0.55}>{renderNote(stagedPos, ACCENT_C)}</g>
          )}
          {submitted && placedPos !== null &&
            renderNote(placedPos, isCorrect ? CORRECT_C : WRONG_C)}
          {submitted && !isCorrect && (
            <g opacity={0.55}>{renderNote(item.pos, CORRECT_C)}</g>
          )}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <button
          onClick={onConfirm}
          disabled={submitted || stagedPos === null}
          style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 15, fontWeight: 600,
            cursor: submitted || stagedPos === null ? 'default' : 'pointer',
            background: submitted || stagedPos === null ? '#EDE8DF' : DARK,
            color: submitted || stagedPos === null ? '#B0ACA4' : 'white',
          }}
        >
          Place
        </button>
      </div>
      <PlaceFeedback submitted={submitted} isCorrect={isCorrect} item={item} />
    </div>
  )
}

// ── Place exercise (grand staff) ──────────────────────────────────────────────
function PlaceExerciseGrand({
  pool, sessionLength, accentColor, label, onDone,
}: {
  pool: StaffNoteItem[]; sessionLength: number; accentColor: string
  label: string; onDone: (correct: number, total: number) => void
}) {
  const [items] = useState<StaffNoteItem[]>(() => {
    const exp: StaffNoteItem[] = []
    const reps = Math.ceil(sessionLength / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffle(exp).slice(0, sessionLength)
  })
  const [idx,        setIdx]        = useState(0)
  const [stagedClef, setStagedClef] = useState<'treble' | 'bass' | null>(null)
  const [stagedPos,  setStagedPos]  = useState<number | null>(null)
  const [placedClef, setPlacedClef] = useState<'treble' | 'bass' | null>(null)
  const [placedPos,  setPlacedPos]  = useState<number | null>(null)
  const [submitted,  setSubmitted]  = useState(false)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  const svgRef     = useRef<SVGSVGElement>(null)
  const item  = items[idx]
  const total = items.length
  const cx    = gsW / 2

  // Clamp-snap — always returns a valid placement so taps can't "miss"
  function clientToGrandPos(clientY: number): { clef: 'treble' | 'bass'; pos: number } {
    const svg = svgRef.current
    if (!svg) return { clef: 'treble', pos: 0 }
    const r   = svg.getBoundingClientRect()
    const sy  = (clientY - r.top) / r.height * gsH

    if (sy < GS_MID) {
      let pos = Math.round(10 - (sy - tTop_G) / step_G)
      if (pos < 0) pos = 0
      if (pos > 11) pos = 11
      return { clef: 'treble', pos }
    } else {
      let pos = Math.round(10 - (sy - bTop_G) / step_G)
      if (pos < 0) pos = 0
      if (pos > 12) pos = 12
      return { clef: 'bass', pos }
    }
  }

  // Middle C is valid on either staff — treble pos=0 or bass pos=12
  const itemIsMiddleC = item.answer === 'C' &&
    ((item.clef === 'treble' && item.pos === 0) || (item.clef === 'bass' && item.pos === 12))

  function isPlacementCorrect(clef: 'treble' | 'bass', pos: number): boolean {
    if (itemIsMiddleC)
      return (clef === 'treble' && pos === 0) || (clef === 'bass' && pos === 12)
    return clef === item.clef && pos === item.pos
  }

  function onStaffClick(e: React.MouseEvent<SVGSVGElement>) {
    if (submitted || lockedRef.current) return
    const result = clientToGrandPos(e.clientY)
    setStagedClef(result.clef); setStagedPos(result.pos)
  }

  function onConfirm() {
    if (submitted || lockedRef.current || stagedPos === null || stagedClef === null) return
    lockedRef.current = true
    const ok = isPlacementCorrect(stagedClef, stagedPos)
    if (ok) correctRef.current += 1
    setPlacedClef(stagedClef); setPlacedPos(stagedPos); setSubmitted(true)
    setTimeout(() => {
      const next = idx + 1
      if (next >= total) { onDone(correctRef.current, total); return }
      setIdx(next)
      setStagedClef(null); setStagedPos(null)
      setPlacedClef(null); setPlacedPos(null)
      setSubmitted(false); lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  const isCorrect = submitted && placedClef !== null && placedPos !== null &&
    isPlacementCorrect(placedClef, placedPos)

  const renderGsNote = (clef: 'treble' | 'bass', pos: number, color: string) => {
    const cy = clef === 'treble' ? gsPosToY_T(pos) : gsPosToY_B(pos)
    const isMiddleC = (clef === 'treble' && pos === 0) || (clef === 'bass' && pos === 12)
    const isBassE2  = clef === 'bass' && pos === 0
    return (
      <g>
        {isMiddleC && <GsLedgerLine cx={cx} cy={clef === 'treble' ? gsPosToY_T(0) : gsPosToY_B(12)} color={color} />}
        {isBassE2  && <GsLedgerLine cx={cx} cy={gsPosToY_B(0)} color={color} />}
        <GsBravuraNote cx={cx} cy={cy} color={color} />
      </g>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{label}</p>
      <ProgressBar done={idx} total={total} color={accentColor} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        Grand staff · place this note
      </p>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 300, color: DARK, lineHeight: 1 }}>
          {item.answer}
        </span>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: '4px 0 0' }}>
          <strong>{octaveLabel(item)}</strong> · tap the staff, then press Place to confirm
          {itemIsMiddleC && <span style={{ color: '#B0ACA4' }}> (either staff accepted)</span>}
        </p>
      </div>
      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 12 }}>
        <svg ref={svgRef} viewBox={`0 0 ${gsW} ${gsH}`} width="100%"
          style={{ maxWidth: gsW, display: 'block', margin: '0 auto',
            cursor: submitted ? 'default' : 'crosshair',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
          onClick={onStaffClick}
        >
          <GrandStaffBase />
          {/* Staged ghost */}
          {!submitted && stagedClef !== null && stagedPos !== null && (
            <g opacity={0.55}>{renderGsNote(stagedClef, stagedPos, ACCENT_C)}</g>
          )}
          {/* Placed */}
          {submitted && placedClef !== null && placedPos !== null &&
            renderGsNote(placedClef, placedPos, isCorrect ? CORRECT_C : WRONG_C)}
          {/* Correct hint on wrong */}
          {submitted && !isCorrect && (
            <g opacity={0.55}>{renderGsNote(item.clef, item.pos, CORRECT_C)}</g>
          )}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <button
          onClick={onConfirm}
          disabled={submitted || stagedPos === null}
          style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 15, fontWeight: 600,
            cursor: submitted || stagedPos === null ? 'default' : 'pointer',
            background: submitted || stagedPos === null ? '#EDE8DF' : DARK,
            color: submitted || stagedPos === null ? '#B0ACA4' : 'white',
          }}
        >
          Place
        </button>
      </div>
      <PlaceFeedback submitted={submitted} isCorrect={isCorrect} item={item} />
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function NameButtons({
  feedback, answer, onPick,
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
          let bg = 'white', border = '#D9CFAE', color = '#2A2318'
          if (feedback) {
            if (isAnswer)      { bg = 'var(--forest-soft)'; border = 'var(--forest)'; color = 'var(--forest)' }
            else if (isChosen) { bg = 'var(--oxblood-tint)'; border = 'var(--oxblood)'; color = 'var(--oxblood)' }
          }
          return (
            <button key={name} onClick={() => onPick(name)} style={{
              background: bg, border: `1px solid ${border}`, borderRadius: '10px',
              padding: '14px 4px', fontFamily: SERIF, fontSize: '20px', fontWeight: 400,
              color, cursor: feedback ? 'default' : 'pointer',
              transition: 'border-color 0.12s, background 0.12s',
            }}>{name}</button>
          )
        })}
      </div>
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: 'var(--oxblood)',
        margin: 0, minHeight: '1.5em' }}>
        {feedback && !feedback.ok && (
          <>✗ Correct answer: <strong>{answer}</strong></>
        )}
      </p>
    </>
  )
}

function PlaceFeedback({ submitted, isCorrect, item }: {
  submitted: boolean; isCorrect: boolean; item: StaffNoteItem
}) {
  return (
    <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
      color: submitted ? (isCorrect ? CORRECT_C : WRONG_C) : '#B0ACA4' }}>
      {!submitted
        ? 'Click on the staff to place the note'
        : isCorrect
          ? '✓ Correct'
          : `✗ ${item.note} is ${item.pos % 2 === 0 ? 'on a line' : 'in a space'}`}
    </p>
  )
}

// ── Transition card ───────────────────────────────────────────────────────────
function TransitionCard({
  completedLabel, correct, total, nextLabel, nextType, nextGrand, onNext,
}: {
  completedLabel: string; correct: number; total: number
  nextLabel: string; nextType: ExType; nextGrand: boolean; onNext: () => void
}) {
  const pct = Math.round((correct / total) * 100)
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <p style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: '#B0ACA4', marginBottom: 8 }}>{completedLabel} complete</p>
      <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        {correct} / {total} · {pct}%
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 32 }}>
        {nextType === 'place'
          ? `Next: place each note on the ${nextGrand ? 'grand staff' : 'staff'}.`
          : `Next: name each note on the ${nextGrand ? 'grand staff' : 'staff'}.`}
      </p>
      <button onClick={onNext} style={{
        background: 'var(--oxblood)', color: '#fff', border: '1px solid var(--oxblood)', borderRadius: '10px',
        padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
      }}>
        Start {nextLabel} →
      </button>
    </div>
  )
}

// ── Results card ──────────────────────────────────────────────────────────────
function ResultsCard({
  scores, passingScore, onRestart,
}: {
  scores: { correct: number; total: number }[]
  passingScore: number
  onRestart: () => void
}) {
  const totalCorrect = scores.reduce((s, p) => s + p.correct, 0)
  const total        = scores.reduce((s, p) => s + p.total,   0)
  const pct          = Math.round((totalCorrect / total) * 100)
  const passed       = pct / 100 >= passingScore

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: passed ? 'var(--forest-soft)' : '#FDF3ED',
        border: `2px solid ${passed ? 'rgba(45, 90, 62, 0.32)' : '#F0C4A8'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', fontSize: '32px',
        color: passed ? 'var(--forest)' : '#B5402A',
      }}>
        {passed ? '✓' : '→'}
      </div>
      <p style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 300, color: '#2A2318', marginBottom: '16px' }}>
        {passed ? 'Well done' : 'Keep going'}
      </p>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        {PHASES.map((ph, i) => (
          <div key={i} style={{
            background: '#F7F4ED', borderRadius: 10, padding: '10px 14px', minWidth: 76,
          }}>
            <p style={{ fontFamily: F, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#B0ACA4', margin: '0 0 2px' }}>Part {i + 1}</p>
            <p style={{ fontFamily: F, fontSize: 10, color: '#B0ACA4', margin: '0 0 4px' }}>
              {ph.type === 'name' ? 'Name' : 'Place'} · {ph.grand ? 'Grand' : 'Single'}
            </p>
            <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, margin: 0 }}>
              {scores[i]?.correct ?? 0} / {scores[i]?.total ?? 0}
            </p>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', marginBottom: '6px' }}>
        {totalCorrect} / {total} · {pct}%
      </p>
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0ACA4', marginBottom: '28px' }}>
        {passed
          ? `Passing score: ${Math.round(passingScore * 100)}% ✓`
          : `Passing score: ${Math.round(passingScore * 100)}% · practice more`}
      </p>

      <button onClick={onRestart} style={{
        background: passed ? 'transparent' : 'var(--oxblood)',
        color: passed ? '#7A7060' : '#fff',
        border: passed ? '1px solid #D9CFAE' : '1px solid var(--oxblood)',
        borderRadius: '10px',
        padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
      }}>
        {passed ? 'Practice more →' : 'Try again →'}
      </button>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function StaffNoteQuiz({
  pool,
  sessionLength = 15,
  passingScore,
  accentColor = '#B5402A',
  onComplete,
}: {
  pool: StaffNoteItem[]
  sessionLength?: number
  passingScore: number
  accentColor?: string
  onComplete: (score: number, total: number) => void
}) {
  const [phaseIdx,    setPhaseIdx]    = useState(0)
  const [inTransit,   setInTransit]   = useState(false)
  const [scores,      setScores]      = useState<{ correct: number; total: number }[]>([])
  const [exerciseKey, setExerciseKey] = useState(0)

  const currentPhase = PHASES[phaseIdx]
  const nextPhase    = PHASES[phaseIdx + 1]

  function handlePhaseDone(correct: number, total: number) {
    const newScores = [...scores, { correct, total }]
    setScores(newScores)
    if (phaseIdx + 1 >= PHASES.length) {
      const totalCorrect = newScores.reduce((s, p) => s + p.correct, 0)
      const totalAll     = newScores.reduce((s, p) => s + p.total,   0)
      onComplete(totalCorrect / totalAll, totalAll)
      setPhaseIdx(PHASES.length)
    } else {
      setInTransit(true)
    }
  }

  function handleTransitionNext() {
    setPhaseIdx(i => i + 1); setInTransit(false); setExerciseKey(k => k + 1)
  }

  function handleRestart() {
    setPhaseIdx(0); setInTransit(false); setScores([]); setExerciseKey(k => k + 1)
  }

  if (phaseIdx >= PHASES.length) {
    return <ResultsCard scores={scores} passingScore={passingScore} onRestart={handleRestart} />
  }

  if (inTransit) {
    const last = scores[scores.length - 1]
    return (
      <TransitionCard
        completedLabel={currentPhase.label}
        correct={last.correct} total={last.total}
        nextLabel={nextPhase.label}
        nextType={nextPhase.type}
        nextGrand={nextPhase.grand}
        onNext={handleTransitionNext}
      />
    )
  }

  const exProps = { pool, sessionLength, accentColor, label: currentPhase.label, onDone: handlePhaseDone }

  if (currentPhase.type === 'name') {
    return currentPhase.grand
      ? <NameExerciseGrand key={exerciseKey} {...exProps} />
      : <NameExercise key={exerciseKey} {...exProps} />
  }
  return currentPhase.grand
    ? <PlaceExerciseGrand key={exerciseKey} {...exProps} />
    : <PlaceExercise key={exerciseKey} {...exProps} />
}
