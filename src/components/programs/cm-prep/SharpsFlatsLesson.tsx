'use client'

import { useState, useRef, useMemo } from 'react'
import { PianoKeyboard } from './PianoKeyboard'

const F      = 'var(--font-jost), sans-serif'
const SERIF  = 'var(--font-cormorant), serif'
const DARK   = '#1A1A18'
const GREY   = '#7A7060'
const ACCENT  = '#BA7517'
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'
const STROKE  = 1.3

// ── Staff geometry ────────────────────────────────────────────────────────────
const step  = 8
const sL    = 32
const sR    = 360
const tTop  = 54
const svgW  = sR + 16
const svgH  = tTop + 8 * step + 54

function posToY(pos: number) { return tTop + (10 - pos) * step }
function lineY(n: number)    { return tTop + (5 - n) * 2 * step }

const NOTE_X = 218
const ACC_X  = NOTE_X - 26

// ── Grand staff geometry (Ex 7) ───────────────────────────────────────────────
const bTop_G = tTop + 12 * step + 4 * step
const gsH    = bTop_G + 10 * step + 28
function gsPosToY_T(pos: number) { return tTop   + (10 - pos) * step }
function gsPosToY_B(pos: number) { return bTop_G + (10 - pos) * step }
function gsLineY_B(n: number)    { return bTop_G + (5 - n) * 2 * step }

// ── Bravura glyphs ────────────────────────────────────────────────────────────
function accGlyph(acc: AccType): string {
  return acc === '#' ? '\uE262' : acc === 'b' ? '\uE260' : '\uE261'
}
function accFontSize(acc: AccType): number { return acc === 'b' ? 52 : 44 }
function accSymbol(acc: AccType): string   { return acc === '#' ? '♯' : acc === 'b' ? '♭' : '♮' }
function accWord(acc: AccType): string     { return acc === '#' ? 'sharp' : acc === 'b' ? 'flat' : 'natural' }

// ── Types ─────────────────────────────────────────────────────────────────────
type AccType = '#' | 'b' | 'n'

interface AccNote {
  name: string; letter: string; acc: AccType
  clef: 'treble' | 'bass'; pos: number
}

function displayName(n: AccNote): string { return n.letter + accSymbol(n.acc) }

function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function isLedger(n: { clef: string; pos: number }): boolean {
  return (n.clef === 'treble' && n.pos === 0) ||
         (n.clef === 'bass'   && (n.pos === 0 || n.pos === 12))
}

function octaveLabel(item: AccNote): string {
  if ((item.clef === 'treble' && item.pos === 0) || (item.clef === 'bass' && item.pos === 12))
    return 'Middle C'
  if (item.clef === 'treble') return item.pos >= 8 ? 'high (D5–A5)' : 'treble (D4–C5)'
  return item.pos <= 4 ? 'low (E2–B2)' : 'bass (C3–B3)'
}

// For naturals: both "F♮" and "F" are correct
function isCorrectAnswer(choice: string, item: AccNote): boolean {
  if (choice === displayName(item)) return true
  if (item.acc === 'n' && choice === item.letter) return true
  return false
}

function buildChoices(item: AccNote, pool: AccNote[]): string[] {
  const correct = displayName(item)
  const others  = shuffled(pool.filter(n => displayName(n) !== correct && n.letter !== item.letter))
  const chosen  = new Set<string>([correct])
  // Add a same-letter wrong-accidental distractor
  const sameLetterOther = pool.find(n => n.letter === item.letter && n.acc !== item.acc)
  if (sameLetterOther) chosen.add(displayName(sameLetterOther))
  // For naturals, also add the plain letter as a valid-looking choice (but we accept it as correct)
  for (const o of others) {
    if (chosen.size >= 5) break
    chosen.add(displayName(o))
  }
  return shuffled([...chosen])
}

