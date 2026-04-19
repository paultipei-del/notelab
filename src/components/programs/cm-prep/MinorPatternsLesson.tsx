'use client'

import { useState, useRef, useMemo } from 'react'
import {
  MAJOR_PATTERNS, MINOR_PATTERNS, minorTriadFor, type MinorKey, type MajorKey,
  PatternKeyboard,
} from './visuals/PatternDiagrams'

const F       = 'var(--font-jost), sans-serif'
const SERIF   = 'var(--font-cormorant), serif'
const DARK    = '#1A1A18'
const GREY    = '#B0ACA4'
const ACCENT  = '#3B6DB5'   // blue — matches MIN_C in PatternDiagrams
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'
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

const KEYS: MinorKey[] = ['C', 'F', 'G', 'D']

// ── Ex 1: Build the minor pattern + triad on the keyboard ────────────────────
type Ex1SubStep = 'pattern' | 'triad'

function BuildKeyboardEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo<MinorKey[]>(() => shuffled(KEYS), [])
  const total = items.length
  const totalSteps = total * 2

  const [idx,               setIdx]               = useState(0)
  const [subStep,           setSubStep]           = useState<Ex1SubStep>('pattern')
  const [selectedPattern,   setSelectedPattern]   = useState<Set<number>>(new Set())
  const [selectedTriad,     setSelectedTriad]     = useState<Set<number>>(new Set())
  const [committedPattern,  setCommittedPattern]  = useState<number[] | null>(null)
  const [feedback, setFeedback] = useState<{ step: Ex1SubStep; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const key = items[idx]
  // Allow the pattern to be built in either octave the student picks.
  // The keyboard shows two octaves (chromatic 0..24), so if the shifted copy
  // fits, it's also a valid answer.
  const basePattern = MINOR_PATTERNS[key].notes
  const candidates: number[][] = useMemo(() => {
    const opts = [basePattern]
    const shifted = basePattern.map(n => n + 12)
    if (shifted.every(n => n >= 0 && n <= 24)) opts.push(shifted)
    return opts
  // basePattern changes each item via idx → listing idx as dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])
  // Which concrete pattern the student committed (locks the octave for the triad step)
  const committedSet = new Set(committedPattern ?? basePattern)

  function toggleKey(c: number) {
    if (feedback !== null || lockedRef.current) return
    if (subStep === 'pattern') {
      setSelectedPattern(prev => {
        const next = new Set(prev)
        if (next.has(c)) next.delete(c); else next.add(c)
        return next
      })
    } else {
      if (!committedSet.has(c)) return   // triad must be inside the committed pattern
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
    // Match against any valid octave; remember which one so the triad step
    // knows the exact keys that count.
    const match = candidates.find(c => setsEqual(selectedPattern, new Set(c))) ?? null
    const ok = match !== null
    if (ok) {
      correctRef.current += 1
      setCommittedPattern(match)
    }
    setFeedback({ step: 'pattern', ok })
    setTimeout(() => {
      if (ok) { setSubStep('triad'); setFeedback(null); lockedRef.current = false }
      else    { setSelectedPattern(new Set()); setFeedback(null); lockedRef.current = false }
    }, ok ? 1100 : 2000)
  }

  function checkTriad() {
    if (feedback !== null || lockedRef.current || !committedPattern) return
    lockedRef.current = true
    const correctTriad = new Set([
      committedPattern[0], committedPattern[2], committedPattern[4],
    ])
    const ok = setsEqual(selectedTriad, correctTriad)
    if (ok) correctRef.current += 1
    setFeedback({ step: 'triad', ok })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, totalSteps); return }
        setIdx(i => i + 1)
        setSubStep('pattern')
        setSelectedPattern(new Set())
        setSelectedTriad(new Set())
        setCommittedPattern(null)
        setFeedback(null); lockedRef.current = false
      } else {
        setSelectedTriad(new Set()); setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1100 : 2000)
  }

  const patternArr = subStep === 'pattern'
    ? Array.from(selectedPattern)
    : (committedPattern ?? basePattern)
  const triadArr = subStep === 'triad' ? selectedTriad : new Set<number>()

  const confirmReady = subStep === 'pattern'
    ? selectedPattern.size === 5
    : selectedTriad.size === 3
  const onConfirm = subStep === 'pattern' ? checkPattern : checkTriad
  const label = subStep === 'pattern' ? 'five-finger pattern' : 'triad'

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 1 — Build the minor pattern and triad
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '10px' }}>
        {subStep === 'pattern'
          ? <>Tap the <strong style={{ color: ACCENT }}>5 keys</strong> of the{' '}
              <strong style={{ color: ACCENT }}>{key} minor</strong> five-finger pattern</>
          : <>Now tap the <strong style={{ color: '#BA7517' }}>3 keys</strong> of the{' '}
              <strong style={{ color: '#BA7517' }}>{key} minor triad</strong></>}
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
          Check {label}
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

