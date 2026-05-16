'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { parseMXL, type RhythmNote, type RhythmExercise } from '@/lib/parseMXL'
import OsmdRhythmCounts from './OsmdRhythmCounts'
import { ExerciseNavBar } from './nav/ExerciseNavBar'

const F       = 'var(--font-jost), sans-serif'
const DARK    = '#1A1A18'
const GREY    = '#B0ACA4'
const ACCENT  = '#BA7517'
const CORRECT = '#2d5a3e'
const WRONG   = '#a0381c'
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
// Plain notehead (used when we beam eighth notes and draw custom stems + beams).
const NOTEHEAD_BLACK = '\uE0A4'

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
        Exercise 2 · How many beats?
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Quarter note = 1 beat. How many beats does{' '}
        <strong style={{ color: DARK }}>this {item.kind === 'rest' ? 'rest' : 'note'}</strong> get?
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
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
                       : '#D9CFAE'
          return (
            <button key={opt} onClick={() => pick(opt)}
              disabled={locked}
              style={{
                padding: '12px 4px', borderRadius: 10,
                border: `1.5px solid ${border}`, background: bg, color,
                fontFamily: F, fontSize: 15, fontWeight: 600,
                cursor: locked ? 'default' : 'pointer',
              }}>
              {opt}
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
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
// Mini time-signature "card" — treble clef + 2 Bravura digits on a short staff.
// Used whenever a question refers to a specific time signature, so the student
// connects the concept to the visual symbol.
function TimeSigCard({ ts }: { ts: [number, number] }) {
  const cardStep = 6
  const cSL   = 20, cSR = 130
  const cTop  = 20
  const svgW  = cSR + 12
  // Extra room at the bottom so the treble clef's lower hook isn't clipped.
  const svgH  = cTop + 8 * cardStep + 36
  const cLineY = (n: number) => cTop + (5 - n) * 2 * cardStep
  const digit  = (d: number) => String.fromCodePoint(0xE080 + d)

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH}
      style={{ display: 'block' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={cSL} y1={cLineY(n)} x2={cSR} y2={cLineY(n)}
          stroke={DARK} strokeWidth={1.2} />
      ))}
      <line x1={cSL} y1={cTop} x2={cSL} y2={cLineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={cSR} y1={cTop} x2={cSR} y2={cLineY(1)} stroke={DARK} strokeWidth={1.2} />
      {/* Treble clef */}
      <text x={cSL + 4} y={cTop + 6 * cardStep} fontFamily="Bravura, serif" fontSize={50}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
      {/* Time-signature digits (top on line 4, bottom on line 2) */}
      <text x={cSL + 58} y={cTop + 2 * cardStep} fontFamily="Bravura, serif" fontSize={48}
        fill={ACCENT} textAnchor="middle" dominantBaseline="central">{digit(ts[0])}</text>
      <text x={cSL + 58} y={cTop + 6 * cardStep} fontFamily="Bravura, serif" fontSize={48}
        fill={ACCENT} textAnchor="middle" dominantBaseline="central">{digit(ts[1])}</text>
    </svg>
  )
}

interface FactQuestion {
  visual?: [number, number]       // show this time signature above the question
  question: string
  options: string[]
  answer: string
}

