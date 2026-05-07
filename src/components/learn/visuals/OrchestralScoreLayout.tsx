import React from 'react'
import { Caption } from './primitives/Caption'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

export type InstrumentFamily =
  | 'woodwinds' | 'brass' | 'percussion' | 'strings' | 'voices' | 'keyboard'

export type InstrumentClef = 'treble' | 'bass' | 'alto' | 'tenor' | 'percussion'

export interface InstrumentRow {
  name: string
  family: InstrumentFamily
  /** Italic supporting line beneath the instrument name. */
  sublabel?: string
  /** Coral border + slight tint. */
  highlighted?: boolean
  /** Which clef this instrument actually uses. Default 'treble'. */
  clef?: InstrumentClef
}

interface OrchestralScoreLayoutProps {
  rows?: InstrumentRow[]
  caption?: string
  size?: LearnSize
}

const FAMILY_FILL: Record<InstrumentFamily, string> = {
  woodwinds:  '#F5E8D5',
  brass:      '#FAECE7',
  percussion: '#EFEAE0',
  strings:    '#FDFAF3',
  voices:     '#F4F0E0',
  keyboard:   '#F4F0E0',
}

const FAMILY_LABEL: Record<InstrumentFamily, string> = {
  woodwinds:  'Woodwinds',
  brass:      'Brass',
  percussion: 'Percussion',
  strings:    'Strings',
  voices:     'Voices',
  keyboard:   'Keyboard',
}

const DEFAULT_ROWS: InstrumentRow[] = [
  { name: 'Flutes',       family: 'woodwinds', clef: 'treble' },
  { name: 'Oboes',        family: 'woodwinds', clef: 'treble' },
  { name: 'Clarinets',    family: 'woodwinds', sublabel: 'in B♭', clef: 'treble' },
  { name: 'Bassoons',     family: 'woodwinds', clef: 'bass' },
  { name: 'Horns',        family: 'brass',     sublabel: 'in F', clef: 'treble' },
  { name: 'Trumpets',     family: 'brass',     sublabel: 'in B♭', clef: 'treble' },
  { name: 'Trombones',    family: 'brass',     clef: 'bass' },
  { name: 'Tuba',         family: 'brass',     clef: 'bass' },
  { name: 'Timpani',      family: 'percussion', clef: 'bass' },
  { name: 'Percussion',   family: 'percussion', clef: 'percussion' },
  { name: 'Violin I',     family: 'strings',   clef: 'treble' },
  { name: 'Violin II',    family: 'strings',   clef: 'treble' },
  { name: 'Viola',        family: 'strings',   clef: 'alto' },
  { name: 'Cello',        family: 'strings',   clef: 'bass' },
  { name: 'Double Bass',  family: 'strings',   clef: 'bass' },
]

/**
 * Stylized orchestral score layout — labeled rectangles grouped by
 * instrument family, with family brackets to the left of each group.
 * Pure SVG/CSS, NOT real notation.
 */
