'use client'

import { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ExerciseNavBar } from './nav/ExerciseNavBar'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#7A7060'
const ACCENT = '#BA7517'
const CORRECT = '#2d5a3e'
const WRONG = '#a0381c'
const LINE_C = '#2A5C9A'
const SPACE_C = '#2A6B1E'
const STROKE = 1.3

// Staff layout — step=8, tTop=54
const step = 8
const sL = 32
const sR = 360
const tTop = 54   // y of line 5 (top)

// Line n (1=bottom, 5=top)
function lineY(n: number) { return tTop + (5 - n) * 2 * step }
// Space n (1=bottom, 4=top)
function spaceY(n: number) { return tTop + (4 - n) * 2 * step + step }

const svgW = sR + 16
const svgH = tTop + 8 * step + 54  // 172 · extra room for treble clef tail

function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

// ── SVG primitives ──────────────────────────────────────────────────────────

function StaffBase({
  x1 = sL, x2 = sR,
  lineColors = {} as Record<number, string>,
  lineWidths = {} as Record<number, number>,
}) {
  return (
    <>
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={x1} y1={lineY(n)} x2={x2} y2={lineY(n)}
          stroke={lineColors[n] ?? DARK}
          strokeWidth={lineWidths[n] ?? STROKE} />
      ))}
    </>
  )
}

// Clef glyphs — from GrandStaffCard step=6: treble y=top+36,fs=50; bass y=top+13,fs=52
// Scaled to step=10: treble y=tTop+60 (=G line lineY(2)), fs=62; bass y=lineY(4)+2, fs=52
function TrebleClef({ x = sL + 2, color = DARK }: { x?: number; color?: string }) {
  return (
    <text x={x} y={lineY(2)} fontFamily="Bravura, serif" fontSize={62} fill={color} dominantBaseline="auto">𝄞</text>
  )
}
function BassClef({ x = sL + 2, color = DARK }: { x?: number; color?: string }) {
  return (
    <text x={x} y={lineY(4) + 2} fontFamily="Bravura, serif" fontSize={66} fill={color} dominantBaseline="auto">𝄢</text>
  )
}
// Bravura whole note (open notehead, U+E0A2) centered on a staff position
function BravuraWhole({ cx, cy, size = 60, color = ACCENT }: { cx: number; cy: number; size?: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={size}
      fill={color} textAnchor="middle" dominantBaseline="central">
      {String.fromCodePoint(0xE0A2)}
    </text>
  )
}
// Open whole note (hollow oval) at a staff position
function WholeNote({ cx, cy, color = ACCENT, rx = 9, ry = 6 }: {
  cx: number; cy: number; color?: string; rx?: number; ry?: number
}) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={2} />
}

function NoteOval({ cx, cy, color = DARK, rx = 8, ry = 5.5 }: {
  cx: number; cy: number; color?: string; rx?: number; ry?: number
}) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} />
}

// Transparent hit zone over a staff line
function LineHitZone({ n, x1 = sL, x2 = sR, onClick, onEnter, onLeave }: {
  n: number; x1?: number; x2?: number;
  onClick: () => void; onEnter: () => void; onLeave: () => void
}) {
  const y = lineY(n)
  return (
    <rect x={x1} y={y - 9} width={x2 - x1} height={18}
      fill="transparent" style={{ cursor: 'pointer' }}
      onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave} />
  )
}

// ── Shared UI ───────────────────────────────────────────────────────────────

function SectionTag({ children }: { children: string }) {
  return <p style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, fontWeight: 600, margin: '0 0 5px' }}>{children}</p>
}
function SectionTitle({ children }: { children: string }) {
  return <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 300, color: DARK, margin: '0 0 14px' }}>{children}</p>
}
function ConceptBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12, padding: '16px 20px', marginBottom: 20, fontFamily: F, fontSize: 14, color: '#4A4540', lineHeight: 1.8 }}>
      {children}
    </div>
  )
}
function ExLabel({ children }: { children: string }) {
  return <p style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, fontWeight: 600, margin: '0 0 14px' }}>{children}</p>
}
function PrimaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--oxblood)', color: '#FDFBF5', border: '1px solid var(--oxblood)', borderRadius: 10,
      padding: '11px 26px', fontFamily: F, fontSize: 14, cursor: 'pointer',
    }}>{label}</button>
  )
}
/**
 * Raised, paper-toned answer pill used by Ex1-style numbered grids
 * (line/space, treble, bass). Mirrors the 3D treatment on the Back /
 * Forward NavButton: subtle gradient face, 2px under-rule, hover
 * lightens, press translates down 2px. In feedback state (chosen !==
 * null) the 3D drops away in favour of the flat correct/wrong tint.
 */
function AnswerPill({
  opt, chosen, isCorrect, onPick,
}: { opt: number; chosen: number | null; isCorrect: boolean; onPick: () => void }) {
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)
  const settled = chosen !== null

  let bg: string = '#f3eee3'
  let border = '1px solid #E0DBCF'
  let color = '#4a4540'
  let shadow: string | undefined = pressed
    ? '0 1px 0 #CAC3B0, 0 1px 1px rgba(0,0,0,0.04), inset 0 1px 1px rgba(0,0,0,0.04)'
    : hover
      ? '0 3px 0 #CAC3B0, 0 4px 8px rgba(0,0,0,0.06)'
      : '0 2px 0 #CAC3B0, 0 2px 4px rgba(0,0,0,0.04)'
  let transform = pressed ? 'translateY(2px)' : hover ? 'translateY(-1px)' : 'translateY(0)'

  if (settled) {
    shadow = undefined
    transform = 'translateY(0)'
    if (isCorrect) { bg = 'rgba(42,107,30,0.08)'; border = `1px solid ${CORRECT}`; color = CORRECT }
    else if (opt === chosen) { bg = 'rgba(181,64,42,0.08)'; border = `1px solid ${WRONG}`; color = WRONG }
  } else if (hover) {
    bg = '#f8f4ea'
  }

  return (
    <button
      onClick={() => { if (!settled) onPick() }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false) }}
      style={{
        background: bg, border, borderRadius: 10,
        height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: F, fontSize: 20, fontWeight: 400, lineHeight: 1, color,
        cursor: settled ? 'default' : 'pointer',
        boxShadow: shadow,
        transform,
        transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease',
      }}
    >{opt}</button>
  )
}
function ProgressDots({ total, idx, results }: { total: number; idx: number; results: boolean[] }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
          background: i < results.length ? (results[i] ? CORRECT : WRONG)
            : i === idx ? ACCENT : '#D9CFAE'
        }} />
      ))}
    </div>
  )
}
function FeedbackRow({
  result, correctLabel, onNext, nextLabel
}: { result: boolean; correctLabel: string; onNext: () => void; nextLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
      <p style={{ fontFamily: F, fontSize: 14, color: result ? CORRECT : WRONG, fontWeight: 600, margin: 0 }}>
        {result ? '✓ Correct!' : `✗ ${correctLabel}`}
      </p>
      <PrimaryBtn label={nextLabel} onClick={onNext} />
    </div>
  )
}

// ── STAFF INTRO ─────────────────────────────────────────────────────────────

function StaffIntro({ onNext }: { onNext: () => void }) {
  const barX = 340
  const wideR = 556
  // Line notes x positions in measure 1 — spread comfortably before barX
  const lineXs = [108, 158, 208, 258, 308]
  // Space notes x positions in measure 2 — spread comfortably between barX and wideR
  const spaceXs = [374, 416, 458, 500]

  return (
    <div>
      <SectionTag>The Staff</SectionTag>
      <SectionTitle>Five lines and four spaces</SectionTitle>
      <ConceptBox>
        Music is written on a <strong>staff</strong> · five horizontal lines with four spaces between them.<br />
        Lines are numbered <strong>1 to 5</strong> from the bottom up. Spaces are numbered <strong>1 to 4</strong> from the bottom up.
      </ConceptBox>

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <svg viewBox={`0 0 ${wideR + 16} ${svgH}`} width="100%"
          style={{ maxWidth: wideR + 16, display: 'block', margin: '0 auto' }}>
          <StaffBase x1={sL} x2={wideR} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <TrebleClef />
          <line x1={barX} y1={tTop} x2={barX} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <line x1={wideR - 7} y1={tTop} x2={wideR - 7} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <line x1={wideR} y1={tTop} x2={wideR} y2={lineY(1)} stroke={DARK} strokeWidth={4} />

          {/* Measure labels */}
          <text x={(sL + barX) / 2} y={svgH - 2} fontFamily={F} fontSize={10} fill={LINE_C} textAnchor="middle" letterSpacing="0.08em">LINES</text>
          <text x={(barX + wideR) / 2} y={svgH - 2} fontFamily={F} fontSize={10} fill={SPACE_C} textAnchor="middle" letterSpacing="0.08em">SPACES</text>

          {/* Number to the RIGHT of each note at the same vertical position */}
          {[1, 2, 3, 4, 5].map((n, i) => (
            <g key={n}>
              <BravuraWhole cx={lineXs[i]} cy={lineY(n)} size={60} color={LINE_C} />
              <text x={lineXs[i] + 16} y={lineY(n) + 4} fontFamily={F} fontSize={13} fill={LINE_C}
                textAnchor="start" fontWeight="700">{n}</text>
            </g>
          ))}
          {[1, 2, 3, 4].map((n, i) => (
            <g key={n}>
              <BravuraWhole cx={spaceXs[i]} cy={spaceY(n)} size={60} color={SPACE_C} />
              <text x={spaceXs[i] + 16} y={spaceY(n) + 4} fontFamily={F} fontSize={13} fill={SPACE_C}
                textAnchor="start" fontWeight="700">{n}</text>
            </g>
          ))}
        </svg>
      </div>

      <PrimaryBtn label="Exercise 1 · Number the lines →" onClick={onNext} />
    </div>
  )
}

// ── STAFF EXERCISE: number the lines and spaces ─────────────────────────────

