'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface ScaleDegreeTendenciesProps {
  size?: LearnSize
  caption?: string
}

const DEGREES = [
  { num: 1, name: 'Tonic' },
  { num: 2, name: 'Supertonic' },
  { num: 3, name: 'Mediant' },
  { num: 4, name: 'Subdominant' },
  { num: 5, name: 'Dominant' },
  { num: 6, name: 'Submediant' },
  { num: 7, name: 'Leading Tone' },
] as const

interface Tendency {
  from: number
  to: number
  label: string
  /** Stack level: 0 closest to dots, higher = farther above. */
  level: number
}

const TENDENCIES: Tendency[] = [
  { from: 4, to: 5, label: 'subdominant → dominant', level: 0 },
  { from: 5, to: 1, label: 'dominant → tonic', level: 1 },
  { from: 7, to: 1, label: 'leading tone → tonic', level: 2 },
]

export function ScaleDegreeTendencies({
  size = 'inline',
  caption,
}: ScaleDegreeTendenciesProps) {
  const T = tokensFor(size)

  // Generous horizontal slot so functional names below don't crowd.
  const slotWidth = Math.round(110 * T.scale + 20)
  const margin = Math.round(28 * T.scale + 16)
  const dotRadius = Math.round(15 * T.scale)
  const innerWidth = slotWidth * 7
  const totalW = margin * 2 + innerWidth

  // Vertical layout. Arrows stack ABOVE the dots, three levels.
  const arcLevelGap = Math.round(48 * T.scale + 6)
  const arcBaseGap = Math.round(20 * T.scale)
  const arcsTopReserve = arcBaseGap + arcLevelGap * 3 + Math.round(20 * T.scale)
  const dotsY = margin + arcsTopReserve
  const numberLabelGap = Math.round(8 * T.scale)
  const nameLabelGap = Math.round(20 * T.scale)
  const totalH = dotsY + dotRadius + nameLabelGap + Math.round(36 * T.scale) + margin

  const dotX = (oneIndexed: number) => margin + (oneIndexed - 0.5) * slotWidth

  return (
    <figure style={{ margin: '24px auto', width: 'fit-content', maxWidth: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'The seven scale degrees and their resolution tendencies.'}
      >
        {/* Three tendency arcs, stacked at distinct heights */}
        {TENDENCIES.map((t, idx) => {
          const x1 = dotX(t.from)
          const x2 = dotX(t.to)
          const dir = x2 > x1 ? 1 : -1
          // Endpoints sit just above the source/target dots' circumference.
          const endY = dotsY - dotRadius - Math.round(4 * T.scale)
          // Each arc has its own level. Higher level = bigger peak rise.
          const peakY = dotsY - arcBaseGap - arcLevelGap * (t.level + 1)
          // Bezier control point pulls arc up to peak height.
          const ctrlX = (x1 + x2) / 2
          const ctrlY = peakY * 2 - endY
          const arrowHeadHalf = Math.round(6 * T.scale)
          // Arrow head: small triangle at the destination side.
          const tipX = x2 - dir * (dotRadius + Math.round(2 * T.scale))
          const baseX = tipX - dir * arrowHeadHalf * 1.6
          return (
            <g key={`tend-${idx}`}>
              <path
                d={`M ${x1} ${endY} Q ${ctrlX} ${ctrlY} ${tipX} ${endY}`}
                fill="none"
                stroke={T.highlightAccent}
                strokeWidth={1.6}
                strokeLinecap="round"
                opacity={0.9}
              />
              <path
                d={`M ${baseX} ${endY - arrowHeadHalf} L ${tipX} ${endY} L ${baseX} ${endY + arrowHeadHalf} Z`}
                fill={T.highlightAccent}
              />
              {/* Label centered above the peak, tracking the arc's level. */}
              <text
                x={ctrlX}
                y={peakY - 6}
                fontSize={T.smallLabelFontSize + 1}
                fontFamily={T.fontLabel}
                fill={T.highlightAccent}
                fontStyle="italic"
                textAnchor="middle"
              >
                {t.label}
              </text>
            </g>
          )
        })}

        {/* Caret labels above each dot (e.g. "1̂") */}
        {DEGREES.map(d => (
          <text
            key={`hat-${d.num}`}
            x={dotX(d.num)}
            y={dotsY - dotRadius - numberLabelGap}
            fontSize={T.smallLabelFontSize}
            fontFamily={T.fontLabel}
            fill={T.inkSubtle}
            textAnchor="middle"
          >
            {`${d.num}̂`}
          </text>
        ))}

        {/* Dots with degree numbers and functional names */}
        {DEGREES.map(d => {
          const x = dotX(d.num)
          return (
            <g key={`dot-${d.num}`}>
              <circle
                cx={x}
                cy={dotsY}
                r={dotRadius}
                fill={T.bgPaper}
                stroke={T.ink}
                strokeWidth={1.4}
              />
              <text
                x={x}
                y={dotsY}
                fontSize={T.labelFontSize + 2}
                fontFamily={T.fontLabel}
                fill={T.ink}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {d.num}
              </text>
              <text
                x={x}
                y={dotsY + dotRadius + nameLabelGap + T.labelFontSize}
                fontSize={T.labelFontSize}
                fontFamily={T.fontLabel}
                fill={T.inkMuted}
                textAnchor="middle"
              >
                {d.name}
              </text>
            </g>
          )
        })}
      </svg>

      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
