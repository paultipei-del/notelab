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

// ── Ex 4: Build the pattern + triad on the keyboard ─────────────────────────
// Two sub-steps per item: (1) tap the 5 pattern keys, Confirm. (2) tap the 3
// triad keys, Confirm. Clicked keys toggle; both sub-steps auto-advance after
// feedback.
type Ex4SubStep = 'pattern' | 'triad'

function BuildKeyboardEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo<MajorKey[]>(() => shuffled(['C', 'F', 'G', 'D']), [])
  const total = items.length
  const totalSteps = total * 2   // pattern + triad per item

  const [idx,             setIdx]             = useState(0)
  const [subStep,         setSubStep]         = useState<Ex4SubStep>('pattern')
  const [selectedPattern, setSelectedPattern] = useState<Set<number>>(new Set())
  const [selectedTriad,   setSelectedTriad]   = useState<Set<number>>(new Set())
  const [feedback, setFeedback] = useState<{ step: Ex4SubStep; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const key = items[idx]
  const correctPattern = new Set(MAJOR_PATTERNS[key].notes)
  const correctTriad   = new Set(triadFor(key))

  // Chromatic keys "already committed" from earlier sub-step — pattern pieces stay
  // visible while the student builds the triad.
  const committedPattern = subStep === 'triad' ? correctPattern : selectedPattern

  function toggleKey(c: number) {
    if (feedback !== null || lockedRef.current) return
    if (subStep === 'pattern') {
      setSelectedPattern(prev => {
        const next = new Set(prev)
        if (next.has(c)) next.delete(c); else next.add(c)
        return next
      })
    } else {
      // Triad step — only toggle keys that are part of the committed pattern
      if (!correctPattern.has(c)) return
      setSelectedTriad(prev => {
        const next = new Set(prev)
        if (next.has(c)) next.delete(c); else next.add(c)
        return next
      })
    }
  }

  function setsEqual(a: Set<number>, b: Set<number>) {
    if (a.size !== b.size) return false
    for (const x of a) if (!b.has(x)) return false
    return true
  }

  function checkPattern() {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = setsEqual(selectedPattern, correctPattern)
    if (ok) correctRef.current += 1
    setFeedback({ step: 'pattern', ok })
    setTimeout(() => {
      if (ok) {
        // Keep the correct pattern lit, move to triad sub-step.
        setSubStep('triad'); setFeedback(null); lockedRef.current = false
      } else {
        // Reset pattern and let student retry (count this attempt as wrong).
        setSelectedPattern(new Set()); setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1100 : 2000)
  }

  function checkTriad() {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = setsEqual(selectedTriad, correctTriad)
    if (ok) correctRef.current += 1
    setFeedback({ step: 'triad', ok })
    setTimeout(() => {
      if (ok) {
        // Advance to next item.
        if (idx + 1 >= total) { onDone(correctRef.current, totalSteps); return }
        setIdx(i => i + 1)
        setSubStep('pattern')
        setSelectedPattern(new Set())
        setSelectedTriad(new Set())
        setFeedback(null); lockedRef.current = false
      } else {
        setSelectedTriad(new Set()); setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1100 : 2000)
  }

  // Which keys to light as "pattern" (green) vs "triad" (amber)
  // Pattern sub-step:  show selectedPattern as green, no triad highlight
  // Triad sub-step:    show committedPattern (all 5 correct keys) green,
  //                    plus selectedTriad keys amber (override green for those)
  const patternArr = subStep === 'pattern'
    ? Array.from(selectedPattern)
    : Array.from(correctPattern)
  const triadArr = subStep === 'triad' ? selectedTriad : new Set<number>()

  const confirmReady = subStep === 'pattern'
    ? selectedPattern.size === 5
    : selectedTriad.size === 3
  const onConfirm = subStep === 'pattern' ? checkPattern : checkTriad

  const sizeLabel = (n: number) => n === 5 ? 'five-finger pattern' : 'triad'

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 4 — Build the pattern and triad
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '10px' }}>
        {subStep === 'pattern'
          ? <>Tap the <strong style={{ color: ACCENT }}>5 keys</strong> of the{' '}
              <strong style={{ color: ACCENT }}>{key} major</strong> five-finger pattern</>
          : <>Now tap the <strong style={{ color: '#BA7517' }}>3 keys</strong> that form the{' '}
              <strong style={{ color: '#BA7517' }}>{key} major triad</strong></>}
      </p>

      <div style={{ marginBottom: 14 }}>
        <PatternKeyboard pattern={patternArr} triadSet={triadArr as Set<number>}
          onKeyClick={toggleKey} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <button onClick={onConfirm}
          disabled={!confirmReady || feedback !== null}
          style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 14, fontWeight: 600,
            cursor: !confirmReady || feedback !== null ? 'default' : 'pointer',
            background: !confirmReady || feedback !== null ? '#EDE8DF' : DARK,
            color: !confirmReady || feedback !== null ? '#B0ACA4' : 'white',
          }}>
          Check {sizeLabel(subStep === 'pattern' ? 5 : 3)}
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok  && '✓ Correct'}
        {feedback !== null && !feedback.ok && (
          <>Not quite — take another look and try again.</>
        )}
      </p>
    </div>
  )
}

// ── Ex 5: Place the triad on the staff ──────────────────────────────────────
// Grand staff, student taps 3 positions that form the target triad.
// Positions stack at the same x; accidentals (D major F♯) auto-render when the
// position lines up with the correct natural pitch that needs the sharp.
// Treble pos: 0 = C4 … 7 = C5 … 12 = A5
// Bass pos:   0 = E2 …            12 = C4