interface StaffQ { type: 'line' | 'space'; n: number; opts: number[] }

function StaffEx({ onDone }: { onDone: (s: number, t: number) => void }) {
  const questions = useMemo<StaffQ[]>(() => shuffled([
    ...[1, 2, 3, 4, 5].map(n => ({ type: 'line' as const, n, opts: shuffled([1, 2, 3, 4, 5]) })),
    ...[1, 2, 3, 4].map(n => ({ type: 'space' as const, n, opts: shuffled([1, 2, 3, 4]) })),
  ]), [])

  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const lockedRef = useRef(false)

  const q = questions[idx]
  const total = questions.length

  function pick(opt: number) {
    if (chosen !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = opt === q.n
    setChosen(opt)
    setResults(r => [...r, ok])
    setTimeout(() => {
      if (idx + 1 >= total) {
        const correctCount = results.filter(Boolean).length + (ok ? 1 : 0)
        onDone(correctCount / total, total)
        return
      }
      setIdx(i => i + 1)
      setChosen(null)
      lockedRef.current = false
    }, ok ? 1000 : 1800)
  }

  // Highlight the target line/space
  const lineColors: Record<number, string> = {}
  const lineWidths: Record<number, number> = {}
  if (q.type === 'line') { lineColors[q.n] = ACCENT; lineWidths[q.n] = 2.5 }

  return (
    <div>
      <ExLabel>Exercise 1 · Number the lines and spaces</ExLabel>
      <ProgressDots total={total} idx={idx} results={results} />

      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 16 }}>
        What number is the highlighted {q.type}?
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          {/* Space highlight · full width, rendered first so staff lines and clef draw on top */}
          {q.type === 'space' && (
            <rect x={sL} y={spaceY(q.n) - 9} width={sR - sL} height={18}
              fill="rgba(186,117,23,0.18)" />
          )}

          <StaffBase lineColors={lineColors} lineWidths={lineWidths} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <TrebleClef x={sL + 4} />

          {/* Always-visible line numbers on left */}
          {[1, 2, 3, 4, 5].map(n => (
            <text key={n} x={sL - 12} y={lineY(n) + 4} fontFamily={F} fontSize={11}
              fill={GREY} textAnchor="middle">{n}</text>
          ))}

          {/* Target indicator */}
          {q.type === 'line' && (
            <text x={sR + 10} y={lineY(q.n) + 4} fontFamily={F} fontSize={12} fill={ACCENT} fontWeight="700">←</text>
          )}
          {q.type === 'space' && (
            <text x={sR + 10} y={spaceY(q.n) + 4} fontFamily={F} fontSize={12} fill={ACCENT} fontWeight="700">←</text>
          )}
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${q.opts.length}, 1fr)`, gap: 8, marginBottom: 16 }}>
        {q.opts.map(opt => (
          <AnswerPill
            key={opt}
            opt={opt}
            chosen={chosen}
            isCorrect={opt === q.n}
            onPick={() => pick(opt)}
          />
        ))}
      </div>

      {/* Feedback slot is always rendered so the card height stays
          constant across "nothing picked" → "answer locked in". */}
      <p style={{
        fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0,
        minHeight: 20, lineHeight: '20px',
        color: chosen === null ? 'transparent' : chosen === q.n ? CORRECT : WRONG,
      }}>
        {chosen === null
          ? ' '
          : chosen === q.n ? '✓ Correct' : `✗ This is ${q.type} ${q.n}`}
      </p>
    </div>
  )
}

// ── TREBLE INTRO ─────────────────────────────────────────────────────────────

function TrebleIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <SectionTag>The Treble Clef</SectionTag>
      <SectionTitle>Also called the G clef</SectionTitle>
      <ConceptBox>
        The <strong>treble clef</strong> (𝄞) is also called the <strong>G clef</strong>. Its spiral wraps around the second line of the staff, permanently naming that line <strong>G</strong>. Every other note on the staff is counted from that anchor.
        <br /><br />
        <span style={{ color: GREY }}>
          Historically, this symbol evolved from the letter <em>G</em>. Early musicians wrote the letter G directly on whichever line they wished to call G. Over centuries it became the ornate clef sign we use today.
        </span>
      </ConceptBox>

      {/* Annotated treble clef diagram */}
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH + 10}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          {/* Line 2 highlighted */}
          <StaffBase lineColors={{ 2: ACCENT }} lineWidths={{ 2: 2.5 }} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <TrebleClef x={sL + 6} color={DARK} />

          {/* Bravura whole note on line 2, close to clef */}
          <BravuraWhole cx={sL + 78} cy={lineY(2)} size={60} color={ACCENT} />

          {/* Label near line 3 · no arrow, white bg so text is clear */}
          <rect x={sL + 120} y={lineY(3) - 9} width={72} height={16} rx={3} fill="white" opacity={0.60} />
          <text x={sL + 156} y={lineY(3) + 4} fontFamily={F} fontSize={13} fill={ACCENT}
            fontWeight="700" textAnchor="middle">Line 2 = G</text>
        </svg>
      </div>

      <PrimaryBtn label="Exercise 2 · Circle line 2 →" onClick={onNext} />
    </div>
  )
}

// ── TREBLE EX 1: Tap line 2 (six circles exercise) ──────────────────────────

function TrebleEx1({ onDone }: { onDone: (s: number, t: number) => void }) {
  const ROUNDS = 6
  const [round, setRound] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [hovered, setHovered] = useState<number | null>(null)

  function tap(n: number) {
    if (chosen !== null) return
    const ok = n === 2
    setChosen(n)
    if (ok) setScore(s => s + 1)
    setResults(r => [...r, ok])
  }
  function next() {
    if (round + 1 >= ROUNDS) { onDone(score / ROUNDS, ROUNDS); return }
    setRound(r => r + 1)
    setChosen(null)
    setHovered(null)
  }

  const correct = chosen === 2

  return (
    <div>
      <ExLabel>Exercise 2 · Mark the G line</ExLabel>
      <ProgressDots total={ROUNDS} idx={round} results={results} />

      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 6 }}>
        The treble clef's spiral anchors to the second line.
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 20 }}>
        Tap <strong>line 2</strong> · the G line · on this staff.
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase
            lineColors={
              chosen !== null
                ? { 2: correct ? CORRECT : DARK, [chosen]: chosen !== 2 ? WRONG : CORRECT }
                : hovered !== null ? { [hovered]: ACCENT } : {}
            }
            lineWidths={
              chosen !== null
                ? { 2: 2.5, ...(chosen !== 2 ? { [chosen]: 2 } : {}) }
                : hovered !== null ? { [hovered]: 2.5 } : {}
            }
          />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />
          <TrebleClef x={sL + 4} color={DARK} />

          {/* Bravura whole note feedback */}
          {chosen !== null && <BravuraWhole cx={sL + 78} cy={lineY(2)} size={60} color={CORRECT} />}
          {chosen !== null && !correct && <BravuraWhole cx={sL + 78} cy={lineY(chosen)} size={60} color={WRONG} />}

          {/* Line number labels */}
          {[1, 2, 3, 4, 5].map(n => (
            <text key={n} x={sL - 14} y={lineY(n) + 4} fontFamily={F} fontSize={11}
              fill={chosen !== null && n === 2 ? CORRECT : chosen !== null && n === chosen ? WRONG : GREY}
              textAnchor="middle">{n}</text>
          ))}

          {/* Hit zones · always active until answered */}
          {chosen === null && [1, 2, 3, 4, 5].map(n => (
            <LineHitZone key={n} n={n} x1={sL + 66} x2={sR}
              onClick={() => tap(n)}
              onEnter={() => setHovered(n)}
              onLeave={() => setHovered(null)} />
          ))}
        </svg>
      </div>

      {chosen !== null && (
        <FeedbackRow
          result={correct}
          correctLabel="Line 2 is the G line · the treble clef anchors there"
          onNext={next}
          nextLabel={round + 1 >= ROUNDS ? 'Finish →' : `Next (${round + 1}/${ROUNDS}) →`}
        />
      )}
      {chosen === null && (
        <p style={{ fontFamily: F, fontSize: 13, color: '#B0ACA4', textAlign: 'center' }}>Tap a line</p>
      )}
    </div>
  )
}

// ── TREBLE EX 2: Assemble the treble clef from parts ────────────────────────

// Treble clef assembly — glyph rendered at these coords (matching TrebleClef component)
// CY = lineY(2) = tTop+60 = 114 (G line); CFS=62 (prevents tail from clipping at svgH=180)
const CX = sL + 4         // 36
const CY = lineY(2)       // 114
const CFS = 62            // fontSize · matches LabeledTrebleStaff; tail fits in svgH=180

// Vertical clip bands. At CY=114 (G line), CFS=62: ascender top≈y52; loop≈y92–128; tail≈y128–178.
type TreblePieceId = 'top' | 'mid' | 'bot'
const TPIECES: Record<TreblePieceId, { label: string; vy: number; vh: number; vbX?: number; clipVy?: number }> = {
  top: { label: 'Top curl', vy: 33.7, vh: 42.4, vbX: 32 },
  mid: { label: 'Loop',     vy: 74.1, vh: 44.4, vbX: 28 },
  bot: { label: 'Tail',     vy: 119.3, vh: 28.2, vbX: 28, clipVy: 119.3 },
}
// Fixed chip box — all three are the same outer size so boxes are equal
const CHIP_BOX = 80   // px square outer box
const CHIP_W = 56     // viewBox width (x: 22 to 78)

function TClefChip({ id, faded }: { id: TreblePieceId; faded?: boolean }) {
  const p = TPIECES[id]
  const clipId = `tchip-clip-${id}`
  return (
    <svg viewBox={`${p.vbX ?? 22} ${p.vy} ${CHIP_W} ${p.vh}`}
      width={CHIP_BOX} height={CHIP_BOX}
      style={{ display: 'block', overflow: 'hidden' }}>
      <defs>
        <clipPath id={clipId}>
          <rect x={22} y={p.clipVy ?? p.vy} width={CHIP_W} height={p.vh} />
        </clipPath>
      </defs>
      <text x={CX} y={CY} fontFamily="Bravura, serif" fontSize={CFS}
        fill={faded ? 'rgba(186,117,23,0.28)' : ACCENT} dominantBaseline="auto"
        clipPath={`url(#${clipId})`}>𝄞</text>
    </svg>
  )
}

