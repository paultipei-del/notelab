import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'

interface BeamProps {
  /** X positions of each note in the beamed group, in left-to-right order. */
  noteXs: number[]
  /**
   * Y position of the beam's primary edge at the FIRST note's stem. If
   * `beamY2` is omitted, the beam is flat (uses beamY for both endpoints).
   */
  beamY: number
  /** Y at the LAST note's stem — pass to render a sloped beam. */
  beamY2?: number
  /**
   * Per-note beam count: 1 = eighth, 2 = sixteenth, 3 = 32nd. Length must
   * match noteXs.
   */
  noteBeamCounts?: number[]
  /** Legacy: uniform beam count if noteBeamCounts is not provided. */
  beamCount?: number
  /** Stem direction. Default 'up'. */
  stemDirection?: 'up' | 'down'
  T: LearnTokens
}

/**
 * Beam — horizontal (or sloped) connector(s) replacing flags on a beamed
 * group. Mixed-value groups render broken-beam fragments at higher levels.
 * Slope follows melodic contour when beamY/beamY2 differ.
 */
export function Beam({
  noteXs,
  beamY,
  beamY2,
  noteBeamCounts,
  beamCount = 1,
  stemDirection = 'up',
  T,
}: BeamProps) {
  if (noteXs.length < 2) return null
  const counts = noteBeamCounts ?? noteXs.map(() => beamCount)
  const maxLevel = Math.max(...counts)
  if (maxLevel < 1) return null

  const stemUp = stemDirection === 'up'
  const stemX = (xi: number) =>
    stemUp ? noteXs[xi] + T.stemXOffset : noteXs[xi] - T.stemXOffset

  const beamThickness = Math.max(2, Math.round(T.step * 0.55))
  const beamGap = Math.round(T.step * 0.45)
  const fragmentLen = Math.max(8, Math.round(noteXs.length > 1
    ? Math.min((noteXs[1] - noteXs[0]) * 0.45, 18 * T.scale + 4)
    : 14 * T.scale))

  // Beam line endpoints (in stem-x, beam-y).
  const firstX = stemX(0)
  const lastX = stemX(noteXs.length - 1)
  const y1 = beamY
  const y2 = beamY2 ?? beamY
  const slope = (lastX - firstX) === 0 ? 0 : (y2 - y1) / (lastX - firstX)
  const beamYAt = (x: number) => y1 + slope * (x - firstX)

  const segments: React.ReactNode[] = []

  for (let level = 0; level < maxLevel; level++) {
    const yOffset = level * (beamThickness + beamGap)

    const has = (i: number) => i >= 0 && i < counts.length && counts[i] > level

    let i = 0
    while (i < counts.length) {
      if (!has(i)) { i++; continue }

      let j = i
      while (j + 1 < counts.length && has(j + 1)) j++

      if (j > i) {
        const x1 = stemX(i) - 0.5
        const x2 = stemX(j) + 0.5
        const yA = beamYAt(x1) + (stemUp ? yOffset : -yOffset - beamThickness)
        const yB = beamYAt(x2) + (stemUp ? yOffset : -yOffset - beamThickness)
        segments.push(
          <polygon
            key={`b-${level}-${i}-${j}`}
            points={`${x1},${yA} ${x2},${yB} ${x2},${yB + beamThickness} ${x1},${yA + beamThickness}`}
            fill={T.ink}
          />,
        )
      } else {
        // Single-note run at this level → broken-beam fragment.
        const dir = i === 0 ? +1 : -1
        const x1 = stemX(i) - 0.5
        const x2 = stemX(i) + dir * fragmentLen + 0.5
        const left = Math.min(x1, x2)
        const right = Math.max(x1, x2)
        const yA = beamYAt(left) + (stemUp ? yOffset : -yOffset - beamThickness)
        const yB = beamYAt(right) + (stemUp ? yOffset : -yOffset - beamThickness)
        segments.push(
          <polygon
            key={`b-${level}-${i}`}
            points={`${left},${yA} ${right},${yB} ${right},${yB + beamThickness} ${left},${yA + beamThickness}`}
            fill={T.ink}
          />,
        )
      }

      i = j + 1
    }
  }

  return <g>{segments}</g>
}
