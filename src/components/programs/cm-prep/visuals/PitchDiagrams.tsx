'use client'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#B0ACA4'
const ACCENT = '#BA7517'
const HIGHLIGHT_A = '#BA7517'  // gold for first note
const HIGHLIGHT_B = '#3B6DB5'  // blue for second note
const SHARP_C = '#2A5C0A'
const FLAT_C = '#3B6DB5'
const NAT_C = '#7A7060'
const STROKE_W = 1.3

// Piano key layout helpers
const WK_W = 22   // white key width
const WK_H = 64   // white key height
const BK_W = 14   // black key width
const BK_H = 40   // black key height

// White key x positions for one octave (C=0 base)
const WHITE_X: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }
// Black key x offset (left edge, relative to octave start)
const BLACK_X: Record<string, number> = { 'C#': 14, 'D#': 36, 'F#': 80, 'G#': 102, 'A#': 124 }

interface KeyState { white?: string; black?: string }  // 'a' | 'b' | 'normal'

function PianoOctave({
  ox = 0, oy = 0, states = {}, labels = {},
}: {
  ox?: number; oy?: number
  states?: Record<string, string>  // note → 'a' | 'b' | 'dim'
  labels?: Record<string, string>
}) {
  const noteColor = (n: string) => {
    if (states[n] === 'a') return HIGHLIGHT_A
    if (states[n] === 'b') return HIGHLIGHT_B
    if (states[n] === 'dim') return '#DDD8CA'
    return null
  }

  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#']

  return (
    <g transform={`translate(${ox},${oy})`}>
      {/* White keys */}
      {whiteKeys.map(k => {
        const x = WHITE_X[k] * WK_W
        const color = noteColor(k)
        return (
          <g key={k}>
            <rect x={x} y={0} width={WK_W - 1} height={WK_H} fill={color || 'white'} stroke={DARK} strokeWidth={0.8} rx={2} />
            {labels[k] && (
              <text x={x + WK_W / 2 - 0.5} y={WK_H - 7} fontFamily={F} fontSize={9} textAnchor="middle"
                fill={color ? 'white' : '#7A7060'}>{labels[k]}</text>
            )}
          </g>
        )
      })}
      {/* Black keys */}
      {blackKeys.map(k => {
        const x = BLACK_X[k]
        const color = noteColor(k)
        return (
          <g key={k}>
            <rect x={x} y={0} width={BK_W} height={BK_H} fill={color || DARK} stroke={DARK} strokeWidth={0.6} rx={1.5} />
            {labels[k] && (
              <text x={x + BK_W / 2} y={BK_H - 5} fontFamily={F} fontSize={8} textAnchor="middle"
                fill="white">{labels[k]}</text>
            )}
          </g>
        )
      })}
    </g>
  )
}

// ── Lesson 5: Sharps, Flats, Naturals ─────────────────────────────────────
export function AccidentalsDiagram() {
  const octW = 7 * WK_W  // 154px per octave

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 500 200" width="100%" style={{ maxWidth: 500, display: 'block', margin: '0 auto' }}>

        {/* Piano keyboard */}
        <PianoOctave ox={30} oy={30}
          states={{ C: 'a', 'C#': 'b' }}
          labels={{ C: 'C', D: 'D', 'C#': 'C♯/D♭' }}
        />

        {/* Sharp arrow: C → C# (raise) */}
        <path d={`M ${30 + WK_W / 2} ${30 - 8} L ${30 + BLACK_X['C#'] + BK_W / 2} ${30 - 8}`}
          stroke={SHARP_C} strokeWidth={1.5} fill="none" markerEnd="url(#arrowGreen)" />
        <text x={(30 + WK_W / 2 + 30 + BLACK_X['C#'] + BK_W / 2) / 2} y={30 - 15}
          fontFamily={F} fontSize={10} fill={SHARP_C} textAnchor="middle">♯ raises ½ step</text>

        {/* Flat arrow: D → Db (lower) */}
        <PianoOctave ox={220} oy={30}
          states={{ D: 'a', 'C#': 'b' }}
          labels={{ C: 'C', D: 'D', 'C#': 'D♭/C♯' }}
        />
        <path d={`M ${220 + WHITE_X['D'] * WK_W + WK_W / 2} ${30 - 8} L ${220 + BLACK_X['C#'] + BK_W / 2} ${30 - 8}`}
          stroke={FLAT_C} strokeWidth={1.5} fill="none" markerEnd="url(#arrowBlue)" />
        <text x={(220 + WHITE_X['D'] * WK_W + WK_W / 2 + 220 + BLACK_X['C#'] + BK_W / 2) / 2} y={30 - 15}
          fontFamily={F} fontSize={10} fill={FLAT_C} textAnchor="middle">♭ lowers ½ step</text>

        {/* Arrows defs */}
        <defs>
          <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={SHARP_C} />
          </marker>
          <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={FLAT_C} />
          </marker>
        </defs>

        {/* Symbol reference row */}
        {/* Sharp */}
        <rect x={30} y={130} width={120} height={55} rx={10} fill="rgba(42,92,10,0.08)" stroke="rgba(42,92,10,0.2)" strokeWidth={1} />
        <text x={90} y={150} fontFamily="Bravura, serif" fontSize={26} fill={SHARP_C} textAnchor="middle">&#x266F;</text>
        <text x={90} y={170} fontFamily={F} fontSize={10} fill={SHARP_C} textAnchor="middle" fontWeight="600">Sharp (♯)</text>
        <text x={90} y={182} fontFamily={F} fontSize={9} fill={SHARP_C} textAnchor="middle">Raises by a half step</text>

        {/* Flat */}
        <rect x={190} y={130} width={120} height={55} rx={10} fill="rgba(59,109,181,0.08)" stroke="rgba(59,109,181,0.2)" strokeWidth={1} />
        <text x={250} y={152} fontFamily="Bravura, serif" fontSize={26} fill={FLAT_C} textAnchor="middle">&#x266D;</text>
        <text x={250} y={170} fontFamily={F} fontSize={10} fill={FLAT_C} textAnchor="middle" fontWeight="600">Flat (♭)</text>
        <text x={250} y={182} fontFamily={F} fontSize={9} fill={FLAT_C} textAnchor="middle">Lowers by a half step</text>

        {/* Natural */}
        <rect x={350} y={130} width={120} height={55} rx={10} fill="rgba(122,112,96,0.08)" stroke="rgba(122,112,96,0.2)" strokeWidth={1} />
        <text x={410} y={153} fontFamily="Bravura, serif" fontSize={24} fill={NAT_C} textAnchor="middle">&#x266E;</text>
        <text x={410} y={170} fontFamily={F} fontSize={10} fill={NAT_C} textAnchor="middle" fontWeight="600">Natural (♮)</text>
        <text x={410} y={182} fontFamily={F} fontSize={9} fill={NAT_C} textAnchor="middle">Cancels sharp or flat</text>
      </svg>
    </div>
  )
}

