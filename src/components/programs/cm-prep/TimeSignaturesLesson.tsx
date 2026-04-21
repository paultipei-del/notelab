'use client'

import { useState, useRef, useMemo } from 'react'

const F       = 'var(--font-jost), sans-serif'
const DARK    = '#1A1A18'
const GREY    = '#B0ACA4'
const ACCENT  = '#BA7517'
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'
const STROKE  = 1.3

// ── Bravura note / rest glyphs ────────────────────────────────────────────
// SMuFL pre-composed note glyphs (notehead + stem + flag where applicable)
const NOTE_GLYPH: Record<'whole' | 'half' | 'quarter' | 'eighth', string> = {
  whole:   '\uE1D2',   // noteWhole
  half:    '\uE1D3',   // noteHalfUp
  quarter: '\uE1D5',   // noteQuarterUp
  eighth:  '\uE1D7',   // note8thUp
}
const AUG_DOT = '\uE1E7'

const REST_GLYPH: Record<'whole' | 'half' | 'quarter' | 'eighth', string> = {
  whole:   '\uE4E3',
  half:    '\uE4E4',
  quarter: '\uE4E5',
  eighth:  '\uE4E6',
}

function NoteBravura({ cx, cy, kind, color = DARK, fontSize = 40 }:
  { cx: number; cy: number; kind: 'whole' | 'half' | 'quarter' | 'eighth' | 'dottedHalf';
    color?: string; fontSize?: number }) {
  const base = kind === 'dottedHalf' ? NOTE_GLYPH.half : NOTE_GLYPH[kind]
  return (
    <>
      <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={fontSize}
        fill={color} textAnchor="middle" dominantBaseline="alphabetic">{base}</text>
      {kind === 'dottedHalf' && (
        <text x={cx + fontSize * 0.4} y={cy} fontFamily="Bravura, serif" fontSize={fontSize}
          fill={color} textAnchor="middle" dominantBaseline="alphabetic">{AUG_DOT}</text>
      )}
    </>
  )
}

function RestBravura({ cx, cy, kind, color = DARK, fontSize = 40 }:
  { cx: number; cy: number; kind: 'whole' | 'half' | 'quarter' | 'eighth';
    color?: string; fontSize?: number }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={fontSize}
      fill={color} textAnchor="middle" dominantBaseline="alphabetic">{REST_GLYPH[kind]}</text>
  )
}

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

function NavBar({ canBack, canForward, onBack, onForward }: {
  canBack: boolean; canForward: boolean
  onBack: () => void; onForward: () => void
}) {
  if (!canBack && !canForward) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
      {canBack && (
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: F, fontSize: 12, color: '#7A7060', padding: '4px 0',
        }}>← Back</button>
      )}
      {canForward && (
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onForward} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: F, fontSize: 12, color: '#7A7060', padding: '4px 0',
          }}>Forward →</button>
        </div>
      )}
    </div>
  )
}

// ── Ex 2: How many beats does this note/rest receive? ─────────────────────
type Duration = 'whole' | 'dottedHalf' | 'half' | 'quarter' | 'eighth'

interface Ex2Item {
  kind: 'note' | 'rest'
  duration: Duration
  beats: '½ beat' | '1 beat' | '2 beats' | '3 beats' | '4 beats'
  label: string           // spoken name, used in feedback
}

const EX2_POOL: Ex2Item[] = [
  { kind: 'note', duration: 'whole',      beats: '4 beats', label: 'whole note' },
  { kind: 'note', duration: 'dottedHalf', beats: '3 beats', label: 'dotted half note' },
  { kind: 'note', duration: 'half',       beats: '2 beats', label: 'half note' },
  { kind: 'note', duration: 'quarter',    beats: '1 beat',  label: 'quarter note' },
  { kind: 'note', duration: 'eighth',     beats: '½ beat',  label: 'eighth note' },
  { kind: 'rest', duration: 'half',       beats: '2 beats', label: 'half rest' },
  { kind: 'rest', duration: 'quarter',    beats: '1 beat',  label: 'quarter rest' },
  { kind: 'rest', duration: 'eighth',     beats: '½ beat',  label: 'eighth rest' },
]

const EX2_OPTIONS: Array<'½ beat' | '1 beat' | '2 beats' | '3 beats' | '4 beats'> = [
  '½ beat', '1 beat', '2 beats', '3 beats', '4 beats',
]

