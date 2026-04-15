'use client'

import { useState, useMemo } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#7A7060'
const ACCENT = '#BA7517'
const CORRECT = '#2A6B1E'
const WRONG = '#B5402A'
const LINE_C = '#2A5C9A'
const SPACE_C = '#2A6B1E'
const STROKE = 1.3

// Staff layout — step=10 matches LabeledTrebleStaff/LabeledBassStaff reference
const step = 10
const sL = 32
const sR = 360
const tTop = 32   // y of line 5 (top)

// Line n (1=bottom, 5=top)
function lineY(n: number) { return tTop + (5 - n) * 2 * step }
// Space n (1=bottom, 4=top)
function spaceY(n: number) { return tTop + (4 - n) * 2 * step + step }

const svgW = sR + 16
const svgH = tTop + 8 * step + 28  // 140

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

// Clef glyphs — sizing from StaffDiagrams.tsx (established at step=10)
function TrebleClef({ x = sL + 2, color = DARK }: { x?: number; color?: string }) {
  return (
    <text x={x} y={tTop + 46} fontFamily="Bravura, serif" fontSize={62} fill={color} dominantBaseline="auto">𝄞</text>
  )
}
function BassClef({ x = sL + 4, color = DARK }: { x?: number; color?: string }) {
  return (
    <text x={x} y={tTop + 24} fontFamily="Bravura, serif" fontSize={34} fill={color} dominantBaseline="auto">𝄢</text>
  )
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
    <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '16px 20px', marginBottom: 20, fontFamily: F, fontSize: 13, color: '#4A4540', lineHeight: 1.8 }}>
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
      background: DARK, color: 'white', border: 'none', borderRadius: 10,
      padding: '11px 26px', fontFamily: F, fontSize: 13, cursor: 'pointer',
    }}>{label}</button>
  )
}
function ProgressDots({ total, idx, results }: { total: number; idx: number; results: boolean[] }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
          background: i < results.length ? (results[i] ? CORRECT : WRONG)
            : i === idx ? ACCENT : '#DDD8CA'
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
      <p style={{ fontFamily: F, fontSize: 13, color: result ? CORRECT : WRONG, fontWeight: 600, margin: 0 }}>
        {result ? '✓ Correct!' : `✗ ${correctLabel}`}
      </p>
      <PrimaryBtn label={nextLabel} onClick={onNext} />
    </div>
  )
}

// ── STAFF INTRO ─────────────────────────────────────────────────────────────

