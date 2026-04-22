'use client'

// Score-style illustrations for the Lesson 13 (Signs and Terms) vocabulary.
//
// Engraving rules followed:
//  • Articulations (accent, staccato) sit OPPOSITE the stem. Stem-up notes ⇒
//    mark below the notehead (SMuFL "Below" variant); stem-down ⇒ above.
//  • Slurs and ties bow AWAY from stems. They're rendered as filled lens-shaped
//    paths (thicker in the middle, thin at the ends) — the same technique
//    professional engraving software uses. Bravura also provides slur-segment
//    glyphs but they're designed as tiling pieces, not standalone curves, so a
//    proper SVG path reads more authentic.
//  • Fermata always above the staff (fermataAbove glyph), dome arching down.
//  • Grand-staff / brace dimensions mirror Lesson 1's MissingStaff.
//  • All music glyphs use Bravura. Text terms (a tempo, Fine, rit., D.C. al
//    Fine) use an italic serif.

import type { CSSProperties, ReactNode } from 'react'

const DARK = '#1A1A18'
const SERIF = 'var(--font-cormorant), serif'
const BRAVURA = 'Bravura, serif'

// Bravura SMuFL codepoints
const GLYPH = {
  trebleClef:      '',
  bassClef:        '',
  brace:           '',
  noteQuarterUp:   '',
  noteQuarterDown: '',
  noteheadBlack:   '',
  accentAbove:     '',
  accentBelow:     '',
  staccatoAbove:   '',
  staccatoBelow:   '',
  fermataAbove:    '',
  repeatLeft:      '',
  repeatRight:     '',
  dynP:            '',
  dynM:            '',
  dynF:            '',
}

// ── Common staff helpers ──────────────────────────────────────────────────
const BOX_W    = 180
const BOX_H    = 120
const STEP     = 6                // line-to-line = 12px — matches Lesson 1 grand staff (gStep=6)
const CENTER_Y = 56
const SLX1     = 14
const SLX2     = BOX_W - 14

function lineY(n: number) { return CENTER_Y + (3 - n) * 2 * STEP }
function trebleY(pos: number) { return CENTER_Y + (6 - pos) * STEP }

function Staff({ leftEnd = true, rightEnd = true, x1 = SLX1, x2 = SLX2 }: {
  leftEnd?: boolean; rightEnd?: boolean; x1?: number; x2?: number
}) {
  return (
    <>
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={x1} y1={lineY(n)} x2={x2} y2={lineY(n)}
          stroke={DARK} strokeWidth={1.1} />
      ))}
      {leftEnd && (
        <line x1={x1} y1={lineY(5)} x2={x1} y2={lineY(1)} stroke={DARK} strokeWidth={1.4} />
      )}
      {rightEnd && (
        <line x1={x2} y1={lineY(5)} x2={x2} y2={lineY(1)} stroke={DARK} strokeWidth={1.4} />
      )}
    </>
  )
}

function Frame({ width = BOX_W, height = BOX_H, children }: {
  width?: number; height?: number; children: ReactNode
}) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: width, display: 'block', margin: '0 auto' }}>
      {children}
    </svg>
  )
}

// SMuFL convention: 1 em = 4 staff-spaces, so fontSize = 8·STEP makes the
// glyph's staff-space match the rendered staff-space exactly.
function TrebleClefGlyph({ x = SLX1 + 4 }: { x?: number }) {
  return (
    <text x={x} y={lineY(2)} fontFamily={BRAVURA} fontSize={50}
      fill={DARK} dominantBaseline="auto">{GLYPH.trebleClef}</text>
  )
}
function BassClefGlyph({ x = SLX1 + 4 }: { x?: number }) {
  return (
    <text x={x} y={lineY(4) + 1} fontFamily={BRAVURA} fontSize={50}
      fill={DARK} dominantBaseline="auto">{GLYPH.bassClef}</text>
  )
}

// Pre-composed quarter note, stem-up. fontSize 48 = 4·staff-space at STEP=6,
// so the notehead exactly fills one staff space.
function QuarterUp({ cx, pos }: { cx: number; pos: number }) {
  return (
    <text x={cx} y={trebleY(pos)} fontFamily={BRAVURA} fontSize={48}
      fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">
      {GLYPH.noteQuarterUp}
    </text>
  )
}

// Stem-down quarter note. Used on the middle line or above, and anywhere a
// mark above the notehead (fermata, etc.) would otherwise collide with the stem.
function QuarterDown({ cx, pos }: { cx: number; pos: number }) {
  return (
    <text x={cx} y={trebleY(pos)} fontFamily={BRAVURA} fontSize={48}
      fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">
      {GLYPH.noteQuarterDown}
    </text>
  )
}

