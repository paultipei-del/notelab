'use client'

import { useState, useRef, useMemo, useEffect } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#7A7060'
const ACCENT = '#BA7517'
const CORRECT = '#2A6B1E'
const WRONG = '#B5402A'
const SPACE_C = '#8B3A8B'
const LINE_C  = '#2A5C9A'
const STROKE  = 1.3

// ── Staff geometry — identical to LineSpaceLesson / TrebleClefLesson ──────────
const step  = 8
const sL    = 32
const sR    = 360
const tTop  = 54        // y of line 5 (top staff line)
const svgW  = sR + 16   // 376
const svgH  = tTop + 8 * step + 54  // 172

// pos system for bass clef (ascending = bottom to top):
//   pos=12 → C4  ledger above  (y = tTop - 2*step)
//   pos=11 → B3  space above   (y = tTop - step)
//   pos=10 → A3  line 5        (y = tTop)
//   pos=9  → G3  space 4       (y = tTop + step)
//   pos=8  → F3  line 4        (y = tTop + 2*step)
//   pos=7  → E3  space 3       (y = tTop + 3*step)
//   pos=6  → D3  line 3        (y = tTop + 4*step)
//   pos=5  → C3  space 2       (y = tTop + 5*step)
//   pos=4  → B2  line 2        (y = tTop + 6*step)
//   pos=3  → A2  space 1       (y = tTop + 7*step)
//   pos=2  → G2  line 1        (y = tTop + 8*step)
//   pos=1  → F2  space below   (y = tTop + 9*step)
//   pos=0  → E2  ledger below  (y = tTop + 10*step)  ← not used in exercises
function posToY(pos: number) { return tTop + (10 - pos) * step }
function lineY(n: number)    { return tTop + (5 - n) * 2 * step }

const NH_FS   = 60
const STEM_LEN = 47
const NH_OFF   = 8

// ── Bravura primitives ────────────────────────────────────────────────────────
type NoteVal = 'whole' | 'quarter'

function BravuraNote({ cx, cy, val = 'whole', color = DARK, stemUp = true }: {
  cx: number; cy: number; val?: NoteVal; color?: string; stemUp?: boolean
}) {
  const head   = val === 'whole' ? '\uE0A2' : '\uE0A4'
  const hasStem = val === 'quarter'
  const stemX  = stemUp ? cx + NH_OFF : cx - NH_OFF
  const stemY2 = stemUp ? cy - STEM_LEN : cy + STEM_LEN
  return (
    <g>
      <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={NH_FS}
        fill={color} textAnchor="middle" dominantBaseline="central">{head}</text>
      {hasStem && (
        <line x1={stemX} y1={cy} x2={stemX} y2={stemY2} stroke={color} strokeWidth={STROKE} />
      )}
    </g>
  )
}

function StaffBase({ x1 = sL, x2 = sR }: { x1?: number; x2?: number }) {
  return (
    <>
      {[1,2,3,4,5].map(n => (
        <line key={n} x1={x1} y1={lineY(n)} x2={x2} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
    </>
  )
}

// Bass clef: y = tTop + 2*step + 2 anchors the glyph on the F line (line 4)
function BassClef({ x = sL + 2 }: { x?: number }) {
  return (
    <text x={x} y={tTop + 2 * step + 2} fontFamily="Bravura, serif" fontSize={66}
      fill={DARK} dominantBaseline="auto">𝄢</text>
  )
}

function LedgerLine({ cx, cy, color = DARK, hw = 14, sw = STROKE }: {
  cx: number; cy: number; color?: string; hw?: number; sw?: number
}) {
  return <line x1={cx - hw} y1={cy} x2={cx + hw} y2={cy} stroke={color} strokeWidth={sw} />
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function PrimaryBtn({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#EDE8DF' : DARK,
      color: disabled ? '#B0ACA4' : 'white',
      border: 'none', borderRadius: 10,
      padding: '10px 24px', fontFamily: F, fontSize: 13,
      cursor: disabled ? 'default' : 'pointer',
    }}>{label}</button>
  )
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 4, background: '#EDE8DF', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: ACCENT, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: F, fontSize: 11, color: '#B0ACA4' }}>{done + 1} / {total}</span>
    </div>
  )
}