function StaffIntro({ onNext }: { onNext: () => void }) {
  const barX = 226
  const wideR = 430
  // Line notes x positions in measure 1
  const lineXs = [108, 133, 158, 183, 208]
  // Space notes x positions in measure 2
  const spaceXs = [256, 294, 332, 370]

  function lineLabelY(n: number) { return n <= 3 ? lineY(n) - 16 : lineY(n) + 22 }
  function spaceLabelY(n: number) { return n % 2 === 1 ? spaceY(n) - 15 : spaceY(n) + 21 }

  return (
    <div>
      <SectionTag>The Staff</SectionTag>
      <SectionTitle>Five lines and four spaces</SectionTitle>
      <ConceptBox>
        Music is written on a <strong>staff</strong> — five horizontal lines with four spaces between them.<br />
        Lines are numbered <strong>1 to 5</strong> from the bottom up. Spaces are numbered <strong>1 to 4</strong> from the bottom up.
      </ConceptBox>

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <svg viewBox={`0 0 ${wideR + 16} ${svgH}`} width="100%"
          style={{ maxWidth: wideR + 16, display: 'block', margin: '0 auto' }}>
          <StaffBase x1={sL} x2={wideR} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <TrebleClef />
          <line x1={barX} y1={tTop} x2={barX} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <line x1={wideR - 2} y1={tTop} x2={wideR - 2} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <line x1={wideR} y1={tTop} x2={wideR} y2={lineY(1)} stroke={DARK} strokeWidth={3.5} />

          {/* Measure labels */}
          <text x={(sL + barX) / 2} y={svgH - 2} fontFamily={F} fontSize={10} fill={LINE_C} textAnchor="middle" letterSpacing="0.08em">LINES</text>
          <text x={(barX + wideR) / 2} y={svgH - 2} fontFamily={F} fontSize={10} fill={SPACE_C} textAnchor="middle" letterSpacing="0.08em">SPACES</text>

          {[1, 2, 3, 4, 5].map((n, i) => (
            <g key={n}>
              <NoteOval cx={lineXs[i]} cy={lineY(n)} color={LINE_C} />
              <text x={lineXs[i]} y={lineLabelY(n)} fontFamily={F} fontSize={11} fill={LINE_C}
                textAnchor="middle" fontWeight="700">Line {n}</text>
            </g>
          ))}
          {[1, 2, 3, 4].map((n, i) => (
            <g key={n}>
              <NoteOval cx={spaceXs[i]} cy={spaceY(n)} color={SPACE_C} />
              <text x={spaceXs[i]} y={spaceLabelY(n)} fontFamily={F} fontSize={11} fill={SPACE_C}
                textAnchor="middle" fontWeight="700">Space {n}</text>
            </g>
          ))}
        </svg>
      </div>

      <PrimaryBtn label="Exercise 1 — Number the lines →" onClick={onNext} />
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
  const [score, setScore] = useState(0)
  const [results, setResults] = useState<boolean[]>([])

  const q = questions[idx]
  const total = questions.length

  function pick(opt: number) {
    if (chosen !== null) return
    const ok = opt === q.n
    setChosen(opt)
    if (ok) setScore(s => s + 1)
    setResults(r => [...r, ok])
  }

  function next() {
    if (idx + 1 >= total) { onDone(score / total, total); return }
    setIdx(i => i + 1)
    setChosen(null)
  }

  // Highlight the target line/space
  const lineColors: Record<number, string> = {}
  const lineWidths: Record<number, number> = {}
  if (q.type === 'line') { lineColors[q.n] = ACCENT; lineWidths[q.n] = 2.5 }

  return (
    <div>
      <ExLabel>Exercise 1 — Number the lines and spaces</ExLabel>
      <ProgressDots total={total} idx={idx} results={results} />

      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 16 }}>
        What number is the highlighted {q.type}?
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase lineColors={lineColors} lineWidths={lineWidths} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />
          <TrebleClef />

          {/* Highlight the target space */}
          {q.type === 'space' && (
            <rect x={sL + 66} y={spaceY(q.n) - 9} width={sR - sL - 70} height={18}
              rx={4} fill={`rgba(186,117,23,0.18)`} />
          )}

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
        {q.opts.map(opt => {
          const isCorrect = opt === q.n
          let bg = 'white', border = '1px solid #E0DBCF', color = DARK
          if (chosen !== null) {
            if (isCorrect) { bg = 'rgba(42,107,30,0.08)'; border = `1px solid ${CORRECT}`; color = CORRECT }
            else if (opt === chosen) { bg = 'rgba(181,64,42,0.08)'; border = `1px solid ${WRONG}`; color = WRONG }
          }
          return (
            <button key={opt} onClick={() => pick(opt)} style={{
              background: bg, border, borderRadius: 10, padding: '14px 0',
              fontFamily: SERIF, fontSize: 22, fontWeight: 300, color,
              cursor: chosen !== null ? 'default' : 'pointer', textAlign: 'center',
            }}>{opt}</button>
          )
        })}
      </div>

      {chosen !== null && (
        <FeedbackRow
          result={chosen === q.n}
          correctLabel={`This is ${q.type} ${q.n}`}
          onNext={next}
          nextLabel={idx + 1 >= total ? 'Finish →' : 'Next →'}
        />
      )}
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
        The <strong>treble clef</strong> (𝄞) is also called the <strong>G clef</strong>. Its spiral wraps around the second line of the staff — permanently naming that line <strong>G</strong>. Every other note on the staff is counted from that anchor.
        <br /><br />
        <span style={{ color: GREY }}>
          Historically, this symbol evolved from the letter <em>G</em>. Early musicians wrote the letter G directly on whichever line they wished to call G — over centuries it became the ornate clef sign we use today.
        </span>
      </ConceptBox>

      {/* Annotated treble clef diagram */}
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH + 10}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase lineColors={{ 2: ACCENT }} lineWidths={{ 2: 2.5 }} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />
          <TrebleClef color={DARK} />

          {/* Circle highlighting line 2 */}
          <ellipse cx={sL + 22} cy={lineY(2)} rx={18} ry={14}
            fill="none" stroke={ACCENT} strokeWidth={2} strokeDasharray="4 2" />

          {/* Arrow + label */}
          <line x1={sL + 90} y1={lineY(2)} x2={sL + 45} y2={lineY(2)}
            stroke={ACCENT} strokeWidth={1.5} markerEnd="url(#arrow)" />
          <text x={sL + 95} y={lineY(2) + 5} fontFamily={F} fontSize={13} fill={ACCENT} fontWeight="700">
            Line 2 = G
          </text>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={ACCENT} />
            </marker>
          </defs>
        </svg>
      </div>

      <PrimaryBtn label="Exercise 2 — Circle line 2 →" onClick={onNext} />
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
      <ExLabel>Exercise 2 — Circle the G line</ExLabel>
      <ProgressDots total={ROUNDS} idx={round} results={results} />

      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 6 }}>
        The treble clef's circle surrounds the second line.
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20 }}>
        Tap <strong>line 2</strong> (the G line) on this staff.
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          {/* Staff with line 2 colored after correct tap */}
          <StaffBase
            lineColors={chosen !== null ? { 2: correct ? CORRECT : WRONG } : hovered === 2 ? { 2: ACCENT } : {}}
            lineWidths={chosen !== null ? { 2: 2.5 } : hovered === 2 ? { 2: 2.5 } : {}}
          />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />
          <TrebleClef color={DARK} />

          {/* Circle drawn on line 2 when correct */}
          {correct && (
            <ellipse cx={sL + 22} cy={lineY(2)} rx={18} ry={14}
              fill="rgba(42,107,30,0.12)" stroke={CORRECT} strokeWidth={2} />
          )}

          {/* Wrong indicator */}
          {chosen !== null && !correct && (
            <>
              <ellipse cx={sL + 22} cy={lineY(chosen)} rx={18} ry={14}
                fill="rgba(181,64,42,0.10)" stroke={WRONG} strokeWidth={1.5} strokeDasharray="4 2" />
              {/* Show correct position */}
              <ellipse cx={sL + 22} cy={lineY(2)} rx={18} ry={14}
                fill="rgba(42,107,30,0.10)" stroke={CORRECT} strokeWidth={1.5} />
            </>
          )}

          {/* Line number labels (visible so they can count) */}
          {[1, 2, 3, 4, 5].map(n => (
            <text key={n} x={sL - 14} y={lineY(n) + 4} fontFamily={F} fontSize={11}
              fill={chosen !== null && n === 2 ? (correct ? CORRECT : CORRECT) : GREY}
              textAnchor="middle">{n}</text>
          ))}

          {/* Hit zones */}
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
          correctLabel="The circle goes on line 2 — the G line"
          onNext={next}
          nextLabel={round + 1 >= ROUNDS ? 'Finish →' : `Next (${round + 1}/${ROUNDS}) →`}
        />
      )}
      {chosen === null && (
        <p style={{ fontFamily: F, fontSize: 12, color: '#B0ACA4', textAlign: 'center' }}>Tap a line</p>
      )}
    </div>
  )
}

