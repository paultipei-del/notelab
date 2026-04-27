import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface StepBracketProps {
  x1: number
  x2: number
  y: number
  type: 'whole' | 'half'
  T: LearnTokens
  label?: string
}

export function StepBracket({ x1, x2, y, type, T, label }: StepBracketProps) {
  const color = type === 'half' ? T.highlightAccent : T.ink
  const labelText = label ?? (type === 'half' ? 'H' : 'W')
  return (
    <g>
      <path
        d={`M ${x1} ${y - T.bracketTick} L ${x1} ${y} L ${x2} ${y} L ${x2} ${y - T.bracketTick}`}
        fill="none" stroke={color} strokeWidth={1.2}
      />
      <text
        x={(x1 + x2) / 2} y={y + T.labelFontSize + 3}
        fontSize={T.labelFontSize} fontFamily={T.fontLabel}
        fill={color} textAnchor="middle" fontWeight={500}
      >
        {labelText}
      </text>
    </g>
  )
}
