'use client'

import { useState, useRef, useMemo } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#7A7060'
const ACCENT = '#BA7517'
const CORRECT = '#2A6B1E'
const WRONG = '#B5402A'
const LINE_C  = '#2A5C9A'
const SPACE_C = '#8B3A8B'
const STROKE  = 1.3

// ── Staff geometry — matches GrandStaffLesson exactly ─────────────────────────
const step = 8
const sL   = 32
const sR   = 360
const tTop = 54    // y of line 5 (top)
const svgW = sR + 16           // 376
const svgH = tTop + 8 * step + 54  // 172

function lineY(n: number)  { return tTop + (5 - n) * 2 * step }
function spaceY(n: number) { return tTop + (4 - n) * 2 * step + step }

// Treble clef at GrandStaffLesson proportions
const TCX = sL + 4    // 36
const TCY = lineY(2)  // 102 — G line
const TCFS = 62

// Bass clef
const BCX = sL + 2    // 34
const BCFS = 66

// Grand staff for Ex1 / Ex2
const gTT  = 28
const gBT  = gTT + 8 * step + 44  // 136
const gBB  = gBT + 8 * step       // 200
const gSvgH = gBB + 32            // 232

function gLY(n: number)  { return gTT + (5 - n) * 2 * step }  // treble line n
function gbLY(n: number) { return gBT + (5 - n) * 2 * step }  // bass line n

// pos: 2=line1, 3=space1, 4=line2 … 10=line5 within a staff
function posToY_T(pos: number) { return gTT + (10 - pos) * step }
function posToY_B(pos: number) { return gBT + (10 - pos) * step }

// pos → y for single-staff exercises (tTop-based)
function posToY_S(pos: number) { return tTop + (10 - pos) * step }

// ── Bravura note rendering ─────────────────────────────────────────────────────
type NoteVal = 'whole' | 'half' | 'quarter' | 'dotted-half' | 'eighth'
type Clef    = 'treble' | 'bass'

// SMuFL codepoints
const HEAD: Record<NoteVal, string> = {
  'whole':       '\uE0A2',   // noteheadWhole
  'half':        '\uE0A3',   // noteheadHalf
  'quarter':     '\uE0A4',   // noteheadBlack
  'dotted-half': '\uE0A3',
  'eighth':      '\uE0A4',
}
const FLAG_UP   = '\uE240'   // flag8thUp
const FLAG_DOWN = '\uE241'   // flag8thDown

const NH_FS   = 60   // notehead fontSize — matches BravuraWhole in GrandStaffLesson
const NH_OFF  = 8    // stem x offset from notehead center
const STEM_LEN = 47  // stem length px

function BravuraNote({
  cx, cy, val, color = DARK, stemUp = true,
}: { cx: number; cy: number; val: NoteVal; color?: string; stemUp?: boolean }) {
  const hasStem = val !== 'whole'
  const hasFlag = val === 'eighth'
  const hasDot  = val === 'dotted-half'
  const stemX   = stemUp ? cx + NH_OFF : cx - NH_OFF
  const stemY2  = stemUp ? cy - STEM_LEN : cy + STEM_LEN

  return (
    <g>
      {/* Notehead — Bravura glyph, centred on (cx, cy) */}
      <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={NH_FS}
        fill={color} textAnchor="middle" dominantBaseline="central">
        {HEAD[val]}
      </text>
      {/* Augmentation dot */}
      {hasDot && <circle cx={cx + NH_OFF + 7} cy={cy} r={3} fill={color} />}
      {/* Stem */}
      {hasStem && (
        <line x1={stemX} y1={cy} x2={stemX} y2={stemY2}
          stroke={color} strokeWidth={STROKE} />
      )}
      {/* Flag — Bravura glyph at stem tip; stem-down flag offset down so it clears notehead */}
      {hasFlag && (
        <text x={stemX - 0.5} y={stemUp ? stemY2 : stemY2 + 10} fontFamily="Bravura, serif" fontSize={NH_FS * 0.9}
          fill={color} dominantBaseline="auto" textAnchor="start">
          {stemUp ? FLAG_UP : FLAG_DOWN}
        </text>
      )}
    </g>
  )
}

// Bravura whole-note alias (matches GrandStaffLesson BravuraWhole)
function BravuraWhole({ cx, cy, color = ACCENT }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={NH_FS}
      fill={color} textAnchor="middle" dominantBaseline="central">
      {'\uE0A2'}
    </text>
  )
}

