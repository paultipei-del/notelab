'use client'

import React from 'react'
import { TREBLE_POSITIONS } from '@/lib/programs/note-reading/staffPositions'

/**
 * Treble-clef staff with a single 4/4 measure of four quarter notes.
 * Used by Module 9's rhythmic drills. Each notehead is rendered with
 * its Bravura glyph and a stem; the currently active beat can be
 * highlighted via `activeIndex`, and per-beat feedback states
 * (`beatStates`) recolour noteheads without affecting the others.
 */

interface Props {
  notes: string[]                  // exactly 4 diatonic naturals in TREBLE_POSITIONS
  activeIndex?: number | null      // -1 / null = none active
  beatStates?: Array<'pending' | 'correct' | 'wrong' | null>
  revealLetters?: boolean          // show pitch letters under each notehead (used for feedback)
  className?: string
}

export default function RhythmicMeasureStaff({
  notes,
  activeIndex = null,
  beatStates,
  revealLetters = false,
  className,
}: Props) {
  const W = 480
  const H = 180
  const step = 6
  const staffTop = 70
  const staffLeft = 80
  const staffWidth = 380
  const staffRight = staffLeft + staffWidth

  // Evenly space four noteheads across the bar. Small left-pad for the
  // time signature, small right-pad for the barline.
  const barLeft = staffLeft + 50        // room for clef + time sig
  const barRight = staffRight - 10      // barline sits just inside the staff's right edge
  const slotWidth = (barRight - barLeft) / 4
  const slotXs = [0, 1, 2, 3].map(i => barLeft + slotWidth * (i + 0.5))

  function noteY(pitch: string): number | null {
    const natural = pitch.replace(/[#b]/, '')
    const pos = TREBLE_POSITIONS[natural]
    if (pos === undefined) return null
    return staffTop + pos * step
  }

  const staffLines = [0, 2, 4, 6, 8].map(p => {
    const y = staffTop + p * step
    return <line key={p} x1={staffLeft} y1={y} x2={staffRight} y2={y} stroke="#1A1A18" strokeWidth="1.2" />
  })

  const clef = (
    <text x={staffLeft + 2} y={staffTop + 36} fontSize="50" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">
      𝄞
    </text>
  )

  // 4/4 time signature (stacked numerals in Bravura range doesn't render
  // cleanly everywhere, so fall back to the serif font).
  const timeSig = (
    <g>
      <text x={staffLeft + 38} y={staffTop + 18} fontSize="22" fontFamily="var(--font-cormorant), serif" fontWeight={500} fill="#1A1A18" textAnchor="middle" dominantBaseline="middle">4</text>
      <text x={staffLeft + 38} y={staffTop + 40} fontSize="22" fontFamily="var(--font-cormorant), serif" fontWeight={500} fill="#1A1A18" textAnchor="middle" dominantBaseline="middle">4</text>
    </g>
  )

  const barline = (
    <line x1={barRight} y1={staffTop} x2={barRight} y2={staffTop + 8 * step} stroke="#1A1A18" strokeWidth="1.5" />
  )

  const ledgerLines: React.ReactElement[] = []
  notes.forEach((pitch, i) => {
    const natural = pitch.replace(/[#b]/, '')
    const pos = TREBLE_POSITIONS[natural]
    if (pos === undefined) return
    const x = slotXs[i]
    if (pos >= 10) {
      for (let p = 10; p <= pos; p += 2) {
        const ly = staffTop + p * step
        ledgerLines.push(<line key={`lb-${i}-${p}`} x1={x - 14} y1={ly} x2={x + 14} y2={ly} stroke="#1A1A18" strokeWidth="1.2" />)
      }
    } else if (pos <= -2) {
      for (let p = -2; p >= pos; p -= 2) {
        const ly = staffTop + p * step
        ledgerLines.push(<line key={`la-${i}-${p}`} x1={x - 14} y1={ly} x2={x + 14} y2={ly} stroke="#1A1A18" strokeWidth="1.2" />)
      }
    }
  })

  function colorForBeat(idx: number): string {
    const state = beatStates?.[idx]
    if (state === 'correct') return '#3B6D11'
    if (state === 'wrong') return '#A32D2D'
    if (idx === activeIndex) return '#B5402A'
    return '#1A1A18'
  }

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ maxWidth: '100%', height: 'auto', width: 'auto' }}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`4/4 measure: ${notes.join(', ')}`}
    >
      {staffLines}
      {clef}
      {timeSig}
      {ledgerLines}
      {barline}

      {notes.map((pitch, i) => {
        const y = noteY(pitch)
        if (y === null) return null
        const natural = pitch.replace(/[#b]/, '')
        const pos = TREBLE_POSITIONS[natural]
        const stemUp = pos === undefined || pos >= 4
        const color = colorForBeat(i)
        const x = slotXs[i]
        const isActive = i === activeIndex
        return (
          <g key={i}>
            {isActive && (
              <circle cx={x} cy={y} r={17} fill="none" stroke="#B5402A" strokeWidth="2" strokeDasharray="3 3" />
            )}
            <text
              x={x}
              y={y}
              fontSize="42"
              fontFamily="Bravura, serif"
              fill={color}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {String.fromCodePoint(0xE0A4)}
            </text>
            <line
              x1={stemUp ? x + 5 : x - 5} y1={y}
              x2={stemUp ? x + 5 : x - 5} y2={stemUp ? y - 34 : y + 34}
              stroke={color} strokeWidth="1.6"
            />
            {revealLetters && (
              <text
                x={x}
                y={H - 20}
                textAnchor="middle"
                fontFamily="var(--font-cormorant), serif"
                fontSize="16"
                fill={color}
              >
                {pitch.replace(/\d+$/, '')}
              </text>
            )}
          </g>
        )
      })}

      {/* Beat counter dots underneath the staff for visual sync with the
          metronome. Dots fill in as the metronome advances. */}
      <g>
        {slotXs.map((x, i) => {
          const state = beatStates?.[i]
          const filled = state === 'correct' || state === 'wrong' || (state === 'pending' && i === activeIndex) || (activeIndex !== null && i <= activeIndex)
          const color = state === 'correct' ? '#3B6D11' : state === 'wrong' ? '#A32D2D' : filled ? '#1A1A18' : '#D7D1C0'
          return (
            <circle key={`dot-${i}`} cx={x} cy={H - 40} r={4} fill={color} />
          )
        })}
      </g>
    </svg>
  )
}
