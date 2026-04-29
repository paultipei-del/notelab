'use client'

import React from 'react'
import { Staff, RhythmicNote, Rest, Tie, TimeSignature, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

type RhythmValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'

export interface RhythmElement {
  kind: 'note' | 'rest'
  value: RhythmValue
  dotted?: boolean
  /** True if this note is tied to the next element (must also be a note at same pitch). */
  tieToNext?: boolean
}

interface RhythmMeasureExampleProps {
  /** Sequence of notes/rests filling a 4/4 measure. */
  elements: RhythmElement[]
  /** Pitch each note is rendered at. Default 'G4'. */
  pitch?: string
  size?: LearnSize
  caption?: string
}

const DURATION: Record<RhythmValue, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
}

/**
 * Renders a single 4/4 measure of mixed notes/rests with optional dots and
 * ties. Custom-built (not OSMD) so it centers cleanly and the caption can
 * sit close to the visual.
 */
export function RhythmMeasureExample({
  elements,
  pitch = 'G4',
  size = 'inline',
  caption,
}: RhythmMeasureExampleProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const midi = parsed.midi
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(370 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)
  const totalH = staffY + 8 * T.step + Math.round(40 * T.scale) + margin
  const totalW = staffX + staffWidth + margin

  const tsX = staffX + Math.round(86 * T.scale) + 6
  const noteAreaStart = tsX + Math.round(40 * T.scale)
  const noteAreaEnd = staffX + staffWidth - Math.round(20 * T.scale)
  const noteAreaWidth = noteAreaEnd - noteAreaStart

  // Compute beat positions for each element. Each element occupies its own
  // duration; x is the START of that duration mapped onto the staff width.
  const totalBeats = 4
  let cursor = 0
  const placed = elements.map((el) => {
    const beatStart = cursor
    const dur = DURATION[el.value] * (el.dotted ? 1.5 : 1)
    cursor += dur
    // Center the element inside its beat span
    const xCenter = noteAreaStart + ((beatStart + dur / 2) / totalBeats) * noteAreaWidth
    return { el, beatStart, dur, x: xCenter }
  })

  const noteY = lineY(staffY, 0, T) + pos * T.step
  const restY = lineY(staffY, 2, T)

  return (
    <figure style={{ margin: '12px auto 8px', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? '4/4 rhythm example'}
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

        {/* Ties — render BEFORE noteheads so they sit below stems visually */}
        {placed.map((p, i) => {
          if (p.el.kind !== 'note' || !p.el.tieToNext) return null
          const next = placed[i + 1]
          if (!next || next.el.kind !== 'note') return null
          // Tie above noteheads (curve over).
          return (
            <Tie
              key={`tie-${i}`}
              x1={p.x}
              x2={next.x}
              y={noteY + T.noteheadHalfHeight}
              direction="under"
              T={T}
            />
          )
        })}

        {/* Elements */}
        {placed.map((p, i) => {
          const x = p.x
          if (p.el.kind === 'note') {
            // Map dotted-* values to base value
            return (
              <RhythmicNote
                key={`el-${i}`}
                value={p.el.value}
                x={x}
                y={noteY}
                T={T}
                stemDirection="up"
                dotted={p.el.dotted}
                highlight={highlightedMidis.includes(midi)}
                onClick={() => { setInteracted(true); flash(midi); void play(pitch) }}
                ariaLabel={`${pitch} ${p.el.dotted ? 'dotted ' : ''}${p.el.value}`}
              />
            )
          }
          return (
            <Rest
              key={`el-${i}`}
              value={p.el.value}
              x={x}
              y={restY}
              T={T}
            />
          )
        })}
      </svg>
      {interacted && !ready && (
        <div style={{ fontFamily: T.fontLabel, fontSize: T.smallLabelFontSize, color: T.inkSubtle, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
          Loading piano samples…
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
