'use client'

import { useState, useRef, useMemo } from 'react'
import ScoreFromXml from '@/components/music/ScoreFromXml'
import { ExerciseNavBar } from './nav/ExerciseNavBar'

const F       = 'var(--font-jost), sans-serif'
const DARK    = '#1A1A18'
const GREY    = '#B0ACA4'
const ACCENT  = '#BA7517'
const MAJ_C   = '#2A5C0A'
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'
const STROKE  = 1.3

// ── Grand staff geometry ──────────────────────────────────────────────────
const gStep   = 8
const gSL     = 32
const gTT     = 28                            // top of treble staff
const gBT     = gTT + 8 * gStep + 42          // top of bass staff (42px gap)
const gBB     = gBT + 8 * gStep               // bottom of bass staff
const gSvgH   = gBB + 20

// Position → y within treble/bass staff (pos system matches other lessons)
// Treble: pos 0 = C4 (ledger below), pos 10 = F5 (top line)
// Bass:   pos 0 = E2 (ledger below), pos 10 = A3 (top line), pos 12 = C4 (ledger above)
function trebleY(pos: number) { return gTT + (10 - pos) * gStep }
function bassY(pos: number)   { return gBT + (10 - pos) * gStep }
function trebleLineY(n: number) { return gTT + (5 - n) * 2 * gStep }
function bassLineY(n: number)   { return gBT + (5 - n) * 2 * gStep }

// ── Key signature data ────────────────────────────────────────────────────
type KeyName = 'C' | 'G' | 'F'
type AccType = 'sharp' | 'flat'

interface KeySigPlacement { clef: 'treble' | 'bass'; pos: number; acc: AccType }

const KEY_SIGS: Record<KeyName, {
  label: string
  accidentalName: string            // 'None' | 'F♯' | 'B♭'
  placements: KeySigPlacement[]     // empty for C major
}> = {
  C: {
    label: 'C major',
    accidentalName: 'None',
    placements: [],
  },
  G: {
    label: 'G major',
    accidentalName: 'F♯',
    placements: [
      { clef: 'treble', pos: 10, acc: 'sharp' },   // F5 (top line)
      { clef: 'bass',   pos: 8,  acc: 'sharp' },   // F3 (line 4)
    ],
  },
  F: {
    label: 'F major',
    accidentalName: 'B♭',
    placements: [
      { clef: 'treble', pos: 6, acc: 'flat' },    // B4 (middle line)
      { clef: 'bass',   pos: 4, acc: 'flat' },    // B2 (line 2)
    ],
  },
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

// ── Primitives ────────────────────────────────────────────────────────────
function AccGlyph({ cx, cy, acc, color = DARK, fontSize = 44 }:
  { cx: number; cy: number; acc: AccType; color?: string; fontSize?: number }) {
  const glyph = acc === 'flat' ? '\uE260' : '\uE262'
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={fontSize}
      fill={color} textAnchor="middle" dominantBaseline="central">{glyph}</text>
  )
}

function WholeNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={50}
      fill={color} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
  )
}

function LedgerLine({ cx, cy, color = DARK, hw = 12 }: { cx: number; cy: number; color?: string; hw?: number }) {
  return <line x1={cx - hw} y1={cy} x2={cx + hw} y2={cy} stroke={color} strokeWidth={STROKE} />
}

// ── GrandStaff — reusable component for all key-sig exercises ─────────────
interface GrandStaffNote {
  clef: 'treble' | 'bass'
  pos: number
  cx: number                   // x position
  acc?: AccType                // inline accidental on the note itself
}

interface GrandStaffProps {
  width: number
  keyName?: KeyName                                         // key signature to render
  studentAccidentals?: KeySigPlacement[]                    // user-placed (for Ex 3)
  studentAccColor?: string
  onStaffClick?: (clef: 'treble' | 'bass', pos: number) => void
  clickable?: boolean
  timeSignature?: [number, number]
  notes?: GrandStaffNote[]
  barLineXs?: number[]                                      // extra bar lines
  endDoubleBar?: boolean
}

