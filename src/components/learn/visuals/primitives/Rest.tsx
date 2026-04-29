import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

export type RestValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirty-second'

const REST_GLYPHS: Record<RestValue, string> = {
  whole:          '\uE4E3',
  half:           '\uE4E4',
  quarter:        '\uE4E5',
  eighth:         '\uE4E6',
  sixteenth:      '\uE4E7',
  'thirty-second': '\uE4E8',
}

interface RestProps {
  value: RestValue
  x: number
  /**
   * Y reference point. For rests on a 5-line staff the convention is to pass
   * `staffY + 2 * T.step` (the middle line). Whole rests hang from the line
   * above; half rests sit on the line; quarter and shorter rests center
   * vertically on the middle.
   */
  y: number
  T: LearnTokens
  highlight?: boolean
  onClick?: () => void
}

export function Rest({ value, x, y, T, highlight = false, onClick }: RestProps) {
  const glyph = REST_GLYPHS[value]
  const fill = highlight ? T.highlightAccent : T.ink
  // Whole rest hangs below the line above; half rest sits on top of the line.
  // Both visually offset slightly so the glyph lands where notation expects.
  const dy = value === 'whole' ? -T.step * 0.5
    : value === 'half' ? -T.step * 0.5
    : 0
  return (
    <text
      x={x}
      y={y + dy}
      fontSize={T.noteheadFontSize}
      fontFamily={T.fontMusic}
      fill={fill}
      textAnchor="middle"
      dominantBaseline="central"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: T.hoverTransition }}
    >
      {glyph}
    </text>
  )
}
