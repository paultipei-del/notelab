'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { ExerciseNavBar } from './nav/ExerciseNavBar'

const F      = 'var(--font-jost), sans-serif'
const SERIF  = 'var(--font-cormorant), serif'
const DARK   = '#1A1A18'
const GREY   = '#7A7060'
const ACCENT = '#BA7517'
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'
const STROKE  = 1.3

// ── Staff geometry ────────────────────────────────────────────────────────────
const step = 8
const sL   = 32
const sR   = 360
const tTop = 54
const svgW = sR + 16        // 376
const svgH = tTop + 8 * step + 54  // 172

// Treble-clef pos system:
//   pos=0  → C4 (Middle C, ledger below)
//   pos=1  → D4 space below line 1
//   pos=2  → E4 line 1
//   ...
//   pos=10 → F5 line 5
//   pos=11 → G5 space above
//   pos=12 → A5 ledger above
function posToY_T(pos: number) { return tTop + (10 - pos) * step }

// Bass-clef pos system:
//   pos=0  → E2 ledger below
//   pos=2  → G2 line 1
//   ...
//   pos=10 → A3 line 5
//   pos=12 → C4 (Middle C, ledger above)
function posToY_B(pos: number) { return tTop + (10 - pos) * step }

function lineY(n: number) { return tTop + (5 - n) * 2 * step }

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

// Natural-letter name for a given clef + pos (no sharps/flats in this lesson)
const TREBLE_LETTERS = ['C','D','E','F','G','A','B','C','D','E','F','G','A']  // pos 0..12
const BASS_LETTERS   = ['E','F','G','A','B','C','D','E','F','G','A','B','C']  // pos 0..12
function letterAt(clef: 'treble' | 'bass', pos: number): string {
  return (clef === 'treble' ? TREBLE_LETTERS : BASS_LETTERS)[pos]
}

// Interval number between two positions (inclusive count)
function intervalNumber(pos1: number, pos2: number): number {
  return Math.abs(pos2 - pos1) + 1
}

// ── SVG primitives ────────────────────────────────────────────────────────────
function StaffBase({ x1 = sL, x2 = sR }: { x1?: number; x2?: number }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={x1} y1={lineY(n)} x2={x2} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
    </>
  )
}

function TrebleClef({ x = sL + 4 }: { x?: number }) {
  return (
    <text x={x} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
      fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
  )
}

// Bass clef: y = tTop + 2*step + 2 anchors the glyph on the F line (line 4)
function BassClef({ x = sL + 2 }: { x?: number }) {
  return (
    <text x={x} y={tTop + 2 * step + 2} fontFamily="Bravura, serif" fontSize={66}
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

// ── UI primitives ─────────────────────────────────────────────────────────────
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

function PrimaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: DARK, color: 'white', border: 'none', borderRadius: 10,
      padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

// Intro visuals live in visuals/PitchDiagrams.tsx (IntervalsDiagram).
// The lesson starts directly at Exercise 1 — all teaching content is on the landing page.

// ── Ex 1: Name the interval ───────────────────────────────────────────────────
interface IntervalItem {
  clef: 'treble' | 'bass'
  pos1: number
  pos2: number
  harmonic: boolean   // true = stacked, false = melodic side-by-side
}

// Mix of melodic/harmonic, ascending/descending, 2nd–5th. First item is given.
const EX1_POOL: IntervalItem[] = [
  // Treble — pos range 0 (C4) to 12 (A5)
  { clef: 'treble', pos1: 2, pos2: 6, harmonic: true  },   // E4–B4  5th  (GIVEN)
  { clef: 'treble', pos1: 3, pos2: 5, harmonic: true  },   // F4–A4  3rd
  { clef: 'treble', pos1: 4, pos2: 5, harmonic: false },   // G4–A4  2nd  (asc)
  { clef: 'treble', pos1: 6, pos2: 9, harmonic: false },   // B4–E5  4th  (asc)
  { clef: 'treble', pos1: 1, pos2: 4, harmonic: true  },   // D4–G4  4th
  { clef: 'treble', pos1: 7, pos2: 11, harmonic: false },  // C5–G5  5th  (asc)
  { clef: 'treble', pos1: 10, pos2: 8, harmonic: false },  // F5–D5  3rd  (desc)
  { clef: 'treble', pos1: 8, pos2: 5, harmonic: false },   // D5–A4  4th  (desc)
  { clef: 'treble', pos1: 7, pos2: 6, harmonic: false },   // C5–B4  2nd  (desc)
  // Bass — pos range 0 (E2) to 12 (C4)
  { clef: 'bass',   pos1: 2, pos2: 4, harmonic: true  },   // G2–B2  3rd
  { clef: 'bass',   pos1: 5, pos2: 6, harmonic: false },   // C3–D3  2nd  (asc)
  { clef: 'bass',   pos1: 6, pos2: 9, harmonic: true  },   // D3–G3  4th
  { clef: 'bass',   pos1: 3, pos2: 7, harmonic: false },   // A2–E3  5th  (asc)
  { clef: 'bass',   pos1: 8, pos2: 10, harmonic: true },   // F3–A3  3rd
  { clef: 'bass',   pos1: 10, pos2: 12, harmonic: false }, // A3–C4  3rd  (asc)
  { clef: 'bass',   pos1: 11, pos2: 8, harmonic: false },  // B3–F3  4th  (desc)
  { clef: 'bass',   pos1: 7, pos2: 6, harmonic: false },   // E3–D3  2nd  (desc)
  { clef: 'bass',   pos1: 9, pos2: 5, harmonic: false },   // G3–C3  5th  (desc)
]

const NOTE1_X = 140
const NOTE2_X = 240

function IntervalStaffCard({ item }: { item: IntervalItem }) {
  const posToY = item.clef === 'treble' ? posToY_T : posToY_B
  const cy1 = posToY(item.pos1)
  const cy2 = posToY(item.pos2)
  // Harmonic notes share an x (second note slightly offset if adjacent for clarity)
  const x1 = item.harmonic ? NOTE1_X + 50 : NOTE1_X
  const x2 = item.harmonic ? x1           : NOTE2_X

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
      style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
      <StaffBase />
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}

      {/* Ledger lines for extreme positions */}
      {item.clef === 'treble' && item.pos1 === 0  && <LedgerLine cx={x1} cy={cy1} />}
      {item.clef === 'treble' && item.pos1 === 12 && <LedgerLine cx={x1} cy={cy1} />}
      {item.clef === 'treble' && item.pos2 === 0  && <LedgerLine cx={x2} cy={cy2} />}
      {item.clef === 'treble' && item.pos2 === 12 && <LedgerLine cx={x2} cy={cy2} />}
      {item.clef === 'bass'   && item.pos1 === 0  && <LedgerLine cx={x1} cy={cy1} />}
      {item.clef === 'bass'   && item.pos1 === 12 && <LedgerLine cx={x1} cy={cy1} />}
      {item.clef === 'bass'   && item.pos2 === 0  && <LedgerLine cx={x2} cy={cy2} />}
      {item.clef === 'bass'   && item.pos2 === 12 && <LedgerLine cx={x2} cy={cy2} />}

      <BravuraNote cx={x1} cy={cy1} />
      <BravuraNote cx={x2} cy={cy2} />
    </svg>
  )
}

function NameIntervalEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  // First item is given. Shuffle the rest but keep them grouped by clef for readability.
  const items = useMemo(() => {
    const trebleRest = shuffled(EX1_POOL.filter((it, i) => it.clef === 'treble' && i !== 0))
    const bassItems  = shuffled(EX1_POOL.filter(it => it.clef === 'bass'))
    return [EX1_POOL[0], ...trebleRest, ...bassItems]
  }, [])
  const total = items.length

  const [idx,      setIdx]      = useState(0)
  const [showGivenNext, setShowGivenNext] = useState(false)  // handle given-example transition
  const [chosen,   setChosen]   = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item       = items[idx]
  const isGiven    = idx === 0
  const answer     = intervalNumber(item.pos1, item.pos2)

  function pick(n: number) {
    if (lockedRef.current || feedback !== null) return
    lockedRef.current = true
    const ok = n === answer
    if (ok) correctRef.current += 1
    setChosen(n)
    setFeedback({ ok })
    setTimeout(() => {
      if (idx + 1 >= total) { onDone(correctRef.current, total); return }
      setIdx(i => i + 1)
      setChosen(null); setFeedback(null); lockedRef.current = false
    }, ok ? 1000 : 1800)
  }

  function skipGiven() {
    setShowGivenNext(true)
    setIdx(1)
  }

  // Given-example view
  if (isGiven && !showGivenNext) {
    return (
      <div>
        <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
          Exercise 1 — Name these intervals
        </p>
        <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
          The first one is given: this is a <strong style={{ color: ACCENT }}>5th</strong>.
          Count <strong>{letterAt(item.clef, Math.min(item.pos1, item.pos2))}</strong> → ... →{' '}
          <strong>{letterAt(item.clef, Math.max(item.pos1, item.pos2))}</strong> to verify.
        </p>

        <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
          padding: '8px 0', marginBottom: 16 }}>
          <IntervalStaffCard item={item} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ display: 'inline-block', background: ACCENT + '22',
            border: `1px solid ${ACCENT}55`, borderRadius: 8,
            padding: '6px 18px', fontFamily: F, fontSize: 15, fontWeight: 700, color: ACCENT }}>
            5th
          </span>
        </div>

        <div>
          <PrimaryBtn label="Continue →" onClick={skipGiven} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 1 — Name these intervals
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — name this interval
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <IntervalStaffCard item={item} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[2, 3, 4, 5].map(n => {
          const isChosen = chosen === n
          const isAnswer = n === answer
          let bg = 'white', border = '#DDD8CA', color = DARK
          if (feedback !== null) {
            if (isAnswer)              { bg = '#EAF3DE'; border = '#C0DD97'; color = CORRECT }
            else if (isChosen)         { bg = '#FDF3ED'; border = '#F0C4A8'; color = WRONG }
          }
          return (
            <button key={n} onClick={() => pick(n)}
              disabled={feedback !== null}
              style={{
                padding: '14px 0', borderRadius: 10, border: `1.5px solid ${border}`,
                background: bg, fontFamily: SERIF, fontSize: 22, fontWeight: 400,
                color, cursor: feedback !== null ? 'default' : 'pointer',
              }}>
              {n === 2 ? '2nd' : n === 3 ? '3rd' : n === 4 ? '4th' : '5th'}
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && !feedback.ok && (
          <>Correct answer: <strong style={{ color: CORRECT }}>
            {answer === 2 ? '2nd' : answer === 3 ? '3rd' : answer === 4 ? '4th' : '5th'}
          </strong></>
        )}
        {feedback !== null && feedback.ok && '✓ Correct'}
      </p>
    </div>
  )
}

// ── Ex 2: Write a note above the given note to complete the interval ─────────
interface BuildIntervalItem {
  clef: 'treble' | 'bass'
  givenPos: number
  size: 2 | 3 | 4 | 5
  direction: 'up' | 'down'
}