function GrandStaff({
  width,
  keyName,
  studentAccidentals = [],
  studentAccColor = ACCENT,
  onStaffClick,
  clickable = false,
  timeSignature,
  notes = [],
  barLineXs = [],
  endDoubleBar = false,
}: GrandStaffProps) {
  const gSR = width - 16
  const svgW = width
  const svgRef = useRef<SVGSVGElement | null>(null)

  function clientToClefPos(clientX: number, clientY: number): { clef: 'treble' | 'bass'; pos: number } | null {
    const svg = svgRef.current
    if (!svg) return null
    const r = svg.getBoundingClientRect()
    const sy = (clientY - r.top) / r.height * gSvgH
    // Determine clef by which half of the grand staff was clicked
    const midY = (gBB + gTT) / 2
    const clef: 'treble' | 'bass' = sy < midY ? 'treble' : 'bass'
    const top = clef === 'treble' ? gTT : gBT
    let pos = Math.round(10 - (sy - top) / gStep)
    if (pos < 0) pos = 0
    if (pos > 12) pos = 12
    return { clef, pos }
  }

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onStaffClick) return
    if (!svgRef.current) svgRef.current = e.currentTarget
    const cp = clientToClefPos(e.clientX, e.clientY)
    if (cp) onStaffClick(cp.clef, cp.pos)
  }

  // Clef symbols
  const trebleClefY = gTT + 6 * gStep
  const bassClefY   = gBT + 2 * gStep + 2

  // Standard engraving order: clef → (small gap) → key sig → (2-space gap) → time sig.
  // Start the key sig far enough right that the bass clef glyph clears the accidental.
  const accStartX  = gSL + 60         // first accidental column
  const accSpacing = 14               // column spacing when a key has several accidentals
  const keySigAccidentals = keyName ? KEY_SIGS[keyName].placements : []
  const trebleKeySigAccs  = keySigAccidentals.filter(p => p.clef === 'treble')
  const bassKeySigAccs    = keySigAccidentals.filter(p => p.clef === 'bass')
  const studentTrebleAccs = studentAccidentals.filter(p => p.clef === 'treble')
  const studentBassAccs   = studentAccidentals.filter(p => p.clef === 'bass')
  const numSlots = Math.max(trebleKeySigAccs.length, bassKeySigAccs.length)

  // Time signature sits 2 staff spaces (~16px) past whatever precedes it.
  // With no key sig it sits just after the clef; with accidentals it follows
  // the last accidental column.
  const timeSigX = numSlots === 0
    ? gSL + 56
    : accStartX + numSlots * accSpacing + 8

  return (
    <svg
      ref={r => { svgRef.current = r }}
      viewBox={`0 0 ${svgW} ${gSvgH}`} width="100%"
      onClick={onClick}
      style={{
        maxWidth: svgW, display: 'block', margin: '0 auto',
        cursor: clickable ? 'crosshair' : 'default',
        userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
      }}>
      {/* Staff lines */}
      {[1, 2, 3, 4, 5].map(n => (
        <line key={'t' + n} x1={gSL} y1={trebleLineY(n)} x2={gSR} y2={trebleLineY(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
      {[1, 2, 3, 4, 5].map(n => (
        <line key={'b' + n} x1={gSL} y1={bassLineY(n)} x2={gSR} y2={bassLineY(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
      {/* Left connector */}
      <line x1={gSL} y1={gTT} x2={gSL} y2={gBB} stroke={DARK} strokeWidth={1.6} />
      {/* Brace */}
      <text x={gSL - 10} y={gBB} fontSize={gBB - gTT}
        fontFamily="Bravura, serif" fill={DARK} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
      {/* Clefs */}
      <text x={gSL + 5} y={trebleClefY} fontFamily="Bravura, serif" fontSize={52}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
      <text x={gSL + 5} y={bassClefY} fontFamily="Bravura, serif" fontSize={56}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD22'}</text>

      {/* Key signature accidentals — treble and bass share the same slot (column) */}
      {trebleKeySigAccs.map((p, i) => (
        <AccGlyph key={'kst' + i} cx={accStartX + i * accSpacing} cy={trebleY(p.pos)} acc={p.acc} />
      ))}
      {bassKeySigAccs.map((p, i) => (
        <AccGlyph key={'ksb' + i} cx={accStartX + i * accSpacing} cy={bassY(p.pos)} acc={p.acc} />
      ))}

      {/* Student-placed accidentals (for Ex 3) — same slot-based layout */}
      {studentTrebleAccs.map((p, i) => (
        <AccGlyph key={'sat' + i} cx={accStartX + i * accSpacing} cy={trebleY(p.pos)}
          acc={p.acc} color={studentAccColor} />
      ))}
      {studentBassAccs.map((p, i) => (
        <AccGlyph key={'sab' + i} cx={accStartX + i * accSpacing} cy={bassY(p.pos)}
          acc={p.acc} color={studentAccColor} />
      ))}

      {/* Time signature */}
      {timeSignature && (
        <>
          <text x={timeSigX} y={gTT + 2 * gStep} fontFamily="Bravura, serif" fontSize={46}
            fill={DARK} dominantBaseline="central">{timeSigBravura(timeSignature[0])}</text>
          <text x={timeSigX} y={gTT + 6 * gStep} fontFamily="Bravura, serif" fontSize={46}
            fill={DARK} dominantBaseline="central">{timeSigBravura(timeSignature[1])}</text>
          <text x={timeSigX} y={gBT + 2 * gStep} fontFamily="Bravura, serif" fontSize={46}
            fill={DARK} dominantBaseline="central">{timeSigBravura(timeSignature[0])}</text>
          <text x={timeSigX} y={gBT + 6 * gStep} fontFamily="Bravura, serif" fontSize={46}
            fill={DARK} dominantBaseline="central">{timeSigBravura(timeSignature[1])}</text>
        </>
      )}

      {/* Notes */}
      {notes.map((n, i) => {
        const cy = n.clef === 'treble' ? trebleY(n.pos) : bassY(n.pos)
        const isLedgerTreble = n.clef === 'treble' && n.pos === 0
        const isLedgerBass = n.clef === 'bass' && (n.pos === 0 || n.pos === 12)
        return (
          <g key={'n' + i}>
            {(isLedgerTreble || isLedgerBass) && <LedgerLine cx={n.cx} cy={cy} />}
            {n.acc && <AccGlyph cx={n.cx - 18} cy={cy} acc={n.acc} fontSize={36} />}
            <WholeNote cx={n.cx} cy={cy} />
          </g>
        )
      })}

      {/* Extra bar lines */}
      {barLineXs.map((x, i) => (
        <line key={'bl' + i} x1={x} y1={gTT} x2={x} y2={gBB} stroke={DARK} strokeWidth={STROKE} />
      ))}

      {/* Final bar line */}
      {endDoubleBar ? (
        <>
          <line x1={gSR - 5} y1={gTT} x2={gSR - 5} y2={gBB} stroke={DARK} strokeWidth={STROKE} />
          <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={DARK} strokeWidth={2.5} />
        </>
      ) : (
        <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={DARK} strokeWidth={STROKE} />
      )}
    </svg>
  )
}

function timeSigBravura(digit: number): string {
  // Bravura SMuFL time signature digits: E080..E089
  const codes = ['\uE080','\uE081','\uE082','\uE083','\uE084','\uE085','\uE086','\uE087','\uE088','\uE089']
  return codes[digit] ?? String(digit)
}

// ── Ex 1: Match the key signature to its name ─────────────────────────────
const EX1_KEYS: KeyName[] = ['C','G','F']
const EX1_POOL: KeyName[] = [
  'C', 'G', 'F', 'G', 'F', 'C',   // distribute so students see each
]

// Shuffle so no two consecutive items are the same — the pool is small enough
// that a plain shuffle often lands on repeats.
function shuffleNoRepeat<T>(arr: T[]): T[] {
  for (let attempt = 0; attempt < 30; attempt++) {
    const out = [...arr].sort(() => Math.random() - 0.5)
    let ok = true
    for (let i = 1; i < out.length; i++) {
      if (out[i] === out[i - 1]) { ok = false; break }
    }
    if (ok) return out
  }
  // Fallback: greedily swap any adjacent duplicate with a later distinct item.
  const out = [...arr].sort(() => Math.random() - 0.5)
  for (let i = 1; i < out.length; i++) {
    if (out[i] !== out[i - 1]) continue
    for (let j = i + 1; j < out.length; j++) {
      const okWithPrev = out[j] !== out[i - 1]
      const okWithNext = i + 1 >= out.length || out[j] !== out[i + 1]
      if (okWithPrev && okWithNext) {
        [out[i], out[j]] = [out[j], out[i]]
        break
      }
    }
  }
  return out
}

function MatchKeySignatureEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffleNoRepeat(EX1_POOL), [])
  const total = items.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const answer = `${item} major`

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
        Exercise 1 — Match the key signature
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Look at the key signature at the start of the grand staff. Which major key is it?
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '12px 0', marginBottom: 14 }}>
        <GrandStaff width={320} keyName={item} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {EX1_KEYS.map(k => {
          const opt = `${k} major`
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
                padding: '14px 10px', borderRadius: 10,
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

// ── Ex 2: Name the accidental + the key ───────────────────────────────────
function IdentifyKeyEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffleNoRepeat<KeyName>(['C','G','F','G','F','C']), [])
  const total = items.length
  const [idx,          setIdx]          = useState(0)
  const [pickedAcc,    setPickedAcc]    = useState<string | null>(null)
  const [pickedKey,    setPickedKey]    = useState<string | null>(null)
  const [feedback,     setFeedback]     = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const info = KEY_SIGS[item]

  function reset() {
    setPickedAcc(null); setPickedKey(null)
  }

  function onCheck() {
    if (feedback !== null || lockedRef.current) return
    if (pickedAcc === null || pickedKey === null) return
    lockedRef.current = true
    const ok = pickedAcc === info.accidentalName && pickedKey === info.label
    if (ok) correctRef.current += 1
    setFeedback({ ok })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1)
        reset()
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1200 : 2400)
  }

  // Shuffle each question so the column position doesn't tip off the answer
  // (students can't just pick "same column as last time").
  const accOptions = useMemo(() => shuffled(['None', 'F♯', 'B♭']), [idx])
  const keyOptions = useMemo(() => shuffled(['C major', 'G major', 'F major']), [idx])

  const renderBtn = (opt: string, picked: string | null, setter: (s: string) => void, isAnswerFn: (o: string) => boolean) => {
    const isSel = picked === opt
    const locked = feedback !== null
    const isAnswer = isAnswerFn(opt)
    const bg = locked && isAnswer ? CORRECT
             : locked && isSel && !feedback!.ok ? WRONG
             : isSel ? DARK
             : 'white'
    const color = locked && (isAnswer || isSel) ? 'white'
                : isSel ? 'white' : DARK
    const border = locked && isAnswer ? CORRECT
                 : locked && isSel && !feedback!.ok ? WRONG
                 : isSel ? DARK : '#D9CFAE'
    return (
      <button key={opt} onClick={() => !locked && setter(opt)}
        disabled={locked}
        style={{
          padding: '12px 10px', borderRadius: 10,
          border: `1.5px solid ${border}`, background: bg, color,
          fontFamily: F, fontSize: 15, fontWeight: 600,
          cursor: locked ? 'default' : 'pointer',
        }}>
        {opt}
      </button>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 2 — Name the accidental and the key
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Pick the accidental that is used in the key signature, then pick the name of the major key.
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '12px 0', marginBottom: 14 }}>
        <GrandStaff width={320} keyName={item} />
      </div>

      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: GREY, margin: '0 0 6px' }}>Sharp / flat</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {accOptions.map(opt => renderBtn(opt, pickedAcc, setPickedAcc, o => o === info.accidentalName))}
      </div>

      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: GREY, margin: '0 0 6px' }}>Key</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {keyOptions.map(opt => renderBtn(opt, pickedKey, setPickedKey, o => o === info.label))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <button onClick={onCheck}
          disabled={feedback !== null || pickedAcc === null || pickedKey === null}
          style={{
            padding: '10px 28px', borderRadius: 10, border: 'none',
            fontFamily: F, fontSize: 15, fontWeight: 600,
            background: feedback !== null || pickedAcc === null || pickedKey === null ? '#EDE8DF' : DARK,
            color: feedback !== null || pickedAcc === null || pickedKey === null ? '#B0ACA4' : 'white',
            cursor: feedback !== null || pickedAcc === null || pickedKey === null ? 'default' : 'pointer',
          }}>
          Check
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct'}
        {feedback !== null && !feedback.ok && (
          <>The accidental is <strong style={{ color: CORRECT }}>{info.accidentalName}</strong>
          {' '}and the key is <strong style={{ color: CORRECT }}>{info.label}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Ex 3: Write the key signature on an empty grand staff ─────────────────
function WriteKeySignatureEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const items = useMemo(() => shuffleNoRepeat<KeyName>(['C','G','F','G','F']), [])
  const total = items.length
  const [idx,            setIdx]            = useState(0)
  const [placements,     setPlacements]     = useState<KeySigPlacement[]>([])
  const [pickedAcc,      setPickedAcc]      = useState<AccType | null>(null)
  const [feedback,       setFeedback]       = useState<{ ok: boolean } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const item = items[idx]
  const target = KEY_SIGS[item].placements

  function selectAcc(acc: AccType) {
    if (feedback !== null || lockedRef.current) return
    setPickedAcc(prev => prev === acc ? null : acc)
  }

  function onStaffClick(clef: 'treble' | 'bass', pos: number) {
    if (feedback !== null || lockedRef.current || !pickedAcc) return
    setPlacements(prev => {
      const existing = prev.findIndex(p => p.clef === clef && p.pos === pos && p.acc === pickedAcc)
      if (existing >= 0) {
        return prev.filter((_, i) => i !== existing)
      }
      return [...prev, { clef, pos, acc: pickedAcc }]
    })
  }

  function onReset() {
    if (feedback !== null) return
    setPlacements([]); setPickedAcc(null)
  }

  function matches(): boolean {
    if (placements.length !== target.length) return false
    return target.every(t =>
      placements.some(p => p.clef === t.clef && p.pos === t.pos && p.acc === t.acc)
    )
  }

  function onCheck() {
    if (feedback !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = matches()
    if (ok) correctRef.current += 1
    setFeedback({ ok })
    setTimeout(() => {
      if (ok) {
        if (idx + 1 >= total) { onDone(correctRef.current, total); return }
        setIdx(i => i + 1)
        setPlacements([]); setPickedAcc(null)
        setFeedback(null); lockedRef.current = false
      } else {
        setFeedback(null); lockedRef.current = false
      }
    }, ok ? 1200 : 2400)
  }

  const accBtn = (acc: AccType, glyph: string) => {
    const active = pickedAcc === acc
    return (
      <button onClick={() => selectAcc(acc)}
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

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 3 — Write the key signature
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: '10px' }}>
        Write the key signature for{' '}
        <strong style={{ color: ACCENT }}>{KEY_SIGS[item].label}</strong>
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '12px 0', marginBottom: 14 }}>
        <GrandStaff
          width={320}
          studentAccidentals={
            feedback !== null
              ? placements.map(p => ({ ...p }))
              : placements
          }
          studentAccColor={feedback !== null ? (feedback.ok ? CORRECT : WRONG) : ACCENT}
          onStaffClick={onStaffClick}
          clickable={feedback === null && pickedAcc !== null}
        />
      </div>

      {/* Accidental pad + controls */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center',
        marginBottom: 12, flexWrap: 'wrap' }}>
        {accBtn('flat', '\u266D')}
        {accBtn('sharp', '\u266F')}
        <div style={{ width: 1, height: 28, background: '#D9CFAE', margin: '0 4px' }} />
        <button onClick={onReset}
          disabled={feedback !== null}
          style={{
            padding: '10px 16px', borderRadius: 10,
            border: '1.5px solid #D9CFAE', background: 'white',
            color: GREY, fontFamily: F, fontSize: 14,
            cursor: feedback !== null ? 'default' : 'pointer',
          }}>Reset</button>
        <button onClick={onCheck}
          disabled={feedback !== null}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: feedback !== null ? '#EDE8DF' : DARK,
            color: feedback !== null ? '#B0ACA4' : 'white',
            fontFamily: F, fontSize: 15, fontWeight: 600,
            cursor: feedback !== null ? 'default' : 'pointer',
          }}>Check</button>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: '0 0 8px', lineHeight: 1.6 }}>
        {item === 'C'
          ? 'C major uses no sharps or flats — just press Check.'
          : 'Pick the accidental, then tap the correct line or space on each staff (treble and bass).'}
      </p>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: feedback === null ? '#B0ACA4' : feedback.ok ? CORRECT : WRONG }}>
        {feedback !== null && feedback.ok && '✓ Correct'}
        {feedback !== null && !feedback.ok && (
          <>Not quite — the correct key signature for <strong style={{ color: CORRECT }}>{KEY_SIGS[item].label}</strong>
          {' '}uses <strong style={{ color: CORRECT }}>{KEY_SIGS[item].accidentalName}</strong> on both staves.</>
        )}
      </p>
    </div>
  )
}