// Pool: mixes text-only concept questions with visual questions tied to a
// displayed time signature. Language kept short and kid-friendly.
const EX1_POOL: FactQuestion[] = [
  // Concept questions (no visual)
  { question: 'What does the TOP number tell you?',
    options: ['How many beats are in each measure',
              'Which note gets one beat',
              'How loud to play',
              'How many sharps or flats there are'],
    answer: 'How many beats are in each measure' },
  { question: 'What does the BOTTOM number tell you?',
    options: ['Which note gets one beat',
              'How many beats are in each measure',
              'Which key the piece is in',
              'The tempo'],
    answer: 'Which note gets one beat' },
  { question: 'When the bottom number is 4, which note gets one beat?',
    options: ['Whole note', 'Half note', 'Quarter note', 'Eighth note'],
    answer: 'Quarter note' },

  // Visual questions — time signature shown above the prompt
  { visual: [4, 4], question: 'How many beats are in each measure?',
    options: ['2', '3', '4', '6'], answer: '4' },
  { visual: [3, 4], question: 'How many beats are in each measure?',
    options: ['2', '3', '4', '6'], answer: '3' },
  { visual: [2, 4], question: 'How many beats are in each measure?',
    options: ['2', '3', '4', '6'], answer: '2' },
  { visual: [4, 4], question: 'Which note gets one beat?',
    options: ['Whole note', 'Half note', 'Quarter note', 'Eighth note'],
    answer: 'Quarter note' },
  { visual: [2, 4], question: 'Which beat is the strongest?',
    options: ['Beat 1', 'Beat 2', 'Both equally', 'Neither beat'],
    answer: 'Beat 1' },
  { visual: [3, 4], question: 'Which beat is the strongest?',
    options: ['Beat 1', 'Beat 2', 'Beat 3', 'All three the same'],
    answer: 'Beat 1' },
  { visual: [4, 4], question: 'Which beats are emphasized?',
    options: ['Beats 1 and 3', 'Beats 2 and 4', 'Only beat 1', 'All four the same'],
    answer: 'Beats 1 and 3' },
  { visual: [4, 4], question: 'How many quarter notes fit in one measure?',
    options: ['2', '3', '4', '6'], answer: '4' },
  { visual: [3, 4], question: 'How many quarter notes fit in one measure?',
    options: ['2', '3', '4', '6'], answer: '3' },
  { visual: [2, 4], question: 'How many quarter notes fit in one measure?',
    options: ['2', '3', '4', '6'], answer: '2' },
  { visual: [4, 4], question: 'A whole note lasts how many beats?',
    options: ['1', '2', '3', '4'], answer: '4' },
  { visual: [4, 4], question: 'A dotted half note lasts how many beats?',
    options: ['1½', '2', '3', '4'], answer: '3' },
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
        Exercise 1 · Time-signature facts
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '18px 22px', marginBottom: 14 }}>
        {item.visual && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <TimeSigCard ts={item.visual} />
          </div>
        )}
        <p style={{ fontFamily: 'var(--font-cormorant), serif',
          fontSize: 20, fontWeight: 500, color: DARK,
          margin: 0, lineHeight: 1.45,
          textAlign: item.visual ? 'center' : 'left' }}>
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
                       : '#D9CFAE'
          return (
            <button key={opt} onClick={() => pick(opt)}
              disabled={locked}
              style={{
                padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${border}`, background: bg, color,
                fontFamily: F, fontSize: 15, fontWeight: 500, textAlign: 'left',
                lineHeight: 1.4,
                cursor: locked ? 'default' : 'pointer',
              }}>
              {opt}
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
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
// Subdivisions are at the eighth-note level (2 per beat). Each note holds
// subdivision slots proportional to its duration: quarter=2 ("N +"),
// half=4 ("N + N +"), dotted half=6, whole=8. Slots live directly under their
// note with a tinted group background so the student can see what counts belong
// to which note. Input uses a painter bar — pick a value, then tap slots.
type RhythmDur =
  | 'eighth' | 'quarter' | 'dottedQuarter' | 'half' | 'dottedHalf' | 'whole'
  | 'eighthRest' | 'quarterRest' | 'halfRest' | 'wholeRest'
const DUR_EIGHTHS: Record<RhythmDur, number> = {
  eighth: 1, quarter: 2, dottedQuarter: 3, half: 4, dottedHalf: 6, whole: 8,
  eighthRest: 1, quarterRest: 2, halfRest: 4, wholeRest: 8,
}
const DUR_GLYPH: Record<RhythmDur, string> = {
  eighth:  NOTE_GLYPH.eighth,     // only used for isolated (un-beamed) eighths
  quarter: NOTE_GLYPH.quarter,
  dottedQuarter: NOTE_GLYPH.quarter,  // quarter + aug dot rendered separately
  half:    NOTE_GLYPH.half,
  dottedHalf: NOTE_GLYPH.half,     // half + aug dot rendered separately
  whole:   NOTE_GLYPH.whole,
  eighthRest:  REST_GLYPH.eighth,
  quarterRest: REST_GLYPH.quarter,
  halfRest:    REST_GLYPH.half,
  wholeRest:   REST_GLYPH.whole,
}
function isRest(d: RhythmDur): boolean {
  return d === 'eighthRest' || d === 'quarterRest' || d === 'halfRest' || d === 'wholeRest'
}

// Group consecutive eighth notes (rests break runs) so we can beam them.
// Returns pairs of [startIdx, endIdx] for each run of 2+ eighths.
function detectBeamGroups(notes: RhythmDur[]): Array<{ start: number; end: number }> {
  const groups: Array<{ start: number; end: number }> = []
  let runStart: number | null = null
  for (let i = 0; i < notes.length; i++) {
    if (notes[i] === 'eighth') {
      if (runStart === null) runStart = i
    } else {
      if (runStart !== null && i - runStart >= 2) {
        groups.push({ start: runStart, end: i - 1 })
      }
      runStart = null
    }
  }
  if (runStart !== null && notes.length - runStart >= 2) {
    groups.push({ start: runStart, end: notes.length - 1 })
  }
  return groups
}

// Expected label for subdivision i: "1", "+", "2", "+", … based on parity.
function expectedCountAt(subdivIdx: number): string {
  return subdivIdx % 2 === 0 ? String(subdivIdx / 2 + 1) : '+'
}

export interface RhythmItem { ts: [number, number]; measures: Array<{ notes: RhythmDur[] }> }

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
  // 4/4 with rests
  { ts: [4, 4], measures: [
    { notes: ['quarter', 'quarter', 'quarterRest', 'quarter'] },
    { notes: ['half', 'halfRest'] },
    { notes: ['quarter', 'quarterRest', 'half'] },
    { notes: ['halfRest', 'quarter', 'quarter'] },
  ]},
  // 3/4 with rests
  { ts: [3, 4], measures: [
    { notes: ['quarter', 'quarterRest', 'quarter'] },
    { notes: ['half', 'quarterRest'] },
    { notes: ['quarterRest', 'quarter', 'quarter'] },
    { notes: ['quarter', 'half'] },
  ]},
  // 2/4 with rests
  { ts: [2, 4], measures: [
    { notes: ['quarter', 'quarterRest'] },
    { notes: ['halfRest'] },
    { notes: ['quarterRest', 'quarter'] },
    { notes: ['half'] },
  ]},
  // 4/4 with eighths (no rests) — 8 subdivs per measure
  { ts: [4, 4], measures: [
    { notes: ['quarter', 'eighth', 'eighth', 'half'] },
    { notes: ['eighth', 'eighth', 'eighth', 'eighth', 'half'] },
    { notes: ['half', 'eighth', 'eighth', 'quarter'] },
    { notes: ['quarter', 'quarter', 'eighth', 'eighth', 'quarter'] },
  ]},
  // 3/4 with eighths (no rests) — 6 subdivs per measure
  { ts: [3, 4], measures: [
    { notes: ['eighth', 'eighth', 'quarter', 'quarter'] },
    { notes: ['quarter', 'eighth', 'eighth', 'quarter'] },
    { notes: ['quarter', 'quarter', 'eighth', 'eighth'] },
    { notes: ['eighth', 'eighth', 'eighth', 'eighth', 'quarter'] },
  ]},
  // 2/4 with eighths (no rests) — 4 subdivs per measure
  { ts: [2, 4], measures: [
    { notes: ['eighth', 'eighth', 'quarter'] },
    { notes: ['quarter', 'eighth', 'eighth'] },
    { notes: ['eighth', 'eighth', 'eighth', 'eighth'] },
    { notes: ['quarter', 'quarter'] },
  ]},
  // 4/4 with eighths AND rests
  { ts: [4, 4], measures: [
    { notes: ['quarter', 'eighth', 'eighthRest', 'half'] },
    { notes: ['eighth', 'eighth', 'quarterRest', 'half'] },
    { notes: ['half', 'eighth', 'eighthRest', 'quarter'] },
    { notes: ['eighthRest', 'eighth', 'quarter', 'half'] },
  ]},
  // 3/4 with eighths AND rests
  { ts: [3, 4], measures: [
    { notes: ['eighth', 'eighth', 'quarterRest', 'quarter'] },
    { notes: ['quarter', 'eighth', 'eighth', 'quarterRest'] },
    { notes: ['quarterRest', 'eighth', 'eighth', 'quarter'] },
    { notes: ['quarter', 'eighth', 'eighthRest', 'quarter'] },
  ]},
  // 2/4 with eighths AND rests
  { ts: [2, 4], measures: [
    { notes: ['quarter', 'eighth', 'eighthRest'] },
    { notes: ['eighth', 'eighthRest', 'quarter'] },
    { notes: ['eighth', 'eighth', 'eighth', 'eighthRest'] },
    { notes: ['quarterRest', 'eighth', 'eighth'] },
  ]},
]

const EX3_STEP = 6
const EX3_TTOP = 36
const EX3_SL   = 32
const EX3_SR   = 820                     // wider so eighth notes have breathing room
const EX3_SVG_W = EX3_SR + 16
const EX3_SVG_H = EX3_TTOP + 8 * EX3_STEP + 64
function ex3LineY(n: number) { return EX3_TTOP + (5 - n) * 2 * EX3_STEP }
const EX3_NOTE_Y = EX3_TTOP + (10 - 4) * EX3_STEP   // G4 = pos 4

// Start the first measure just past the time signature (clef ends ~x=62,
// time-sig digits center at ~x=88 and extend to ~x=100, so the first bar line
// sits comfortably around x=112).
const EX3_MEASURE_START_X = 112
const EX3_MEASURE_END_X   = EX3_SR - 20
const EX3_NUM_MEASURES = 4

function initInputs(it: RhythmItem): string[][] {
  return it.measures.map(m => m.notes.map(() => ''))
}

// Expected count string for a single note: concatenate the count label for
// every subdivision it covers (no separators). e.g. a half starting at subdiv 2
// returns "2+3+".
function expectedForNote(dur: RhythmDur, startSubdiv: number): string {
  const n = DUR_EIGHTHS[dur]
  return Array.from({ length: n }, (_, k) => expectedCountAt(startSubdiv + k)).join('')
}
function normalized(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase()
}

export function WriteCountsEx({
  onDone,
  pool = EX3_POOL,
  title = 'Exercise 3 · Write the counts',
}: {
  onDone: (correct: number, total: number) => void
  pool?: RhythmItem[]
  title?: string
}) {
  const items = useMemo(() => [...pool], [pool])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [inputs,   setInputs]   = useState<string[][]>(() => initInputs(items[0]))
  const [feedback, setFeedback] = useState<{ ok: boolean; errors: boolean[][] } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  // Track which text input was most recently focused so the palette can append
  // characters to it without stealing focus away.
  const focusedRef = useRef<{ m: number; n: number } | null>(null)
  const inputRefs  = useRef<Array<Array<HTMLInputElement | null>>>([])

  const item = items[idx]
  const [beats] = item.ts
  const subdivsPerMeasure = beats * 2
  const totalMeasureW = (EX3_MEASURE_END_X - EX3_MEASURE_START_X) / EX3_NUM_MEASURES
  // Engraving rules: leave a small indent after each bar line and a small
  // margin before the next bar line. Notes are laid out proportionally within
  // the usable area, so later notes don't get squeezed against the next bar.
  const M_LEFT_INDENT  = 10
  const M_RIGHT_MARGIN = 10
  const usableMeasureW = totalMeasureW - M_LEFT_INDENT - M_RIGHT_MARGIN
  const eighthW = usableMeasureW / subdivsPerMeasure
  const subdivX = (measureLeft: number, s: number) =>
    measureLeft + M_LEFT_INDENT + s * eighthW

  function handleInputChange(mIdx: number, nIdx: number, v: string) {
    if (feedback !== null) return
    setInputs(prev => {
      const next = prev.map(row => [...row])
      next[mIdx][nIdx] = v
      return next
    })
  }

  function paletteInsert(ch: string) {
    if (feedback !== null) return
    if (ch === 'NEXT') { nextInput(); return }
    const f = focusedRef.current
    if (!f) return
    setInputs(prev => {
      const next = prev.map(row => [...row])
      if (ch === 'BACKSPACE') next[f.m][f.n] = next[f.m][f.n].slice(0, -1)
      else                    next[f.m][f.n] = next[f.m][f.n] + ch
      return next
    })
    // Re-focus the input after the state update, so repeated palette clicks all
    // land in the same field.
    requestAnimationFrame(() => {
      const input = inputRefs.current[f.m]?.[f.n]
      if (input) input.focus()
    })
  }

  function nextInput() {
    if (feedback !== null) return
    const measures = item.measures
    let m = 0, n = 0
    if (focusedRef.current) {
      m = focusedRef.current.m
      n = focusedRef.current.n + 1
      if (n >= measures[m].notes.length) {
        m += 1
        n = 0
        if (m >= measures.length) { m = 0 }
      }
    }
    focusedRef.current = { m, n }
    requestAnimationFrame(() => {
      const input = inputRefs.current[m]?.[n]
      if (input) input.focus()
    })
  }

  function onReset() {
    if (feedback !== null) return
    setInputs(initInputs(item))
    focusedRef.current = null
  }

  function onCheck() {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    // Validate per note: normalize whitespace and compare to expected.
    let ok = true
    const errors = item.measures.map((m, mIdx) => {
      let s = 0
      return m.notes.map((dur, nIdx) => {
        const expected = expectedForNote(dur, s)
        s += DUR_EIGHTHS[dur]
        const actual = normalized(inputs[mIdx][nIdx])
        const match = actual === normalized(expected) && actual.length > 0
        if (!match) ok = false
        return !match
      })
    })
    if (ok) correctRef.current += 1
    setFeedback({ ok, errors })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        const nextIdx = idx + 1
        setIdx(nextIdx)
        setInputs(initInputs(items[nextIdx]))
        focusedRef.current = null
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1400 : 2800)
  }

  const allFilled = inputs.every(row => row.every(v => v.trim().length > 0))

  const barLineXs = Array.from({ length: EX3_NUM_MEASURES - 1 }, (_, i) =>
    EX3_MEASURE_START_X + (i + 1) * totalMeasureW
  )

  const groupTop = ex3LineY(1) + 20
  const groupH   = 30

  // Palette buttons: numbers relevant to this time sig + "+" + backspace.
  const paletteItems: Array<{ value: string; label: string; wide?: boolean }> = [
    ...Array.from({ length: beats }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
    { value: '+', label: '+' },
    { value: 'BACKSPACE', label: '⌫', wide: true },
    { value: 'NEXT', label: 'Next →', wide: true },
  ]

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        {title}
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 10, lineHeight: 1.65 }}>
        Under each note, type the counts it holds. A quarter holds{' '}
        <strong style={{ color: DARK }}>N+</strong>, a half holds{' '}
        <strong style={{ color: DARK }}>N+N+</strong>, and counting runs continuously from{' '}
        <strong style={{ color: ACCENT }}>1</strong> through the top number of the time signature,
        resetting each measure.
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '10px 0 18px', marginBottom: 14, overflowX: 'auto',
        // Extend past the practice card's 28px padding so rhythms with eighths
        // have room without squishing.
        marginLeft: -28, marginRight: -28 }}>
        <svg viewBox={`0 0 ${EX3_SVG_W} ${EX3_SVG_H}`} width="100%"
          style={{ maxWidth: EX3_SVG_W, display: 'block', margin: '0 auto',
            userSelect: 'none', WebkitUserSelect: 'none' }}>
          {/* Staff + bar lines */}
          {[1, 2, 3, 4, 5].map(n => (
            <line key={n} x1={EX3_SL} y1={ex3LineY(n)} x2={EX3_SR} y2={ex3LineY(n)}
              stroke={DARK} strokeWidth={STROKE} />
          ))}
          <line x1={EX3_SL} y1={EX3_TTOP} x2={EX3_SL} y2={ex3LineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={EX3_SR - 5} y1={EX3_TTOP} x2={EX3_SR - 5} y2={ex3LineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <line x1={EX3_SR} y1={EX3_TTOP} x2={EX3_SR} y2={ex3LineY(1)} stroke={DARK} strokeWidth={2.5} />
          {barLineXs.map((x, i) => (
            <line key={'bl' + i} x1={x} y1={EX3_TTOP} x2={x} y2={ex3LineY(1)}
              stroke={DARK} strokeWidth={STROKE} />
          ))}
          {/* Clef + time signature */}
          <text x={EX3_SL + 4} y={EX3_TTOP + 6 * EX3_STEP} fontFamily="Bravura, serif" fontSize={50}
            fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
          <text x={EX3_SL + 56} y={EX3_TTOP + 2 * EX3_STEP} fontFamily="Bravura, serif" fontSize={48}
            fill={DARK} textAnchor="middle" dominantBaseline="central">
            {String.fromCodePoint(0xE080 + item.ts[0])}
          </text>
          <text x={EX3_SL + 56} y={EX3_TTOP + 6 * EX3_STEP} fontFamily="Bravura, serif" fontSize={48}
            fill={DARK} textAnchor="middle" dominantBaseline="central">
            {String.fromCodePoint(0xE080 + item.ts[1])}
          </text>

          {/* Each note: group background + note (or rest) glyph + text input */}
          {item.measures.map((measure, mIdx) => {
            const measureLeft = EX3_MEASURE_START_X + mIdx * totalMeasureW
            const beamGroups = detectBeamGroups(measure.notes)
            // Pre-compute positions so we can draw beams across multiple stems.
            let cursor = 0
            const positions = measure.notes.map(dur => {
              const startSubdiv = cursor
              cursor += DUR_EIGHTHS[dur]
              const subdivStartX = subdivX(measureLeft, startSubdiv)
              return {
                startSubdiv,
                nSubdivs: DUR_EIGHTHS[dur],
                subdivStartX,
                noteCx: subdivStartX + 8,
                groupLeft: subdivStartX + 1,
                groupWidth: DUR_EIGHTHS[dur] * eighthW - 2,
              }
            })
            if (!inputRefs.current[mIdx]) inputRefs.current[mIdx] = []

            const STEM_LEN = 31
            const STEM_W = 1.4           // matches strokeWidth of the stem <line>
            const BEAM_H = 4

            return (
              <g key={`m${mIdx}`}>
                {measure.notes.map((dur, nIdx) => {
                  const p = positions[nIdx]
                  const isErr = feedback?.errors[mIdx]?.[nIdx] ?? false
                  const showGood = feedback !== null && !isErr

                  // Rests sit around the middle line; notes stay on G4 so stems go up.
                  const glyphY    = isRest(dur) ? ex3LineY(3) : EX3_NOTE_Y
                  const glyphSize = isRest(dur) ? 40 : 36

                  // Is this eighth part of a beam group?
                  const inBeam = dur === 'eighth' &&
                    beamGroups.some(g => nIdx >= g.start && nIdx <= g.end)

                  return (
                    <g key={`m${mIdx}n${nIdx}`}>
                      {/* Beamed eighth: notehead only + custom stem (beam is drawn below) */}
                      {inBeam ? (
                        <>
                          <text x={p.noteCx} y={EX3_NOTE_Y}
                            fontFamily="Bravura, serif" fontSize={36}
                            fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">
                            {NOTEHEAD_BLACK}
                          </text>
                          <line x1={p.noteCx + 4.5} y1={EX3_NOTE_Y - 2}
                            x2={p.noteCx + 4.5} y2={EX3_NOTE_Y - STEM_LEN}
                            stroke={DARK} strokeWidth={1.4} />
                        </>
                      ) : (
                        <text x={p.noteCx} y={glyphY}
                          fontFamily="Bravura, serif" fontSize={glyphSize}
                          fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">
                          {DUR_GLYPH[dur]}
                        </text>
                      )}
                      {(dur === 'dottedHalf' || dur === 'dottedQuarter') && (
                        <text x={p.noteCx + 14} y={EX3_NOTE_Y}
                          fontFamily="Bravura, serif" fontSize={36}
                          fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">{AUG_DOT}</text>
                      )}

                      {/* Write-zone background */}
                      <rect x={p.groupLeft} y={groupTop}
                        width={p.groupWidth} height={groupH}
                        rx={5}
                        fill={showGood ? 'rgba(42,107,30,0.08)'
                            : isErr   ? 'rgba(181,64,42,0.10)'
                            :           'rgba(186,117,23,0.04)'}
                        stroke={showGood ? 'rgba(42,107,30,0.35)'
                              : isErr   ? 'rgba(181,64,42,0.45)'
                              :           'rgba(186,117,23,0.22)'}
                        strokeWidth={0.8} />

                      {/* Text input */}
                      <foreignObject x={p.groupLeft + 2} y={groupTop + 2}
                        width={p.groupWidth - 4} height={groupH - 4}>
                        <input
                          ref={el => { inputRefs.current[mIdx][nIdx] = el }}
                          type="text"
                          value={inputs[mIdx][nIdx]}
                          onChange={e => handleInputChange(mIdx, nIdx, e.target.value)}
                          onFocus={() => { focusedRef.current = { m: mIdx, n: nIdx } }}
                          disabled={feedback !== null}
                          inputMode="text"
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          placeholder="·"
                          aria-label={`Counts for ${dur}, measure ${mIdx + 1}`}
                          style={{
                            width: '100%', height: '100%',
                            border: 'none', background: 'transparent',
                            textAlign: 'center',
                            fontFamily: F, fontSize: 15, fontWeight: 700,
                            color: showGood ? CORRECT : isErr ? WRONG : DARK,
                            padding: 0,
                            outline: 'none',
                            caretColor: ACCENT,
                          }}
                        />
                      </foreignObject>
                    </g>
                  )
                })}

                {/* Beams connecting each run of 2+ eighth notes. The rect
                    extends by half the stem stroke-width on each side so it
                    fully covers the outer edges of the first and last stems,
                    and overlaps the stem tops by 1px so the junction reads as
                    one solid shape. */}
                {beamGroups.map((g, gIdx) => {
                  const firstCx = positions[g.start].noteCx
                  const lastCx  = positions[g.end].noteCx
                  const stemX1 = firstCx + 4.5
                  const stemX2 = lastCx + 4.5
                  const stemTopY = EX3_NOTE_Y - STEM_LEN
                  return (
                    <rect key={`beam-${mIdx}-${gIdx}`}
                      x={stemX1 - STEM_W / 2}
                      y={stemTopY - BEAM_H + 1}
                      width={(stemX2 - stemX1) + STEM_W}
                      height={BEAM_H}
                      fill={DARK} />
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Count palette · taps insert into the focused input */}
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#7A7060', margin: '0 0 6px' }}>
        Count palette
      </p>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center',
        flexWrap: 'wrap', marginBottom: 12 }}>
        {paletteItems.map(p => (
          <button key={p.value}
            onMouseDown={e => e.preventDefault()}
            onClick={() => paletteInsert(p.value)}
            disabled={feedback !== null}
            aria-label={p.value === 'BACKSPACE' ? 'backspace' : p.value}
            style={{
              minWidth: p.wide ? 56 : 44,
              height: 44, borderRadius: 8,
              border: `1.5px solid #D9CFAE`,
              background: '#FDFBF5', color: DARK,
              fontFamily: F, fontSize: 18, fontWeight: 700,
              padding: '0 10px',
              cursor: feedback !== null ? 'default' : 'pointer',
            }}>
            {p.label}
          </button>
        ))}
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
          disabled={feedback !== null || !allFilled}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 15, fontWeight: 600,
            background: feedback !== null || !allFilled ? '#EDE8DF' : DARK,
            color: feedback !== null || !allFilled ? '#B0ACA4' : 'white',
            cursor: feedback !== null || !allFilled ? 'default' : 'pointer',
          }}>Check</button>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct'}
        {feedback !== null && !feedback.ok && (
          'Some notes don\u2019t add up · notes shown in red need another look. Counts run 1 + 2 + 3 + 4 + continuously across each measure.'
        )}
      </p>

      {/* Link out to the rhythm trainer for the tapping practice */}
      <div style={{ marginTop: 18, padding: '12px 14px',
        background: 'rgba(186,117,23,0.06)', border: '1px solid rgba(186,117,23,0.22)',
        borderRadius: 10 }}>
        <p style={{ fontFamily: F, fontSize: 13, color: DARK, margin: 0, lineHeight: 1.55 }}>
          Want to <em>feel</em> the counts instead of just writing them? Try the{' '}
          <a href="/rhythm" style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>
            rhythm trainer ↗
          </a>{' '}
          · it plays a metronome and asks you to tap along on each beat.
        </p>
      </div>
    </div>
  )
}

