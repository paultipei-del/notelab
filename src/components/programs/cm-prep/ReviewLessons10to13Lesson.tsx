'use client'

import { useMemo, useRef, useState } from 'react'
import { NotationSymbol } from './visuals/NotationSymbols'
import { SIGN_CARDS } from './SignsTermsLesson'
import { WriteCountsEx, type RhythmItem } from './TimeSignaturesLesson'

const F       = 'var(--font-jost), sans-serif'
const SERIF   = 'var(--font-cormorant), serif'
const BRAVURA = 'Bravura, serif'
const DARK    = '#1A1A18'
const GREY    = '#7A7060'
const ACCENT  = '#BA7517'
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'

// Bravura glyphs (SMuFL codepoints)
const G_TREBLE   = ''
const G_QUARTER  = ''
const G_ACCENT   = ''   // accentAbove
const G_SHARP    = ''
const G_FLAT     = ''
const G_NATURAL  = ''
const TS_DIGIT: Record<string, string> = {
  '2': '', '3': '', '4': '',
}

function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

// ── Shared UI primitives ──────────────────────────────────────────────────
function ProgressBar({ done, total, color = ACCENT }: { done: number; total: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 4, background: '#EDE8DF', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: color,
          borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: F, fontSize: 11, color: '#B0ACA4', whiteSpace: 'nowrap' }}>
        {done + 1} / {total}
      </span>
    </div>
  )
}

function ExerciseLabel({ children }: { children: string }) {
  return (
    <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
      {children}
    </p>
  )
}

function MCButton({ label, isPicked, isAnswer, locked, onClick }: {
  label: string; isPicked: boolean; isAnswer: boolean; locked: boolean; onClick: () => void
}) {
  const bg     = locked && isAnswer ? CORRECT : locked && isPicked && !isAnswer ? WRONG : 'white'
  const color  = locked && (isAnswer || isPicked) ? 'white' : DARK
  const border = locked && isAnswer ? CORRECT : locked && isPicked && !isAnswer ? WRONG : '#D9CFAE'
  return (
    <button onClick={onClick} disabled={locked}
      style={{
        padding: '14px 16px', borderRadius: 10,
        border: `1.5px solid ${border}`, background: bg, color,
        fontFamily: F, fontSize: 15, fontWeight: 500,
        textAlign: 'left', lineHeight: 1.5,
        cursor: locked ? 'default' : 'pointer',
      }}>{label}</button>
  )
}

function FeedbackLine({ feedback, wrongContent }: {
  feedback: { ok: boolean } | null
  wrongContent: React.ReactNode
}) {
  return (
    <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
      color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
      {feedback !== null && feedback.ok && '✓ Correct'}
      {feedback !== null && !feedback.ok && wrongContent}
    </p>
  )
}

// ── Ex 1: Write the counts on 4-measure rhythms (2/4, 3/4, 4/4) ──────────
// Reuses Lesson 12's WriteCountsEx renderer with a review-specific pool of
// three 4-measure items — one per time signature.
const EX1_POOL: RhythmItem[] = [
  { ts: [2, 4], measures: [
    { notes: ['quarter', 'quarter'] },
    { notes: ['half'] },
    { notes: ['quarter', 'quarter'] },
    { notes: ['half'] },
  ]},
  { ts: [3, 4], measures: [
    { notes: ['quarter', 'quarter', 'quarter'] },
    { notes: ['half', 'quarter'] },
    { notes: ['quarter', 'half'] },
    { notes: ['dottedHalf'] },
  ]},
  { ts: [4, 4], measures: [
    { notes: ['quarter', 'quarter', 'quarter', 'quarter'] },
    { notes: ['half', 'half'] },
    { notes: ['quarter', 'quarter', 'half'] },
    { notes: ['whole'] },
  ]},
]

function CountsAccentsEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  return (
    <WriteCountsEx
      onDone={onDone}
      pool={EX1_POOL}
      title="Exercise 1 — Write the counts on each rhythm"
    />
  )
}

// ── Ex 2: Term → definition ───────────────────────────────────────────────
function MatchDefEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(SIGN_CARDS).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const options = useMemo(() => {
    const others = SIGN_CARDS.filter(c => c.id !== item.id).map(c => c.def)
    return shuffled([item.def, ...shuffled(others).slice(0, 3)])
  }, [item])

  function pick(opt: string) {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = opt === item.def
    if (ok) correctRef.current += 1
    setFeedback({ ok, picked: opt })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1); setFeedback(null); lockedRef.current = false
      } else { setFeedback(null); lockedRef.current = false }
    }, ok ? 1200 : 2400)
  }

  return (
    <div>
      <ExerciseLabel>Exercise 2 — Match the sign with its definition</ExerciseLabel>
      <ProgressBar done={idx} total={total} />

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 14,
        padding: '18px 20px 12px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 120, marginBottom: 4 }}>
          <NotationSymbol cardId={item.id} />
        </div>
        <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500,
          color: DARK, textAlign: 'center', margin: '0 0 2px' }}>{item.term}</p>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: '0 0 10px', textAlign: 'center' }}>
        Which definition matches this sign or term?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {options.map(opt => <MCButton key={opt} label={opt} isPicked={feedback?.picked === opt}
          isAnswer={opt === item.def} locked={feedback !== null} onClick={() => pick(opt)} />)}
      </div>

      <FeedbackLine feedback={feedback}
        wrongContent={<><strong style={{ color: CORRECT }}>{item.term}</strong> means:{' '}
          <strong style={{ color: CORRECT }}>{item.def}</strong></>} />
    </div>
  )
}

