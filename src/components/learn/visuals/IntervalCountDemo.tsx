'use client'

import React from 'react'
import { Staff, NoteHead, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, aggregateBounds, type Clef } from '@/lib/learn/visuals/pitch'

// Octave letter order: C starts each octave so totalSteps wraps correctly.
const OCTAVE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
type OctaveLetter = typeof OCTAVE_LETTERS[number]

function totalSteps(letter: string, octave: number): number {
  const idx = OCTAVE_LETTERS.indexOf(letter as OctaveLetter)
  return octave * 7 + (idx >= 0 ? idx : 0)
}

interface IntervalCountDemoProps {
  /** Lower pitch. Default 'C4'. */
  lowerPitch?: string
  /** Upper pitch. Default 'G4'. */
  upperPitch?: string
  size?: LearnSize
  caption?: string
}

/**
 * Two whole notes on a single staff with the inclusive letter-name walk
 * spelled out below in coral, a coral bracket spanning the letters, and
 * the resulting interval number under the bracket midpoint.
 *
 * Example for C-G: C, D, E, F, G — five letters — fifth.
 */
export function IntervalCountDemo({
  lowerPitch = 'C4',
  upperPitch = 'G4',
  size = 'inline',
  caption,
}: IntervalCountDemoProps) {
  const T = tokensFor(size)
  const { ready, play, playChord } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  const lower = parsePitch(lowerPitch)
  const upper = parsePitch(upperPitch)
  if (!lower || !upper) return null

  // Inclusive letter walk from lower → upper (handles octave wrap).
  const lowerStep = totalSteps(lower.letter, lower.octave)
  const upperStep = totalSteps(upper.letter, upper.octave)
  const letterStepCount = Math.max(0, upperStep - lowerStep)
  const letters: string[] = []
  for (let k = 0; k <= letterStepCount; k++) {
    const idx = ((lowerStep + k) % 7 + 7) % 7
    letters.push(OCTAVE_LETTERS[idx])
  }
  const intervalNumber = letters.length

  // Layout
  const margin = Math.round(20 * T.scale + 8)
  const clef: Clef = 'treble'
  const innerWidth = Math.max(360, Math.round(80 * T.scale * (letters.length + 1)))
  const staffX = margin
  const staffWidth = innerWidth
  const noteAreaX = staffX + T.clefReserve
  const noteAreaWidth = staffWidth - T.clefReserve - margin

  const lowerX = noteAreaX + noteAreaWidth * 0.25
  const upperX = noteAreaX + noteAreaWidth * 0.75

  const provisional = aggregateBounds([lowerPitch, upperPitch], 0, clef, T)
  const headroom = Math.max(0, -provisional.top)
  const staffY = margin + headroom

  const bounds = aggregateBounds([lowerPitch, upperPitch], staffY, clef, T)

  // Letter row below the staff, then bracket below that, then result number.
  const lettersGap = Math.round(28 * T.scale)
  const lettersY = bounds.bottom + lettersGap
  const bracketGap = Math.round(10 * T.scale)
  const bracketY = lettersY + bracketGap + Math.round(8 * T.scale)
  const bracketTick = Math.round(6 * T.scale)
  const resultY = bracketY + Math.round(20 * T.scale)

  const totalH = resultY + Math.round(16 * T.scale) + margin
  const totalW = staffX + staffWidth + margin

  // Evenly distribute letter X positions between lowerX and upperX.
  const letterXs = letters.map((_, idx) =>
    letters.length === 1
      ? (lowerX + upperX) / 2
      : lowerX + (upperX - lowerX) * (idx / (letters.length - 1))
  )

  const handleNoteClick = async (pitch: string, midi: number) => {
    setInteracted(true)
    flash(midi)
    await play(pitch)
  }

  const handlePlayBoth = async () => {
    setInteracted(true)
    flash(lower.midi, 1200)
    flash(upper.midi, 1200)
    await playChord([lowerPitch, upperPitch])
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `${lowerPitch} to ${upperPitch}: ${letters.join(', ')} — ${intervalNumber} letter names.`}
      >
        <Staff clef={clef} x={staffX} y={staffY} width={staffWidth} T={T} />
        <NoteHead
          pitch={lowerPitch}
          staffTop={staffY}
          x={lowerX}
          clef={clef}
          T={T}
          duration="whole"
          highlight={highlightedMidis.includes(lower.midi)}
          onMouseEnter={() => highlight(lower.midi)}
          onMouseLeave={() => highlight(null)}
          onClick={() => handleNoteClick(lowerPitch, lower.midi)}
          ariaLabel={lowerPitch}
        />
        <NoteHead
          pitch={upperPitch}
          staffTop={staffY}
          x={upperX}
          clef={clef}
          T={T}
          duration="whole"
          highlight={highlightedMidis.includes(upper.midi)}
          onMouseEnter={() => highlight(upper.midi)}
          onMouseLeave={() => highlight(null)}
          onClick={() => handleNoteClick(upperPitch, upper.midi)}
          ariaLabel={upperPitch}
        />

        {letters.map((letter, idx) => (
          <text
            key={`letter-${idx}`}
            x={letterXs[idx]}
            y={lettersY}
            fontSize={T.labelFontSize * 1.1}
            fontFamily={T.fontLabel}
            fill={T.highlightAccent}
            fontWeight={600}
            textAnchor="middle"
          >
            {letter}
          </text>
        ))}

        <path
          d={
            `M ${letterXs[0]} ${bracketY - bracketTick} ` +
            `L ${letterXs[0]} ${bracketY} ` +
            `L ${letterXs[letterXs.length - 1]} ${bracketY} ` +
            `L ${letterXs[letterXs.length - 1]} ${bracketY - bracketTick}`
          }
          fill="none"
          stroke={T.highlightAccent}
          strokeWidth={1.4}
        />

        <text
          x={(letterXs[0] + letterXs[letterXs.length - 1]) / 2}
          y={resultY}
          fontSize={T.labelFontSize * 1.4}
          fontFamily={T.fontLabel}
          fill={T.highlightAccent}
          fontWeight={500}
          textAnchor="middle"
        >
          {intervalNumber}
        </text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button
          onClick={handlePlayBoth}
          disabled={interacted && !ready}
          style={{
            fontFamily: T.fontLabel,
            fontSize: 13,
            padding: '8px 18px',
            background: 'transparent',
            border: `0.5px solid ${T.ink}`,
            borderRadius: 8,
            cursor: interacted && !ready ? 'wait' : 'pointer',
            color: T.ink,
            opacity: interacted && !ready ? 0.5 : 1,
          }}
        >
          Play both
        </button>
      </div>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
