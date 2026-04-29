'use client'

import React from 'react'
import { Staff, NoteHead, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { midiToPitch, aggregateBounds, type Clef } from '@/lib/learn/visuals/pitch'

interface PitchFrequencyNoteProps {
  /** MIDI of the note. Default 69 (A4). */
  midi?: number
  /** Frequency in Hz. Default 440. */
  frequency?: number
  /** Clef. Auto-picked from MIDI by default. */
  clef?: Clef
  size?: LearnSize
  caption?: string
}

export function PitchFrequencyNote({
  midi = 69,
  frequency = 440,
  clef,
  size = 'inline',
  caption,
}: PitchFrequencyNoteProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  const resolvedClef: Clef = clef ?? (midi >= 60 ? 'treble' : 'bass')
  const pitch = midiToPitch(midi)

  const margin = Math.round(20 * T.scale + 8)
  const innerWidth = Math.max(220, T.clefReserve + Math.round(150 * T.scale))
  const staffX = margin
  const staffWidth = innerWidth
  // Center the notehead horizontally inside the post-clef area of the staff.
  const postClefStart = staffX + T.clefReserve
  const postClefEnd = staffX + staffWidth
  const noteX = (postClefStart + postClefEnd) / 2

  const provisional = aggregateBounds([pitch], 0, resolvedClef, T)
  const headroom = Math.max(0, -provisional.top)
  const staffY = margin + headroom

  const bounds = aggregateBounds([pitch], staffY, resolvedClef, T)
  const labelY = bounds.bottom + T.annotationBuffer + T.labelFontSize + 4

  const totalH = labelY + Math.round(8 * T.scale) + margin
  const totalW = staffX + staffWidth + margin

  const handleClick = async () => {
    setInteracted(true)
    flash(midi)
    await play(pitch)
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `${pitch} at ${frequency} Hz`}
      >
        <Staff clef={resolvedClef} x={staffX} y={staffY} width={staffWidth} T={T} />
        <NoteHead
          pitch={pitch}
          staffTop={staffY}
          x={noteX}
          clef={resolvedClef}
          T={T}
          highlight={highlightedMidis.includes(midi)}
          onMouseEnter={() => highlight(midi)}
          onMouseLeave={() => highlight(null)}
          onClick={handleClick}
          ariaLabel={`${pitch}, ${frequency} hertz`}
        />
        <text
          x={noteX} y={labelY}
          fontSize={T.labelFontSize} fontFamily={T.fontLabel}
          fill={T.highlightAccent} textAnchor="middle" fontWeight={500}
        >
          {frequency} Hz
        </text>
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