// ── TREBLE EX 2: Place treble clef (draw 5 clefs exercise) ──────────────────

function TrebleEx2({ onDone }: { onDone: () => void }) {
  const ROUNDS = 5
  const [round, setRound] = useState(0)
  const [placed, setPlaced] = useState(false)

  function place() { setPlaced(true) }
  function next() {
    if (round + 1 >= ROUNDS) { onDone(); return }
    setRound(r => r + 1)
    setPlaced(false)
  }

  return (
    <div>
      <ExLabel>Exercise 3 — Place the treble clef</ExLabel>
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            background: i < round ? CORRECT : i === round ? ACCENT : '#DDD8CA'
          }} />
        ))}
      </div>

      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 6 }}>
        Staff {round + 1} of {ROUNDS}
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20 }}>
        {placed
          ? 'The circle of the treble clef surrounds line 2 — the G line.'
          : 'Tap the button to place the treble clef on this staff.'}
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase lineColors={placed ? { 2: ACCENT } : {}} lineWidths={placed ? { 2: 2.5 } : {}} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />

          {placed ? (
            <>
              <TrebleClef color={ACCENT} />
              <ellipse cx={sL + 22} cy={lineY(2)} rx={18} ry={14}
                fill="rgba(186,117,23,0.12)" stroke={ACCENT} strokeWidth={2} />
              <text x={sL + 90} y={lineY(2) + 5} fontFamily={F} fontSize={12} fill={ACCENT} fontWeight="700">Line 2 = G</text>
            </>
          ) : (
            /* Ghost clef */
            <text x={sL + 2} y={tTop + 46} fontFamily="Bravura, serif" fontSize={62}
              fill="rgba(26,26,24,0.15)" dominantBaseline="auto">𝄞</text>
          )}
        </svg>
      </div>

      {!placed ? (
        <button onClick={place} style={{
          background: ACCENT, color: 'white', border: 'none', borderRadius: 10,
          padding: '12px 28px', fontFamily: F, fontSize: 14, cursor: 'pointer', fontWeight: 600,
        }}>
          + Place Treble Clef
        </button>
      ) : (
        <PrimaryBtn
          label={round + 1 >= ROUNDS ? 'Finish →' : `Next staff (${round + 1}/${ROUNDS}) →`}
          onClick={next}
        />
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
        The <strong>bass clef</strong> (𝄢) is also called the <strong>F clef</strong>. Its two dots sit above and below the <strong>fourth line</strong> of the staff — permanently naming that line <strong>F</strong>. All other bass staff notes are counted from this anchor.
      </ConceptBox>

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH + 10}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase lineColors={{ 4: ACCENT }} lineWidths={{ 4: 2.5 }} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />
          <BassClef color={DARK} />

          {/* Dots annotation */}
          <circle cx={sL + 42} cy={lineY(4) - 9} r={4} fill={ACCENT} />
          <circle cx={sL + 42} cy={lineY(4) + 9} r={4} fill={ACCENT} />

          {/* Arrow + label */}
          <line x1={sL + 110} y1={lineY(4)} x2={sL + 52} y2={lineY(4)}
            stroke={ACCENT} strokeWidth={1.5} markerEnd="url(#arrow2)" />
          <text x={sL + 115} y={lineY(4) + 5} fontFamily={F} fontSize={13} fill={ACCENT} fontWeight="700">
            Line 4 = F
          </text>
          <defs>
            <marker id="arrow2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={ACCENT} />
            </marker>
          </defs>
        </svg>
      </div>

      <PrimaryBtn label="Exercise 4 — Place the dots →" onClick={onNext} />
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
      <ExLabel>Exercise 4 — Dot the F line</ExLabel>
      <ProgressDots total={ROUNDS} idx={round} results={results} />

      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 6 }}>
        The bass clef's dots bracket the fourth line.
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20 }}>
        Tap <strong>line 4</strong> (the F line) on this staff.
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase
            lineColors={chosen !== null ? { 4: correct ? CORRECT : WRONG } : hovered === 4 ? { 4: ACCENT } : {}}
            lineWidths={chosen !== null ? { 4: 2.5 } : hovered === 4 ? { 4: 2.5 } : {}}
          />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />
          <BassClef color={DARK} />

          {/* Dots on line 4 when correct */}
          {correct && (
            <>
              <circle cx={sL + 42} cy={lineY(4) - 9} r={5} fill={CORRECT} />
              <circle cx={sL + 42} cy={lineY(4) + 9} r={5} fill={CORRECT} />
            </>
          )}
          {/* Wrong tap + correct shown */}
          {chosen !== null && !correct && (
            <>
              <circle cx={sL + 42} cy={lineY(chosen) - 9} r={4} fill={WRONG} />
              <circle cx={sL + 42} cy={lineY(chosen) + 9} r={4} fill={WRONG} />
              <circle cx={sL + 42} cy={lineY(4) - 9} r={4} fill={CORRECT} />
              <circle cx={sL + 42} cy={lineY(4) + 9} r={4} fill={CORRECT} />
            </>
          )}

          {[1, 2, 3, 4, 5].map(n => (
            <text key={n} x={sL - 14} y={lineY(n) + 4} fontFamily={F} fontSize={11}
              fill={chosen !== null && n === 4 ? CORRECT : GREY} textAnchor="middle">{n}</text>
          ))}
          {chosen === null && [1, 2, 3, 4, 5].map(n => (
            <LineHitZone key={n} n={n} x1={sL + 50} x2={sR}
              onClick={() => tap(n)}
              onEnter={() => setHovered(n)}
              onLeave={() => setHovered(null)} />
          ))}
        </svg>
      </div>

      {chosen !== null && (
        <FeedbackRow
          result={correct}
          correctLabel="The dots go on line 4 — the F line"
          onNext={next}
          nextLabel={round + 1 >= ROUNDS ? 'Finish →' : `Next (${round + 1}/${ROUNDS}) →`}
        />
      )}
      {chosen === null && (
        <p style={{ fontFamily: F, fontSize: 12, color: '#B0ACA4', textAlign: 'center' }}>Tap a line</p>
      )}
    </div>
  )
}

