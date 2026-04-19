'use client'

import { useState, useRef, useMemo } from 'react'
import {
  MINOR_PATTERNS, minorTriadFor, type MinorKey,
  PatternKeyboard,
} from './visuals/PatternDiagrams'

const F       = 'var(--font-jost), sans-serif'
const SERIF   = 'var(--font-cormorant), serif'
const DARK    = '#1A1A18'
const ACCENT  = '#3B6DB5'   // blue — matches MIN_C in PatternDiagrams
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'

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

  const [idx,             setIdx]             = useState(0)
  const [subStep,         setSubStep]         = useState<Ex1SubStep>('pattern')
  const [selectedPattern, setSelectedPattern] = useState<Set<number>>(new Set())
  const [selectedTriad,   setSelectedTriad]   = useState<Set<number>>(new Set())
  const [feedback, setFeedback] = useState<{ step: Ex1SubStep; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const key = items[idx]
  const correctPattern = new Set(MINOR_PATTERNS[key].notes)
  const correctTriad   = new Set(minorTriadFor(key))

  function toggleKey(c: number) {
    if (feedback !== null || lockedRef.current) return
    if (subStep === 'pattern') {
      setSelectedPattern(prev => {
        const next = new Set(prev)
        if (next.has(c)) next.delete(c); else next.add(c)
        return next
      })
    } else {
      if (!correctPattern.has(c)) return   // triad must be inside the pattern
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
      if (ok) { setSubStep('triad'); setFeedback(null); lockedRef.current = false }
      else    { setSelectedPattern(new Set()); setFeedback(null); lockedRef.current = false }
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

  const patternArr = subStep === 'pattern'
    ? Array.from(selectedPattern)
    : Array.from(correctPattern)
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

// ── Root ──────────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2']

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
    </div>
  )
}
