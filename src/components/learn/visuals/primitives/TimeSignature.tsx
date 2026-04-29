import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface TimeSignatureProps {
  numerator: number
  denominator: number
  /** X position (typically just after the clef). */
  x: number
  /** Y of the staff's TOP line. */
  staffTop: number
  T: LearnTokens
}

/**
 * Bravura digit codepoints for time-signature characters.
 * Tall variants of digits 0-9 sized to span half the staff height.
 */
const TIMESIG_DIGIT_BASE = 0xE080

function digitGlyph(d: number): string {
  return String.fromCodePoint(TIMESIG_DIGIT_BASE + d)
}

function numberToGlyphs(n: number): string {
  return String(n).split('').map(c => digitGlyph(parseInt(c, 10))).join('')
}

export function TimeSignature({ numerator, denominator, x, staffTop, T }: TimeSignatureProps) {
  const numY = staffTop + T.step * 2
  const denY = staffTop + T.step * 6
  const fontSize = Math.round(T.noteheadFontSize * 1.05)
  return (
    <g aria-label={`Time signature ${numerator} over ${denominator}`}>
      <text
        x={x}
        y={numY}
        fontSize={fontSize}
        fontFamily={T.fontMusic}
        fill={T.ink}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {numberToGlyphs(numerator)}
      </text>
      <text
        x={x}
        y={denY}
        fontSize={fontSize}
        fontFamily={T.fontMusic}
        fill={T.ink}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {numberToGlyphs(denominator)}
      </text>
    </g>
  )
}