// ── Lesson 6: Half Steps and Whole Steps ──────────────────────────────────
export function StepsDiagram() {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 480 220" width="100%" style={{ maxWidth: 480, display: 'block', margin: '0 auto' }}>

        {/* === HALF STEP: E to F === */}
        <text x={20} y={22} fontFamily={F} fontSize={11} fill={DARK} fontWeight="600">Half Step — no key between</text>

        {/* Show C–E range, highlight E and F */}
        <PianoOctave ox={20} oy={30}
          states={{ E: 'a', F: 'b' }}
          labels={{ C: 'C', D: 'D', E: 'E', F: 'F', G: 'G' }}
        />

        {/* Bracket under E and F */}
        <line x1={20 + WHITE_X['E'] * WK_W + 1} y1={30 + WK_H + 6} x2={20 + WHITE_X['F'] * WK_W + WK_W - 1} y2={30 + WK_H + 6}
          stroke={ACCENT} strokeWidth={1.5} />
        <line x1={20 + WHITE_X['E'] * WK_W + 1} y1={30 + WK_H + 3} x2={20 + WHITE_X['E'] * WK_W + 1} y2={30 + WK_H + 9}
          stroke={ACCENT} strokeWidth={1.5} />
        <line x1={20 + WHITE_X['F'] * WK_W + WK_W - 1} y1={30 + WK_H + 3} x2={20 + WHITE_X['F'] * WK_W + WK_W - 1} y2={30 + WK_H + 9}
          stroke={ACCENT} strokeWidth={1.5} />
        <text x={20 + (WHITE_X['E'] + WHITE_X['F'] + 1) * WK_W / 2} y={30 + WK_H + 22}
          fontFamily={F} fontSize={10} fill={ACCENT} textAnchor="middle">½ step — adjacent keys</text>

        {/* Note: B→C is also a half step */}
        <text x={20} y={30 + WK_H + 40} fontFamily={F} fontSize={10} fill={GREY}>Also: B → C is a half step (no black key between them)</text>

        {/* === WHOLE STEP: C to D === */}
        <text x={260} y={22} fontFamily={F} fontSize={11} fill={DARK} fontWeight="600">Whole Step — one key between</text>

        <PianoOctave ox={260} oy={30}
          states={{ C: 'a', D: 'b', 'C#': 'dim' }}
          labels={{ C: 'C', D: 'D', E: 'E', 'C#': '(skip)' }}
        />

        {/* Bracket under C and D */}
        <line x1={260 + 1} y1={30 + WK_H + 6} x2={260 + WHITE_X['D'] * WK_W + WK_W - 1} y2={30 + WK_H + 6}
          stroke={HIGHLIGHT_B} strokeWidth={1.5} />
        <line x1={260 + 1} y1={30 + WK_H + 3} x2={260 + 1} y2={30 + WK_H + 9}
          stroke={HIGHLIGHT_B} strokeWidth={1.5} />
        <line x1={260 + WHITE_X['D'] * WK_W + WK_W - 1} y1={30 + WK_H + 3} x2={260 + WHITE_X['D'] * WK_W + WK_W - 1} y2={30 + WK_H + 9}
          stroke={HIGHLIGHT_B} strokeWidth={1.5} />
        <text x={260 + (WHITE_X['D'] + 1) * WK_W / 2} y={30 + WK_H + 22}
          fontFamily={F} fontSize={10} fill={HIGHLIGHT_B} textAnchor="middle">whole step = 2 half steps</text>

        {/* Summary box */}
        <rect x={20} y={158} width={440} height={50} rx={10}
          fill="rgba(186,117,23,0.07)" stroke="rgba(186,117,23,0.2)" strokeWidth={1} />
        <text x={240} y={178} fontFamily={F} fontSize={11} fill={DARK} textAnchor="middle">
          Half step (H) = 1 key apart
        </text>
        <text x={240} y={196} fontFamily={F} fontSize={11} fill={DARK} textAnchor="middle">
          Whole step (W) = 2 half steps = 1 key skipped
        </text>
      </svg>
    </div>
  )
}

