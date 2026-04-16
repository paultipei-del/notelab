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
  const step    = 6.5
  const sL      = 40
  const sR      = 350
  const W       = sR + 20      // 370
  const CLEF_FS = 50
  const NH_FS   = 44           // Bravura whole-note fontSize

  const tTop1   = 30
  const tTop2   = tTop1 + 8 * step + 56   // second staff, 56 px gap
  const totalH  = tTop2 + 8 * step + 32

  // StaffLines draws lines at top + [0,2,4,6,8]*step
  //   p=0 → line 5 (top, F5)   p=8 → line 1 (bottom, E4)
  // Spaces sit at p=1(E5) 3(C5) 5(A4) 7(F4)
  const lineNotes  = [
    { p: 8, name: 'E' },
    { p: 6, name: 'G' },
    { p: 4, name: 'B' },
    { p: 2, name: 'D' },
    { p: 0, name: 'F' },
  ]
  const spaceNotes = [
    { p: 7, name: 'F' },
    { p: 5, name: 'A' },
    { p: 3, name: 'C' },
    { p: 1, name: 'E' },
  ]

  const lineSpacing  = (sR - sL - 62) / 5  // 5 line notes
  const spaceSpacing = (sR - sL - 62) / 4  // 4 space notes
  const startX       = sL + 62

  function Staff({ top }: { top: number }) {
    return (
      <>
        <StaffLines x1={sL} x2={sR} top={top} step={step} />
        <line x1={sL} y1={top}           x2={sL} y2={top + 8 * step} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={top}           x2={sR} y2={top + 8 * step} stroke={DARK} strokeWidth={1.5} />
        {/* Treble clef: y = top + 6*step anchors the glyph on the G line (line 2 from bottom) */}
        <text x={sL + 2} y={top + 6 * step} fontFamily="Bravura, serif" fontSize={CLEF_FS}
          fill={DARK} dominantBaseline="auto">𝄞</text>
      </>
    )
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${totalH}`} width="100%"
        style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>

        {/* ── Staff 1: Line notes ── */}
        <text x={(sL + sR) / 2} y={tTop1 - 10} fontFamily={F} fontSize={10} fontWeight="700"
          fill={LINE_C} letterSpacing="0.12em" textAnchor="middle">LINE NOTES</text>
        <Staff top={tTop1} />

        {lineNotes.map((n, i) => {
          const cx = startX + i * lineSpacing
          const cy = tTop1 + n.p * step
          const labelY = cy + 17
          return (
            <g key={'l' + i}>
              <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={NH_FS}
                fill={LINE_C} textAnchor="middle" dominantBaseline="central">
                {'\uE0A2'}
              </text>
              <rect x={cx - 8} y={labelY - 11} width={16} height={14} rx={2}
                fill="white" opacity={0.6} />
              <text x={cx} y={labelY} fontFamily={F} fontSize={11} fill={LINE_C}
                textAnchor="middle" fontWeight="700">{n.name}</text>
            </g>
          )
        })}

        {/* ── Staff 2: Space notes ── */}
        <text x={(sL + sR) / 2} y={tTop2 - 10} fontFamily={F} fontSize={10} fontWeight="700"
          fill={SPACE_C} letterSpacing="0.12em" textAnchor="middle">SPACE NOTES</text>
        <Staff top={tTop2} />

        {spaceNotes.map((n, i) => {
          const cx = startX + i * spaceSpacing
          const cy = tTop2 + n.p * step
          const labelY = cy + 17
          return (
            <g key={'s' + i}>
              <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={NH_FS}
                fill={SPACE_C} textAnchor="middle" dominantBaseline="central">
                {'\uE0A2'}
              </text>
              <text x={cx} y={labelY} fontFamily={F} fontSize={11} fill={SPACE_C}
                textAnchor="middle" fontWeight="700">{n.name}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Lesson 3: Labeled Treble Staff ────────────────────────────────────────
export function LabeledTrebleStaff() {
  // Matches LineSpaceLesson geometry exactly
  const step  = 8
  const sL    = 32
  const sR    = 700
  const tTop  = 54    // y of line 5 (top staff line)
  const NH_FS = 44    // Bravura whole-note size for diagrams

  // pos system: pos=10 → line 5 (F5), pos=0 → C4 ledger below
  // y(pos) = tTop + (10 - pos) * step
  function posY(pos: number) { return tTop + (10 - pos) * step }

  // All treble notes C4 – F5, in ascending order
  const notes: { pos: number; name: string }[] = [
    { pos: 0,  name: 'C' },  // ledger below
    { pos: 1,  name: 'D' },
    { pos: 2,  name: 'E' },
    { pos: 3,  name: 'F' },
    { pos: 4,  name: 'G' },
    { pos: 5,  name: 'A' },
    { pos: 6,  name: 'B' },
    { pos: 7,  name: 'C' },
    { pos: 8,  name: 'D' },
    { pos: 9,  name: 'E' },
    { pos: 10, name: 'F' },
    { pos: 11, name: 'G' },  // space above
    { pos: 12, name: 'A' },  // ledger above
  ]

  const clefEndX = sL + 68
  const endX     = sR - 24
  const startX   = clefEndX + 4
  const spacing  = (endX - startX) / (notes.length - 1)

  // SVG height: ledger above = tTop - 2*step, ledger below = tTop + 10*step
  // Add 50px below for mnemonics
  const svgH = tTop + 10 * step + 50 + 42  // 266
  const W    = sR + 16

  const lineBot = tTop + 8 * step  // y of line 1 (bottom staff line)

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${svgH}`} width="100%"
        style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>

        {/* Staff lines */}
        <StaffLines x1={sL} x2={sR} top={tTop} step={step} />
        <line x1={sL} y1={tTop} x2={sL} y2={lineBot} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={tTop} x2={sR} y2={lineBot} stroke={DARK} strokeWidth={STROKE_W} />

        {/* Treble clef: anchored at G line (line 2) = tTop + 6*step */}
        <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={50}
          fill={DARK} dominantBaseline="auto">𝄞</text>

        {notes.map((n, i) => {
          const cx    = startX + (i / (notes.length - 1)) * (endX - startX)
          const cy    = posY(n.pos)
          const isLine   = n.pos % 2 === 0
          const isLedger = n.pos === 0 || n.pos === 12
          const color    = isLedger ? ACCENT : isLine ? LINE_C : SPACE_C

          // Line notes: label below. Space notes: label above.
          const labelY = isLine ? cy + 20 : cy - 12

          return (
            <g key={n.pos}>
              {/* Ledger line below (C4) */}
              {n.pos === 0 && (
                <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy}
                  stroke={color} strokeWidth={2} />
              )}
              {/* Ledger line above (A5) */}
              {n.pos === 12 && (
                <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy}
                  stroke={color} strokeWidth={STROKE_W} />
              )}

              {/* Bravura whole-notehead */}
              <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={NH_FS}
                fill={color} textAnchor="middle" dominantBaseline="central">
                {'\uE0A2'}
              </text>

              {/* Label with white backing for readability */}
              <rect x={cx - 8} y={labelY - 11} width={16} height={14} rx={2}
                fill="white" opacity={0.75} />
              <text x={cx} y={labelY} fontFamily={F} fontSize={11} fontWeight="700"
                fill={color} textAnchor="middle">{n.name}</text>
            </g>
          )
        })}

        {/* Mnemonic pills — offset below the lowest note label (C4 at y≈152) */}
        <rect x={sL} y={lineBot + 44} width={(sR - sL) * 0.50} height={34} rx={7}
          fill="rgba(42,92,154,0.08)" stroke="rgba(42,92,154,0.25)" strokeWidth={1} />
        <text x={sL + 10} y={lineBot + 58} fontFamily={F} fontSize={12}
          fill={LINE_C} fontWeight="700">Lines — C E G B D F A</text>
        <text x={sL + 10} y={lineBot + 72} fontFamily={F} fontSize={10.5}
          fill={LINE_C} fontStyle="italic">"Can Every Good Boy Do Fine Always"</text>

        <rect x={sL + (sR - sL) * 0.52} y={lineBot + 44} width={(sR - sL) * 0.48} height={34} rx={7}
          fill="rgba(139,58,139,0.08)" stroke="rgba(139,58,139,0.2)" strokeWidth={1} />
        <text x={sL + (sR - sL) * 0.52 + 10} y={lineBot + 58} fontFamily={F} fontSize={12}
          fill={SPACE_C} fontWeight="700">Spaces — D F A C E G</text>
        <text x={sL + (sR - sL) * 0.52 + 10} y={lineBot + 72} fontFamily={F} fontSize={10.5}
          fill={SPACE_C} fontStyle="italic">"Do Funny Animals Come Every Game"</text>
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
            <g key={n.pos}>
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