// ── Ex 3: Complete the scales ─────────────────────────────────────────────
// For each of C / F / G major, show the eight natural notes on the treble
// staff and let the student cycle each note's accidental (natural → ♯ → ♭ → …)
// by tapping. Scale pos is "letter index from C4": C4=0, D4=1, … G5=11.
type AccType = 'natural' | 'sharp' | 'flat'

export interface Scale {
  name:     string
  letters:  string[]       // 8 letters
  pos:      number[]       // 8 staff positions
  expected: AccType[]      // expected accidental per note
}

export const SCALES: Scale[] = [
  { name: 'C major',
    letters: ['C','D','E','F','G','A','B','C'],
    pos:      [0,1,2,3,4,5,6,7],
    expected: ['natural','natural','natural','natural','natural','natural','natural','natural'] },
  { name: 'F major',
    letters: ['F','G','A','B','C','D','E','F'],
    pos:      [3,4,5,6,7,8,9,10],
    expected: ['natural','natural','natural','flat','natural','natural','natural','natural'] },
  { name: 'G major',
    letters: ['G','A','B','C','D','E','F','G'],
    pos:      [4,5,6,7,8,9,10,11],
    expected: ['natural','natural','natural','natural','natural','natural','sharp','natural'] },
]

export function CompleteScaleEx({ onDone, scales = SCALES, title = 'Exercise 3 — Complete each scale by adding sharps or flats' }: { onDone: (correct: number, total: number) => void; scales?: Scale[]; title?: string }) {
  // State: one array of 8 AccType per scale.
  const [accs,      setAccs]      = useState<AccType[][]>(
    () => scales.map(s => s.letters.map((): AccType => 'natural'))
  )
  const [submitted, setSubmitted] = useState(false)

  function cycle(scaleIdx: number, noteIdx: number) {
    if (submitted) return
    setAccs(prev => prev.map((row, i) =>
      i !== scaleIdx ? row
        : row.map((a, j) => {
            if (j !== noteIdx) return a
            if (a === 'natural') return 'sharp'
            if (a === 'sharp')   return 'flat'
            return 'natural'
          })
    ))
  }

  function submit() {
    setSubmitted(true)
    let correct = 0
    let total   = 0
    for (let s = 0; s < scales.length; s++) {
      for (let i = 0; i < scales[s].expected.length; i++) {
        total += 1
        if (accs[s][i] === scales[s].expected[i]) correct += 1
      }
    }
    setTimeout(() => onDone(correct, total), 1600)
  }

  return (
    <div>
      <ExerciseLabel>{title}</ExerciseLabel>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, lineHeight: 1.6, margin: '0 0 18px' }}>
        Tap a note to cycle through <strong>natural → sharp → flat → natural</strong>. Some scales
        need no changes.
      </p>

      {scales.map((scale, si) => (
        <ScaleRow key={scale.name}
          scale={scale}
          accs={accs[si]}
          submitted={submitted}
          onCycle={i => cycle(si, i)}
        />
      ))}

      {!submitted ? (
        <button onClick={submit}
          style={{ background: DARK, color: 'white', border: 'none', borderRadius: 10,
            padding: '12px 28px', fontFamily: F, fontSize: 14, cursor: 'pointer', marginTop: 6 }}>
          Check answers
        </button>
      ) : (
        <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: '6px 0 0' }}>
          Moving on…
        </p>
      )}
    </div>
  )
}