// ── Staff line components ──────────────────────────────────────────────────────
function StaffBase({ x1 = sL, x2 = sR, top = tTop, s = step, color = DARK }: {
  x1?: number; x2?: number; top?: number; s?: number; color?: string
}) {
  return (
    <>
      {[1,2,3,4,5].map(n => (
        <line key={n} x1={x1} y1={top + (5-n)*2*s} x2={x2} y2={top + (5-n)*2*s}
          stroke={color} strokeWidth={STROKE} />
      ))}
    </>
  )
}

function TrebleClef({ x = TCX, top = tTop }: { x?: number; top?: number }) {
  return (
    <text x={x} y={top + 6*step} fontFamily="Bravura, serif" fontSize={TCFS}
      fill={DARK} dominantBaseline="auto">𝄞</text>
  )
}

function BassClef({ x = BCX, top = gBT }: { x?: number; top?: number }) {
  return (
    <text x={x} y={top + 2*step + 2} fontFamily="Bravura, serif" fontSize={BCFS}
      fill={DARK} dominantBaseline="auto">𝄢</text>
  )
}

function LedgerLine({ cx, cy, color = DARK, sw = STROKE, hw = 14 }: { cx: number; cy: number; color?: string; sw?: number; hw?: number }) {
  return <line x1={cx - hw} y1={cy} x2={cx + hw} y2={cy} stroke={color} strokeWidth={sw} />
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function ExLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase' as const, color: ACCENT, marginBottom: 12 }}>
      {children}
    </p>
  )
}

function PrimaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: DARK, color: 'white', border: 'none', borderRadius: 10,
      padding: '10px 24px', fontFamily: F, fontSize: 13, cursor: 'pointer',
    }}>{label}</button>
  )
}

function ProgressDots({ total, current, results }: { total: number; current: number; results: boolean[] }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
          background: i < results.length
            ? (results[i] ? CORRECT : WRONG)
            : i === current ? ACCENT : '#DDD8CA',
        }} />
      ))}
    </div>
  )
}

function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

// ── Intro visuals ─────────────────────────────────────────────────────────────

// Note shapes: whole, half, quarter floating — no staff
function NoteShapesVisual() {
  const W = 450, H = 155
  const labelY = 16
  const noteY  = 82   // stem tip at ~40, well below label
  const descY  = H - 8
  const items: { val: NoteVal; label: string; desc: string; x: number }[] = [
    { val: 'whole',   label: 'Whole note',   desc: 'Hollow oval, no stem',    x: 75  },
    { val: 'half',    label: 'Half note',    desc: 'Hollow oval with a stem', x: 225 },
    { val: 'quarter', label: 'Quarter note', desc: 'Solid oval with a stem',  x: 375 },
  ]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%"
      style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
      {items.map(n => (
        <g key={n.val}>
          <text x={n.x} y={labelY} fontFamily={F} fontSize={11} fontWeight="700"
            fill={DARK} textAnchor="middle">{n.label}</text>
          <BravuraNote cx={n.x} cy={noteY} val={n.val} color={DARK} stemUp />
          <text x={n.x} y={descY} fontFamily={F} fontSize={10}
            fill={GREY} textAnchor="middle" letterSpacing="0">{n.desc}</text>
        </g>
      ))}
    </svg>
  )
}

