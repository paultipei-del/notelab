'use client'

import React from 'react'
import { Staff, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, ledgerLinePositions, midiToPitch } from '@/lib/learn/visuals/pitch'

interface EnharmonicPairsProps {
  /** [sharpSpelling, flatSpelling] tuples. Default = the five common piano pairs. */
  pairs?: Array<[string, string]>
  /** Show "=" connector arcs between pairs. Default true. */
  showConnectors?: boolean
  size?: LearnSize
  caption?: string
}

const DEFAULT_PAIRS: Array<[string, string]> = [
  ['C#4', 'Db4'],
  ['D#4', 'Eb4'],
  ['F#4', 'Gb4'],
  ['G#4', 'Ab4'],
  ['A#4', 'Bb4'],
]

const ACCIDENTAL_GLYPH: Record<string, string> = {
  '#': '\uE262',
  'b': '\uE260',
  'n': '\uE261',
  '##': '\uE263',
  'bb': '\uE264',
}

export function EnharmonicPairs({
  pairs = DEFAULT_PAIRS,
  showConnectors = true,
  size = 'inline',
  caption,
}: EnharmonicPairsProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  // Parse all 10 notes
  const allParsed = pairs.flatMap(([sharp, flat]) => {
    const ps = parsePitch(sharp)
    const pf = parsePitch(flat)
    return ps && pf ? [{ str: sharp, parsed: ps }, { str: flat, parsed: pf }] : []
  })
  if (allParsed.length === 0) return null

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(880 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(48 * T.scale)
  const staffHeight = 8 * T.step
  const totalH = staffY + staffHeight + Math.round(48 * T.scale) + margin
  const totalW = staffX + staffWidth + margin

  // Left-side padding inside the staff is generous so the first note's
  // accidental can't crowd the clef glyph.
  const leftPad = Math.round(56 * T.scale)
  const rightPad = Math.round(56 * T.scale)
  const noteAreaX = staffX + T.clefReserve + leftPad
  const noteAreaWidth = staffWidth - T.clefReserve - leftPad - rightPad

  // Each pair = two notes spaced apart by `intraPairGap`. Pairs separated by a
  // wider `interPairGap`. Compute so the full row fits inside noteAreaWidth.
  // Pair-internal gap must be wide enough that the second note's accidental
  // doesn't crowd the first note's notehead.
  const numPairs = pairs.length
  const intraPairGap = noteAreaWidth / (numPairs * 2.2)
  const interPairGap = intraPairGap * 1.5
  const totalSpan = numPairs * intraPairGap + (numPairs - 1) * interPairGap
  // Nudge the whole row 1px right so the first accidental sits a touch further
  // from the treble clef without re-centering the entire layout.
  const startX = noteAreaX + (noteAreaWidth - totalSpan) / 2 + 2

  const noteXs: number[] = []
  let cursor = startX
  for (let p = 0; p < numPairs; p++) {
    noteXs.push(cursor)               // sharp
    cursor += intraPairGap
    noteXs.push(cursor)               // flat
    cursor += interPairGap
  }

  const handlePlay = async (midi: number) => {
    setInteracted(true)
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
        aria-label={caption ?? 'Enharmonic equivalent pairs on a treble staff'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />

        {/* Pair connector arcs */}
        {showConnectors && pairs.map((_, p) => {
          const x1 = noteXs[p * 2]
          const x2 = noteXs[p * 2 + 1]
          const midX = (x1 + x2) / 2
          const arcY = staffY - Math.round(8 * T.scale)
          const peakY = arcY - Math.round(10 * T.scale)
          const path = `M ${x1} ${arcY} Q ${midX} ${peakY}, ${x2} ${arcY}`
          return (
            <g key={`conn-${p}`}>
              <path
                d={path}
                fill="none"
                stroke={T.highlightAccent}
                strokeWidth={1.4}
                opacity={0.7}
              />
              <text
                x={midX}
                y={peakY - 3}
                fontSize={T.smallLabelFontSize}
                fontFamily={T.fontLabel}
                fill={T.highlightAccent}
                textAnchor="middle"
                fontWeight={600}
              >
                =
              </text>
            </g>
          )
        })}

        {allParsed.map((entry, idx) => {
          const { parsed } = entry
          const x = noteXs[idx]
          const pos = staffPosition(parsed, 'treble')
          const noteY = staffY + pos * T.step
          const ledgers = ledgerLinePositions(pos)
          const isHighlighted = highlightedMidis.includes(parsed.midi)
          const fill = isHighlighted ? T.highlightAccent : T.ink
          const accGlyph = parsed.accidental && parsed.accidental !== 'n'
            ? ACCIDENTAL_GLYPH[parsed.accidental]
            : null

          return (
            <g key={`note-${idx}`}>
              {ledgers.map((lp) => (
                <line
                  key={`ledger-${idx}-${lp}`}
                  x1={x - T.ledgerHalfWidth}
                  y1={staffY + lp * T.step}
                  x2={x + T.ledgerHalfWidth}
                  y2={staffY + lp * T.step}
                  stroke={fill}
                  strokeWidth={T.ledgerLineStroke}
                />
              ))}
              {accGlyph && (
                <text
                  x={x - Math.round(26 * T.scale)}
                  y={noteY}
                  fontSize={T.accidentalFontSize}
                  fontFamily={T.fontMusic}
                  fill={fill}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {accGlyph}
                </text>
              )}
              <g
                onClick={() => handlePlay(parsed.midi)}
                onMouseEnter={() => highlight(parsed.midi)}
                onMouseLeave={() => highlight(null)}
                style={{ cursor: 'pointer', transition: T.hoverTransition }}
                role="button"
                aria-label={entry.str}
              >
                <text
                  x={x}
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
