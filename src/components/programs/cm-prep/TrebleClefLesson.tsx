'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { ExerciseNavBar } from './nav/ExerciseNavBar'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#7A7060'
const ACCENT = '#BA7517'
const CORRECT = '#2d5a3e'
const WRONG = '#a0381c'
const SPACE_C = '#8B3A8B'
const LINE_C  = '#2A5C9A'
const STROKE  = 1.3

// ── Staff geometry — identical to LineSpaceLesson ─────────────────────────────
const step    = 8
const sL      = 32
const sR      = 360
const tTop    = 54        // y of line 5 (top staff line)
const svgW    = sR + 16   // 376
const svgH    = tTop + 8 * step + 54  // 172

// pos system (same as LineSpaceLesson posToY_S):
//   pos=12 → A5 ledger above  (y = tTop - 2*step = 38)
//   pos=11 → G5 space above   (y = tTop - step   = 46)
//   pos=10 → F5 line 5        (y = tTop          = 54)
//   pos=9  → E5 space 4       (y = tTop + step   = 62)
//   pos=8  → D5 line 4        (y = tTop + 2*step = 70)
//   pos=7  → C5 space 3       (y = tTop + 3*step = 78)
//   pos=6  → B4 line 3        (y = tTop + 4*step = 86)
//   pos=5  → A4 space 2       (y = tTop + 5*step = 94)
//   pos=4  → G4 line 2        (y = tTop + 6*step = 102)
//   pos=3  → F4 space 1       (y = tTop + 7*step = 110)
//   pos=2  → E4 line 1        (y = tTop + 8*step = 118)
//   pos=1  → D4 space below   (y = tTop + 9*step = 126)
//   pos=0  → C4 ledger below  (y = tTop +10*step = 134)
function posToY(pos: number) { return tTop + (10 - pos) * step }
function lineY(n: number)    { return tTop + (5 - n) * 2 * step }

const NH_FS   = 60
const NH_OFF  = 8
const STEM_LEN = 47

// ── Bravura primitives ────────────────────────────────────────────────────────
type NoteVal = 'whole' | 'quarter'

