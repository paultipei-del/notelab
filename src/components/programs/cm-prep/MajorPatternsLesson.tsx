'use client'

import { useState, useRef, useMemo } from 'react'
import { MAJOR_PATTERNS, triadFor, type MajorKey } from './visuals/PatternDiagrams'
import { PatternKeyboard } from './visuals/PatternDiagrams'

const F       = 'var(--font-jost), sans-serif'
const SERIF   = 'var(--font-cormorant), serif'
const DARK    = '#1A1A18'
const GREY    = '#7A7060'
const ACCENT  = '#2A5C0A'   // green — matches MAJ_C in PatternDiagrams
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'
const STROKE  = 1.3

// ── Staff geometry — same as every other CM Prep lesson ──────────────────────
const step = 8
const sL   = 32
const sR   = 360
const tTop = 54
const svgW = sR + 16          // 376
const svgH = tTop + 8 * step + 54  // 172

function posToY(pos: number)  { return tTop + (10 - pos) * step }
function lineY(n: number)     { return tTop + (5 - n) * 2 * step }

// ── Primitives ────────────────────────────────────────────────────────────────
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
function SharpGlyph({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx - 20} y={cy} fontFamily="Bravura, serif" fontSize={48}
      fill={color} textAnchor="middle" dominantBaseline="central">{'\uE262'}</text>
  )
}
function FlatGlyph({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx - 20} y={cy} fontFamily="Bravura, serif" fontSize={48}
      fill={color} textAnchor="middle" dominantBaseline="central">{'\uE260'}</text>
  )
}

// ── UI helpers ────────────────────────────────────────────────────────────────
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

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: F, fontSize: 12, color: '#7A7060', padding: '4px 0',
    }}>
      ← Back
    </button>
  )
}
function ForwardButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: F, fontSize: 12, color: '#7A7060', padding: '4px 0',
    }}>
      Forward →
    </button>
  )
}
function NavBar({ canBack, canForward, onBack, onForward }: {
  canBack: boolean; canForward: boolean
  onBack: () => void; onForward: () => void
}) {
  if (!canBack && !canForward) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
      {canBack && <BackButton onClick={onBack} />}
      {canForward && (
        <div style={{ marginLeft: 'auto' }}>
          <ForwardButton onClick={onForward} />
        </div>
      )}
    </div>
  )
}

// ── Ex 1: Is this a five-finger pattern? ─────────────────────────────────────
// A five-finger pattern = 5 *adjacent* staff positions (line-space-line-space-line
// or the reverse). Accidentals don't affect position — they just re-color a pitch.
interface PatternNote { pos: number; acc?: 'sharp' | 'flat' }
interface Ex1Item {
  clef: 'treble' | 'bass'
  notes: PatternNote[]   // 5 notes
  isFivePattern: boolean
}