function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

// ── Note pool definitions ─────────────────────────────────────────────────────
interface NoteInfo { name: string; letter: string; pos: number }

const SPACE_NOTE_POOL: NoteInfo[] = [
  { name: 'F2', letter: 'F', pos: 1  },  // space below line 1
  { name: 'A2', letter: 'A', pos: 3  },  // space 1
  { name: 'C3', letter: 'C', pos: 5  },  // space 2
  { name: 'E3', letter: 'E', pos: 7  },  // space 3
  { name: 'G3', letter: 'G', pos: 9  },  // space 4
  { name: 'B3', letter: 'B', pos: 11 },  // space above line 5
]

const LINE_NOTE_POOL: NoteInfo[] = [
  { name: 'E2', letter: 'E', pos: 0  },  // ledger below
  { name: 'G2', letter: 'G', pos: 2  },  // line 1
  { name: 'B2', letter: 'B', pos: 4  },  // line 2
  { name: 'D3', letter: 'D', pos: 6  },  // line 3
  { name: 'F3', letter: 'F', pos: 8  },  // line 4
  { name: 'A3', letter: 'A', pos: 10 },  // line 5
  { name: 'C4', letter: 'C', pos: 12 },  // ledger above (Middle C)
]

// Bass-only octave labels: Low (pos 0–4), Bass (pos 5–11), Middle C (pos=12)
function octaveLabel(pos: number): string {
  if (pos === 12) return 'Middle C'
  if (pos <= 4)   return 'Low'
  return 'Bass'
}

// ── Single-note staff ─────────────────────────────────────────────────────────
function SingleNoteStaff({ pos, color = DARK }: { pos?: number; color?: string }) {
  const cx = svgW / 2

  const renderNote = (p: number, c: string) => {
    const cy = posToY(p)
    const up = p <= 6
    return (
      <g>
        {p === 12 && <LedgerLine cx={cx} cy={cy} color={c} sw={2.5} hw={16} />}
        {p === 0  && <LedgerLine cx={cx} cy={cy} color={c} sw={STROKE} hw={16} />}
        <BravuraNote cx={cx} cy={cy} val="whole" color={c} stemUp={up} />
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
      style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
      <StaffBase />
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      <BassClef />
      {pos !== undefined && renderNote(pos, color)}
    </svg>
  )
}

// ── Space Notes Intro ─────────────────────────────────────────────────────────
function SpaceNotesIntro({ onNext }: { onNext: () => void }) {
  const W = svgW, H = svgH + 30
  const noteXs = SPACE_NOTE_POOL.map((_, i) => {
    const start = sL + 74, end = sR - 16
    return start + i * (end - start) / 5
  })

  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        Space notes
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        The bass staff has <strong>six space notes</strong> — four inside the staff, plus one space
        just below line 1 and one space just above line 5.
        Every space note spells part of <strong style={{ color: SPACE_C }}>F A C E G B</strong>.
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%"
          style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <BassClef />

          {SPACE_NOTE_POOL.map((n, i) => {
            const x  = noteXs[i]
            const cy = posToY(n.pos)
            const isBoundary = n.pos === 1 || n.pos === 11
            const color = isBoundary ? ACCENT : SPACE_C
            const labelY = cy + 20

            return (
              <g key={n.pos}>
                <BravuraNote cx={x} cy={cy} val="whole" color={color} />
                <rect x={x - 8} y={labelY - 11} width={16} height={14} rx={2} fill="white" opacity={0.7} />
                <text x={x} y={labelY} fontFamily={F} fontSize={11} fontWeight="700"
                  fill={color} textAnchor="middle">{n.letter}</text>
              </g>
            )
          })}

          {/* Boundary annotations */}
          <text x={noteXs[0]} y={posToY(1) + 36} fontFamily={F} fontSize={9} fill={ACCENT}
            textAnchor="middle" fontStyle="italic">space below staff</text>
          <text x={noteXs[5] - 3} y={posToY(11) - 14} fontFamily={F} fontSize={9} fill={ACCENT}
            textAnchor="middle" fontStyle="italic">space above staff</text>
        </svg>
      </div>

      {/* Mnemonics */}
      <div style={{
        background: 'rgba(139,58,139,0.08)', border: '1px solid rgba(139,58,139,0.2)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
      }}>
        <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: SPACE_C, margin: '0 0 4px', letterSpacing: '0.06em' }}>
          F A C E G B
        </p>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: '0 0 8px' }}>
          "Fat Alligators Can Eat Giant Bugs" — all six space notes, bottom to top
        </p>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: 0 }}>
          The four inner spaces spell <strong style={{ color: SPACE_C }}>ACEG</strong> — "All Cows Eat Grass"
        </p>
      </div>

      <PrimaryBtn label="Next →" onClick={onNext} />
    </div>
  )
}

