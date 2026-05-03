import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

export type BarLineVariant =
  | 'normal'
  | 'final'
  | 'doubleThin'
  | 'startRepeat'
  | 'endRepeat'

interface BarLineProps {
  /** Bar-line x position. */
  x: number
  /** Y of the staff's TOP line. */
  staffTop: number
  T: LearnTokens
  variant?: BarLineVariant
}

/**
 * Vertical bar line spanning the staff. Supports normal, final
 * (thin+thick), doubleThin, startRepeat (thick + thin + dots) and
 * endRepeat (dots + thin + thick) variants.
 */
export function BarLine({ x, staffTop, T, variant = 'normal' }: BarLineProps) {
  const top = staffTop
  const bottom = staffTop + 8 * T.step
  const thinStroke = T.staffLineStroke
  const thickStroke = Math.max(thinStroke * 2.5, 3)
  const dotR = Math.max(1.5, Math.round(2 * T.scale + 0.5))
  const dotGap = Math.round(7 * T.scale + 2)
  const lineGap = Math.round(4 * T.scale + 1)

  if (variant === 'final') {
    const gap = Math.max(3, Math.round(3 * T.scale))
    return (
      <g>
        <line
          x1={x - gap} y1={top} x2={x - gap} y2={bottom}
          stroke={T.ink} strokeWidth={thinStroke}
        />
        <rect
          x={x - thickStroke / 2} y={top}
          width={thickStroke} height={bottom - top}
          fill={T.ink}
        />
      </g>
    )
  }

  if (variant === 'doubleThin') {
    const gap = Math.max(3, Math.round(3 * T.scale))
    return (
      <g>
        <line
          x1={x - gap} y1={top} x2={x - gap} y2={bottom}
          stroke={T.ink} strokeWidth={thinStroke}
        />
        <line
          x1={x} y1={top} x2={x} y2={bottom}
          stroke={T.ink} strokeWidth={thinStroke}
        />
      </g>
    )
  }

  if (variant === 'startRepeat') {
    // Layout left → right: thick line, thin line, two dots.
    // The given x is the rightmost dot column; build leftward from there.
    const dotX = x
    const thinX = dotX - dotGap
    const thickX = thinX - lineGap
    const midA = staffTop + 3 * T.step
    const midB = staffTop + 5 * T.step
    return (
      <g>
        <rect
          x={thickX - thickStroke / 2} y={top}
          width={thickStroke} height={bottom - top}
          fill={T.ink}
        />
        <line
          x1={thinX} y1={top} x2={thinX} y2={bottom}
          stroke={T.ink} strokeWidth={thinStroke}
        />
        <circle cx={dotX} cy={midA} r={dotR} fill={T.ink} />
        <circle cx={dotX} cy={midB} r={dotR} fill={T.ink} />
      </g>
    )
  }

  if (variant === 'endRepeat') {
    // Layout left → right: two dots, thin line, thick line.
    // The given x is the rightmost (thick) line column.
    const thickX = x
    const thinX = thickX - lineGap
    const dotX = thinX - dotGap
    const midA = staffTop + 3 * T.step
    const midB = staffTop + 5 * T.step
    return (
      <g>
        <circle cx={dotX} cy={midA} r={dotR} fill={T.ink} />
        <circle cx={dotX} cy={midB} r={dotR} fill={T.ink} />
        <line
          x1={thinX} y1={top} x2={thinX} y2={bottom}
          stroke={T.ink} strokeWidth={thinStroke}
        />
        <rect
          x={thickX - thickStroke / 2} y={top}
          width={thickStroke} height={bottom - top}
          fill={T.ink}
        />
      </g>
    )
  }

  // 'normal'.
  return (
    <line
      x1={x} y1={top} x2={x} y2={bottom}
      stroke={T.ink} strokeWidth={thinStroke}
    />
  )
}