// ── Ex 4: Write the counts on real MusicXML rhythms ─────────────────────
// Six short rhythms authored in notation software and exported as .mxl. We
// parse them at runtime and reuse WriteCountsEx's renderer, so Ex 4 feels
// identical to Ex 3 but drills on real musical examples.
const EX4_XML_SRCS = [
  '/music/prep/rhythm/rhythm-1.mxl',
  '/music/prep/rhythm/rhythm-2.mxl',
  '/music/prep/rhythm/rhythm-3.mxl',
  '/music/prep/rhythm/rhythm-4.mxl',
  '/music/prep/rhythm/rhythm-5.mxl',
  '/music/prep/rhythm/rhythm-6.mxl',
]

function mxlNoteToRhythmDur(n: RhythmNote): RhythmDur {
  if (n.rest) {
    if (n.type === 'whole')   return 'wholeRest'
    if (n.type === 'half')    return 'halfRest'
    if (n.type === 'quarter') return 'quarterRest'
    if (n.type === 'eighth')  return 'eighthRest'
    return 'quarterRest'
  }
  if (n.type === 'half'    && n.dot) return 'dottedHalf'
  if (n.type === 'quarter' && n.dot) return 'dottedQuarter'
  if (n.type === 'whole')   return 'whole'
  if (n.type === 'half')    return 'half'
  if (n.type === 'quarter') return 'quarter'
  if (n.type === 'eighth')  return 'eighth'
  return 'quarter'
}

