'use client'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#7A7060'
const ACCENT = '#BA7517'
const LINE_C = '#2A5C9A'
const SPACE_C = '#2A6B1E'
const STROKE_W = 1.3

function StaffLines({ x1, x2, top, step }: { x1: number; x2: number; top: number; step: number }) {
  return (
    <>
      {[0, 2, 4, 6, 8].map(p => (
        <line key={p} x1={x1} y1={top + p * step} x2={x2} y2={top + p * step}
          stroke={DARK} strokeWidth={STROKE_W} />
      ))}
    </>
  )
}

function NoteOval({ cx, cy, color = DARK, rx = 8, ry = 5.5 }: {
  cx: number; cy: number; color?: string; rx?: number; ry?: number
}) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={color} />
}

function CalloutBadge({ cx, cy, n, r = 11 }: { cx: number; cy: number; n: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={ACCENT} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontFamily={F} fill="white" fontWeight="600">{n}</text>
    </g>
  )
}

// ── Lesson 1: Grand Staff Diagram ─────────────────────────────────────────
export function GrandStaffDiagram() {
  const step = 8
  const sL = 40
  const sR = 290
  const tTop = 50
  const bTop = 150
  const bBot = bTop + 8 * step   // 214
  const midY = (tTop + bBot) / 2
  const barX = 175

  const tLines = [0, 2, 4, 6, 8].map(p => tTop + p * step)
  const bLines = [0, 2, 4, 6, 8].map(p => bTop + p * step)

  const entries = [
    { n: 1, label: 'Brace', detail: 'Curved bracket that joins the treble and bass staves into a grand staff' },
    { n: 2, label: 'Treble clef (G clef)', detail: 'Anchors G on the second line — used for higher-pitched notes' },
    { n: 3, label: 'Bass clef (F clef)', detail: 'Anchors F on the fourth line — used for lower-pitched notes' },
    { n: 4, label: 'Bar line', detail: 'Vertical line that divides the staff into measures' },
    { n: 5, label: 'Measure', detail: 'The section of music between two bar lines — one unit of beats' },
  ]

  return (
    <div style={{ display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Staff SVG */}
      <div style={{ flexShrink: 0 }}>
        <svg viewBox={`0 0 310 ${bBot + 26}`} width={260} style={{ display: 'block' }}>
          {/* Left connecting bar */}
          <line x1={sL} y1={tTop} x2={sL} y2={bBot} stroke={DARK} strokeWidth={1.8} />

          {/* Brace */}
          <text x={sL - 8} y={tTop + (bBot - tTop)} fontSize={bBot - tTop}
            fontFamily="Bravura, serif" fill={DARK} textAnchor="middle" dominantBaseline="auto">
            {'\uE000'}
          </text>

          {/* Staves */}
          <StaffLines x1={sL} x2={sR} top={tTop} step={step} />
          <StaffLines x1={sL} x2={sR} top={bTop} step={step} />

          {/* Clefs */}
          <text x={sL + 2} y={tTop + 38} fontFamily="Bravura, serif" fontSize={52} fill={DARK}>𝄞</text>
          <text x={sL + 4} y={bTop + 20} fontFamily="Bravura, serif" fontSize={28} fill={DARK}>𝄢</text>

          {/* Bar line */}
          <line x1={barX} y1={tTop} x2={barX} y2={tLines[4]} stroke={DARK} strokeWidth={STROKE_W} />
          <line x1={barX} y1={bTop} x2={barX} y2={bLines[4]} stroke={DARK} strokeWidth={STROKE_W} />

          {/* End double bar */}
          <line x1={sR - 3} y1={tTop} x2={sR - 3} y2={tLines[4]} stroke={DARK} strokeWidth={STROKE_W} />
          <line x1={sR} y1={tTop} x2={sR} y2={bLines[4]} stroke={DARK} strokeWidth={3} />
          <line x1={sR - 3} y1={bTop} x2={sR - 3} y2={bLines[4]} stroke={DARK} strokeWidth={STROKE_W} />

          {/* Line numbers (treble) */}
          {tLines.map((y, i) => (
            <text key={i} x={sL - 26} y={y + 4} fontFamily={F} fontSize={12} fill={GREY} textAnchor="middle">{5 - i}</text>
          ))}
          {/* Line numbers (bass) */}
          {bLines.map((y, i) => (
            <text key={i} x={sL - 26} y={y + 4} fontFamily={F} fontSize={12} fill={GREY} textAnchor="middle">{5 - i}</text>
          ))}

          {/* Callout badges */}
          {/* 1 = Brace */}
          <CalloutBadge cx={sL - 26} cy={midY} n={1} />
          {/* 2 = Treble clef */}
          <CalloutBadge cx={sL + 22} cy={tTop - 16} n={2} />
          {/* 3 = Bass clef */}
          <CalloutBadge cx={sL + 20} cy={bTop - 16} n={3} />
          {/* 4 = Bar line */}
          <CalloutBadge cx={barX} cy={tLines[4] + 20} n={4} />
          {/* 5 = Measure (mid between start and barline, below bass) */}
          <CalloutBadge cx={(sL + 46 + barX) / 2} cy={bLines[4] + 20} n={5} />
        </svg>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, minWidth: 200 }}>
        {entries.map(e => (
          <div key={e.n} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
            <span style={{
              flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
              background: ACCENT, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: F, fontSize: 12, fontWeight: 600, marginTop: 1,
            }}>{e.n}</span>
            <div>
              <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: DARK, margin: '0 0 2px' }}>{e.label}</p>
              <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: 0, lineHeight: 1.5 }}>{e.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Lesson 2: Lines and Spaces ────────────────────────────────────────────
export function LineSpaceDiagram() {
  const step = 10
  const sL = 40
  const sR = 510
  const tTop = 44

  const notes: { pos: number; name: string; isLine: boolean }[] = [
    { pos: 8, name: 'E4', isLine: true },
    { pos: 7, name: 'F4', isLine: false },
    { pos: 6, name: 'G4', isLine: true },
    { pos: 5, name: 'A4', isLine: false },
    { pos: 4, name: 'B4', isLine: true },
    { pos: 3, name: 'C5', isLine: false },
    { pos: 2, name: 'D5', isLine: true },
    { pos: 1, name: 'E5', isLine: false },
    { pos: 0, name: 'F5', isLine: true },
  ]

  const noteSpacing = (sR - sL - 60) / notes.length
  const startX = sL + 58

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 555 175" width="100%" style={{ maxWidth: 555, display: 'block', margin: '0 auto' }}>
        <StaffLines x1={sL} x2={sR} top={tTop} step={step} />
        <line x1={sL} y1={tTop} x2={sL} y2={tTop + 8 * step} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={tTop} x2={sR} y2={tTop + 8 * step} stroke={DARK} strokeWidth={1.5} />
        <text x={sL + 2} y={tTop + 44} fontFamily="Bravura, serif" fontSize={60} fill={DARK}>𝄞</text>

        {notes.map((n, i) => {
          const cx = startX + i * noteSpacing
          const cy = tTop + n.pos * step
          const color = n.isLine ? LINE_C : SPACE_C
          // Alternate labels above / below to avoid crowding
          const above = n.isLine
          const labelY = above ? cy - 16 : cy + 22

          return (
            <g key={n.name}>
              <NoteOval cx={cx} cy={cy} color={color} rx={9} ry={6} />
              <text x={cx} y={labelY} fontFamily={F} fontSize={12} fill={color}
                textAnchor="middle" fontWeight="700">{n.name}</text>
            </g>
          )
        })}

        {/* Legend */}
        <NoteOval cx={46} cy={155} color={LINE_C} rx={8} ry={5.5} />
        <text x={60} y={160} fontFamily={F} fontSize={13} fill={LINE_C} fontWeight="600">Line note</text>
        <NoteOval cx={160} cy={155} color={SPACE_C} rx={8} ry={5.5} />
        <text x={174} y={160} fontFamily={F} fontSize={13} fill={SPACE_C} fontWeight="600">Space note</text>
      </svg>
    </div>
  )
}

