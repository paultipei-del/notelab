'use client'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#B0ACA4'
const ACCENT = '#BA7517'
const MAJ_C = '#2A5C0A'
const MIN_C = '#3B6DB5'
const STROKE_W = 1.2

// Draw a note oval on a mini staff (no stem)
function MiniNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return <ellipse cx={cx} cy={cy} rx={7} ry={4.5} fill={color} />
}

// Draw 5 staff lines for a mini staff section
function MiniStaff({ x1, x2, top, step }: { x1: number; x2: number; top: number; step: number }) {
  return (
    <>
      {[0, 2, 4, 6, 8].map(p => (
        <line key={p} x1={x1} y1={top + p * step} x2={x2} y2={top + p * step}
          stroke={DARK} strokeWidth={STROKE_W} />
      ))}
    </>
  )
}

// Step label between two notes
function StepLabel({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <text x={x} y={y} fontFamily={F} fontSize={10} fill={color} textAnchor="middle" fontWeight="600">
      {label}
    </text>
  )
}

// ── Lesson 8: Major Five-Finger Patterns ──────────────────────────────────
export function MajorPatternDiagram() {
  const step = 9
  const sL = 25
  const sR = 490
  const tTop = 30
  const noteColor = MAJ_C

  // C major pattern: C5(3), D5(2), E5(1), F5(0), G5(-1) — but these are above staff
  // Better to use C4, D4, E4, F4, G4 in treble:
  // C4=10, D4=9, E4=8, F4=7, G4=6 (treble positions)
  const patternPos = [10, 9, 8, 7, 6]  // C4, D4, E4, F4, G4
  const patternNames = ['C', 'D', 'E', 'F', 'G']
  const steps = ['W', 'W', 'H', 'W']
  const stepColors = ['#2A5C0A', '#2A5C0A', '#B5402A', '#2A5C0A']
  const noteSpacing = 78
  const startX = sL + 52

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 520 230" width="100%" style={{ maxWidth: 520, display: 'block', margin: '0 auto' }}>

        {/* Title */}
        <text x={sL} y={18} fontFamily={F} fontSize={11} fill={MAJ_C} fontWeight="600">
          C Major Five-Finger Pattern — W W H W
        </text>

        {/* Staff */}
        <MiniStaff x1={sL} x2={sR} top={tTop} step={step} />
        <line x1={sL} y1={tTop} x2={sL} y2={tTop + 8 * step} stroke={DARK} strokeWidth={STROKE_W} />
        <line x1={sR} y1={tTop} x2={sR} y2={tTop + 8 * step} stroke={DARK} strokeWidth={2.5} />

        {/* Treble clef */}
        <text x={sL + 2} y={tTop + 42} fontFamily="Bravura, serif" fontSize={55} fill={DARK}>&#x1D11E;</text>

        {/* C4 ledger lines */}
        <line x1={startX - 12} y1={tTop + 10 * step} x2={startX + 12} y2={tTop + 10 * step}
          stroke={DARK} strokeWidth={STROKE_W} />

        {/* Notes */}
        {patternPos.map((pos, i) => {
          const cx = startX + i * noteSpacing
          const cy = tTop + pos * step
          return (
            <g key={i}>
              <MiniNote cx={cx} cy={cy} color={noteColor} />
              <text x={cx} y={cy - 14} fontFamily={F} fontSize={10} fill={noteColor} textAnchor="middle" fontWeight="600">
                {patternNames[i]}
              </text>
            </g>
          )
        })}

        {/* Step labels between notes */}
        {steps.map((s, i) => {
          const x1 = startX + i * noteSpacing
          const x2 = startX + (i + 1) * noteSpacing
          const midX = (x1 + x2) / 2
          const y1 = tTop + patternPos[i] * step
          const y2 = tTop + patternPos[i + 1] * step
          const midY = (y1 + y2) / 2 + (tTop + 8 * step - Math.max(y1, y2)) * 0.5

          return (
            <g key={i}>
              {/* Connector line */}
              <line x1={x1 + 8} y1={y1} x2={x2 - 8} y2={y2}
                stroke={stepColors[i]} strokeWidth={1} strokeDasharray="4 2" opacity={0.6} />
              {/* Step label bubble */}
              <rect x={midX - 9} y={tTop + 8 * step + 14} width={18} height={16} rx={8}
                fill={s === 'H' ? 'rgba(181,64,42,0.12)' : 'rgba(42,92,10,0.12)'}
                stroke={stepColors[i]} strokeWidth={1} />
              <text x={midX} y={tTop + 8 * step + 26}
                fontFamily={F} fontSize={10} fill={stepColors[i]} textAnchor="middle" fontWeight="700">
                {s}
              </text>
            </g>
          )
        })}

        {/* Triad */}
        <text x={sL} y={tTop + 8 * step + 55} fontFamily={F} fontSize={11} fill={DARK} fontWeight="600">
          C Major Triad (root, 3rd, 5th):
        </text>
        {[0, 2, 4].map((noteIdx, i) => {
          const pos = patternPos[noteIdx]
          const cx = startX + noteIdx * noteSpacing
          return (
            <g key={i}>
              <ellipse cx={130 + i * 28} cy={tTop + 8 * step + 75} rx={7} ry={4.5} fill={noteColor} />
              <text x={130 + i * 28} y={tTop + 8 * step + 90}
                fontFamily={F} fontSize={10} fill={noteColor} textAnchor="middle">
                {patternNames[noteIdx]}
              </text>
            </g>
          )
        })}
        <text x={200} y={tTop + 8 * step + 80} fontFamily={F} fontSize={10} fill={GREY}>
          — C E G
        </text>

        {/* All 4 major patterns summary */}
        <rect x={sL} y={tTop + 8 * step + 100} width={sR - sL} height={50} rx={10}
          fill="rgba(42,92,10,0.06)" stroke="rgba(42,92,10,0.2)" strokeWidth={1} />
        {[
          { key: 'C', notes: 'C D E F G', triad: 'C–E–G' },
          { key: 'F', notes: 'F G A B♭ C', triad: 'F–A–C' },
          { key: 'G', notes: 'G A B C D', triad: 'G–B–D' },
          { key: 'D', notes: 'D E F♯ G A', triad: 'D–F♯–A' },
        ].map((p, i) => (
          <g key={p.key}>
            <text x={sL + 12 + i * 116} y={tTop + 8 * step + 120}
              fontFamily={F} fontSize={10} fill={MAJ_C} fontWeight="600">{p.key} major</text>
            <text x={sL + 12 + i * 116} y={tTop + 8 * step + 134}
              fontFamily={F} fontSize={9} fill={DARK}>{p.notes}</text>
            <text x={sL + 12 + i * 116} y={tTop + 8 * step + 146}
              fontFamily={F} fontSize={9} fill={GREY}>triad: {p.triad}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Lesson 9: Minor Five-Finger Patterns ──────────────────────────────────
export function MinorPatternDiagram() {
  const step = 9
  const sL = 25
  const sR = 490
  const tTop = 30
  const noteColor = MIN_C

  // c minor: C4(10), D4(9), Eb4(8), F4(7), G4(6)
  // Eb4 sits at E4's position with a flat
  const patternPos = [10, 9, 8, 7, 6]
  const patternNames = ['C', 'D', 'E♭', 'F', 'G']
  const steps = ['W', 'H', 'W', 'W']
  const stepColors = ['#2A5C0A', '#B5402A', '#2A5C0A', '#2A5C0A']
  const noteSpacing = 78
  const startX = sL + 52

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 520 230" width="100%" style={{ maxWidth: 520, display: 'block', margin: '0 auto' }}>

        <text x={sL} y={18} fontFamily={F} fontSize={11} fill={MIN_C} fontWeight="600">
          c minor Five-Finger Pattern — W H W W  (♭3rd)
        </text>

        <MiniStaff x1={sL} x2={sR} top={tTop} step={step} />
        <line x1={sL} y1={tTop} x2={sL} y2={tTop + 8 * step} stroke={DARK} strokeWidth={STROKE_W} />
        <line x1={sR} y1={tTop} x2={sR} y2={tTop + 8 * step} stroke={DARK} strokeWidth={2.5} />
        <text x={sL + 2} y={tTop + 42} fontFamily="Bravura, serif" fontSize={55} fill={DARK}>&#x1D11E;</text>

        {/* C4 ledger */}
        <line x1={startX - 12} y1={tTop + 10 * step} x2={startX + 12} y2={tTop + 10 * step}
          stroke={DARK} strokeWidth={STROKE_W} />

        {patternPos.map((pos, i) => {
          const cx = startX + i * noteSpacing
          const cy = tTop + pos * step
          const isFlat = patternNames[i] === 'E♭'
          return (
            <g key={i}>
              {isFlat && (
                <text x={cx - 14} y={cy + 4} fontFamily="Bravura, serif" fontSize={16} fill={MIN_C}>&#x266D;</text>
              )}
              <MiniNote cx={cx} cy={cy} color={noteColor} />
              <text x={cx} y={cy - 14} fontFamily={F} fontSize={10} fill={noteColor} textAnchor="middle" fontWeight="600">
                {patternNames[i]}
              </text>
            </g>
          )
        })}

        {steps.map((s, i) => {
          const x1 = startX + i * noteSpacing
          const x2 = startX + (i + 1) * noteSpacing
          const midX = (x1 + x2) / 2

          return (
            <g key={i}>
              <rect x={midX - 9} y={tTop + 8 * step + 14} width={18} height={16} rx={8}
                fill={s === 'H' ? 'rgba(181,64,42,0.14)' : 'rgba(59,109,181,0.12)'}
                stroke={stepColors[i]} strokeWidth={1} />
              <text x={midX} y={tTop + 8 * step + 26}
                fontFamily={F} fontSize={10} fill={stepColors[i]} textAnchor="middle" fontWeight="700">
                {s}
              </text>
            </g>
          )
        })}

        {/* Comparison box */}
        <rect x={sL} y={tTop + 8 * step + 48} width={sR - sL} height={38} rx={10}
          fill="rgba(59,109,181,0.06)" stroke="rgba(59,109,181,0.2)" strokeWidth={1} />
        <text x={sL + 10} y={tTop + 8 * step + 64} fontFamily={F} fontSize={10} fill={MAJ_C}>
          C Major: C D E F G  (W W H W)
        </text>
        <text x={sL + 10} y={tTop + 8 * step + 80} fontFamily={F} fontSize={10} fill={MIN_C}>
          c minor:  C D E♭ F G  (W H W W) — the 3rd is lowered by one half step
        </text>

        {/* All 4 minor patterns summary */}
        <rect x={sL} y={tTop + 8 * step + 96} width={sR - sL} height={50} rx={10}
          fill="rgba(59,109,181,0.06)" stroke="rgba(59,109,181,0.2)" strokeWidth={1} />
        {[
          { key: 'c', notes: 'C D E♭ F G', triad: 'C–E♭–G' },
          { key: 'f', notes: 'F G A♭ B♭ C', triad: 'F–A♭–C' },
          { key: 'g', notes: 'G A B♭ C D', triad: 'G–B♭–D' },
          { key: 'd', notes: 'D E F G A', triad: 'D–F–A' },
        ].map((p, i) => (
          <g key={p.key}>
            <text x={sL + 12 + i * 116} y={tTop + 8 * step + 116}
              fontFamily={F} fontSize={10} fill={MIN_C} fontWeight="600">{p.key} minor</text>
            <text x={sL + 12 + i * 116} y={tTop + 8 * step + 130}
              fontFamily={F} fontSize={9} fill={DARK}>{p.notes}</text>
            <text x={sL + 12 + i * 116} y={tTop + 8 * step + 142}
              fontFamily={F} fontSize={9} fill={GREY}>triad: {p.triad}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Lesson 10: Key Signatures ─────────────────────────────────────────────
export function KeySignatureDiagram() {
  const step = 8
  const sTop = 30
  const colW = 155
  const sL = 20
  const sEnd = 110

  const keySigs = [
    { name: 'C major', label: 'No sharps or flats', sharps: [], flats: [], accent: '#7A7060' },
    { name: 'G major', label: '1 sharp: F♯', sharps: [{ name: 'F♯', pos: 0 }], flats: [], accent: MAJ_C },
    { name: 'F major', label: '1 flat: B♭', sharps: [], flats: [{ name: 'B♭', pos: 4 }], accent: '#3B6DB5' },
  ]

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 490 175" width="100%" style={{ maxWidth: 490, display: 'block', margin: '0 auto' }}>

        {keySigs.map((ks, ki) => {
          const ox = sL + ki * colW

          return (
            <g key={ks.name}>
              {/* Staff */}
              {[0, 2, 4, 6, 8].map(p => (
                <line key={p} x1={ox} y1={sTop + p * step} x2={ox + sEnd} y2={sTop + p * step}
                  stroke={DARK} strokeWidth={STROKE_W} />
              ))}
              <line x1={ox} y1={sTop} x2={ox} y2={sTop + 8 * step} stroke={DARK} strokeWidth={STROKE_W} />
              <line x1={ox + sEnd} y1={sTop} x2={ox + sEnd} y2={sTop + 8 * step} stroke={DARK} strokeWidth={1.5} />

              {/* Treble clef */}
              <text x={ox + 1} y={sTop + 36} fontFamily="Bravura, serif" fontSize={50} fill={DARK}>&#x1D11E;</text>

              {/* Sharp accidentals in key sig */}
              {ks.sharps.map((acc, ai) => (
                <text key={ai} x={ox + 42 + ai * 10} y={sTop + acc.pos * step + 5}
                  fontFamily="Bravura, serif" fontSize={16} fill={ks.accent}>&#x266F;</text>
              ))}

              {/* Flat accidentals in key sig */}
              {ks.flats.map((acc, ai) => (
                <text key={ai} x={ox + 42 + ai * 10} y={sTop + acc.pos * step + 8}
                  fontFamily="Bravura, serif" fontSize={18} fill={ks.accent}>&#x266D;</text>
              ))}

              {/* Label */}
              <text x={ox + sEnd / 2} y={sTop + 8 * step + 20}
                fontFamily={SERIF} fontSize={15} fontWeight="400" fill={DARK} textAnchor="middle">
                {ks.name}
              </text>
              <text x={ox + sEnd / 2} y={sTop + 8 * step + 35}
                fontFamily={F} fontSize={10} fill={ks.accent} textAnchor="middle">
                {ks.label}
              </text>
            </g>
          )
        })}

        {/* Summary rule */}
        <rect x={sL} y={145} width={450} height={24} rx={8}
          fill="rgba(186,117,23,0.08)" stroke="rgba(186,117,23,0.2)" strokeWidth={1} />
        <text x={sL + 225} y={161} fontFamily={F} fontSize={10} fill={DARK} textAnchor="middle">
          Key signature appears right after the clef — its accidentals apply to the entire piece
        </text>
      </svg>
    </div>
  )
}

// ── Lesson 11: Major Scales ────────────────────────────────────────────────
export function MajorScaleDiagram() {
  const step = 9
  const sL = 25
  const sR = 500
  const tTop = 30

  // C major scale on treble: C4(10), D4(9), E4(8), F4(7), G4(6), A4(5), B4(4), C5(3)
  const scalePos = [10, 9, 8, 7, 6, 5, 4, 3]
  const scaleNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']
  const scaleSteps = ['W', 'W', 'H', 'W', 'W', 'W', 'H']
  const stepColor = (s: string) => s === 'H' ? '#B5402A' : MAJ_C
  const noteSpacing = 56
  const startX = sL + 52

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 530 190" width="100%" style={{ maxWidth: 530, display: 'block', margin: '0 auto' }}>

        <text x={sL} y={18} fontFamily={F} fontSize={11} fill={DARK} fontWeight="600">
          C Major Scale — pattern: W W H W W W H
        </text>

        <MiniStaff x1={sL} x2={sR} top={tTop} step={step} />
        <line x1={sL} y1={tTop} x2={sL} y2={tTop + 8 * step} stroke={DARK} strokeWidth={STROKE_W} />
        <line x1={sR} y1={tTop} x2={sR} y2={tTop + 8 * step} stroke={DARK} strokeWidth={2.5} />
        <text x={sL + 2} y={tTop + 42} fontFamily="Bravura, serif" fontSize={55} fill={DARK}>&#x1D11E;</text>

        {/* Ledger line for C4 */}
        <line x1={startX - 12} y1={tTop + 10 * step} x2={startX + 12} y2={tTop + 10 * step}
          stroke={DARK} strokeWidth={STROKE_W} />

        {scalePos.map((pos, i) => {
          const cx = startX + i * noteSpacing
          const cy = tTop + pos * step
          const color = i === 0 || i === 7 ? ACCENT : DARK

          return (
            <g key={i}>
              <ellipse cx={cx} cy={cy} rx={7} ry={4.5} fill={color} />
              <text x={cx} y={cy - 13} fontFamily={F} fontSize={10} fill={color} textAnchor="middle" fontWeight="600">
                {scaleNames[i]}
              </text>
              {/* Scale degree number */}
              <text x={cx} y={tTop + 8 * step + 20}
                fontFamily={F} fontSize={9} fill={GREY} textAnchor="middle">{i + 1}</text>
            </g>
          )
        })}

        {/* Step labels */}
        {scaleSteps.map((s, i) => {
          const midX = startX + i * noteSpacing + noteSpacing / 2
          return (
            <g key={i}>
              <rect x={midX - 8} y={tTop + 8 * step + 28} width={16} height={14} rx={7}
                fill={s === 'H' ? 'rgba(181,64,42,0.12)' : 'rgba(42,92,10,0.10)'}
                stroke={stepColor(s)} strokeWidth={1} />
              <text x={midX} y={tTop + 8 * step + 39}
                fontFamily={F} fontSize={9} fill={stepColor(s)} textAnchor="middle" fontWeight="700">{s}</text>
            </g>
          )
        })}

        {/* G and F major summaries */}
        <rect x={sL} y={tTop + 8 * step + 54} width={(sR - sL) * 0.48} height={40} rx={8}
          fill="rgba(42,92,10,0.07)" stroke="rgba(42,92,10,0.2)" strokeWidth={1} />
        <text x={sL + 10} y={tTop + 8 * step + 70} fontFamily={F} fontSize={10} fill={MAJ_C} fontWeight="600">G major:</text>
        <text x={sL + 10} y={tTop + 8 * step + 84} fontFamily={F} fontSize={10} fill={DARK}>G A B C D E F♯ G</text>

        <rect x={sR - (sR - sL) * 0.48} y={tTop + 8 * step + 54} width={(sR - sL) * 0.48} height={40} rx={8}
          fill="rgba(59,109,181,0.07)" stroke="rgba(59,109,181,0.2)" strokeWidth={1} />
        <text x={sR - (sR - sL) * 0.48 + 10} y={tTop + 8 * step + 70} fontFamily={F} fontSize={10} fill={'#3B6DB5'} fontWeight="600">F major:</text>
        <text x={sR - (sR - sL) * 0.48 + 10} y={tTop + 8 * step + 84} fontFamily={F} fontSize={10} fill={DARK}>F G A B♭ C D E F</text>
      </svg>
    </div>
  )
}

// ── Lesson 12: Time Signatures ────────────────────────────────────────────
export function TimeSignatureDiagram() {
  const col1 = 20
  const col2 = 220

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 490 260" width="100%" style={{ maxWidth: 490, display: 'block', margin: '0 auto' }}>

        {/* Time signature anatomy */}
        <text x={col1} y={22} fontFamily={F} fontSize={11} fill={DARK} fontWeight="600">Time Signature</text>

        {/* Draw 4/4 large */}
        <text x={col1 + 10} y={82} fontFamily="Bravura, serif" fontSize={72} fill={DARK}>𝄴</text>

        <line x1={col1 + 62} y1={30} x2={col1 + 62} y2={110} stroke={GREY} strokeWidth={0.8} strokeDasharray="3 2" />
        <text x={col1 + 70} y={55} fontFamily={F} fontSize={10} fill={DARK}>Top number = beats per measure</text>
        <line x1={col1 + 62} y1={68} x2={col1 + 68} y2={65} stroke={GREY} strokeWidth={0.8} />
        <text x={col1 + 70} y={90} fontFamily={F} fontSize={10} fill={DARK}>Bottom number = which note gets 1 beat</text>
        <text x={col1 + 70} y={104} fontFamily={F} fontSize={10} fill={GREY}>(4 = quarter note)</text>

        {/* Common time signatures */}
        <rect x={col1} y={122} width={185} height={48} rx={8} fill="rgba(186,117,23,0.07)" stroke="rgba(186,117,23,0.2)" strokeWidth={1} />
        <text x={col1 + 10} y={140} fontFamily={F} fontSize={10} fill={DARK} fontWeight="600">Common time signatures:</text>
        <text x={col1 + 10} y={156} fontFamily={F} fontSize={10} fill={DARK}>4/4 — 4 quarter-note beats</text>
        <text x={col1 + 10} y={168} fontFamily={F} fontSize={10} fill={DARK}>3/4 — 3 quarter-note beats · 2/4 — 2 beats</text>

        {/* Note value chart */}
        <text x={col2} y={22} fontFamily={F} fontSize={11} fill={DARK} fontWeight="600">Note Values (quarter note = 1 beat)</text>

        {[
          { label: 'Whole note', beats: '4 beats', shape: 'open-oval', y: 55 },
          { label: 'Half note', beats: '2 beats', shape: 'open-stem', y: 95 },
          { label: 'Quarter note', beats: '1 beat', shape: 'filled-stem', y: 135 },
          { label: 'Eighth note', beats: '½ beat', shape: 'flag', y: 175 },
        ].map(({ label, beats, shape, y }) => {
          const nx = col2 + 25  // note x center
          const ny = y

          return (
            <g key={label}>
              {/* Note glyph */}
              {shape === 'open-oval' && (
                <ellipse cx={nx} cy={ny} rx={9} ry={6} fill="none" stroke={DARK} strokeWidth={1.5} />
              )}
              {shape === 'open-stem' && (
                <>
                  <ellipse cx={nx} cy={ny} rx={8} ry={5.5} fill="none" stroke={DARK} strokeWidth={1.5} />
                  <line x1={nx + 7} y1={ny} x2={nx + 7} y2={ny - 26} stroke={DARK} strokeWidth={1.5} />
                </>
              )}
              {shape === 'filled-stem' && (
                <>
                  <ellipse cx={nx} cy={ny} rx={8} ry={5.5} fill={DARK} />
                  <line x1={nx + 7} y1={ny} x2={nx + 7} y2={ny - 26} stroke={DARK} strokeWidth={1.5} />
                </>
              )}
              {shape === 'flag' && (
                <>
                  <ellipse cx={nx} cy={ny} rx={8} ry={5.5} fill={DARK} />
                  <line x1={nx + 7} y1={ny} x2={nx + 7} y2={ny - 26} stroke={DARK} strokeWidth={1.5} />
                  <path d={`M ${nx + 7} ${ny - 26} C ${nx + 22} ${ny - 20} ${nx + 22} ${ny - 10} ${nx + 7} ${ny - 8}`}
                    fill="none" stroke={DARK} strokeWidth={1.5} />
                </>
              )}
              {/* Label */}
              <text x={col2 + 50} y={ny + 4} fontFamily={F} fontSize={11} fill={DARK}>{label}</text>
              <text x={col2 + 170} y={ny + 4} fontFamily={F} fontSize={11} fill={ACCENT} fontWeight="600">{beats}</text>
            </g>
          )
        })}

        {/* Rest note at bottom */}
        <text x={col2} y={225} fontFamily={F} fontSize={10} fill={GREY}>
          Rests: whole rest (hangs down) · half rest (sits up) · quarter rest
        </text>
      </svg>
    </div>
  )
}

// ── Review: Patterns (compare major vs minor) ─────────────────────────────
export function ReviewPatternsDiagram() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.08em', textTransform: 'uppercase', color: MAJ_C, marginBottom: '8px' }}>
          Major — W W H W
        </p>
        <MajorPatternDiagram />
      </div>
      <div>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.08em', textTransform: 'uppercase', color: MIN_C, marginBottom: '8px' }}>
          Minor — W H W W
        </p>
        <MinorPatternDiagram />
      </div>
    </div>
  )
}
