'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface RestValueHierarchyProps {
  size?: LearnSize
  caption?: string
}

const ROWS: Array<{ value: string; glyph: string; label: string; fraction: string; isWhole?: boolean; isHalf?: boolean }> = [
  { value: 'whole',          glyph: '\uE4E3', label: 'whole rest',          fraction: '1',    isWhole: true },
  { value: 'half',           glyph: '\uE4E4', label: 'half rest',           fraction: '1/2',  isHalf: true },
  { value: 'quarter',        glyph: '\uE4E5', label: 'quarter rest',        fraction: '1/4' },
  { value: 'eighth',         glyph: '\uE4E6', label: 'eighth rest',         fraction: '1/8' },
  { value: 'sixteenth',      glyph: '\uE4E7', label: 'sixteenth rest',      fraction: '1/16' },
  { value: 'thirty-second',  glyph: '\uE4E8', label: 'thirty-second rest',  fraction: '1/32' },
]

export function RestValueHierarchy({ size = 'inline', caption }: RestValueHierarchyProps) {
  const T = tokensFor(size)
  const margin = Math.round(20 * T.scale + 8)
  const rowHeight = Math.round(56 * T.scale)
  const glyphColX = Math.round(60 * T.scale)
  const labelColX = Math.round(140 * T.scale)
  const fractionColX = Math.round(360 * T.scale)
  const dividerX = Math.round(110 * T.scale)
  const width = Math.round(440 * T.scale)
  const totalW = width + 2 * margin
  const totalH = ROWS.length * rowHeight + 2 * margin

  // Each rest glyph centers vertically on a "staff middle line" reference at rowMid.
  // Whole and half rests have different vertical offsets relative to that line.
  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Rest value hierarchy'}
      >
        {ROWS.map((row, i) => {
          const rowTop = margin + i * rowHeight
          const rowMid = rowTop + rowHeight / 2
          const dy = row.isWhole ? -Math.round(8 * T.scale)
            : row.isHalf ? -Math.round(4 * T.scale)
            : 0
          return (
            <g key={row.value}>
              {/* Row hairline (skip first) */}
              {i > 0 && (
                <line
                  x1={margin}
                  y1={rowTop}
                  x2={margin + width}
                  y2={rowTop}
                  stroke={'#DDD8CA'}
                  strokeWidth={1}
                />
              )}
              {/* Glyph */}
              <text
                x={margin + glyphColX}
                y={rowMid + dy}
                fontSize={Math.round(T.noteheadFontSize * 0.95)}
                fontFamily={T.fontMusic}
                fill={T.ink}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {row.glyph}
              </text>
              {/* Label */}
              <text
                x={margin + labelColX}
                y={rowMid}
                fontSize={Math.round(T.labelFontSize * 1.2)}
                fontFamily={'var(--font-cormorant), serif'}
                fill={T.ink}
                dominantBaseline="central"
                fontWeight={500}
              >
                {row.label}
              </text>
              {/* Fraction */}
              <text
                x={margin + fractionColX}
                y={rowMid}
                fontSize={Math.round(T.labelFontSize * 1.2)}
                fontFamily={T.fontLabel}
                fill={T.highlightAccent}
                textAnchor="end"
                dominantBaseline="central"
                fontWeight={500}
              >
                {row.fraction}
              </text>
            </g>
          )
        })}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