// ── BASS EX 2: Place bass clef (draw 5 clefs exercise) ──────────────────────

function BassEx2({ onDone }: { onDone: () => void }) {
  const ROUNDS = 5
  const [round, setRound] = useState(0)
  const [placed, setPlaced] = useState(false)

  function next() {
    if (round + 1 >= ROUNDS) { onDone(); return }
    setRound(r => r + 1)
    setPlaced(false)
  }

  return (
    <div>
      <ExLabel>Exercise 5 — Place the bass clef</ExLabel>
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            background: i < round ? CORRECT : i === round ? ACCENT : '#DDD8CA'
          }} />
        ))}
      </div>

      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 6 }}>
        Staff {round + 1} of {ROUNDS}
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20 }}>
        {placed
          ? 'The dots of the bass clef bracket line 4 — the F line.'
          : 'Tap the button to place the bass clef on this staff.'}
      </p>

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          <StaffBase lineColors={placed ? { 4: ACCENT } : {}} lineWidths={placed ? { 4: 2.5 } : {}} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={3} />

          {placed ? (
            <>
              <BassClef color={ACCENT} />
              <circle cx={sL + 42} cy={lineY(4) - 9} r={5} fill={ACCENT} />
              <circle cx={sL + 42} cy={lineY(4) + 9} r={5} fill={ACCENT} />
              <text x={sL + 90} y={lineY(4) + 5} fontFamily={F} fontSize={12} fill={ACCENT} fontWeight="700">Line 4 = F</text>
            </>
          ) : (
            <text x={sL + 4} y={tTop + 24} fontFamily="Bravura, serif" fontSize={34}
              fill="rgba(26,26,24,0.15)" dominantBaseline="auto">𝄢</text>
          )}
        </svg>
      </div>

      {!placed ? (
        <button onClick={() => setPlaced(true)} style={{
          background: ACCENT, color: 'white', border: 'none', borderRadius: 10,
          padding: '12px 28px', fontFamily: F, fontSize: 14, cursor: 'pointer', fontWeight: 600,
        }}>
          + Place Bass Clef
        </button>
      ) : (
        <PrimaryBtn
          label={round + 1 >= ROUNDS ? 'Finish →' : `Next staff (${round + 1}/${ROUNDS}) →`}
          onClick={next}
        />
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

function MissingStaff({ missing }: { missing: MissingId }) {
  const gStep = 8, gSL = 28, gSR = 170, gTT = 16, gBT = gTT + 8 * gStep + 20, gBB = gBT + 8 * gStep
  const H = gBB + 14

  function gLineY(n: number) { return gTT + (5 - n) * 2 * gStep }
  function gBLineY(n: number) { return gBT + (5 - n) * 2 * gStep }

  return (
    <svg viewBox={`0 0 ${gSR + 12} ${H}`} width={gSR + 12} height={H} style={{ display: 'block', margin: '0 auto' }}>
      {[1,2,3,4,5].map(n => <line key={'t'+n} x1={gSL} y1={gLineY(n)} x2={gSR} y2={gLineY(n)} stroke={DARK} strokeWidth={1.1} />)}
      {[1,2,3,4,5].map(n => <line key={'b'+n} x1={gSL} y1={gBLineY(n)} x2={gSR} y2={gBLineY(n)} stroke={DARK} strokeWidth={1.1} />)}
      {missing !== 'connector' && <line x1={gSL} y1={gTT} x2={gSL} y2={gBB} stroke={DARK} strokeWidth={1.8} />}
      {missing !== 'brace' && (
        <text x={gSL - 6} y={gTT + (gBB - gTT)} fontSize={gBB - gTT}
          fontFamily="Bravura, serif" fill={DARK} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
      )}
      {missing !== 'treble' && (
        <text x={gSL + 2} y={gTT + 8 * gStep * 0.68} fontFamily="Bravura, serif" fontSize={50} fill={DARK} dominantBaseline="auto">𝄞</text>
      )}
      {missing !== 'bass' && (
        <text x={gSL + 2} y={gBT + 8 * gStep * 0.32} fontFamily="Bravura, serif" fontSize={50} fill={DARK} dominantBaseline="auto">𝄢</text>
      )}
      {missing !== 'double-bar' && (
        <>
          <line x1={gSR - 2} y1={gTT} x2={gSR - 2} y2={gLineY(1)} stroke={DARK} strokeWidth={1.1} />
          <line x1={gSR - 2} y1={gBT} x2={gSR - 2} y2={gBLineY(1)} stroke={DARK} strokeWidth={1.1} />
          <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={DARK} strokeWidth={3.5} />
        </>
      )}
      {/* Missing part placeholder */}
      <rect x={missing === 'brace' ? 2 : missing === 'connector' ? gSL - 2 : gSL}
            y={gTT - 4}
            width={missing === 'brace' || missing === 'connector' ? 22 : missing === 'double-bar' ? 14 : 50}
            height={gBB - gTT + 8}
            rx={4}
            fill="rgba(186,117,23,0.08)" stroke="rgba(186,117,23,0.35)" strokeWidth={1} strokeDasharray="4 2" />
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

  return (
    <div>
      <ExLabel>Exercise 6 — Complete the grand staff</ExLabel>
      <ProgressDots total={total} idx={idx} results={results} />
      <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 300, color: DARK, marginBottom: 16 }}>
        What is missing from this grand staff?
      </p>

      <div style={{ background: '#FDFAF3', borderRadius: 12, padding: '20px 0', marginBottom: 20 }}>
        <MissingStaff missing={q.id} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {q.opts.map(opt => {
          let bg = 'white', border = '1px solid #E0DBCF', color = DARK
          if (chosen !== null) {
            if (opt === q.answer) { bg = 'rgba(42,107,30,0.08)'; border = `1px solid ${CORRECT}`; color = CORRECT }
            else if (opt === chosen) { bg = 'rgba(181,64,42,0.08)'; border = `1px solid ${WRONG}`; color = WRONG }
          }
          return (
            <button key={opt} onClick={() => pick(opt)} style={{
              background: bg, border, borderRadius: 10, padding: '12px 16px',
              fontFamily: F, fontSize: 13, color, cursor: chosen ? 'default' : 'pointer', textAlign: 'left',
            }}>{opt}</button>
          )
        })}
      </div>

      {chosen !== null && (
        <FeedbackRow
          result={chosen === q.answer}
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
  { key: 'treble', label: 'Treble Clef', desc: 'G clef — anchors G on line 2 of the upper staff' },
  { key: 'bass',   label: 'Bass Clef',   desc: 'F clef — anchors F on line 4 of the lower staff' },
  { key: 'brace',  label: 'Brace',       desc: 'Curved bracket joining both staves on the left' },
  { key: 'dbar',   label: 'Double Bar',  desc: 'Two bar lines on the right side to close the system' },
] as const
type BuildKey = typeof BUILD_PARTS[number]['key']

function BuildPreview({ placed }: { placed: Set<BuildKey> }) {
  const gStep = 8, gSL = 32, gSR = 200, gTT = 18, gBT = gTT + 8 * gStep + 22, gBB = gBT + 8 * gStep
  const H = gBB + 12

  function gLineY(n: number) { return gTT + (5 - n) * 2 * gStep }
  function gBLineY(n: number) { return gBT + (5 - n) * 2 * gStep }

  return (
    <svg viewBox={`0 0 ${gSR + 12} ${H}`} width="100%" style={{ maxWidth: gSR + 12, display: 'block', margin: '0 auto' }}>
      {[1,2,3,4,5].map(n => <line key={'t'+n} x1={gSL} y1={gLineY(n)} x2={gSR} y2={gLineY(n)} stroke={DARK} strokeWidth={1.2} />)}
      {[1,2,3,4,5].map(n => <line key={'b'+n} x1={gSL} y1={gBLineY(n)} x2={gSR} y2={gBLineY(n)} stroke={DARK} strokeWidth={1.2} />)}
      <line x1={gSL} y1={gTT} x2={gSL} y2={gBB} stroke={DARK} strokeWidth={1.8} />
      {placed.has('brace') && (
        <text x={gSL - 6} y={gTT + (gBB - gTT)} fontSize={gBB - gTT}
          fontFamily="Bravura, serif" fill={ACCENT} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
      )}
      {placed.has('treble') && (
        <text x={gSL + 2} y={gTT + 8 * gStep * 0.68} fontFamily="Bravura, serif" fontSize={50} fill={ACCENT} dominantBaseline="auto">𝄞</text>
      )}
      {placed.has('bass') && (
        <text x={gSL + 2} y={gBT + 8 * gStep * 0.32} fontFamily="Bravura, serif" fontSize={50} fill={ACCENT} dominantBaseline="auto">𝄢</text>
      )}
      {placed.has('dbar') && (
        <>
          <line x1={gSR - 2} y1={gTT} x2={gSR - 2} y2={gLineY(1)} stroke={ACCENT} strokeWidth={1.2} />
          <line x1={gSR - 2} y1={gBT} x2={gSR - 2} y2={gBLineY(1)} stroke={ACCENT} strokeWidth={1.2} />
          <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={ACCENT} strokeWidth={3.5} />
        </>
      )}
    </svg>
  )
}

function GrandEx2({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0)
  const [placed, setPlaced] = useState<Set<BuildKey>>(new Set())
  const [lastAdded, setLastAdded] = useState<BuildKey | null>(null)
  const complete = placed.size === BUILD_PARTS.length

  function add(key: BuildKey) {
    if (placed.has(key)) return
    setPlaced(p => new Set([...p, key]))
    setLastAdded(key)
  }
  function nextRound() {
    if (round + 1 >= 4) { onDone(); return }
    setRound(r => r + 1)
    setPlaced(new Set())
    setLastAdded(null)
  }

  return (
    <div>
      <ExLabel>Exercise 7 — Build the grand staff</ExLabel>
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {[0,1,2,3].map(i => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            background: i < round ? CORRECT : i === round ? ACCENT : '#DDD8CA'
          }} />
        ))}
      </div>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20 }}>
        Round {round + 1} of 4 — tap each part to add it. Add all four to complete the grand staff.
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <BuildPreview placed={placed} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {BUILD_PARTS.map(p => {
          const done = placed.has(p.key)
          return (
            <button key={p.key} onClick={() => add(p.key)} disabled={done} style={{
              background: done ? 'rgba(42,107,30,0.08)' : 'white',
              border: done ? `1px solid ${CORRECT}` : '1px solid #E0DBCF',
              borderRadius: 10, padding: '12px 14px',
              fontFamily: F, fontSize: 13, color: done ? CORRECT : DARK,
              cursor: done ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
            }}>
              <span style={{ fontSize: 14 }}>{done ? '✓' : '+'}</span>
              {p.label}
            </button>
          )
        })}
      </div>

      {lastAdded && !complete && (
        <p style={{ fontFamily: F, fontSize: 13, color: CORRECT, margin: '0 0 12px' }}>
          ✓ {BUILD_PARTS.find(p => p.key === lastAdded)?.desc}
        </p>
      )}
      {complete && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: SERIF, fontSize: 18, color: CORRECT, margin: 0 }}>Grand staff complete!</p>
          <PrimaryBtn label={round + 1 >= 4 ? 'Finish →' : 'Next round →'} onClick={nextRound} />
        </div>
      )}
    </div>
  )
}