// Mix of ascending / descending intervals, 2nd–5th, across both clefs.
// Given note fixed; student places the second note.
const EX2_POOL: BuildIntervalItem[] = [
  // Treble ascending (pos range 0–12)
  { clef: 'treble', givenPos: 1, size: 3, direction: 'up' },   // D4 up  → F4
  { clef: 'treble', givenPos: 2, size: 2, direction: 'up' },   // E4 up  → F4
  { clef: 'treble', givenPos: 4, size: 4, direction: 'up' },   // G4 up  → C5
  { clef: 'treble', givenPos: 5, size: 5, direction: 'up' },   // A4 up  → E5
  { clef: 'treble', givenPos: 7, size: 3, direction: 'up' },   // C5 up  → E5
  // Treble descending
  { clef: 'treble', givenPos: 8,  size: 4, direction: 'down' }, // D5 down → A4
  { clef: 'treble', givenPos: 9,  size: 3, direction: 'down' }, // E5 down → C5
  { clef: 'treble', givenPos: 10, size: 2, direction: 'down' }, // F5 down → E5
  { clef: 'treble', givenPos: 11, size: 5, direction: 'down' }, // G5 down → C5
  // Bass ascending (pos range 0–12)
  { clef: 'bass',   givenPos: 2, size: 4, direction: 'up' },   // G2 up  → C3
  { clef: 'bass',   givenPos: 3, size: 5, direction: 'up' },   // A2 up  → E3
  { clef: 'bass',   givenPos: 4, size: 2, direction: 'up' },   // B2 up  → C3
  { clef: 'bass',   givenPos: 6, size: 3, direction: 'up' },   // D3 up  → F3
  // Bass descending
  { clef: 'bass',   givenPos: 9,  size: 4, direction: 'down' }, // G3 down → D3
  { clef: 'bass',   givenPos: 10, size: 5, direction: 'down' }, // A3 down → D3
  { clef: 'bass',   givenPos: 11, size: 2, direction: 'down' }, // B3 down → A3
  { clef: 'bass',   givenPos: 8,  size: 3, direction: 'down' }, // F3 down → D3
]

const EX2_NOTE1_X = 140   // given note x
const EX2_NOTE2_X = 240   // placed note x

function BuildIntervalEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo(() => {
    const treble = shuffled(EX2_POOL.filter(it => it.clef === 'treble'))
    const bass   = shuffled(EX2_POOL.filter(it => it.clef === 'bass'))
    return [...treble, ...bass]
  }, [])
  const total = items.length

  const [idx,       setIdx]       = useState(0)
  const [stagedPos, setStagedPos] = useState<number | null>(null)
  const [placedPos, setPlacedPos] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  const svgRef     = useRef<SVGSVGElement | null>(null)

  const item      = items[idx]
  const targetPos = item.direction === 'up'
    ? item.givenPos + item.size - 1
    : item.givenPos - (item.size - 1)
  const isCorrect = submitted && placedPos === targetPos

  // Clamp-snap — any pos 0..12 is a valid target
  function clientToPos(clientY: number): number {
    const svg = svgRef.current
    if (!svg) return 0
    const r   = svg.getBoundingClientRect()
    const sy  = (clientY - r.top) / r.height * svgH
    let pos = Math.round(10 - (sy - tTop) / step)
    if (pos < 0) pos = 0
    if (pos > 12) pos = 12
    return pos
  }

  function onStaffClick(e: React.MouseEvent<SVGSVGElement>) {
    if (submitted || lockedRef.current) return
    if (!svgRef.current) svgRef.current = e.currentTarget
    setStagedPos(clientToPos(e.clientY))
  }

  function onConfirm() {
    if (submitted || lockedRef.current || stagedPos === null) return
    lockedRef.current = true
    const ok = stagedPos === targetPos
    if (ok) correctRef.current += 1
    setPlacedPos(stagedPos); setSubmitted(true)
    setTimeout(() => {
      if (idx + 1 >= total) { onDone(correctRef.current, total); return }
      setIdx(i => i + 1)
      setStagedPos(null); setPlacedPos(null); setSubmitted(false)
      lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  const sizeLabel = (n: number) =>
    n === 2 ? '2nd' : n === 3 ? '3rd' : n === 4 ? '4th' : '5th'

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 2 — Build the interval
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — place a note a{' '}
        <strong style={{ color: ACCENT }}>{sizeLabel(item.size)}</strong>{' '}
        {item.direction === 'up' ? 'above' : 'below'}
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 12 }}>
        <svg
          ref={r => { svgRef.current = r }}
          viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          onClick={onStaffClick}
          style={{
            maxWidth: svgW, display: 'block', margin: '0 auto',
            cursor: submitted ? 'default' : 'crosshair',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
          }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}

          {/* Given note */}
          {(item.givenPos === 0 || item.givenPos === 12) &&
            <LedgerLine cx={EX2_NOTE1_X} cy={(item.clef === 'treble' ? posToY_T : posToY_B)(item.givenPos)} />}
          <BravuraNote cx={EX2_NOTE1_X}
            cy={(item.clef === 'treble' ? posToY_T : posToY_B)(item.givenPos)} />

          {/* Staged ghost / placed result */}
          {!submitted && stagedPos !== null && (
            <g opacity={0.55}>
              {(stagedPos === 0 || stagedPos === 12) &&
                <LedgerLine cx={EX2_NOTE2_X}
                  cy={(item.clef === 'treble' ? posToY_T : posToY_B)(stagedPos)} color={ACCENT} />}
              <BravuraNote cx={EX2_NOTE2_X}
                cy={(item.clef === 'treble' ? posToY_T : posToY_B)(stagedPos)} color={ACCENT} />
            </g>
          )}
          {submitted && placedPos !== null && (
            <g>
              {(placedPos === 0 || placedPos === 12) &&
                <LedgerLine cx={EX2_NOTE2_X}
                  cy={(item.clef === 'treble' ? posToY_T : posToY_B)(placedPos)}
                  color={isCorrect ? CORRECT : WRONG} />}
              <BravuraNote cx={EX2_NOTE2_X}
                cy={(item.clef === 'treble' ? posToY_T : posToY_B)(placedPos)}
                color={isCorrect ? CORRECT : WRONG} />
            </g>
          )}
          {submitted && !isCorrect && (
            <g opacity={0.55}>
              {(targetPos === 0 || targetPos === 12) &&
                <LedgerLine cx={EX2_NOTE2_X}
                  cy={(item.clef === 'treble' ? posToY_T : posToY_B)(targetPos)} color={CORRECT} />}
              <BravuraNote cx={EX2_NOTE2_X}
                cy={(item.clef === 'treble' ? posToY_T : posToY_B)(targetPos)} color={CORRECT} />
            </g>
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
          }}>
          Place
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: !submitted ? '#B0ACA4' : isCorrect ? CORRECT : WRONG }}>
        {submitted && isCorrect  && '✓ Correct'}
        {submitted && !isCorrect && (
          <>The correct note is a <strong style={{ color: CORRECT }}>
            {sizeLabel(item.size)}</strong>{' '}{item.direction === 'up' ? 'above' : 'below'} —
            shown in green</>
        )}
      </p>
    </div>
  )
}