type TCalBand = { vy: number; vh: number }
type TCalHandle = 'top' | 'bot' | 'move'

function TrebleClefCalibrator({ onClose }: { onClose: () => void }) {
  const [bands, setBands] = useState<Record<TreblePieceId, TCalBand>>({
    top: { vy: TPIECES.top.vy, vh: TPIECES.top.vh },
    mid: { vy: TPIECES.mid.vy, vh: TPIECES.mid.vh },
    bot: { vy: TPIECES.bot.vy, vh: TPIECES.bot.vh },
  })
  const dragRef = useRef<{
    which: TreblePieceId; handle: TCalHandle
    startY: number; startBand: TCalBand
  } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const vbX = 15, vbY = 20, vbW = 65, vbH = 160
  const dispW = 180

  function toSvgY(e: React.PointerEvent): number {
    const svg = svgRef.current
    if (!svg) return 0
    const r = svg.getBoundingClientRect()
    return vbY + (e.clientY - r.top) / r.height * vbH
  }

  const HT = 3  // hit tolerance in SVG units

  function hitBand(py: number, b: TCalBand): TCalHandle | null {
    if (Math.abs(py - b.vy) <= HT) return 'top'
    if (Math.abs(py - (b.vy + b.vh)) <= HT) return 'bot'
    if (py > b.vy && py < b.vy + b.vh) return 'move'
    return null
  }

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    const py = toSvgY(e)
    const ids: TreblePieceId[] = ['bot', 'mid', 'top']
    for (const id of ids) {
      const h = hitBand(py, bands[id])
      if (h) {
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { which: id, handle: h, startY: py, startBand: { ...bands[id] } }
        return
      }
    }
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = dragRef.current
    if (!d) return
    const py = toSvgY(e)
    const dy = py - d.startY
    const b = d.startBand
    const min = 4
    let nb: TCalBand
    switch (d.handle) {
      case 'top': nb = { vy: b.vy + dy, vh: Math.max(min, b.vh - dy) }; break
      case 'bot': nb = { vy: b.vy, vh: Math.max(min, b.vh + dy) }; break
      default:    nb = { vy: b.vy + dy, vh: b.vh }; break
    }
    setBands(prev => ({ ...prev, [d.which]: nb }))
  }

  function onUp(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragRef.current = null
  }

  const fmt = (n: number) => Math.round(n * 10) / 10
  const COLORS: Record<TreblePieceId, string> = {
    top: ACCENT,
    mid: '#2A6B1E',
    bot: '#2A5C9A',
  }
  const FILLS: Record<TreblePieceId, string> = {
    top: 'rgba(186,117,23,0.18)',
    mid: 'rgba(42,107,30,0.18)',
    bot: 'rgba(42,92,154,0.18)',
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: ACCENT, fontWeight: 700, margin: 0 }}>
          Calibrate segments
        </p>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontFamily: F, fontSize: 13, color: GREY, cursor: 'pointer', padding: 0 }}>
          Close ✕
        </button>
      </div>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12, lineHeight: 1.5 }}>
        Drag inside a band to move it · drag its top or bottom edge to resize.
        {' '}<span style={{ color: ACCENT, fontWeight: 600 }}>Orange</span> = Top curl
        {' · '}<span style={{ color: '#2A6B1E', fontWeight: 600 }}>Green</span> = Loop
        {' · '}<span style={{ color: '#2A5C9A', fontWeight: 600 }}>Blue</span> = Tail
      </p>
      <div style={{ maxHeight: 320, overflowY: 'auto', borderRadius: 10, border: '1px solid #EDE8DF' }}>
        <svg
          ref={svgRef}
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          width={dispW}
          height={Math.round(dispW * vbH / vbW)}
          style={{ display: 'block', background: '#ECE3CC', touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        >
          {[1,2,3,4,5].map(n => (
            <line key={n} x1={vbX} y1={lineY(n)} x2={vbX + vbW} y2={lineY(n)} stroke={DARK} strokeWidth={0.25} />
          ))}
          <text x={CX} y={CY} fontFamily="Bravura, serif" fontSize={CFS} fill={DARK} dominantBaseline="auto">𝄞</text>
          {(['top', 'mid', 'bot'] as TreblePieceId[]).map(id => {
            const b = bands[id]
            const color = COLORS[id]
            return (
              <g key={id}>
                <rect x={22} y={b.vy} width={CHIP_W} height={b.vh}
                  fill={FILLS[id]} stroke={color} strokeWidth={0.6} strokeDasharray="2 1" />
                <line x1={22} y1={b.vy} x2={22 + CHIP_W} y2={b.vy} stroke={color} strokeWidth={1.2} />
                <line x1={22} y1={b.vy + b.vh} x2={22 + CHIP_W} y2={b.vy + b.vh} stroke={color} strokeWidth={1.2} />
              </g>
            )
          })}
        </svg>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
        {(['top', 'mid', 'bot'] as TreblePieceId[]).map(id => {
          const b = bands[id]
          const color = COLORS[id]
          return (
            <div key={id} style={{ background: '#FDFBF5', border: `1px solid ${color}`, borderRadius: 8, padding: '8px 10px' }}>
              <p style={{ fontFamily: F, fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 4px' }}>
                {TPIECES[id].label}
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: 11, color: DARK, margin: 0, lineHeight: 1.9 }}>
                vy:{fmt(b.vy)}<br />vh:{fmt(b.vh)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrebleEx2({ onDone }: { onDone: () => void }) {
  const ROUNDS = 3
  const [round, setRound] = useState(0)
  const [placed, setPlaced] = useState<Set<TreblePieceId>>(new Set())
  const [dragging, setDragging] = useState<TreblePieceId | null>(null)
  const [dragClient, setDragClient] = useState({ x: 0, y: 0 })
  const [calibrating, setCalibrating] = useState(false)
  const staffRef = useRef<SVGSVGElement>(null)
  const allPieceIds: TreblePieceId[] = ['top', 'mid', 'bot']
  // Shuffle chip order each round so student must search
  const [chipOrder, setChipOrder] = useState<TreblePieceId[]>(() => shuffled(allPieceIds))

  const allPlaced = placed.size === 3

  function startDrag(id: TreblePieceId, e: React.PointerEvent<HTMLDivElement>) {
    if (placed.has(id)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(id)
    setDragClient({ x: e.clientX, y: e.clientY })
  }
  function moveDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    setDragClient({ x: e.clientX, y: e.clientY })
  }
  function endDrag(e: React.PointerEvent<HTMLDivElement>, id: TreblePieceId) {
    if (!dragging || dragging !== id) return
    // Release pointer capture immediately so the element resets cleanly
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    const svg = staffRef.current
    if (svg) {
      const r = svg.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top && e.clientY <= r.bottom) {
        setPlaced(prev => new Set([...prev, id]))
      }
    }
    setDragging(null)
  }
  function nextRound() {
    if (round + 1 >= ROUNDS) { onDone(); return }
    setRound(r => r + 1)
    setPlaced(new Set())
    setChipOrder(shuffled(allPieceIds))
  }

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      <ExLabel>Exercise 3 · Assemble the treble clef</ExLabel>
      {calibrating && <TrebleClefCalibrator onClose={() => setCalibrating(false)} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button onClick={() => setCalibrating(c => !c)} style={{
          fontFamily: F, fontSize: 11, color: calibrating ? ACCENT : '#B0ACA4',
          background: 'none', border: `1px solid ${calibrating ? ACCENT : '#D9CFAE'}`,
          borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
        }}>
          {calibrating ? '✕ close calibrator' : 'calibrate'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            background: i < round ? CORRECT : i === round ? ACCENT : '#D9CFAE',
          }} />
        ))}
      </div>

      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 6 }}>
        Build {round + 1} of {ROUNDS}
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 16, lineHeight: 1.6 }}>
        {allPlaced
          ? 'Complete. The loop circles line 2 · that is what makes it a G clef.'
          : 'Drag each piece onto the staff to build the treble clef.'}
      </p>

      {/* Staff */}
      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12, padding: '16px 0', marginBottom: 20 }}>
        <svg ref={staffRef} viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <defs>
            {allPieceIds.map(id => (
              <clipPath key={id} id={`tc-${id}-r${round}`}>
                <rect x={22} y={TPIECES[id].vy} width={CHIP_W} height={TPIECES[id].vh} />
              </clipPath>
            ))}
          </defs>

          <StaffBase
            lineColors={allPlaced ? { 2: ACCENT } : {}}
            lineWidths={allPlaced ? { 2: 2.5 } : {}}
          />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />

          {/* Ghost target · faint full clef so student can see where pieces go */}
          {!allPlaced && (
            <text x={CX} y={CY} fontFamily="Bravura, serif" fontSize={CFS}
              fill="rgba(26,26,24,0.09)" dominantBaseline="auto">𝄞</text>
          )}

          {/* Drop-zone highlight while a piece is being dragged */}
          {dragging && (
            <rect x={sL + 2} y={tTop - 16} width={sR - sL - 4} height={svgH - tTop + 14}
              fill="rgba(186,117,23,0.07)" stroke="rgba(186,117,23,0.45)"
              strokeWidth={2} strokeDasharray="6 3" rx={8} />
          )}

          {/* Placed pieces · each clips the identical Bravura glyph to its region */}
          {allPieceIds.map(id =>
            placed.has(id) ? (
              <text key={id} x={CX} y={CY} fontFamily="Bravura, serif" fontSize={CFS}
                fill={allPlaced ? DARK : ACCENT}
                dominantBaseline="auto"
                clipPath={`url(#tc-${id}-r${round})`}>𝄞</text>
            ) : null
          )}

          {/* Whole note + label when fully assembled */}
          {allPlaced && (
            <>
              <BravuraWhole cx={sL + 78} cy={lineY(2)} />
              <rect x={sL + 120} y={lineY(3) - 9} width={72} height={16} rx={3} fill="white" opacity={0.60} />
              <text x={sL + 156} y={lineY(3) + 4} fontFamily={F} fontSize={12}
                fill={ACCENT} fontWeight="700" textAnchor="middle">Line 2 = G</text>
            </>
          )}
        </svg>
      </div>

      {/* Piece palette · shuffled order, equal fixed-size boxes */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        {chipOrder.map(id => {
          const done = placed.has(id)
          const isBeingDragged = dragging === id
          return (
            <div key={id} style={{ textAlign: 'center' }}>
              <div
                onPointerDown={e => startDrag(id, e)}
                onPointerMove={moveDrag}
                onPointerUp={e => endDrag(e, id)}
                style={{
                  width: CHIP_BOX, height: CHIP_BOX,
                  border: `1.5px ${done ? 'solid rgba(42,107,30,0.35)' : 'dashed rgba(186,117,23,0.55)'}`,
                  borderRadius: 10,
                  background: done ? 'rgba(42,107,30,0.05)' : 'white',
                  cursor: done ? 'default' : 'grab',
                  opacity: done ? 0.3 : isBeingDragged ? 0.4 : 1,
                  touchAction: 'none',
                  userSelect: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <TClefChip id={id} faded={done} />
              </div>
              <p style={{
                fontFamily: F, fontSize: 11, margin: '6px 0 0',
                color: done ? CORRECT : GREY,
                fontWeight: done ? 600 : 400,
              }}>
                {done ? '✓ ' : ''}{TPIECES[id].label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Part descriptions */}
      {!allPlaced && (
        <p style={{ fontFamily: F, fontSize: 13, color: '#B0ACA4', textAlign: 'center', margin: '0 0 16px' }}>
          Drag a piece onto the staff above
        </p>
      )}

      {/* Complete */}
      {allPlaced && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: F, fontSize: 14, color: CORRECT, fontWeight: 600, margin: 0 }}>
            ✓ Treble clef assembled
          </p>
          <PrimaryBtn
            label={round + 1 >= ROUNDS ? 'Continue →' : `Again (${round + 1}/${ROUNDS}) →`}
            onClick={nextRound}
          />
        </div>
      )}

      {/* Drag ghost · portalled to body so it's never clipped */}
      {dragging && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          left: dragClient.x,
          top: dragClient.y,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0.88,
          filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.22))',
        }}>
          <svg viewBox={`22 ${TPIECES[dragging].vy} 60 ${TPIECES[dragging].vh}`}
            width={58} height={Math.max(16, Math.round(TPIECES[dragging].vh * 0.88))}
            style={{ display: 'block' }}>
            <text x={CX} y={CY} fontFamily="Bravura, serif" fontSize={CFS}
              fill={ACCENT} dominantBaseline="auto">𝄞</text>
          </svg>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── BASS INTRO ───────────────────────────────────────────────────────────────

function BassIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <SectionTag>The Bass Clef</SectionTag>
      <SectionTitle>Also called the F clef</SectionTitle>
      <ConceptBox>
        The <strong>bass clef</strong> (𝄢) is also called the <strong>F clef</strong>. Its two dots sit above and below the <strong>fourth line</strong> of the staff, permanently naming that line <strong>F</strong>. All other bass staff notes are counted from this anchor.
      </ConceptBox>

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH + 10}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          {/* Line 4 highlighted */}
          <StaffBase lineColors={{ 4: ACCENT }} lineWidths={{ 4: 2.5 }} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />
          <BassClef x={sL + 4} color={DARK} />

          {/* Whole note on line 4, close to clef */}
          <BravuraWhole cx={sL + 88} cy={lineY(4)} size={60} color={ACCENT} />

          {/* Label near line 3 · no arrow, white bg */}
          <rect x={sL + 106} y={lineY(3) - 10} width={120} height={18} rx={3} fill="white" opacity={0.90} />
          <text x={sL + 166} y={lineY(3) + 4} fontFamily={F} fontSize={13} fill={ACCENT}
            fontWeight="700" textAnchor="middle">Line 4 = F</text>
        </svg>
      </div>

      <PrimaryBtn label="Exercise 4 · Place the dots →" onClick={onNext} />
    </div>
  )
}

