import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'
import {
  parsePitch, staffPosition, ledgerLinePositions,
  type Clef,
} from '@/lib/learn/visuals/pitch'

interface NoteHeadProps {
  pitch: string
  staffTop: number
  x: number
  clef: Clef
  T: LearnTokens
  duration?: 'whole' | 'half' | 'quarter'
  noStem?: boolean
  /** Force stem direction. If omitted, auto-decides based on staff position. */
  stemDirection?: 'up' | 'down'
  /** Suppress the accidental glyph. Used when a parent (e.g. ChordExplorer) renders accidentals in its own column. */
  noAccidental?: boolean
  dimmed?: boolean
  highlight?: boolean
  highlightColor?: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  ariaLabel?: string
}

export function NoteHead({
  pitch, staffTop, x, clef, T,
  duration = 'quarter',
  noStem = false,
  stemDirection,
  noAccidental = false,
  dimmed = false,
  highlight = false,
  highlightColor,
  onMouseEnter, onMouseLeave, onClick, ariaLabel,
}: NoteHeadProps) {
  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const pos = staffPosition(parsed, clef)
  const noteY = staffTop + pos * T.step
  const fill = highlight
    ? (highlightColor ?? T.highlightAccent)
    : (dimmed ? T.inkSubtle : T.ink)

  // Stems-up for notes BELOW middle line (pos > 4), stems-down otherwise.
  // Stems-up attach to RIGHT of notehead, stems-down attach to LEFT.
  const stemUp = stemDirection ? stemDirection === 'up' : pos > 4
  const stemX = stemUp ? x + T.stemXOffset : x - T.stemXOffset
  const stemY2 = stemUp ? noteY - T.stemLength : noteY + T.stemLength

  const glyph = duration === 'whole' ? T.noteheadWholeGlyph
    : duration === 'half' ? T.noteheadHalfGlyph
    : T.noteheadFilledGlyph

  const accGlyph = parsed.accidental === '#' ? T.sharpGlyph
    : parsed.accidental === 'b' ? T.flatGlyph
    : parsed.accidental === 'n' ? T.naturalGlyph
    : null

  const ledgers = ledgerLinePositions(pos)
  const interactive = !!(onClick || onMouseEnter)

  return (
    <g
      role={interactive ? 'button' : undefined}
      aria-label={ariaLabel ?? `${pitch} on ${clef} clef`}
    >
      {ledgers.map(lp => (
        <line
          key={lp}
          x1={x - T.ledgerHalfWidth} y1={staffTop + lp * T.step}
          x2={x + T.ledgerHalfWidth} y2={staffTop + lp * T.step}
          stroke={fill} strokeWidth={T.ledgerLineStroke}
          pointerEvents="none"
        />
      ))}
      {accGlyph && !noAccidental && (
        <text
          x={x - T.accidentalKerning} y={noteY}
          fontSize={T.accidentalFontSize} fontFamily={T.fontMusic}
          fill={fill} textAnchor="middle" dominantBaseline="central"
          pointerEvents="none"
        >
          {accGlyph}
        </text>
      )}
      <text
        x={x} y={noteY + T.noteheadDy}
        fontSize={T.noteheadFontSize} fontFamily={T.fontMusic}
        fill={fill} textAnchor="middle" dominantBaseline="central"
        pointerEvents="none"
      >
        {glyph}
      </text>
      {duration !== 'whole' && !noStem && (
        <line
          x1={stemX} y1={noteY} x2={stemX} y2={stemY2}
          stroke={fill} strokeWidth={T.stemStroke}
          pointerEvents="none"
        />
      )}
      {/* Invisible hit target sized precisely to the visible notehead so
       *  that hover/click only fires when the cursor is over the oval —
       *  SVG text elements have a much taller bounding box than their
       *  visible glyph, which would otherwise leak into adjacent rows. */}
      {interactive && (
        <ellipse
          cx={x}
          cy={noteY}
          rx={Math.round(T.noteheadHalfHeight * 1.05)}
          ry={Math.round(T.noteheadHalfHeight * 0.95)}
          fill="transparent"
          pointerEvents="all"
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          style={{
            cursor: 'pointer',
          }}
        />
      )}
    </g>
  )
}
