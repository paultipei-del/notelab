'use client'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#7A7060'
const ACCENT = '#BA7517'
// Line vs. space teaching colors — same palette as Prep's StaffDiagrams
// (`LINE_C` / `SPACE_C`). Keeping them in sync so Lesson 1 looks like a
// continuation of the Prep visuals, not a separate language.
const LINE_C = '#2A5C9A'
const SPACE_C = '#2A6B1E'
const STROKE = 1.3

function StaffLines({ x1, x2, top, step }: { x1: number; x2: number; top: number; step: number }) {
  return (
    <>
      {[0, 2, 4, 6, 8].map(p => (
        <line key={p} x1={x1} y1={top + p * step} x2={x2} y2={top + p * step} stroke={DARK} strokeWidth={STROKE} />
      ))}
    </>
  )
}

function BravuraNote({ cx, cy, color = DARK, fs = 52 }: { cx: number; cy: number; color?: string; fs?: number }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={fs} fill={color} textAnchor="middle" dominantBaseline="central">
      {'\uE0A2'}
    </text>
  )
}

function LedgerLine({ cx, cy, color = DARK, hw = 14 }: { cx: number; cy: number; color?: string; hw?: number }) {
  return <line x1={cx - hw} y1={cy} x2={cx + hw} y2={cy} stroke={color} strokeWidth={2} />
}

function TrebleClef({ x, y, fs }: { x: number; y: number; fs: number }) {
  return (
    <text x={x} y={y} fontFamily="Bravura, serif" fontSize={fs} fill={DARK} dominantBaseline="auto">
      𝄞
    </text>
  )
}

function BassClef({ x, y, fs }: { x: number; y: number; fs: number }) {
  return (
    <text x={x} y={y} fontFamily="Bravura, serif" fontSize={fs} fill={DARK} dominantBaseline="auto">
      𝄢
    </text>
  )
}

// ── Visual 1: Treble, two measures (lines then spaces) ─────────────────────────
export function TrebleLetterNamesMeasures() {
  const step = 8
  const sL = 32
  const sR = 700
  const top = 54
  const W = sR + 16
  const H = top + 10 * step + 38

  const staffBottom = top + 8 * step
  const barX = (sL + sR) / 2

  // Treble: C4 (pos0) ... A5 (pos12)
  function posY(pos: number) {
    return top + (10 - pos) * step
  }

  const lineNotes = [
    { pos: 0, letter: 'C' },
    { pos: 2, letter: 'E' },
    { pos: 4, letter: 'G' },
    { pos: 6, letter: 'B' },
    { pos: 8, letter: 'D' },
    { pos: 10, letter: 'F' },
    { pos: 12, letter: 'A' },
  ]
  const spaceNotes = [
    { pos: 1, letter: 'D' },
    { pos: 3, letter: 'F' },
    { pos: 5, letter: 'A' },
    { pos: 7, letter: 'C' },
    { pos: 9, letter: 'E' },
    { pos: 11, letter: 'G' },
  ]

  const leftStart = sL + 86
  const leftEnd = barX - 26
  const rightStart = barX + 26
  const rightEnd = sR - 24

  return (
    <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '14px 12px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
        <StaffLines x1={sL} x2={sR} top={top} step={step} />
        <line x1={sL} y1={top} x2={sL} y2={staffBottom} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={top} x2={sR} y2={staffBottom} stroke={DARK} strokeWidth={STROKE} />
        <line x1={barX} y1={top} x2={barX} y2={staffBottom} stroke={DARK} strokeWidth={STROKE} />
        <TrebleClef x={sL + 4} y={top + 6 * step} fs={50} />

        {/* Measure labels */}
        <text x={(leftStart + leftEnd) / 2} y={top - 16} fontFamily={F} fontSize={10} fill={GREY} textAnchor="middle" letterSpacing="0.12em">
          LINE NOTES
        </text>
        <text x={(rightStart + rightEnd) / 2} y={top - 16} fontFamily={F} fontSize={10} fill={GREY} textAnchor="middle" letterSpacing="0.12em">
          SPACE NOTES
        </text>

        {lineNotes.map((n, i) => {
          const cx = leftStart + (i / (lineNotes.length - 1)) * (leftEnd - leftStart)
          const cy = posY(n.pos)
          const isLedger = n.pos === 0 || n.pos === 12
          // Ledger notes keep ACCENT to flag the special case; the seven
          // staff-line notes use the line teaching color (LINE_C).
          const color = isLedger ? ACCENT : LINE_C
          return (
            <g key={'l' + n.pos}>
              {isLedger && <LedgerLine cx={cx} cy={cy} color={color} hw={14} />}
              <BravuraNote cx={cx} cy={cy} color={color} />
              <rect x={cx - 8} y={cy + 14} width={16} height={14} rx={2} fill="white" opacity={0.75} />
              <text x={cx} y={cy + 25} fontFamily={F} fontSize={11} fontWeight={700} fill={color} textAnchor="middle">
                {n.letter}
              </text>
            </g>
          )
        })}

        {spaceNotes.map((n, i) => {
          const cx = rightStart + (i / (spaceNotes.length - 1)) * (rightEnd - rightStart)
          const cy = posY(n.pos)
          return (
            <g key={'s' + n.pos}>
              <BravuraNote cx={cx} cy={cy} color={SPACE_C} />
              <rect x={cx - 8} y={cy - 28} width={16} height={14} rx={2} fill="white" opacity={0.75} />
              <text x={cx} y={cy - 17} fontFamily={F} fontSize={11} fontWeight={700} fill={SPACE_C} textAnchor="middle">
                {n.letter}
              </text>
            </g>
          )
        })}
      </svg>
      <MnemonicRow
        lineLetters="C E G B D F A"
        lineMnemonic="Can Every Good Boy Do Fine Always"
        spaceLetters="D F A C E G"
        spaceMnemonic="Do Funny Animals Come Every Game"
      />
    </div>
  )
}