function BravuraNote({ cx, cy, val = 'whole', color = DARK, stemUp = true }: {
  cx: number; cy: number; val?: NoteVal; color?: string; stemUp?: boolean
}) {
  const head = val === 'whole' ? '\uE0A2' : '\uE0A4'
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

function TrebleClef({ x = sL + 4 }: { x?: number }) {
  return (
    <text x={x} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
      fill={DARK} dominantBaseline="auto">𝄞</text>
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
      background: disabled ? '#EDE8DF' : 'var(--oxblood)',
      color: disabled ? '#B0ACA4' : '#FDFBF5',
      border: disabled ? 'none' : '1px solid var(--oxblood)', borderRadius: 10,
      padding: '10px 24px', fontFamily: F, fontSize: 14,
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
  { name: 'D4', letter: 'D', pos: 1  },
  { name: 'F4', letter: 'F', pos: 3  },
  { name: 'A4', letter: 'A', pos: 5  },
  { name: 'C5', letter: 'C', pos: 7  },
  { name: 'E5', letter: 'E', pos: 9  },
  { name: 'G5', letter: 'G', pos: 11 },
]

const LINE_NOTE_POOL: NoteInfo[] = [
  { name: 'C4', letter: 'C', pos: 0  },
  { name: 'E4', letter: 'E', pos: 2  },
  { name: 'G4', letter: 'G', pos: 4  },
  { name: 'B4', letter: 'B', pos: 6  },
  { name: 'D5', letter: 'D', pos: 8  },
  { name: 'F5', letter: 'F', pos: 10 },
  { name: 'A5', letter: 'A', pos: 12 },
]

// Treble-only octave labels: Middle C (pos=0), Treble (pos 1–7), High (pos 8–12)
function octaveLabel(pos: number): string {
  if (pos === 0) return 'Middle C'
  if (pos >= 8)  return 'High'
  return 'Treble'
}

// ── Single-note staff (for naming / placing exercises) ─────────────────────────
function SingleNoteStaff({ pos, color = DARK, ghostPos }: {
  pos?: number; color?: string; ghostPos?: number
}) {
  const W = svgW, H = svgH
  const cx = W / 2

  const renderNote = (p: number, c: string) => {
    const cy  = posToY(p)
    const up  = p <= 6
    const isLedgerBelow = p === 0
    const isLedgerAbove = p === 12
    return (
      <g>
        {isLedgerBelow && <LedgerLine cx={cx} cy={cy} color={c} sw={2} hw={16} />}
        {isLedgerAbove && <LedgerLine cx={cx} cy={cy} color={c} sw={STROKE} hw={16} />}
        <BravuraNote cx={cx} cy={cy} val="whole" color={c} stemUp={up} />
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%"
      style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
      <StaffBase />
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      <TrebleClef />
      {pos !== undefined && renderNote(pos, color)}
      {ghostPos !== undefined && (
        <g opacity={0.35}>{renderNote(ghostPos, ACCENT)}</g>
      )}
    </svg>
  )
}

// ── Space Notes Intro visual ──────────────────────────────────────────────────
function SpaceNotesIntro({ onNext }: { onNext: () => void }) {
  const W = svgW, H = svgH + 30
  const cx = (x: number) => {
    // equally space 6 notes between clef end and right barline
    const start = sL + 70
    const end   = sR - 16
    return start + x * (end - start) / 5
  }

  const notes = SPACE_NOTE_POOL  // D4 … G5

  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        Space notes
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        The treble staff has <strong>six space notes</strong> · four inside the staff, plus one space
        just below line 1 and one space just above line 5. Every space note spells part of <strong style={{ color: SPACE_C }}>D F A C E G</strong>.
      </p>

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%"
          style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>

          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <TrebleClef />

          {notes.map((n, i) => {
            const x  = cx(i)
            const cy = posToY(n.pos)
            const isBoundary = n.pos === 1 || n.pos === 11
            const color = isBoundary ? ACCENT : SPACE_C
            const labelY = cy + 20

            return (
              <g key={n.name}>
                <BravuraNote cx={x} cy={cy} val="whole" color={color} />
                {/* white backing rect for readability */}
                <rect x={x - 10} y={labelY - 11} width={20} height={14} rx={2} fill="white" opacity={0.7} />
                <text x={x} y={labelY} fontFamily={F} fontSize={11} fontWeight="700"
                  fill={color} textAnchor="middle">{n.letter}</text>
              </g>
            )
          })}

          {/* G5 label: "space above staff" above the note */}
          <text x={cx(5) - 3} y={posToY(11) - 14} fontFamily={F} fontSize={9} fill={ACCENT}
            textAnchor="middle" fontStyle="italic">space above staff</text>

          {/* D4 label: "space below staff" below the note letter */}
          <text x={cx(0)} y={posToY(1) + 36} fontFamily={F} fontSize={9} fill={ACCENT}
            textAnchor="middle" fontStyle="italic">space below staff</text>
        </svg>
      </div>

      {/* Mnemonic */}
      <div style={{
        background: 'rgba(139,58,139,0.08)', border: '1px solid rgba(139,58,139,0.2)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
      }}>
        <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: SPACE_C, margin: '0 0 4px', letterSpacing: '0.06em' }}>
          D F A C E G
        </p>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: '0 0 8px' }}>
          "Do Funny Animals Come Every Game?" · bottom to top, D through G
        </p>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0 }}>
          The four inner spaces spell <strong style={{ color: SPACE_C }}>FACE</strong> · F A C E from bottom to top.
        </p>
      </div>

      <PrimaryBtn label="Next →" onClick={onNext} />
    </div>
  )
}