// Slur / tie — filled lens-shape path drawn with a cubic Bezier.
//
// Anchor points
//   • Slur: horizontal centre of each notehead, just outside its edge.
//   • Tie:  inner edges of the two noteheads (tie fills the gap between them).
// Curve shape
//   • Cubic Bezier with controls at 25 % / 75 % of the horizontal span gives
//     the "quick rise, broad apex" profile engravers prefer — quadratic
//     beziers are too pointy.
// Belly
//   • Inner return-curve controls are offset from the outer by `offset`. For
//     cubic beziers, the gap at t = 0.5 is 0.75·offset, so `thickness` is the
//     visible max belly. Tapers to zero at both endpoints.
// Bow depth
//   • Slurs ≈ 1 staff space deep; ties are flatter (≈ ½ space).
// Direction
//   • Bows AWAY from stems. Stem-up ⇒ direction='down'.
function SlurPath({
  x1, y1, x2, y2,
  direction = 'down',
  thickness = 3.0,
  isTie = false,
}: {
  x1: number; y1: number; x2: number; y2: number
  direction?: 'up' | 'down'; thickness?: number; isTie?: boolean
}) {
  const dir  = direction === 'down' ? 1 : -1
  const dx   = x2 - x1
  const dy   = y2 - y1
  const dist = Math.hypot(dx, dy)

  const bowFactor = isTie ? 0.16 : 0.22
  const maxBow    = isTie ? 13   : 24
  const bow = Math.min(maxBow, Math.max(8, dist * bowFactor))

  // Control points at 25 % / 75 % of the chord, tracking its slope so the
  // bow stays roughly perpendicular to the chord for tilted slurs.
  const ax = x1 + dx * 0.25
  const bx = x1 + dx * 0.75
  const ay = y1 + dy * 0.25 + dir * bow
  const by = y1 + dy * 0.75 + dir * bow

  const offset = thickness / 0.75
  return (
    <path
      d={`M ${x1} ${y1}
          C ${ax} ${ay}, ${bx} ${by}, ${x2} ${y2}
          C ${bx} ${by - dir * offset}, ${ax} ${ay - dir * offset}, ${x1} ${y1} Z`}
      fill={DARK}
    />
  )
}

function TermText({ children }: { children: ReactNode }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400,
        fontSize: 30, color: DARK, letterSpacing: '0.01em',
      }}>
        {children}
      </span>
    </div>
  )
}

// ── Grand-staff helpers (dimensions mirror Lesson 1's MissingStaff) ──────
function GrandStaffDiagram({ showClefs = true, width = 190 }:
  { showClefs?: boolean; width?: number }) {
  const gStep = 6
  const gSL   = 28
  const gSR   = width - 20
  const gTT   = 22
  const gBT   = gTT + 8 * gStep + 40   // 110
  const gBB   = gBT + 8 * gStep        // 158
  const H     = gBB + 14               // 172
  const gLineY  = (n: number) => gTT + (5 - n) * 2 * gStep
  const gBLineY = (n: number) => gBT + (5 - n) * 2 * gStep
  const trebleAnchorY = gTT + 6 * gStep         // G line
  const bassAnchorY   = gBT + 2 * gStep + 1     // F line
  return (
    <Frame width={width} height={H}>
      {[1,2,3,4,5].map(n => (
        <line key={'t' + n} x1={gSL} y1={gLineY(n)} x2={gSR} y2={gLineY(n)}
          stroke={DARK} strokeWidth={1.1} />
      ))}
      {[1,2,3,4,5].map(n => (
        <line key={'b' + n} x1={gSL} y1={gBLineY(n)} x2={gSR} y2={gBLineY(n)}
          stroke={DARK} strokeWidth={1.1} />
      ))}
      <line x1={gSL} y1={gTT} x2={gSL} y2={gBB} stroke={DARK} strokeWidth={1.8} />
      <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={DARK} strokeWidth={1.5} />
      <text x={gSL - 8} y={gBB} fontSize={gBB - gTT}
        fontFamily={BRAVURA} fill={DARK} textAnchor="middle" dominantBaseline="auto">
        {GLYPH.brace}
      </text>
      {showClefs && (
        <>
          <text x={gSL + 5} y={trebleAnchorY} fontFamily={BRAVURA} fontSize={50}
            fill={DARK} dominantBaseline="auto">{GLYPH.trebleClef}</text>
          <text x={gSL + 5} y={bassAnchorY} fontFamily={BRAVURA} fontSize={50}
            fill={DARK} dominantBaseline="auto">{GLYPH.bassClef}</text>
        </>
      )}
    </Frame>
  )
}

// ── Individual symbol components ───────────────────────────────────────────

export function AccentSymbol() {
  const pos = 4                           // G4, line 2 — stem up
  const cx = BOX_W / 2
  const cy = trebleY(pos)
  return (
    <Frame>
      <Staff />
      <QuarterUp cx={cx} pos={pos} />
      <text x={cx} y={cy + 22} fontFamily={BRAVURA} fontSize={36}
        fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">
        {GLYPH.accentBelow}
      </text>
    </Frame>
  )
}