function ScaleRow({ scale, accs, submitted, onCycle }: {
  scale: Scale
  accs:  AccType[]
  submitted: boolean
  onCycle: (i: number) => void
}) {
  // Match MajorScalesLesson's proportions: step=8, clef fontSize=62,
  // noteheadWhole at fontSize=60, accidentals at 48.
  const W       = 620
  const H       = 200
  const step    = 8                               // half staff space
  const TOP_Y   = 46                              // y of line 5 (F5)
  const LINE_Y  = (n: number) => TOP_Y + (5 - n) * 2 * step
  const POS_Y   = (pos: number) => TOP_Y + (10 - pos) * step
  const STAFF_L = 20
  const STAFF_R = W - 20
  // Leave a margin after the clef and before the final bar line so notes
  // sit squarely inside the measure rather than brushing the bar.
  const START_X = 108
  const END_X   = STAFF_R - 28
  const cxFor   = (i: number) => START_X + ((END_X - START_X) / 7) * i
  const accGlyph = (a: AccType) => a === 'sharp' ? G_SHARP : a === 'flat' ? G_FLAT : ''

  return (
    <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
      padding: '10px 12px 12px', marginBottom: 14 }}>
      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: DARK,
        margin: '0 0 4px', textAlign: 'center' }}>{scale.name}</p>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
        {/* Staff */}
        {[1,2,3,4,5].map(n => (
          <line key={n} x1={STAFF_L} y1={LINE_Y(n)} x2={STAFF_R} y2={LINE_Y(n)}
            stroke={DARK} strokeWidth={1.2} />
        ))}

        {/* Clef */}
        <text x={STAFF_L + 6} y={LINE_Y(2)} fontFamily={BRAVURA} fontSize={62}
          fill={DARK} dominantBaseline="auto">{G_TREBLE}</text>

        {/* Final bar line */}
        <line x1={STAFF_R} y1={LINE_Y(5)} x2={STAFF_R} y2={LINE_Y(1)}
          stroke={DARK} strokeWidth={2} />

        {/* Notes */}
        {scale.letters.map((letter, i) => {
          const cx  = cxFor(i)
          const cy  = POS_Y(scale.pos[i])
          const acc = accs[i]
          const exp = scale.expected[i]
          const ok  = acc === exp
          const noteTint = !submitted ? DARK : ok ? CORRECT : WRONG
          const needsLedger = scale.pos[i] === 0 || scale.pos[i] <= -1  // C4 ledger below

          return (
            <g key={i}>
              {/* Ledger line for C4 */}
              {needsLedger && (
                <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy}
                  stroke={DARK} strokeWidth={1.3} />
              )}
              {/* Accidental glyph */}
              {acc !== 'natural' && (
                <text x={cx - 20} y={cy} fontFamily={BRAVURA} fontSize={48}
                  fill={noteTint} textAnchor="middle" dominantBaseline="central">
                  {accGlyph(acc)}
                </text>
              )}
              {/* Whole-note head (unstemmed — SMuFL noteheadWhole) */}
              <text x={cx} y={cy} fontFamily={BRAVURA} fontSize={60}
                fill={noteTint} textAnchor="middle" dominantBaseline="central">
                {''}
              </text>
              {/* Tap target — slightly bigger than the notehead */}
              <rect x={cx - 18} y={cy - 14} width={36} height={28}
                fill="transparent"
                style={{ cursor: submitted ? 'default' : 'pointer' }}
                onClick={() => onCycle(i)}
              />
              {/* Letter name below — updates live with the student's accidental.
                  C major sits lower because its first note (C4) hangs below
                  the staff on a ledger line, so the label needs to clear it. */}
              <text x={cx} y={LINE_Y(1) + (scale.name === 'C major' ? 38 : 36)}
                fontFamily={F} fontSize={14}
                fontWeight={600} fill={submitted && !ok ? WRONG : GREY}
                textAnchor="middle">
                {letter}{acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : ''}
              </text>
              {/* Post-submit hint */}
              {submitted && !ok && exp !== 'natural' && (
                <text x={cx} y={LINE_Y(1) + 54} fontFamily={F} fontSize={12}
                  fill={CORRECT} textAnchor="middle">
                  {exp === 'sharp' ? '♯' : '♭'}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Ex 4: Key signature → key name ───────────────────────────────────────
interface KeySigItem {
  kind:   'none' | 'sharp' | 'flat'
  answer: 'C major' | 'F major' | 'G major'
}
const KEY_SIG_ITEMS: KeySigItem[] = [
  { kind: 'none',  answer: 'C major' },
  { kind: 'flat',  answer: 'F major' },
  { kind: 'sharp', answer: 'G major' },
]
const KEY_SIG_OPTIONS: KeySigItem['answer'][] = ['C major', 'F major', 'G major']

function KeySigIdEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(KEY_SIG_ITEMS), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]

  function pick(opt: string) {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = opt === item.answer
    if (ok) correctRef.current += 1
    setFeedback({ ok, picked: opt })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1); setFeedback(null); lockedRef.current = false
      } else { setFeedback(null); lockedRef.current = false }
    }, ok ? 1200 : 2400)
  }

  return (
    <div>
      <ExerciseLabel>Exercise 4 — Name the key from its key signature</ExerciseLabel>
      <ProgressBar done={idx} total={total} />

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 14,
        padding: '18px 20px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130 }}>
        <KeySigStaff kind={item.kind} />
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: '0 0 10px', textAlign: 'center' }}>
        Which major key uses this key signature?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {KEY_SIG_OPTIONS.map(opt => <MCButton key={opt} label={opt} isPicked={feedback?.picked === opt}
          isAnswer={opt === item.answer} locked={feedback !== null} onClick={() => pick(opt)} />)}
      </div>

      <FeedbackLine feedback={feedback}
        wrongContent={<>This is <strong style={{ color: CORRECT }}>{item.answer}</strong></>} />
    </div>
  )
}

