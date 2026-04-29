import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface BeatNumberProps {
  /** Centered on this x — typically a notehead's x. */
  x: number
  /** Top of the staff. The label sits a fixed distance below the bottom line. */
  staffTop: number
  /** Beat label text — usually "1", "2", "3", "4", or words like "and". */
  label: string | number
  T: LearnTokens
  /** Override fill color. Default subtle ink. */
  color?: string
}

/**
 * Beat-number text label below the staff — the in-house replacement for OSMD's
 * `<lyric>` rendering on rhythm reference pages. Larger than a generic label
 * so beat counts read clearly under the noteheads.
 */
export function BeatNumber({ x, staffTop, label, T, color }: BeatNumberProps) {
  const fontSize = Math.round(T.labelFontSize * 1.55)
  const y = staffTop + 8 * T.step + Math.round(34 * T.scale)
  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fontFamily={T.fontLabel}
      fill={color ?? T.ink}
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight={600}
    >
      {label}
    </text>
  )
}