// ── Ex 4: Identify the key from a short musical example ───────────────────
// Pieces are real MusicXML (.mxl) files rendered by OpenSheetMusicDisplay.
interface PieceExample {
  key: KeyName
  xmlSrc: string
}

const EX4_EXAMPLES: PieceExample[] = [
  { key: 'C', xmlSrc: '/music/prep/c-major.mxl' },
  { key: 'G', xmlSrc: '/music/prep/g-major.mxl' },
  { key: 'F', xmlSrc: '/music/prep/f-major.mxl' },
]

function IdentifyInPieceEx({ onDone }: { onDone: (correct: number, total: number) => void }) {
  const examples = useMemo(() => shuffled([...EX4_EXAMPLES]), [])
  const total = examples.length
  const [idx,      setIdx]      = useState(0)
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: string } | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  const piece = examples[idx]
  const answer = `${piece.key} major`

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

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>
        Exercise 4 — Name the key of this piece
      </p>
      <ProgressBar done={idx} total={total} color={ACCENT} />

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Look at the key signature at the start of this example. Which major key is the piece in?
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '12px 0', marginBottom: 14 }}>
        <ScoreFromXml key={piece.xmlSrc} src={piece.xmlSrc} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {['C major', 'G major', 'F major'].map(opt => {
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
                padding: '14px 10px', borderRadius: 10,
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
          <>The piece is in <strong style={{ color: CORRECT }}>{answer}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
type Phase = 'ex1' | 'ex2' | 'ex3' | 'ex4'
const PHASE_ORDER: Phase[] = ['ex1', 'ex2', 'ex3', 'ex4']

export default function KeySignaturesLesson({
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
      {phase === 'ex1' && <MatchKeySignatureEx key={keyN} onDone={scored} />}
      {phase === 'ex2' && <IdentifyKeyEx       key={keyN} onDone={scored} />}
      {phase === 'ex3' && <WriteKeySignatureEx key={keyN} onDone={scored} />}
      {phase === 'ex4' && <IdentifyInPieceEx   key={keyN} onDone={scored} />}
    </div>
  )
}