// Render a centered note/rest glyph inside a mini staff-ish card — Bravura only
function NoteOrRestGlyph({ item }: { item: Ex2Item }) {
  const cx = 80
  const cy = 60
  return (
    <svg viewBox="0 0 160 120" width="100%"
      style={{ maxWidth: 200, display: 'block', margin: '0 auto' }}>
      {/* Single reference line so the glyph reads as "on a staff" */}
      <line x1={20} y1={cy} x2={140} y2={cy} stroke="#E2DDD0" strokeWidth={1.2} />
      {item.kind === 'rest'
        ? <RestBravura cx={cx} cy={cy}
            kind={item.duration === 'dottedHalf' ? 'half' : item.duration} />
        : <NoteBravura cx={cx} cy={cy} kind={item.duration} />}
    </svg>
  )
}

function HowManyBeatsEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(EX2_POOL).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const answer = item.beats

  function pick(opt: string) {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = opt === answer
    if (ok) correctRef.current += 1
    setFeedback({ ok, picked: opt })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1)
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1100 : 2000)
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 2 — How many beats?
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Quarter note = 1 beat. How many beats does{' '}
        <strong style={{ color: DARK }}>this {item.kind === 'rest' ? 'rest' : 'note'}</strong> get?
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '18px 0', marginBottom: 14 }}>
        <NoteOrRestGlyph item={item} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
        {EX2_OPTIONS.map(opt => {
          const isPicked = feedback?.picked === opt
          const isAnswer = opt === answer
          const locked = feedback !== null
          const bg = locked && isAnswer ? CORRECT
                   : locked && isPicked && !feedback!.ok ? WRONG
                   : 'white'
          const color = locked && (isAnswer || isPicked) ? 'white' : DARK
          const border = locked && isAnswer ? CORRECT
                       : locked && isPicked && !feedback!.ok ? WRONG
                       : '#DDD8CA'
          return (
            <button key={opt} onClick={() => pick(opt)}
              disabled={locked}
              style={{
                padding: '12px 4px', borderRadius: 10,
                border: `1.5px solid ${border}`, background: bg, color,
                fontFamily: F, fontSize: 14, fontWeight: 600,
                cursor: locked ? 'default' : 'pointer',
              }}>
              {opt}
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct'}
        {feedback !== null && !feedback.ok && (
          <>A <strong style={{ color: CORRECT }}>{item.label}</strong> gets{' '}
          <strong style={{ color: CORRECT }}>{answer}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Ex 1: Time-signature facts ────────────────────────────────────────────
interface FactQuestion { question: string; options: string[]; answer: string }

const EX1_POOL: FactQuestion[] = [
  { question: 'What does the TOP number of a time signature tell you?',
    options: ['Beats per measure', 'Which note value equals one beat',
              'The total number of measures', 'How loud to play'],
    answer: 'Beats per measure' },
  { question: 'What does the BOTTOM number of a time signature tell you?',
    options: ['Beats per measure', 'Which note value equals one beat',
              'Sharps or flats in the key', 'The tempo'],
    answer: 'Which note value equals one beat' },
  { question: 'When the bottom number is 4, which note value equals one beat?',
    options: ['Whole note', 'Half note', 'Quarter note', 'Eighth note'],
    answer: 'Quarter note' },
  { question: 'In 2/4 time, which beat carries the strongest stress?',
    options: ['Beat 1', 'Beat 2', 'Both beats equally', 'Neither beat'],
    answer: 'Beat 1' },
  { question: 'In 3/4 time, which beat carries the strongest stress?',
    options: ['Beat 1', 'Beat 2', 'Beat 3', 'All three equally'],
    answer: 'Beat 1' },
  { question: 'In 4/4 time, which beats are emphasized?',
    options: ['Beats 1 and 3', 'Beats 2 and 4', 'Only beat 1', 'All four equally'],
    answer: 'Beats 1 and 3' },
  { question: 'How many quarter notes fill one measure of 4/4?',
    options: ['2', '3', '4', '6'],
    answer: '4' },
  { question: 'How many quarter notes fill one measure of 3/4?',
    options: ['2', '3', '4', '6'],
    answer: '3' },
  { question: 'In 4/4 time, how many beats does a whole note last?',
    options: ['1', '2', '3', '4'],
    answer: '4' },
  { question: 'In 4/4 time, how many beats does a dotted half note last?',
    options: ['1½', '2', '3', '4'],
    answer: '3' },
]

function FactsEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(EX1_POOL).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const options = useMemo(() => shuffled(item.options), [item])

  function pick(opt: string) {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = opt === item.answer
    if (ok) correctRef.current += 1
    setFeedback({ ok, picked: opt })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1)
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1100 : 2200)
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 1 — Time-signature facts
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '20px 22px', marginBottom: 14 }}>
        <p style={{ fontFamily: F, fontSize: 15, color: DARK, margin: 0, lineHeight: 1.55 }}>
          {item.question}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {options.map(opt => {
          const isPicked = feedback?.picked === opt
          const isAnswer = opt === item.answer
          const locked = feedback !== null
          const bg = locked && isAnswer ? CORRECT
                   : locked && isPicked && !feedback!.ok ? WRONG
                   : 'white'
          const color = locked && (isAnswer || isPicked) ? 'white' : DARK
          const border = locked && isAnswer ? CORRECT
                       : locked && isPicked && !feedback!.ok ? WRONG
                       : '#DDD8CA'
          return (
            <button key={opt} onClick={() => pick(opt)}
              disabled={locked}
              style={{
                padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${border}`, background: bg, color,
                fontFamily: F, fontSize: 14, fontWeight: 500, textAlign: 'left',
                lineHeight: 1.4,
                cursor: locked ? 'default' : 'pointer',
              }}>
              {opt}
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct'}
        {feedback !== null && !feedback.ok && (
          <>The answer is <strong style={{ color: CORRECT }}>{item.answer}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Ex 3: Write the counts on rhythm lines ────────────────────────────────
// Student sees a rhythm line and fills in a count number under each beat.
// Notes are drawn stems-up on G4. Halves and wholes span multiple beats, but
// the counting still happens beat-by-beat (so a half covers "1 2", etc.).
type RhythmDur = 'quarter' | 'half' | 'dottedHalf' | 'whole'
const DUR_BEATS: Record<RhythmDur, number> = { quarter: 1, half: 2, dottedHalf: 3, whole: 4 }
const DUR_GLYPH: Record<RhythmDur, string> = {
  quarter: NOTE_GLYPH.quarter,
  half:    NOTE_GLYPH.half,
  dottedHalf: NOTE_GLYPH.half,     // half + aug dot rendered separately
  whole:   NOTE_GLYPH.whole,
}

interface RhythmItem { ts: [number, number]; measures: Array<{ notes: RhythmDur[] }> }

const EX3_POOL: RhythmItem[] = [
  { ts: [4, 4], measures: [
    { notes: ['quarter', 'quarter', 'half'] },
    { notes: ['whole'] },
    { notes: ['half', 'quarter', 'quarter'] },
    { notes: ['quarter', 'half', 'quarter'] },
  ]},
  { ts: [3, 4], measures: [
    { notes: ['quarter', 'quarter', 'quarter'] },
    { notes: ['dottedHalf'] },
    { notes: ['quarter', 'half'] },
    { notes: ['dottedHalf'] },
  ]},
  { ts: [2, 4], measures: [
    { notes: ['quarter', 'quarter'] },
    { notes: ['half'] },
    { notes: ['quarter', 'quarter'] },
    { notes: ['half'] },
  ]},
]

const EX3_STEP = 6
const EX3_TTOP = 36
const EX3_SL   = 32
const EX3_SR   = 620
const EX3_SVG_W = EX3_SR + 16
const EX3_SVG_H = EX3_TTOP + 8 * EX3_STEP + 64
function ex3LineY(n: number) { return EX3_TTOP + (5 - n) * 2 * EX3_STEP }
const EX3_NOTE_Y = EX3_TTOP + (10 - 4) * EX3_STEP   // G4 = pos 4

const EX3_MEASURE_START_X = 130
const EX3_MEASURE_END_X   = EX3_SR - 20
const EX3_NUM_MEASURES = 4

function WriteCountsEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => [...EX3_POOL], [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [marks,    setMarks]    = useState<(number | null)[][]>(() =>
    items[0].measures.map(() => Array(items[0].ts[0]).fill(null))
  )
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const [beats] = item.ts
  const totalMeasureW = (EX3_MEASURE_END_X - EX3_MEASURE_START_X) / EX3_NUM_MEASURES
  const beatW = totalMeasureW / beats

  function cycleMark(measureIdx: number, beatIdx: number) {
    if (feedback !== null || lockedRef.current) return
    setMarks(prev => {
      const next = prev.map(row => [...row])
      const cur = next[measureIdx][beatIdx]
      // Cycle through null → 1 → 2 → … → beats → null
      next[measureIdx][beatIdx] = cur === null ? 1 : cur >= beats ? null : cur + 1
      return next
    })
  }

  function onReset() {
    if (feedback !== null) return
    setMarks(item.measures.map(() => Array(beats).fill(null)))
  }

  function onCheck() {
    if (feedback !== null || lockedRef.current) return
    // Must fill every slot
    const filled = marks.every(row => row.every(v => v !== null))
    if (!filled) return
    lockedRef.current = true
    // Every measure must be 1..beats in sequence
    const ok = marks.every(row => row.every((v, i) => v === i + 1))
    if (ok) correctRef.current += 1
    setFeedback({ ok })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1)
        setMarks(items[idx + 1].measures.map(() => Array(items[idx + 1].ts[0]).fill(null)))
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1400 : 2800)
  }

  const filledCount = marks.flat().filter(v => v !== null).length
  const totalSlots  = marks.flat().length

  // Precompute positions
  const barLineXs = Array.from({ length: EX3_NUM_MEASURES - 1 }, (_, i) =>
    EX3_MEASURE_START_X + (i + 1) * totalMeasureW
  )

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 3 — Write the counts
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 10, lineHeight: 1.65 }}>
        Tap each circle to cycle through the beats. Every measure starts again
        at <strong style={{ color: ACCENT }}>1</strong> and counts up to the top
        number of the time signature ({item.ts[0]}/{item.ts[1]}).
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '10px 0 18px', marginBottom: 14, overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${EX3_SVG_W} ${EX3_SVG_H}`} width="100%"
          style={{ maxWidth: EX3_SVG_W, display: 'block', margin: '0 auto',
            userSelect: 'none', WebkitUserSelect: 'none' }}>
          {/* Staff lines */}
          {[1, 2, 3, 4, 5].map(n => (
            <line key={n} x1={EX3_SL} y1={ex3LineY(n)} x2={EX3_SR} y2={ex3LineY(n)}
              stroke={DARK} strokeWidth={STROKE} />
          ))}
          {/* Left + final bar lines */}
          <line x1={EX3_SL} y1={EX3_TTOP} x2={EX3_SL} y2={ex3LineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={EX3_SR - 5} y1={EX3_TTOP} x2={EX3_SR - 5} y2={ex3LineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <line x1={EX3_SR} y1={EX3_TTOP} x2={EX3_SR} y2={ex3LineY(1)} stroke={DARK} strokeWidth={2.5} />
          {/* Interior bar lines */}
          {barLineXs.map((x, i) => (
            <line key={'bl' + i} x1={x} y1={EX3_TTOP} x2={x} y2={ex3LineY(1)}
              stroke={DARK} strokeWidth={STROKE} />
          ))}
          {/* Treble clef */}
          <text x={EX3_SL + 4} y={EX3_TTOP + 6 * EX3_STEP} fontFamily="Bravura, serif" fontSize={50}
            fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
          {/* Time signature */}
          <text x={EX3_SL + 56} y={EX3_TTOP + 2 * EX3_STEP} fontFamily="Bravura, serif" fontSize={48}
            fill={DARK} textAnchor="middle" dominantBaseline="central">
            {String.fromCodePoint(0xE080 + item.ts[0])}
          </text>
          <text x={EX3_SL + 56} y={EX3_TTOP + 6 * EX3_STEP} fontFamily="Bravura, serif" fontSize={48}
            fill={DARK} textAnchor="middle" dominantBaseline="central">
            {String.fromCodePoint(0xE080 + item.ts[1])}
          </text>

          {/* Notes: walk through each measure, placing notes at their beat onset */}
          {item.measures.map((measure, mIdx) => {
            const measureLeft = EX3_MEASURE_START_X + mIdx * totalMeasureW
            let beatCursor = 0
            return measure.notes.map((dur, nIdx) => {
              const d = DUR_BEATS[dur]
              const cx = measureLeft + (beatCursor + d / 2) * beatW
              beatCursor += d
              return (
                <g key={`m${mIdx}n${nIdx}`}>
                  <text x={cx} y={EX3_NOTE_Y} fontFamily="Bravura, serif" fontSize={36}
                    fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">
                    {DUR_GLYPH[dur]}
                  </text>
                  {dur === 'dottedHalf' && (
                    <text x={cx + 14} y={EX3_NOTE_Y} fontFamily="Bravura, serif" fontSize={36}
                      fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">{AUG_DOT}</text>
                  )}
                </g>
              )
            })
          })}

          {/* Count slots — one per beat under each measure */}
          {item.measures.map((_, mIdx) => {
            const measureLeft = EX3_MEASURE_START_X + mIdx * totalMeasureW
            return Array.from({ length: beats }, (_, bIdx) => {
              const cx = measureLeft + (bIdx + 0.5) * beatW
              const cy = ex3LineY(1) + 36
              const val = marks[mIdx]?.[bIdx] ?? null
              const isCorrect = val === bIdx + 1
              const strokeColor = val === null
                ? GREY
                : feedback !== null
                  ? (isCorrect ? CORRECT : WRONG)
                  : ACCENT
              const fillBg = val === null
                ? 'white'
                : feedback !== null
                  ? (isCorrect ? 'rgba(42,107,30,0.10)' : 'rgba(181,64,42,0.12)')
                  : 'rgba(186,117,23,0.10)'
              return (
                <g key={`s${mIdx}-${bIdx}`}
                  onClick={() => cycleMark(mIdx, bIdx)}
                  style={{ cursor: feedback !== null ? 'default' : 'pointer' }}>
                  <circle cx={cx} cy={cy} r={13}
                    fill={fillBg} stroke={strokeColor} strokeWidth={1.5} />
                  <text x={cx} y={cy}
                    fontFamily={F} fontSize={13} fontWeight={800}
                    fill={strokeColor}
                    textAnchor="middle" dominantBaseline="central">
                    {val ?? '?'}
                  </text>
                </g>
              )
            })
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center',
        marginBottom: 12 }}>
        <button onClick={onReset}
          disabled={feedback !== null}
          style={{
            padding: '10px 16px', borderRadius: 10,
            border: '1.5px solid #DDD8CA', background: 'white',
            color: GREY, fontFamily: F, fontSize: 13,
            cursor: feedback !== null ? 'default' : 'pointer',
          }}>Reset</button>
        <button onClick={onCheck}
          disabled={feedback !== null || filledCount !== totalSlots}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 14, fontWeight: 600,
            background: feedback !== null || filledCount !== totalSlots ? '#EDE8DF' : DARK,
            color: feedback !== null || filledCount !== totalSlots ? '#B0ACA4' : 'white',
            cursor: feedback !== null || filledCount !== totalSlots ? 'default' : 'pointer',
          }}>Check ({filledCount}/{totalSlots})</button>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct'}
        {feedback !== null && !feedback.ok && 'Not quite — each measure should count 1 up to the top number.'}
      </p>

      {/* Link out to the rhythm trainer for the tapping practice */}
      <div style={{ marginTop: 18, padding: '12px 14px',
        background: 'rgba(186,117,23,0.06)', border: '1px solid rgba(186,117,23,0.22)',
        borderRadius: 10 }}>
        <p style={{ fontFamily: F, fontSize: 12, color: DARK, margin: 0, lineHeight: 1.55 }}>
          Want to <em>feel</em> the counts instead of just writing them? Try the{' '}
          <a href="/rhythm" style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>
            rhythm trainer ↗
          </a>{' '}
          — it plays a metronome and asks you to tap along on each beat.
        </p>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3']

export default function TimeSignaturesLesson({
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
      <NavBar canBack={canGoBack} canForward={canGoForward}
        onBack={back} onForward={forward} />
      {phase === 'ex1' && <FactsEx         key={keyN} onDone={scored} />}
      {phase === 'ex2' && <HowManyBeatsEx  key={keyN} onDone={scored} />}
      {phase === 'ex3' && <WriteCountsEx   key={keyN} onDone={scored} />}
    </div>
  )
}