// ── BASS EX 1: Tap line 4 (dots exercise) ────────────────────────────────────

function BassEx1({ onDone }: { onDone: (s: number, t: number) => void }) {
  const ROUNDS = 6
  const [round, setRound] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [hovered, setHovered] = useState<number | null>(null)

  function tap(n: number) {
    if (chosen !== null) return
    const ok = n === 4
    setChosen(n)
    if (ok) setScore(s => s + 1)
    setResults(r => [...r, ok])
  }
  function next() {
    if (round + 1 >= ROUNDS) { onDone(score / ROUNDS, ROUNDS); return }
    setRound(r => r + 1)
    setChosen(null)
    setHovered(null)
  }

  const correct = chosen === 4

  return (
    <div>
      <ExLabel>Exercise 4 · Identify the F line</ExLabel>
      <ProgressDots total={ROUNDS} idx={round} results={results} />

      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 6 }}>
        The bass clef's dots bracket the fourth line.
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 20 }}>
        Hover to explore, then tap <strong>line 4</strong> · the F line.
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase
            lineColors={
              chosen !== null
                ? { 4: correct ? CORRECT : DARK, ...(chosen !== 4 ? { [chosen]: WRONG } : {}) }
                : hovered !== null ? { [hovered]: ACCENT } : {}
            }
            lineWidths={
              chosen !== null
                ? { 4: 2.5, ...(chosen !== 4 ? { [chosen]: 2 } : {}) }
                : hovered !== null ? { [hovered]: 2.5 } : {}
            }
          />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />
          <BassClef x={sL + 4} color={DARK} />

          {/* Hover label */}
          {chosen === null && hovered !== null && (
            <text x={sR - 8} y={lineY(hovered) - 4} fontFamily={F} fontSize={11}
              fill={ACCENT} textAnchor="end" fontWeight="600">Line {hovered}</text>
          )}

          {/* After answer: Bravura open whole note on correct line 4 */}
          {chosen !== null && <BravuraWhole cx={sL + 76} cy={lineY(4)} color={CORRECT} />}
          {chosen !== null && !correct && <BravuraWhole cx={sL + 76} cy={lineY(chosen)} color={WRONG} />}

          {[1, 2, 3, 4, 5].map(n => (
            <text key={n} x={sL - 14} y={lineY(n) + 4} fontFamily={F} fontSize={11}
              fill={chosen !== null && n === 4 ? CORRECT : chosen !== null && n === chosen ? WRONG : GREY}
              textAnchor="middle">{n}</text>
          ))}
          {chosen === null && [1, 2, 3, 4, 5].map(n => (
            <LineHitZone key={n} n={n} x1={sL + 70} x2={sR}
              onClick={() => tap(n)}
              onEnter={() => setHovered(n)}
              onLeave={() => setHovered(null)} />
          ))}
        </svg>
      </div>

      {chosen !== null && (
        <FeedbackRow
          result={correct}
          correctLabel="Line 4 is the F line · the bass clef dots bracket it"
          onNext={next}
          nextLabel={round + 1 >= ROUNDS ? 'Finish →' : `Next (${round + 1}/${ROUNDS}) →`}
        />
      )}
      {chosen === null && (
        <p style={{ fontFamily: F, fontSize: 13, color: '#B0ACA4', textAlign: 'center' }}>Tap a line</p>
      )}
    </div>
  )
}

// ── BASS EX 2: Assemble bass clef from parts ────────────────────────────────
// BX/BY/BFS match BassClef component: y=lineY(4)+2, fontSize=66
const BX = sL + 2         // 34
const BY = lineY(4) + 2   // 72 at tTop=54, step=8
const BFS = 66

// ── Bass clef calibrator ─────────────────────────────────────────────────────
type CalRect = { rx: number; ry: number; rw: number; rh: number }
type CalHandle = 'nw' | 'ne' | 'sw' | 'se' | 'move'