// Map a subdivision count back to the shortest RhythmDur that fits. Used
// when the two-staff merge emits a rest that spans the gap until the next
// event start.
function restForSubdivs(n: number): RhythmDur {
  if (n >= 8) return 'wholeRest'
  if (n >= 4) return 'halfRest'
  if (n >= 2) return 'quarterRest'
  return 'eighthRest'
}

// Merge two staves of a grand-staff rhythm into a single sequence of events.
// At every subdivision where either staff STARTS a new event, we emit one
// event whose duration is the gap until the NEXT start (in either staff).
// When both staves have an event active, we prefer the non-rest one, so the
// resulting rhythm matches what the student sees when reading across the
// grand staff.
function mergeMeasure(notes: RhythmNote[]): RhythmDur[] {
  const s1 = notes.filter(n => n.staff === 1)
  const s2 = notes.filter(n => n.staff !== 1)

  // Build start-tick → event maps for each staff, plus a total subdiv count.
  function build(list: RhythmNote[]) {
    const starts = new Map<number, RhythmNote>()
    let cursor = 0
    for (const n of list) {
      starts.set(cursor, n)
      cursor += Math.round(n.durationBeats * 2)   // subdivs in eighths
    }
    return { starts, total: cursor }
  }
  const a = build(s1)
  const b = build(s2)
  const total = Math.max(a.total, b.total)
  if (total === 0) return []

  // Helper: at any tick, which event from this staff is "active" (started
  // at or before tick and ends after tick)?
  function activeAt(info: ReturnType<typeof build>, tick: number): RhythmNote | null {
    let cursor = 0
    let last: RhythmNote | null = null
    for (const [startTick, note] of info.starts) {
      if (startTick <= tick) {
        const end = startTick + Math.round(note.durationBeats * 2)
        if (tick < end) last = note
        cursor = end
      }
    }
    void cursor
    return last
  }

  // Collect the union of start ticks from both staves.
  const startSet = new Set<number>()
  for (const t of a.starts.keys()) startSet.add(t)
  for (const t of b.starts.keys()) startSet.add(t)
  const allStarts = [...startSet].sort((x, y) => x - y)

  const out: RhythmDur[] = []
  for (let i = 0; i < allStarts.length; i++) {
    const start   = allStarts[i]
    const nextEnd = i + 1 < allStarts.length ? allStarts[i + 1] : total
    const span    = nextEnd - start

    const act1 = activeAt(a, start)
    const act2 = activeAt(b, start)

    // Prefer the non-rest event from either staff. If both are rests (or one
    // staff is empty), emit a rest covering the full gap.
    const chosen = (act1 && !act1.rest ? act1 : null)
                ?? (act2 && !act2.rest ? act2 : null)

    if (chosen) {
      // Emit the chosen note BUT with the merged gap duration, so overlaps
      // get truncated to the next event start.
      const chosenEnd = findEndOf(chosen, a.starts, b.starts)
      const clampedSpan = Math.min(span, chosenEnd - start)
      out.push(durForSubdivs(chosen, clampedSpan))
    } else {
      out.push(restForSubdivs(span))
    }
  }
  return out
}