// ── Line Notes Intro visual ───────────────────────────────────────────────────
function LineNotesIntro({ onNext }: { onNext: () => void }) {
  const W = svgW, H = svgH + 16

  const notes = LINE_NOTE_POOL  // C4 … A5
  const start = sL + 68
  const end   = sR - 16
  const gap   = (end - start) / (notes.length - 1)

  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        Line notes
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        Five lines, five line notes · <strong style={{ color: LINE_C }}>E G B D F</strong> from bottom to top.
        Add middle C below on its own ledger line, and A5 above on another · seven line notes in all.
      </p>

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12, padding: '12px 0 16px', marginBottom: 20 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%"
          style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>

          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <TrebleClef />

          {notes.map((n, i) => {
            const x  = start + i * gap
            const cy = posToY(n.pos)
            const isLedger = n.pos === 0 || n.pos === 12
            const color = isLedger ? ACCENT : LINE_C
            // labels: below the note for top notes, above for bottom notes
            const labelY = n.pos >= 6 ? cy - 10 : cy + 20

            return (
              <g key={n.name}>
                {n.pos === 0  && <LedgerLine cx={x} cy={cy} color={color} sw={2.5} hw={16} />}
                {n.pos === 12 && <LedgerLine cx={x} cy={cy} color={color} sw={STROKE} hw={16} />}
                <BravuraNote cx={x} cy={cy} val="whole" color={color} />
                <rect x={x - 10} y={labelY - 11} width={20} height={14} rx={2} fill="white" opacity={0.7} />
                <text x={x} y={labelY} fontFamily={F} fontSize={11} fontWeight="700"
                  fill={color} textAnchor="middle">{n.letter}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* C4 vs A5 callout */}
      <div style={{
        background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.25)',
        borderRadius: 10, padding: '14px 16px', marginBottom: 20,
      }}>
        <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: ACCENT, margin: '0 0 6px' }}>
          Watch out: C4 and A5
        </p>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0, lineHeight: 1.6 }}>
          Both sit on a ledger line · C4 below the staff, A5 above.
          Students often confuse them. Remember: C (Middle C) is <em>below</em>, A is <em>above</em>.
        </p>
      </div>

      {/* Mnemonics */}
      <div style={{
        background: 'rgba(42,92,154,0.08)', border: '1px solid rgba(42,92,154,0.2)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
      }}>
        <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: LINE_C, margin: '0 0 4px', letterSpacing: '0.06em' }}>
          C E G B D F A
        </p>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: '0 0 8px' }}>
          "Can Every Good Boy Do Fine Always?" · all 7 line notes, bottom to top
        </p>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0 }}>
          The five staff lines spell <strong style={{ color: LINE_C }}>E G B D F</strong> · "Every Good Boy Does Fine"
        </p>
      </div>

      <PrimaryBtn label="Start exercises →" onClick={onNext} />
    </div>
  )
}

// ── Ex 1 & 3: Name the note ───────────────────────────────────────────────────
const NOTE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

/**
 * Raised paper-tone letter button for the Name-the-note exercises.
 * Mirrors the three-state motion of the Back/Forward NavButton and the
 * Ex1 AnswerPill in GrandStaffLesson: idle flat with 2px under-rule, hover
 * lifts -1px and grows the shadow, mouse-down sinks 2px with an inset
 * pressed-in shadow. After the answer is confirmed the picked pill stays
 * sunken with a forest (correct) or oxblood (wrong) under-rule.
 */