// ── Lesson 3: Labeled Treble Staff ────────────────────────────────────────
export function LabeledTrebleStaff() {
  const step = 10
  const sL = 32
  const sR = 530
  const tTop = 54

  const notes: { pos: number; name: string }[] = [
    { pos: 10, name: 'C4' },
    { pos: 8,  name: 'E4' },
    { pos: 7,  name: 'F4' },
    { pos: 6,  name: 'G4' },
    { pos: 5,  name: 'A4' },
    { pos: 4,  name: 'B4' },
    { pos: 3,  name: 'C5' },
    { pos: 2,  name: 'D5' },
    { pos: 1,  name: 'E5' },
    { pos: 0,  name: 'F5' },
  ]

  const noteSpacing = (sR - sL - 60) / notes.length
  const startX = sL + 55

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 565 195" width="100%" style={{ maxWidth: 565, display: 'block', margin: '0 auto' }}>
        <StaffLines x1={sL} x2={sR} top={tTop} step={step} />
        <line x1={sL} y1={tTop} x2={sL} y2={tTop + 8 * step} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={tTop} x2={sR} y2={tTop + 8 * step} stroke={DARK} strokeWidth={2.5} />
        <text x={sL + 2} y={tTop + 46} fontFamily="Bravura, serif" fontSize={62} fill={DARK}>𝄞</text>

        {notes.map((n, i) => {
          const cx = startX + i * noteSpacing
          const cy = tTop + n.pos * step
          const isLine = n.pos % 2 === 0
          const color = n.pos === 10 ? '#9A8C7A' : isLine ? LINE_C : SPACE_C
          // Upper half of staff → label below; lower half → label above
          const labelAbove = n.pos >= 4
          const labelY = labelAbove ? cy - 16 : cy + 22

          return (
            <g key={n.name}>
              {n.pos === 10 && (
                <line x1={cx - 13} y1={cy} x2={cx + 13} y2={cy} stroke={DARK} strokeWidth={STROKE_W} />
              )}
              <NoteOval cx={cx} cy={cy} color={color} rx={9} ry={6} />
              <text x={cx} y={labelY} fontFamily={F} fontSize={12} fill={color}
                textAnchor="middle" fontWeight="700">{n.name}</text>
            </g>
          )
        })}

        {/* Mnemonics as HTML-style text blocks below staff */}
        <rect x={sL} y={tTop + 8 * step + 18} width={(sR - sL) * 0.52} height={34} rx={7}
          fill="rgba(42,92,154,0.08)" stroke="rgba(42,92,154,0.25)" strokeWidth={1} />
        <text x={sL + 10} y={tTop + 8 * step + 32} fontFamily={F} fontSize={12} fill={LINE_C} fontWeight="700">Lines (E G B D F)</text>
        <text x={sL + 10} y={tTop + 8 * step + 46} fontFamily={F} fontSize={11} fill={LINE_C}>"Every Good Boy Does Fine"</text>

        <rect x={sL + (sR - sL) * 0.54} y={tTop + 8 * step + 18} width={(sR - sL) * 0.46} height={34} rx={7}
          fill="rgba(42,107,30,0.08)" stroke="rgba(42,107,30,0.25)" strokeWidth={1} />
        <text x={sL + (sR - sL) * 0.54 + 10} y={tTop + 8 * step + 32} fontFamily={F} fontSize={12} fill={SPACE_C} fontWeight="700">Spaces (F A C E)</text>
        <text x={sL + (sR - sL) * 0.54 + 10} y={tTop + 8 * step + 46} fontFamily={F} fontSize={11} fill={SPACE_C}>"FACE"</text>
      </svg>
    </div>
  )
}