// Treble staff with 7 line notes (varied values), including C4 and A5 ledger
function LineNoteStaff() {
  const lL = 36, lR = 480, lW = 500
  const H  = svgH + 20

  // pos 0=C4(ledger below), 2=E4, 4=G4, 6=B4, 8=D5, 10=F5, 12=A5(ledger above)
  const notes: { pos: number; val: NoteVal }[] = [
    { pos: 0,  val: 'whole'      },
    { pos: 2,  val: 'half'       },
    { pos: 4,  val: 'quarter'    },
    { pos: 6,  val: 'dotted-half'},
    { pos: 8,  val: 'eighth'     },
    { pos: 10, val: 'half'       },
    { pos: 12, val: 'quarter'    },
  ]

  const startX  = lL + 72
  const spacing = (lR - startX) / notes.length

  return (
    <svg viewBox={`0 0 ${lW} ${H}`} width="100%"
      style={{ maxWidth: lW, display: 'block', margin: '0 auto' }}>
      <StaffBase x1={lL} x2={lR} />
      <line x1={lL} y1={tTop} x2={lL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={lR} y1={tTop} x2={lR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      <TrebleClef x={lL + 2} />

      {notes.map((n, i) => {
        const cx  = startX + i * spacing
        const cy  = posToY_S(n.pos)
        const up  = n.pos <= 6
        return (
          <g key={i}>
            {n.pos === 0  && <LedgerLine cx={cx} cy={cy} color={LINE_C} sw={2.5} hw={18} />}
            {n.pos === 12 && <LedgerLine cx={cx} cy={cy} color={LINE_C} />}
            <BravuraNote cx={cx} cy={cy} val={n.val} color={LINE_C} stemUp={up} />
          </g>
        )
      })}

      <text x={lW / 2} y={H - 4} fontFamily={F} fontSize={11} fontWeight="600" fill={LINE_C} textAnchor="middle">
        Line notes — a staff line passes through the note head
      </text>
    </svg>
  )
}

// Treble staff with 6 space notes, including D4 (below) and G5 (above)
function SpaceNoteStaff() {
  const lL = 36, lR = 480, lW = 500
  const H  = svgH

  // pos 1=D4(below L1), 3=F4(S1), 5=A4(S2), 7=C5(S3), 9=E5(S4), 11=G5(above L5)
  const notes: { pos: number; val: NoteVal }[] = [
    { pos: 1,  val: 'whole'      },
    { pos: 3,  val: 'half'       },
    { pos: 5,  val: 'quarter'    },
    { pos: 7,  val: 'dotted-half'},
    { pos: 9,  val: 'eighth'     },
    { pos: 11, val: 'half'       },
  ]

  const startX  = lL + 74
  const spacing = (lR - startX) / notes.length

  return (
    <svg viewBox={`0 0 ${lW} ${H}`} width="100%"
      style={{ maxWidth: lW, display: 'block', margin: '0 auto' }}>
      <StaffBase x1={lL} x2={lR} />
      <line x1={lL} y1={tTop} x2={lL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={lR} y1={tTop} x2={lR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      <TrebleClef x={lL + 2} />

      {notes.map((n, i) => {
        const cx = startX + i * spacing
        const cy = posToY_S(n.pos)
        const up = n.pos <= 6
        return (
          <g key={i}>
            <BravuraNote cx={cx} cy={cy} val={n.val} color={SPACE_C} stemUp={up} />
          </g>
        )
      })}

      <text x={lW / 2} y={H - 6} fontFamily={F} fontSize={11} fontWeight="600" fill={SPACE_C} textAnchor="middle">
        Space notes — the head sits between two staff lines
      </text>
    </svg>
  )
}

// ── Ex 1 & 2: Grand staff click-to-select ─────────────────────────────────────
// Wider dimensions for the exercise grand staff
const EX_L = 36, EX_R = 560, EX_W = 580

type NoteState = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed'

interface GNote {
  id: number; clef: Clef; pos: number; val: NoteVal; isLine: boolean; x: number
}

function buildGrandNotes(): GNote[] {
  const vals: NoteVal[] = ['whole', 'half', 'quarter', 'dotted-half', 'eighth']
  const rv = () => vals[Math.floor(Math.random() * vals.length)]
  const tPos = shuffled([2,3,4,5,6,7,8,9,10]).slice(0, 8)
  const bPos = shuffled([2,3,4,5,6,7,8,9,10]).slice(0, 8)
  const spacing = (EX_R - EX_L - 70) / 8
  const startX  = EX_L + 70 + spacing / 2

  let id = 0
  const notes: GNote[] = []
  tPos.forEach((pos, i) => notes.push({ id: id++, clef: 'treble', pos, val: rv(), isLine: pos % 2 === 0, x: startX + i * spacing }))
  bPos.forEach((pos, i) => notes.push({ id: id++, clef: 'bass',   pos, val: rv(), isLine: pos % 2 === 0, x: startX + i * spacing }))
  return notes
}

function GrandStaffEx({
  targetLine, round, totalRounds, onDone,
}: { targetLine: boolean; round: number; totalRounds: number; onDone: (s: number, t: number) => void }) {
  const [notes] = useState<GNote[]>(buildGrandNotes)
  const [states, setStates] = useState<Record<number, NoteState>>({})
  const [submitted, setSubmitted] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  function toggle(id: number) {
    if (submitted) return
    setStates(prev => ({ ...prev, [id]: prev[id] === 'selected' ? 'idle' : 'selected' }))
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (submitted) return
    const svg = svgRef.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const svgX = (e.clientX - r.left) * (EX_W / r.width)
    const svgY = (e.clientY - r.top) * (gSvgH / r.height)

    // Bravura noteheads render ~8px lower than cy due to glyph baseline offset
    const NH_Y_OFFSET = 8
    let closest: GNote | null = null
    let minDist = Infinity
    for (const n of notes) {
      const cy = (n.clef === 'treble' ? posToY_T(n.pos) : posToY_B(n.pos)) + NH_Y_OFFSET
      const dist = Math.sqrt((svgX - n.x) ** 2 + (svgY - cy) ** 2)
      if (dist < minDist) { minDist = dist; closest = n }
    }
    if (closest && minDist < 28) toggle(closest.id)
  }

  function submit() {
    const next: Record<number, NoteState> = {}
    notes.forEach(n => {
      const sel = states[n.id] === 'selected'
      const target = n.isLine === targetLine
      if (sel && target)   next[n.id] = 'correct'
      else if (sel)        next[n.id] = 'wrong'
      else if (target)     next[n.id] = 'missed'
      else                 next[n.id] = 'idle'
    })
    setStates(next)
    setSubmitted(true)
  }

  function finish() {
    const targetNotes = notes.filter(n => n.isLine === targetLine)
    const correct = targetNotes.filter(n => states[n.id] === 'correct').length
    onDone(correct / targetNotes.length, targetNotes.length)
  }

  function noteColor(n: GNote): string {
    const s = states[n.id]
    if (!submitted) return s === 'selected' ? ACCENT : DARK
    if (s === 'correct') return CORRECT
    if (s === 'wrong' || s === 'missed') return WRONG
    return DARK
  }

  const selectedCount = Object.values(states).filter(s => s === 'selected').length

  const typeColor = targetLine ? LINE_C : SPACE_C
  const typeLabel = targetLine ? 'Line notes' : 'Space notes'

  return (
    <div>
      {/* Color-coded type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase' as const, color: 'white',
          background: typeColor, borderRadius: 6, padding: '3px 10px',
        }}>{typeLabel}</span>
        <span style={{ fontFamily: F, fontSize: 11, color: '#B0ACA4' }}>
          Round {round} of {totalRounds}
        </span>
      </div>
      <ExLabel>Highlight the {targetLine ? 'line' : 'space'} notes</ExLabel>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 6, lineHeight: 1.6 }}>
        {targetLine
          ? 'Tap each line note — a staff line runs through its head.'
          : 'Tap each space note — its head rests between two lines.'}
      </p>
      <p style={{ fontFamily: F, fontSize: 12, color: '#B0ACA4', marginBottom: 16 }}>
        Focus on the note head, not the stem.
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '12px 0', marginBottom: 16, overflowX: 'auto' }}>
        <svg ref={svgRef} viewBox={`0 0 ${EX_W} ${gSvgH}`} width="100%"
          style={{ maxWidth: EX_W, display: 'block', margin: '0 auto', cursor: 'pointer' }}
          onPointerDown={handlePointerDown}>

          <defs>
            <filter id="glow-accent" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-correct" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-wrong" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Brace */}
          <text x={EX_L - 10} y={gBB} fontFamily="Bravura, serif" fontSize={gBB - gTT}
            fill={DARK} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>

          {/* Left connecting barline */}
          <line x1={EX_L} y1={gTT} x2={EX_L} y2={gBB} stroke={DARK} strokeWidth={1.8} />

          {/* Treble staff */}
          <StaffBase x1={EX_L} x2={EX_R} top={gTT} />
          <line x1={EX_R} y1={gTT} x2={EX_R} y2={gLY(1)} stroke={DARK} strokeWidth={STROKE} />
          <TrebleClef x={EX_L + 4} top={gTT} />

          {/* Bass staff */}
          <StaffBase x1={EX_L} x2={EX_R} top={gBT} />
          <line x1={EX_R} y1={gBT} x2={EX_R} y2={gBB} stroke={DARK} strokeWidth={STROKE} />
          <BassClef x={EX_L + 4} top={gBT} />

          {/* End barline */}
          <line x1={EX_R} y1={gTT} x2={EX_R} y2={gBB} stroke={DARK} strokeWidth={STROKE} />

          {notes.map(n => {
            const cy     = n.clef === 'treble' ? posToY_T(n.pos) : posToY_B(n.pos)
            const up     = n.pos <= 6
            const color  = noteColor(n)
            const sel    = !submitted && states[n.id] === 'selected'
            const s      = states[n.id]

            return (
              <g key={n.id}>
                {/* Highlight — glowing rect behind notehead */}
                {sel && (
                  <rect x={n.x - 16} y={cy - 12} width={32} height={24} rx={12}
                    fill={ACCENT} opacity={0.25} filter="url(#glow-accent)" />
                )}
                {submitted && s === 'correct' && (
                  <rect x={n.x - 16} y={cy - 12} width={32} height={24} rx={12}
                    fill={CORRECT} opacity={0.25} filter="url(#glow-correct)" />
                )}
                {submitted && (s === 'wrong' || s === 'missed') && (
                  <rect x={n.x - 16} y={cy - 12} width={32} height={24} rx={12}
                    fill={WRONG} opacity={0.25} filter="url(#glow-wrong)" />
                )}
                <BravuraNote cx={n.x} cy={cy} val={n.val} color={color} stemUp={up} />
              </g>
            )
          })}
        </svg>
      </div>

      {!submitted ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <PrimaryBtn label="Check →" onClick={submit} />
          <p style={{ fontFamily: F, fontSize: 12, color: '#B0ACA4', margin: 0 }}>
            {selectedCount} selected
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0 }}>
            {notes.filter(n => states[n.id] === 'correct').length} / {notes.filter(n => n.isLine === targetLine).length} {targetLine ? 'line' : 'space'} notes found
          </p>
          <PrimaryBtn label="Continue →" onClick={finish} />
        </div>
      )}
    </div>
  )
}

// ── Ex 3: L or S card flip ────────────────────────────────────────────────────
const EX3_TOTAL = 12

interface CardNote { pos: number; val: NoteVal; isLine: boolean }

function buildCard(): CardNote {
  const pos = 2 + Math.floor(Math.random() * 9)  // 2–10
  const vals: NoteVal[] = ['whole', 'half', 'quarter', 'dotted-half', 'eighth']
  return { pos, val: vals[Math.floor(Math.random() * vals.length)], isLine: pos % 2 === 0 }
}

function CardStaff({ note, revealed }: { note: CardNote; revealed: boolean }) {
  const W = 240, H = svgH
  const cx  = 141  // midpoint between clef end (~84) and right barline (220)
  const cy  = posToY_S(note.pos)
  const up  = note.pos <= 6
  const col = revealed ? (note.isLine ? LINE_C : SPACE_C) : DARK

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
      <StaffBase x1={30} x2={220} />
      <line x1={30}  y1={tTop} x2={30}  y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={220} y1={tTop} x2={220} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      <TrebleClef x={34} />
      {note.pos === 0 && <LedgerLine cx={cx} cy={cy} color={col} />}
      <BravuraNote cx={cx} cy={cy} val={note.val} color={col} stemUp={up} />
      {revealed && (
        <text x={W/2} y={H - 8} fontFamily={F} fontSize={12} fontWeight="700"
          fill={note.isLine ? LINE_C : SPACE_C} textAnchor="middle">
          {note.isLine ? 'Line note' : 'Space note'}
        </text>
      )}
    </svg>
  )
}

