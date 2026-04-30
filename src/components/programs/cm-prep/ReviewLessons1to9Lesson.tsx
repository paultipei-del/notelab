'use client'

import { useState, useRef, useMemo } from 'react'
import {
  MAJOR_PATTERNS, MINOR_PATTERNS, type MinorKey,
  PatternKeyboard,
} from './visuals/PatternDiagrams'
import { ExerciseNavBar } from './nav/ExerciseNavBar'

const F       = 'var(--font-jost), sans-serif'
const DARK    = '#1A1A18'
const GREY    = '#B0ACA4'
const ACCENT  = '#BA7517'
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'
const STROKE  = 1.3

// ── Staff geometry (standard CM Prep card) ──────────────────────────────────
const step = 8
const sL   = 32
const sR   = 360
const tTop = 54
const svgW = sR + 16
const svgH = tTop + 8 * step + 54

function posToY(pos: number) { return tTop + (10 - pos) * step }
function lineY(n: number)    { return tTop + (5 - n) * 2 * step }

// ── Types ─────────────────────────────────────────────────────────────────
type Clef = 'treble' | 'bass'
type AccType = 'flat' | 'sharp' | 'natural'
type Mode = 'major' | 'minor'
type Key = MinorKey // C, F, G, D

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

// ── Shared SVG primitives ─────────────────────────────────────────────────
function StaffBase() {
  return (
    <>
      {[1, 2, 3, 4, 5].map(n => (
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
function AccidentalGlyph({ cx, cy, acc, color = DARK }: { cx: number; cy: number; acc: AccType; color?: string }) {
  const glyph = acc === 'flat' ? '\uE260' : acc === 'sharp' ? '\uE262' : '\uE261'
  return (
    <text x={cx - 20} y={cy} fontFamily="Bravura, serif" fontSize={48}
      fill={color} textAnchor="middle" dominantBaseline="central">{glyph}</text>
  )
}

// ── Letter helpers for treble/bass positions ──────────────────────────────
// Treble: pos 0 = C4 (below staff), pos 2 = E4 (line 1), ... pos 12 = A5
// Bass:   pos 0 = E2 (below staff), pos 2 = G2 (line 1), ... pos 12 = C4 (middle C)
const TREBLE_LETTERS = ['C','D','E','F','G','A','B','C','D','E','F','G','A']
const BASS_LETTERS   = ['E','F','G','A','B','C','D','E','F','G','A','B','C']

function letterAt(clef: Clef, pos: number): string {
  return (clef === 'treble' ? TREBLE_LETTERS : BASS_LETTERS)[pos]
}

// ── Ex 1: Complete the grand staff ────────────────────────────────────────
const MISSING_POOL = [
  { id: 'brace',      answer: 'Brace',       opts: ['Brace', 'Bass Clef', 'Double Bar', 'Treble Clef'] },
  { id: 'treble',     answer: 'Treble Clef', opts: ['Treble Clef', 'Brace', 'Double Bar', 'Left Bar'] },
  { id: 'bass',       answer: 'Bass Clef',   opts: ['Brace', 'Bass Clef', 'Treble Clef', 'Double Bar'] },
  { id: 'double-bar', answer: 'Double Bar',  opts: ['Double Bar', 'Brace', 'Bass Clef', 'Left Bar'] },
  { id: 'connector',  answer: 'Left Bar',    opts: ['Left Bar', 'Brace', 'Treble Clef', 'Double Bar'] },
] as const

type MissingId = typeof MISSING_POOL[number]['id']

function MissingStaff({ missing, revealColor }: { missing: MissingId; revealColor?: string }) {
  const gStep = 6, gSL = 28, gSR = 170, gTT = 22
  const gBT = gTT + 8 * gStep + 40
  const gBB = gBT + 8 * gStep
  const H = gBB + 14
  function gLineY(n: number) { return gTT + (5 - n) * 2 * gStep }
  function gBLineY(n: number) { return gBT + (5 - n) * 2 * gStep }
  const trebleY = gTT + 6 * gStep
  const bassY   = gBT + 2 * gStep + 1
  return (
    <svg viewBox={`0 0 ${gSR + 12} ${H}`} width="100%" style={{ maxWidth: gSR + 12, display: 'block', margin: '0 auto' }}>
      {[1,2,3,4,5].map(n => <line key={'t'+n} x1={gSL} y1={gLineY(n)} x2={gSR} y2={gLineY(n)} stroke={DARK} strokeWidth={1.1} />)}
      {[1,2,3,4,5].map(n => <line key={'b'+n} x1={gSL} y1={gBLineY(n)} x2={gSR} y2={gBLineY(n)} stroke={DARK} strokeWidth={1.1} />)}
      {missing !== 'connector' && <line x1={gSL} y1={gTT} x2={gSL} y2={gBB} stroke={DARK} strokeWidth={1.8} />}
      {missing !== 'brace' && (
        <text x={gSL - 8} y={gBB} fontSize={gBB - gTT}
          fontFamily="Bravura, serif" fill={DARK} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
      )}
      {missing !== 'treble' && (
        <text x={gSL + 5} y={trebleY} fontFamily="Bravura, serif" fontSize={50} fill={DARK} dominantBaseline="auto">𝄞</text>
      )}
      {missing !== 'bass' && (
        <text x={gSL + 5} y={bassY} fontFamily="Bravura, serif" fontSize={50} fill={DARK} dominantBaseline="auto">𝄢</text>
      )}
      {missing !== 'double-bar' && (
        <>
          <line x1={gSR - 7} y1={gTT} x2={gSR - 7} y2={gBB} stroke={DARK} strokeWidth={1.1} />
          <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={DARK} strokeWidth={5} />
        </>
      )}
      {!revealColor ? null : (
        missing === 'connector' ? (
          <line x1={gSL} y1={gTT} x2={gSL} y2={gBB} stroke={revealColor} strokeWidth={2.5} />
        ) : missing === 'brace' ? (
          <text x={gSL - 8} y={gBB} fontSize={gBB - gTT}
            fontFamily="Bravura, serif" fill={revealColor} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
        ) : missing === 'treble' ? (
          <text x={gSL + 5} y={trebleY} fontFamily="Bravura, serif" fontSize={50} fill={revealColor} dominantBaseline="auto">𝄞</text>
        ) : missing === 'bass' ? (
          <text x={gSL + 5} y={bassY} fontFamily="Bravura, serif" fontSize={50} fill={revealColor} dominantBaseline="auto">𝄢</text>
        ) : missing === 'double-bar' ? (
          <>
            <line x1={gSR - 7} y1={gTT} x2={gSR - 7} y2={gBB} stroke={revealColor} strokeWidth={1.1} />
            <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={revealColor} strokeWidth={5} />
          </>
        ) : null
      )}
    </svg>
  )
}

function CompleteStaffEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled([...MISSING_POOL]), [])
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
        setIdx(i => i + 1)
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1200 : 2200)
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 1 — Complete the grand staff
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        One element is missing from the grand staff below. What is it?
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '20px 0', marginBottom: 14 }}>
        <MissingStaff missing={item.id}
          revealColor={feedback !== null ? (feedback.ok ? CORRECT : WRONG) : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {item.opts.map(opt => {
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
                fontFamily: F, fontSize: 15, fontWeight: 500,
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
          <>The missing part is the <strong style={{ color: CORRECT }}>{item.answer}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Ex 2: Name the note (treble + bass mixed, with accidentals) ───────────
interface NameNoteItem { clef: Clef; pos: number; acc?: AccType }

const NAME_NOTE_POOL: NameNoteItem[] = [
  { clef: 'treble', pos: 2 },
  { clef: 'treble', pos: 4 },
  { clef: 'treble', pos: 6 },
  { clef: 'treble', pos: 7 },
  { clef: 'treble', pos: 9 },
  { clef: 'treble', pos: 3, acc: 'sharp' },
  { clef: 'treble', pos: 6, acc: 'flat'  },
  { clef: 'treble', pos: 4, acc: 'sharp' },
  { clef: 'treble', pos: 8, acc: 'flat'  },
  { clef: 'bass',   pos: 2 },
  { clef: 'bass',   pos: 5 },
  { clef: 'bass',   pos: 7 },
  { clef: 'bass',   pos: 10 },
  { clef: 'bass',   pos: 6, acc: 'flat'  },
  { clef: 'bass',   pos: 8, acc: 'sharp' },
  { clef: 'bass',   pos: 11, acc: 'flat' },
]

function accSymbol(acc?: AccType): string {
  return acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : ''
}

function NameNoteEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(NAME_NOTE_POOL).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const answer = letterAt(item.clef, item.pos) + accSymbol(item.acc)
  const letter = letterAt(item.clef, item.pos)

  // Build 4 options: the answer + 3 distractors from nearby letters
  const options = useMemo<string[]>(() => {
    const letters = ['A','B','C','D','E','F','G']
    const letterIdx = letters.indexOf(letter)
    const near = [
      letters[(letterIdx + 1) % 7],
      letters[(letterIdx + 6) % 7],
    ]
    const distractors = new Set<string>()
    if (item.acc) {
      distractors.add(letter)                         // same letter, no acc
      distractors.add(letter + (item.acc === 'sharp' ? '♭' : '♯'))  // opposite acc
      distractors.add(near[0])
    } else {
      distractors.add(near[0])
      distractors.add(near[1])
      distractors.add(letters[(letterIdx + 2) % 7])
    }
    const opts = [answer, ...Array.from(distractors).filter(d => d !== answer).slice(0, 3)]
    return shuffled(opts)
  }, [idx, answer, letter, item.acc])

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
    }, ok ? 1000 : 1800)
  }

  const cx = (sL + sR) / 2
  const cy = posToY(item.pos)
  const isLedger = (item.clef === 'treble' && item.pos === 0) ||
                   (item.clef === 'bass' && (item.pos === 0 || item.pos === 12))

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 2 — Name the note
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '10px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'}
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 14 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            userSelect: 'none', WebkitUserSelect: 'none' }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {isLedger && <LedgerLine cx={cx} cy={cy} />}
          {item.acc && <AccidentalGlyph cx={cx} cy={cy} acc={item.acc} />}
          <BravuraNote cx={cx} cy={cy} />
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {options.map(opt => {
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
                padding: '12px 8px', borderRadius: 10,
                border: `1.5px solid ${border}`, background: bg, color,
                fontFamily: F, fontSize: 16, fontWeight: 600,
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
          <>The answer is <strong style={{ color: CORRECT }}>{answer}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Ex 3: Steps on the staff (whole or half) ──────────────────────────────
interface StepItem {
  clef: Clef
  pos1: number; pos2: number
  acc1?: AccType; acc2?: AccType
  type: 'H' | 'W'
}

const STEP_POOL: StepItem[] = [
  // Half steps (treble)
  { clef: 'treble', pos1: 2, pos2: 3, type: 'H' },           // E→F
  { clef: 'treble', pos1: 6, pos2: 7, type: 'H' },           // B→C
  { clef: 'treble', pos1: 3, pos2: 4, acc1: 'sharp', type: 'H' }, // F♯→G
  { clef: 'treble', pos1: 5, pos2: 6, acc2: 'flat', type: 'H' },  // A→B♭
  // Whole steps (treble)
  { clef: 'treble', pos1: 1, pos2: 2, type: 'W' },           // D→E
  { clef: 'treble', pos1: 3, pos2: 4, type: 'W' },           // F→G
  { clef: 'treble', pos1: 4, pos2: 5, type: 'W' },           // G→A
  { clef: 'treble', pos1: 2, pos2: 3, acc2: 'sharp', type: 'W' }, // E→F♯
  // Half steps (bass)
  { clef: 'bass',   pos1: 4, pos2: 5, type: 'H' },           // B→C
  { clef: 'bass',   pos1: 7, pos2: 8, type: 'H' },           // E→F
  { clef: 'bass',   pos1: 6, pos2: 7, acc1: 'sharp', type: 'H' }, // D♯→E
  // Whole steps (bass)
  { clef: 'bass',   pos1: 5, pos2: 6, type: 'W' },           // C→D
  { clef: 'bass',   pos1: 8, pos2: 9, type: 'W' },           // F→G
  { clef: 'bass',   pos1: 3, pos2: 4, type: 'W' },           // A→B
]

function StepsEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(STEP_POOL).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const answer = item.type === 'H' ? 'Half step' : 'Whole step'

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
    }, ok ? 1000 : 1800)
  }

  const cx1 = sL + 110
  const cx2 = sL + 210
  const cy1 = posToY(item.pos1)
  const cy2 = posToY(item.pos2)
  const ledger1 = (item.clef === 'treble' && item.pos1 === 0) ||
                  (item.clef === 'bass' && (item.pos1 === 0 || item.pos1 === 12))
  const ledger2 = (item.clef === 'treble' && item.pos2 === 0) ||
                  (item.clef === 'bass' && (item.pos2 === 0 || item.pos2 === 12))

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 3 — Whole step or half step?
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Look at the two notes on the staff. Is the distance between them a{' '}
        <strong style={{ color: DARK }}>whole step</strong> or a{' '}
        <strong style={{ color: DARK }}>half step</strong>?
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 14 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            userSelect: 'none', WebkitUserSelect: 'none' }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {ledger1 && <LedgerLine cx={cx1} cy={cy1} />}
          {item.acc1 && <AccidentalGlyph cx={cx1} cy={cy1} acc={item.acc1} />}
          <BravuraNote cx={cx1} cy={cy1} />
          {ledger2 && <LedgerLine cx={cx2} cy={cy2} />}
          {item.acc2 && <AccidentalGlyph cx={cx2} cy={cy2} acc={item.acc2} />}
          <BravuraNote cx={cx2} cy={cy2} />
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        {['Half step', 'Whole step'].map(opt => {
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
                padding: '14px 12px', borderRadius: 10,
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
          <>This is a <strong style={{ color: CORRECT }}>{answer.toLowerCase()}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Ex 4: Name the interval ───────────────────────────────────────────────
interface IntervalItem { clef: Clef; pos1: number; pos2: number }

const INTERVAL_POOL: IntervalItem[] = [
  { clef: 'treble', pos1: 3, pos2: 5 },   // 3rd
  { clef: 'treble', pos1: 4, pos2: 5 },   // 2nd
  { clef: 'treble', pos1: 1, pos2: 4 },   // 4th
  { clef: 'treble', pos1: 2, pos2: 6 },   // 5th
  { clef: 'treble', pos1: 6, pos2: 8 },   // 3rd
  { clef: 'treble', pos1: 7, pos2: 11 },  // 5th
  { clef: 'bass',   pos1: 2, pos2: 4 },   // 3rd
  { clef: 'bass',   pos1: 3, pos2: 7 },   // 5th
  { clef: 'bass',   pos1: 5, pos2: 6 },   // 2nd
  { clef: 'bass',   pos1: 6, pos2: 9 },   // 4th
  { clef: 'bass',   pos1: 8, pos2: 10 },  // 3rd
]

function intervalNumber(pos1: number, pos2: number): number {
  return Math.abs(pos2 - pos1) + 1
}

function IntervalEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(INTERVAL_POOL).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const n = intervalNumber(item.pos1, item.pos2)
  const answer = `${n === 2 ? '2nd' : n === 3 ? '3rd' : n === 4 ? '4th' : '5th'}`

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
    }, ok ? 1000 : 1800)
  }

  const cx1 = sL + 110
  const cx2 = sL + 210
  const cy1 = posToY(item.pos1)
  const cy2 = posToY(item.pos2)
  const ledger = (pos: number) =>
    (item.clef === 'treble' && pos === 0) ||
    (item.clef === 'bass' && (pos === 0 || pos === 12))

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 4 — Name the interval
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Count from the lower note up to the higher one, including both. Pick the matching interval.
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 14 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            userSelect: 'none', WebkitUserSelect: 'none' }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {ledger(item.pos1) && <LedgerLine cx={cx1} cy={cy1} />}
          <BravuraNote cx={cx1} cy={cy1} />
          {ledger(item.pos2) && <LedgerLine cx={cx2} cy={cy2} />}
          <BravuraNote cx={cx2} cy={cy2} />
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {['2nd', '3rd', '4th', '5th'].map(opt => {
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
                padding: '14px 8px', borderRadius: 10,
                border: `1.5px solid ${border}`, background: bg, color,
                fontFamily: F, fontSize: 16, fontWeight: 600,
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
          <>This is a <strong style={{ color: CORRECT }}>{answer}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Ex 5: Name the 5-finger pattern (major or minor) ──────────────────────
const PATTERN_LETTERS: Record<Key, Record<Mode, { letter: string; acc?: AccType }[]>> = {
  C: {
    major: [{letter:'C'},{letter:'D'},{letter:'E'},{letter:'F'},{letter:'G'}],
    minor: [{letter:'C'},{letter:'D'},{letter:'E',acc:'flat'},{letter:'F'},{letter:'G'}],
  },
  F: {
    major: [{letter:'F'},{letter:'G'},{letter:'A'},{letter:'B',acc:'flat'},{letter:'C'}],
    minor: [{letter:'F'},{letter:'G'},{letter:'A',acc:'flat'},{letter:'B',acc:'flat'},{letter:'C'}],
  },
  G: {
    major: [{letter:'G'},{letter:'A'},{letter:'B'},{letter:'C'},{letter:'D'}],
    minor: [{letter:'G'},{letter:'A'},{letter:'B',acc:'flat'},{letter:'C'},{letter:'D'}],
  },
  D: {
    major: [{letter:'D'},{letter:'E'},{letter:'F',acc:'sharp'},{letter:'G'},{letter:'A'}],
    minor: [{letter:'D'},{letter:'E'},{letter:'F'},{letter:'G'},{letter:'A'}],
  },
}

const PATTERN_POSITIONS: Record<Key, Record<Clef, number[]>> = {
  C: { treble: [0,1,2,3,4], bass: [5,6,7,8,9] },
  F: { treble: [3,4,5,6,7], bass: [1,2,3,4,5] },
  G: { treble: [4,5,6,7,8], bass: [2,3,4,5,6] },
  D: { treble: [1,2,3,4,5], bass: [6,7,8,9,10] },
}

interface PatternItem { clef: Clef; key: Key; mode: Mode }

const PATTERN_POOL: PatternItem[] = (['C','F','G','D'] as Key[]).flatMap(key =>
  (['major','minor'] as Mode[]).flatMap(mode =>
    (['treble','bass'] as Clef[]).map(clef => ({ clef, key, mode }))
  )
)

function PatternNameEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffled(PATTERN_POOL).slice(0, 6), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const answer = `${item.key} ${item.mode}`

  const options = useMemo(() =>
    shuffled((['C','F','G','D'] as Key[]).flatMap(k =>
      (['major','minor'] as Mode[]).map(m => `${k} ${m}`)
    )),
    [idx]
  )

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
    }, ok ? 1200 : 2200)
  }

  const positions = PATTERN_POSITIONS[item.key][item.clef]
  const letters = PATTERN_LETTERS[item.key][item.mode]
  const xs = positions.map((_, i) =>
    90 + (i + 0.5) * ((sR - 18 - 90) / positions.length)
  )

  // Keyboard reveal after feedback
  const p = item.mode === 'major' ? MAJOR_PATTERNS[item.key] : MINOR_PATTERNS[item.key]
  const triad = [p.notes[0], p.notes[2], p.notes[4]]

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 5 — Name the five-finger pattern
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Read the five notes. Name the tonic letter and pick{' '}
        <strong style={{ color: DARK }}>major</strong> or <strong style={{ color: DARK }}>minor</strong>.
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 14 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            userSelect: 'none', WebkitUserSelect: 'none' }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {positions.map((pos, i) => {
            const cx = xs[i]
            const cy = posToY(pos)
            const isLedger = (item.clef === 'treble' && pos === 0) ||
                             (item.clef === 'bass' && (pos === 0 || pos === 12))
            return (
              <g key={i}>
                {isLedger && <LedgerLine cx={cx} cy={cy} />}
                {letters[i].acc && <AccidentalGlyph cx={cx} cy={cy} acc={letters[i].acc!} />}
                <BravuraNote cx={cx} cy={cy} />
              </g>
            )
          })}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {options.map(opt => {
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
          const [letter, modeWord] = opt.split(' ')
          return (
            <button key={opt} onClick={() => pick(opt)}
              disabled={locked}
              style={{
                padding: '10px 8px', borderRadius: 10,
                border: `1.5px solid ${border}`, background: bg, color,
                fontFamily: F, fontSize: 14, fontWeight: 500,
                cursor: locked ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
              <span style={{ fontWeight: 700 }}>{letter}</span>
              <span style={{ fontSize: 11, opacity: 0.85 }}>{modeWord}</span>
            </button>
          )
        })}
      </div>

      {/* Keyboard reveal when correct */}
      {feedback !== null && feedback.ok && (
        <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
          padding: '10px 12px', marginTop: 4, marginBottom: 10 }}>
          <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: GREY, margin: '0 0 6px' }}>
            {item.key} {item.mode} on the keyboard
          </p>
          <PatternKeyboard pattern={p.notes} triadSet={new Set(triad)} patternLetters={p.letters} />
        </div>
      )}

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct'}
        {feedback !== null && !feedback.ok && (
          <>The answer is <strong style={{ color: CORRECT }}>{answer}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4' | 'ex5'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5']

export default function ReviewLessons1to9Lesson({
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
      {phase === 'ex1' && <CompleteStaffEx key={keyN} onDone={scored} />}
      {phase === 'ex2' && <NameNoteEx      key={keyN} onDone={scored} />}
      {phase === 'ex3' && <StepsEx         key={keyN} onDone={scored} />}
      {phase === 'ex4' && <IntervalEx      key={keyN} onDone={scored} />}
      {phase === 'ex5' && <PatternNameEx   key={keyN} onDone={scored} />}
    </div>
  )
}
