'use client'

import React from 'react'
import { Keyboard, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { midiToPitch } from '@/lib/learn/visuals/pitch'

interface KeyboardFigureProps {
  /** Lowest MIDI to render (must land on a white key for clean edges; e.g. 21 = A0). */
  startMidi: number
  /** Highest MIDI to render (must land on a white key; e.g. 108 = C8). */
  endMidi: number
  /** MIDI numbers to highlight (drawn in coral). */
  highlightedMidis?: number[]
  /** Label rendering mode passed through to the underlying Keyboard primitive. */
  showLabels?: 'none' | 'c-only' | 'all' | 'all-c-with-octave'
  /** Override the per-white-key width (used for wide ranges like the full 88-key piano). */
  whiteKeyWidthOverride?: number
  /** Disable click-to-play. Default false (clicks play the note). */
  disableAudio?: boolean
  size?: LearnSize
  caption?: string
}

const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11]
function isWhiteKey(midi: number): boolean {
  return WHITE_PCS.includes(((midi % 12) + 12) % 12)
}

export function KeyboardFigure({
  startMidi,
  endMidi,
  highlightedMidis = [],
  showLabels = 'c-only',
  whiteKeyWidthOverride,
  disableAudio = false,
  size = 'inline',
  caption,
}: KeyboardFigureProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis: liveHighlights, highlight, flash } = useNoteHighlight()

  // Count white keys in range
  let whiteCount = 0
  for (let m = startMidi; m <= endMidi; m++) if (isWhiteKey(m)) whiteCount++

  const ww = whiteKeyWidthOverride ?? T.keyboardWhiteKeyWidth
  const wh = T.keyboardWhiteKeyHeight
  const margin = Math.round(20 * T.scale + 8)
  const totalW = ww * whiteCount + 2 * margin
  const totalH = wh + 2 * margin

  const allHighlights = Array.from(new Set([...highlightedMidis, ...liveHighlights]))

  const onKeyClick = disableAudio
    ? undefined
    : async (midi: number) => {
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
        aria-label={caption ?? `Keyboard from ${midiToPitch(startMidi)} to ${midiToPitch(endMidi)}`}
      >
        <Keyboard
          startMidi={startMidi}
          endMidi={endMidi}
          x={margin}
          y={margin}
          T={T}
          highlightedMidis={allHighlights}
          highlightColor={T.highlightAccent}
          showLabels={showLabels}
          whiteKeyWidthOverride={whiteKeyWidthOverride}
          onKeyEnter={(midi) => highlight(midi)}
          onKeyLeave={() => highlight(null)}
          onKeyClick={onKeyClick}
        />
      </svg>
      {!disableAudio && interacted && !ready && (
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