// ── Pools ─────────────────────────────────────────────────────────────────────
const TREBLE_SHARPS: AccNote[] = [
  { name: 'F#4', letter: 'F', acc: '#', clef: 'treble', pos: 3  },
  { name: 'G#4', letter: 'G', acc: '#', clef: 'treble', pos: 4  },
  { name: 'A#4', letter: 'A', acc: '#', clef: 'treble', pos: 5  },
  { name: 'C#5', letter: 'C', acc: '#', clef: 'treble', pos: 7  },
  { name: 'D#5', letter: 'D', acc: '#', clef: 'treble', pos: 8  },
  { name: 'F#5', letter: 'F', acc: '#', clef: 'treble', pos: 10 },
]
const BASS_SHARPS: AccNote[] = [
  { name: 'G#2', letter: 'G', acc: '#', clef: 'bass', pos: 2  },
  { name: 'A#2', letter: 'A', acc: '#', clef: 'bass', pos: 3  },
  { name: 'C#3', letter: 'C', acc: '#', clef: 'bass', pos: 5  },
  { name: 'D#3', letter: 'D', acc: '#', clef: 'bass', pos: 6  },
  { name: 'F#3', letter: 'F', acc: '#', clef: 'bass', pos: 8  },
  { name: 'A#3', letter: 'A', acc: '#', clef: 'bass', pos: 10 },
]
const TREBLE_FLATS: AccNote[] = [
  { name: 'Gb4', letter: 'G', acc: 'b', clef: 'treble', pos: 4  },
  { name: 'Ab4', letter: 'A', acc: 'b', clef: 'treble', pos: 5  },
  { name: 'Bb4', letter: 'B', acc: 'b', clef: 'treble', pos: 6  },
  { name: 'Db5', letter: 'D', acc: 'b', clef: 'treble', pos: 8  },
  { name: 'Eb5', letter: 'E', acc: 'b', clef: 'treble', pos: 9  },
  { name: 'Gb5', letter: 'G', acc: 'b', clef: 'treble', pos: 11 },
]
const BASS_FLATS: AccNote[] = [
  { name: 'Gb2', letter: 'G', acc: 'b', clef: 'bass', pos: 2  },
  { name: 'Ab2', letter: 'A', acc: 'b', clef: 'bass', pos: 3  },
  { name: 'Bb2', letter: 'B', acc: 'b', clef: 'bass', pos: 4  },
  { name: 'Db3', letter: 'D', acc: 'b', clef: 'bass', pos: 6  },
  { name: 'Eb3', letter: 'E', acc: 'b', clef: 'bass', pos: 7  },
  { name: 'Ab3', letter: 'A', acc: 'b', clef: 'bass', pos: 10 },
]
const TREBLE_NATURALS: AccNote[] = [
  { name: 'Fn4', letter: 'F', acc: 'n', clef: 'treble', pos: 3  },
  { name: 'Gn4', letter: 'G', acc: 'n', clef: 'treble', pos: 4  },
  { name: 'An4', letter: 'A', acc: 'n', clef: 'treble', pos: 5  },
  { name: 'Bn4', letter: 'B', acc: 'n', clef: 'treble', pos: 6  },
  { name: 'Cn5', letter: 'C', acc: 'n', clef: 'treble', pos: 7  },
  { name: 'Dn5', letter: 'D', acc: 'n', clef: 'treble', pos: 8  },
]
const BASS_NATURALS: AccNote[] = [
  { name: 'Gn2', letter: 'G', acc: 'n', clef: 'bass', pos: 2  },
  { name: 'An2', letter: 'A', acc: 'n', clef: 'bass', pos: 3  },
  { name: 'Bn2', letter: 'B', acc: 'n', clef: 'bass', pos: 4  },
  { name: 'Cn3', letter: 'C', acc: 'n', clef: 'bass', pos: 5  },
  { name: 'Dn3', letter: 'D', acc: 'n', clef: 'bass', pos: 6  },
  { name: 'En3', letter: 'E', acc: 'n', clef: 'bass', pos: 7  },
]
const ALL_SHARPS   = [...TREBLE_SHARPS, ...BASS_SHARPS]
const ALL_FLATS    = [...TREBLE_FLATS,  ...BASS_FLATS]
const ALL_NATURALS = [...TREBLE_NATURALS, ...BASS_NATURALS]
const MIXED_ALL    = [...ALL_SHARPS, ...ALL_FLATS, ...ALL_NATURALS]