function BassClefCalibrator({ onClose }: { onClose: () => void }) {
  const [bodyR, setBodyR] = useState<CalRect>({ ...BPIECES.body })
  const [dotsR, setDotsR] = useState<CalRect>({ ...BPIECES.dots })
  const dragRef = useRef<{
    which: 'body' | 'dots'; handle: CalHandle
    startSvg: { x: number; y: number }; startRect: CalRect
  } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // ViewBox zoomed in on the bass clef at its exact exercise coordinates
  const vbX = 18, vbY = 10, vbW = 80, vbH = 100
  const dispW = 320  // 4× scale

  function toSvg(e: React.PointerEvent): { x: number; y: number } {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const r = svg.getBoundingClientRect()
    return {
      x: vbX + (e.clientX - r.left) / r.width * vbW,
      y: vbY + (e.clientY - r.top) / r.height * vbH,
    }
  }

  const HR = 3.5  // handle hit/display radius in SVG user units

  function hitHandle(px: number, py: number, r: CalRect): CalHandle | null {
    if (Math.abs(px - r.rx) <= HR && Math.abs(py - r.ry) <= HR) return 'nw'
    if (Math.abs(px - (r.rx + r.rw)) <= HR && Math.abs(py - r.ry) <= HR) return 'ne'
    if (Math.abs(px - r.rx) <= HR && Math.abs(py - (r.ry + r.rh)) <= HR) return 'sw'
    if (Math.abs(px - (r.rx + r.rw)) <= HR && Math.abs(py - (r.ry + r.rh)) <= HR) return 'se'
    if (px >= r.rx && px <= r.rx + r.rw && py >= r.ry && py <= r.ry + r.rh) return 'move'
    return null
  }

  function applyHandle(handle: CalHandle, r: CalRect, dx: number, dy: number): CalRect {
    const min = 4
    switch (handle) {
      case 'nw': return { rx: r.rx + dx, ry: r.ry + dy, rw: Math.max(min, r.rw - dx), rh: Math.max(min, r.rh - dy) }
      case 'ne': return { rx: r.rx, ry: r.ry + dy, rw: Math.max(min, r.rw + dx), rh: Math.max(min, r.rh - dy) }
      case 'sw': return { rx: r.rx + dx, ry: r.ry, rw: Math.max(min, r.rw - dx), rh: Math.max(min, r.rh + dy) }
      case 'se': return { rx: r.rx, ry: r.ry, rw: Math.max(min, r.rw + dx), rh: Math.max(min, r.rh + dy) }
      default:   return { rx: r.rx + dx, ry: r.ry + dy, rw: r.rw, rh: r.rh }
    }
  }

  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    const p = toSvg(e)
    let handle = hitHandle(p.x, p.y, dotsR)
    let which: 'body' | 'dots' | null = handle ? 'dots' : null
    if (!handle) { handle = hitHandle(p.x, p.y, bodyR); if (handle) which = 'body' }
    if (!handle || !which) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { which, handle, startSvg: p, startRect: which === 'body' ? { ...bodyR } : { ...dotsR } }
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = dragRef.current
    if (!d) return
    const p = toSvg(e)
    const nr = applyHandle(d.handle, d.startRect, p.x - d.startSvg.x, p.y - d.startSvg.y)
    if (d.which === 'body') setBodyR(nr); else setDotsR(nr)
  }

  function onUp(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragRef.current = null
  }

  const fmt = (n: number) => Math.round(n * 10) / 10

  const layers = [
    { name: 'Curve', r: bodyR, color: ACCENT, fill: 'rgba(186,117,23,0.20)' },
    { name: 'Dots',  r: dotsR, color: '#2A5C9A', fill: 'rgba(42,92,154,0.20)' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: ACCENT, fontWeight: 700, margin: 0 }}>
          Calibrate segments
        </p>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontFamily: F, fontSize: 13, color: GREY, cursor: 'pointer', padding: 0 }}>
          Close ✕
        </button>
      </div>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12, lineHeight: 1.5 }}>
        Drag the boxes · or drag their corner handles to resize.
        {' '}<span style={{ color: ACCENT, fontWeight: 600 }}>Orange</span> = Curve
        {' · '}<span style={{ color: '#2A5C9A', fontWeight: 600 }}>Blue</span> = Dots
      </p>

      <svg
        ref={svgRef}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        width={dispW}
        height={Math.round(dispW * vbH / vbW)}
        style={{ display: 'block', border: '1px solid #EDE8DF', borderRadius: 10, background: '#ECE3CC', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        {/* Staff lines for reference */}
        {[1,2,3,4,5].map(n => (
          <line key={n} x1={vbX} y1={lineY(n)} x2={vbX + vbW} y2={lineY(n)} stroke={DARK} strokeWidth={0.25} />
        ))}
        {/* Bass clef at exact exercise coordinates */}
        <text x={BX} y={BY} fontFamily="Bravura, serif" fontSize={BFS} fill={DARK} dominantBaseline="auto">𝄢</text>
        {/* Overlay rects + corner handles */}
        {layers.map(({ name, r, color, fill }) => (
          <g key={name}>
            <rect x={r.rx} y={r.ry} width={r.rw} height={r.rh}
              fill={fill} stroke={color} strokeWidth={0.6} strokeDasharray="2 1" />
            {([[r.rx, r.ry], [r.rx + r.rw, r.ry], [r.rx, r.ry + r.rh], [r.rx + r.rw, r.ry + r.rh]] as [number,number][]).map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={HR} fill="white" stroke={color} strokeWidth={0.6} />
            ))}
          </g>
        ))}
      </svg>

      {/* Live coordinate readout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        {layers.map(({ name, r, color }) => (
          <div key={name} style={{ background: '#FDFBF5', border: `1px solid ${color}`, borderRadius: 8, padding: '8px 12px' }}>
            <p style={{ fontFamily: F, fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 4px' }}>{name}</p>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: DARK, margin: 0, lineHeight: 1.9 }}>
              rx:{fmt(r.rx)}  ry:{fmt(r.ry)}<br />
              rw:{fmt(r.rw)}  rh:{fmt(r.rh)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// At BX=34, BY=72, BFS=66: body (C-curve) x≈34-56, y≈14-80; dots x≈54-74, y≈48-86
type BassPieceId = 'body' | 'dots'
const BPIECES: Record<BassPieceId, { label: string; rx: number; rw: number; ry: number; rh: number; pad?: number; padX?: number; padY?: number }> = {
  body: { label: 'Curve', rx: 32.6, rw: 36.4, ry: 52.8, rh: 62.9, pad: 8 },
  dots: { label: 'Dots',  rx: 70,   rw: 12.7, ry: 54.7, rh: 32.3, padX: 33.7, padY: 23.9 },
}

function BClefChip({ id, faded }: { id: BassPieceId; faded?: boolean }) {
  const p = BPIECES[id]
  const fill = faded ? 'rgba(186,117,23,0.28)' : ACCENT
  const clipId = `chip-clip-${id}`
  const padX = p.padX ?? p.pad ?? 0
  const padY = p.padY ?? p.pad ?? 0
  return (
    <svg viewBox={`${p.rx - padX} ${p.ry - padY} ${p.rw + 2 * padX} ${p.rh + 2 * padY}`}
      width={CHIP_BOX} height={CHIP_BOX}
      style={{ display: 'block', overflow: 'hidden' }}>
      <defs>
        <clipPath id={clipId}>
          <rect x={p.rx} y={p.ry} width={p.rw} height={p.rh} />
        </clipPath>
      </defs>
      <text x={BX} y={BY} fontFamily="Bravura, serif" fontSize={BFS}
        fill={fill} dominantBaseline="auto" clipPath={`url(#${clipId})`}>𝄢</text>
    </svg>
  )
}

function BassEx2({ onDone }: { onDone: () => void }) {
  const ROUNDS = 3
  const [round, setRound] = useState(0)
  const [placed, setPlaced] = useState<Set<BassPieceId>>(new Set())
  const [dragging, setDragging] = useState<BassPieceId | null>(null)
  const [dragClient, setDragClient] = useState({ x: 0, y: 0 })
  const [calibrating, setCalibrating] = useState(false)
  const staffRef = useRef<SVGSVGElement>(null)
  const allPieceIdsB: BassPieceId[] = ['body', 'dots']
  const [chipOrderB, setChipOrderB] = useState<BassPieceId[]>(() => shuffled(allPieceIdsB))
  const allPlaced = placed.size === 2

  function startDragB(id: BassPieceId, e: React.PointerEvent<HTMLDivElement>) {
    if (placed.has(id)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(id); setDragClient({ x: e.clientX, y: e.clientY })
  }
  function moveDragB(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return; setDragClient({ x: e.clientX, y: e.clientY })
  }
  function endDragB(e: React.PointerEvent<HTMLDivElement>, id: BassPieceId) {
    if (!dragging || dragging !== id) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    const svg = staffRef.current
    if (svg) {
      const r = svg.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top && e.clientY <= r.bottom) {
        setPlaced(prev => new Set([...prev, id]))
      }
    }
    setDragging(null)
  }
  function nextRound() {
    if (round + 1 >= ROUNDS) { onDone(); return }
    setRound(r => r + 1); setPlaced(new Set())
    setChipOrderB(shuffled(allPieceIdsB))
  }

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      <ExLabel>Exercise 5 · Assemble the bass clef</ExLabel>
      {calibrating && <BassClefCalibrator onClose={() => setCalibrating(false)} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button onClick={() => setCalibrating(c => !c)} style={{
          fontFamily: F, fontSize: 11, color: calibrating ? ACCENT : '#B0ACA4',
          background: 'none', border: `1px solid ${calibrating ? ACCENT : '#D9CFAE'}`,
          borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
        }}>
          {calibrating ? '✕ close calibrator' : 'calibrate'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            background: i < round ? CORRECT : i === round ? ACCENT : '#D9CFAE'
          }} />
        ))}
      </div>
      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 6 }}>
        Build {round + 1} of {ROUNDS}
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 16, lineHeight: 1.6 }}>
        {allPlaced ? 'Complete. The dots bracket line 4 · that is what makes it an F clef.'
          : 'Drag each piece onto the staff.'}
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12, padding: '16px 0', marginBottom: 20 }}>
        <svg ref={staffRef} viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          {/* clef shifted 2px right vs global BX; clipPath rects follow */}
          <defs>
            {allPieceIdsB.map(id => {
              const p = BPIECES[id]
              return (
                <clipPath key={id} id={`bc-${id}-r${round}`}>
                  <rect x={p.rx + 2} y={p.ry} width={p.rw} height={p.rh} />
                </clipPath>
              )
            })}
          </defs>
          <StaffBase lineColors={allPlaced ? { 4: ACCENT } : {}} lineWidths={allPlaced ? { 4: 2.5 } : {}} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />

          {!allPlaced && (
            <text x={BX + 2} y={BY} fontFamily="Bravura, serif" fontSize={BFS}
              fill="rgba(26,26,24,0.09)" dominantBaseline="auto">𝄢</text>
          )}
          {dragging && (
            <rect x={sL} y={tTop - 12} width={sR - sL} height={svgH - tTop + 10}
              fill="rgba(186,117,23,0.05)" stroke="rgba(186,117,23,0.28)"
              strokeWidth={1.5} strokeDasharray="4 3" rx={6} />
          )}
          {allPieceIdsB.map(id =>
            placed.has(id) ? (
              <text key={id} x={BX + 2} y={BY} fontFamily="Bravura, serif" fontSize={BFS}
                fill={allPlaced ? DARK : ACCENT}
                dominantBaseline="auto"
                clipPath={`url(#bc-${id}-r${round})`}>𝄢</text>
            ) : null
          )}
          {allPlaced && (
            <>
              <BravuraWhole cx={sL + 84} cy={lineY(4)} />
              <text x={sL + 120} y={lineY(4) - 4} fontFamily={F} fontSize={12}
                fill={ACCENT} fontWeight="700">Line 4 = F</text>
            </>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
        {chipOrderB.map(id => {
          const done = placed.has(id)
          return (
            <div key={id} style={{ textAlign: 'center' }}>
              <div onPointerDown={e => startDragB(id, e)}
                onPointerMove={moveDragB} onPointerUp={e => endDragB(e, id)}
                style={{
                  width: CHIP_BOX, height: CHIP_BOX,
                  border: `1.5px ${done ? 'solid rgba(42,107,30,0.35)' : 'dashed rgba(186,117,23,0.55)'}`,
                  borderRadius: 10, background: done ? 'rgba(42,107,30,0.05)' : 'white',
                  cursor: done ? 'default' : 'grab', opacity: done ? 0.3 : dragging === id ? 0.4 : 1,
                  touchAction: 'none', userSelect: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                <BClefChip id={id} faded={done} />
              </div>
              <p style={{ fontFamily: F, fontSize: 11, margin: '6px 0 0', color: done ? CORRECT : GREY, fontWeight: done ? 600 : 400 }}>
                {done ? '✓ ' : ''}{BPIECES[id].label}
              </p>
            </div>
          )
        })}
      </div>

      {!allPlaced && <p style={{ fontFamily: F, fontSize: 13, color: '#B0ACA4', textAlign: 'center', margin: '0 0 16px' }}>Drag a piece onto the staff above</p>}
      {allPlaced && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: F, fontSize: 14, color: CORRECT, fontWeight: 600, margin: 0 }}>✓ Bass clef assembled</p>
          <PrimaryBtn label={round + 1 >= ROUNDS ? 'Continue →' : `Again (${round + 1}/${ROUNDS}) →`} onClick={nextRound} />
        </div>
      )}

      {dragging && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', left: dragClient.x, top: dragClient.y, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 9999, opacity: 0.88, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.22))' }}>
          <BClefChip id={dragging} />
        </div>,
        document.body
      )}
    </div>
  )
}