// ── Mnemonic pill row ──────────────────────────────────────────────────────────
// HTML rather than SVG — same colored pill design as Prep's LabeledTrebleStaff
// (`Lines — …` / `Spaces — …`), but rendered below the SVG so we don't have to
// extend the staff viewbox just to fit them.
function MnemonicRow({
  lineLetters, lineMnemonic, spaceLetters, spaceMnemonic,
}: {
  lineLetters: string; lineMnemonic: string; spaceLetters: string; spaceMnemonic: string
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
      <div style={{
        background: 'rgba(42,92,154,0.08)',
        border: '1px solid rgba(42,92,154,0.25)',
        borderRadius: 8, padding: '8px 12px',
      }}>
        <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: LINE_C, margin: 0 }}>
          Lines — {lineLetters}
        </p>
        <p style={{ fontFamily: F, fontSize: 11, fontStyle: 'italic', color: LINE_C, margin: '2px 0 0' }}>
          “{lineMnemonic}”
        </p>
      </div>
      <div style={{
        background: 'rgba(42,107,30,0.08)',
        border: '1px solid rgba(42,107,30,0.25)',
        borderRadius: 8, padding: '8px 12px',
      }}>
        <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: SPACE_C, margin: 0 }}>
          Spaces — {spaceLetters}
        </p>
        <p style={{ fontFamily: F, fontSize: 11, fontStyle: 'italic', color: SPACE_C, margin: '2px 0 0' }}>
          “{spaceMnemonic}”
        </p>
      </div>
    </div>
  )
}

