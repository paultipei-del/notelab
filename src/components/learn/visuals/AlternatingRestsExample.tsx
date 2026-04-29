'use client'

import React from 'react'
import { Staff, RhythmicNote, Rest, TimeSignature, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface AlternatingRestsExampleProps {
  /** Pitch the quarter notes are rendered at. Default 'G4'. */
  pitch?: string
  size?: LearnSize
  caption?: string
}

/**
 * One measure of 4/4 alternating quarter note, quarter rest, quarter note,
 * quarter rest. Custom-built so it centers cleanly (OSMD's autoResize SVG
 * resists centering).
 */
export function AlternatingRestsExample({
  pitch = 'G4',
  size = 'inline',
  caption,
}: AlternatingRestsExampleProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const midi = parsed.midi
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(366 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)
  const totalH = staffY + 8 * T.step + Math.round(40 * T.scale) + margin
  const totalW = staffX + staffWidth + margin

  const tsX = staffX + Math.round(86 * T.scale) + 6
  const noteAreaStart = tsX + Math.round(40 * T.scale)
  const noteAreaEnd = staffX + staffWidth - Math.round(20 * T.scale)
  const slotSpacing = (noteAreaEnd - noteAreaStart) / 4
  const slotXs = Array.from({ length: 4 }, (_, i) => noteAreaStart + (i + 0.5) * slotSpacing)
  const noteY = lineY(staffY, 0, T) + pos * T.step
  const restY = lineY(staffY, 2, T) // middle line — quarter rests center on it

  // Pattern: note, rest, note, rest
  const pattern: Array<'note' | 'rest'> = ['note', 'rest', 'note', 'rest']

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'One 4/4 measure alternating quarter note and quarter rest'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={4} denominator={4} x={tsX} staffTop={staffY} T={T} />

        {/* Final barline */}
        <line
          x1={staffX + staffWidth}
          y1={staffY}
          x2={staffX + staffWidth}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
        />

        {pattern.map((kind, i) => {
          const x = slotXs[i]
          if (kind === 'note') {
            return (
              <RhythmicNote
                key={i}
                value="quarter"
                x={x}
                y={noteY}
                T={T}
                stemDirection="up"
                highlight={highlightedMidis.includes(midi)}
                onClick={() => { setInteracted(true); flash(midi); void play(pitch) }}
                ariaLabel={`${pitch} quarter on beat ${i + 1}`}
              />
            )
          }
          return (
            <Rest
              key={i}
              value="quarter"
              x={x}
              y={restY}
              T={T}
            />
          )
        })}
      </svg>
      {interacted && !ready && (
        <div style={{ fontFamily: T.fontLabel, fontSize: T.smallLabelFontSize, color: T.inkSubtle, fontStyle: 'italic', textAlign: 'center', marginTop: 6 }}>
          Loading piano samples…
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