function Ex3({ onDone }: { onDone: (s: number, t: number) => void }) {
  const cards = useMemo(() => Array.from({ length: EX3_TOTAL }, buildCard), [])
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<'L' | 'S' | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const lockedRef = useRef(false)

  const card = cards[idx]
  const isCorrect = chosen !== null ? (chosen === 'L') === card.isLine : null

  function pick(c: 'L' | 'S') {
    if (chosen !== null || lockedRef.current) return
    lockedRef.current = true
    const ok = (c === 'L') === card.isLine
    setChosen(c)
    setResults(r => [...r, ok])
    setTimeout(() => {
      if (idx + 1 >= EX3_TOTAL) {
        const correctCount = results.filter(Boolean).length + (ok ? 1 : 0)
        onDone(correctCount / EX3_TOTAL, EX3_TOTAL)
        return
      }
      setIdx(i => i + 1)
      setChosen(null)
      lockedRef.current = false
    }, ok ? 1000 : 1800)
  }

  return (
    <div>
      <ExLabel>Exercise 3 — Line or space?</ExLabel>
      <ProgressDots total={EX3_TOTAL} current={idx} results={results} />
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 16, lineHeight: 1.6, textAlign: 'center' }}>
        Is this a <strong>Line</strong> note or a <strong>Space</strong> note?
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '16px', marginBottom: 20 }}>
        <CardStaff note={card} revealed={chosen !== null} />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
        {(['L', 'S'] as const).map(opt => {
          const label  = opt === 'L' ? 'Line' : 'Space'
          const picked = chosen === opt
          const bg     = chosen === null ? 'white'
            : picked ? (isCorrect ? 'rgba(42,107,30,0.12)' : 'rgba(181,64,42,0.12)') : 'white'
          const border = chosen === null ? '#DDD8CA'
            : picked ? (isCorrect ? CORRECT : WRONG) : '#DDD8CA'
          const textCol = chosen === null ? DARK
            : picked ? (isCorrect ? CORRECT : WRONG) : '#B0ACA4'
          return (
            <button key={opt} onClick={() => pick(opt)} style={{
              padding: '10px 20px', borderRadius: 10,
              border: `2px solid ${border}`, background: bg,
              cursor: chosen ? 'default' : 'pointer',
              fontFamily: F, fontSize: 14, fontWeight: 600, color: textCol,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{label}</button>
          )
        })}
      </div>

      {chosen !== null && (
        <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600,
          color: isCorrect ? CORRECT : WRONG, margin: 0 }}>
          {isCorrect ? '✓ Correct' : `✗ That's a ${card.isLine ? 'line' : 'space'} note`}
        </p>
      )}
    </div>
  )
}

