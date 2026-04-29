'use client'

import React from 'react'
import { Staff, RhythmicNote, TimeSignature, BeatNumber, Caption } from './primitives'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface BeatCountMeasure {
  numerator: number
  denominator: number
  /** One label per quarter note. Length determines note count. */
  counts: (string | number)[]
}

interface BeatCountStaffProps {
  measures: BeatCountMeasure[]
  /** Pitch all notes are drawn at. Default 'B4' to match the original OSMD pages. */
  pitch?: string
  size?: LearnSize
  caption?: string
  ariaLabel?: string
}

/**
 * One staff with N measures of quarter notes, with a beat-number label under
 * each note. Replaces OSMD's `<lyric>` rendering on the rhythm reference
 * pages where beats are explicitly numbered.
 */
export function BeatCountStaff({
  measures,
  pitch = 'B4',
  size = 'inline',
  caption,
  ariaLabel,
}: BeatCountStaffProps) {
  const T = tokensFor(size)
  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)

  const clefReserve = Math.round(70 * T.scale)
  const tsReserve = Math.round(48 * T.scale)
  const noteSpacing = Math.round(56 * T.scale)
  const trailingPad = Math.round(12 * T.scale)
  const tsXOffset = Math.round(22 * T.scale)

  const measureWidth = (m: BeatCountMeasure) =>
    tsReserve + m.counts.length * noteSpacing + trailingPad

  const measuresW = measures.reduce((acc, m) => acc + measureWidth(m), 0)
  const staffWidth = clefReserve + measuresW + Math.round(8 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(56 * T.scale) + margin

  const noteY = lineY(staffY, 0, T) + pos * T.step

  const measureStarts = measures.reduce<number[]>(
    (acc, m) => [...acc, acc[acc.length - 1] + measureWidth(m)],
    [staffX + clefReserve]
  )
  const layout = measures.map((m, mi) => {
    const measureStart = measureStarts[mi]
    const tsX = measureStart + tsXOffset
    const noteAreaStart = measureStart + tsReserve
    const noteXs = m.counts.map((_, i) => noteAreaStart + (i + 0.5) * noteSpacing)
    const measureEnd = noteAreaStart + m.counts.length * noteSpacing + trailingPad
    return { m, mi, tsX, noteXs, measureEnd }
  })

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={ariaLabel ?? caption ?? 'Beat-numbered staff'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />

        {layout.map(({ m, mi, tsX, measureEnd }) => (
          <g key={`m-${mi}`}>
            <TimeSignature
              numerator={m.numerator}
              denominator={m.denominator}
              x={tsX}
              staffTop={staffY}
              T={T}
            />
            <line
              x1={measureEnd}
              y1={staffY}
              x2={measureEnd}
              y2={staffY + 8 * T.step}
              stroke={T.ink}
              strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
            />
          </g>
        ))}

        {layout.map(({ m, mi, noteXs }) =>
          noteXs.map((x, i) => (
            <g key={`n-${mi}-${i}`}>
              <RhythmicNote
                value="quarter"
                x={x}
                y={noteY}
                T={T}
                stemDirection="up"
                ariaLabel={`${pitch} quarter, beat ${m.counts[i]}`}
              />
              <BeatNumber x={x} staffTop={staffY} label={m.counts[i]} T={T} />
            </g>
          ))
        )}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