// Find the end tick of a note by locating its start in either staff map.
function findEndOf(n: RhythmNote,
  s1: Map<number, RhythmNote>, s2: Map<number, RhythmNote>): number {
  for (const [t, x] of s1) if (x === n) return t + Math.round(n.durationBeats * 2)
  for (const [t, x] of s2) if (x === n) return t + Math.round(n.durationBeats * 2)
  return 0
}

// Map a chosen note's (possibly truncated) subdiv count back to a RhythmDur.
function durForSubdivs(n: RhythmNote, span: number): RhythmDur {
  if (n.rest) return restForSubdivs(span)
  // Notes: prefer exact matches for the values our renderer knows.
  if (span >= 8) return 'whole'
  if (span === 6) return 'dottedHalf'
  if (span >= 4) return 'half'
  if (span === 3) return 'dottedQuarter'
  if (span >= 2) return 'quarter'
  return 'eighth'
}

function mxlToRhythmItem(ex: RhythmExercise): RhythmItem {
  // Grand-staff rhythms split the rhythm across both hands. Merge the two
  // staves so the count-writing UI shows one combined rhythm line — exactly
  // what the student is supposed to read across the grand staff.
  return {
    ts: [ex.timeSignature.beats, ex.timeSignature.beatType],
    measures: ex.measures.map(m => ({ notes: mergeMeasure(m.notes) })),
  }
}

