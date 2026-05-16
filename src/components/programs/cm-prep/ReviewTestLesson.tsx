'use client'

// Full preparatory-level Review Test, modelled on the 2016 CM Piano Prep
// practice theory test. 22 question types covering every topic in the prep
// curriculum. Each question is presented in sequence; progress rolls into
// a final score at the end. This first pass covers Questions 1, 2, 9, 10,
// 11, 13, and 14 — the pure identification drills that fit a clean MC UX.
// Questions 3–8 (keyboard, patterns, triads) and 15–22 (music piece) are
// scheduled for follow-up rounds.

import { useMemo, useRef, useState, useEffect } from 'react'
import {
  MIXED_NOTE_POOL, type StaffNoteItem, shuffle,
} from '@/lib/programs/cm-prep/questions'
import {
  CompleteScaleEx, type Scale,
} from './ReviewLessons10to13Lesson'

const F       = 'var(--font-jost), sans-serif'
const SERIF   = 'var(--font-cormorant), serif'
const BRAVURA = 'Bravura, serif'
const DARK    = '#1A1A18'
const GREY    = '#7A7060'
const ACCENT  = '#BA7517'
const CORRECT = '#2d5a3e'
const WRONG   = '#a0381c'
const STROKE  = 1.3

// SMuFL / Bravura codepoints
const GLYPH = {
  brace:          '',
  trebleClef:     '𝄞',  // U+1D11E
  bassClef:       '𝄢',  // U+1D122
  noteheadWhole:  '',
  sharp:          '',
  flat:           '',
  noteWhole:      '',
  noteQuarterUp:  '',
  note8thUp:      '',
  restWhole:      '',
  restHalf:       '',
  restQuarter:    '',
  rest8th:        '',
}

// ── Grand-staff geometry (mirrors Lesson 10 KeySignaturesLesson so the
// Review Test's grand staff reads at the same scale as the rest of the
// preparatory lessons). ──────────────────────────────────────────────────
const step_G = 8                               // line-to-line = 16
const tTop_G = 28                              // top of treble staff
const GS_GAP = 42                              // fixed gap between staves
const bTop_G = tTop_G + 8 * step_G + GS_GAP    // 134
const gsW    = 376
const gsH    = bTop_G + 10 * step_G + 32       // room for E2 ledger + padding
const sL     = 32
const sR     = 360

function gsPosToY_T(pos: number) { return tTop_G + (10 - pos) * step_G }
function gsPosToY_B(pos: number) { return bTop_G + (10 - pos) * step_G }
function gsLineY_T(n: number)    { return tTop_G + (5 - n) * 2 * step_G }
function gsLineY_B(n: number)    { return bTop_G + (5 - n) * 2 * step_G }

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
      <line x1={sL} y1={tTop_G} x2={sL} y2={barBot} stroke={DARK} strokeWidth={1.6} />
      <line x1={sR} y1={tTop_G} x2={sR} y2={barBot} stroke={DARK} strokeWidth={STROKE} />
      {/* Clef sizes mirror Lesson 1's MissingStaff (fontSize 50 at gStep=6,
          which scales to 66 at step_G=8). */}
      <text x={sL - 10} y={tTop_G + braceH} fontFamily={BRAVURA} fontSize={braceH}
        fill={DARK} textAnchor="middle" dominantBaseline="auto">{GLYPH.brace}</text>
      <text x={sL + 5} y={tTop_G + 6 * step_G} fontFamily={BRAVURA} fontSize={66}
        fill={DARK} dominantBaseline="auto">{GLYPH.trebleClef}</text>
      <text x={sL + 5} y={bTop_G + 2 * step_G + 2} fontFamily={BRAVURA} fontSize={66}
        fill={DARK} dominantBaseline="auto">{GLYPH.bassClef}</text>
    </>
  )
}

function GsBravuraNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  // fontSize 58 keeps the StaffNoteQuiz grand-staff notehead ratio (~7.2·step)
  // so the note reads at the same visual weight as the other Prep lessons.
  return (
    <text x={cx} y={cy} fontFamily={BRAVURA} fontSize={58}
      fill={color} textAnchor="middle" dominantBaseline="central">{GLYPH.noteheadWhole}</text>
  )
}

function GsLedgerLine({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke={color} strokeWidth={1.8} />
}

// ── Shared UI primitives ──────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{children}</p>
  )
}

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
        textAlign: 'center', lineHeight: 1.4,
        cursor: locked ? 'default' : 'pointer',
      }}>{label}</button>
  )
}

function FeedbackLine({ feedback, rightAnswer }: {
  feedback: { ok: boolean } | null; rightAnswer: string
}) {
  return (
    <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
      color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
      {feedback !== null && feedback.ok && '✓ Correct'}
      {feedback !== null && !feedback.ok && (
        <>Correct answer: <strong style={{ color: CORRECT }}>{rightAnswer}</strong></>
      )}
    </p>
  )
}

// ── Q1 — Name the note (grand staff, 9 items) ────────────────────────────
function Q1_NoteNames({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo<StaffNoteItem[]>(() => shuffle([...MIXED_NOTE_POOL]).slice(0, 9), [])
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
    }, ok ? 1000 : 2000)
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (feedback || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toUpperCase()
      if (k.length === 1 && k >= 'A' && k <= 'G') pick(k)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [idx, feedback])   // eslint-disable-line react-hooks/exhaustive-deps

  const cx = gsW / 2
  const isTreble = item.clef === 'treble'
  const cy = isTreble ? gsPosToY_T(item.pos) : gsPosToY_B(item.pos)
  const isMiddleC = (isTreble && item.pos === 0) || (!isTreble && item.pos === 12)
  const isBassE2  = !isTreble && item.pos === 0

  return (
    <div>
      <SectionLabel>Question 1 · Name the note</SectionLabel>
      <ProgressBar done={idx} total={total} />

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12,
        padding: '8px 0', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${gsW} ${gsH}`} width="100%"
          style={{ maxWidth: gsW, display: 'block', margin: '0 auto' }}>
          <GrandStaffBase />
          {isMiddleC && <GsLedgerLine cx={cx} cy={isTreble ? gsPosToY_T(0) : gsPosToY_B(12)} />}
          {isBassE2  && <GsLedgerLine cx={cx} cy={gsPosToY_B(0)} />}
          <GsBravuraNote cx={cx} cy={cy} />
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 12 }}>
        {['A','B','C','D','E','F','G'].map(n => (
          <MCButton key={n} label={n}
            isPicked={feedback?.picked === n}
            isAnswer={n === item.answer}
            locked={feedback !== null}
            onClick={() => pick(n)} />
        ))}
      </div>

      <FeedbackLine feedback={feedback} rightAnswer={item.answer} />
    </div>
  )
}

// ── Q9 — Complete Major scales (reuses Review 10-13 component) ───────────
const Q9_SCALES: Scale[] = [
  { name: 'G Major',
    letters: ['G','A','B','C','D','E','F','G'],
    pos:      [4,5,6,7,8,9,10,11],
    expected: ['natural','natural','natural','natural','natural','natural','sharp','natural'] },
  { name: 'F Major',
    letters: ['F','G','A','B','C','D','E','F'],
    pos:      [3,4,5,6,7,8,9,10],
    expected: ['natural','natural','natural','flat','natural','natural','natural','natural'] },
]

function Q9_CompleteScales({ onDone }: { onDone: (correct: number, total: number) => void }) {
  return (
    <CompleteScaleEx
      onDone={onDone}
      scales={Q9_SCALES}
      title={'Question 9 · Add the correct ♯ or ♭ to make these Major scales'}
    />
  )
}

// ── Q10 — Name the key signature (3 items) ────────────────────────────────
interface KeySigQ { kind: 'none' | 'sharp' | 'flat'; answer: 'C Major' | 'G Major' | 'F Major' }
const Q10_ITEMS: KeySigQ[] = [
  { kind: 'flat',  answer: 'F Major' },
  { kind: 'none',  answer: 'C Major' },
  { kind: 'sharp', answer: 'G Major' },
]
const Q10_OPTIONS: KeySigQ['answer'][] = ['C Major', 'G Major', 'F Major']

function KeySigGrandStaff({ kind }: { kind: 'none' | 'sharp' | 'flat' }) {
  return (
    <svg viewBox={`0 0 ${gsW} ${gsH}`} width="100%"
      style={{ maxWidth: gsW, display: 'block', margin: '0 auto' }}>
      <GrandStaffBase />
      {kind === 'sharp' && (
        <>
          {/* F♯ placement matches KeySignaturesLesson: treble pos=10 (F5 top line),
              bass pos=8 (F3 line 4). Font size scaled for step_G=10. */}
          <text x={sL + 60} y={gsPosToY_T(10)} fontFamily={BRAVURA} fontSize={44}
            fill={DARK} textAnchor="middle" dominantBaseline="central">{GLYPH.sharp}</text>
          <text x={sL + 60} y={gsPosToY_B(8)} fontFamily={BRAVURA} fontSize={44}
            fill={DARK} textAnchor="middle" dominantBaseline="central">{GLYPH.sharp}</text>
        </>
      )}
      {kind === 'flat' && (
        <>
          {/* B♭ placement matches KeySignaturesLesson: treble pos=6 (B4 middle line),
              bass pos=4 (B2 line 2). */}
          <text x={sL + 60} y={gsPosToY_T(6)} fontFamily={BRAVURA} fontSize={44}
            fill={DARK} textAnchor="middle" dominantBaseline="central">{GLYPH.flat}</text>
          <text x={sL + 60} y={gsPosToY_B(4)} fontFamily={BRAVURA} fontSize={44}
            fill={DARK} textAnchor="middle" dominantBaseline="central">{GLYPH.flat}</text>
        </>
      )}
    </svg>
  )
}

function Q10_KeySigNames({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffle([...Q10_ITEMS]), [])
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
    }, ok ? 1100 : 2100)
  }

  return (
    <div>
      <SectionLabel>Question 10 · Check the correct name for each key signature</SectionLabel>
      <ProgressBar done={idx} total={total} />

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <KeySigGrandStaff kind={item.kind} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {Q10_OPTIONS.map(opt => (
          <MCButton key={opt} label={opt}
            isPicked={feedback?.picked === opt}
            isAnswer={opt === item.answer}
            locked={feedback !== null}
            onClick={() => pick(opt)} />
        ))}
      </div>

      <FeedbackLine feedback={feedback} rightAnswer={item.answer} />
    </div>
  )
}

// ── Q11 — Name each note or rest (4 items) ────────────────────────────────
// Renders a single rest/note on a 5-line staff so the student can tell
// whole-rest (hangs from line 4) apart from half-rest (sits on line 3) —
// with no staff context they look identical. Baseline matches the Lesson 12
// Ex 2 NoteOrRestGlyph pattern (alphabetic at the middle line).
function NoteRestCard({ glyph }: { glyph: string }) {
  const W     = 220
  const H     = 140
  const step  = 8                                  // half a staff space
  const midY  = H / 2
  const lineY = (n: number) => midY + (3 - n) * 2 * step
  const cx    = W / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%"
      style={{ maxWidth: 260, display: 'block', margin: '0 auto' }}>
      {[1,2,3,4,5].map(n => (
        <line key={n} x1={22} y1={lineY(n)} x2={W - 22} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
      <text x={cx} y={lineY(3)} fontFamily={BRAVURA} fontSize={66}
        fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">
        {glyph}
      </text>
    </svg>
  )
}

interface RhythmItemQ {
  glyph: string
  answer: string
  options: string[]
}
const Q11_ITEMS: RhythmItemQ[] = [
  { glyph: GLYPH.restWhole,   answer: 'whole rest',
    options: ['whole rest', 'half rest', 'quarter rest'] },
  { glyph: GLYPH.noteWhole,   answer: 'whole note',
    options: ['whole note', 'quarter note', 'half note'] },
  { glyph: GLYPH.note8thUp,   answer: 'eighth note',
    options: ['quarter note', 'half note', 'eighth note'] },
  { glyph: GLYPH.rest8th,     answer: 'eighth rest',
    options: ['half rest', 'eighth rest', 'whole rest'] },
]

function Q11_NoteRestNames({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffle([...Q11_ITEMS]), [])
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
    }, ok ? 1000 : 2000)
  }

  return (
    <div>
      <SectionLabel>Question 11 · Name each note or rest</SectionLabel>
      <ProgressBar done={idx} total={total} />

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12,
        padding: '18px 20px', marginBottom: 16, minHeight: 140,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <NoteRestCard glyph={item.glyph} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {item.options.map(opt => (
          <MCButton key={opt} label={opt}
            isPicked={feedback?.picked === opt}
            isAnswer={opt === item.answer}
            locked={feedback !== null}
            onClick={() => pick(opt)} />
        ))}
      </div>

      <FeedbackLine feedback={feedback} rightAnswer={item.answer} />
    </div>
  )
}

// ── Q13 — Meaning of each term or symbol (6 items) ────────────────────────
interface SymbolMeaningQ {
  prompt: string
  answer: string
  options: string[]
}
const Q13_ITEMS: SymbolMeaningQ[] = [
  { prompt: 'slur',     answer: 'play legato (smoothly connected)',
    options: ['play legato (smoothly connected)', 'tied notes'] },
  { prompt: 'dynamics', answer: 'symbols or terms that indicate loud or soft',
    options: ['symbols or terms that indicate loud or soft', 'symbols that indicate how long or short to play'] },
  { prompt: 'fermata',  answer: 'hold the note longer',
    options: ['staccato: crisp, not connected', 'hold the note longer'] },
  { prompt: 'accent',   answer: 'play the note louder',
    options: ['play the note louder', 'play smooth'] },
  { prompt: 'time signature', answer: 'tells how many beats per measure and which note gets one beat',
    options: ['tells how many beats per measure and which note gets one beat',
              'joins the treble and bass staves into a grand staff'] },
  { prompt: 'repeat sign', answer: 'play the music again',
    options: ['play the music again', 'gradually louder'] },
]

function Q13_Terms({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffle([...Q13_ITEMS]), [])
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
    }, ok ? 1100 : 2400)
  }

  return (
    <div>
      <SectionLabel>Question 13 · What does each term or symbol mean?</SectionLabel>
      <ProgressBar done={idx} total={total} />

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12,
        padding: '24px 20px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
        <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500,
          fontStyle: 'italic', color: DARK }}>{item.prompt}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {item.options.map(opt => (
          <MCButton key={opt} label={opt}
            isPicked={feedback?.picked === opt}
            isAnswer={opt === item.answer}
            locked={feedback !== null}
            onClick={() => pick(opt)} />
        ))}
      </div>

      <FeedbackLine feedback={feedback} rightAnswer={item.answer} />
    </div>
  )
}

// ── Q14 — Name each boxed part of the grand staff (4 items) ──────────────
interface BoxedPartQ { label: string; answer: string; options: string[] }
const Q14_ITEMS: BoxedPartQ[] = [
  { label: '(the curved sign at the far left joining the two staves)',
    answer: 'brace',    options: ['brace', 'bar line'] },
  { label: '(the clef sign on the top staff)',
    answer: 'treble clef', options: ['treble clef', 'bass clef'] },
  { label: '(the clef sign on the bottom staff)',
    answer: 'bass clef',   options: ['treble clef', 'bass clef'] },
  { label: '(the straight vertical line crossing both staves)',
    answer: 'bar line',    options: ['brace', 'bar line'] },
]

function Q14_BoxedParts({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffle([...Q14_ITEMS]), [])
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
    }, ok ? 1100 : 2200)
  }

  return (
    <div>
      <SectionLabel>Question 14 · Name each boxed part of the grand staff</SectionLabel>
      <ProgressBar done={idx} total={total} />

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12,
        padding: '12px 20px 4px', marginBottom: 16 }}>
        <svg viewBox={`0 0 ${gsW} ${gsH}`} width="100%"
          style={{ maxWidth: gsW, display: 'block', margin: '0 auto' }}>
          <GrandStaffBase />
          {/* Highlight box over the feature being asked about. Brace sits to
              the LEFT of the staff; bar line is the vertical stroke AT the
              staff's left edge (x=sL). */}
          {item.answer === 'brace' && (
            <rect x={sL - 24} y={tTop_G - 4} width={20} height={gsLineY_B(1) - tTop_G + 8}
              fill="none" stroke={ACCENT} strokeWidth={2} rx={3} />
          )}
          {item.answer === 'treble clef' && (
            // Bravura treble clef at fontSize=66 extends ~2 staff spaces above
            // line 5 and ~1 staff space below line 1 — the box has to reach
            // that far to engulf the full curl.
            <rect x={sL - 4} y={4}
              width={56} height={tTop_G + 8 * step_G + 20 - 4}
              fill="none" stroke={ACCENT} strokeWidth={2} rx={3} />
          )}
          {item.answer === 'bass clef' && (
            // Bass clef sits between bass line 4 and a bit below bass line 1,
            // plus the two dots either side of line 4.
            <rect x={sL - 4} y={bTop_G - 4}
              width={56} height={10 * step_G + 8}
              fill="none" stroke={ACCENT} strokeWidth={2} rx={3} />
          )}
          {item.answer === 'bar line' && (
            <>
              {/* Recolor the bar line itself (overlay on top of the dark one) */}
              <line x1={sL} y1={tTop_G} x2={sL} y2={gsLineY_B(1)}
                stroke={ACCENT} strokeWidth={2.2} />
              {/* Arrow pointing to the bar line from the upper LEFT */}
              <g>
                <line x1={sL - 30} y1={tTop_G - 14} x2={sL - 6} y2={tTop_G - 3}
                  stroke={ACCENT} strokeWidth={2} strokeLinecap="round" />
                <polygon
                  points={`${sL - 2},${tTop_G - 1} ${sL - 10},${tTop_G - 8} ${sL - 10},${tTop_G - 1}`}
                  fill={ACCENT} />
              </g>
            </>
          )}
        </svg>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: '4px 0 0', textAlign: 'center' }}>
          {item.label}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {item.options.map(opt => (
          <MCButton key={opt} label={opt}
            isPicked={feedback?.picked === opt}
            isAnswer={opt === item.answer}
            locked={feedback !== null}
            onClick={() => pick(opt)} />
        ))}
      </div>

      <FeedbackLine feedback={feedback} rightAnswer={item.answer} />
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
type Phase = 'q1' | 'q9' | 'q10' | 'q11' | 'q13' | 'q14'
const PHASE_ORDER: Phase[] = ['q1', 'q9', 'q10', 'q11', 'q13', 'q14']

export default function ReviewTestLesson({
  previouslyCompleted = false,
  onComplete,
}: {
  passingScore: number
  previouslyCompleted?: boolean
  onComplete: (score: number, total: number) => void
}) {
  const [phase, setPhase] = useState<Phase>('q1')
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
      {phase === 'q1'  && <Q1_NoteNames      key={keyN} onDone={scored} />}
      {phase === 'q9'  && <Q9_CompleteScales key={keyN} onDone={scored} />}
      {phase === 'q10' && <Q10_KeySigNames   key={keyN} onDone={scored} />}
      {phase === 'q11' && <Q11_NoteRestNames key={keyN} onDone={scored} />}
      {phase === 'q13' && <Q13_Terms         key={keyN} onDone={scored} />}
      {phase === 'q14' && <Q14_BoxedParts    key={keyN} onDone={scored} />}
    </div>
  )
}
