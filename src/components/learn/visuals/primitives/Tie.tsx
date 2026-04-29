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
  const offset = Math.round(8 * T.scale)
  const arcSign = direction === 'over' ? -1 : 1
  const ctrlY = y + arcSign * offset
  const startY = y + arcSign * Math.round(2 * T.scale)
  const endY = startY
  // Quadratic bezier with control point offset perpendicular for the arc.
  const path = `M ${x1} ${startY} Q ${(x1 + x2) / 2} ${ctrlY}, ${x2} ${endY}`
  return (
    <path
      d={path}
      fill="none"
      stroke={T.ink}
      strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
      strokeLinecap="round"
    />
  )
}
