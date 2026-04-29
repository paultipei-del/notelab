'use client'

import React from 'react'
import { Staff, RhythmicNote, Beam, TimeSignature, Caption } from './primitives'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface MeasureSpec {
  numerator: number
  denominator: number
  noteCount: number
  value: 'quarter' | 'eighth'
  beamGroups?: number[]
}

const PITCH = 'B4'

const SHOWCASE_MEASURES: MeasureSpec[] = [
  { numerator: 2, denominator: 4, noteCount: 2, value: 'quarter' },
  { numerator: 3, denominator: 4, noteCount: 3, value: 'quarter' },
  { numerator: 4, denominator: 4, noteCount: 4, value: 'quarter' },
  { numerator: 6, denominator: 8, noteCount: 6, value: 'eighth', beamGroups: [3, 3] },
]

interface TimeSignatureShowcaseProps {
  size?: LearnSize
  caption?: string
}

export function TimeSignatureShowcase({
  size = 'inline',
  caption,
}: TimeSignatureShowcaseProps) {
  const T = tokensFor(size)
  const parsed = parsePitch(PITCH)!
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)

  const clefReserve = Math.round(70 * T.scale)
  const tsReserve = Math.round(44 * T.scale)
  const quarterUnit = Math.round(70 * T.scale)
  const eighthUnit = Math.round(40 * T.scale)
  const measureTrailingPad = Math.round(14 * T.scale)
  const tsXOffset = Math.round(20 * T.scale)

  const noteSpacing = (m: MeasureSpec) => (m.value === 'eighth' ? eighthUnit : quarterUnit)
  const measureWidth = (m: MeasureSpec) =>
    tsReserve + m.noteCount * noteSpacing(m) + measureTrailingPad

  const measuresW = SHOWCASE_MEASURES.reduce((acc, m) => acc + measureWidth(m), 0)
  const staffWidth = clefReserve + measuresW + Math.round(8 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(40 * T.scale) + margin

  const noteY = lineY(staffY, 0, T) + pos * T.step
  const beamY = noteY - T.stemLength

  const measureStarts = SHOWCASE_MEASURES.reduce<number[]>(
    (acc, m) => [...acc, acc[acc.length - 1] + measureWidth(m)],
    [staffX + clefReserve]
  )
  const layout = SHOWCASE_MEASURES.map((m, mi) => {
    const measureStart = measureStarts[mi]
    const tsX = measureStart + tsXOffset
    const noteAreaStart = measureStart + tsReserve
    const spacing = noteSpacing(m)
    const noteXs = Array.from({ length: m.noteCount }, (_, i) =>
      noteAreaStart + (i + 0.5) * spacing
    )
    const measureEnd = noteAreaStart + m.noteCount * spacing + measureTrailingPad
    return { m, mi, tsX, noteXs, measureEnd }
  })

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Four common time signatures shown side by side: 2/4, 3/4, 4/4, and 6/8'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />

        {layout.map(({ m, mi, tsX, measureEnd }) => (
          <g key={`ts-${mi}`}>
            <TimeSignature numerator={m.numerator} denominator={m.denominator} x={tsX} staffTop={staffY} T={T} />
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

        {layout.map(({ m, mi, noteXs }) => {
          if (m.value === 'quarter') {
            return noteXs.map((x, i) => (
              <RhythmicNote
                key={`m${mi}-n${i}`}
                value="quarter"
                x={x}
                y={noteY}
                T={T}
                stemDirection="up"
                ariaLabel="B4 quarter"
              />
            ))
          }
          const groups = m.beamGroups ?? [m.noteCount]
          let read = 0
          const out: React.ReactNode[] = []
          groups.forEach((groupSize, gi) => {
            const groupXs = noteXs.slice(read, read + groupSize)
            read += groupSize
            out.push(
              <Beam
                key={`m${mi}-beam-${gi}`}
                noteXs={groupXs}
                beamY={beamY}
                beamCount={1}
                stemDirection="up"
                T={T}
              />,
              ...groupXs.map((x, ni) => (
                <RhythmicNote
                  key={`m${mi}-eg${gi}-n${ni}`}
                  value="eighth"
                  x={x}
                  y={noteY}
                  T={T}
                  stemDirection="up"
                  noFlag
                  ariaLabel="B4 eighth"
                />
              ))
            )
          })
          return out
        })}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