// ── Ex 2: Match the minor pattern to its name ───────────────────────────────
function MatchPatternEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  // Two rounds of each key, shuffled → 8 items per session.
  const items = useMemo<MinorKey[]>(() => shuffled([...KEYS, ...KEYS]), [])
  const total = items.length

  const [idx,      setIdx]      = useState(0)
  const [chosen,   setChosen]   = useState<MinorKey | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const answer = items[idx]
  const pattern = MINOR_PATTERNS[answer].notes
  const triadSet = new Set(minorTriadFor(answer))

  function pick(k: MinorKey) {
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
        Exercise 2 — Match the five-finger pattern
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '12px' }}>
        Which minor five-finger pattern is highlighted?
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
              {k} minor
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && !feedback.ok && (
          <>Correct answer: <strong style={{ color: CORRECT }}>{answer} minor</strong></>
        )}
        {feedback !== null && feedback.ok && '✓ Correct'}
      </p>
    </div>
  )
}

// ── Ex 5: Match the minor triad to its name ──────────────────────────────
function MatchTriadEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo<MinorKey[]>(() => shuffled([...KEYS, ...KEYS]), [])
  const total = items.length

  const [idx,      setIdx]      = useState(0)
  const [chosen,   setChosen]   = useState<MinorKey | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const answer = items[idx]
  const triad = minorTriadFor(answer)
  const triadSet = new Set(triad)

  function pick(k: MinorKey) {
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
        Exercise 5 — Match the minor triad
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '12px' }}>
        Which minor triad is highlighted?
      </p>

      <div style={{ marginBottom: 16 }}>
        <PatternKeyboard pattern={triad} triadSet={triadSet} />
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
              {k} minor
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && !feedback.ok && (
          <>Correct answer: <strong style={{ color: CORRECT }}>{answer} minor</strong></>
        )}
        {feedback !== null && feedback.ok && '✓ Correct'}
      </p>
    </div>
  )
}

// ── Ex 6: Place the minor triad on the staff ───────────────────────────────
interface Ex6TriadTarget {
  clef: 'treble' | 'bass'
  rootKey: MinorKey
  positions: number[]          // 3 staff positions, ascending
  accidentalPos?: number       // position that gets an accidental (if any)
  accidentalType?: AccType     // 'flat' for C/F/G minor triads
}

// Minor triads and their staff positions:
// C minor (C E♭ G): treble [0, 2, 4], bass [5, 7, 9], flat on pos where E sits
// F minor (F A♭ C): treble [3, 5, 7], bass [1, 3, 5], flat on pos where A sits
// G minor (G B♭ D): treble [4, 6, 8], bass [2, 4, 6], flat on pos where B sits
// D minor (D F A):  treble [1, 3, 5], bass [6, 8, 10], no accidental
const EX6_POOL: Ex6TriadTarget[] = [
  { clef: 'treble', rootKey: 'C', positions: [0, 2, 4], accidentalPos: 2, accidentalType: 'flat' },
  { clef: 'bass',   rootKey: 'C', positions: [5, 7, 9], accidentalPos: 7, accidentalType: 'flat' },
  { clef: 'treble', rootKey: 'F', positions: [3, 5, 7], accidentalPos: 5, accidentalType: 'flat' },
  { clef: 'bass',   rootKey: 'F', positions: [1, 3, 5], accidentalPos: 3, accidentalType: 'flat' },
  { clef: 'treble', rootKey: 'G', positions: [4, 6, 8], accidentalPos: 6, accidentalType: 'flat' },
  { clef: 'bass',   rootKey: 'G', positions: [2, 4, 6], accidentalPos: 4, accidentalType: 'flat' },
  { clef: 'treble', rootKey: 'D', positions: [1, 3, 5] },
  { clef: 'bass',   rootKey: 'D', positions: [6, 8, 10] },
]