// ── SVG primitives ────────────────────────────────────────────────────────────
function StaffBase() {
  return (
    <>
      {[1,2,3,4,5].map(n => (
        <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
    </>
  )
}

function StaffBaseG() {
  return (
    <>
      {[1,2,3,4,5].map(n => (
        <line key={`t${n}`} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
      {[1,2,3,4,5].map(n => (
        <line key={`b${n}`} x1={sL} y1={gsLineY_B(n)} x2={sR} y2={gsLineY_B(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
      <line x1={sL} y1={tTop} x2={sL} y2={gsLineY_B(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={gsLineY_B(1)} stroke={DARK} strokeWidth={STROKE} />
      <text x={sL - 8} y={tTop + (gsLineY_B(1) - tTop)}
        fontFamily="Bravura, serif" fontSize={gsLineY_B(1) - tTop}
        fill={DARK} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
      <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
      <text x={sL + 4} y={bTop_G + 2 * step + 2} fontFamily="Bravura, serif" fontSize={66}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD22'}</text>
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
    <text x={sL + 4} y={tTop + 2 * step + 2} fontFamily="Bravura, serif" fontSize={66}
      fill={DARK} dominantBaseline="auto">{'\uD834\uDD22'}</text>
  )
}
function BravuraNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={60}
      fill={color} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
  )
}
function BravuraAcc({ cx, cy, acc, color = DARK }: {
  cx: number; cy: number; acc: AccType; color?: string
}) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={accFontSize(acc)}
      fill={color} textAnchor="middle" dominantBaseline="central">{accGlyph(acc)}</text>
  )
}
function LedgerLine({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return <line x1={cx - 16} y1={cy} x2={cx + 16} y2={cy} stroke={color} strokeWidth={2.5} />
}

function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
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

function PrimaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: DARK, color: 'white', border: 'none', borderRadius: 10,
      padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

// ── Intro cards ───────────────────────────────────────────────────────────────
function SharpsIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        Sharps
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 16, lineHeight: 1.7 }}>
        A <strong style={{ color: DARK }}>sharp (♯)</strong> raises a note by one half step.
        On the piano, play the key to the <strong>right</strong> of the white key — that is always a black key.
      </p>
      <PianoKeyboard mode="sharps" />
      <div style={{ background: '#F7F4ED', border: '1px solid #DDD8CA', borderRadius: 10,
        padding: '12px 16px', marginBottom: 20 }}>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0, lineHeight: 1.7 }}>
          On the staff, a sharp is written to the <strong>left</strong> of the note head,
          centered on the same line or space as the note.
        </p>
      </div>
      <PrimaryBtn label="Exercise 1 →" onClick={onNext} />
    </div>
  )
}

function FlatsIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        Flats
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 16, lineHeight: 1.7 }}>
        A <strong style={{ color: DARK }}>flat (♭)</strong> lowers a note by one half step.
        On the piano, play the key to the <strong>left</strong> of the white key — also a black key.
      </p>
      <PianoKeyboard mode="flats" />
      <div style={{ background: '#F7F4ED', border: '1px solid #DDD8CA', borderRadius: 10,
        padding: '12px 16px', marginBottom: 20 }}>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0, lineHeight: 1.7 }}>
          Like a sharp, a flat is written to the <strong>left</strong> of the note head,
          on the same line or space.
        </p>
      </div>
      <PrimaryBtn label="Exercise 3 →" onClick={onNext} />
    </div>
  )
}

function NaturalsIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        Naturals
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 16, lineHeight: 1.7 }}>
        A <strong style={{ color: DARK }}>natural (♮)</strong> cancels any sharp or flat,
        returning the note to its white-key pitch for the rest of the measure.
        On the piano, naturals are always <strong>white keys</strong>.
      </p>
      <PianoKeyboard mode="naturals" />
      <div style={{ background: '#F7F4ED', border: '1px solid #DDD8CA', borderRadius: 10,
        padding: '12px 16px', marginBottom: 20 }}>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0, lineHeight: 1.7 }}>
          The natural sign is written to the <strong>left</strong> of the note head,
          on the same line or space. C♮ is the same key as C — the natural just cancels a previous accidental.
        </p>
      </div>
      <PrimaryBtn label="Exercise 5 →" onClick={onNext} />
    </div>
  )
}