// ── Ex 4 & 5: Draw notes by clicking on staff ─────────────────────────────────
function DrawNotes({
  targetLine, exNum, round, totalRounds, onDone,
}: { targetLine: boolean; exNum: number; round: number; totalRounds: number; onDone: (s: number, t: number) => void }) {
  const targets = targetLine ? [2,4,6,8,10] : [3,5,7,9]
  const total   = targets.length

  const [placed,    setPlaced]    = useState<number[]>([])  // pos at each slot, in order
  const [submitted, setSubmitted] = useState(false)
  const [hoverPos,  setHoverPos]  = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const allFilled = placed.length >= total

  // Fixed x slots, equally spaced
  const noteAreaStart = sL + 66
  const noteAreaEnd   = sR - 16
  const noteSpacing   = (noteAreaEnd - noteAreaStart) / (total - 1)
  function slotX(idx: number) { return noteAreaStart + idx * noteSpacing }

  // Map client y to nearest staff position (pos 1–11)
  function clientToPos(clientY: number): number | null {
    const svg = svgRef.current
    if (!svg) return null
    const r    = svg.getBoundingClientRect()
    const svgY = (clientY - r.top) / r.height * svgH
    const raw  = (tTop + 8 * step - svgY) / step + 2
    const pos  = Math.round(raw)
    if (pos < 1 || pos > 11) return null
    return pos
  }

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (allFilled || submitted) return
    setHoverPos(clientToPos(e.clientY))
  }

  function onClick() {
    if (allFilled || submitted || hoverPos === null) return
    setPlaced(prev => [...prev, hoverPos])
  }

  function submit() {
    setSubmitted(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase' as const, color: 'white',
          background: targetLine ? LINE_C : SPACE_C, borderRadius: 6, padding: '3px 10px',
        }}>{targetLine ? 'Line notes' : 'Space notes'}</span>
        <span style={{ fontFamily: F, fontSize: 11, color: '#B0ACA4' }}>
          Round {round} of {totalRounds}
        </span>
      </div>
      <ExLabel>Exercise {exNum} — Draw a note on each {targetLine ? 'line' : 'space'}</ExLabel>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 8, lineHeight: 1.6 }}>
        {allFilled
          ? `All ${total} notes placed.`
          : `Click anywhere on the staff to place a note. ${total - placed.length} remaining.`}
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '16px 0', marginBottom: 16 }}>
        <svg ref={svgRef}
          viewBox={`0 0 ${svgW + 6} ${svgH}`} width="100%"
          style={{ maxWidth: svgW + 6, display: 'block', margin: '0 auto',
            cursor: allFilled || submitted ? 'default' : 'crosshair' }}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHoverPos(null)}
          onClick={onClick}
        >
          <StaffBase x2={sR + 6} />
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          <line x1={sR + 6} y1={tTop} x2={sR + 6} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
          <TrebleClef />

          {/* Ghost note at next slot */}
          {!allFilled && hoverPos !== null && (
            <g style={{ pointerEvents: 'none' }} opacity={0.35}>
              <BravuraNote
                cx={slotX(placed.length)}
                cy={posToY_S(hoverPos)}
                val="quarter"
                color={ACCENT}
                stemUp={hoverPos <= 6}
              />
            </g>
          )}

          {/* Placed notes */}
          {placed.map((pos, i) => {
            const correct = submitted ? targets.includes(pos) : null
            const color   = correct === null ? DARK : correct ? CORRECT : WRONG
            return (
              <g key={i}>
                {pos === 2 && <LedgerLine cx={slotX(i)} cy={posToY_S(pos)} color={color} />}
                <BravuraNote
                  cx={slotX(i)}
                  cy={posToY_S(pos)}
                  val="quarter"
                  color={color}
                  stemUp={pos <= 6}
                />
              </g>
            )
          })}
        </svg>
      </div>

      {allFilled && !submitted && (
        <PrimaryBtn label="Check →" onClick={submit} />
      )}
      {submitted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0,
            color: placed.every(p => targets.includes(p)) ? CORRECT : GREY }}>
            {placed.filter(p => targets.includes(p)).length} / {total} on a {targetLine ? 'line' : 'space'}
          </p>
          <PrimaryBtn label="Continue →" onClick={() => onDone(placed.filter(p => targets.includes(p)).length / total, total)} />
        </div>
      )}
    </div>
  )
}