// ── Ex 3: Read, build, and name (three-step per item) ───────────────────────
interface ReadBuildItem {
  clef: 'treble' | 'bass'
  givenPos: number
  size: 2 | 3 | 4 | 5
  direction: 'up' | 'down'
}

// 6 treble + 6 bass. Student names the given note, places the second note,
// then names the second note. All three sub-steps are scored.
const EX3_POOL: ReadBuildItem[] = [
  // Treble
  { clef: 'treble', givenPos: 3, size: 3, direction: 'up'   },   // F4 up 3rd → A4
  { clef: 'treble', givenPos: 7, size: 5, direction: 'down' },   // C5 down 5th → F4
  { clef: 'treble', givenPos: 5, size: 2, direction: 'up'   },   // A4 up 2nd → B4
  { clef: 'treble', givenPos: 8, size: 3, direction: 'down' },   // D5 down 3rd → B4
  { clef: 'treble', givenPos: 2, size: 4, direction: 'up'   },   // E4 up 4th → A4
  { clef: 'treble', givenPos: 9, size: 2, direction: 'down' },   // E5 down 2nd → D5
  // Bass
  { clef: 'bass',   givenPos: 2, size: 3, direction: 'up'   },   // G2 up 3rd → B2
  { clef: 'bass',   givenPos: 8, size: 5, direction: 'down' },   // F3 down 5th → B2
  { clef: 'bass',   givenPos: 4, size: 4, direction: 'up'   },   // B2 up 4th → E3
  { clef: 'bass',   givenPos: 10, size: 3, direction: 'down' },  // A3 down 3rd → F3
  { clef: 'bass',   givenPos: 5, size: 2, direction: 'up'   },   // C3 up 2nd → D3
  { clef: 'bass',   givenPos: 7, size: 2, direction: 'down' },   // E3 down 2nd → D3
]

const EX3_NOTE1_X = 140
const EX3_NOTE2_X = 240

type Ex3Step = 'name1' | 'place' | 'name2'

function ReadBuildEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo(() => {
    const treble = shuffled(EX3_POOL.filter(it => it.clef === 'treble'))
    const bass   = shuffled(EX3_POOL.filter(it => it.clef === 'bass'))
    return [...treble, ...bass]
  }, [])
  const total = items.length
  const totalSteps = total * 3   // each item has 3 scored sub-steps

  const [idx,       setIdx]       = useState(0)
  const [subStep,   setSubStep]   = useState<Ex3Step>('name1')
  const [name1Pick, setName1Pick] = useState<string | null>(null)
  const [stagedPos, setStagedPos] = useState<number | null>(null)
  const [placedPos, setPlacedPos] = useState<number | null>(null)
  const [name2Pick, setName2Pick] = useState<string | null>(null)
  const [feedback,  setFeedback]  = useState<{ step: Ex3Step; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  const svgRef     = useRef<SVGSVGElement | null>(null)

  const item      = items[idx]
  const targetPos = item.direction === 'up'
    ? item.givenPos + item.size - 1
    : item.givenPos - (item.size - 1)
  const givenLetter  = letterAt(item.clef, item.givenPos)
  const targetLetter = letterAt(item.clef, targetPos)

  function advance() {
    // Move to next sub-step / next item
    if (subStep === 'name1') { setSubStep('place'); setFeedback(null); lockedRef.current = false; return }
    if (subStep === 'place') { setSubStep('name2'); setFeedback(null); lockedRef.current = false; return }
    // subStep === 'name2' — last sub-step for this item
    if (idx + 1 >= total) { onDone(correctRef.current, totalSteps); return }
    setIdx(i => i + 1)
    setSubStep('name1')
    setName1Pick(null); setStagedPos(null); setPlacedPos(null); setName2Pick(null)
    setFeedback(null)
    lockedRef.current = false
  }

  function judge(ok: boolean, currentStep: Ex3Step) {
    if (ok) correctRef.current += 1
    setFeedback({ step: currentStep, ok })
    setTimeout(advance, ok ? 1100 : 1800)
  }

  function pickName1(letter: string) {
    if (subStep !== 'name1' || feedback !== null || lockedRef.current) return
    lockedRef.current = true
    setName1Pick(letter)
    judge(letter === givenLetter, 'name1')
  }

  function clientToPos(clientY: number): number {
    const svg = svgRef.current
    if (!svg) return 0
    const r   = svg.getBoundingClientRect()
    const sy  = (clientY - r.top) / r.height * svgH
    let pos = Math.round(10 - (sy - tTop) / step)   // module-level staff step (8)
    if (pos < 0) pos = 0
    if (pos > 12) pos = 12
    return pos
  }

  function onStaffClick(e: React.MouseEvent<SVGSVGElement>) {
    if (subStep !== 'place' || feedback !== null || lockedRef.current) return
    if (!svgRef.current) svgRef.current = e.currentTarget
    setStagedPos(clientToPos(e.clientY))
  }

  function onPlace() {
    if (subStep !== 'place' || feedback !== null || lockedRef.current || stagedPos === null) return
    lockedRef.current = true
    setPlacedPos(stagedPos)
    judge(stagedPos === targetPos, 'place')
  }

  function pickName2(letter: string) {
    if (subStep !== 'name2' || feedback !== null || lockedRef.current) return
    lockedRef.current = true
    setName2Pick(letter)
    judge(letter === targetLetter, 'name2')
  }

  // Keyboard shortcuts — A–G (pick a letter) and Enter (Place when staged)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (feedback !== null || lockedRef.current) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter' && subStep === 'place' && stagedPos !== null) { onPlace(); return }
      const k = e.key.toUpperCase()
      if (k.length !== 1 || k < 'A' || k > 'G') return
      if (subStep === 'name1') pickName1(k)
      else if (subStep === 'name2') pickName2(k)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, subStep, stagedPos, feedback])

  const sizeLabel = (n: number) =>
    n === 2 ? '2nd' : n === 3 ? '3rd' : n === 4 ? '4th' : '5th'

  const posToY = item.clef === 'treble' ? posToY_T : posToY_B

  // Which sub-step's letter picker is active? (name1 or name2)
  const pickerActive = subStep === 'name1' || subStep === 'name2'
  const pickerAnswer = subStep === 'name1' ? givenLetter : targetLetter
  const pickerChosen = subStep === 'name1' ? name1Pick : name2Pick
  const pickerFeedback = feedback?.step === subStep ? feedback : null

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 3 — Read and build intervals
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} —{' '}
        <strong style={{ color: ACCENT }}>
          {item.direction === 'up' ? 'up a ' : 'down a '}{sizeLabel(item.size)}
        </strong>
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <svg
          ref={r => { svgRef.current = r }}
          viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          onClick={onStaffClick}
          style={{
            maxWidth: svgW, display: 'block', margin: '0 auto',
            cursor: subStep === 'place' && !feedback ? 'crosshair' : 'default',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
          }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}

          {/* Given note (always visible) */}
          {(item.givenPos === 0 || item.givenPos === 12) &&
            <LedgerLine cx={EX3_NOTE1_X} cy={posToY(item.givenPos)} />}
          <BravuraNote cx={EX3_NOTE1_X} cy={posToY(item.givenPos)} />

          {/* Second note: staged (purple/amber) → placed (green/red) → correct hint if wrong */}
          {subStep === 'place' && !feedback && stagedPos !== null && (
            <g opacity={0.55}>
              {(stagedPos === 0 || stagedPos === 12) &&
                <LedgerLine cx={EX3_NOTE2_X} cy={posToY(stagedPos)} color={ACCENT} />}
              <BravuraNote cx={EX3_NOTE2_X} cy={posToY(stagedPos)} color={ACCENT} />
            </g>
          )}
          {subStep === 'place' && feedback && placedPos !== null && (
            <g>
              {(placedPos === 0 || placedPos === 12) &&
                <LedgerLine cx={EX3_NOTE2_X} cy={posToY(placedPos)}
                  color={feedback.ok ? CORRECT : WRONG} />}
              <BravuraNote cx={EX3_NOTE2_X} cy={posToY(placedPos)}
                color={feedback.ok ? CORRECT : WRONG} />
            </g>
          )}
          {subStep === 'place' && feedback && !feedback.ok && (
            <g opacity={0.55}>
              {(targetPos === 0 || targetPos === 12) &&
                <LedgerLine cx={EX3_NOTE2_X} cy={posToY(targetPos)} color={CORRECT} />}
              <BravuraNote cx={EX3_NOTE2_X} cy={posToY(targetPos)} color={CORRECT} />
            </g>
          )}
          {/* After place-step completes, keep the (correct) second note on screen for name2 */}
          {subStep === 'name2' && (
            <g>
              {(targetPos === 0 || targetPos === 12) &&
                <LedgerLine cx={EX3_NOTE2_X} cy={posToY(targetPos)} />}
              <BravuraNote cx={EX3_NOTE2_X} cy={posToY(targetPos)} />
            </g>
          )}
        </svg>
      </div>

      {/* Step indicator */}
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 10 }}>
        {subStep === 'name1' && <>Step 1 — Name the <strong>given</strong> note</>}
        {subStep === 'place' && <>Step 2 — Place the second note{' '}
          <strong style={{ color: ACCENT }}>{item.direction === 'up' ? 'up' : 'down'} a {sizeLabel(item.size)}</strong>
        </>}
        {subStep === 'name2' && <>Step 3 — Name the <strong>second</strong> note</>}
      </p>

      {/* Letter picker (for name1 and name2) */}
      {pickerActive && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
          {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(letter => {
            const isChosen = pickerChosen === letter
            const isAnswer = pickerAnswer === letter
            let bg = 'white', border = '#DDD8CA', color = DARK
            if (pickerFeedback !== null) {
              if (isAnswer)              { bg = '#EAF3DE'; border = '#C0DD97'; color = CORRECT }
              else if (isChosen)         { bg = '#FDF3ED'; border = '#F0C4A8'; color = WRONG }
            }
            return (
              <button key={letter}
                onClick={() => (subStep === 'name1' ? pickName1(letter) : pickName2(letter))}
                disabled={pickerFeedback !== null}
                style={{
                  padding: '14px 0', borderRadius: 10, border: `1.5px solid ${border}`,
                  background: bg, fontFamily: SERIF, fontSize: 22, fontWeight: 400,
                  color, cursor: pickerFeedback !== null ? 'default' : 'pointer',
                }}>
                {letter}
              </button>
            )
          })}
        </div>
      )}

      {/* Place button (for subStep 'place') */}
      {subStep === 'place' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <button onClick={onPlace}
            disabled={feedback !== null || stagedPos === null}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none',
              fontFamily: F, fontSize: 15, fontWeight: 600,
              cursor: feedback !== null || stagedPos === null ? 'default' : 'pointer',
              background: feedback !== null || stagedPos === null ? '#EDE8DF' : DARK,
              color: feedback !== null || stagedPos === null ? '#B0ACA4' : 'white',
            }}>
            Place
          </button>
        </div>
      )}

      {/* Feedback row */}
      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback?.step === 'name1' && !feedback.ok && (
          <>It&apos;s <strong style={{ color: CORRECT }}>{givenLetter}</strong></>
        )}
        {feedback?.step === 'place' && !feedback.ok && (
          <>Correct note shown in green</>
        )}
        {feedback?.step === 'name2' && !feedback.ok && (
          <>It&apos;s <strong style={{ color: CORRECT }}>{targetLetter}</strong></>
        )}
        {feedback?.ok && '✓ Correct'}
      </p>
    </div>
  )
}

