'use client'

import React from 'react'
import { Staff, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, ledgerLinePositions, midiToPitch } from '@/lib/learn/visuals/pitch'

interface AccidentalsShowcaseProps {
  /** Note letter to apply accidentals to. Default 'A'. */
  letter?: string
  /** Octave for the displayed note. Default 4. */
  octave?: number
  size?: LearnSize
  caption?: string
}

const ACCIDENTAL_KINDS = [
  { acc: '#',  glyph: '\uE262', label: 'sharp',         offset: +1 },
  { acc: 'b',  glyph: '\uE260', label: 'flat',          offset: -1 },
  { acc: 'n',  glyph: '\uE261', label: 'natural',       offset:  0 },
  { acc: '##', glyph: '\uE263', label: 'double sharp',  offset: +2 },
  { acc: 'bb', glyph: '\uE264', label: 'double flat',   offset: -2 },
] as const

export function AccidentalsShowcase({
  letter = 'A',
  octave = 4,
  size = 'inline',
  caption,
}: AccidentalsShowcaseProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  // Base pitch (no accidental) for staff position calc — accidentals don't change
  // which line/space the notehead sits on, only the audible pitch.
  const basePitchStr = `${letter}${octave}`
  const baseParsed = parsePitch(basePitchStr)
  if (!baseParsed) return null

  const baseMidi = baseParsed.midi
  const pos = staffPosition(baseParsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(640 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)
  const staffHeight = 8 * T.step
  const labelHeight = T.smallLabelFontSize + Math.round(10 * T.scale)
  const totalH = staffY + staffHeight + Math.round(48 * T.scale) + labelHeight + margin
  const totalW = staffX + staffWidth + margin

  const noteAreaX = staffX + T.clefReserve + Math.round(20 * T.scale)
  const noteAreaWidth = staffWidth - T.clefReserve - Math.round(20 * T.scale) - margin
  const noteSpacing = noteAreaWidth / ACCIDENTAL_KINDS.length
  const noteXs = ACCIDENTAL_KINDS.map((_, i) => noteAreaX + (i + 0.5) * noteSpacing)
  const noteY = lineY(staffY, 0, T) + pos * T.step
  const ledgers = ledgerLinePositions(pos)
  const labelY = staffY + staffHeight + Math.round(40 * T.scale)
  const accidentalOffset = Math.round(26 * T.scale)

  const handlePlay = async (semitoneOffset: number) => {
    setInteracted(true)
    const midi = baseMidi + semitoneOffset
    flash(midi)
    await play(midiToPitch(midi))
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `Five accidentals applied to ${letter}${octave}`}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />

        {ACCIDENTAL_KINDS.map((kind, i) => {
          const x = noteXs[i]
          const midi = baseMidi + kind.offset
          const isHighlighted = highlightedMidis.includes(midi)
          const fill = isHighlighted ? T.highlightAccent : T.ink
          return (
            <g key={kind.label}>
              {/* Ledger lines for the notehead position */}
              {ledgers.map((lp) => (
                <line
                  key={`ledger-${i}-${lp}`}
                  x1={x - T.ledgerHalfWidth}
                  y1={staffY + lp * T.step}
                  x2={x + T.ledgerHalfWidth}
                  y2={staffY + lp * T.step}
                  stroke={fill}
                  strokeWidth={T.ledgerLineStroke}
                />
              ))}

              {/* Accidental glyph. The double-flat glyph (♭♭) is visually wider
                  than the other accidentals, so its right edge sits closer to
                  the notehead at the same offset — nudge it 1px further left. */}
              <text
                x={x - accidentalOffset - (kind.acc === 'bb' ? 2 : 0)}
                y={noteY}
                fontSize={T.accidentalFontSize}
                fontFamily={T.fontMusic}
                fill={fill}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {kind.glyph}
              </text>

              {/* Whole notehead, clickable. Hit target is a precisely-sized
                  invisible ellipse so hover doesn't bleed beyond the visible
                  glyph (text bounding boxes are much taller than they look). */}
              <g
                role="button"
                aria-label={`${letter}${kind.acc === 'n' ? '' : kind.acc}${octave}, ${kind.label}`}
              >
                <text
                  x={x}
                  y={noteY + T.noteheadDy}
                  fontSize={T.noteheadFontSize}
                  fontFamily={T.fontMusic}
                  fill={fill}
                  textAnchor="middle"
                  dominantBaseline="central"
                  pointerEvents="none"
                >
                  {T.noteheadWholeGlyph}
                </text>
                <ellipse
                  cx={x}
                  cy={noteY}
                  rx={Math.round(T.noteheadHalfHeight * 1.05)}
                  ry={Math.round(T.noteheadHalfHeight * 0.95)}
                  fill="transparent"
                  pointerEvents="all"
                  onClick={() => handlePlay(kind.offset)}
                  onMouseEnter={() => highlight(midi)}
                  onMouseLeave={() => highlight(null)}
                  style={{ cursor: 'pointer' }}
                />
              </g>

              {/* Label below */}
              <text
                x={x}
                y={labelY}
                fontSize={T.smallLabelFontSize}
                fontFamily={T.fontLabel}
                fill={T.inkSubtle}
                textAnchor="middle"
                fontWeight={500}
              >
                {kind.label}
              </text>
            </g>
          )
        })}
      </svg>
      {interacted && !ready && (
        <div style={{
          fontFamily: T.fontLabel,
          fontSize: T.smallLabelFontSize,
          color: T.inkSubtle,
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: 8,
        }}>
          Loading piano samples…
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
