import React from 'react'
import { Caption } from './primitives/Caption'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

export type InstrumentFamily =
  | 'woodwinds' | 'brass' | 'percussion' | 'strings' | 'voices' | 'keyboard'

export interface InstrumentRow {
  name: string
  family: InstrumentFamily
  /** Italic supporting line beneath the instrument name. */
  sublabel?: string
  /** Coral border + slight tint. */
  highlighted?: boolean
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
  { name: 'Flutes',       family: 'woodwinds' },
  { name: 'Oboes',        family: 'woodwinds' },
  { name: 'Clarinets',    family: 'woodwinds', sublabel: 'in B♭' },
  { name: 'Bassoons',     family: 'woodwinds' },
  { name: 'Horns',        family: 'brass',     sublabel: 'in F' },
  { name: 'Trumpets',     family: 'brass',     sublabel: 'in B♭' },
  { name: 'Trombones',    family: 'brass' },
  { name: 'Tuba',         family: 'brass' },
  { name: 'Timpani',      family: 'percussion' },
  { name: 'Percussion',   family: 'percussion' },
  { name: 'Violin I',     family: 'strings' },
  { name: 'Violin II',    family: 'strings' },
  { name: 'Viola',        family: 'strings' },
  { name: 'Cello',        family: 'strings' },
  { name: 'Double Bass',  family: 'strings' },
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

  const rowH = Math.round(28 * T.scale + 6)
  const rowGap = 2
  const labelColW = Math.round(100 * T.scale + 16)
  const bracketColW = Math.round(20 * T.scale + 4)
  const stafflineColW = Math.round(420 * T.scale + 60)
  const padX = 16
  const padY = 16
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
              {/* Stylized "staff lines" — five thin horizontal rules. */}
              {[0, 1, 2, 3, 4].map(li => {
                const lineY = y + 6 + (li * (rowH - 12)) / 4
                return (
                  <line
                    key={`sl-${i}-${li}`}
                    x1={stafflineX + 8}
                    x2={stafflineX + stafflineColW - 12}
                    y1={lineY} y2={lineY}
                    stroke="rgba(30,30,28,0.3)" strokeWidth={0.6}
                  />
                )
              })}
              {/* Instrument name. */}
              <text
                x={labelX}
                y={r.sublabel ? y + rowH * 0.4 : y + rowH * 0.55}
                fontSize={Math.round(T.labelFontSize + 1)}
                fontFamily={T.fontDisplay}
                fontWeight={500}
                fill={isHighlighted ? T.highlightAccent : T.ink}
                dominantBaseline="central"
              >{r.name}</text>
              {r.sublabel && (
                <text
                  x={labelX}
                  y={y + rowH * 0.74}
                  fontSize={T.smallLabelFontSize}
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
                fontSize={T.smallLabelFontSize}
                fontFamily={T.fontLabel}
                fill={T.inkSubtle}
                textAnchor="middle"
                dominantBaseline="central"
                letterSpacing="0.16em"
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
