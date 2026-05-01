'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface ScaleDegreeTendenciesProps {
  size?: LearnSize
  caption?: string
}

interface DegreePosition {
  col: number
  num: number
  name: string
  tier: 'stable' | 'active'
  resolveTo?: number
  strength?: 'strong' | 'weak'
}

const POSITIONS: DegreePosition[] = [
  { col: 1, num: 1, name: 'Tonic',        tier: 'stable' },
  { col: 2, num: 2, name: 'Supertonic',   tier: 'active', resolveTo: 1, strength: 'weak' },
  { col: 3, num: 3, name: 'Mediant',      tier: 'stable' },
  { col: 4, num: 4, name: 'Subdominant',  tier: 'active', resolveTo: 3, strength: 'weak' },
  { col: 5, num: 5, name: 'Dominant',     tier: 'stable' },
  { col: 6, num: 6, name: 'Submediant',   tier: 'active', resolveTo: 5, strength: 'weak' },
  { col: 7, num: 7, name: 'Leading Tone', tier: 'active', resolveTo: 8, strength: 'strong' },
  { col: 8, num: 1, name: 'Tonic',        tier: 'stable' },
]

export function ScaleDegreeTendencies({
  size = 'inline',
  caption,
}: ScaleDegreeTendenciesProps) {
  const T = tokensFor(size)

  const numberFontSize = 24
  const nameFontSize = 14
  const annotationFontSize = 14
  const nameLineHeight = nameFontSize + 3

  const slotWidth = 90
  const labelMargin = 60
  const rightMargin = 24
  const dotRadius = 24
  const innerWidth = slotWidth * 8
  const totalW = labelMargin + innerWidth + rightMargin

  const topPad = 32
  const caretY = topPad
  const stableY = caretY + 50
  const tierGap = 96
  const activeY = stableY + tierGap
  const nameGap = 18
  const nameY = activeY + dotRadius + nameGap + nameFontSize
  const totalH = nameY + nameLineHeight + 20

  const dotX = (col: number) => labelMargin + (col - 0.5) * slotWidth

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'The seven scale degrees split into stable (1, 3, 5) and active (2, 4, 6, 7) tiers, with arrows showing how active tones resolve to stable ones.'}
      >
        {/* Subtle dashed rail through the stable tier — visually anchors "home" */}
        <line
          x1={dotX(1)}
          y1={stableY}
          x2={dotX(8)}
          y2={stableY}
          stroke={T.inkSubtle}
          strokeWidth={0.8}
          strokeDasharray="2 5"
          opacity={0.45}
        />

        {/* Tier labels on the left */}
        <text
          x={labelMargin - Math.round(20 * T.scale + 8)}
          y={stableY}
          fontSize={annotationFontSize}
          fontFamily={T.fontLabel}
          fill={T.inkMuted}
          textAnchor="end"
          dominantBaseline="central"
          fontStyle="italic"
        >
          stable
        </text>
        <text
          x={labelMargin - Math.round(20 * T.scale + 8)}
          y={activeY}
          fontSize={annotationFontSize}
          fontFamily={T.fontLabel}
          fill={T.inkMuted}
          textAnchor="end"
          dominantBaseline="central"
          fontStyle="italic"
        >
          active
        </text>

        {/* Caret labels at the top, one per column */}
        {POSITIONS.map((p, idx) => (
          <text
            key={`hat-${idx}`}
            x={dotX(p.col)}
            y={caretY}
            fontSize={annotationFontSize}
            fontFamily={T.fontLabel}
            fill={T.inkSubtle}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {`${p.num}̂`}
          </text>
        ))}

        {/* Resolution arrows from active → stable */}
        {POSITIONS.filter(p => p.resolveTo).map((p, idx) => {
          const x1 = dotX(p.col)
          const x2 = dotX(p.resolveTo!)
          const dx = x2 - x1
          const dy = stableY - activeY
          const len = Math.sqrt(dx * dx + dy * dy)
          const ux = dx / len
          const uy = dy / len
          const offset = Math.round(3 * T.scale)
          const startX = x1 + ux * (dotRadius + offset)
          const startY = activeY + uy * (dotRadius + offset)
          const tipX = x2 - ux * (dotRadius + offset)
          const tipY = stableY - uy * (dotRadius + offset)

          const headHalf = Math.round(5 * T.scale + 1)
          const headLen = headHalf * 1.9
          const baseX = tipX - ux * headLen
          const baseY = tipY - uy * headLen
          const px = -uy
          const py = ux
          const leftX = baseX + px * headHalf
          const leftY = baseY + py * headHalf
          const rightX = baseX - px * headHalf
          const rightY = baseY - py * headHalf

          const isStrong = p.strength === 'strong'
          const arrowColor = isStrong ? T.highlightAccent : T.inkSubtle
          const arrowOpacity = isStrong ? 0.92 : 0.55
          const arrowWidth = isStrong ? 2 : 1.3
          const dashArray = isStrong ? undefined : '3 3'

          return (
            <g key={`arrow-${idx}`}>
              <line
                x1={startX}
                y1={startY}
                x2={baseX}
                y2={baseY}
                stroke={arrowColor}
                strokeWidth={arrowWidth}
                strokeLinecap="round"
                strokeDasharray={dashArray}
                opacity={arrowOpacity}
              />
              <polygon
                points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
                fill={arrowColor}
                opacity={arrowOpacity}
              />
            </g>
          )
        })}

        {/* Dots — stable tier filled with accent, active tier outlined */}
        {POSITIONS.map((p, idx) => {
          const x = dotX(p.col)
          const y = p.tier === 'stable' ? stableY : activeY
          const isStable = p.tier === 'stable'
          return (
            <g key={`dot-${idx}`}>
              <circle
                cx={x}
                cy={y}
                r={dotRadius}
                fill={isStable ? T.highlightAccent : T.bgPaper}
                stroke={isStable ? T.highlightAccent : T.ink}
                strokeWidth={1.4}
              />
              <text
                x={x}
                y={y}
                fontSize={numberFontSize}
                fontFamily={T.fontLabel}
                fill={isStable ? T.bgPaper : T.ink}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {p.num}
              </text>
              {p.name.split(' ').map((line, lineIdx) => (
                <text
                  key={`name-${idx}-${lineIdx}`}
                  x={x}
                  y={nameY + lineIdx * nameLineHeight}
                  fontSize={nameFontSize}
                  fontFamily={T.fontLabel}
                  fill={T.inkMuted}
                  textAnchor="middle"
                >
                  {line}
                </text>
              ))}
            </g>
          )
        })}
      </svg>

      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