export function OrchestralScoreLayout({
  rows = DEFAULT_ROWS,
  caption,
  size = 'inline',
}: OrchestralScoreLayoutProps) {
  const T = tokensFor(size)

  const rowH = Math.round(36 * T.scale + 12)
  const rowGap = 3
  const labelColW = Math.round(120 * T.scale + 22)
  const bracketColW = Math.round(28 * T.scale + 8)
  const stafflineColW = Math.round(480 * T.scale + 80)
  const clefSlotW = Math.round(20 * T.scale + 12)
  const padX = 20
  const padY = 22
  const totalW = padX * 2 + bracketColW + labelColW + stafflineColW
  const totalH = padY * 2 + rows.length * rowH + (rows.length - 1) * rowGap

  // Compute per-family row ranges so we can draw a bracket spanning each.
  const families: Array<{ family: InstrumentFamily; startIdx: number; endIdx: number }> = []
  rows.forEach((r, i) => {
    const last = families[families.length - 1]
    if (last && last.family === r.family) last.endIdx = i
    else families.push({ family: r.family, startIdx: i, endIdx: i })
  })

  const yOf = (i: number) => padY + i * (rowH + rowGap)
  const bracketX = padX + bracketColW * 0.6
  const labelX = padX + bracketColW + 4
  const stafflineX = padX + bracketColW + labelColW
  const familyLabelX = bracketX - 6

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Orchestral score layout diagram'}
      >
        {/* Per-row tinted rectangles. */}
        {rows.map((r, i) => {
          const y = yOf(i)
          const isHighlighted = r.highlighted
          return (
            <g key={`row-${i}`}>
              <rect
                x={labelX - 4} y={y}
                width={labelColW + stafflineColW}
                height={rowH}
                fill={FAMILY_FILL[r.family]}
                stroke={isHighlighted ? T.highlightAccent : 'transparent'}
                strokeWidth={isHighlighted ? 1.4 : 0}
                rx={2}
              />
              {/* Stylized staff lines — five thin horizontal rules. */}
              {[0, 1, 2, 3, 4].map(li => {
                const lineY = y + 8 + (li * (rowH - 16)) / 4
                return (
                  <line
                    key={`sl-${i}-${li}`}
                    x1={stafflineX + clefSlotW}
                    x2={stafflineX + stafflineColW - 14}
                    y1={lineY} y2={lineY}
                    stroke="rgba(26,26,24,0.42)" strokeWidth={0.8}
                  />
                )
              })}
              {/* Real per-instrument clef glyph, sized to the small staff. */}
              {(() => {
                const clef = r.clef ?? 'treble'
                const staffTopY = y + 8
                const staffSpace = (rowH - 16) / 4
                const clefFontSize = staffSpace * 4.2
                const clefX = stafflineX + 6
                if (clef === 'percussion') {
                  // Two short vertical bars, ~half-staff tall — standard
                  // percussion-clef placeholder; doesn't need pitch anchoring.
                  const top = staffTopY + staffSpace * 0.6
                  const bot = staffTopY + staffSpace * 3.4
                  return (
                    <g key={`clef-${i}`}>
                      <line x1={clefX + 3} y1={top} x2={clefX + 3} y2={bot} stroke="#1A1A18" strokeWidth={1.6} />
                      <line x1={clefX + 7} y1={top} x2={clefX + 7} y2={bot} stroke="#1A1A18" strokeWidth={1.6} />
                    </g>
                  )
                }
                const glyph = clef === 'bass' ? ''
                  : clef === 'alto' || clef === 'tenor' ? ''
                  : ''
                // Baseline line index from the top of the 5-line staff:
                //   treble (G clef): centred on G4 = line 3 (4th from top)
                //   bass   (F clef): F3 dots on line 1 (2nd from top)
                //   alto   (C clef): centred on middle line = 2
                //   tenor  (C clef): centred on 4th line from bottom = 1
                const lineIdx = clef === 'treble' ? 3
                  : clef === 'bass'   ? 1
                  : clef === 'alto'   ? 2
                  : 1   // tenor
                const baselineY = staffTopY + lineIdx * staffSpace
                return (
                  <text
                    key={`clef-${i}`}
                    x={clefX}
                    y={baselineY}
                    fontSize={clefFontSize}
                    fontFamily={T.fontMusic}
                    fill="#1A1A18"
                    dominantBaseline="auto"
                  >{glyph}</text>
                )
              })()}
              {/* Instrument name. */}
              <text
                x={labelX}
                y={r.sublabel ? y + rowH * 0.38 : y + rowH * 0.55}
                fontSize={Math.round(T.labelFontSize + 3)}
                fontFamily={T.fontDisplay}
                fontWeight={500}
                fill={isHighlighted ? T.highlightAccent : T.ink}
                dominantBaseline="central"
              >{r.name}</text>
              {r.sublabel && (
                <text
                  x={labelX}
                  y={y + rowH * 0.72}
                  fontSize={Math.round(T.smallLabelFontSize + 1)}
                  fontFamily={T.fontLabel}
                  fontStyle="italic"
                  fill={T.inkSubtle}
                  dominantBaseline="central"
                >{r.sublabel}</text>
              )}
            </g>
          )
        })}

        {/* Family brackets + family-name labels (rotated 90° to fit). */}
        {families.map((f, fi) => {
          const yTop = yOf(f.startIdx) + 2
          const yBot = yOf(f.endIdx) + rowH - 2
          const yMid = (yTop + yBot) / 2
          return (
            <g key={`fam-${fi}`}>
              {/* Bracket: vertical line + small horizontal end-ticks. */}
              <line
                x1={bracketX} y1={yTop}
                x2={bracketX} y2={yBot}
                stroke={T.ink} strokeWidth={1.2}
              />
              <line
                x1={bracketX} y1={yTop}
                x2={bracketX + 4} y2={yTop}
                stroke={T.ink} strokeWidth={1.2}
              />
              <line
                x1={bracketX} y1={yBot}
                x2={bracketX + 4} y2={yBot}
                stroke={T.ink} strokeWidth={1.2}
              />
              {/* Family-name label on the left, rotated 90° CCW. */}
              <text
                x={familyLabelX}
                y={yMid}
                fontSize={Math.round(T.smallLabelFontSize + 2)}
                fontFamily={T.fontLabel}
                fontWeight={500}
                fill={T.inkMuted}
                textAnchor="middle"
                dominantBaseline="central"
                letterSpacing="0.18em"
                transform={`rotate(-90, ${familyLabelX}, ${yMid})`}
              >{FAMILY_LABEL[f.family].toUpperCase()}</text>
            </g>
          )
        })}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