export function ATempoSymbol() {
  return <TermText>a tempo</TermText>
}

export function BarLineSymbol() {
  return (
    <Frame>
      <Staff leftEnd={false} rightEnd={false} />
      <line x1={BOX_W / 2} y1={lineY(5)} x2={BOX_W / 2} y2={lineY(1)}
        stroke={DARK} strokeWidth={1.5} />
    </Frame>
  )
}

export function BassClefSymbol() {
  return (
    <Frame>
      <Staff />
      <BassClefGlyph />
    </Frame>
  )
}

export function BraceSymbol() {
  // Mirror Lesson 1's MissingStaff dimensions so the brace looks proportionate
  // to the grand staff it hugs.
  return <GrandStaffDiagram showClefs={false} width={190} />
}

export function DCalFineSymbol() {
  return <TermText>D.C. al Fine</TermText>
}

export function DynamicsSymbol() {
  return (
    <Frame>
      <text x={44} y={76} fontFamily={BRAVURA} fontSize={56}
        fill={DARK} textAnchor="middle">{GLYPH.dynP}</text>
      <text x={BOX_W / 2} y={76} fontFamily={BRAVURA} fontSize={56}
        fill={DARK} textAnchor="middle">{GLYPH.dynM + GLYPH.dynF}</text>
      <text x={BOX_W - 44} y={76} fontFamily={BRAVURA} fontSize={56}
        fill={DARK} textAnchor="middle">{GLYPH.dynF}</text>
    </Frame>
  )
}

export function FermataSymbol() {
  // Note on the middle line (B4). Stem points DOWN so it doesn't collide
  // with the fermata sitting above the staff.
  const pos = 6
  const cx = BOX_W / 2
  return (
    <Frame>
      <Staff />
      <QuarterDown cx={cx} pos={pos} />
      <text x={cx} y={lineY(5) - 6} fontFamily={BRAVURA} fontSize={46}
        fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">
        {GLYPH.fermataAbove}
      </text>
    </Frame>
  )
}

export function FineSymbol() {
  return <TermText>Fine</TermText>
}

export function ForteSymbol() {
  return (
    <Frame width={120}>
      <text x={60} y={78} fontFamily={BRAVURA} fontSize={64}
        fill={DARK} textAnchor="middle">{GLYPH.dynF}</text>
    </Frame>
  )
}

export function GrandStaffSymbol() {
  return <GrandStaffDiagram showClefs={true} width={200} />
}

export function MeasureSymbol() {
  // Just a measure — two bar lines framing empty space. Bar lines slightly
  // heavier so they read as "measure boundaries".
  const midLeft  = BOX_W * 0.25
  const midRight = BOX_W * 0.75
  return (
    <Frame>
      <Staff leftEnd={false} rightEnd={false} />
      <line x1={midLeft}  y1={lineY(5)} x2={midLeft}  y2={lineY(1)}
        stroke={DARK} strokeWidth={1.5} />
      <line x1={midRight} y1={lineY(5)} x2={midRight} y2={lineY(1)}
        stroke={DARK} strokeWidth={1.5} />
    </Frame>
  )
}

export function PianoSymbol() {
  return (
    <Frame width={120}>
      <text x={60} y={78} fontFamily={BRAVURA} fontSize={64}
        fill={DARK} textAnchor="middle">{GLYPH.dynP}</text>
    </Frame>
  )
}

// Hand-drawn repeat barline sets so the dots land in the correct staff
// spaces (space 2 and space 3) regardless of Bravura glyph anchoring.
function RepeatBar({ side, x }: { side: 'left' | 'right'; x: number }) {
  const top     = lineY(5)
  const bottom  = lineY(1)
  const thickW  = 3.6
  const thinW   = 1.3
  const gap     = 4                     // between thick and thin bars
  const dotGap  = 6                     // between thin bar and dots
  const dotR    = 2
  // Dot centers: space 2 (between lines 2 & 3) and space 3 (between lines 3 & 4)
  const dotYLo  = (lineY(2) + lineY(3)) / 2
  const dotYHi  = (lineY(3) + lineY(4)) / 2

  if (side === 'left') {
    // [thick][thin][dots]  x is the left edge of the thick bar.
    const thinX = x + thickW + gap
    const dotX  = thinX + dotGap
    return (
      <>
        <rect x={x} y={top} width={thickW} height={bottom - top} fill={DARK} />
        <line x1={thinX} y1={top} x2={thinX} y2={bottom} stroke={DARK} strokeWidth={thinW} />
        <circle cx={dotX} cy={dotYHi} r={dotR} fill={DARK} />
        <circle cx={dotX} cy={dotYLo} r={dotR} fill={DARK} />
      </>
    )
  }
  // [dots][thin][thick]  x is the right edge of the thick bar.
  const thickLeft = x - thickW
  const thinX     = thickLeft - gap
  const dotX      = thinX - dotGap
  return (
    <>
      <circle cx={dotX} cy={dotYHi} r={dotR} fill={DARK} />
      <circle cx={dotX} cy={dotYLo} r={dotR} fill={DARK} />
      <line x1={thinX} y1={top} x2={thinX} y2={bottom} stroke={DARK} strokeWidth={thinW} />
      <rect x={thickLeft} y={top} width={thickW} height={bottom - top} fill={DARK} />
    </>
  )
}

