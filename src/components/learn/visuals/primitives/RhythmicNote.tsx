import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

export type RhythmicValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'

const NOTEHEAD_GLYPH: Record<RhythmicValue, string> = {
  whole:     '\uE0A2',
  half:      '\uE0A3',
  quarter:   '\uE0A4',
  eighth:    '\uE0A4',
  sixteenth: '\uE0A4',
}

const FLAG_UP_8 = '\uE240'
const FLAG_UP_16 = '\uE242'
const FLAG_DOWN_8 = '\uE241'
const FLAG_DOWN_16 = '\uE243'
const AUGMENTATION_DOT = '\uE1E7'

interface RhythmicNoteProps {
  value: RhythmicValue
  x: number
  /** Y for the notehead center. */
  y: number
  T: LearnTokens
  /** Override stem direction. Default 'up'. */
  stemDirection?: 'up' | 'down'
  /** If part of a beamed group, suppress the flag. Default false. */
  noFlag?: boolean
  /** Suppress the stem (e.g. when a parent beam draws all stems). Default false. */
  noStem?: boolean
  highlight?: boolean
  highlightColor?: string
  onClick?: () => void
  /** Add an augmentation dot to the right of the notehead. */
  dotted?: boolean
  ariaLabel?: string
}

export function RhythmicNote({
  value,
  x,
  y,
  T,
  stemDirection = 'up',
  noFlag = false,
  noStem = false,
  highlight = false,
  highlightColor,
  onClick,
  dotted = false,
  ariaLabel,
}: RhythmicNoteProps) {
  const fill = highlight ? (highlightColor ?? T.highlightAccent) : T.ink
  const noteheadGlyph = NOTEHEAD_GLYPH[value]
  const hasStem = value !== 'whole' && !noStem
  const stemUp = stemDirection === 'up'
  const stemX = stemUp ? x + T.stemXOffset : x - T.stemXOffset
  const stemY1 = y
  const stemLength = T.stemLength
  const stemY2 = stemUp ? y - stemLength : y + stemLength

  const flagGlyph = (value === 'eighth' || value === 'sixteenth') && !noFlag && hasStem
    ? (stemUp
      ? (value === 'eighth' ? FLAG_UP_8 : FLAG_UP_16)
      : (value === 'eighth' ? FLAG_DOWN_8 : FLAG_DOWN_16))
    : null

  const dotX = x + Math.round(T.noteheadFontSize * 0.32)
  const dotY = y - Math.round(3 * T.scale)

  return (
    <g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: T.hoverTransition }}
      role={onClick ? 'button' : undefined}
      aria-label={ariaLabel}
    >
      <text
        x={x}
        y={y + T.noteheadDy}
        fontSize={T.noteheadFontSize}
        fontFamily={T.fontMusic}
        fill={fill}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {noteheadGlyph}
      </text>
      {hasStem && (
        <line
          x1={stemX}
          y1={stemY1}
          x2={stemX}
          y2={stemY2}
          stroke={fill}
          strokeWidth={T.stemStroke}
        />
      )}
      {flagGlyph && (
        <text
          x={stemX - 0.5}
          y={stemUp ? stemY2 : stemY2 + Math.round(10 * T.scale)}
          fontSize={Math.round(T.noteheadFontSize * 0.9)}
          fontFamily={T.fontMusic}
          fill={fill}
          textAnchor="start"
          dominantBaseline="auto"
        >
          {flagGlyph}
        </text>
      )}
      {dotted && (
        <text
          x={dotX}
          y={dotY}
          fontSize={T.noteheadFontSize}
          fontFamily={T.fontMusic}
          fill={fill}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {AUGMENTATION_DOT}
        </text>
      )}
    </g>
  )
}
