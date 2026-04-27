'use client'

import React from 'react'
import {
  Staff, NoteHead, Keyboard, StepBracket, ScaleDegreeLabel,
  Caption, useNoteHighlight,
} from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { midiToPitch, aggregateBounds, type Clef } from '@/lib/learn/visuals/pitch'

interface MajorScaleExplorerProps {
  /** MIDI of tonic. Default 60 (C4). */
  tonic?: number
  /** Clef. Default auto-picked from tonic (treble for >=C4, bass for <C4). */
  clef?: Clef
  size?: LearnSize
  showStaff?: boolean
  showKeyboard?: boolean
  showBrackets?: boolean
  showDegrees?: boolean
  showAudio?: boolean
  caption?: string
}

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12]

export function MajorScaleExplorer({
  tonic = 60,
  clef,
  size = 'inline',
  showStaff = true,
  showKeyboard = true,
  showBrackets = true,
  showDegrees = true,
  showAudio = true,
  caption,
}: MajorScaleExplorerProps) {
  const T = tokensFor(size)
  const { ready, play, playSequence } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash, flashSequence } = useNoteHighlight()

  const resolvedClef: Clef = clef ?? (tonic >= 60 ? 'treble' : 'bass')
  const scaleMidis = MAJOR_INTERVALS.map(i => tonic + i)
  const scalePitches = scaleMidis.map(midiToPitch)

  const margin = Math.round(20 * T.scale + 8)
  const innerWidth = Math.max(420, T.keyboardWhiteKeyWidth * 7 + 80)
  const staffX = margin
  const staffWidth = innerWidth
  const noteAreaX = staffX + T.clefReserve
  const noteAreaWidth = staffWidth - T.clefReserve - margin
  const noteSpacing = noteAreaWidth / scaleMidis.length
  const noteXs = scaleMidis.map((_, i) => noteAreaX + (i + 0.5) * noteSpacing)

  const provisional = aggregateBounds(scalePitches, 0, resolvedClef, T)
  const headroom = Math.max(0, -provisional.top)
  const staffY = margin + headroom

  const bounds = aggregateBounds(scalePitches, staffY, resolvedClef, T)

  let cursorY = bounds.bottom + T.annotationBuffer
  let degreeY: number | null = null
  if (showDegrees && showStaff) {
    degreeY = cursorY + T.labelFontSize
    cursorY = degreeY + T.annotationBuffer
  }
  let bracketBarY: number | null = null
  if (showBrackets && showStaff) {
    bracketBarY = cursorY + T.bracketTick
    cursorY = bracketBarY + T.labelFontSize + T.annotationBuffer
  }
  const keyboardGap = Math.max(20, T.step * 2.5)
  const keyboardY = showKeyboard
    ? (showStaff ? cursorY + keyboardGap : margin)
    : cursorY
  const keyboardWidth = T.keyboardWhiteKeyWidth * 8
  const keyboardX = staffX + (staffWidth - keyboardWidth) / 2

  const totalH = showKeyboard
    ? keyboardY + T.keyboardWhiteKeyHeight + margin
    : cursorY + margin
  const totalW = staffX + staffWidth + margin

  const handleNotePlay = async (midi: number) => {
    setInteracted(true)
    flash(midi)
    await play(midiToPitch(midi))
  }

  const handlePlayScale = async () => {
    setInteracted(true)
    flashSequence(scaleMidis, 380, 350)
    await playSequence(scalePitches, 380, '4n')
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `Major scale starting on ${midiToPitch(tonic)}`}
      >
        {showStaff && (
          <>
            <Staff clef={resolvedClef} x={staffX} y={staffY} width={staffWidth} T={T} />
            {scaleMidis.map((midi, i) => (
              <NoteHead
                key={midi}
                pitch={midiToPitch(midi)}
                staffTop={staffY}
                x={noteXs[i]}
                clef={resolvedClef}
                T={T}
                highlight={highlightedMidis.includes(midi)}
                onMouseEnter={() => highlight(midi)}
                onMouseLeave={() => highlight(null)}
                onClick={() => handleNotePlay(midi)}
                ariaLabel={`Scale degree ${i + 1}, ${midiToPitch(midi)}`}
              />
            ))}
            {showDegrees && degreeY !== null && scaleMidis.map((midi, i) => (
              <ScaleDegreeLabel
                key={`deg-${midi}`}
                x={noteXs[i]}
                y={degreeY!}
                degree={(i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
                T={T}
                highlight={highlightedMidis.includes(midi)}
              />
            ))}
            {showBrackets && bracketBarY !== null && noteXs.slice(0, -1).map((x, i) => {
              const interval = MAJOR_INTERVALS[i + 1] - MAJOR_INTERVALS[i]
              const type = interval === 1 ? 'half' : 'whole'
              return (
                <StepBracket
                  key={`br-${i}`}
                  x1={x}
                  x2={noteXs[i + 1]}
                  y={bracketBarY!}
                  type={type}
                  T={T}
                />
              )
            })}
          </>
        )}
        {showKeyboard && (
          <Keyboard
            startMidi={tonic}
            endMidi={tonic + 12}
            x={keyboardX}
            y={keyboardY}
            T={T}
            highlightedMidis={highlightedMidis}
            onKeyEnter={(midi) => highlight(midi)}
            onKeyLeave={() => highlight(null)}
            onKeyClick={(midi) => handleNotePlay(midi)}
            showLabels="c-only"
          />
        )}
      </svg>
      {showAudio && (
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center',
          marginTop: 16, flexWrap: 'wrap',
        }}>
          <button
            onClick={handlePlayScale}
            disabled={interacted && !ready}
            style={btnStyle(T, interacted && !ready)}
          >
            Play scale
          </button>
          {interacted && !ready && (
            <span style={{
              fontFamily: T.fontLabel,
              fontSize: T.smallLabelFontSize,
              color: T.inkSubtle,
              fontStyle: 'italic',
            }}>
              Loading piano samples…
            </span>
          )}
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}

const btnStyle = (
  T: ReturnType<typeof tokensFor>,
  loading: boolean = false,
): React.CSSProperties => ({
  fontFamily: T.fontLabel,
  fontSize: 13,
  padding: '8px 18px',
  background: 'transparent',
  border: `0.5px solid ${T.ink}`,
  borderRadius: 8,
  cursor: loading ? 'wait' : 'pointer',
  color: T.ink,
  opacity: loading ? 0.5 : 1,
  transition: 'background 150ms ease, opacity 150ms ease',
})