export function RepeatSignSymbol() {
  // Notes are positioned at 1/3 and 2/3 of the musical width (between the
  // inner edges of the two repeat barlines) so the spacing reads evenly.
  const leftInner  = SLX1 + 8 + 16      // right edge of left repeat's dots
  const rightInner = SLX2 - 8 - 16      // left edge of right repeat's dots
  const span       = rightInner - leftInner
  const cx1        = leftInner + span / 3
  const cx2        = leftInner + (2 * span) / 3
  return (
    <Frame>
      <Staff leftEnd={false} rightEnd={false} />
      <RepeatBar side="left"  x={SLX1 + 8} />
      <QuarterUp cx={cx1} pos={6} />
      <QuarterUp cx={cx2} pos={4} />
      <RepeatBar side="right" x={SLX2 - 8} />
    </Frame>
  )
}

export function RitardandoSymbol() {
  return <TermText>rit.</TermText>
}

export function SlurSymbol() {
  // Two stem-up notes at different pitches. Slur bows BELOW the noteheads,
  // endpoints anchored under the horizontal centre of each notehead.
  const cx1 = 68, cx2 = 124
  const pos1 = 4, pos2 = 2               // G4 → E4
  const y1 = trebleY(pos1), y2 = trebleY(pos2)
  return (
    <Frame>
      <Staff />
      <QuarterUp cx={cx1} pos={pos1} />
      <QuarterUp cx={cx2} pos={pos2} />
      <SlurPath x1={cx1} y1={y1 + 7}
                x2={cx2} y2={y2 + 7}
                direction="down" />
    </Frame>
  )
}

export function StaccatoSymbol() {
  // Stem-up note ⇒ staccato dot BELOW the notehead. A Bravura staccato glyph
  // is drawn at larger size so the dot reads clearly.
  const pos = 4
  const cx = BOX_W / 2
  const cy = trebleY(pos)
  return (
    <Frame>
      <Staff />
      <QuarterUp cx={cx} pos={pos} />
      {/* Use a filled circle directly — crisper than scaling up a Bravura dot. */}
      <circle cx={cx} cy={cy + 14} r={2.2} fill={DARK} />
    </Frame>
  )
}

export function TieSymbol() {
  // Two stem-up notes at the SAME pitch. Tie bows BELOW, endpoints anchored
  // at the inner edges of the noteheads (so the tie fills the gap).
  const cx1 = 68, cx2 = 124
  const pos = 4
  const y = trebleY(pos)
  const NOTEHEAD_HALF = 7                // half-width of Bravura notehead at fontSize 48
  return (
    <Frame>
      <Staff />
      <QuarterUp cx={cx1} pos={pos} />
      <QuarterUp cx={cx2} pos={pos} />
      <SlurPath x1={cx1 + NOTEHEAD_HALF} y1={y + 6}
                x2={cx2 - NOTEHEAD_HALF} y2={y + 6}
                direction="down" thickness={2.6} isTie />
    </Frame>
  )
}

export function TrebleClefSymbol() {
  return (
    <Frame>
      <Staff />
      <TrebleClefGlyph />
    </Frame>
  )
}

// ── Dispatcher ─────────────────────────────────────────────────────────────
export const NOTATION_SYMBOLS: Record<number, React.FC> = {
  101: ATempoSymbol,
  102: AccentSymbol,
  103: BarLineSymbol,
  104: BassClefSymbol,
  105: BraceSymbol,
  106: DCalFineSymbol,
  107: DynamicsSymbol,
  108: FermataSymbol,
  109: FineSymbol,
  110: ForteSymbol,
  111: GrandStaffSymbol,
  112: MeasureSymbol,
  113: PianoSymbol,
  114: RepeatSignSymbol,
  115: RitardandoSymbol,
  116: SlurSymbol,
  117: StaccatoSymbol,
  118: TieSymbol,
  119: TrebleClefSymbol,
}

export function NotationSymbol({ cardId, style }: { cardId: number; style?: CSSProperties }) {
  const Component = NOTATION_SYMBOLS[cardId]
  if (!Component) return null
  return (
    <div style={style}>
      <Component />
    </div>
  )
}