// ── Visual 2: Bass, two measures (lines then spaces) ───────────────────────────
export function BassLetterNamesMeasures() {
  const step = 8
  const sL = 32
  const sR = 700
  const top = 54
  const W = sR + 16
  const H = top + 10 * step + 38

  const staffBottom = top + 8 * step
  const barX = (sL + sR) / 2

  // Bass: E2 (pos0) ... C4 (pos12)
  function posY(pos: number) {
    return top + (10 - pos) * step
  }

  const lineNotes = [
    { pos: 0, letter: 'E' },
    { pos: 2, letter: 'G' },
    { pos: 4, letter: 'B' },
    { pos: 6, letter: 'D' },
    { pos: 8, letter: 'F' },
    { pos: 10, letter: 'A' },
    { pos: 12, letter: 'C' },
  ]
  const spaceNotes = [
    { pos: 1, letter: 'F' },
    { pos: 3, letter: 'A' },
    { pos: 5, letter: 'C' },
    { pos: 7, letter: 'E' },
    { pos: 9, letter: 'G' },
    { pos: 11, letter: 'B' },
  ]

  const leftStart = sL + 86
  const leftEnd = barX - 26
  const rightStart = barX + 26
  const rightEnd = sR - 24

  return (
    <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '14px 12px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
        <StaffLines x1={sL} x2={sR} top={top} step={step} />
        <line x1={sL} y1={top} x2={sL} y2={staffBottom} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={top} x2={sR} y2={staffBottom} stroke={DARK} strokeWidth={STROKE} />
        <line x1={barX} y1={top} x2={barX} y2={staffBottom} stroke={DARK} strokeWidth={STROKE} />
        <BassClef x={sL + 4} y={top + 2 * step + 2} fs={56} />

        <text x={(leftStart + leftEnd) / 2} y={top - 16} fontFamily={F} fontSize={10} fill={GREY} textAnchor="middle" letterSpacing="0.12em">
          LINE NOTES
        </text>
        <text x={(rightStart + rightEnd) / 2} y={top - 16} fontFamily={F} fontSize={10} fill={GREY} textAnchor="middle" letterSpacing="0.12em">
          SPACE NOTES
        </text>

        {lineNotes.map((n, i) => {
          const cx = leftStart + (i / (lineNotes.length - 1)) * (leftEnd - leftStart)
          const cy = posY(n.pos)
          const isLedger = n.pos === 0 || n.pos === 12
          const color = isLedger ? ACCENT : LINE_C
          return (
            <g key={'l' + n.pos}>
              {isLedger && <LedgerLine cx={cx} cy={cy} color={color} hw={14} />}
              <BravuraNote cx={cx} cy={cy} color={color} />
              <rect x={cx - 8} y={cy + 14} width={16} height={14} rx={2} fill="white" opacity={0.75} />
              <text x={cx} y={cy + 25} fontFamily={F} fontSize={11} fontWeight={700} fill={color} textAnchor="middle">
                {n.letter}
              </text>
            </g>
          )
        })}

        {spaceNotes.map((n, i) => {
          const cx = rightStart + (i / (spaceNotes.length - 1)) * (rightEnd - rightStart)
          const cy = posY(n.pos)
          return (
            <g key={'s' + n.pos}>
              <BravuraNote cx={cx} cy={cy} color={SPACE_C} />
              <rect x={cx - 8} y={cy - 28} width={16} height={14} rx={2} fill="white" opacity={0.75} />
              <text x={cx} y={cy - 17} fontFamily={F} fontSize={11} fontWeight={700} fill={SPACE_C} textAnchor="middle">
                {n.letter}
              </text>
            </g>
          )
        })}
      </svg>
      <MnemonicRow
        lineLetters="E G B D F A C"
        lineMnemonic="Every Good Boy Deserves Fudge And Candy"
        spaceLetters="F A C E G B"
        spaceMnemonic="Fat Alligators Can Eat Giant Bugs"
      />
    </div>
  )
}