function KeySigStaff({ kind }: { kind: 'none' | 'sharp' | 'flat' }) {
  const W = 260
  const H = 110
  const step   = 6
  const TOP_Y  = 30
  const LINE_Y = (n: number) => TOP_Y + (5 - n) * 2 * step
  const POS_Y  = (pos: number) => TOP_Y + (10 - pos) * step
  // F♯ sits on line 5 (pos=10). B♭ sits on line 3 (pos=6).
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
      {[1,2,3,4,5].map(n => (
        <line key={n} x1={16} y1={LINE_Y(n)} x2={W - 16} y2={LINE_Y(n)}
          stroke={DARK} strokeWidth={1.1} />
      ))}
      <text x={22} y={LINE_Y(2)} fontFamily={BRAVURA} fontSize={50}
        fill={DARK} dominantBaseline="auto">{G_TREBLE}</text>
      {kind === 'sharp' && (
        <text x={80} y={POS_Y(10)} fontFamily={BRAVURA} fontSize={36}
          fill={DARK} textAnchor="middle" dominantBaseline="central">{G_SHARP}</text>
      )}
      {kind === 'flat' && (
        <text x={80} y={POS_Y(6)} fontFamily={BRAVURA} fontSize={36}
          fill={DARK} textAnchor="middle" dominantBaseline="central">{G_FLAT}</text>
      )}
    </svg>
  )
}

// ── Ex 5: Symbol → term ───────────────────────────────────────────────────
function IdentifySymbolEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(SIGN_CARDS).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const options = useMemo(() => {
    const others = SIGN_CARDS.filter(c => c.id !== item.id).map(c => c.term)
    return shuffled([item.term, ...shuffled(others).slice(0, 3)])
  }, [item])

  function pick(opt: string) {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = opt === item.term
    if (ok) correctRef.current += 1
    setFeedback({ ok, picked: opt })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1); setFeedback(null); lockedRef.current = false
      } else { setFeedback(null); lockedRef.current = false }
    }, ok ? 1100 : 2200)
  }

  return (
    <div>
      <ExerciseLabel>Exercise 5 — Identify the sign</ExerciseLabel>
      <ProgressBar done={idx} total={total} />

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 14,
        padding: '22px 20px', marginBottom: 14, minHeight: 140,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <NotationSymbol cardId={item.id} />
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: '0 0 10px', textAlign: 'center' }}>
        What is this sign or term called?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        {options.map(opt => <MCButton key={opt} label={opt} isPicked={feedback?.picked === opt}
          isAnswer={opt === item.term} locked={feedback !== null} onClick={() => pick(opt)} />)}
      </div>

      <FeedbackLine feedback={feedback}
        wrongContent={<>This is <strong style={{ color: CORRECT }}>{item.term}</strong></>} />
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4' | 'ex5'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5']

export default function ReviewLessons10to13Lesson({
  previouslyCompleted = false,
  onComplete,
}: {
  passingScore: number
  previouslyCompleted?: boolean
  onComplete: (score: number, total: number) => void
}) {
  const [phase, setPhase] = useState<Phase>('ex1')
  const [keyN,  setKeyN]  = useState(0)
  const phaseScoresRef = useRef<Map<Phase, { correct: number; total: number }>>(new Map())

  void previouslyCompleted

  function next() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx + 1 >= PHASE_ORDER.length) {
      let correct = 0, total = 0
      for (const v of phaseScoresRef.current.values()) { correct += v.correct; total += v.total }
      onComplete(total > 0 ? correct / total : 1, total)
      return
    }
    setPhase(PHASE_ORDER[idx + 1])
    setKeyN(k => k + 1)
  }

  function scored(correct: number, total: number) {
    phaseScoresRef.current.set(phase, { correct, total })
    next()
  }

  return (
    <div>
      {phase === 'ex1' && <CountsAccentsEx   key={keyN} onDone={scored} />}
      {phase === 'ex2' && <MatchDefEx        key={keyN} onDone={scored} />}
      {phase === 'ex3' && <CompleteScaleEx   key={keyN} onDone={scored} />}
      {phase === 'ex4' && <KeySigIdEx        key={keyN} onDone={scored} />}
      {phase === 'ex5' && <IdentifySymbolEx  key={keyN} onDone={scored} />}
    </div>
  )
}
