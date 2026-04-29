import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface BeamProps {
  /** X positions of each note in the beamed group, in left-to-right order. */
  noteXs: number[]
  /** Y position of the beam's primary edge (the side touching the stems). */
  beamY: number
  /** Number of beams (1 for eighths, 2 for sixteenths). Default 1. */
  beamCount?: number
  /** Stem direction. Default 'up'. */
  stemDirection?: 'up' | 'down'
  T: LearnTokens
}

/**
 * Beam — horizontal connector replacing flags on a beamed group.
 * Renders one or more thick horizontal bars from the first note's stem to
 * the last note's stem. Individual stems are still drawn by each
 * `<RhythmicNote noFlag>` so the caller stays simple.
 */
export function Beam({
  noteXs,
  beamY,
  beamCount = 1,
  stemDirection = 'up',
  T,
}: BeamProps) {
  if (noteXs.length < 2) return null
  const stemUp = stemDirection === 'up'
  const x1 = (stemUp ? noteXs[0] + T.stemXOffset : noteXs[0] - T.stemXOffset)
  const x2 = (stemUp ? noteXs[noteXs.length - 1] + T.stemXOffset : noteXs[noteXs.length - 1] - T.stemXOffset)
  const beamThickness = Math.max(2, Math.round(T.step * 0.55))
  const beamGap = Math.round(T.step * 0.45)

  return (
    <g>
      {Array.from({ length: beamCount }, (_, i) => {
        const offset = i * (beamThickness + beamGap)
        const yTop = stemUp ? beamY + offset : beamY - offset - beamThickness
        return (
          <rect
            key={`beam-${i}`}
            x={x1 - 0.5}
            y={yTop}
            width={x2 - x1 + 1}
            height={beamThickness}
            fill={T.ink}
          />
        )
      })}
    </g>
  )
}