// ── Line Notes Intro ──────────────────────────────────────────────────────────
function LineNotesIntro({ onNext }: { onNext: () => void }) {
  const lSR  = 430
  const W    = lSR + 16
  const H    = svgH + 16
  const start = sL + 68, end = lSR - 16
  const gap   = (end - start) / (LINE_NOTE_POOL.length - 1)

  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        Line notes
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        Five lines, five line notes — <strong style={{ color: LINE_C }}>G B D F A</strong> from bottom to top.
        Add E2 below on a ledger line and Middle C above on another — seven line notes in all.
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '12px 0 16px', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%"
          style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
          <StaffBase x2={lSR} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={lSR} y1={tTop} x2={lSR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <BassClef />

          {LINE_NOTE_POOL.map((n, i) => {
            const x        = start + i * gap
            const cy       = posToY(n.pos)
            const isLedger = n.pos === 0 || n.pos === 12
            const color    = isLedger ? ACCENT : LINE_C
            const labelY   = cy + 20

            return (
              <g key={n.pos}>
                {n.pos === 0  && <LedgerLine cx={x} cy={cy} color={color} sw={2.5} hw={16} />}
                {n.pos === 12 && <LedgerLine cx={x} cy={cy} color={color} sw={2.5} hw={16} />}
                <BravuraNote cx={x} cy={cy} val="whole" color={color} />
                <rect x={x - 8} y={labelY - 11} width={16} height={14} rx={2} fill="white" opacity={0.7} />
                <text x={x} y={labelY} fontFamily={F} fontSize={11} fontWeight="700"
                  fill={color} textAnchor="middle">{n.letter}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Middle C callout */}
      <div style={{
        background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.25)',
        borderRadius: 10, padding: '14px 16px', marginBottom: 20,
      }}>
        <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: ACCENT, margin: '0 0 6px' }}>
          Watch out: E2 and Middle C
        </p>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: 0, lineHeight: 1.6 }}>
          Both sit on a ledger line — E2 below the staff, Middle C above. Middle C is the same pitch as the C on a ledger line below the treble staff.
        </p>
      </div>

      {/* Mnemonics */}
      <div style={{
        background: 'rgba(42,92,154,0.08)', border: '1px solid rgba(42,92,154,0.2)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
      }}>
        <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: LINE_C, margin: '0 0 4px', letterSpacing: '0.06em' }}>
          E G B D F A C
        </p>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: '0 0 8px' }}>
          "Every Good Boy Deserves Fudge And Candy" — all 7 line notes, bottom to top
        </p>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: 0 }}>
          The five staff lines spell <strong style={{ color: LINE_C }}>G B D F A</strong> — "Good Boys Do Fine Always"
        </p>
      </div>

      <PrimaryBtn label="Start exercises →" onClick={onNext} />
    </div>
  )
}

// ── Ex 1 & 3: Name the note ───────────────────────────────────────────────────
const NOTE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