const EX1_POOL: Ex1Item[] = [
  // Treble — pos 0 = C4, 1 = D4, 2 = E4 … 12 = A5
  // Valid 5-finger patterns (5 adjacent positions):
  { clef: 'treble', isFivePattern: true,
    notes: [{ pos: 0 }, { pos: 1 }, { pos: 2 }, { pos: 3 }, { pos: 4 }] },                             // C D E F G
  { clef: 'treble', isFivePattern: true,
    notes: [{ pos: 3 }, { pos: 4 }, { pos: 5 }, { pos: 6, acc: 'flat' }, { pos: 7 }] },                // F G A B♭ C
  { clef: 'treble', isFivePattern: true,
    notes: [{ pos: 4 }, { pos: 5 }, { pos: 6 }, { pos: 7 }, { pos: 8 }] },                             // G A B C D
  { clef: 'treble', isFivePattern: true,
    notes: [{ pos: 6 }, { pos: 7 }, { pos: 8 }, { pos: 9 }, { pos: 10, acc: 'sharp' }] },              // B C D E F♯

  // Invalid — skips between notes:
  { clef: 'treble', isFivePattern: false,
    notes: [{ pos: 0 }, { pos: 2 }, { pos: 4 }, { pos: 6 }, { pos: 8 }] },                             // C E G B D — all thirds
  { clef: 'treble', isFivePattern: false,
    notes: [{ pos: 2 }, { pos: 3 }, { pos: 4 }, { pos: 6 }, { pos: 7 }] },                             // E F G skip B C

  // Bass — pos 0 = E2, 2 = G2, 6 = D3, 8 = F3, 10 = A3, 12 = C4
  { clef: 'bass', isFivePattern: true,
    notes: [{ pos: 2 }, { pos: 3 }, { pos: 4 }, { pos: 5 }, { pos: 6 }] },                             // G A B C D
  { clef: 'bass', isFivePattern: true,
    notes: [{ pos: 6 }, { pos: 7 }, { pos: 8, acc: 'sharp' }, { pos: 9 }, { pos: 10 }] },              // D E F♯ G A
  { clef: 'bass', isFivePattern: false,
    notes: [{ pos: 1 }, { pos: 3 }, { pos: 5 }, { pos: 7 }, { pos: 9 }] },                             // stacked thirds
  { clef: 'bass', isFivePattern: false,
    notes: [{ pos: 5 }, { pos: 6 }, { pos: 8 }, { pos: 9 }, { pos: 11 }] },                            // two gaps
]

const EX1_NOTE_START = 90
const EX1_NOTE_SPAN  = 240

function Ex1Staff({ item }: { item: Ex1Item }) {
  const xs = Array.from({ length: 5 }, (_, i) => EX1_NOTE_START + (i + 0.5) * (EX1_NOTE_SPAN / 5))
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
      style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
      <StaffBase />
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}

      {item.notes.map((n, i) => {
        const cx = xs[i]
        const cy = posToY(n.pos)
        const ledgerTreble = item.clef === 'treble' && n.pos === 0
        const ledgerBass   = item.clef === 'bass'   && (n.pos === 0 || n.pos === 12)
        return (
          <g key={i}>
            {(ledgerTreble || ledgerBass) && <LedgerLine cx={cx} cy={cy} />}
            {n.acc === 'sharp' && <SharpGlyph cx={cx} cy={cy} />}
            {n.acc === 'flat'  && <FlatGlyph  cx={cx} cy={cy} />}
            <BravuraNote cx={cx} cy={cy} />
          </g>
        )
      })}
    </svg>
  )
}

function IdentifyPatternEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo(() => shuffled(EX1_POOL), [])
  const total = items.length

  const [idx,      setIdx]      = useState(0)
  const [chosen,   setChosen]   = useState<boolean | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]

  function pick(answer: boolean) {
    if (lockedRef.current || feedback !== null) return
    lockedRef.current = true
    const ok = answer === item.isFivePattern
    if (ok) correctRef.current += 1
    setChosen(answer)
    setFeedback({ ok })
    setTimeout(() => {
      if (idx + 1 >= total) { onDone(correctRef.current, total); return }
      setIdx(i => i + 1)
      setChosen(null); setFeedback(null); lockedRef.current = false
    }, ok ? 1000 : 1800)
  }

  const btnStyle = (answer: boolean): React.CSSProperties => {
    const isChosen = chosen === answer
    const isAnswer = answer === item.isFivePattern
    let bg = 'white', border = '#DDD8CA', color = DARK
    if (feedback !== null) {
      if (isAnswer)       { bg = '#EAF3DE'; border = '#C0DD97'; color = CORRECT }
      else if (isChosen)  { bg = '#FDF3ED'; border = '#F0C4A8'; color = WRONG }
    }
    return {
      padding: '14px 0', borderRadius: 10, border: `1.5px solid ${border}`,
      background: bg, fontFamily: SERIF, fontSize: 20, fontWeight: 400,
      color, cursor: feedback !== null ? 'default' : 'pointer',
    }
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 1 — Is this a five-finger pattern?
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — do these five notes form a
        five-finger pattern?
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <Ex1Staff item={item} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <button style={btnStyle(true)}  onClick={() => pick(true)}  disabled={feedback !== null}>Yes</button>
        <button style={btnStyle(false)} onClick={() => pick(false)} disabled={feedback !== null}>No</button>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && !feedback.ok && !item.isFivePattern && (
          <>Not a five-finger pattern — there&apos;s a skip between at least two notes.</>
        )}
        {feedback !== null && !feedback.ok && item.isFivePattern && (
          <>Actually yes — these five notes are on adjacent lines and spaces.</>
        )}
        {feedback !== null && feedback.ok && '✓ Correct'}
      </p>
    </div>
  )
}