// Build a 2-D array of per-event expected count strings, grouped by measure.
// Every event — note OR rest — gets an expected count, because counting runs
// continuously through the measure and students write counts under rests too.
function expectedCountsByMeasureFull(item: RhythmItem): string[][] {
  return item.measures.map(m => {
    const out: string[] = []
    let cursor = 0
    for (const dur of m.notes) {
      out.push(expectedForNote(dur, cursor))
      cursor += DUR_EIGHTHS[dur]
    }
    return out
  })
}

function normalizeCount(s: string): string {
  return s.replace(/\s+/g, '').toLowerCase()
}

interface Ex4Piece {
  src:      string
  expected: string[][]  // per-measure, per-note expected count strings (rests skipped)
}

function WriteCountsMxlEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const [pool,  setPool]  = useState<Ex4Piece[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [idx,   setIdx]   = useState(0)
  // inputs[measureIdx][noteIdx] for the current piece.
  const [inputs,   setInputs]   = useState<string[][]>([])
  const [feedback, setFeedback] = useState<{ ok: boolean; matches: boolean[][] } | null>(null)
  const correctRef = useRef(0)
  const totalRef   = useRef(0)
  const lockedRef  = useRef(false)

  useEffect(() => {
    let cancelled = false
    Promise.all(EX4_XML_SRCS.map(src =>
      fetch(src).then(r => {
        if (!r.ok) throw new Error(`${src}: ${r.status}`)
        return r.arrayBuffer()
      }).then(parseMXL).then(ex => ({
        src,
        expected: expectedCountsByMeasureFull(mxlToRhythmItem(ex)),
      }))
    )).then(results => {
      if (cancelled) return
      setPool(shuffled(results))
    }).catch(e => {
      if (!cancelled) setError(String(e))
    })
    return () => { cancelled = true }
  }, [])

  // Reset per-note inputs when the current piece changes.
  useEffect(() => {
    if (!pool) return
    setInputs(pool[idx].expected.map(row => row.map(() => '')))
    setFeedback(null)
    lockedRef.current = false
  }, [idx, pool])

  function setInput(m: number, n: number, v: string) {
    setInputs(prev => prev.map((row, mi) =>
      mi === m ? row.map((c, ni) => ni === n ? v : c) : row
    ))
  }

  function check() {
    if (!pool || feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const piece = pool[idx]
    let pieceCorrect = 0, pieceTotal = 0
    const matches = piece.expected.map((expArr, mi) =>
      expArr.map((exp, ni) => {
        pieceTotal += 1
        const ok = normalizeCount(inputs[mi]?.[ni] ?? '') === normalizeCount(exp)
        if (ok) pieceCorrect += 1
        return ok
      })
    )
    correctRef.current += pieceCorrect
    totalRef.current   += pieceTotal
    const ok = pieceCorrect === pieceTotal
    setFeedback({ ok, matches })
    setTimeout(() => {
      if (idx + 1 >= pool.length) {
        onDone(correctRef.current, totalRef.current)
        return
      }
      setIdx(i => i + 1)
    }, ok ? 1400 : 3000)
  }

  if (error) {
    return (
      <div>
        <p style={{ fontFamily: F, fontSize: 14, color: WRONG, marginBottom: 8 }}>
          Couldn’t load rhythm files.
        </p>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY }}>{error}</p>
      </div>
    )
  }
  if (pool === null) {
    return <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: 0 }}>Loading rhythms…</p>
  }

  const piece = pool[idx]

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 4 · Write the counts on real rhythms
      </p>
      <ProgressBar done={idx} total={pool.length} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, lineHeight: 1.65, margin: '0 0 12px' }}>
        Under each note, type the counts it holds. A quarter holds{' '}
        <strong style={{ color: DARK }}>N+</strong>, a half holds{' '}
        <strong style={{ color: DARK }}>N+N+</strong>, and counting runs continuously from{' '}
        <strong style={{ color: ACCENT }}>1</strong> through the top number of the time signature,
        resetting each measure. Rests don’t need a count.
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '12px 0', marginBottom: 16 }}>
        <OsmdRhythmCounts
          key={piece.src}
          src={piece.src}
          expected={piece.expected}
          inputs={inputs}
          onChangeInput={setInput}
          disabled={feedback !== null}
          feedback={feedback?.matches ?? null}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={check} disabled={feedback !== null}
          style={{ background: 'var(--oxblood)', color: '#FDFBF5', border: '1px solid var(--oxblood)', borderRadius: 10,
            padding: '12px 28px', fontFamily: F, fontSize: 14,
            cursor: feedback !== null ? 'default' : 'pointer', opacity: feedback !== null ? 0.6 : 1 }}>
          Check answers
        </button>
        {feedback !== null && (
          <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600,
            color: feedback.ok ? CORRECT : WRONG }}>
            {feedback.ok ? '✓ All correct' : 'Keep reviewing…'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4']

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
      <ExerciseNavBar canBack={canGoBack} canForward={canGoForward}
        onBack={back} onForward={forward} />
      {phase === 'ex1' && <FactsEx            key={keyN} onDone={scored} />}
      {phase === 'ex2' && <HowManyBeatsEx     key={keyN} onDone={scored} />}
      {phase === 'ex3' && <WriteCountsEx      key={keyN} onDone={scored} />}
      {phase === 'ex4' && <WriteCountsMxlEx   key={keyN} onDone={scored} />}
    </div>
  )
}