function NameNoteEx({
  pool, total = 18, label, color, onDone,
}: {
  pool: NoteInfo[]; total?: number; label: string; color: string;
  onDone: (s: number, t: number) => void
}) {
  const items = useMemo(() => {
    const expanded: NoteInfo[] = []
    const reps = Math.ceil(total / pool.length) + 1
    for (let i = 0; i < reps; i++) expanded.push(...pool)
    return shuffled(expanded).slice(0, total)
  }, [pool, total])

  const [idx,       setIdx]       = useState(0)
  const [selected,  setSelected]  = useState<string | null>(null)
  const [feedback,  setFeedback]  = useState<{ correctLetter: string; ok: boolean } | null>(null)
  const [correct,   setCorrect]   = useState(0)
  const [done,      setDone]      = useState(false)
  const confirmed = feedback !== null

  const item = items[idx]

  function next(currentCorrect: number) {
    if (idx + 1 >= total) { setDone(true); onDone(currentCorrect / total, total); return }
    setIdx(i => i + 1)
    setSelected(null)
    setFeedback(null)
  }

  function pick(letter: string) {
    if (confirmed) return
    const ok = letter === item.letter
    const newCorrect = ok ? correct + 1 : correct
    if (ok) setCorrect(newCorrect)
    setSelected(letter)
    setFeedback({ correctLetter: item.letter, ok })
    setTimeout(() => next(newCorrect), ok ? 1200 : 2000)
  }

  // Keyboard shortcut — type A–G to answer
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (confirmed) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toUpperCase()
      if (k.length === 1 && k >= 'A' && k <= 'G') pick(k)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [idx, confirmed])

  if (done) return null

  return (
    <div>
      <ProgressBar done={idx} total={total} />
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const, color, marginBottom: 12 }}>{label}</p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 20 }}>
        <SingleNoteStaff pos={item.pos} color={DARK} />
      </div>

      <p style={{ fontFamily: F, fontSize: 12, color: GREY, marginBottom: 12 }}>
        Name this note
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 20 }}>
        {NOTE_LETTERS.map(letter => {
          const isSelected = selected === letter
          const isAnswer   = letter === item.letter
          let bg = 'white', border = '#DDD8CA', textColor = DARK
          if (confirmed) {
            if (isAnswer)                    { bg = '#EAF3DE'; border = '#C0DD97'; textColor = CORRECT }
            else if (isSelected && !isAnswer){ bg = '#FDF3ED'; border = '#F0C4A8'; textColor = WRONG }
          } else if (isSelected) { bg = '#F7F4ED'; border = DARK }

          return (
            <button key={letter} onClick={() => pick(letter)} style={{
              background: bg, border: `1.5px solid ${border}`, borderRadius: 10,
              padding: '14px 4px', fontFamily: SERIF, fontSize: 22, fontWeight: 400,
              color: textColor, cursor: confirmed ? 'default' : 'pointer',
            }}>{letter}</button>
          )
        })}
      </div>

      <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0, minHeight: '1.5em' }}>
        {feedback && !feedback.ok && (
          <>It's <strong style={{ color: CORRECT }}>{feedback.correctLetter}</strong></>
        )}
      </p>
    </div>
  )
}