function NoteLetterPill({
  letter, onPick, confirmed, isSelected, isAnswer,
}: {
  letter: string
  onPick: () => void
  confirmed: boolean
  isSelected: boolean
  isAnswer: boolean
}) {
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)

  const showCorrect = confirmed && isAnswer
  const showWrong   = confirmed && isSelected && !isAnswer

  let bg: string
  let border: string
  let shadow: string
  let transform: string
  let textColor: string = DARK

  if (showCorrect) {
    bg = 'linear-gradient(to bottom, #EEF3E5, #DCE5C9)'
    border = 'rgba(45, 90, 62, 0.45)'
    shadow = '0 1px 0 rgba(45, 90, 62, 0.45), inset 0 1px 1px rgba(45, 90, 62, 0.10)'
    transform = 'translateY(2px)'
    textColor = CORRECT
  } else if (showWrong) {
    bg = 'linear-gradient(to bottom, #F6E5DC, #ECCEBE)'
    border = 'rgba(160, 56, 28, 0.45)'
    shadow = '0 1px 0 rgba(160, 56, 28, 0.45), inset 0 1px 1px rgba(160, 56, 28, 0.10)'
    transform = 'translateY(2px)'
    textColor = WRONG
  } else if (pressed) {
    bg = 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)'
    border = '#D7D1C0'
    shadow = '0 1px 0 #CAC3B0, 0 1px 1px rgba(0,0,0,0.04), inset 0 1px 1px rgba(0,0,0,0.04)'
    transform = 'translateY(2px)'
  } else if (hover) {
    bg = 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)'
    border = '#D7D1C0'
    shadow = '0 3px 0 #CAC3B0, 0 4px 8px rgba(0,0,0,0.06)'
    transform = 'translateY(-1px)'
  } else {
    bg = 'linear-gradient(to bottom, #F9F6F0, #EFEBDE)'
    border = '#D7D1C0'
    shadow = '0 2px 0 #CAC3B0, 0 2px 4px rgba(0,0,0,0.04)'
    transform = 'translateY(0)'
  }

  return (
    <button
      onClick={onPick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false) }}
      disabled={confirmed}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: '14px 4px',
        fontFamily: SERIF, fontSize: 22, fontWeight: 400,
        color: textColor,
        cursor: confirmed ? 'default' : 'pointer',
        boxShadow: shadow,
        transform,
        transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease',
      }}
    >
      {letter}
    </button>
  )
}

/**
 * Generic raised paper-tone key for input pads (letter pad + backspace in
 * the word-spelling exercise). Three-state motion only — no answer
 * feedback, since these keys just append/remove text.
 */
function RaisedPadKey({
  children, onClick, disabled, ariaLabel, fontFamily = SERIF, fontSize = 18, fontWeight = 400,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
  ariaLabel?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
}) {
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)

  const isDimmed = disabled
  const bg = isDimmed
    ? 'linear-gradient(to bottom, #F4F1E8, #ECE7D6)'
    : pressed
      ? 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)'
      : hover
        ? 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)'
        : 'linear-gradient(to bottom, #F9F6F0, #EFEBDE)'
  const shadow = isDimmed
    ? '0 1px 0 #CAC3B0'
    : pressed
      ? '0 1px 0 #CAC3B0, 0 1px 1px rgba(0,0,0,0.04), inset 0 1px 1px rgba(0,0,0,0.04)'
      : hover
        ? '0 3px 0 #CAC3B0, 0 4px 8px rgba(0,0,0,0.06)'
        : '0 2px 0 #CAC3B0, 0 2px 4px rgba(0,0,0,0.04)'
  const transform = isDimmed
    ? 'translateY(0)'
    : pressed
      ? 'translateY(2px)'
      : hover
        ? 'translateY(-1px)'
        : 'translateY(0)'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false) }}
      style={{
        background: bg,
        border: '1px solid #D7D1C0',
        borderRadius: 8,
        padding: '10px 0',
        fontFamily, fontSize, fontWeight,
        color: isDimmed ? '#B0ACA4' : DARK,
        cursor: isDimmed ? 'default' : 'pointer',
        boxShadow: shadow,
        transform,
        transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease',
      }}
    >
      {children}
    </button>
  )
}

