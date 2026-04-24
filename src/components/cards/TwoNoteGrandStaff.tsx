'use client'

import React from 'react'
import {
  TREBLE_POSITIONS,
  BASS_POSITIONS,
  isOnTrebleStaff,
} from '@/lib/programs/note-reading/staffPositions'

/**
 * Display-only grand staff that renders two notes side-by-side. Used by
 * the Intervallic Identify drill: the first note carries a small pitch
 * label so the student treats it as the reference; the second note is
 * framed with a highlight outline so the student knows which one they're
 * naming.
 *
 * Accidentals are not supported here — Module 8's intervallic pool is
 * diatonic naturals only.
 */

interface Props {
  first: string
  second: string
  highlightSecond?: boolean
  showFirstLabel?: boolean
  showSecondLabel?: boolean
  secondLabelColor?: string
  className?: string
}

export default function TwoNoteGrandStaff({
  first,
  second,
  highlightSecond = true,
  showFirstLabel = true,
  showSecondLabel = false,
  secondLabelColor = '#3B6D11',
  className,
}: Props) {
  const W = 340
  const step = 6
  const staffLeft = 60
  const staffWidth = 240
  const trebleTop = 55
  const bassTop = trebleTop + 8 * step + 48
  const H = bassTop + 8 * step + 70

  // Positions within the active staff for each note
  function noteCoords(pitch: string): { x: number; y: number } | null {
    const onTreble = isOnTrebleStaff(pitch)
    const positions = onTreble ? TREBLE_POSITIONS : BASS_POSITIONS
    const top = onTreble ? trebleTop : bassTop
    const pos = positions[pitch]
    if (pos === undefined) return null
    return { x: 0, y: top + pos * step }
  }

  const firstCoords = noteCoords(first)
  const secondCoords = noteCoords(second)

  // Two notehead columns spaced horizontally across the staff body.
  const firstX = staffLeft + staffWidth * 0.34
  const secondX = staffLeft + staffWidth * 0.72

  function staffLines(top: number, key: string) {
    return [0, 2, 4, 6, 8].map(p => (
      <line
        key={key + p}
        x1={staffLeft}
        y1={top + p * step}
        x2={staffLeft + staffWidth}
        y2={top + p * step}
        stroke="#1A1A18"
        strokeWidth="1.2"
      />
    ))
  }

  function ledgerLinesFor(pitch: string, x: number): React.ReactElement[] {
    const onTreble = isOnTrebleStaff(pitch)
    const positions = onTreble ? TREBLE_POSITIONS : BASS_POSITIONS
    const top = onTreble ? trebleTop : bassTop
    const pos = positions[pitch]
    const out: React.ReactElement[] = []
    if (pos === undefined) return out
    if (pos >= 10) {
      for (let p = 10; p <= pos; p += 2) {
        const y = top + p * step
        out.push(<line key={`lb-${pitch}-${p}`} x1={x - 14} y1={y} x2={x + 14} y2={y} stroke="#1A1A18" strokeWidth="1.2" />)
      }
    } else if (pos <= -2) {
      for (let p = -2; p >= pos; p -= 2) {
        const y = top + p * step
        out.push(<line key={`la-${pitch}-${p}`} x1={x - 14} y1={y} x2={x + 14} y2={y} stroke="#1A1A18" strokeWidth="1.2" />)
      }
    }
    return out
  }

  function notehead(pitch: string, x: number, y: number, dim = false) {
    const onTreble = isOnTrebleStaff(pitch)
    const positions = onTreble ? TREBLE_POSITIONS : BASS_POSITIONS
    const pos = positions[pitch]
    const stemUp = pos === undefined || pos >= 4
    return (
      <g opacity={dim ? 0.55 : 1}>
        <text
          x={x}
          y={y}
          fontSize="46"
          fontFamily="Bravura, serif"
          fill="#1A1A18"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {String.fromCodePoint(0xE0A4)}
        </text>
        <line
          x1={stemUp ? x + 6 : x - 6}
          y1={y}
          x2={stemUp ? x + 6 : x - 6}
          y2={stemUp ? y - 38 : y + 38}
          stroke="#1A1A18"
          strokeWidth="1.6"
        />
      </g>
    )
  }

  const connectLine = (
    <line
      x1={staffLeft}
      y1={trebleTop}
      x2={staffLeft}
      y2={bassTop + 8 * step}
      stroke="#1A1A18"
      strokeWidth="1.5"
    />
  )

  const brace = (
    <text
      x={staffLeft - 14}
      y={bassTop + 8 * step}
      fontSize={bassTop + 8 * step - trebleTop}
      fontFamily="Bravura, serif"
      fill="#1A1A18"
      textAnchor="middle"
      dominantBaseline="auto"
    >
      {String.fromCodePoint(0xE000)}
    </text>
  )

  const trebleClef = (
    <text x={staffLeft + 4} y={trebleTop + 36} fontSize="50" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄞</text>
  )
  const bassClef = (
    <text x={staffLeft + 4} y={bassTop + 13} fontSize="52" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄢</text>
  )

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ maxWidth: '100%', maxHeight: '44vh', width: 'auto', height: 'auto' }}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`Grand staff: ${first} and ${second}`}
    >
      {connectLine}
      {brace}
      {staffLines(trebleTop, 't')}
      {staffLines(bassTop, 'b')}
      {trebleClef}
      {bassClef}

      {/* First note (reference) — dimmed slightly to signal "given". */}
      {firstCoords && ledgerLinesFor(first, firstX)}
      {firstCoords && notehead(first, firstX, firstCoords.y, true)}

      {/* Second note (question target) — highlighted with a red-framed
          notehead if requested. Renders on top of its own ledger lines. */}
      {secondCoords && ledgerLinesFor(second, secondX)}
      {highlightSecond && secondCoords && (
        <circle cx={secondX} cy={secondCoords.y} r={18} fill="none" stroke="#B5402A" strokeWidth="2" strokeDasharray="3 3" />
      )}
      {secondCoords && notehead(second, secondX, secondCoords.y, false)}

      {/* First note label (left of the staff under the first column). */}
      {showFirstLabel && firstCoords && (
        <text
          x={firstX}
          y={H - 30}
          textAnchor="middle"
          fontFamily="var(--font-cormorant), serif"
          fontSize="18"
          fill="#7A7060"
        >
          {first}
        </text>
      )}

      {/* Second note label — only shown on reveal. */}
      {showSecondLabel && secondCoords && (
        <text
          x={secondX}
          y={H - 30}
          textAnchor="middle"
          fontFamily="var(--font-cormorant), serif"
          fontSize="18"
          fontWeight={400}
          fill={secondLabelColor}
        >
          {second}
        </text>
      )}
    </svg>
  )
}