// ── Lesson 4: Labeled Bass Staff ──────────────────────────────────────────
export function LabeledBassStaff() {
  const step = 10
  const sL = 32
  const sR = 530
  const bTop = 38

  const notes: { pos: number; name: string }[] = [
    { pos: -2, name: 'C4' },
    { pos: 0,  name: 'A3' },
    { pos: 1,  name: 'G3' },
    { pos: 2,  name: 'F3' },
    { pos: 3,  name: 'E3' },
    { pos: 4,  name: 'D3' },
    { pos: 5,  name: 'C3' },
    { pos: 6,  name: 'B2' },
    { pos: 7,  name: 'A2' },
    { pos: 8,  name: 'G2' },
  ]

  const noteSpacing = (sR - sL - 60) / notes.length
  const startX = sL + 55

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 565 195" width="100%" style={{ maxWidth: 565, display: 'block', margin: '0 auto' }}>
        <StaffLines x1={sL} x2={sR} top={bTop} step={step} />
        <line x1={sL} y1={bTop} x2={sL} y2={bTop + 8 * step} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={bTop} x2={sR} y2={bTop + 8 * step} stroke={DARK} strokeWidth={2.5} />
        <text x={sL + 4} y={bTop + 24} fontFamily="Bravura, serif" fontSize={34} fill={DARK}>𝄢</text>

        {notes.map((n, i) => {
          const cx = startX + i * noteSpacing
          const cy = bTop + n.pos * step
          const isLine = n.pos % 2 === 0
          const color = n.name === 'C4' ? '#9A8C7A' : isLine ? LINE_C : SPACE_C
          const labelAbove = n.pos >= 4
          const labelY = labelAbove ? cy - 16 : cy + 22

          return (
            <g key={n.name}>
              {n.pos === -2 && (
                <line x1={cx - 13} y1={cy} x2={cx + 13} y2={cy} stroke={DARK} strokeWidth={STROKE_W} />
              )}
              <NoteOval cx={cx} cy={cy} color={color} rx={9} ry={6} />
              <text x={cx} y={labelY} fontFamily={F} fontSize={12} fill={color}
                textAnchor="middle" fontWeight="700">{n.name}</text>
            </g>
          )
        })}

        <rect x={sL} y={bTop + 8 * step + 18} width={(sR - sL) * 0.54} height={34} rx={7}
          fill="rgba(42,92,154,0.08)" stroke="rgba(42,92,154,0.25)" strokeWidth={1} />
        <text x={sL + 10} y={bTop + 8 * step + 32} fontFamily={F} fontSize={12} fill={LINE_C} fontWeight="700">Lines (G B D F A)</text>
        <text x={sL + 10} y={bTop + 8 * step + 46} fontFamily={F} fontSize={11} fill={LINE_C}>"Good Boys Do Fine Always"</text>

        <rect x={sL + (sR - sL) * 0.56} y={bTop + 8 * step + 18} width={(sR - sL) * 0.44} height={34} rx={7}
          fill="rgba(42,107,30,0.08)" stroke="rgba(42,107,30,0.25)" strokeWidth={1} />
        <text x={sL + (sR - sL) * 0.56 + 10} y={bTop + 8 * step + 32} fontFamily={F} fontSize={12} fill={SPACE_C} fontWeight="700">Spaces (A C E G)</text>
        <text x={sL + (sR - sL) * 0.56 + 10} y={bTop + 8 * step + 46} fontFamily={F} fontSize={11} fill={SPACE_C}>"All Cows Eat Grass"</text>

        <text x={startX} y={bTop - 18} fontFamily={F} fontSize={12} fill={'#9A8C7A'} fontStyle="italic">
          Middle C — ledger line above the bass staff, same pitch as the ledger line below treble
        </text>
      </svg>
    </div>
  )
}

// ── Review: Letter Names ──────────────────────────────────────────────────
export function ReviewLetterNamesDiagram() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ fontFamily: F, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: LINE_C, marginBottom: '10px', fontWeight: 600 }}>
          Treble Staff
        </p>
        <LabeledTrebleStaff />
      </div>
      <div>
        <p style={{ fontFamily: F, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: LINE_C, marginBottom: '10px', fontWeight: 600 }}>
          Bass Staff
        </p>
        <LabeledBassStaff />
      </div>
      <div style={{
        background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.25)',
        borderRadius: '12px', padding: '14px 18px',
      }}>
        <p style={{ fontFamily: F, fontSize: 13, color: '#4A4540', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: ACCENT }}>Middle C</strong> is the same pitch on both staves — written one ledger line below the treble staff and one ledger line above the bass staff.
        </p>
      </div>
    </div>
  )
}