// ── Ex 4: Identify the interval used throughout a short musical phrase ──────
type Duration = 'quarter' | 'half' | 'eighth'
interface PhraseNote { pos: number; duration: Duration }
interface Ex4Item {
  clef: 'treble' | 'bass'
  notes: PhraseNote[]
  answer: 2 | 3 | 4 | 5
  // Pairs of indices into notes[] that should be beamed together (eighths only)
  beamPairs: [number, number][]
}

// Treble pos:  C4=0 D4=1 E4=2 F4=3 G4=4 A4=5 B4=6 C5=7 D5=8 E5=9 F5=10 G5=11 A5=12
// Bass   pos:  E2=0 F2=1 G2=2 A2=3 B2=4 C3=5 D3=6 E3=7 F3=8 G3=9 A3=10 B3=11 C4=12
const EX4_POOL: Ex4Item[] = [
  // ── 2nds ──────────────────────────────────────────────────────────────
  // Treble: E4 F4 G4 A4 — all quarters, step-wise up
  { clef: 'treble', answer: 2, beamPairs: [], notes: [
    { pos: 2, duration: 'quarter' }, { pos: 3, duration: 'quarter' },
    { pos: 4, duration: 'quarter' }, { pos: 5, duration: 'quarter' },
  ]},
  // Treble: C5 B4(e) A4(e) G4 — 2nd example from spec
  { clef: 'treble', answer: 2, beamPairs: [[1, 2]], notes: [
    { pos: 7, duration: 'quarter' }, { pos: 6, duration: 'eighth' },
    { pos: 5, duration: 'eighth'  }, { pos: 4, duration: 'quarter' },
  ]},
  // Treble: A4 half, B4 half — simple step
  { clef: 'treble', answer: 2, beamPairs: [], notes: [
    { pos: 5, duration: 'half' }, { pos: 6, duration: 'half' },
  ]},
  // Treble: D4(e) E4(e) F4(e) G4(e) — two beamed pairs
  { clef: 'treble', answer: 2, beamPairs: [[0, 1], [2, 3]], notes: [
    { pos: 1, duration: 'eighth' }, { pos: 2, duration: 'eighth' },
    { pos: 3, duration: 'eighth' }, { pos: 4, duration: 'eighth' },
  ]},
  // Bass: C3 D3 E3 F3 — quarters up
  { clef: 'bass', answer: 2, beamPairs: [], notes: [
    { pos: 5, duration: 'quarter' }, { pos: 6, duration: 'quarter' },
    { pos: 7, duration: 'quarter' }, { pos: 8, duration: 'quarter' },
  ]},
  // Bass: B3 A3 G3 F3 — quarters down
  { clef: 'bass', answer: 2, beamPairs: [], notes: [
    { pos: 11, duration: 'quarter' }, { pos: 10, duration: 'quarter' },
    { pos: 9,  duration: 'quarter' }, { pos: 8,  duration: 'quarter' },
  ]},

  // ── 3rds ──────────────────────────────────────────────────────────────
  // Treble: F4 B4 F4 — quarters (spec example, 4th originally; adjusted)
  { clef: 'treble', answer: 4, beamPairs: [], notes: [
    { pos: 3, duration: 'quarter' }, { pos: 6, duration: 'quarter' },
    { pos: 3, duration: 'quarter' },
  ]},
  // Treble: C4 E4 G4 E4 — stacked thirds
  { clef: 'treble', answer: 3, beamPairs: [], notes: [
    { pos: 0, duration: 'quarter' }, { pos: 2, duration: 'quarter' },
    { pos: 4, duration: 'quarter' }, { pos: 2, duration: 'quarter' },
  ]},
  // Treble: D4 F4 A4 — half, quarter, quarter
  { clef: 'treble', answer: 3, beamPairs: [], notes: [
    { pos: 1, duration: 'half' }, { pos: 3, duration: 'quarter' },
    { pos: 5, duration: 'quarter' },
  ]},
  // Treble: F4 A4 C5 A4 — quarters
  { clef: 'treble', answer: 3, beamPairs: [], notes: [
    { pos: 3, duration: 'quarter' }, { pos: 5, duration: 'quarter' },
    { pos: 7, duration: 'quarter' }, { pos: 5, duration: 'quarter' },
  ]},
  // Bass: E2 G2 B2 G2 — quarters
  { clef: 'bass', answer: 3, beamPairs: [], notes: [
    { pos: 0, duration: 'quarter' }, { pos: 2, duration: 'quarter' },
    { pos: 4, duration: 'quarter' }, { pos: 2, duration: 'quarter' },
  ]},
  // Bass: F3 half, A3 half — as before
  { clef: 'bass', answer: 3, beamPairs: [], notes: [
    { pos: 8, duration: 'half' }, { pos: 10, duration: 'half' },
  ]},

  // ── 4ths ──────────────────────────────────────────────────────────────
  // Treble: C4 F4 C4 F4 — quarters
  { clef: 'treble', answer: 4, beamPairs: [], notes: [
    { pos: 0, duration: 'quarter' }, { pos: 3, duration: 'quarter' },
    { pos: 0, duration: 'quarter' }, { pos: 3, duration: 'quarter' },
  ]},
  // Treble: D4 G4 — halves
  { clef: 'treble', answer: 4, beamPairs: [], notes: [
    { pos: 1, duration: 'half' }, { pos: 4, duration: 'half' },
  ]},
  // Bass: A2 D3 A2 — quarters
  { clef: 'bass', answer: 4, beamPairs: [], notes: [
    { pos: 3, duration: 'quarter' }, { pos: 6, duration: 'quarter' },
    { pos: 3, duration: 'quarter' },
  ]},
  // Bass: E2 A2 E2 — halves, half
  { clef: 'bass', answer: 4, beamPairs: [], notes: [
    { pos: 0, duration: 'quarter' }, { pos: 3, duration: 'quarter' },
    { pos: 0, duration: 'half' },
  ]},

  // ── 5ths ──────────────────────────────────────────────────────────────
  // Treble: C4 G4 C4 — quarter, quarter, half
  { clef: 'treble', answer: 5, beamPairs: [], notes: [
    { pos: 0, duration: 'quarter' }, { pos: 4, duration: 'quarter' },
    { pos: 0, duration: 'half' },
  ]},
  // Treble: D4 A4 — halves
  { clef: 'treble', answer: 5, beamPairs: [], notes: [
    { pos: 1, duration: 'half' }, { pos: 5, duration: 'half' },
  ]},
  // Bass: C3 G3 C3 — quarters
  { clef: 'bass', answer: 5, beamPairs: [], notes: [
    { pos: 5, duration: 'quarter' }, { pos: 9, duration: 'quarter' },
    { pos: 5, duration: 'quarter' },
  ]},
  // Bass: G2 D3 G2 — halves, quarter
  { clef: 'bass', answer: 5, beamPairs: [], notes: [
    { pos: 2, duration: 'half' }, { pos: 6, duration: 'half' },
  ]},
]

