'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface PitchClassClockProps {
  size?: LearnSize
  /** Pitch classes to highlight in coral. Accepts either spelling: e.g. 'C#' or 'Db'. */
  highlightedPitchClasses?: string[]
  /** Show only sharp names ('C#'), flat names ('Db'), or both stacked. Default 'sharp'. */
  spelling?: 'sharp' | 'flat' | 'both'
  caption?: string
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

function toUnicode(name: string): string {
  return name.replace('#', '\u266F').replace('b', '\u266D')
}

export function PitchClassClock({
  size = 'inline',
  highlightedPitchClasses = [],
  spelling = 'sharp',
  caption,
}: PitchClassClockProps) {
  const T = tokensFor(size)

  // Normalize highlight inputs (either spelling) to indices 0..11
  const highlights = new Set<number>()
  for (const h of highlightedPitchClasses) {
    const sIdx = SHARP_NAMES.indexOf(h)
    const fIdx = FLAT_NAMES.indexOf(h)
    const idx = sIdx >= 0 ? sIdx : fIdx
    if (idx >= 0) highlights.add(idx)
  }

  const margin = Math.round(28 * T.scale + 8)
  const radius = Math.round(120 * T.scale)
  const labelOffset = Math.round(24 * T.scale)
  const labelRadius = radius + labelOffset
  const center = labelRadius + margin
  const totalSize = (labelRadius + margin) * 2

  const tickInner = radius - Math.round(5 * T.scale)
  const tickOuter = radius + Math.round(2 * T.scale)
  const tickStroke = Math.max(1, T.staffLineStroke)

  // C at top (12 o'clock) → angle = -π/2; advance clockwise (positive y is down in SVG)
  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 12

  const fontSize = size === 'small' ? 13 : size === 'hero' ? 22 : 16
  const dualFontSize = size === 'small' ? 10 : size === 'hero' ? 15 : 12

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalSize, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalSize, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Pitch class clock — twelve pitch classes arranged in a circle'}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={T.staffLineColor}
          strokeWidth={T.staffLineStroke}
        />

        {Array.from({ length: 12 }, (_, i) => {
          const a = angleAt(i)
          const x1 = center + tickInner * Math.cos(a)
          const y1 = center + tickInner * Math.sin(a)
          const x2 = center + tickOuter * Math.cos(a)
          const y2 = center + tickOuter * Math.sin(a)
          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={T.staffLineColor}
              strokeWidth={tickStroke}
            />
          )
        })}

        {Array.from({ length: 12 }, (_, i) => {
          const a = angleAt(i)
          const x = center + labelRadius * Math.cos(a)
          const y = center + labelRadius * Math.sin(a)
          const isHighlighted = highlights.has(i)
          const fill = isHighlighted ? T.highlightAccent : T.ink
          const fontWeight = isHighlighted ? 600 : 400
          const sharpDisplay = toUnicode(SHARP_NAMES[i])
          const flatDisplay = toUnicode(FLAT_NAMES[i])
          const sameName = SHARP_NAMES[i] === FLAT_NAMES[i]

          if (spelling === 'both' && !sameName) {
            return (
              <g key={`label-${i}`} fontFamily={T.fontLabel}>
                <text
                  x={x}
                  y={y - dualFontSize * 0.55}
                  fontSize={dualFontSize}
                  fill={fill}
                  fontWeight={fontWeight}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {sharpDisplay}
                </text>
                <text
                  x={x}
                  y={y + dualFontSize * 0.55}
                  fontSize={dualFontSize}
                  fill={fill}
                  fontWeight={fontWeight}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {flatDisplay}
                </text>
              </g>
            )
          }

          const display = spelling === 'flat' ? flatDisplay : sharpDisplay
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              fontSize={fontSize}
              fontFamily={T.fontLabel}
              fill={fill}
              fontWeight={fontWeight}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {display}
            </text>
          )
        })}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
