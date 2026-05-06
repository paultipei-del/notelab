import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

export type TextLabelVariant = 'italic' | 'bold' | 'regular' | 'small-caps'
export type TextLabelSize = 'small' | 'normal' | 'large'
export type TextLabelColor = 'ink' | 'inkSubtle' | 'inkMuted' | 'accent'
export type TextLabelAnchor = 'start' | 'middle' | 'end'

interface TextLabelProps {
  x: number
  y: number
  text: string
  /** 'italic' (default), 'bold', 'regular', or 'small-caps'. */
  variant?: TextLabelVariant
  /** Font scale: 'small' < 'normal' (default) < 'large'. */
  size?: TextLabelSize
  /** 'ink' (default), 'inkMuted', 'inkSubtle', or 'accent'. */
  color?: TextLabelColor
  /** SVG text-anchor. Default 'middle'. */
  anchor?: TextLabelAnchor
  onClick?: () => void
  T: LearnTokens
}

/**
 * Reusable italic/regular/bold/small-caps text label at a staff position.
 * Replaces the open-coded `<text fontStyle="italic" fontFamily={T.fontLabel} …>`
 * idiom that recurs across the visuals tree.
 *
 * Future PRs should migrate inline italic-text patterns to this primitive
 * (search for `fontStyle="italic"` / `fontStyle: 'italic'` callsites).
 */
export function TextLabel({
  x,
  y,
  text,
  variant = 'italic',
  size = 'normal',
  color = 'ink',
  anchor = 'middle',
  onClick,
  T,
}: TextLabelProps) {
  const fontSize =
    size === 'small' ? T.smallLabelFontSize :
    size === 'large' ? T.labelFontSize + 4 :
    T.labelFontSize

  const fill =
    color === 'inkSubtle' ? T.inkSubtle :
    color === 'inkMuted' ? T.inkMuted :
    color === 'accent' ? T.highlightAccent :
    T.ink

  const fontStyle = variant === 'italic' ? 'italic' : 'normal'
  const fontWeight = variant === 'bold' ? 600 : 400
  const fontVariant = variant === 'small-caps' ? 'small-caps' : 'normal'
  const letterSpacing = variant === 'small-caps' ? '0.08em' : undefined

  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fontFamily={T.fontLabel}
      fontStyle={fontStyle}
      fontWeight={fontWeight}
      fontVariant={fontVariant}
      letterSpacing={letterSpacing}
      fill={fill}
      textAnchor={anchor}
      dominantBaseline="central"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer', transition: T.hoverTransition } : undefined}
    >
      {text}
    </text>
  )
}