// Shared rhythm-note dimensions — match every other Bravura notehead in the program.
const NH_FS    = 60   // notehead glyph size (same as BravuraNote whole-notes)
const NH_OFF   = 8    // half-notehead width (horizontal stem offset)
const STEM_LEN = 47   // standard stem length

// Render a quarter, half, or eighth note with stem. Eighths get a flag unless
// they're part of a beamed group (beams are drawn separately in PhraseStaff).
function RhythmNote({
  cx, cy, duration, stemUp, color = DARK, suppressFlag = false,
}: {
  cx: number; cy: number; duration: Duration; stemUp: boolean
  color?: string; suppressFlag?: boolean
}) {
  const isHollow = duration === 'half'
  const headGlyph = isHollow ? '\uE0A3' : '\uE0A4'   // half or quarter/eighth (black) head
  const stemX  = stemUp ? cx + NH_OFF : cx - NH_OFF
  const stemY2 = stemUp ? cy - STEM_LEN : cy + STEM_LEN
  return (
    <g>
      <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={NH_FS}
        fill={color} textAnchor="middle" dominantBaseline="central">{headGlyph}</text>
      <line x1={stemX} y1={cy} x2={stemX} y2={stemY2} stroke={color} strokeWidth={1.5} />
      {duration === 'eighth' && !suppressFlag && (
        <text x={stemX} y={stemY2} fontFamily="Bravura, serif" fontSize={NH_FS}
          fill={color} textAnchor="start" dominantBaseline="central">
          {stemUp ? '\uE240' : '\uE241'}
        </text>
      )}
    </g>
  )
}

