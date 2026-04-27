import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface ScaleDegreeLabelProps {
  x: number
  y: number
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  T: LearnTokens
  variant?: 'caret' | 'roman' | 'plain'
  highlight?: boolean
}

const ROMAN: Record<number, string> = {
  1: 'I', 2: 'ii', 3: 'iii', 4: 'IV', 5: 'V', 6: 'vi', 7: 'vii\u00b0', 8: 'I',
}

export function ScaleDegreeLabel({
  x, y, degree, T,
  variant = 'caret', highlight = false,
}: ScaleDegreeLabelProps) {
  const text = variant === 'caret' ? `${degree}\u0302`
    : variant === 'roman' ? ROMAN[degree]
    : String(degree)
  return (
    <text
      x={x} y={y}
      fontSize={T.labelFontSize}
      fontFamily={T.fontLabel}
      fill={highlight ? T.highlightAccent : T.inkMuted}
      textAnchor="middle"
      fontWeight={500}
    >
      {text}
    </text>
  )
}