// ── GRAND EX 1: Identify the missing part ────────────────────────────────────

const MISSING_QUESTIONS = [
  { id: 'brace',      label: 'What is missing?', opts: ['Brace', 'Bass Clef', 'Double Bar', 'Treble Clef'], answer: 'Brace' },
  { id: 'treble',     label: 'What is missing?', opts: ['Treble Clef', 'Brace', 'Double Bar', 'Left Bar'], answer: 'Treble Clef' },
  { id: 'bass',       label: 'What is missing?', opts: ['Brace', 'Bass Clef', 'Treble Clef', 'Double Bar'], answer: 'Bass Clef' },
  { id: 'double-bar', label: 'What is missing?', opts: ['Double Bar', 'Brace', 'Bass Clef', 'Left Bar'], answer: 'Double Bar' },
  { id: 'connector',  label: 'What is missing?', opts: ['Left Bar', 'Brace', 'Treble Clef', 'Double Bar'], answer: 'Left Bar' },
] as const

type MissingId = typeof MISSING_QUESTIONS[number]['id']

function MissingStaff({ missing, revealColor }: { missing: MissingId; revealColor?: string }) {
  // gStep=8; match Ex7 clef sizes (treble=50, bass=50); extra top padding so treble clef isn't cut
  const gStep = 6, gSL = 28, gSR = 170, gTT = 22
  const gBT = gTT + 8 * gStep + 40   // gap between treble and bass staves
  const gBB = gBT + 8 * gStep
  const H = gBB + 14

  function gLineY(n: number) { return gTT + (5 - n) * 2 * gStep }
  function gBLineY(n: number) { return gBT + (5 - n) * 2 * gStep }

  // Match Ex7 sizes: treble=50 at G line, bass=50 at F line
  const trebleY = gTT + 6 * gStep         // G line (line 2)
  const bassY   = gBT + 2 * gStep + 1     // F line (line 4) + 1px
  const trebleFS = 50
  const bassFS   = 50

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
        <text x={gSL + 5} y={trebleY} fontFamily="Bravura, serif" fontSize={trebleFS} fill={DARK} dominantBaseline="auto">𝄞</text>
      )}
      {missing !== 'bass' && (
        <text x={gSL + 5} y={bassY} fontFamily="Bravura, serif" fontSize={bassFS} fill={DARK} dominantBaseline="auto">𝄢</text>
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
          <text x={gSL + 5} y={trebleY} fontFamily="Bravura, serif" fontSize={trebleFS} fill={revealColor} dominantBaseline="auto">𝄞</text>
        ) : missing === 'bass' ? (
          <text x={gSL + 5} y={bassY} fontFamily="Bravura, serif" fontSize={bassFS} fill={revealColor} dominantBaseline="auto">𝄢</text>
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

function GrandEx1({ onDone }: { onDone: (s: number, t: number) => void }) {
  const questions = useMemo(() => shuffled([...MISSING_QUESTIONS]), [])
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<boolean[]>([])

  const q = questions[idx]
  const total = questions.length

  function pick(opt: string) {
    if (chosen !== null) return
    const ok = opt === q.answer
    setChosen(opt)
    if (ok) setScore(s => s + 1)
    setResults(r => [...r, ok])
  }
  function next() {
    if (idx + 1 >= total) { onDone(score / total, total); return }
    setIdx(i => i + 1)
    setChosen(null)
  }

  const isCorrect = chosen !== null && chosen === q.answer

  return (
    <div>
      <ExLabel>Exercise 6 · Complete the grand staff</ExLabel>
      <ProgressDots total={total} idx={idx} results={results} />
      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 16 }}>
        What is missing from this grand staff?
      </p>

      {/* Staff: after answer, MissingStaff shows the missing part filled in green/red */}
      <div style={{ background: '#ECE3CC', borderRadius: 12, padding: '20px 0', marginBottom: 20 }}>
        <MissingStaff missing={q.id} revealColor={chosen !== null ? (isCorrect ? CORRECT : WRONG) : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {q.opts.map(opt => {
          let bg = '#f3eee3', border = '1px solid #E0DBCF', color = '#4a4540'
          if (chosen !== null) {
            if (opt === q.answer) { bg = 'rgba(42,107,30,0.08)'; border = `1px solid ${CORRECT}`; color = CORRECT }
            else if (opt === chosen) { bg = 'rgba(181,64,42,0.08)'; border = `1px solid ${WRONG}`; color = WRONG }
          }
          return (
            <button key={opt} onClick={() => pick(opt)} style={{
              background: bg, border, borderRadius: 10, padding: '12px 16px',
              fontFamily: F, fontSize: 14, color, cursor: chosen ? 'default' : 'pointer', textAlign: 'left',
            }}>{opt}</button>
          )
        })}
      </div>

      {chosen !== null && (
        <FeedbackRow
          result={isCorrect}
          correctLabel={`The missing part is the ${q.answer}`}
          onNext={next}
          nextLabel={idx + 1 >= total ? 'Finish →' : 'Next →'}
        />
      )}
    </div>
  )
}

// ── GRAND EX 2: Build the grand staff ────────────────────────────────────────

const BUILD_PARTS = [
  { key: 'treble', label: 'Treble Clef', desc: 'G clef · anchors G on line 2 of the upper staff' },
  { key: 'bass',   label: 'Bass Clef',   desc: 'F clef · anchors F on line 4 of the lower staff' },
  { key: 'brace',  label: 'Brace',       desc: 'Curved bracket joining both staves on the left' },
  { key: 'dbar',   label: 'Double Bar',  desc: 'Two bar lines on the right side to close the system' },
] as const
type BuildKey = typeof BUILD_PARTS[number]['key']

function BuildPreview({ placed }: { placed: Set<BuildKey> }) {
  const gStep = 8, gSL = 32, gSR = 200, gTT = 18
  const gBT = gTT + 8 * gStep + 28
  const gBB = gBT + 8 * gStep
  const H = gBB + 12

  function gLineY(n: number) { return gTT + (5 - n) * 2 * gStep }
  function gBLineY(n: number) { return gBT + (5 - n) * 2 * gStep }

  const trebleY = gTT + 6 * gStep        // G line (line 2)
  const bassY   = gBT + 2 * gStep + 1    // F line (line 4) + 1px

  return (
    <svg viewBox={`0 0 ${gSR + 12} ${H}`} width="100%" style={{ maxWidth: gSR + 12, display: 'block', margin: '0 auto' }}>
      {[1,2,3,4,5].map(n => <line key={'t'+n} x1={gSL} y1={gLineY(n)} x2={gSR} y2={gLineY(n)} stroke={DARK} strokeWidth={1.2} />)}
      {[1,2,3,4,5].map(n => <line key={'b'+n} x1={gSL} y1={gBLineY(n)} x2={gSR} y2={gBLineY(n)} stroke={DARK} strokeWidth={1.2} />)}
      <line x1={gSL} y1={gTT} x2={gSL} y2={gBB} stroke={DARK} strokeWidth={1.8} />
      {placed.has('brace') && (
        <text x={gSL - 8} y={gBB} fontSize={gBB - gTT}
          fontFamily="Bravura, serif" fill={ACCENT} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
      )}
      {placed.has('treble') && (
        <text x={gSL + 2} y={trebleY} fontFamily="Bravura, serif" fontSize={66} fill={ACCENT} dominantBaseline="auto">𝄞</text>
      )}
      {placed.has('bass') && (
        <text x={gSL + 2} y={bassY} fontFamily="Bravura, serif" fontSize={48} fill={ACCENT} dominantBaseline="auto">𝄢</text>
      )}
      {placed.has('dbar') && (
        <>
          <line x1={gSR - 5} y1={gTT} x2={gSR - 5} y2={gBB} stroke={ACCENT} strokeWidth={1.5} />
          <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={ACCENT} strokeWidth={4} />
        </>
      )}
    </svg>
  )
}

// Chip symbol renderers for GrandEx2 — no staff behind clefs for cleaner display
const GRAND_CHIP = 88  // px square · slightly larger than assembly chips
function GrandChip({ k, dim }: { k: BuildKey; dim?: boolean }) {
  const c = dim ? 'rgba(186,117,23,0.25)' : ACCENT
  if (k === 'treble') return (
    // fontSize=44 matches staff; 74×74 viewBox → scale≈1.18 = staff display scale
    <svg viewBox="-4 21 83 83" width={GRAND_CHIP} height={GRAND_CHIP} style={{ display: 'block' }}>
      <text x={35} y={72} fontFamily="Bravura, serif" fontSize={44} fill={c} textAnchor="middle" dominantBaseline="auto">𝄞</text>
    </svg>
  )
  if (k === 'bass') return (
    // fontSize=44 matches staff; viewBox centered on bass body+dots
    <svg viewBox="-3 15 74 74" width={GRAND_CHIP} height={GRAND_CHIP} style={{ display: 'block' }}>
      <text x={35} y={44} fontFamily="Bravura, serif" fontSize={44} fill={c} textAnchor="middle" dominantBaseline="auto">𝄢</text>
    </svg>
  )
  if (k === 'brace') return (
    <svg viewBox="2 0 28 70" width={GRAND_CHIP} height={GRAND_CHIP} style={{ display: 'block' }}>
      <text x={16} y={70} fontSize={70} fontFamily="Bravura, serif" fill={c} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
    </svg>
  )
  // dbar — thin + thick bars centered with clear gap
  return (
    <svg viewBox="0 0 30 60" width={GRAND_CHIP} height={GRAND_CHIP} style={{ display: 'block' }}>
      <line x1={12} y1={6} x2={12} y2={54} stroke={c} strokeWidth={1.5} />
      <line x1={19} y1={6} x2={19} y2={54} stroke={c} strokeWidth={4} />
    </svg>
  )
}

function GrandEx2({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0)
  const [placed, setPlaced] = useState<Set<BuildKey>>(new Set())
  const [dragging, setDragging] = useState<BuildKey | null>(null)
  const [dragClient, setDragClient] = useState({ x: 0, y: 0 })
  const staffRef = useRef<SVGSVGElement>(null)
  const [chipOrderG, setChipOrderG] = useState<BuildKey[]>(() => shuffled(BUILD_PARTS.map(p => p.key) as BuildKey[]))
  const complete = placed.size === BUILD_PARTS.length

  function startDragG(k: BuildKey, e: React.PointerEvent<HTMLDivElement>) {
    if (placed.has(k)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(k); setDragClient({ x: e.clientX, y: e.clientY })
  }
  function moveDragG(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return; setDragClient({ x: e.clientX, y: e.clientY })
  }
  function endDragG(e: React.PointerEvent<HTMLDivElement>, k: BuildKey) {
    if (!dragging || dragging !== k) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    const svg = staffRef.current
    if (svg) {
      const r = svg.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom)
        setPlaced(prev => new Set([...prev, k]))
    }
    setDragging(null)
  }
  function nextRound() {
    if (round + 1 >= 4) { onDone(); return }
    setRound(r => r + 1); setPlaced(new Set())
    setChipOrderG(shuffled(BUILD_PARTS.map(p => p.key) as BuildKey[]))
  }

  return (
    <div style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      <ExLabel>Exercise 7 · Build the grand staff</ExLabel>
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {[0,1,2,3].map(i => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            background: i < round ? CORRECT : i === round ? ACCENT : '#D9CFAE' }} />
        ))}
      </div>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 16 }}>
        Round {round + 1} of 4 · drag each part onto the staff.
      </p>

      <div style={{ background: '#ECE3CC', border: '1px solid #EDE8DF', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
        <svg ref={staffRef} viewBox={`0 0 ${220} ${180}`} width="100%"
          style={{ maxWidth: 260, display: 'block', margin: '0 auto' }}>
          {/* Grand staff preview */}
          {(() => {
            const gs = 5.5, gsl = 32, gsr = 212, gtt = 20, gbt = gtt + 8*gs + 42, gbb = gbt + 8*gs
            const gly = (n: number) => gtt + (5-n)*2*gs
            const gbly = (n: number) => gbt + (5-n)*2*gs
            return (
              <>
                {[1,2,3,4,5].map(n => <line key={'t'+n} x1={gsl} y1={gly(n)} x2={gsr} y2={gly(n)} stroke={DARK} strokeWidth={1.2} />)}
                {[1,2,3,4,5].map(n => <line key={'b'+n} x1={gsl} y1={gbly(n)} x2={gsr} y2={gbly(n)} stroke={DARK} strokeWidth={1.2} />)}
                <line x1={gsl} y1={gtt} x2={gsl} y2={gbb} stroke={DARK} strokeWidth={1.8} />
                {placed.has('brace') && (
                  <text x={gsl-8} y={gbt+8*gs} fontSize={gbb-gtt} fontFamily="Bravura, serif" fill={ACCENT} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
                )}
                {placed.has('treble') && (
                  <text x={gsl+4} y={gtt+6*gs} fontFamily="Bravura, serif" fontSize={44} fill={ACCENT} dominantBaseline="auto">𝄞</text>
                )}
                {placed.has('bass') && (
                  <text x={gsl+4} y={gbly(4)+1} fontFamily="Bravura, serif" fontSize={44} fill={ACCENT} dominantBaseline="auto">𝄢</text>
                )}
                {placed.has('dbar') && (
                  <>
                    <line x1={gsr-5} y1={gtt} x2={gsr-5} y2={gbb} stroke={ACCENT} strokeWidth={1.5} />
                    <line x1={gsr} y1={gtt} x2={gsr} y2={gbb} stroke={ACCENT} strokeWidth={4} />
                  </>
                )}
                {dragging && (
                  <rect x={gsl} y={gtt-10} width={gsr-gsl} height={gbb-gtt+20}
                    fill="rgba(186,117,23,0.05)" stroke="rgba(186,117,23,0.3)"
                    strokeWidth={1.5} strokeDasharray="4 3" rx={6} />
                )}
              </>
            )
          })()}
        </svg>
      </div>

      {/* 4 equal chip boxes, shuffled */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
        {chipOrderG.map(k => {
          const done = placed.has(k)
          return (
            <div key={k} style={{ textAlign: 'center' }}>
              <div onPointerDown={e => startDragG(k, e)} onPointerMove={moveDragG} onPointerUp={e => endDragG(e, k)}
                style={{
                  width: GRAND_CHIP, height: GRAND_CHIP, margin: '0 auto',
                  border: `1.5px ${done ? 'solid rgba(42,107,30,0.35)' : 'dashed rgba(186,117,23,0.55)'}`,
                  borderRadius: 10, background: done ? 'rgba(42,107,30,0.05)' : 'white',
                  cursor: done ? 'default' : 'grab', opacity: done ? 0.3 : dragging === k ? 0.4 : 1,
                  touchAction: 'none', userSelect: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                }}>
                <GrandChip k={k} dim={done} />
              </div>
              <p style={{ fontFamily: F, fontSize: 10, margin: '5px 0 0', color: done ? CORRECT : GREY, fontWeight: done ? 600 : 400 }}>
                {done ? '✓ ' : ''}{BUILD_PARTS.find(p => p.key === k)?.label}
              </p>
            </div>
          )
        })}
      </div>

      {complete && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: SERIF, fontSize: 18, color: CORRECT, margin: 0 }}>Grand staff complete!</p>
          <PrimaryBtn label={round + 1 >= 4 ? 'Finish →' : 'Next round →'} onClick={nextRound} />
        </div>
      )}
      {!complete && <p style={{ fontFamily: F, fontSize: 13, color: '#B0ACA4', textAlign: 'center' }}>Drag a piece onto the staff above</p>}

      {dragging && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', left: dragClient.x, top: dragClient.y, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 9999, opacity: 0.9, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.22))' }}>
          <GrandChip k={dragging} />
        </div>,
        document.body
      )}
    </div>
  )
}