// ── Lesson 7: Intervals ────────────────────────────────────────────────────
export function IntervalsDiagram() {
  const step = 9
  const sL = 20
  const tTop = 30

  // Draw a mini treble staff section for each interval
  // C5 = pos 3, D5 = pos 2, E5 = pos 1, F5 = pos 0, G5 = pos -1
  // We'll show: unison (skip), 2nd (C-D), 3rd (C-E), 4th (C-F), 5th (C-G)
  const intervals = [
    { label: '2nd', low: 3, high: 2, desc: 'C to D\nLine to space' },
    { label: '3rd', low: 3, high: 1, desc: 'C to E\nSpace to space' },
    { label: '4th', low: 3, high: 0, desc: 'C to F\nLine ↑' },
    { label: '5th', low: 3, high: -1, desc: 'C to G\nLine to line' },
  ]

  const colW = 118

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 490 185" width="100%" style={{ maxWidth: 490, display: 'block', margin: '0 auto' }}>

        {intervals.map((intv, i) => {
          const ox = sL + i * colW

          // Staff lines: pos 0..8 covers F5..E4. We show a partial staff (lines 0–8 only)
          const staffEndX = ox + colW - 16

          return (
            <g key={intv.label}>
              {/* Mini staff */}
              {[0, 2, 4, 6, 8].map(p => (
                <line key={p} x1={ox} y1={tTop + p * step} x2={staffEndX} y2={tTop + p * step}
                  stroke={DARK} strokeWidth={1} />
              ))}
              <line x1={ox} y1={tTop} x2={ox} y2={tTop + 8 * step} stroke={DARK} strokeWidth={1} />
              <line x1={staffEndX} y1={tTop} x2={staffEndX} y2={tTop + 8 * step} stroke={DARK} strokeWidth={1} />

              {/* Treble clef (small) */}
              <text x={ox + 1} y={tTop + 38} fontFamily="Bravura, serif" fontSize={50} fill="#B0ACA4">&#x1D11E;</text>

              {/* Ledger line above staff if needed (G5 at pos -1) */}
              {intv.high === -1 && (
                <line x1={ox + 65 - 12} y1={tTop - step} x2={ox + 65 + 12} y2={tTop - step}
                  stroke={DARK} strokeWidth={1} />
              )}

              {/* Bottom note (C5, pos 3) */}
              <ellipse cx={ox + 50} cy={tTop + intv.low * step} rx={7} ry={4.5} fill={HIGHLIGHT_A} />
              {/* Top note */}
              <ellipse cx={ox + 80} cy={tTop + intv.high * step} rx={7} ry={4.5} fill={HIGHLIGHT_B} />

              {/* Interval number */}
              <text x={ox + colW / 2 - 4} y={tTop + 8 * step + 22}
                fontFamily={SERIF} fontSize={22} fontWeight="400" fill={DARK} textAnchor="middle">
                {intv.label}
              </text>

              {/* Description */}
              {intv.desc.split('\n').map((line, j) => (
                <text key={j} x={ox + colW / 2 - 4} y={tTop + 8 * step + 42 + j * 14}
                  fontFamily={F} fontSize={9} fill={GREY} textAnchor="middle">
                  {line}
                </text>
              ))}
            </g>
          )
        })}

        {/* Rule box */}
        <rect x={sL} y={165} width={440} height={16} rx={6} fill="rgba(186,117,23,0.07)" stroke="rgba(186,117,23,0.2)" strokeWidth={1} />
        <text x={sL + 220} y={177} fontFamily={F} fontSize={9.5} fill={DARK} textAnchor="middle">
          Count interval by including both notes: C(1) D(2) = 2nd · C(1) D(2) E(3) = 3rd
        </text>
      </svg>
    </div>
  )
}
