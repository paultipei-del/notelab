import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface AccentMarkProps {
  /** Center x — the accent's visual center sits exactly at this x. */
  x: number
  /** Center y. */
  y: number
  T: LearnTokens
}

/**
 * Music accent mark (>) drawn as an SVG path so it centers exactly on the
 * given (x, y) — relying on the Bravura font glyph centering produced
 * subtle horizontal drift because SMuFL articulation glyphs aren't
 * always centered within their advance width. A path lets us draw the
 * chevron tightly around the requested center.
 */
export function AccentMark({ x, y, T }: AccentMarkProps) {
  const halfW = Math.round(T.noteheadFontSize * 0.15)
  const halfH = Math.round(T.noteheadFontSize * 0.085)
  const stroke = Math.max(1.0, +(1.2 * T.scale).toFixed(2))
  return (
    <path
      d={`M ${x - halfW} ${y - halfH} L ${x + halfW} ${y} L ${x - halfW} ${y + halfH}`}
      stroke={T.ink}
      strokeWidth={stroke}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    />
  )
}