// ── Ex 2 & 4: Place the note ──────────────────────────────────────────────────
function PlaceNoteEx({
  pool, total = 12, label, color, spaceOnly, onDone,
}: {
  pool: NoteInfo[]; total?: number; label: string; color: string;
  spaceOnly: boolean;
  onDone: (s: number, t: number) => void
}) {
  const items = useMemo(() => {
    const expanded: NoteInfo[] = []
    const reps = Math.ceil(total / pool.length) + 1
    for (let i = 0; i < reps; i++) expanded.push(...pool)
    return shuffled(expanded).slice(0, total)
  }, [pool, total])

  const [idx,       setIdx]       = useState(0)
  const [placedPos, setPlacedPos] = useState<number | null>(null)
  const [hoverPos,  setHoverPos]  = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [correct,   setCorrect]   = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)

  const item = items[idx]
  const cx   = svgW / 2

  // Snap to the nearest *valid* target (line or space) — lets mobile users
  // be imprecise and still land on the intended target type.
  function clientToPos(clientY: number): number | null {
    const svg = svgRef.current
    if (!svg) return null
    const r    = svg.getBoundingClientRect()
    const svgY = (clientY - r.top) / r.height * svgH
    const raw  = 10 - (svgY - tTop) / step
    const valid = spaceOnly ? [1, 3, 5, 7, 9, 11] : [0, 2, 4, 6, 8, 10, 12]
    let nearest = valid[0]
    let bestDist = Math.abs(raw - valid[0])
    for (const v of valid) {
      const d = Math.abs(raw - v)
      if (d < bestDist) { nearest = v; bestDist = d }
    }
    return nearest
  }

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (submitted) return
    setHoverPos(clientToPos(e.clientY))
  }

  function advance(currentCorrect: number) {
    if (idx + 1 >= total) { onDone(currentCorrect / total, total); return }
    setIdx(i => i + 1)
    setPlacedPos(null)
    setHoverPos(null)
    setSubmitted(false)
  }

  function onClick() {
    if (submitted || hoverPos === null) return
    const pos = hoverPos
    const ok  = pos === item.pos
    const newCorrect = ok ? correct + 1 : correct
    if (ok) setCorrect(newCorrect)
    setPlacedPos(pos)
    setSubmitted(true)
    setTimeout(() => advance(newCorrect), ok ? 1200 : 2000)
  }

  const isCorrect = submitted && placedPos === item.pos

  const renderPlacedNote = (pos: number, c: string) => {
    const cy = posToY(pos)
    const up = pos <= 6
    return (
      <g>
        {pos === 12 && <LedgerLine cx={cx} cy={cy} color={c} sw={2.5} hw={16} />}
        {pos === 0  && <LedgerLine cx={cx} cy={cy} color={c} hw={16} />}
        <BravuraNote cx={cx} cy={cy} val="whole" color={c} stemUp={up} />
      </g>
    )
  }

  return (
    <div>
      <ProgressBar done={idx} total={total} />
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const, color, marginBottom: 12 }}>{label}</p>

      <p style={{ fontFamily: F, fontSize: 11, color: '#B0ACA4', marginBottom: 8, fontStyle: 'italic' }}>
        {spaceOnly
          ? 'Focusing on space notes — click anywhere on the staff.'
          : 'Focusing on line notes — click anywhere on the staff.'}
      </p>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 300, color: DARK, lineHeight: 1 }}>
          {item.letter}
        </span>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: '4px 0 0' }}>
          <strong>{octaveLabel(item.pos)}</strong> — place <strong>{item.name}</strong> on the staff
        </p>
      </div>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <svg ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            cursor: submitted ? 'default' : 'crosshair' }}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHoverPos(null)}
          onClick={onClick}
        >
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <BassClef />

          {/* Ghost */}
          {!submitted && hoverPos !== null && (
            <g opacity={0.35}>{renderPlacedNote(hoverPos, ACCENT)}</g>
          )}

          {/* Placed note */}
          {placedPos !== null && !submitted && renderPlacedNote(placedPos, ACCENT)}
          {placedPos !== null && submitted && renderPlacedNote(placedPos, isCorrect ? CORRECT : WRONG)}

          {/* Correct position on wrong answer */}
          {submitted && !isCorrect && (
            <g opacity={0.6}>{renderPlacedNote(item.pos, CORRECT)}</g>
          )}
        </svg>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: submitted ? (isCorrect ? CORRECT : WRONG) : '#B0ACA4' }}>
        {!submitted
          ? 'Click on the staff to place the note'
          : isCorrect ? '✓ Correct' : `✗ ${item.name} is ${item.pos % 2 === 0 ? 'on a line' : 'in a space'}`
        }
      </p>
    </div>
  )
}