// ── Intro screens ─────────────────────────────────────────────────────────────
function NoteShapesIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>Note shapes</p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        Every note has a shape that tells you how long to hold it.
        A <strong>whole note</strong> is a hollow oval with no stem.
        {' '}A <strong>half note</strong> adds a stem to that hollow oval.
        A <strong>quarter note</strong> fills the oval in, same stem, darker head.
        You will learn what each of these means soon.
      </p>
      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '24px 16px', marginBottom: 20 }}>
        <NoteShapesVisual />
      </div>
      <PrimaryBtn label="Next →" onClick={onNext} />
    </div>
  )
}

function LineNoteIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>Line notes</p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        A <strong style={{ color: LINE_C }}>line note</strong> has a staff line running directly through its head.
        Any note value can sit on a line — look at the head position, not the stem.
      </p>
      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
        <LineNoteStaff />
      </div>
      <PrimaryBtn label="Next →" onClick={onNext} />
    </div>
  )
}

function SpaceNoteIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>Space notes</p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        A <strong style={{ color: SPACE_C }}>space note</strong> has its head between two staff lines —
        no line passes through it. Space notes can also appear above the top line or below the bottom line.
      </p>
      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
        <SpaceNoteStaff />
      </div>
      <PrimaryBtn label="Start exercises →" onClick={onNext} />
    </div>
  )
}

