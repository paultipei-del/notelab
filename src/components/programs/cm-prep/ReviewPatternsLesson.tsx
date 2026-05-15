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
const ACCENT  = '#BA7517'   // amber (matches review accent in the page chrome)
const MAJ_C   = '#2A5C0A'
const MIN_C   = '#3B6DB5'
const CORRECT = '#2d5a3e'
const WRONG   = '#a0381c'
const STROKE  = 1.3

// ── Staff geometry (standard CM Prep card dimensions) ───────────────────────
const step = 8
const sL   = 32
const sR   = 360
const tTop = 54
const svgW = sR + 16
const svgH = tTop + 8 * step + 54

function posToY(pos: number) { return tTop + (10 - pos) * step }
function lineY(n: number)    { return tTop + (5 - n) * 2 * step }

// ── Shared data ────────────────────────────────────────────────────────────
type Mode = 'major' | 'minor'
type Key = MinorKey            // 'C' | 'F' | 'G' | 'D'
type Clef = 'treble' | 'bass'
type AccType = 'flat' | 'sharp' | 'natural'

interface StaffNote { pos: number; letter: string; acc?: AccType }

const LETTER_BASE: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}
function accShift(acc: AccType | undefined): number {
  return acc === 'sharp' ? 1 : acc === 'flat' ? -1 : 0
}

// Pattern letter+acc data (derived from MAJOR_PATTERNS/MINOR_PATTERNS)
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

// Staff positions for each pattern per clef (5 positions, ascending)
const PATTERN_POSITIONS: Record<Key, Record<Clef, number[]>> = {
  C: { treble: [0,1,2,3,4], bass: [5,6,7,8,9] },
  F: { treble: [3,4,5,6,7], bass: [1,2,3,4,5] },
  G: { treble: [4,5,6,7,8], bass: [2,3,4,5,6] },
  D: { treble: [1,2,3,4,5], bass: [6,7,8,9,10] },
}

function patternNotes(key: Key, mode: Mode, clef: Clef): StaffNote[] {
  const positions = PATTERN_POSITIONS[key][clef]
  const letters = PATTERN_LETTERS[key][mode]
  return positions.map((pos, i) => ({ pos, letter: letters[i].letter, acc: letters[i].acc }))
}

function triadNotes(key: Key, mode: Mode, clef: Clef): StaffNote[] {
  const all = patternNotes(key, mode, clef)
  return [all[0], all[2], all[4]]
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

// ── SVG primitives ─────────────────────────────────────────────────────────
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

// ── Keyboard reference card (shows a pattern + triad on the 2-octave keyboard)
function KeyboardReference({ keyProp, modeProp, faded = false, label }:
  { keyProp: Key; modeProp: Mode; faded?: boolean; label?: string }) {
  const p = modeProp === 'major' ? MAJOR_PATTERNS[keyProp] : MINOR_PATTERNS[keyProp]
  const triad = [p.notes[0], p.notes[2], p.notes[4]]
  return (
    <div style={{
      background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
      padding: '10px 12px', marginTop: 14,
      opacity: faded ? 0.55 : 1,
    }}>
      {label && (
        <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: GREY, margin: '0 0 6px' }}>{label}</p>
      )}
      <PatternKeyboard pattern={p.notes} triadSet={new Set(triad)} patternLetters={p.letters} />
    </div>
  )
}

// ── Ex 1: Identify the pattern on the staff ─────────────────────────────────
interface Ex1Item { clef: Clef; key: Key; mode: Mode }

const EX1_POOL: Ex1Item[] = (['C','F','G','D'] as Key[]).flatMap(key =>
  (['major','minor'] as Mode[]).flatMap(mode =>
    (['treble','bass'] as Clef[]).map(clef => ({ clef, key, mode }))
  )
)

const EX1_PATTERN_X_START = 90
const EX1_PATTERN_X_END   = sR - 18

function NamePatternEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo(() => shuffled(EX1_POOL).slice(0, 6), [])
  const total = items.length

  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const notes = patternNotes(item.key, item.mode, item.clef)
  const xs = notes.map((_, i) =>
    EX1_PATTERN_X_START + (i + 0.5) * ((EX1_PATTERN_X_END - EX1_PATTERN_X_START) / notes.length)
  )

  const answer = `${item.key} ${item.mode}`

  function pickOption(opt: string) {
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
    }, ok ? 1400 : 2400)
  }

  const options = useMemo(() =>
    shuffled((['C','F','G','D'] as Key[]).flatMap(k =>
      (['major','minor'] as Mode[]).map(m => `${k} ${m}`)
    )),
    [idx] // reshuffle per question
  )

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 1 · Name each pattern
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Read the five notes on the staff. Give the letter of the tonic and pick{' '}
        <strong style={{ color: MAJ_C }}>major</strong> or{' '}
        <strong style={{ color: MIN_C }}>minor</strong>.
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 14 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{
            maxWidth: svgW, display: 'block', margin: '0 auto',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
          }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {notes.map((n, i) => {
            const cx = xs[i]
            const cy = posToY(n.pos)
            const isLedger = (item.clef === 'treble' && n.pos === 0) ||
                             (item.clef === 'bass' && (n.pos === 0 || n.pos === 12))
            return (
              <g key={i}>
                {isLedger && <LedgerLine cx={cx} cy={cy} />}
                {n.acc && <AccidentalGlyph cx={cx} cy={cy} acc={n.acc} />}
                <BravuraNote cx={cx} cy={cy} />
              </g>
            )
          })}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
        marginBottom: 12 }}>
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
            <button key={opt} onClick={() => pickOption(opt)}
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

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: '10px 0 0', minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct'}
        {feedback !== null && !feedback.ok && (
          <>The answer is <strong style={{ color: CORRECT }}>{answer}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Ex 2: Write the pattern + triad (two sub-steps: pattern, then triad) ──
interface Ex2Item { clef: Clef; key: Key; mode: Mode }

const EX2_POOL: Ex2Item[] = (['C','F','G','D'] as Key[]).flatMap(key =>
  (['major','minor'] as Mode[]).flatMap(mode =>
    (['treble','bass'] as Clef[]).map(clef => ({ clef, key, mode }))
  )
)

type Ex2SubStep = 'pattern' | 'triad'

// Wider staff for Ex 2 so the 5-note pattern and triad breathe, with a bar line between them.
const EX2_SL     = sL            // 32
const EX2_SR     = 488
const EX2_SVG_W  = EX2_SR + 16
const EX2_PATTERN_XS = [110, 170, 230, 290, 350]
const EX2_BAR_X      = 395
const EX2_TRIAD_X    = 440

function WritePatternEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo(() => shuffled(EX2_POOL).slice(0, 4), [])
  const total = items.length

  const [idx,          setIdx]          = useState(0)
  const [subStep,      setSubStep]      = useState<Ex2SubStep>('pattern')
  const [stagedNotes,  setStagedNotes]  = useState<Record<number, AccType | null>>({})
  const [lockedPattern, setLockedPattern] = useState<Record<number, AccType | null> | null>(null)
  const [pickedAcc,    setPickedAcc]    = useState<AccType | null>(null)
  const [feedback,     setFeedback]     = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const subCorrectRef = useRef(0)   // correct answers across sub-steps (denominator = total × 2)
  const lockedRef  = useRef(false)
  const svgRef     = useRef<SVGSVGElement | null>(null)

  const item = items[idx]
  const targetPattern = patternNotes(item.key, item.mode, item.clef)
  const targetTriad   = triadNotes(item.key, item.mode, item.clef)
  const expectedCount = subStep === 'pattern' ? targetPattern.length : targetTriad.length
  const placedCount = Object.keys(stagedNotes).length

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
    if (feedback !== null || lockedRef.current) return
    if (!svgRef.current) svgRef.current = e.currentTarget
    const pos = clientToPos(e.clientY)
    setStagedNotes(prev => {
      const hasNote = pos in prev
      const next = { ...prev }
      const capped = Object.keys(prev).length >= expectedCount
      if (!pickedAcc) {
        if (hasNote) { delete next[pos] }
        else {
          if (capped) return prev
          next[pos] = null
        }
      } else {
        if (hasNote) {
          next[pos] = prev[pos] === pickedAcc ? null : pickedAcc
        } else {
          if (capped) return prev
          next[pos] = pickedAcc
        }
      }
      return next
    })
  }

  function selectAcc(acc: AccType) {
    if (feedback !== null || lockedRef.current) return
    setPickedAcc(prev => prev === acc ? null : acc)
  }

  function onReset() {
    if (feedback !== null || lockedRef.current) return
    setStagedNotes({})
    setPickedAcc(null)
  }

  function matches(target: StaffNote[]): boolean {
    const stagedPositions = Object.keys(stagedNotes).map(Number)
    if (stagedPositions.length !== target.length) return false
    return target.every(n => {
      if (!(n.pos in stagedNotes)) return false
      const studentAcc = stagedNotes[n.pos] ?? null
      const targetAcc  = n.acc ?? null
      return studentAcc === targetAcc
    })
  }

  function onCheck() {
    if (feedback !== null || lockedRef.current || placedCount !== expectedCount) return
    lockedRef.current = true
    const target = subStep === 'pattern' ? targetPattern : targetTriad
    const ok = matches(target)
    if (ok) subCorrectRef.current += 1
    setFeedback({ ok })
    setTimeout(() => {
      if (!ok) {
        setFeedback(null); lockedRef.current = false
        return
      }
      // Correct → advance sub-step or question
      if (subStep === 'pattern') {
        // Move to triad with pattern locked in place
        setLockedPattern(stagedNotes)
        setStagedNotes({})
        setPickedAcc(null)
        setSubStep('triad')
        setFeedback(null); lockedRef.current = false
      } else {
        // Triad done → whole question correct
        correctRef.current += 1
        if (idx + 1 >= total) { onDone(subCorrectRef.current, total * 2); return }
        setIdx(i => i + 1)
        setSubStep('pattern')
        setStagedNotes({}); setLockedPattern(null)
        setPickedAcc(null)
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1200 : 2400)
  }

  const accBtn = (acc: AccType, glyph: string) => {
    const active = pickedAcc === acc
    return (
      <button key={acc} onClick={() => selectAcc(acc)}
        disabled={feedback !== null}
        aria-label={acc}
        style={{
          width: 48, height: 48, borderRadius: 10,
          border: `1.5px solid ${active ? DARK : '#D9CFAE'}`,
          background: active ? DARK : 'white',
          color: active ? 'white' : DARK,
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 28, lineHeight: 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
          cursor: feedback !== null ? 'default' : 'pointer',
        }}>
        {glyph}
      </button>
    )
  }

  const renderNote = (pos: number, acc: AccType | null, cx: number, color: string, opacity = 1) => {
    const cy = posToY(pos)
    const ledgerTreble = item.clef === 'treble' && pos === 0
    const ledgerBass   = item.clef === 'bass'   && (pos === 0 || pos === 12)
    return (
      <g key={`${pos}-${cx}`} opacity={opacity}>
        {(ledgerTreble || ledgerBass) &&
          <LedgerLine cx={cx} cy={cy} color={color} />}
        {acc && <AccidentalGlyph cx={cx} cy={cy} acc={acc} color={color} />}
        <BravuraNote cx={cx} cy={cy} color={color} />
      </g>
    )
  }

  // For the pattern sub-step, the 5 notes are placed at xs[i] in order of ascending pos
  // For the triad sub-step, the 3 notes all stack at EX2_TRIAD_X
  // Because staged uses `pos` as key, we map staged pos → x-position by sorting ascending.
  function xForStagedNote(pos: number, all: number[]): number {
    if (subStep === 'triad') return EX2_TRIAD_X
    const sorted = [...all].sort((a, b) => a - b)
    const i = sorted.indexOf(pos)
    return EX2_PATTERN_XS[i] ?? EX2_PATTERN_XS[EX2_PATTERN_XS.length - 1]
  }

  const stagedPositions = Object.keys(stagedNotes).map(Number)
  const lockedPositions = lockedPattern ? Object.keys(lockedPattern).map(Number) : []

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 2 · Write the pattern + triad
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '10px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} · write the{' '}
        <strong style={{ color: ACCENT }}>{item.key} {item.mode}{' '}
        {subStep === 'pattern' ? 'pattern (5 notes)' : 'triad (3 notes, stacked)'}</strong>
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 14 }}>
        <svg
          ref={r => { svgRef.current = r }}
          viewBox={`0 0 ${EX2_SVG_W} ${svgH}`} width="100%"
          onClick={onStaffClick}
          style={{
            maxWidth: EX2_SVG_W, display: 'block', margin: '0 auto',
            cursor: feedback !== null ? 'default' : 'crosshair',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
          }}>
          {/* Wider staff lines for Ex 2 */}
          {[1, 2, 3, 4, 5].map(n => (
            <line key={n} x1={EX2_SL} y1={lineY(n)} x2={EX2_SR} y2={lineY(n)}
              stroke={DARK} strokeWidth={STROKE} />
          ))}
          <line x1={EX2_SL} y1={tTop} x2={EX2_SL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={EX2_BAR_X} y1={tTop} x2={EX2_BAR_X} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {/* Double bar line at the end */}
          <line x1={EX2_SR - 5} y1={tTop} x2={EX2_SR - 5} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <line x1={EX2_SR} y1={tTop} x2={EX2_SR} y2={lineY(1)} stroke={DARK} strokeWidth={2.5} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}

          {/* Locked pattern from sub-step 1 (rendered faded) */}
          {lockedPattern && lockedPositions.map(pos => {
            const sorted = [...lockedPositions].sort((a, b) => a - b)
            const i = sorted.indexOf(pos)
            const cx = EX2_PATTERN_XS[i] ?? EX2_PATTERN_XS[EX2_PATTERN_XS.length - 1]
            return renderNote(pos, lockedPattern[pos], cx, DARK, 0.45)
          })}

          {/* Staged ghost noteheads */}
          {!feedback && stagedPositions.map(pos =>
            renderNote(pos, stagedNotes[pos], xForStagedNote(pos, stagedPositions), ACCENT, 0.55))}

          {/* Committed result */}
          {feedback && stagedPositions.map(pos =>
            renderNote(pos, stagedNotes[pos], xForStagedNote(pos, stagedPositions),
              feedback.ok ? CORRECT : WRONG))}

          {/* Correct hint on wrong answer */}
          {feedback && !feedback.ok && (subStep === 'pattern' ? targetPattern : targetTriad).map((n, i) => {
            const cx = subStep === 'triad' ? EX2_TRIAD_X : EX2_PATTERN_XS[i]
            return (
              <g key={`hint-${i}`} opacity={0.4}>
                {renderNote(n.pos, n.acc ?? null, cx, CORRECT, 1)}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Accidental pad + Check */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center',
        marginBottom: 12, flexWrap: 'wrap' }}>
        {accBtn('flat', '\u266D')}
        {accBtn('natural', '\u266E')}
        {accBtn('sharp', '\u266F')}
        <div style={{ width: 1, height: 28, background: '#D9CFAE', margin: '0 4px' }} />
        <button onClick={onReset}
          disabled={feedback !== null}
          style={{
            padding: '10px 16px', borderRadius: 10,
            border: '1.5px solid #D9CFAE', background: 'white',
            color: GREY, fontFamily: F, fontSize: 14,
            cursor: feedback !== null ? 'default' : 'pointer',
          }}>
          Reset
        </button>
        <button onClick={onCheck}
          disabled={feedback !== null || placedCount !== expectedCount}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 15, fontWeight: 600,
            cursor: feedback !== null || placedCount !== expectedCount ? 'default' : 'pointer',
            background: feedback !== null || placedCount !== expectedCount ? '#EDE8DF' : DARK,
            color: feedback !== null || placedCount !== expectedCount ? '#B0ACA4' : 'white',
          }}>
          Check ({placedCount}/{expectedCount})
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: '0 0 8px', lineHeight: 1.6 }}>
        Tap the staff to place a notehead. Pick an accidental, then tap a note to apply it.
      </p>

      {/* Keyboard reference · shows the target pattern + triad lit up */}
      <KeyboardReference
        key={`kb-${item.key}-${item.mode}`}
        keyProp={item.key} modeProp={item.mode}
        label="Keyboard reference"
      />

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: '10px 0 0', minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && subStep === 'pattern' && '✓ Pattern correct · now write the triad.'}
        {feedback !== null && feedback.ok && subStep === 'triad' && '✓ Triad correct.'}
        {feedback !== null && !feedback.ok && 'Not quite · the correct answer is shown in green.'}
      </p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2']

export default function ReviewPatternsLesson({
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
      <ExerciseNavBar canBack={canGoBack} canForward={canGoForward}
        onBack={back} onForward={forward} />
      {phase === 'ex1' && <NamePatternEx  key={key} onDone={scored} />}
      {phase === 'ex2' && <WritePatternEx key={key} onDone={scored} />}
    </div>
  )
}