// ── Word Game ─────────────────────────────────────────────────────────────────
// Bass clef notes available: G2 A2 B2 C3 D3 E3 F3 G3 A3 B3 C4
// Letters: G A B C D E F (all 7)

interface WordItem { word: string; notes: number[] }

const WORDS: WordItem[] = [
  // 3-letter (pos: G2=2, A2=3, B2=4, C3=5, D3=6, E3=7, F3=8, G3=9, A3=10, B3=11)
  { word: 'BAG',  notes: [4, 3, 9]    },   // B2 A2 G3
  { word: 'GAB',  notes: [9, 3, 4]    },   // G3 A2 B2
  { word: 'CAB',  notes: [5, 3, 4]    },   // C3 A2 B2
  { word: 'BED',  notes: [4, 7, 6]    },   // B2 E3 D3
  { word: 'FED',  notes: [8, 7, 6]    },   // F3 E3 D3
  { word: 'DAB',  notes: [6, 3, 4]    },   // D3 A2 B2
  // 4-letter
  { word: 'BEAD', notes: [4, 7, 3, 6]     },   // B2 E3 A2 D3
  { word: 'CAFE', notes: [5, 3, 8, 7]     },   // C3 A2 F3 E3
  { word: 'CAGE', notes: [5, 3, 9, 7]     },   // C3 A2 G3 E3
  { word: 'FACE', notes: [8, 3, 5, 7]     },   // F3 A2 C3 E3
  { word: 'BEEF', notes: [4, 7, 7, 8]     },   // B2 E3 E3 F3
  { word: 'AGED', notes: [3, 9, 7, 6]     },   // A2 G3 E3 D3
  // 5-letter
  { word: 'BADGE', notes: [4, 3, 6, 9, 7]  },  // B2 A2 D3 G3 E3
  { word: 'CAGED', notes: [5, 3, 9, 7, 6]  },  // C3 A2 G3 E3 D3
  { word: 'FACED', notes: [8, 3, 5, 7, 6]  },  // F3 A2 C3 E3 D3
  { word: 'FADED', notes: [8, 3, 6, 7, 6]  },  // F3 A2 D3 E3 D3
  { word: 'GAFFE', notes: [9, 3, 8, 8, 7]  },  // G3 A2 F3 F3 E3
  { word: 'DECAF', notes: [6, 7, 5, 3, 8]  },  // D3 E3 C3 A2 F3
]

const WORDS_3 = WORDS.slice(0, 6)
const WORDS_4 = WORDS.slice(6, 12)
const WORDS_5 = WORDS.slice(12, 18)

function WordStaff({ notes }: { notes: number[] }) {
  const W = svgW, H = svgH
  const n = notes.length
  const innerPad = n <= 3 ? 28 : n === 4 ? 14 : 0
  const startX   = sL + 70 + innerPad
  const endX     = sR - 16 - innerPad
  const gap      = n > 1 ? (endX - startX) / (n - 1) : 0

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
      <StaffBase />
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      <BassClef />
      {notes.map((pos, i) => {
        const x  = n === 1 ? W / 2 : startX + i * gap
        const cy = posToY(pos)
        return (
          <g key={i}>
            {pos === 12 && <LedgerLine cx={x} cy={cy} sw={2.5} hw={16} />}
            <BravuraNote cx={x} cy={cy} val="whole" />
          </g>
        )
      })}
    </svg>
  )
}