// ── Visual 3: Ledger note sampler on grand staff ───────────────────────────────
export function LedgerLineSampler() {
  // step = half a staff-space. Matches the Treble/Bass measure visuals on
  // the same page so all three staves render the same size — the previous
  // step=10 made this sampler look noticeably bigger than its peers.
  const step = 8
  const sL = 32
  const sR = 740
  const W = sR + 16

  const tTop = 30
  const gap = 4 * step
  const bTop = tTop + 12 * step + gap

  function lineY_T(n: number) {
    return tTop + (5 - n) * 2 * step
  }
  function lineY_B(n: number) {
    return bTop + (5 - n) * 2 * step
  }

  // diatonic pos, where treble C4 = 0, and bass E2 = 0 (separate mappings)
  function posToY_T(pos: number) {
    return tTop + (10 - pos) * step
  }
  function posToY_B(pos: number) {
    return bTop + (10 - pos) * step
  }

  const staffBottom = lineY_B(1)
  const PAD_Y = 36
  // Lowest rendered note is C2 (bass pos = -2), four staff-spaces below the
  // bass staff. The viewBox extends to it plus padding for notehead + ledgers.
  const viewMinY = posToY_T(14) - PAD_Y // top: C6 (treble pos 14)
  const viewMaxY = posToY_B(-2) + PAD_Y // bottom: C2 (bass pos -2)
  const H = viewMaxY - viewMinY

  // Measure layout. The brace + clefs sit *inside* measure 1, so it ends up
  // wider than measures 2-4 (which carry only notes). Each measure has the
  // same NOTE_AREA, so the three notes within each measure are positioned
  // identically regardless of which measure they're in.
  const CLEF_SPACE = 70                                    // clef glyph room
  const NOTE_AREA = (sR - sL - CLEF_SPACE) / 4             // note area shared by m1-m4
  const m1Width = CLEF_SPACE + NOTE_AREA
  const m1NoteStart = sL + CLEF_SPACE                      // notes begin after clef in m1

  type Measure = {
    x0: number
    x1: number
    noteStart: number
    noteEnd: number
    clef: 'treble' | 'bass'
    pos: number[]
  }

  const m2x0 = sL + m1Width
  const m3x0 = m2x0 + NOTE_AREA
  const m4x0 = m3x0 + NOTE_AREA

  const measures: Measure[] = [
    { x0: sL,    x1: sL + m1Width, noteStart: m1NoteStart, noteEnd: sL + m1Width, clef: 'treble', pos: [0, -1, -2] }, // C4, B3, A3 below treble
    { x0: m2x0,  x1: m3x0,         noteStart: m2x0,        noteEnd: m3x0,         clef: 'bass',   pos: [12, 13, 14] }, // C4, D4, E4 above bass
    { x0: m3x0,  x1: m4x0,         noteStart: m3x0,        noteEnd: m4x0,         clef: 'treble', pos: [12, 13, 14] }, // A5, B5, C6 above treble
    { x0: m4x0,  x1: sR,           noteStart: m4x0,        noteEnd: sR,           clef: 'bass',   pos: [0, -1, -2] }, // E2, D2, C2 below bass
  ]

  function ledgerLinesFor(clef: 'treble' | 'bass', pos: number): number[] {
    // staff lines occupy pos 2..10
    const staffLow = 2
    const staffHigh = 10
    if (pos >= staffLow && pos <= staffHigh) return []
    const lines: number[] = []
    if (pos < staffLow) {
      for (let p = staffLow - 2; p >= pos; p -= 2) lines.push(p)
    } else {
      for (let p = staffHigh + 2; p <= pos; p += 2) lines.push(p)
    }
    return lines
  }

  // Notehead size: 3.5 × sw — fills ~0.875 of a staff space so the head
  // sits comfortably centered between adjacent lines. Ledger line hw=16
  // (line width 32 ≈ 2 × sw, ≈ 2 × notehead width) — standard musical
  // proportion. Adjacent notes are NOTE_AREA/4 ≈ 40 units apart, so the
  // 32-wide ledgers leave ~8 units of clear gap between them.
  const NH_FS = 56
  const LEDGER_HW = 16

  return (
    <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12, padding: '14px 12px' }}>
      <svg viewBox={`0 ${viewMinY} ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
        {/* staff lines */}
        {[1, 2, 3, 4, 5].map(n => (
          <line key={'t' + n} x1={sL} y1={lineY_T(n)} x2={sR} y2={lineY_T(n)} stroke={DARK} strokeWidth={STROKE} />
        ))}
        {[1, 2, 3, 4, 5].map(n => (
          <line key={'b' + n} x1={sL} y1={lineY_B(n)} x2={sR} y2={lineY_B(n)} stroke={DARK} strokeWidth={STROKE} />
        ))}
        <line x1={sL} y1={tTop} x2={sL} y2={staffBottom} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={tTop} x2={sR} y2={staffBottom} stroke={DARK} strokeWidth={STROKE} />

        {/* brace + clefs */}
        <text x={sL - 8} y={tTop + (staffBottom - tTop)} fontFamily="Bravura, serif" fontSize={staffBottom - tTop} fill={DARK} textAnchor="middle" dominantBaseline="auto">
          {'\uE000'}
        </text>
        <TrebleClef x={sL + 4} y={tTop + 6 * step} fs={50} />
        <BassClef x={sL + 4} y={bTop + 2 * step + 2} fs={56} />

        {/* barlines */}
        {measures.slice(0, 3).map((m, i) => (
          <line key={i} x1={m.x1} y1={tTop} x2={m.x1} y2={staffBottom} stroke={DARK} strokeWidth={STROKE} />
        ))}

        {/* notes — placed at (i+1)/(n+1) of each measure so the n notes
            are evenly spaced inside the measure with breathing room at
            both barlines (1/4, 2/4, 3/4 for n=3). The previous formula
            put the first/last notes at the barlines themselves, which
            made the across-barline gap visually wider than the within-
            measure gap. */}
        {measures.flatMap((m, mi) => {
          const slots = m.pos.length + 1
          return m.pos.map((p, i) => {
            // Use noteStart/noteEnd (not x0/x1) so measure 1's note placement
            // skips past the clef space and matches the spacing in m2-m4.
            const cx = m.noteStart + ((i + 1) / slots) * (m.noteEnd - m.noteStart)
            const cy = m.clef === 'treble' ? posToY_T(p) : posToY_B(p)
            const lines = ledgerLinesFor(m.clef, p)
            return (
              <g key={`${mi}-${p}`}>
                {lines.map(lp => (
                  <LedgerLine key={lp} cx={cx} cy={m.clef === 'treble' ? posToY_T(lp) : posToY_B(lp)} color={ACCENT} hw={LEDGER_HW} />
                ))}
                <BravuraNote cx={cx} cy={cy} color={ACCENT} fs={NH_FS} />
              </g>
            )
          })
        })}
      </svg>
    </div>
  )
}

export default function LetterNamesVisuals() {
  // White card + uppercase "VISUAL GUIDE" eyebrow — matches Prep's
  // <LessonVisual> wrapper so the visual sections read as the same
  // component family across the two programs.
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E8E4DC',
      borderRadius: 16,
      padding: 24,
    }}>
      <p style={{
        fontFamily: F, fontSize: 'var(--nl-text-compact)',
        fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: '#B0ACA4', margin: '0 0 18px',
      }}>
        Visual Guide
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 400, color: DARK, margin: '0 0 8px' }}>Treble Clef Letter Names</p>
          <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: '0 0 12px', lineHeight: 1.7 }}>
            Here are the note letters on a treble staff. The first bar highlights the <strong style={{ color: LINE_C }}>line notes</strong>; the second bar shows the <strong style={{ color: SPACE_C }}>space notes</strong>.
          </p>
          <TrebleLetterNamesMeasures />
        </div>

        <div>
          <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 400, color: DARK, margin: '0 0 8px' }}>Bass Clef Letter Names</p>
          <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: '0 0 12px', lineHeight: 1.7 }}>
            Same idea in the bass clef: one bar for <strong style={{ color: LINE_C }}>line notes</strong>, then one bar for <strong style={{ color: SPACE_C }}>space notes</strong>.
          </p>
          <BassLetterNamesMeasures />
        </div>

        <div>
          <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 400, color: DARK, margin: '0 0 8px' }}>A Few Ledger-Line Examples</p>
          <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: '0 0 12px', lineHeight: 1.7 }}>
            Ledger lines extend the staff when notes go higher or lower. These examples include notes below treble, above bass, above treble, and below bass.
          </p>
          <LedgerLineSampler />
        </div>
      </div>
    </div>
  )
}