// ── GRAND EX 3: Match symbols to names ───────────────────────────────────────

type MatchKey = 'treble-clef' | 'bass-clef' | 'brace' | 'double-bar' | 'grand-staff'

function MatchSymbol({ k, dim }: { k: MatchKey; dim?: boolean }) {
  const c = dim ? '#C8C4BA' : DARK

  // Single-staff layout: gTT=30 centers content; sH covers treble tail
  const gs = 6, gL = 12, gR = 78, gTT = 30
  const gLY = (n: number) => gTT + (5 - n) * 2 * gs  // gLY(5)=30, gLY(1)=86
  const sH = gLY(1) + 40  // 126 · covers treble tail at larger font size

  const sLines = (x1: number, x2: number) =>
    [1,2,3,4,5].map(n => <line key={n} x1={x1} y1={gLY(n)} x2={x2} y2={gLY(n)} stroke={c} strokeWidth={1} />)

  if (k === 'treble-clef') return (
    <svg viewBox={`0 0 90 ${sH}`} width={90} height={sH} style={{ display: 'block' }}>
      {sLines(gL, gR)}
      {/* Treble clef: anchor at G line = gTT + 6*gs = 30+42 = 72 */}
      <text x={gL + 14} y={gTT + 6 * gs} fontFamily="Bravura, serif" fontSize={52} fill={c} dominantBaseline="auto">𝄞</text>
    </svg>
  )
  if (k === 'bass-clef') return (
    <svg viewBox={`0 0 90 ${sH}`} width={90} height={sH} style={{ display: 'block' }}>
      {sLines(gL, gR)}
      {/* Bass clef: anchor at F line (line 4) + 1px = gLY(4)+1 */}
      <text x={gL + 15} y={gLY(4) + 1} fontFamily="Bravura, serif" fontSize={52} fill={c} dominantBaseline="auto">𝄢</text>
    </svg>
  )
  if (k === 'brace') return (
    <svg viewBox={`0 0 30 ${sH}`} width={30} height={sH} style={{ display: 'block' }}>
      <text x={17} y={sH} fontSize={sH} fontFamily="Bravura, serif" fill={c} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
    </svg>
  )
  if (k === 'double-bar') return (
    <svg viewBox={`0 0 30 ${sH}`} width={30} height={sH} style={{ display: 'block' }}>
      {[1,2,3,4,5].map(n => <line key={n} x1={2} y1={gLY(n)} x2={24} y2={gLY(n)} stroke={c} strokeWidth={1} />)}
      <line x1={18} y1={gLY(5)} x2={18} y2={gLY(1)} stroke={c} strokeWidth={1.2} />
      <line x1={24} y1={gLY(5)} x2={24} y2={gLY(1)} stroke={c} strokeWidth={4} />
    </svg>
  )
  // grand-staff — matches Ex7 proportions: ggs=6, equal clef sizes, proper brace gap, double bar full-height
  const gg = 6, gGL = 12, gGR = 78, gGTT = 20
  const gGLY = (n: number) => gGTT + (5 - n) * 2 * gg   // gGLY(5)=20, gGLY(1)=68
  const gGBT = gGLY(1) + 30                               // gap=30 → gGBT=98
  const gGBLY = (n: number) => gGBT + (5 - n) * 2 * gg
  const gGBB = gGBLY(1)                                   // 146
  const gGH = gGBB + 12                                   // 158
  return (
    <svg viewBox={`0 0 90 ${gGH}`} width={90} height={gGH} style={{ display: 'block' }}>
      {[1,2,3,4,5].map(n => <line key={'t'+n} x1={gGL} y1={gGLY(n)} x2={gGR} y2={gGLY(n)} stroke={c} strokeWidth={0.9} />)}
      {[1,2,3,4,5].map(n => <line key={'b'+n} x1={gGL} y1={gGBLY(n)} x2={gGR} y2={gGBLY(n)} stroke={c} strokeWidth={0.9} />)}
      <line x1={gGL} y1={gGTT} x2={gGL} y2={gGBB} stroke={c} strokeWidth={1.5} />
      {/* Brace: 8px left of left barline */}
      <text x={gGL - 8} y={gGBB} fontSize={gGBB - gGTT} fontFamily="Bravura, serif" fill={c} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
      {/* Treble: G line = gGTT + 6*gg = 20+36 = 56 */}
      <text x={gGL + 4} y={gGTT + 6 * gg} fontFamily="Bravura, serif" fontSize={42} fill={c} dominantBaseline="auto">𝄞</text>
      {/* Bass: F line = gGBT + 2*gg + 1 = 88+12+1 = 101 */}
      <text x={gGL + 4} y={gGBT + 2 * gg + 1} fontFamily="Bravura, serif" fontSize={42} fill={c} dominantBaseline="auto">𝄢</text>
      {/* Double bar: thin + thick spanning full height */}
      <line x1={gGR - 6} y1={gGTT} x2={gGR - 6} y2={gGBB} stroke={c} strokeWidth={0.9} />
      <line x1={gGR} y1={gGTT} x2={gGR} y2={gGBB} stroke={c} strokeWidth={4} />
    </svg>
  )
}