function PhraseStaff({ item }: { item: Ex4Item }) {
  const posToY = item.clef === 'treble' ? posToY_T : posToY_B
  const N = item.notes.length
  const startX = sL + 70
  const endX   = sR - 12
  const span   = endX - startX
  const noteX  = (i: number) => startX + (i + 0.5) * (span / N)

  // Map eighth-note pair indices to their partner (for beam suppression of flags)
  const beamedSet = new Set<number>()
  for (const [a, b] of item.beamPairs) { beamedSet.add(a); beamedSet.add(b) }

  // Middle line (pos 6 in both clefs here — B4 / D3). Stem-up for pos < 6, else stem-down.
  const MID = 6
  const stemDir = (pos: number) => pos < MID

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
      style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
      <StaffBase />
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}

      {/* Beams — drawn before noteheads so heads sit above the bar */}
      {item.beamPairs.map(([a, b], i) => {
        const ax = noteX(a), bx = noteX(b)
        const ay = posToY(item.notes[a].pos), by = posToY(item.notes[b].pos)
        // Common stem direction for the pair based on the group's average pos
        const avg = (item.notes[a].pos + item.notes[b].pos) / 2
        const up = avg < MID
        const stemAx = up ? ax + NH_OFF : ax - NH_OFF
        const stemBx = up ? bx + NH_OFF : bx - NH_OFF
        // Beam bar y: flush with the farthest-from-head stem tip
        const beamY = up
          ? Math.min(ay, by) - STEM_LEN
          : Math.max(ay, by) + STEM_LEN
        return (
          <g key={`beam-${i}`}>
            <line x1={stemAx} y1={ay} x2={stemAx} y2={beamY}
              stroke={DARK} strokeWidth={1.5} />
            <line x1={stemBx} y1={by} x2={stemBx} y2={beamY}
              stroke={DARK} strokeWidth={1.5} />
            <rect x={stemAx - 0.75} y={beamY - 3} width={stemBx - stemAx + 1.5} height={6}
              fill={DARK} />
          </g>
        )
      })}

      {item.notes.map((n, i) => {
        const up = stemDir(n.pos)
        // For beamed eighths, omit stem + flag (drawn separately above) and render just the head
        const isBeamedEighth = beamedSet.has(i) && n.duration === 'eighth'
        if (isBeamedEighth) {
          return (
            <text key={i} x={noteX(i)} y={posToY(n.pos)}
              fontFamily="Bravura, serif" fontSize={NH_FS}
              fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE0A4'}</text>
          )
        }
        return <RhythmNote key={i} cx={noteX(i)} cy={posToY(n.pos)} duration={n.duration} stemUp={up} />
      })}
    </svg>
  )
}

function PhraseIntervalEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  // Draw a random subset each session so repeat play stays fresh.
  const SESSION_SIZE = 10
  const items = useMemo(() => shuffled(EX4_POOL).slice(0, SESSION_SIZE), [])
  const total = items.length

  const [idx,      setIdx]      = useState(0)
  const [chosen,   setChosen]   = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]

  function pick(n: number) {
    if (lockedRef.current || feedback !== null) return
    lockedRef.current = true
    const ok = n === item.answer
    if (ok) correctRef.current += 1
    setChosen(n)
    setFeedback({ ok })
    setTimeout(() => {
      if (idx + 1 >= total) { onDone(correctRef.current, total); return }
      setIdx(i => i + 1)
      setChosen(null); setFeedback(null); lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  const sizeLabel = (n: number) =>
    n === 2 ? '2nd' : n === 3 ? '3rd' : n === 4 ? '4th' : '5th'

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 4 — Identify the interval used
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — what interval connects the notes?
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <PhraseStaff item={item} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[2, 3, 4, 5].map(n => {
          const isChosen = chosen === n
          const isAnswer = n === item.answer
          let bg = 'white', border = '#DDD8CA', color = DARK
          if (feedback !== null) {
            if (isAnswer)              { bg = '#EAF3DE'; border = '#C0DD97'; color = CORRECT }
            else if (isChosen)         { bg = '#FDF3ED'; border = '#F0C4A8'; color = WRONG }
          }
          return (
            <button key={n} onClick={() => pick(n)}
              disabled={feedback !== null}
              style={{
                padding: '14px 0', borderRadius: 10, border: `1.5px solid ${border}`,
                background: bg, fontFamily: SERIF, fontSize: 22, fontWeight: 400,
                color, cursor: feedback !== null ? 'default' : 'pointer',
              }}>
              {sizeLabel(n)}
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && !feedback.ok && (
          <>Correct answer: <strong style={{ color: CORRECT }}>{sizeLabel(item.answer)}</strong></>
        )}
        {feedback !== null && feedback.ok && '✓ Correct'}
      </p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4']

export default function IntervalsLesson({
  passingScore,
  previouslyCompleted = false,
  onComplete,
}: {
  passingScore: number
  previouslyCompleted?: boolean
  onComplete: (score: number, total: number) => void
}) {
  const [phase,       setPhase]       = useState<Phase>('ex1')
  const [key,         setKey]         = useState(0)
  // When the lesson has been completed before, unlock full navigation so the
  // student can jump around on a replay without redoing earlier exercises.
  const [furthestIdx, setFurthestIdx] = useState(
    previouslyCompleted ? Math.max(0, PHASE_ORDER.length - 1) : 0
  )
  const phaseScoresRef = useRef<Map<Phase, { correct: number; total: number }>>(new Map())

  function goToPhase(p: Phase) {
    setPhase(p)
    setKey(k => k + 1)
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
      {phase === 'ex1' && <NameIntervalEx    key={key} onDone={scored} />}
      {phase === 'ex2' && <BuildIntervalEx   key={key} onDone={scored} />}
      {phase === 'ex3' && <ReadBuildEx       key={key} onDone={scored} />}
      {phase === 'ex4' && <PhraseIntervalEx  key={key} onDone={scored} />}
    </div>
  )
}