function WordRound({
  pool, roundLabel, onDone,
}: { pool: WordItem[]; roundLabel: string; onDone: (s: number, t: number) => void }) {
  const items   = useMemo(() => shuffled(pool), [pool])
  const [idx,       setIdx]       = useState(0)
  const [typed,     setTyped]     = useState('')
  const [submitted, setSubmitted] = useState<{ ok: boolean } | null>(null)
  const [correct,   setCorrect]   = useState(0)
  const lockedRef = useRef(false)
  const inputRef  = useRef<HTMLInputElement>(null)

  const item      = items[idx]
  const isCorrect = submitted?.ok ?? null

  useEffect(() => { inputRef.current?.focus() }, [idx])

  function submit() {
    if (submitted !== null || lockedRef.current) return
    const guess = typed.trim().toUpperCase()
    if (guess === '') return
    lockedRef.current = true
    const ok = guess === item.word
    const newCorrect = ok ? correct + 1 : correct
    if (ok) setCorrect(newCorrect)
    setSubmitted({ ok })
    setTimeout(() => {
      if (idx + 1 >= items.length) { onDone(newCorrect / items.length, items.length); return }
      setIdx(i => i + 1)
      setTyped(''); setSubmitted(null); lockedRef.current = false
    }, ok ? 1200 : 2000)
  }

  // Window-level keyboard — works even when the input doesn't have focus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (submitted !== null || lockedRef.current) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k === 'Enter') { submit(); return }
      if (k === 'Backspace') {
        e.preventDefault()
        setTyped(t => t.slice(0, -1))
        return
      }
      const up = k.toUpperCase()
      if (up.length === 1 && up >= 'A' && up <= 'G') {
        setTyped(t => t.length >= item.word.length ? t : t + up)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [idx, submitted, typed, item.word.length])

  const borderColor = submitted === null ? '#DDD8CA'
    : isCorrect ? '#C0DD97' : '#F0C4A8'
  const inputColor  = submitted === null ? DARK
    : isCorrect ? CORRECT : WRONG

  return (
    <div>
      <ProgressBar done={idx} total={items.length} />
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const, color: ACCENT, marginBottom: 12 }}>{roundLabel}</p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12 }}>
        What word do these notes spell?
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 20 }}>
        <WordStaff notes={item.notes} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <input
          ref={inputRef}
          value={typed}
          readOnly
          placeholder="Type or tap letters"
          style={{
            padding: '10px 16px', borderRadius: 10,
            border: `1.5px solid ${borderColor}`, background: 'white',
            fontFamily: SERIF, fontSize: 22, fontWeight: 400,
            color: inputColor, minWidth: 140, textAlign: 'center',
            letterSpacing: '0.15em', outline: 'none',
          }}
        />
        <button onClick={submit} disabled={submitted !== null || typed.trim() === ''} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: submitted !== null || typed.trim() === '' ? '#EDE8DF' : DARK,
          color: submitted !== null || typed.trim() === '' ? '#B0ACA4' : 'white',
          fontFamily: F, fontSize: 14, fontWeight: 600,
          cursor: submitted !== null || typed.trim() === '' ? 'default' : 'pointer',
        }}>Submit</button>
      </div>

      {/* Letter pad — tap to append, backspace to remove. Useful on mobile. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6,
        maxWidth: 440, margin: '0 auto 16px' }}>
        {NOTE_LETTERS.map(letter => (
          <button key={letter}
            onClick={() => {
              if (submitted !== null) return
              if (typed.length >= item.word.length) return
              setTyped(t => t + letter)
            }}
            disabled={submitted !== null || typed.length >= item.word.length}
            style={{
              padding: '10px 0', borderRadius: 8, border: '1.5px solid #DDD8CA',
              background: 'white', fontFamily: SERIF, fontSize: 18, fontWeight: 400,
              color: submitted !== null || typed.length >= item.word.length ? '#B0ACA4' : DARK,
              cursor: submitted !== null || typed.length >= item.word.length ? 'default' : 'pointer',
            }}>
            {letter}
          </button>
        ))}
        <button
          onClick={() => { if (submitted === null) setTyped(t => t.slice(0, -1)) }}
          disabled={submitted !== null || typed.length === 0}
          aria-label="Backspace"
          style={{
            padding: '10px 0', borderRadius: 8, border: '1.5px solid #DDD8CA',
            background: 'white', fontFamily: F, fontSize: 14,
            color: submitted !== null || typed.length === 0 ? '#B0ACA4' : DARK,
            cursor: submitted !== null || typed.length === 0 ? 'default' : 'pointer',
          }}>
          ⌫
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: submitted !== null ? (isCorrect ? CORRECT : WRONG) : 'transparent' }}>
        {submitted !== null ? (isCorrect ? '✓ Correct!' : `✗ The word is ${item.word}`) : '·'}
      </p>
    </div>
  )
}

function WordGame({ onDone }: { onDone: (s: number, t: number) => void }) {
  const [round,  setRound]  = useState<'3' | '4' | '5' | 'done'>('3')
  const [scores, setScores] = useState<{ s: number; t: number }[]>([])

  function addScore(s: number, t: number, next: '3' | '4' | '5' | 'done') {
    setScores(prev => [...prev, { s, t }])
    setRound(next)
  }

  if (round === 'done') return null

  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        Note spelling
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        Notes spell real words. Read the notes on the staff and choose the word they form.
      </p>
      {round === '3' && <WordRound pool={WORDS_3} roundLabel="3-letter words" onDone={(s,t) => addScore(s,t,'4')} />}
      {round === '4' && <WordRound pool={WORDS_4} roundLabel="4-letter words" onDone={(s,t) => addScore(s,t,'5')} />}
      {round === '5' && <WordRound pool={WORDS_5} roundLabel="5-letter words" onDone={(s,t) => {
        const all     = [...scores, { s, t }]
        const total   = all.reduce((a,b) => a + b.t, 0)
        const correct = all.reduce((a,b) => a + b.s * b.t, 0)
        setRound('done')
        onDone(total > 0 ? correct / total : 1, total)
      }} />}
    </div>
  )
}

// ── Phase controller ──────────────────────────────────────────────────────────
type Phase = 'space-intro' | 'ex1' | 'ex2' | 'line-intro' | 'ex3' | 'ex4' | 'word-game'

const PHASE_ORDER: Phase[] = ['space-intro', 'ex1', 'ex2', 'line-intro', 'ex3', 'ex4', 'word-game']

interface Props { passingScore: number; onComplete: (score: number, total: number) => void }

export default function BassClefLesson({ passingScore, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('space-intro')
  const [key,   setKey]   = useState(0)
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
    goToPhase(PHASE_ORDER[idx + 1])
  }

  function back() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx > 0) {
      const prev = PHASE_ORDER[idx - 1]
      phaseScoresRef.current.delete(prev)
      goToPhase(prev)
    }
  }

  function scored(s: number, t: number) {
    phaseScoresRef.current.set(phase, { correct: Math.round(s * t), total: t })
    next()
  }

  const canGoBack = PHASE_ORDER.indexOf(phase) > 0

  return (
    <div>
      {canGoBack && <BackButton onClick={back} />}
      {phase === 'space-intro' && <SpaceNotesIntro key={key} onNext={next} />}
      {phase === 'ex1' && (
        <NameNoteEx key={key} pool={SPACE_NOTE_POOL} total={18}
          label="Exercise 1 — Name the space note" color={SPACE_C}
          onDone={scored} />
      )}
      {phase === 'ex2' && (
        <PlaceNoteEx key={key} pool={SPACE_NOTE_POOL} total={12}
          label="Exercise 2 — Place the space note" color={SPACE_C} spaceOnly
          onDone={scored} />
      )}
      {phase === 'line-intro' && <LineNotesIntro key={key} onNext={next} />}
      {phase === 'ex3' && (
        <NameNoteEx key={key} pool={LINE_NOTE_POOL} total={18}
          label="Exercise 3 — Name the line note" color={LINE_C}
          onDone={scored} />
      )}
      {phase === 'ex4' && (
        <PlaceNoteEx key={key} pool={LINE_NOTE_POOL} total={12}
          label="Exercise 4 — Place the line note" color={LINE_C} spaceOnly={false}
          onDone={scored} />
      )}
      {phase === 'word-game' && <WordGame key={key} onDone={scored} />}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: F, fontSize: 12, color: '#7A7060',
      padding: '4px 0', marginBottom: 12,
    }}>
      ← Back to previous exercise
    </button>
  )
}