// ── Exercise: Draw accidental ─────────────────────────────────────────────────
// Student clicks anywhere on the staff. The ghost snaps y to nearest pos.
// Correct = x left of note AND y matches note's pos.
function DrawAccidentalEx({
  pool, total = 6, acc, exLabel, onDone, noteXOffset = 0,
}: {
  pool: AccNote[]; total?: number; acc: AccType
  exLabel: string; onDone: () => void; noteXOffset?: number
}) {
  const items = useMemo(() => {
    const exp: AccNote[] = []
    const reps = Math.ceil(total / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffled(exp).slice(0, total)
  }, [])

  const [idx,       setIdx]       = useState(0)
  const [stagedX,   setStagedX]   = useState<number | null>(null)
  const [stagedPos, setStagedPos] = useState<number | null>(null)
  const [state,     setState]     = useState<'idle' | 'correct' | 'wrong-side' | 'wrong-pos'>('idle')
  const svgRef    = useRef<SVGSVGElement>(null)
  const lockedRef = useRef(false)

  const item   = items[idx]
  const noteCy = posToY(item.pos)
  const ledger = isLedger(item)
  const noteX  = NOTE_X + noteXOffset
  const accX   = noteX - 26

  // Clamp-snap — always returns valid coords so taps can't "miss"
  function svgCoords(e: React.MouseEvent<SVGSVGElement>): { x: number; pos: number } {
    const svg = svgRef.current
    if (!svg) return { x: 0, pos: 0 }
    const r   = svg.getBoundingClientRect()
    const x   = (e.clientX - r.left) / r.width  * svgW
    const pos = Math.min(12, Math.max(0, Math.round(10 - ((e.clientY - r.top) / r.height * svgH - tTop) / step)))
    return { x, pos }
  }

  function onStaffClick(e: React.MouseEvent<SVGSVGElement>) {
    if (lockedRef.current || state !== 'idle') return
    const c = svgCoords(e)
    setStagedX(c.x); setStagedPos(c.pos)
  }

  function onConfirm() {
    if (lockedRef.current || stagedX === null || stagedPos === null) return
    lockedRef.current = true

    const leftOfNote = stagedX < noteX - 5
    const rightPos   = stagedPos === item.pos

    if (leftOfNote && rightPos) {
      setState('correct')
      setTimeout(() => {
        const next = idx + 1
        if (next >= total) { onDone(); return }
        setIdx(next); setState('idle')
        setStagedX(null); setStagedPos(null)
        lockedRef.current = false
      }, 1200)
    } else {
      setState(leftOfNote ? 'wrong-pos' : 'wrong-side')
      setTimeout(() => {
        setState('idle')
        setStagedX(null); setStagedPos(null)
        lockedRef.current = false
      }, 2000)
    }
  }

  const stagedCy = stagedPos !== null ? posToY(stagedPos) : noteCy
  const stagedIsLeft = stagedX !== null && stagedX < noteX - 5

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{exLabel}</p>
      <ProgressBar done={idx} total={total} color={ACCENT} />
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Tap to the <strong>left</strong> of the note, on the <strong>same line or space</strong>, then press Place to confirm the {accWord(acc)} ({accSymbol(acc)}).
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 12 }}>
        <svg ref={svgRef} viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            cursor: state !== 'idle' ? 'default' : 'crosshair',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
          onClick={onStaffClick}
        >
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {ledger && <LedgerLine cx={noteX} cy={noteCy} />}
          <BravuraNote cx={noteX} cy={noteCy} />

          {/* Staged ghost — amber if on left side, grey if on right */}
          {state === 'idle' && stagedX !== null && stagedPos !== null && (
            <BravuraAcc cx={stagedX} cy={stagedCy} acc={acc}
              color={stagedIsLeft ? ACCENT : '#C8C4BA'} />
          )}

          {/* Correct result — snap to canonical accX */}
          {state === 'correct' && (
            <BravuraAcc cx={accX} cy={noteCy} acc={acc} color={CORRECT} />
          )}

          {/* Wrong placement — show what the student chose */}
          {(state === 'wrong-side' || state === 'wrong-pos') && stagedX !== null && stagedPos !== null && (
            <BravuraAcc cx={stagedX} cy={stagedCy} acc={acc} color={WRONG} />
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <button
          onClick={onConfirm}
          disabled={state !== 'idle' || stagedX === null}
          style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 14, fontWeight: 600,
            cursor: state !== 'idle' || stagedX === null ? 'default' : 'pointer',
            background: state !== 'idle' || stagedX === null ? '#EDE8DF' : DARK,
            color: state !== 'idle' || stagedX === null ? '#B0ACA4' : 'white',
          }}
        >
          Place
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: state === 'idle' ? '#B0ACA4' : state === 'correct' ? CORRECT : WRONG }}>
        {state === 'idle'       && (stagedX === null
          ? `Tap the staff to position the ${accSymbol(acc)}`
          : `Press Place to confirm — or tap elsewhere to re-position`)}
        {state === 'correct'    && `✓ Correct — ${accSymbol(acc)} is to the left, on the same line/space`}
        {state === 'wrong-side' && `✗ The ${accSymbol(acc)} goes to the LEFT of the note`}
        {state === 'wrong-pos'  && `✗ The ${accSymbol(acc)} must be on the SAME line or space as the note`}
      </p>
    </div>
  )
}

