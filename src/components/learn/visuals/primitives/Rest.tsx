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
   * Y of the staff middle line (B4 in treble clef = position 4). The Rest
   * primitive picks the correct vertical anchor per rest type. SMuFL rest
   * glyphs use alphabetic baseline at their convention origin: bottom edge
   * for half/quarter/shorter, top edge for whole rest.
   */
  y: number
  T: LearnTokens
  highlight?: boolean
  onClick?: () => void
}

export function Rest({ value, x, y, T, highlight = false, onClick }: RestProps) {
  const glyph = REST_GLYPHS[value]
  const fill = highlight ? T.highlightAccent : T.ink
  // SMuFL convention: rest glyphs are drawn with their alphabetic baseline
  // at the staff line they attach to.
  //  • restWhole (E4E3): origin at TOP of rect → hangs from "second line
  //    from top" (one step above middle line, position 2).
  //  • restHalf  (E4E4): origin at BOTTOM of rect → sits on middle line
  //    (position 4).
  //  • Quarter / eighth / shorter: Bravura registers these so the glyph
  //    body is vertically centered on the middle line at the alphabetic
  //    baseline, so the y arg (= middle line) is used directly with no dy.
  // The `y` arg is always the middle line; the dy below selects the line.
  const dy = value === 'whole' ? -2 * T.step
    : value === 'half' ? 0
    : Math.round(-T.step * 0.5)
  return (
    <text
      x={x}
      y={y + dy}
      fontSize={T.noteheadFontSize}
      fontFamily={T.fontMusic}
      fill={fill}
      textAnchor="middle"
      dominantBaseline="alphabetic"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: T.hoverTransition }}
    >
      {glyph}
    </text>
  )
}