// ── GRAND EX 3: Match symbols to names ───────────────────────────────────────

type MatchKey = 'treble-clef' | 'bass-clef' | 'brace' | 'double-bar' | 'grand-staff'

function MatchSymbol({ k, dim }: { k: MatchKey; dim?: boolean }) {
  const c = dim ? '#C8C4BA' : DARK
  const gStep = 7, gSL = 14, gSR = 76, gTT = 6
  function gLineY(n: number) { return gTT + (5-n)*2*gStep }

  if (k === 'treble-clef') return (
    <svg viewBox="0 0 90 62" width={90} height={62} style={{ display: 'block' }}>
      {[1,2,3,4,5].map(n => <line key={n} x1={gSL} y1={gLineY(n)} x2={gSR} y2={gLineY(n)} stroke={c} strokeWidth={1} />)}
      <text x={gSL+2} y={gTT+8*gStep*0.68} fontFamily="Bravura, serif" fontSize={44} fill={c} dominantBaseline="auto">𝄞</text>
    </svg>
  )
  if (k === 'bass-clef') return (
    <svg viewBox="0 0 90 62" width={90} height={62} style={{ display: 'block' }}>
      {[1,2,3,4,5].map(n => <line key={n} x1={gSL} y1={gLineY(n)} x2={gSR} y2={gLineY(n)} stroke={c} strokeWidth={1} />)}
      <text x={gSL+2} y={gTT+8*gStep*0.32} fontFamily="Bravura, serif" fontSize={44} fill={c} dominantBaseline="auto">𝄢</text>
    </svg>
  )
  if (k === 'brace') return (
    <svg viewBox="0 0 32 56" width={32} height={56} style={{ display: 'block' }}>
      <text x={16} y={56} fontSize={56} fontFamily="Bravura, serif" fill={c} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
    </svg>
  )
  if (k === 'double-bar') return (
    <svg viewBox="0 0 28 56" width={28} height={56} style={{ display: 'block' }}>
      {[1,2,3,4,5].map(n => <line key={n} x1={2} y1={gLineY(n)} x2={24} y2={gLineY(n)} stroke={c} strokeWidth={1} />)}
      <line x1={21} y1={gTT} x2={21} y2={gLineY(1)} stroke={c} strokeWidth={1} />
      <line x1={24} y1={gTT} x2={24} y2={gLineY(1)} stroke={c} strokeWidth={3.5} />
    </svg>
  )
  // grand-staff
  const gBT = gTT + 8*gStep + 12, gBB = gBT + 8*gStep
  function gBLineY(n: number) { return gBT + (5-n)*2*gStep }
  return (
    <svg viewBox={`0 0 90 ${gBB+8}`} width={90} height={gBB + 8} style={{ display: 'block' }}>
      {[1,2,3,4,5].map(n => <line key={'t'+n} x1={gSL} y1={gLineY(n)} x2={gSR} y2={gLineY(n)} stroke={c} strokeWidth={0.9} />)}
      {[1,2,3,4,5].map(n => <line key={'b'+n} x1={gSL} y1={gBLineY(n)} x2={gSR} y2={gBLineY(n)} stroke={c} strokeWidth={0.9} />)}
      <line x1={gSL} y1={gTT} x2={gSL} y2={gBB} stroke={c} strokeWidth={1.5} />
      <text x={gSL-4} y={gTT+(gBB-gTT)} fontSize={gBB-gTT} fontFamily="Bravura, serif" fill={c} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
      <text x={gSL+2} y={gTT+8*gStep*0.68} fontFamily="Bravura, serif" fontSize={32} fill={c} dominantBaseline="auto">𝄞</text>
      <text x={gSL+2} y={gBT+8*gStep*0.32} fontFamily="Bravura, serif" fontSize={32} fill={c} dominantBaseline="auto">𝄢</text>
      <line x1={gSR-2} y1={gTT} x2={gSR-2} y2={gLineY(1)} stroke={c} strokeWidth={0.9} />
      <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={c} strokeWidth={2.5} />
      <line x1={gSR-2} y1={gBT} x2={gSR-2} y2={gBLineY(1)} stroke={c} strokeWidth={0.9} />
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
      <ExLabel>Exercise 8 — Match symbols to names</ExLabel>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20, lineHeight: 1.6 }}>
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
            let bg = 'white', border = '1px solid #E0DBCF', color = DARK
            if (isSelected) { bg = 'rgba(186,117,23,0.10)'; border = `1px solid ${ACCENT}`; color = ACCENT }
            else if (isMatched && isCorrect) { bg = 'rgba(42,107,30,0.08)'; border = `1px solid ${CORRECT}`; color = CORRECT }
            else if (isMatched && !isCorrect) { bg = 'rgba(181,64,42,0.08)'; border = `1px solid ${WRONG}`; color = WRONG }
            return (
              <button key={item.key} onClick={() => handleName(item.key)} style={{
                width: '100%', background: bg, border, borderRadius: 10, padding: '12px 14px',
                fontFamily: F, fontSize: 13, color, cursor: isMatched ? 'default' : 'pointer',
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
                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 68,
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

interface Props {
  passingScore: number
  onComplete: (score: number, total: number) => void
}

export default function GrandStaffLesson({ passingScore, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('staff-intro')
  // Accumulate scored results: [score_fraction, total_items]
  const [scored, setScored] = useState<Array<[number, number]>>([])

  function addScore(s: number, t: number) {
    setScored(prev => [...prev, [s, t]])
  }

  function finish(s: number, t: number) {
    const all = [...scored, [s, t]] as Array<[number, number]>
    const totalItems = all.reduce((a, [, t]) => a + t, 0)
    const totalCorrect = all.reduce((a, [s, t]) => a + s * t, 0)
    onComplete(totalCorrect / totalItems, totalItems)
    setPhase('done')
  }

  if (phase === 'done') return null

  return (
    <div>
      {phase === 'staff-intro'  && <StaffIntro   onNext={() => setPhase('staff-ex')} />}
      {phase === 'staff-ex'     && <StaffEx       onDone={(s, t) => { addScore(s, t); setPhase('treble-intro') }} />}
      {phase === 'treble-intro' && <TrebleIntro   onNext={() => setPhase('treble-ex1')} />}
      {phase === 'treble-ex1'   && <TrebleEx1     onDone={(s, t) => { addScore(s, t); setPhase('treble-ex2') }} />}
      {phase === 'treble-ex2'   && <TrebleEx2     onDone={() => setPhase('bass-intro')} />}
      {phase === 'bass-intro'   && <BassIntro     onNext={() => setPhase('bass-ex1')} />}
      {phase === 'bass-ex1'     && <BassEx1       onDone={(s, t) => { addScore(s, t); setPhase('bass-ex2') }} />}
      {phase === 'bass-ex2'     && <BassEx2       onDone={() => setPhase('grand-ex1')} />}
      {phase === 'grand-ex1'    && <GrandEx1      onDone={(s, t) => { addScore(s, t); setPhase('grand-ex2') }} />}
      {phase === 'grand-ex2'    && <GrandEx2      onDone={() => setPhase('grand-ex3')} />}
      {phase === 'grand-ex3'    && <GrandEx3      onDone={(s, t) => finish(s, t)} />}
    </div>
  )
}