// ── Exercise: Name the note with accidental ───────────────────────────────────
function NameAccidentalEx({
  pool, total = 8, exLabel, onDone,
}: {
  pool: AccNote[]; total?: number; exLabel: string; onDone: (s: number, t: number) => void
}) {
  const items = useMemo(() => {
    const exp: AccNote[] = []
    const reps = Math.ceil(total / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffled(exp).slice(0, total)
  }, [])

  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ chosen: string; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item    = items[idx]
  const total_  = items.length
  const cy      = posToY(item.pos)
  const ledger  = isLedger(item)
  const correct = displayName(item)

  const choices = useMemo(() => buildChoices(item, pool), [idx])

  function handlePick(choice: string) {
    if (lockedRef.current) return
    lockedRef.current = true
    const ok = isCorrectAnswer(choice, item)
    if (ok) correctRef.current += 1
    setFeedback({ chosen: choice, ok })
    setTimeout(() => {
      const next = idx + 1
      if (next >= total_) { onDone(correctRef.current, total_); return }
      setIdx(next); setFeedback(null); lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{exLabel}</p>
      <ProgressBar done={idx} total={total_} color={ACCENT} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — name this note
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}
          {ledger && <LedgerLine cx={NOTE_X} cy={cy} />}
          <BravuraAcc cx={ACC_X} cy={cy} acc={item.acc} />
          <BravuraNote cx={NOTE_X} cy={cy} />
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, justifyContent: 'center' }}>
        {choices.map(choice => {
          const isChosen  = feedback?.chosen === choice
          const isCorrect = feedback ? isCorrectAnswer(choice, item) : false
          let bg = 'white', border = '#DDD8CA', color = '#2A2318'
          if (feedback) {
            if (isCorrect)                { bg = '#EAF3DE'; border = '#C0DD97'; color = '#2A5C0A' }
            else if (isChosen)            { bg = '#FDF3ED'; border = '#F0C4A8'; color = '#B5402A' }
          }
          return (
            <button key={choice} onClick={() => handlePick(choice)} style={{
              background: bg, border: `1px solid ${border}`, borderRadius: 10,
              padding: '12px 18px', fontFamily: SERIF, fontSize: '20px', fontWeight: 400,
              color, cursor: feedback ? 'default' : 'pointer',
              transition: 'border-color 0.12s, background 0.12s', minWidth: 56,
            }}>
              {choice}
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060',
        margin: 0, minHeight: '1.5em' }}>
        {feedback && !feedback.ok && (
          <>Correct answer: <strong style={{ color: '#2A5C0A' }}>{correct}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Exercise 7: Grand staff name ──────────────────────────────────────────────
function GrandNameEx({
  pool, total = 10, exLabel, onDone,
}: {
  pool: AccNote[]; total?: number; exLabel: string; onDone: (s: number, t: number) => void
}) {
  const items = useMemo(() => {
    const exp: AccNote[] = []
    const reps = Math.ceil(total / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffled(exp).slice(0, total)
  }, [])

  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ chosen: string; ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item    = items[idx]
  const total_  = items.length
  const isTreble = item.clef === 'treble'
  const cy      = isTreble ? gsPosToY_T(item.pos) : gsPosToY_B(item.pos)
  const ledger  = isLedger(item)
  const correct = displayName(item)
  const choices = useMemo(() => buildChoices(item, pool), [idx])

  function handlePick(choice: string) {
    if (lockedRef.current) return
    lockedRef.current = true
    const ok = isCorrectAnswer(choice, item)
    if (ok) correctRef.current += 1
    setFeedback({ chosen: choice, ok })
    setTimeout(() => {
      const next = idx + 1
      if (next >= total_) { onDone(correctRef.current, total_); return }
      setIdx(next); setFeedback(null); lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{exLabel}</p>
      <ProgressBar done={idx} total={total_} color={ACCENT} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        Grand staff — name this note
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <svg viewBox={`0 0 ${svgW} ${gsH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBaseG />
          {ledger && item.clef === 'treble' && <LedgerLine cx={NOTE_X} cy={gsPosToY_T(item.pos)} />}
          {ledger && item.clef === 'bass' && item.pos === 0  && <LedgerLine cx={NOTE_X} cy={gsPosToY_B(0)} />}
          {ledger && item.clef === 'bass' && item.pos === 12 && <LedgerLine cx={NOTE_X} cy={gsPosToY_B(12)} />}
          <BravuraAcc cx={ACC_X} cy={cy} acc={item.acc} />
          <BravuraNote cx={NOTE_X} cy={cy} />
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, justifyContent: 'center' }}>
        {choices.map(choice => {
          const isChosen  = feedback?.chosen === choice
          const isCor     = feedback ? isCorrectAnswer(choice, item) : false
          let bg = 'white', border = '#DDD8CA', color = '#2A2318'
          if (feedback) {
            if (isCor)       { bg = '#EAF3DE'; border = '#C0DD97'; color = '#2A5C0A' }
            else if (isChosen) { bg = '#FDF3ED'; border = '#F0C4A8'; color = '#B5402A' }
          }
          return (
            <button key={choice} onClick={() => handlePick(choice)} style={{
              background: bg, border: `1px solid ${border}`, borderRadius: 10,
              padding: '12px 18px', fontFamily: SERIF, fontSize: '20px', fontWeight: 400,
              color, cursor: feedback ? 'default' : 'pointer',
              transition: 'border-color 0.12s, background 0.12s', minWidth: 56,
            }}>
              {choice}
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060',
        margin: 0, minHeight: '1.5em' }}>
        {feedback && !feedback.ok && (
          <>Correct answer: <strong style={{ color: '#2A5C0A' }}>{correct}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Exercise 8: Write the note (two steps: place, then pick accidental) ───────
function WriteAccidentalEx({
  pool, total = 8, exLabel, onDone,
}: {
  pool: AccNote[]; total?: number; exLabel: string; onDone: (s: number, t: number) => void
}) {
  const items = useMemo(() => {
    const exp: AccNote[] = []
    const reps = Math.ceil(total / pool.length) + 1
    for (let i = 0; i < reps; i++) exp.push(...pool)
    return shuffled(exp).slice(0, total)
  }, [])

  const [idx,        setIdx]        = useState(0)
  const [stagedPos,  setStagedPos]  = useState<number | null>(null)
  const [pickedAcc,  setPickedAcc]  = useState<AccType | null>(null)
  const [submitted,  setSubmitted]  = useState(false)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)
  const svgRef     = useRef<SVGSVGElement>(null)

  const item   = items[idx]
  const total_ = items.length
  const cx     = svgW / 2
  const step2  = stagedPos !== null && !submitted  // waiting for accidental pick
  const posOk  = stagedPos === item.pos
  const accOk  = pickedAcc === item.acc
  const isCorrect = submitted && posOk && accOk

  // Clamp-snap — always returns a valid pos so taps can't "miss"
  function clientToPos(clientY: number): number {
    const svg = svgRef.current
    if (!svg) return 0
    const r   = svg.getBoundingClientRect()
    const sy  = (clientY - r.top) / r.height * svgH
    const maxPos = item.clef === 'treble' ? 11 : 12
    let pos = Math.round(10 - (sy - tTop) / step)
    if (pos < 0) pos = 0
    if (pos > maxPos) pos = maxPos
    return pos
  }

  function onStaffClick(e: React.MouseEvent<SVGSVGElement>) {
    if (lockedRef.current || submitted) return
    setStagedPos(clientToPos(e.clientY))
  }

  function onPickAcc(a: AccType) {
    if (lockedRef.current || stagedPos === null) return
    lockedRef.current = true
    setPickedAcc(a)
    setSubmitted(true)
    const ok = stagedPos === item.pos && a === item.acc
    if (ok) correctRef.current += 1
    setTimeout(() => {
      const next = idx + 1
      if (next >= total_) { onDone(correctRef.current, total_); return }
      setIdx(next); setStagedPos(null); setPickedAcc(null)
      setSubmitted(false); lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  const renderNote = (pos: number, acc: AccType | null, color: string) => {
    const cy   = posToY(pos)
    const ledg = isLedger({ clef: item.clef, pos })
    return (
      <g>
        {ledg && <LedgerLine cx={cx} cy={cy} color={color} />}
        {acc && <BravuraAcc cx={cx - 26} cy={cy} acc={acc} color={color} />}
        <BravuraNote cx={cx} cy={cy} color={color} />
      </g>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{exLabel}</p>
      <ProgressBar done={idx} total={total_} color={ACCENT} />
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '8px' }}>
        {item.clef === 'treble' ? 'Treble clef' : 'Bass clef'} — write this note
      </p>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 300, color: DARK, lineHeight: 1 }}>
          {displayName(item)}
        </span>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: '4px 0 0' }}>
          <strong>{octaveLabel(item)}</strong>
          {!step2 && !submitted && ' — tap the staff to position the note'}
          {step2 && ' — pick the accidental below to confirm'}
        </p>
      </div>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 12 }}>
        <svg ref={svgRef} viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            cursor: submitted ? 'default' : 'crosshair',
            userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
          onClick={onStaffClick}
        >
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          {item.clef === 'treble' ? <TrebleClef /> : <BassClef />}

          {/* Staged note (before accidental picked) */}
          {step2 && stagedPos !== null &&
            renderNote(stagedPos, null, ACCENT)}
          {/* Submitted */}
          {submitted && stagedPos !== null &&
            renderNote(stagedPos, pickedAcc, posOk && accOk ? CORRECT : WRONG)}
          {/* Correct position hint */}
          {submitted && !(posOk && accOk) && (
            <g opacity={0.55}>{renderNote(item.pos, item.acc, CORRECT)}</g>
          )}
        </svg>
      </div>

      {/* Step 2: pick accidental */}
      {(step2 || submitted) && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
          {(['#', 'b', 'n'] as AccType[]).map(a => {
            const isPicked  = pickedAcc === a
            const isCorrectAcc = a === item.acc
            let bg = 'white', border = '#DDD8CA', color = '#2A2318'
            if (submitted) {
              if (isCorrectAcc)        { bg = '#EAF3DE'; border = '#C0DD97'; color = '#2A5C0A' }
              else if (isPicked)       { bg = '#FDF3ED'; border = '#F0C4A8'; color = '#B5402A' }
            }
            return (
              <button key={a} onClick={() => onPickAcc(a)}
                disabled={submitted}
                style={{
                  background: bg, border: `1px solid ${border}`, borderRadius: 10,
                  padding: '12px 20px', fontFamily: SERIF, fontSize: '24px',
                  color, cursor: submitted ? 'default' : 'pointer',
                  transition: 'border-color 0.12s, background 0.12s',
                }}>
                {accSymbol(a)}
              </button>
            )
          })}
        </div>
      )}

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: submitted ? (isCorrect ? CORRECT : WRONG) : '#B0ACA4' }}>
        {!step2 && !submitted && 'Click on the staff to place the note'}
        {step2   && !submitted && 'Pick the accidental symbol below'}
        {submitted && isCorrect  && '✓ Correct'}
        {submitted && !isCorrect && (
          !posOk
            ? `✗ ${item.name} belongs ${item.pos % 2 === 0 ? 'on a line' : 'in a space'}`
            : `✗ That note needs a ${accWord(item.acc)} (${accSymbol(item.acc)})`
        )}
      </p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
type Phase =
  | 'sharps-intro' | 'draw-sharps'    | 'name-sharps'
  | 'flats-intro'  | 'draw-flats'     | 'name-flats'
  | 'naturals-intro'| 'draw-naturals' | 'name-naturals'
  | 'name-mixed'   | 'write-mixed'

const PHASE_ORDER: Phase[] = [
  'sharps-intro', 'draw-sharps', 'name-sharps',
  'flats-intro',  'draw-flats',  'name-flats',
  'naturals-intro','draw-naturals','name-naturals',
  'name-mixed', 'write-mixed',
]

export default function SharpsFlatsLesson({
  passingScore, onComplete,
}: {
  passingScore: number
  onComplete: (score: number, total: number) => void
}) {
  const [phase, setPhase] = useState<Phase>('sharps-intro')
  const [key,   setKey]   = useState(0)
  const scoreRef = useRef({ correct: 0, total: 0 })

  function next() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx + 1 >= PHASE_ORDER.length) {
      const { correct, total } = scoreRef.current
      onComplete(total > 0 ? correct / total : 1, total)
      return
    }
    setPhase(PHASE_ORDER[idx + 1])
    setKey(k => k + 1)
  }

  function scored(correct: number, total: number) {
    scoreRef.current.correct += correct
    scoreRef.current.total   += total
    next()
  }

  if (phase === 'sharps-intro')   return <SharpsIntro onNext={next} />
  if (phase === 'draw-sharps')    return <DrawAccidentalEx key={key} pool={shuffled(ALL_SHARPS)} acc="#" exLabel="Exercise 1 — Draw the sharp" onDone={next} noteXOffset={-5} />
  if (phase === 'name-sharps')    return <NameAccidentalEx key={key} pool={ALL_SHARPS} exLabel="Exercise 2 — Name the note" onDone={scored} />
  if (phase === 'flats-intro')    return <FlatsIntro onNext={next} />
  if (phase === 'draw-flats')     return <DrawAccidentalEx key={key} pool={shuffled(ALL_FLATS)} acc="b" exLabel="Exercise 3 — Draw the flat" onDone={next} />
  if (phase === 'name-flats')     return <NameAccidentalEx key={key} pool={ALL_FLATS} exLabel="Exercise 4 — Name the note" onDone={scored} />
  if (phase === 'naturals-intro') return <NaturalsIntro onNext={next} />
  if (phase === 'draw-naturals')  return <DrawAccidentalEx key={key} pool={shuffled(ALL_NATURALS)} acc="n" exLabel="Exercise 5 — Draw the natural" onDone={next} />
  if (phase === 'name-naturals')  return <NameAccidentalEx key={key} pool={ALL_NATURALS} exLabel="Exercise 6 — Name the note" onDone={scored} />
  if (phase === 'name-mixed')     return <GrandNameEx key={key} pool={MIXED_ALL} exLabel="Exercise 7 — Name the note" onDone={scored} />
  return <WriteAccidentalEx key={key} pool={MIXED_ALL} exLabel="Exercise 8 — Write the note" onDone={scored} />
}
