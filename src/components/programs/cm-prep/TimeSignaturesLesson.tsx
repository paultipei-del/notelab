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

// ── Root ──────────────────────────────────────────────────────────────────
// Ex 1 (time-sig facts), Ex 3 (write counts), and Ex 4 (counts on real music)
// will be added in follow-up iterations.
type Phase = 'ex2'
const PHASE_ORDER: Phase[] = ['ex2']

export default function TimeSignaturesLesson({
  previouslyCompleted = false,
  onComplete,
}: {
  passingScore: number
  previouslyCompleted?: boolean
  onComplete: (score: number, total: number) => void
}) {
  const [phase,       setPhase]       = useState<Phase>('ex2')
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
      {phase === 'ex2' && <HowManyBeatsEx key={keyN} onDone={scored} />}
    </div>
  )
}