// ── Phase controller ──────────────────────────────────────────────────────────
type Phase = 'note-shapes' | 'line-intro' | 'space-intro' |
  'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6' |
  'gs-repeat' | 'ex3' |
  'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' |
  'dn-repeat'

interface Props { passingScore: number; onComplete: (score: number, total: number) => void }

export default function LineSpaceLesson({ passingScore, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('note-shapes')
  const [scores, setScores] = useState<{ s: number; t: number }[]>([])
  const [gsScores, setGsScores] = useState<{ s: number; t: number }[]>([])
  const [gsRatio,  setGsRatio]  = useState(0)
  const [dnScores, setDnScores] = useState<{ s: number; t: number }[]>([])
  const [dnRatio,  setDnRatio]  = useState(0)

  function addScore(s: number, t: number) { setScores(prev => [...prev, { s, t }]) }

  function addGsScore(s: number, t: number): { s: number; t: number }[] {
    addScore(s, t)
    const next = [...gsScores, { s, t }]
    setGsScores(next)
    return next
  }

  function addDnScore(s: number, t: number): { s: number; t: number }[] {
    addScore(s, t)
    const next = [...dnScores, { s, t }]
    setDnScores(next)
    return next
  }

  function handleR6Done(s: number, t: number) {
    const all     = addGsScore(s, t)
    const total   = all.reduce((a, b) => a + b.t, 0)
    const correct = all.reduce((a, b) => a + b.s * b.t, 0)
    const ratio   = total > 0 ? correct / total : 1
    if (ratio < 0.90) { setGsRatio(ratio); setPhase('gs-repeat') }
    else               { setPhase('ex3') }
  }

  function handleD6Done(s: number, t: number) {
    const all     = addDnScore(s, t)
    const total   = all.reduce((a, b) => a + b.t, 0)
    const correct = all.reduce((a, b) => a + b.s * b.t, 0)
    const ratio   = total > 0 ? correct / total : 1
    if (ratio < 0.90) { setDnRatio(ratio); setPhase('dn-repeat') }
    else               { finish() }
  }

  function retryGs() { setGsScores([]); setPhase('r1') }
  function retryDn() { setDnScores([]); setPhase('d1') }

  function finish() {
    const total   = scores.reduce((a, b) => a + b.t, 0)
    const correct = scores.reduce((a, b) => a + b.s * b.t, 0)
    onComplete(total > 0 ? correct / total : 1, total)
  }

  return (
    <div>
      {phase === 'note-shapes' && <NoteShapesIntro onNext={() => setPhase('line-intro')} />}
      {phase === 'line-intro'  && <LineNoteIntro   onNext={() => setPhase('space-intro')} />}
      {phase === 'space-intro' && <SpaceNoteIntro  onNext={() => setPhase('r1')} />}
      {phase === 'r1' && <GrandStaffEx targetLine          round={1} totalRounds={6} onDone={(s,t) => { addGsScore(s,t); setPhase('r2') }} />}
      {phase === 'r2' && <GrandStaffEx targetLine={false}  round={2} totalRounds={6} onDone={(s,t) => { addGsScore(s,t); setPhase('r3') }} />}
      {phase === 'r3' && <GrandStaffEx targetLine          round={3} totalRounds={6} onDone={(s,t) => { addGsScore(s,t); setPhase('r4') }} />}
      {phase === 'r4' && <GrandStaffEx targetLine={false}  round={4} totalRounds={6} onDone={(s,t) => { addGsScore(s,t); setPhase('r5') }} />}
      {phase === 'r5' && <GrandStaffEx targetLine          round={5} totalRounds={6} onDone={(s,t) => { addGsScore(s,t); setPhase('r6') }} />}
      {phase === 'r6' && <GrandStaffEx targetLine={false}  round={6} totalRounds={6} onDone={handleR6Done} />}
      {phase === 'gs-repeat' && (
        <div>
          <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 6 }}>
            Keep practicing
          </p>
          <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 24, lineHeight: 1.7 }}>
            You scored <strong style={{ color: DARK }}>{Math.round(gsRatio * 100)}%</strong> across those 6 rounds.
            Try again to reach 90% before moving on.
          </p>
          <PrimaryBtn label="Try again →" onClick={retryGs} />
        </div>
      )}
      {phase === 'ex3' && <Ex3 onDone={(s,t) => { addScore(s,t); setPhase('d1') }} />}
      {phase === 'd1' && <DrawNotes targetLine          exNum={4} round={1} totalRounds={6} onDone={(s,t) => { addDnScore(s,t); setPhase('d2') }} />}
      {phase === 'd2' && <DrawNotes targetLine={false}  exNum={5} round={2} totalRounds={6} onDone={(s,t) => { addDnScore(s,t); setPhase('d3') }} />}
      {phase === 'd3' && <DrawNotes targetLine          exNum={4} round={3} totalRounds={6} onDone={(s,t) => { addDnScore(s,t); setPhase('d4') }} />}
      {phase === 'd4' && <DrawNotes targetLine={false}  exNum={5} round={4} totalRounds={6} onDone={(s,t) => { addDnScore(s,t); setPhase('d5') }} />}
      {phase === 'd5' && <DrawNotes targetLine          exNum={4} round={5} totalRounds={6} onDone={(s,t) => { addDnScore(s,t); setPhase('d6') }} />}
      {phase === 'd6' && <DrawNotes targetLine={false}  exNum={5} round={6} totalRounds={6} onDone={handleD6Done} />}
      {phase === 'dn-repeat' && (
        <div>
          <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 6 }}>
            Keep practicing
          </p>
          <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 24, lineHeight: 1.7 }}>
            You scored <strong style={{ color: DARK }}>{Math.round(dnRatio * 100)}%</strong> across those 6 rounds.
            Try again to reach 90% before moving on.
          </p>
          <PrimaryBtn label="Try again →" onClick={retryDn} />
        </div>
      )}
    </div>
  )
}
