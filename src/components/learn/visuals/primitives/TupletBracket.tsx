import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface TupletBracketProps {
  /** X of the leftmost note in the group. */
  x1: number
  /** X of the rightmost note in the group. */
  x2: number
  /** Y of the bracket's horizontal line. */
  y: number
  /** The tuplet number (3 = triplet, 5 = quintuplet, etc.). */
  number: number
  T: LearnTokens
}

/**
 * Inverted-U bracket above (or below) a tuplet group with the tuplet number
 * centered in a small gap in the bracket. Used for visually marking tuplets
 * — beams alone aren't enough when the count is irregular.
 */
export function TupletBracket({ x1, x2, y, number, T }: TupletBracketProps) {
  const tickLen = Math.round(6 * T.scale)
  const stroke = Math.max(1, Math.round(1.2 * T.scale))
  const labelFontSize = T.labelFontSize
  const midX = (x1 + x2) / 2
  const labelHalfWidth = Math.round(labelFontSize * 0.55)
  return (
    <g>
      {/* Left tick */}
      <line x1={x1} y1={y} x2={x1} y2={y + tickLen} stroke={T.ink} strokeWidth={stroke} />
      {/* Horizontal — broken in the middle for the number label */}
      <line x1={x1} y1={y} x2={midX - labelHalfWidth} y2={y} stroke={T.ink} strokeWidth={stroke} />
      <line x1={midX + labelHalfWidth} y1={y} x2={x2} y2={y} stroke={T.ink} strokeWidth={stroke} />
      {/* Right tick */}
      <line x1={x2} y1={y} x2={x2} y2={y + tickLen} stroke={T.ink} strokeWidth={stroke} />
      {/* Number label */}
      <text
        x={midX}
        y={y}
        fontSize={labelFontSize}
        fontFamily={T.fontLabel}
        fill={T.ink}
        textAnchor="middle"
        dominantBaseline="central"
        fontWeight={500}
        fontStyle="italic"
      >
        {number}
      </text>
    </g>
  )
}
