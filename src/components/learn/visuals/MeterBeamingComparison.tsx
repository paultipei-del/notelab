'use client'

import React from 'react'
import { Staff, RhythmicNote, Beam, TimeSignature, Caption } from './primitives'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface BeamingMeasure {
  numerator: number
  denominator: number
  /** Beam-group sizes, e.g. [2,2,2] for 2+2+2 eighths or [3,3] for 3+3. */
  beamGroups: number[]
}

interface MeterBeamingComparisonProps {
  /** Two measures to display side-by-side. */
  measures: [BeamingMeasure, BeamingMeasure]
  pitch?: string
  size?: LearnSize
  caption?: string
  ariaLabel?: string
}

/**
 * Two consecutive measures showing how identical eighth notes are beamed
 * differently under different time signatures — the visual contrast between
 * simple and compound meter.
 */
export function MeterBeamingComparison({
  measures,
  pitch = 'B4',
  size = 'inline',
  caption,
  ariaLabel,
}: MeterBeamingComparisonProps) {
  const T = tokensFor(size)
  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)

  const clefReserve = Math.round(70 * T.scale)
  const eighthUnit = Math.round(40 * T.scale)
  const groupGap = Math.round(14 * T.scale)
  const trailingPad = Math.round(14 * T.scale)

  // Time-signature widths grow with digit count. A 2-digit numerator like
  // `12` needs more left padding (so it doesn't sit on the barline) AND
  // more total reserve (so it doesn't crowd the first note).
  const tsXOffsetFor = (n: number) =>
    Math.round((24 + (String(n).length - 1) * 16) * T.scale)
  const tsReserveFor = (n: number) =>
    Math.round((46 + (String(n).length - 1) * 30) * T.scale)

  const noteCount = (m: BeamingMeasure) => m.beamGroups.reduce((a, b) => a + b, 0)
  const measureWidth = (m: BeamingMeasure) =>
    tsReserveFor(m.numerator) +
    noteCount(m) * eighthUnit +
    Math.max(0, m.beamGroups.length - 1) * groupGap +
    trailingPad

  const measuresW = measures.reduce((acc, m) => acc + measureWidth(m), 0)
  const staffWidth = clefReserve + measuresW + Math.round(8 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(40 * T.scale) + margin

  const noteY = lineY(staffY, 0, T) + pos * T.step
  const beamY = noteY - T.stemLength

  const measureStarts = measures.reduce<number[]>(
    (acc, m) => [...acc, acc[acc.length - 1] + measureWidth(m)],
    [staffX + clefReserve]
  )
  const layout = measures.map((m, mi) => {
    const measureStart = measureStarts[mi]
    const tsX = measureStart + tsXOffsetFor(m.numerator)
    const noteAreaStart = measureStart + tsReserveFor(m.numerator)

    const firstStart = noteAreaStart + Math.round(eighthUnit * 0.5)
    const groupStarts = m.beamGroups.reduce<number[]>((acc, _gSize, gi) => {
      if (gi === 0) return [firstStart]
      const prev = acc[gi - 1]
      const prevSize = m.beamGroups[gi - 1]
      return [...acc, prev + prevSize * eighthUnit + groupGap]
    }, [])

    const groups = m.beamGroups.map((gSize, gi) => ({
      xs: Array.from({ length: gSize }, (_, i) => groupStarts[gi] + i * eighthUnit),
    }))

    const measureEnd =
      noteAreaStart +
      noteCount(m) * eighthUnit +
      Math.max(0, m.beamGroups.length - 1) * groupGap +
      trailingPad
    return { m, mi, tsX, groups, measureEnd }
  })

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={ariaLabel ?? caption ?? 'Two measures comparing beaming patterns'}
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

        {layout.map(({ mi, groups }) =>
          groups.map((g, gi) => (
            <g key={`m${mi}-grp${gi}`}>
              <Beam
                noteXs={g.xs}
                beamY={beamY}
                beamCount={1}
                stemDirection="up"
                T={T}
              />
              {g.xs.map((x, ni) => (
                <RhythmicNote
                  key={`m${mi}-grp${gi}-n${ni}`}
                  value="eighth"
                  x={x}
                  y={noteY}
                  T={T}
                  stemDirection="up"
                  noFlag
                  ariaLabel={`${pitch} eighth`}
                />
              ))}
            </g>
          ))
        )}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
