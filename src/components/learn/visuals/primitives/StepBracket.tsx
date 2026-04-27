import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface StepBracketProps {
  x1: number
  x2: number
  y: number
  /**
   * Number of semitones the interval spans.
   * 1 = half step (H, coral) — pedagogically marked
   * 2 = whole step (W, ink) — the default
   * 3 = augmented 2nd (A2, coral) — appears in harmonic minor
   * 4+ = numeric label, ink — exotic intervals
   */
  semitones: number
  T: LearnTokens
  /** Override the auto-derived label. */
  label?: string
  dimmed?: boolean
}

function defaultLabel(semitones: number): string {
  if (semitones === 1) return 'H'
  if (semitones === 2) return 'W'
  if (semitones === 3) return 'A2'
  return String(semitones)
}

function defaultColor(semitones: number, T: LearnTokens): string {
  // Half steps and augmented 2nds are pedagogically distinctive — accent both.
  if (semitones === 1 || semitones === 3) return T.highlightAccent
  return T.ink
}

export function StepBracket({ x1, x2, y, semitones, T, label, dimmed = false }: StepBracketProps) {
  const color = dimmed ? T.inkSubtle : defaultColor(semitones, T)
  const labelText = label ?? defaultLabel(semitones)
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