const EX6_NOTE_X = 190   // all 3 noteheads stack at this x

function PlaceTriadEx({
  onDone,
}: {
  onDone: (correct: number, total: number) => void
}) {
  const items = useMemo(() => shuffled(EX6_POOL).slice(0, 6), [])
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

  const renderNote = (pos: number, color: string, opacity = 1) => {
    const cy = posToY(pos)
    const ledgerTreble = item.clef === 'treble' && pos === 0
    const ledgerBass   = item.clef === 'bass'   && (pos === 0 || pos === 12)
    return (
      <g key={pos} opacity={opacity}>
        {(ledgerTreble || ledgerBass) &&
          <LedgerLine cx={EX6_NOTE_X} cy={cy} color={color} />}
        {item.accidentalPos === pos && item.accidentalType &&
          <AccidentalGlyph cx={EX6_NOTE_X} cy={cy} acc={item.accidentalType} color={color} />}
        <BravuraNote cx={EX6_NOTE_X} cy={cy} color={color} />
      </g>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 6 — Place the minor triad
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '10px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — place the{' '}
        <strong style={{ color: ACCENT }}>{item.rootKey} minor triad</strong>
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

          {/* Correct hint on wrong answer */}
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

// ── Ex 3 / Ex 4: Convert between major and minor by adjusting the 3rd ──────
// Free-form: student picks an accidental (♭, ♮, ♯) and taps any note to apply
// it. Tap the same note + same accidental to clear it. Check validates the
// entire pattern — placing a flat on the wrong note (or applying the wrong
// kind of accidental) will fail.
type AccType = 'flat' | 'sharp' | 'natural'
interface ConvertStaffNote { pos: number; letter: string; acc?: AccType }
interface ConvertItem {
  clef: 'treble' | 'bass'
  rootKey: MajorKey           // same set {C, F, G, D}
  sourceMode: 'major' | 'minor'
  notes: ConvertStaffNote[]
}

const LETTER_BASE: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}
function accShift(acc: AccType | undefined): number {
  return acc === 'sharp' ? 1 : acc === 'flat' ? -1 : 0
}
function effectivePitchClass(note: ConvertStaffNote, studentAcc: AccType | null): number {
  const effective = studentAcc ?? note.acc
  return ((LETTER_BASE[note.letter] + accShift(effective)) + 12) % 12
}
function targetPitchClasses(item: ConvertItem): number[] {
  const targetMode = item.sourceMode === 'major' ? 'minor' : 'major'
  const seq = targetMode === 'minor'
    ? MINOR_PATTERNS[item.rootKey as MinorKey].notes
    : MAJOR_PATTERNS[item.rootKey].notes
  return seq.map(n => ((n % 12) + 12) % 12)
}

// ── Ex 3 pool — source is MAJOR, student converts to MINOR ────────────────
const EX3_POOL: ConvertItem[] = [
  { clef: 'treble', rootKey: 'C', sourceMode: 'major', notes: [
    { pos: 0, letter: 'C' }, { pos: 1, letter: 'D' }, { pos: 2, letter: 'E' },
    { pos: 3, letter: 'F' }, { pos: 4, letter: 'G' },
  ]},
  { clef: 'bass', rootKey: 'F', sourceMode: 'major', notes: [
    { pos: 1, letter: 'F' }, { pos: 2, letter: 'G' }, { pos: 3, letter: 'A' },
    { pos: 4, letter: 'B', acc: 'flat' }, { pos: 5, letter: 'C' },
  ]},
  { clef: 'treble', rootKey: 'G', sourceMode: 'major', notes: [
    { pos: 4, letter: 'G' }, { pos: 5, letter: 'A' }, { pos: 6, letter: 'B' },
    { pos: 7, letter: 'C' }, { pos: 8, letter: 'D' },
  ]},
  { clef: 'bass', rootKey: 'D', sourceMode: 'major', notes: [
    { pos: 6, letter: 'D' }, { pos: 7, letter: 'E' }, { pos: 8, letter: 'F', acc: 'sharp' },
    { pos: 9, letter: 'G' }, { pos: 10, letter: 'A' },
  ]},
]

// ── Ex 4 pool — source is MINOR, student converts to MAJOR ────────────────
const EX4_POOL: ConvertItem[] = [
  { clef: 'treble', rootKey: 'C', sourceMode: 'minor', notes: [
    { pos: 0, letter: 'C' }, { pos: 1, letter: 'D' }, { pos: 2, letter: 'E', acc: 'flat' },
    { pos: 3, letter: 'F' }, { pos: 4, letter: 'G' },
  ]},
  { clef: 'bass', rootKey: 'F', sourceMode: 'minor', notes: [
    { pos: 1, letter: 'F' }, { pos: 2, letter: 'G' }, { pos: 3, letter: 'A', acc: 'flat' },
    { pos: 4, letter: 'B', acc: 'flat' }, { pos: 5, letter: 'C' },
  ]},
  { clef: 'treble', rootKey: 'G', sourceMode: 'minor', notes: [
    { pos: 4, letter: 'G' }, { pos: 5, letter: 'A' }, { pos: 6, letter: 'B', acc: 'flat' },
    { pos: 7, letter: 'C' }, { pos: 8, letter: 'D' },
  ]},
  { clef: 'bass', rootKey: 'D', sourceMode: 'minor', notes: [
    { pos: 6, letter: 'D' }, { pos: 7, letter: 'E' }, { pos: 8, letter: 'F' },
    { pos: 9, letter: 'G' }, { pos: 10, letter: 'A' },
  ]},
]

const EX_NOTE_START_X = 90
const EX_NOTE_END_X   = sR - 12

function ConvertEx({
  direction, onDone,
}: {
  direction: 'toMinor' | 'toMajor'
  onDone: (correct: number, total: number) => void
}) {
  const pool = direction === 'toMinor' ? EX3_POOL : EX4_POOL
  const items = useMemo(() => shuffled(pool), [pool])
  const total = items.length

  const [idx,          setIdx]          = useState(0)
  const [pickedAcc,    setPickedAcc]    = useState<AccType | null>(null)
  const [studentAccs,  setStudentAccs]  = useState<(AccType | null)[]>(() => Array(5).fill(null))
  const [feedback,     setFeedback]     = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const targets = targetPitchClasses(item)

  function selectAcc(acc: AccType) {
    if (feedback !== null) return
    setPickedAcc(prev => prev === acc ? null : acc)
  }

  function applyToNote(noteIdx: number) {
    if (feedback !== null || lockedRef.current) return
    if (!pickedAcc) return
    setStudentAccs(prev => {
      const next = [...prev]
      next[noteIdx] = next[noteIdx] === pickedAcc ? null : pickedAcc
      return next
    })
  }

  function onReset() {
    if (feedback !== null) return
    setStudentAccs(Array(5).fill(null))
  }

  function onCheck() {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = item.notes.every((n, i) =>
      effectivePitchClass(n, studentAccs[i]) === targets[i]
    )
    if (ok) correctRef.current += 1
    setFeedback({ ok })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1)
        setPickedAcc(null); setStudentAccs(Array(5).fill(null))
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1200 : 2200)
  }

  const xs = Array.from({ length: 5 }, (_, i) =>
    EX_NOTE_START_X + (i + 0.5) * ((EX_NOTE_END_X - EX_NOTE_START_X) / 5)
  )

  const targetModeLabel = item.sourceMode === 'major' ? 'minor' : 'major'
  const sourceLabel = `${item.rootKey} ${item.sourceMode}`
  const targetLabel = `${item.rootKey} ${targetModeLabel}`

  const accBtn = (acc: AccType, glyph: string) => {
    const active = pickedAcc === acc
    return (
      <button key={acc} onClick={() => selectAcc(acc)}
        disabled={feedback !== null}
        style={{
          width: 48, height: 48, borderRadius: 10,
          border: `1.5px solid ${active ? DARK : '#DDD8CA'}`,
          background: active ? DARK : 'white',
          color: active ? 'white' : DARK,
          fontFamily: 'Bravura, serif', fontSize: 24,
          cursor: feedback !== null ? 'default' : 'pointer',
        }}>
        {glyph}
      </button>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise {direction === 'toMinor' ? '3' : '4'} — Make it {targetModeLabel}
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        This is <strong style={{ color: DARK }}>{sourceLabel}</strong>. Add the accidental that turns
        it into <strong style={{ color: ACCENT }}>{targetLabel}</strong>. Pick an accidental, then
        tap the note you want it on. Tap again to clear.
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{
            maxWidth: svgW, display: 'block', margin: '0 auto',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
            cursor: feedback !== null ? 'default' : (pickedAcc ? 'pointer' : 'default'),
          }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble'
            ? <TrebleClef />
            : <BassClef />}

          {item.notes.map((n, i) => {
            const cx = xs[i]
            const cy = posToY(n.pos)
            const renderedAcc = studentAccs[i] ?? n.acc
            const accColor = studentAccs[i] !== null ? ACCENT : DARK
            const isLedger = (item.clef === 'treble' && n.pos === 0) ||
                             (item.clef === 'bass' && (n.pos === 0 || n.pos === 12))
            return (
              <g key={i}
                onClick={() => applyToNote(i)}
                style={{ cursor: pickedAcc && !feedback ? 'pointer' : 'default' }}>
                {/* Transparent wide hit target to make the note easier to tap */}
                <rect x={cx - 30} y={cy - 30} width={60} height={60} fill="transparent" />
                {isLedger && <LedgerLine cx={cx} cy={cy} />}
                {renderedAcc && <AccidentalGlyph cx={cx} cy={cy} acc={renderedAcc} color={accColor} />}
                <BravuraNote cx={cx} cy={cy} />
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
        <div style={{ width: 1, height: 28, background: '#DDD8CA', margin: '0 4px' }} />
        <button onClick={onReset}
          disabled={feedback !== null}
          style={{
            padding: '10px 16px', borderRadius: 10,
            border: '1.5px solid #DDD8CA', background: 'white',
            color: GREY, fontFamily: F, fontSize: 13,
            cursor: feedback !== null ? 'default' : 'pointer',
          }}>
          Reset
        </button>
        <button onClick={onCheck}
          disabled={feedback !== null}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: feedback !== null ? '#EDE8DF' : DARK,
            color: feedback !== null ? '#B0ACA4' : 'white',
            fontFamily: F, fontSize: 14, fontWeight: 600,
            cursor: feedback !== null ? 'default' : 'pointer',
          }}>
          Check
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok  && `✓ Correct — this is now ${targetLabel}`}
        {feedback !== null && !feedback.ok && (
          <>Not quite — only the 3rd note needs a change. Give it another try.</>
        )}
      </p>
    </div>
  )
}

// ── SVG primitives used by ConvertEx ────────────────────────────────────────
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

// ── Root ──────────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4' | 'ex5' | 'ex6'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6']

export default function MinorPatternsLesson({
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
      {phase === 'ex1' && <BuildKeyboardEx key={key} onDone={scored} />}
      {phase === 'ex2' && <MatchPatternEx  key={key} onDone={scored} />}
      {phase === 'ex3' && <ConvertEx       key={key} direction="toMinor" onDone={scored} />}
      {phase === 'ex4' && <ConvertEx       key={key} direction="toMajor" onDone={scored} />}
      {phase === 'ex5' && <MatchTriadEx    key={key} onDone={scored} />}
      {phase === 'ex6' && <PlaceTriadEx    key={key} onDone={scored} />}
    </div>
  )
}
