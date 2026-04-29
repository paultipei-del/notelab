'use client'

import React from 'react'
import { Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, midiToPitch } from '@/lib/learn/visuals/pitch'

type ExtendedClef = 'treble' | 'alto' | 'tenor' | 'bass'

interface MultiClefDisplayProps {
  /** Which clefs to show, in order. Default ['treble', 'alto', 'tenor', 'bass']. */
  clefs?: ExtendedClef[]
  /** Pitch to render on each staff. Default 'C4' (middle C). */
  pitch?: string
  /** Show the notehead (and ledger lines) on each staff. Default true. */
  showNote?: boolean
  size?: LearnSize
  caption?: string
}

const CLEF_LABEL: Record<ExtendedClef, string> = {
  treble: 'treble',
  alto: 'alto',
  tenor: 'tenor',
  bass: 'bass',
}

// Anchor used to map letter+octave → staff position (smaller = higher).
// Treble/bass match the existing pitch.ts convention; alto/tenor implemented locally.
const CLEF_ANCHOR: Record<ExtendedClef, number> = {
  treble: 38,
  alto: 32,
  tenor: 30,
  bass: 26,
}

function staffPosFor(letter: string, octave: number, clef: ExtendedClef): number {
  const stepIdx = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(letter)
  if (stepIdx < 0) return 0
  const totalSteps = octave * 7 + stepIdx
  return CLEF_ANCHOR[clef] - totalSteps
}

function ledgerLinePositionsFor(pos: number): number[] {
  const lines: number[] = []
  if (pos < 0) {
    for (let p = -2; p >= pos; p -= 2) lines.push(p)
  } else if (pos > 8) {
    for (let p = 10; p <= pos; p += 2) lines.push(p)
  }
  return lines
}

export function MultiClefDisplay({
  clefs = ['treble', 'alto', 'tenor', 'bass'],
  pitch = 'C4',
  showNote = true,
  size = 'inline',
  caption,
}: MultiClefDisplayProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  const parsed = parsePitch(pitch)
  if (!parsed) return null

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(170 * T.scale)
  const staffGap = Math.round(28 * T.scale)
  const labelHeight = Math.round(T.labelFontSize * 1.15) + Math.round(12 * T.scale)
  // Top pad reserves room for a ledger line above the staff.
  const topPad = Math.round(40 * T.scale)
  // Bottom pad: room for a ledger line below the staff PLUS clearance for the
  // treble clef's tail (the curl extends ~28 * scale below the staff bottom)
  // before the clef-name label appears.
  const bottomPad = Math.round(72 * T.scale)
  const staffY = margin + topPad
  const staffHeight = 8 * T.step
  const totalH = staffY + staffHeight + bottomPad + labelHeight + margin
  const totalW = clefs.length * staffWidth + (clefs.length - 1) * staffGap + 2 * margin

  const handleNotePlay = async () => {
    setInteracted(true)
    flash(parsed.midi)
    await play(midiToPitch(parsed.midi))
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `${pitch} shown on ${clefs.length} clefs: ${clefs.join(', ')}`}
      >
        {clefs.map((c, i) => {
          const x = margin + i * (staffWidth + staffGap)
          const pos = staffPosFor(parsed.letter, parsed.octave, c)
          // Center the notehead in the post-clef area (after the clef reserve,
          // before a small right margin) so it doesn't crowd the clef glyph.
          const postClefStart = x + T.clefReserve
          const rightInset = Math.round(10 * T.scale)
          const postClefEnd = x + staffWidth - rightInset
          const noteX = (postClefStart + postClefEnd) / 2
          const noteY = staffY + pos * T.step
          const ledgers = ledgerLinePositionsFor(pos)
          const isHighlighted = highlightedMidis.includes(parsed.midi)
          const fill = isHighlighted ? T.highlightAccent : T.ink

          return (
            <g key={`${c}-${i}`}>
              {/* Five staff lines */}
              {[0, 1, 2, 3, 4].map((li) => (
                <line
                  key={li}
                  x1={x}
                  y1={lineY(staffY, li, T)}
                  x2={x + staffWidth}
                  y2={lineY(staffY, li, T)}
                  stroke={T.staffLineColor}
                  strokeWidth={T.staffLineStroke}
                />
              ))}

              {/* Clef glyph */}
              {c === 'treble' && (
                <text
                  x={x + 8}
                  y={lineY(staffY, 3, T)}
                  fontSize={T.trebleClefFontSize}
                  fontFamily={T.fontMusic}
                  fill={T.ink}
                  dominantBaseline="auto"
                >
                  {T.trebleClefGlyph}
                </text>
              )}
              {c === 'bass' && (
                <text
                  x={x + 8}
                  y={lineY(staffY, 1, T) + T.bassClefYOffset}
                  fontSize={T.bassClefFontSize}
                  fontFamily={T.fontMusic}
                  fill={T.ink}
                  dominantBaseline="auto"
                >
                  {T.bassClefGlyph}
                </text>
              )}
              {(c === 'alto' || c === 'tenor') && (
                <text
                  x={x + 8}
                  y={lineY(staffY, c === 'alto' ? 2 : 1, T)}
                  fontSize={Math.round(T.trebleClefFontSize * 0.95)}
                  fontFamily={T.fontMusic}
                  fill={T.ink}
                  dominantBaseline="central"
                >
                  {'\uE05C'}
                </text>
              )}

              {/* Ledger lines + notehead, when showNote is enabled */}
              {showNote && ledgers.map((lp) => (
                <line
                  key={`ledger-${lp}`}
                  x1={noteX - T.ledgerHalfWidth}
                  y1={staffY + lp * T.step}
                  x2={noteX + T.ledgerHalfWidth}
                  y2={staffY + lp * T.step}
                  stroke={fill}
                  strokeWidth={T.ledgerLineStroke}
                />
              ))}

              {showNote && (
                <g
                  onClick={handleNotePlay}
                  onMouseEnter={() => highlight(parsed.midi)}
                  onMouseLeave={() => highlight(null)}
                  style={{ cursor: 'pointer', transition: T.hoverTransition }}
                  role="button"
                  aria-label={`${pitch} on ${c} clef`}
                >
                  <text
                    x={noteX}
                    y={noteY + T.noteheadDy}
                    fontSize={T.noteheadFontSize}
                    fontFamily={T.fontMusic}
                    fill={fill}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {T.noteheadWholeGlyph}
                  </text>
                </g>
              )}

              {/* Clef name label below the staff (sits clear of the treble-clef tail) */}
              <text
                x={x + staffWidth / 2}
                y={staffY + staffHeight + bottomPad + T.labelFontSize * 0.5}
                fontSize={Math.round(T.labelFontSize * 1.15)}
                fontFamily={T.fontLabel}
                fill={T.ink}
                textAnchor="middle"
                fontWeight={600}
                letterSpacing="0.04em"
              >
                {CLEF_LABEL[c]}
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