function NameNoteEx({
  pool, total = 20, label, color, onDone,
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
    // Auto-advance after 1.2s on correct, 2s on wrong
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

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12,
        padding: '8px 0', marginBottom: 20 }}>
        <SingleNoteStaff pos={item.pos} color={DARK} />
      </div>

      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12 }}>
        Name this note
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 20 }}>
        {NOTE_LETTERS.map(letter => (
          <NoteLetterPill
            key={letter}
            letter={letter}
            onPick={() => pick(letter)}
            confirmed={confirmed}
            isSelected={selected === letter}
            isAnswer={letter === item.letter}
          />
        ))}
      </div>

      <p style={{ fontFamily: F, fontSize: 14, color: GREY, margin: 0, minHeight: '1.5em' }}>
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

  const item    = items[idx]
  const cx      = svgW / 2

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
    const cy      = posToY(pos)
    const isLedgerBelow = pos === 0
    const isLedgerAbove = pos === 12
    const stemUp  = pos <= 6
    return (
      <g>
        {isLedgerBelow && <LedgerLine cx={cx} cy={cy} color={c} sw={2} hw={16} />}
        {isLedgerAbove && <LedgerLine cx={cx} cy={cy} color={c} hw={16} />}
        <BravuraNote cx={cx} cy={cy} val="whole" color={c} stemUp={stemUp} />
      </g>
    )
  }

  return (
    <div>
      <ProgressBar done={idx} total={total} />
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const, color, marginBottom: 12 }}>{label}</p>

      {/* Notice */}
      <p style={{ fontFamily: F, fontSize: 11, color: '#B0ACA4', marginBottom: 8, fontStyle: 'italic' }}>
        {spaceOnly
          ? 'We are focusing on space notes in this exercise. You may click anywhere · the answer snaps to a space.'
          : 'We are focusing on line notes. You may click anywhere · aim for the correct line.'}
      </p>

      {/* Target name */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 300, color: DARK, lineHeight: 1 }}>
          {item.letter}
        </span>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: '4px 0 0' }}>
          <strong>{octaveLabel(item.pos)}</strong> · place <strong>{item.name}</strong> on the staff
        </p>
      </div>

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <svg ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto',
            cursor: placedPos !== null || submitted ? 'default' : 'crosshair' }}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHoverPos(null)}
          onClick={onClick}
        >
          <StaffBase />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <TrebleClef />

          {/* Ghost */}
          {placedPos === null && hoverPos !== null && (
            <g opacity={0.35}>{renderPlacedNote(hoverPos, ACCENT)}</g>
          )}

          {/* Placed note */}
          {placedPos !== null && !submitted && renderPlacedNote(placedPos, ACCENT)}
          {placedPos !== null && submitted && renderPlacedNote(placedPos, isCorrect ? CORRECT : WRONG)}

          {/* Show correct position on wrong answer */}
          {submitted && !isCorrect && (
            <g opacity={0.6}>{renderPlacedNote(item.pos, CORRECT)}</g>
          )}
        </svg>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
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
// Each word is a sequence of notes on the treble staff.
// Student sees the notes, picks from 3 word options.

interface WordItem { word: string; notes: number[] }  // notes = pos[]

const WORDS: WordItem[] = [
  // 3-letter
  { word: 'BAG',   notes: [6, 5, 4]         },  // B4 A4 G4 · descending
  { word: 'ACE',   notes: [5, 7, 9]         },  // A4 C5 E5 · ascending
  { word: 'EGG',   notes: [2, 4, 4]         },  // E4 G4 G4
  { word: 'FAD',   notes: [3, 5, 8]         },  // F4 A4 D5
  { word: 'GAB',   notes: [4, 5, 6]         },  // G4 A4 B4 · ascending step
  { word: 'CAB',   notes: [7, 5, 6]         },  // C5 A4 B4
  // 4-letter
  { word: 'CAFE',  notes: [7, 5, 3, 2]      },  // C5 A4 F4 E4 · descending
  { word: 'FACE',  notes: [3, 5, 7, 9]      },  // F4 A4 C5 E5 · ascending
  { word: 'CAGE',  notes: [7, 5, 4, 2]      },  // C5 A4 G4 E4 · descending
  { word: 'BEAD',  notes: [6, 9, 5, 8]      },  // B4 E5 A4 D5
  { word: 'BEEF',  notes: [6, 9, 9, 10]     },  // B4 E5 E5 F5
  { word: 'AGED',  notes: [5, 4, 2, 8]      },  // A4 G4 E4 D5
  // 5-letter
  { word: 'DECAF', notes: [8, 9, 7, 5, 3]   },  // D5 E5 C5 A4 F4 · descending
  { word: 'FACED', notes: [3, 5, 7, 9, 8]   },  // F4 A4 C5 E5 D5 · up then down
  { word: 'GAFFE', notes: [4, 5, 3, 3, 2]   },  // G4 A4 F4 F4 E4
  { word: 'FADED', notes: [3, 5, 8, 9, 8]   },  // F4 A4 D5 E5 D5
  { word: 'BADGE', notes: [6, 5, 8, 4, 2]   },  // B4 A4 D5 G4 E4
  { word: 'CAGED', notes: [7, 5, 4, 2, 1]   },  // C5 A4 G4 E4 D4 · descending
]