// ── Shared letter-picker for Ex 2 / Ex 3 ─────────────────────────────────────
const KEYS: MajorKey[] = ['C', 'F', 'G', 'D']

function MatchEx({
  mode, exLabel, onDone,
}: {
  mode: 'pattern' | 'triad'
  exLabel: string
  onDone: (correct: number, total: number) => void
}) {
  // Two rounds of each key, shuffled → 8 items per session.
  const items = useMemo<MajorKey[]>(() => shuffled([...KEYS, ...KEYS]), [])
  const total = items.length

  const [idx,      setIdx]      = useState(0)
  const [chosen,   setChosen]   = useState<MajorKey | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const answer = items[idx]
  const pattern = mode === 'pattern'
    ? MAJOR_PATTERNS[answer].notes
    : triadFor(answer)
  const triadSet = new Set(triadFor(answer))

  function pick(k: MajorKey) {
    if (lockedRef.current || feedback !== null) return
    lockedRef.current = true
    const ok = k === answer
    if (ok) correctRef.current += 1
    setChosen(k)
    setFeedback({ ok })
    setTimeout(() => {
      if (idx + 1 >= total) { onDone(correctRef.current, total); return }
      setIdx(i => i + 1)
      setChosen(null); setFeedback(null); lockedRef.current = false
    }, ok ? 1000 : 1800)
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        {exLabel}
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '12px' }}>
        {mode === 'pattern'
          ? 'Which five-finger pattern is highlighted?'
          : 'Which major triad is highlighted?'}
      </p>

      <div style={{ marginBottom: 16 }}>
        <PatternKeyboard pattern={pattern} triadSet={triadSet} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {KEYS.map(k => {
          const isChosen = chosen === k
          const isAnswer = k === answer
          let bg = 'white', border = '#DDD8CA', color = DARK
          if (feedback !== null) {
            if (isAnswer)              { bg = '#EAF3DE'; border = '#C0DD97'; color = CORRECT }
            else if (isChosen)         { bg = '#FDF3ED'; border = '#F0C4A8'; color = WRONG }
          }
          return (
            <button key={k} onClick={() => pick(k)}
              disabled={feedback !== null}
              style={{
                padding: '14px 0', borderRadius: 10, border: `1.5px solid ${border}`,
                background: bg, fontFamily: SERIF, fontSize: 22, fontWeight: 400,
                color, cursor: feedback !== null ? 'default' : 'pointer',
              }}>
              {k} major
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && !feedback.ok && (
          <>Correct answer: <strong style={{ color: CORRECT }}>{answer} major</strong></>
        )}
        {feedback !== null && feedback.ok && '✓ Correct'}
      </p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3']

export default function MajorPatternsLesson({
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
      <NavBar canBack={canGoBack} canForward={canGoForward}
        onBack={back} onForward={forward} />
      {phase === 'ex1' && <IdentifyPatternEx key={key} onDone={scored} />}
      {phase === 'ex2' && <MatchEx key={key} mode="pattern"
        exLabel="Exercise 2 — Match the five-finger pattern"
        onDone={scored} />}
      {phase === 'ex3' && <MatchEx key={key} mode="triad"
        exLabel="Exercise 3 — Match the triad"
        onDone={scored} />}
    </div>
  )
}
