import React from 'react'
import { lineY, type LearnTokens } from '@/lib/learn/visuals/tokens'
import type { Clef } from '@/lib/learn/visuals/pitch'

interface StaffProps {
  clef?: Clef | 'grand'
  x: number
  y: number
  width: number
  showClef?: boolean
  T: LearnTokens
  children?: React.ReactNode
}

export function Staff({
  clef = 'treble', x, y, width, showClef = true, T, children,
}: StaffProps) {
  if (clef === 'grand') {
    const trebleTop = y
    const bassTop = y + 8 * T.step + Math.round(80 * T.scale)
    const braceHeight = bassTop + 8 * T.step - trebleTop
    return (
      <g>
        <line
          x1={x - 8} y1={trebleTop}
          x2={x - 8} y2={bassTop + 8 * T.step}
          stroke={T.ink} strokeWidth={T.graceLineStroke}
        />
        <text
          x={x - 16} y={bassTop + 8 * T.step}
          fontSize={braceHeight} fontFamily={T.fontMusic}
          fill={T.ink} textAnchor="middle" dominantBaseline="auto"
        >
          {T.braceGlyph}
        </text>
        <SingleStaff x={x} y={trebleTop} width={width} clef="treble" showClef={showClef} T={T} />
        <SingleStaff x={x} y={bassTop} width={width} clef="bass" showClef={showClef} T={T} />
        {children}
      </g>
    )
  }
  return (
    <g>
      <SingleStaff x={x} y={y} width={width} clef={clef} showClef={showClef} T={T} />
      {children}
    </g>
  )
}

interface SingleStaffProps {
  x: number; y: number; width: number; clef: Clef; showClef: boolean; T: LearnTokens
}

function SingleStaff({ x, y, width, clef, showClef, T }: SingleStaffProps) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map(i => (
        <line
          key={i}
          x1={x} y1={lineY(y, i, T)}
          x2={x + width} y2={lineY(y, i, T)}
          stroke={T.staffLineColor} strokeWidth={T.staffLineStroke}
        />
      ))}
      {showClef && clef === 'treble' && (
        <text
          x={x + 8} y={lineY(y, 3, T)}
          fontSize={T.trebleClefFontSize} fontFamily={T.fontMusic}
          fill={T.ink} dominantBaseline="auto"
        >
          {T.trebleClefGlyph}
        </text>
      )}
      {showClef && clef === 'bass' && (
        <text
          x={x + 8} y={lineY(y, 1, T) + T.bassClefYOffset}
          fontSize={T.bassClefFontSize} fontFamily={T.fontMusic}
          fill={T.ink} dominantBaseline="auto"
        >
          {T.bassClefGlyph}
        </text>
      )}
    </g>
  )
}