const WORDS_3 = WORDS.slice(0, 6)
const WORDS_4 = WORDS.slice(6, 12)
const WORDS_5 = WORDS.slice(12, 18)

function WordStaff({ notes }: { notes: number[] }) {
  const W = svgW, H = svgH
  const n = notes.length
  // Extra inner padding for short words so notes don't crowd clef/barline
  const innerPad = n <= 3 ? 28 : n === 4 ? 14 : 0
  const startX = sL + 70 + innerPad
  const endX   = sR - 16 - innerPad
  const gap    = n > 1 ? (endX - startX) / (n - 1) : 0

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
      <StaffBase />
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      <TrebleClef />
      {notes.map((pos, i) => {
        const x  = n === 1 ? W / 2 : startX + i * gap
        const cy = posToY(pos)
        return (
          <g key={i}>
            {pos === 0  && <LedgerLine cx={x} cy={cy} sw={2} hw={16} />}
            {pos === 12 && <LedgerLine cx={x} cy={cy} hw={16} />}
            <BravuraNote cx={x} cy={cy} val="whole" />
          </g>
        )
      })}
    </svg>
  )
}

function WordRound({
  pool, roundLabel, onDone,
}: {
  pool: WordItem[]; roundLabel: string;
  onDone: (s: number, t: number) => void
}) {
  const items = useMemo(() => shuffled(pool), [pool])
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

  const borderColor = submitted === null ? '#D9CFAE'
    : isCorrect ? '#C0DD97' : '#F0C4A8'
  const inputColor  = submitted === null ? DARK
    : isCorrect ? CORRECT : WRONG

  return (
    <div>
      <ProgressBar done={idx} total={items.length} />
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const, color: ACCENT, marginBottom: 12 }}>
        {roundLabel}
      </p>
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 12 }}>
        What word do these notes spell?
      </p>

      <div style={{ background: '#FDFBF5', border: '1px solid var(--brown-faint)', borderRadius: 12,
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
            border: `1.5px solid ${borderColor}`, background: '#FDFBF5',
            fontFamily: SERIF, fontSize: 22, fontWeight: 400,
            color: inputColor, minWidth: 140, textAlign: 'center',
            letterSpacing: '0.15em', outline: 'none',
          }}
        />
        <button onClick={submit} disabled={submitted !== null || typed.trim() === ''} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: submitted !== null || typed.trim() === '' ? '#EDE8DF' : DARK,
          color: submitted !== null || typed.trim() === '' ? '#B0ACA4' : 'white',
          fontFamily: F, fontSize: 15, fontWeight: 600,
          cursor: submitted !== null || typed.trim() === '' ? 'default' : 'pointer',
        }}>Submit</button>
      </div>

      {/* Letter pad · tap to append, backspace to remove. Useful on mobile. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6,
        maxWidth: 440, margin: '0 auto 16px' }}>
        {NOTE_LETTERS.map(letter => (
          <RaisedPadKey
            key={letter}
            onClick={() => {
              if (submitted !== null) return
              if (typed.length >= item.word.length) return
              setTyped(t => t + letter)
            }}
            disabled={submitted !== null || typed.length >= item.word.length}
          >
            {letter}
          </RaisedPadKey>
        ))}
        <RaisedPadKey
          onClick={() => { if (submitted === null) setTyped(t => t.slice(0, -1)) }}
          disabled={submitted !== null || typed.length === 0}
          ariaLabel="Backspace"
          fontFamily={F}
          fontSize={15}
        >
          ⌫
        </RaisedPadKey>
      </div>

      <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: submitted !== null ? (isCorrect ? CORRECT : WRONG) : 'transparent' }}>
        {submitted !== null ? (isCorrect ? '✓ Correct!' : `✗ The word is ${item.word}`) : '·'}
      </p>
    </div>
  )
}

function WordGame({ onDone }: { onDone: (s: number, t: number) => void }) {
  const [round, setRound] = useState<'3' | '4' | '5' | 'done'>('3')
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
      <p style={{ fontFamily: F, fontSize: 14, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        Notes spell real words. Read the notes on the staff and choose the word they form.
      </p>

      {round === '3' && (
        <WordRound pool={WORDS_3} roundLabel="3-letter words"
          onDone={(s, t) => addScore(s, t, '4')} />
      )}
      {round === '4' && (
        <WordRound pool={WORDS_4} roundLabel="4-letter words"
          onDone={(s, t) => addScore(s, t, '5')} />
      )}
      {round === '5' && (
        <WordRound pool={WORDS_5} roundLabel="5-letter words"
          onDone={(s, t) => {
            const all     = [...scores, { s, t }]
            const total   = all.reduce((a, b) => a + b.t, 0)
            const correct = all.reduce((a, b) => a + b.s * b.t, 0)
            setRound('done')
            onDone(total > 0 ? correct / total : 1, total)
          }} />
      )}
    </div>
  )
}

// ── Phase controller ──────────────────────────────────────────────────────────
type Phase =
  | 'space-intro'
  | 'ex1'          // name space notes
  | 'ex2'          // place space notes
  | 'line-intro'
  | 'ex3'          // name line notes
  | 'ex4'          // place line notes
  | 'word-game'

const PHASE_ORDER: Phase[] = ['space-intro', 'ex1', 'ex2', 'line-intro', 'ex3', 'ex4', 'word-game']

interface Props {
  passingScore: number
  previouslyCompleted?: boolean
  onComplete: (score: number, total: number) => void
}

export default function TrebleClefLesson({ passingScore, previouslyCompleted = false, onComplete }: Props) {
  const [phase,       setPhase]       = useState<Phase>('space-intro')
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

  function scored(s: number, t: number) {
    phaseScoresRef.current.set(phase, { correct: Math.round(s * t), total: t })
    next()
  }

  const currentIdx   = PHASE_ORDER.indexOf(phase)
  const canGoBack    = currentIdx > 0
  const canGoForward = currentIdx >= 0 && currentIdx < furthestIdx

  return (
    <div>
      <ExerciseNavBar canBack={canGoBack} canForward={canGoForward}
        onBack={back} onForward={forward} />
      {phase === 'space-intro' && (
        <SpaceNotesIntro key={key} onNext={next} />
      )}
      {phase === 'ex1' && (
        <NameNoteEx
          key={key}
          pool={SPACE_NOTE_POOL} total={18}
          label="Exercise 1 · Name the space note"
          color={SPACE_C}
          onDone={scored}
        />
      )}
      {phase === 'ex2' && (
        <PlaceNoteEx
          key={key}
          pool={SPACE_NOTE_POOL} total={12}
          label="Exercise 2 · Place the space note"
          color={SPACE_C}
          spaceOnly
          onDone={scored}
        />
      )}
      {phase === 'line-intro' && (
        <LineNotesIntro key={key} onNext={next} />
      )}
      {phase === 'ex3' && (
        <NameNoteEx
          key={key}
          pool={LINE_NOTE_POOL} total={21}
          label="Exercise 3 · Name the line note"
          color={LINE_C}
          onDone={scored}
        />
      )}
      {phase === 'ex4' && (
        <PlaceNoteEx
          key={key}
          pool={LINE_NOTE_POOL} total={14}
          label="Exercise 4 · Place the line note"
          color={LINE_C}
          spaceOnly={false}
          onDone={scored}
        />
      )}
      {phase === 'word-game' && (
        <WordGame key={key} onDone={scored} />
      )}
    </div>
  )
}