interface TriadTarget {
  clef: 'treble' | 'bass'
  rootKey: MajorKey
  positions: number[]       // 3 staff positions, ascending
  accidentalPos?: number    // pos that gets a sharp (F♯ for D major)
}

const EX5_POOL: TriadTarget[] = [
  // C major triad: C E G
  { clef: 'treble', rootKey: 'C', positions: [0, 2, 4] },                   // C4 E4 G4
  { clef: 'bass',   rootKey: 'C', positions: [5, 7, 9] },                   // C3 E3 G3

  // F major triad: F A C
  { clef: 'treble', rootKey: 'F', positions: [3, 5, 7] },                   // F4 A4 C5
  { clef: 'bass',   rootKey: 'F', positions: [1, 3, 5] },                   // F2 A2 C3

  // G major triad: G B D
  { clef: 'treble', rootKey: 'G', positions: [4, 6, 8] },                   // G4 B4 D5
  { clef: 'bass',   rootKey: 'G', positions: [2, 4, 6] },                   // G2 B2 D3

  // D major triad: D F♯ A — sharp on the middle note
  { clef: 'treble', rootKey: 'D', positions: [1, 3, 5], accidentalPos: 3 }, // D4 F♯4 A4
  { clef: 'bass',   rootKey: 'D', positions: [6, 8, 10], accidentalPos: 8 }, // D3 F♯3 A3
]

const EX5_NOTE_X = 190   // all 3 noteheads stack at this x

function PlaceTriadEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo(() => shuffled(EX5_POOL).slice(0, 6), [])
  const total = items.length

  const [idx,       setIdx]       = useState(0)
  const [staged,    setStaged]    = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  const svgRef     = useRef<SVGSVGElement | null>(null)

  const item = items[idx]
  const target = new Set(item.positions)

  function clientToPos(clientY: number): number {
    const svg = svgRef.current
    if (!svg) return 0
    const r = svg.getBoundingClientRect()
    const sy = (clientY - r.top) / r.height * svgH
    let pos = Math.round(10 - (sy - tTop) / step)
    if (pos < 0) pos = 0
    if (pos > 12) pos = 12
    return pos
  }

  function onStaffClick(e: React.MouseEvent<SVGSVGElement>) {
    if (submitted || lockedRef.current) return
    if (!svgRef.current) svgRef.current = e.currentTarget
    const pos = clientToPos(e.clientY)
    setStaged(prev => {
      // toggle: click an already-selected pos to remove it, else add (cap at 3)
      if (prev.includes(pos)) return prev.filter(p => p !== pos)
      if (prev.length >= 3) return prev
      return [...prev, pos]
    })
  }

  function onConfirm() {
    if (submitted || lockedRef.current || staged.length !== 3) return
    lockedRef.current = true
    const stagedSet = new Set(staged)
    const ok = stagedSet.size === target.size &&
      [...target].every(p => stagedSet.has(p))
    if (ok) correctRef.current += 1
    setSubmitted(true); setIsCorrect(ok)
    setTimeout(() => {
      if (idx + 1 >= total) { onDone(correctRef.current, total); return }
      setIdx(i => i + 1)
      setStaged([]); setSubmitted(false); setIsCorrect(false)
      lockedRef.current = false
    }, ok ? 1200 : 2200)
  }

  // The visual should stack the triad at the same x; draw ledger lines when needed.
  const renderNote = (pos: number, color: string, opacity = 1) => {
    const cy = posToY(pos)
    const showLedgerTreble = item.clef === 'treble' && pos === 0
    const showLedgerBass   = item.clef === 'bass'   && (pos === 0 || pos === 12)
    return (
      <g key={pos} opacity={opacity}>
        {(showLedgerTreble || showLedgerBass) &&
          <LedgerLine cx={EX5_NOTE_X} cy={cy} color={color} />}
        {item.accidentalPos === pos &&
          <SharpGlyph cx={EX5_NOTE_X} cy={cy} color={color} />}
        <BravuraNote cx={EX5_NOTE_X} cy={cy} color={color} />
      </g>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 5 — Place the triad
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '10px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — place the{' '}
        <strong style={{ color: ACCENT }}>{item.rootKey} major triad</strong>
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 14 }}>
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

          {/* Staged ghost noteheads */}
          {!submitted && staged.map(pos => renderNote(pos, ACCENT, 0.55))}

          {/* Committed result */}
          {submitted && staged.map(pos => renderNote(pos, isCorrect ? CORRECT : WRONG))}

          {/* Correct hint overlay on wrong answer */}
          {submitted && !isCorrect && item.positions.map(pos =>
            <g key={`hint-${pos}`} opacity={0.45}>{renderNote(pos, CORRECT, 1)}</g>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <button onClick={onConfirm}
          disabled={submitted || staged.length !== 3}
          style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 14, fontWeight: 600,
            cursor: submitted || staged.length !== 3 ? 'default' : 'pointer',
            background: submitted || staged.length !== 3 ? '#EDE8DF' : DARK,
            color: submitted || staged.length !== 3 ? '#B0ACA4' : 'white',
          }}>
          Check ({staged.length}/3)
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: !submitted ? '#B0ACA4' : isCorrect ? CORRECT : WRONG }}>
        {submitted && isCorrect && '✓ Correct'}
        {submitted && !isCorrect && (
          <>Correct triad shown in green — tap again on the next one.</>
        )}
      </p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4' | 'ex5'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5']

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
      {phase === 'ex4' && <BuildKeyboardEx key={key} onDone={scored} />}
      {phase === 'ex5' && <PlaceTriadEx    key={key} onDone={scored} />}
    </div>
  )
}
