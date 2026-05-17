'use client'

/**
 * 88-key piano-roll visualization, pure SVG.
 *
 * Render order: every white key first, then every black key on top, so
 * the black-key shapes paint over the seam between adjacent whites.
 * Held white keys are painted with an oxblood fill; held blacks with an
 * oxblood-tinted face that stays visually distinct from a white-key hit.
 *
 * KEY_POSITIONS is precomputed at module load and reused across renders
 * — only the per-key fill colour depends on `heldNotes`.
 */

import { useMemo } from 'react'

type Props = {
  heldNotes: Set<number>
  /** Lowest MIDI note (default A0 = 21). */
  lowestNote?: number
  /** Highest MIDI note (default C8 = 108). */
  highestNote?: number
  width?: number
  height?: number
}

type KeyPos = {
  midi: number
  x: number
  width: number
  isBlack: boolean
}

const WHITE_PCS = new Set([0, 2, 4, 5, 7, 9, 11])

function buildKeyPositions(low: number, high: number, totalWidth: number): KeyPos[] {
  // Pass 1 — count white keys to derive widths
  let whiteCount = 0
  for (let m = low; m <= high; m++) {
    if (WHITE_PCS.has(((m % 12) + 12) % 12)) whiteCount++
  }
  const whiteW = totalWidth / whiteCount
  const blackW = whiteW * 0.6

  // Pass 2 — place white keys sequentially across the strip
  const out: KeyPos[] = []
  const whiteXByMidi = new Map<number, number>()
  let whiteX = 0
  for (let m = low; m <= high; m++) {
    const pc = ((m % 12) + 12) % 12
    if (WHITE_PCS.has(pc)) {
      whiteXByMidi.set(m, whiteX)
      out.push({ midi: m, x: whiteX, width: whiteW, isBlack: false })
      whiteX += whiteW
    }
  }
  // Pass 3 — place black keys centred over the seam between their flanking whites
  for (let m = low; m <= high; m++) {
    const pc = ((m % 12) + 12) % 12
    if (!WHITE_PCS.has(pc)) {
      const belowX = whiteXByMidi.get(m - 1)
      if (belowX === undefined) continue
      out.push({
        midi: m,
        x: belowX + whiteW - blackW / 2,
        width: blackW,
        isBlack: true,
      })
    }
  }
  return out
}

const HELD_WHITE_FILL = 'var(--oxblood)'
const HELD_BLACK_FILL = 'rgba(160, 56, 28, 0.78)'
const WHITE_FILL = '#FDFBF5'
const BLACK_FILL = '#1A1A18'
const KEY_BORDER = 'rgba(90, 64, 40, 0.32)'

export function PianoRoll({
  heldNotes,
  lowestNote = 21,
  highestNote = 108,
  width = 880,
  height = 110,
}: Props) {
  const keys = useMemo(
    () => buildKeyPositions(lowestNote, highestNote, width),
    [lowestNote, highestNote, width],
  )

  const whiteKeys = keys.filter(k => !k.isBlack)
  const blackKeys = keys.filter(k => k.isBlack)
  const blackH = height * 0.6

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ display: 'block', maxWidth: width, userSelect: 'none' }}
      aria-label="88-key piano keyboard"
    >
      {whiteKeys.map(k => {
        const held = heldNotes.has(k.midi)
        return (
          <rect
            key={`w-${k.midi}`}
            x={k.x}
            y={0}
            width={k.width}
            height={height}
            fill={held ? HELD_WHITE_FILL : WHITE_FILL}
            stroke={KEY_BORDER}
            strokeWidth={1}
          />
        )
      })}
      {blackKeys.map(k => {
        const held = heldNotes.has(k.midi)
        return (
          <rect
            key={`b-${k.midi}`}
            x={k.x}
            y={0}
            width={k.width}
            height={blackH}
            fill={held ? HELD_BLACK_FILL : BLACK_FILL}
            stroke={BLACK_FILL}
            strokeWidth={1}
            rx={1.5}
          />
        )
      })}
    </svg>
  )
}

export default PianoRoll
