'use client'

import { useState, useRef, useMemo, useEffect } from 'react'

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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: F, fontSize: 12, color: '#7A7060',
      padding: '4px 0', marginBottom: 12,
    }}>
      ← Back to previous exercise
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
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
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
            padding: '6px 18px', fontFamily: F, fontSize: 14, fontWeight: 700, color: ACCENT }}>
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

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
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

// ── Root ──────────────────────────────────────────────────────────────────────
type Phase = 'ex1'
const PHASE_ORDER: Phase[] = ['ex1']

export default function IntervalsLesson({
  passingScore,
  onComplete,
}: {
  passingScore: number
  onComplete: (score: number, total: number) => void
}) {
  const [phase, setPhase] = useState<Phase>('ex1')
  const [key,   setKey]   = useState(0)
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
    goToPhase(PHASE_ORDER[idx + 1])
  }

  function back() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx > 0) {
      const prev = PHASE_ORDER[idx - 1]
      phaseScoresRef.current.delete(prev)
      goToPhase(prev)
    }
  }

  function scored(correct: number, total: number) {
    phaseScoresRef.current.set(phase, { correct, total })
    next()
  }

  const canGoBack = PHASE_ORDER.indexOf(phase) > 0

  return (
    <div>
      {canGoBack && <BackButton onClick={back} />}
      {phase === 'ex1' && <NameIntervalEx key={key} onDone={scored} />}
    </div>
  )
}
