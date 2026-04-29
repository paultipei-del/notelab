import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface TieProps {
  /** X of the first note's center. */
  x1: number
  /** X of the second note's center. */
  x2: number
  /** Y at the noteheads' baseline (the tie sits offset above or below). */
  y: number
  /** Curve direction. Default 'over' (curves above the notes). */
  direction?: 'over' | 'under'
  T: LearnTokens
}

export function Tie({ x1, x2, y, direction = 'over', T }: TieProps) {
  const sign = direction === 'over' ? -1 : 1
  const span = Math.abs(x2 - x1)
  // Endpoints sit just inside the noteheads, slightly offset away from the heads.
  const inset = Math.max(2, Math.round(2 * T.scale))
  const sx1 = x1 + inset
  const sx2 = x2 - inset
  const midX = (sx1 + sx2) / 2
  // Outer arc and inner arc — difference creates the tapered "lens" thickness.
  const arc = Math.max(8, Math.round(span * 0.22 + 4 * T.scale))
  const thickness = Math.max(2.2, +(2.6 * T.scale + 1.2).toFixed(2))
  const startY = y
  const outerCY = y + sign * arc
  const innerCY = y + sign * (arc - thickness)
  // Closed path: outer curve out, inner curve back. Filled (no stroke) for a clean lens.
  const d = `M ${sx1} ${startY} Q ${midX} ${outerCY}, ${sx2} ${startY} Q ${midX} ${innerCY}, ${sx1} ${startY} Z`
  return <path d={d} fill={T.ink} stroke="none" />
}