const MATCH_ITEMS: { key: MatchKey; label: string }[] = [
  { key: 'treble-clef',  label: 'Treble Clef' },
  { key: 'bass-clef',    label: 'Bass Clef' },
  { key: 'brace',        label: 'Brace' },
  { key: 'double-bar',   label: 'Double Bar' },
  { key: 'grand-staff',  label: 'Grand Staff' },
]

function GrandEx3({ onDone }: { onDone: (s: number, t: number) => void }) {
  const symbolOrder = useMemo<MatchKey[]>(() => shuffled(MATCH_ITEMS.map(m => m.key)), [])
  const [selectedName, setSelectedName] = useState<MatchKey | null>(null)
  const [matched, setMatched] = useState<Map<MatchKey, boolean>>(new Map())
  const [done, setDone] = useState(false)

  function handleName(k: MatchKey) {
    if (matched.has(k)) return
    setSelectedName(p => p === k ? null : k)
  }
  function handleSymbol(k: MatchKey) {
    if (!selectedName || matched.has(selectedName)) return
    const correct = selectedName === k
    const next = new Map(matched)
    next.set(selectedName, correct)
    setMatched(next)
    setSelectedName(null)
    const allDone = MATCH_ITEMS.every(m => next.has(m.key))
    if (allDone) {
      setTimeout(() => {
        const c = [...next.values()].filter(Boolean).length
        onDone(c / MATCH_ITEMS.length, MATCH_ITEMS.length)
        setDone(true)
      }, 500)
    }
  }

  if (done) return null

  return (
    <div>
      <ExLabel>Exercise 8 · Match symbols to names</ExLabel>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 20, lineHeight: 1.6 }}>
        Tap a name, then tap its matching symbol.
        {selectedName && <strong style={{ color: ACCENT }}> Now find: {MATCH_ITEMS.find(m => m.key === selectedName)?.label}</strong>}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', alignItems: 'start' }}>
        {/* Names */}
        <div>
          <p style={{ fontFamily: F, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', margin: '0 0 8px' }}>Names</p>
          {MATCH_ITEMS.map(item => {
            const isMatched = matched.has(item.key)
            const isCorrect = matched.get(item.key) === true
            const isSelected = selectedName === item.key
            let bg = '#f3eee3', border = '1px solid #E0DBCF', color = '#4a4540'
            if (isSelected) { bg = 'rgba(186,117,23,0.10)'; border = `1px solid ${ACCENT}`; color = ACCENT }
            else if (isMatched && isCorrect) { bg = 'rgba(42,107,30,0.08)'; border = `1px solid ${CORRECT}`; color = CORRECT }
            else if (isMatched && !isCorrect) { bg = 'rgba(181,64,42,0.08)'; border = `1px solid ${WRONG}`; color = WRONG }
            return (
              <button key={item.key} onClick={() => handleName(item.key)} style={{
                width: '100%', background: bg, border, borderRadius: 10, padding: '12px 14px',
                fontFamily: F, fontSize: 14, color, cursor: isMatched ? 'default' : 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 8, transition: 'border 0.15s',
              }}>
                {isMatched && <span>{isCorrect ? '✓' : '✗'}</span>}
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Symbols */}
        <div>
          <p style={{ fontFamily: F, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B0ACA4', margin: '0 0 8px' }}>Symbols</p>
          {symbolOrder.map(k => {
            const isCorrectlyMatched = matched.get(k) === true
            let border = '1px solid #E0DBCF', bg = 'white'
            if (isCorrectlyMatched) { border = `1px solid ${CORRECT}`; bg = 'rgba(42,107,30,0.06)' }
            else if (selectedName) { border = `1px solid rgba(186,117,23,0.35)`; bg = 'rgba(186,117,23,0.03)' }
            return (
              <button key={k} onClick={() => !isCorrectlyMatched && handleSymbol(k)} style={{
                width: '100%', background: bg, border, borderRadius: 10, padding: '8px',
                cursor: isCorrectlyMatched ? 'default' : (selectedName ? 'pointer' : 'default'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8, transition: 'border 0.15s',
              }}>
                <MatchSymbol k={k} dim={!isCorrectlyMatched && !selectedName} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── MAIN LESSON ──────────────────────────────────────────────────────────────

type Phase =
  | 'staff-intro' | 'staff-ex'
  | 'treble-intro' | 'treble-ex1' | 'treble-ex2'
  | 'bass-intro' | 'bass-ex1' | 'bass-ex2'
  | 'grand-ex1' | 'grand-ex2' | 'grand-ex3'
  | 'done'

const PHASE_ORDER: Phase[] = [
  'staff-intro', 'staff-ex',
  'treble-intro', 'treble-ex1', 'treble-ex2',
  'bass-intro', 'bass-ex1', 'bass-ex2',
  'grand-ex1', 'grand-ex2', 'grand-ex3',
]

interface Props {
  passingScore: number
  previouslyCompleted?: boolean
  onComplete: (score: number, total: number) => void
}

export default function GrandStaffLesson({ passingScore, previouslyCompleted = false, onComplete }: Props) {
  const [phase,       setPhase]       = useState<Phase>('staff-intro')
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
      setPhase('done')
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

  function scored(s: number, t: number) {
    phaseScoresRef.current.set(phase, { correct: Math.round(s * t), total: t })
    next()
  }

  if (phase === 'done') return null

  const currentIdx   = PHASE_ORDER.indexOf(phase)
  const canGoBack    = currentIdx > 0
  const canGoForward = currentIdx >= 0 && currentIdx < furthestIdx

  return (
    <div>
      <ExerciseNavBar canBack={canGoBack} canForward={canGoForward}
        onBack={back} onForward={forward} />
      {phase === 'staff-intro'  && <StaffIntro   key={key} onNext={next} />}
      {phase === 'staff-ex'     && <StaffEx      key={key} onDone={scored} />}
      {phase === 'treble-intro' && <TrebleIntro  key={key} onNext={next} />}
      {phase === 'treble-ex1'   && <TrebleEx1    key={key} onDone={scored} />}
      {phase === 'treble-ex2'   && <TrebleEx2    key={key} onDone={next} />}
      {phase === 'bass-intro'   && <BassIntro    key={key} onNext={next} />}
      {phase === 'bass-ex1'     && <BassEx1      key={key} onDone={scored} />}
      {phase === 'bass-ex2'     && <BassEx2      key={key} onDone={next} />}
      {phase === 'grand-ex1'    && <GrandEx1     key={key} onDone={scored} />}
      {phase === 'grand-ex2'    && <GrandEx2     key={key} onDone={next} />}
      {phase === 'grand-ex3'    && <GrandEx3     key={key} onDone={scored} />}
    </div>
  )
}

