'use client'

import React from 'react'
import { Staff, RhythmicNote, Beam, TimeSignature, AccentMark, Caption } from './primitives'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

type AccentNoteValue = 'quarter' | 'eighth'

interface AccentNote {
  value: AccentNoteValue
  accent?: boolean
}

export interface AccentedMeasure {
  numerator: number
  denominator: number
  notes: AccentNote[]
  /** For eighth-note measures, group sizes (must sum to notes.length). Default beams everything as one group. */
  beamGroups?: number[]
}

interface AccentedMeasuresProps {
  measures: AccentedMeasure[]
  pitch?: string
  size?: LearnSize
  caption?: string
  ariaLabel?: string
}

/**
 * One or more measures of quarters or beamed eighths with optional accent
 * marks above selected notes. Handles the standard-vs-syncopated 4/4
 * comparison and the standard-vs-hemiola 3/4 comparison without OSMD.
 *
 * The time signature is drawn only on the first measure — engraving
 * convention when subsequent measures share the meter.
 */
export function AccentedMeasures({
  measures,
  pitch = 'B4',
  size = 'inline',
  caption,
  ariaLabel,
}: AccentedMeasuresProps) {
  const T = tokensFor(size)
  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffX = margin
  const staffY = margin + Math.round(80 * T.scale)

  const clefReserve = Math.round(70 * T.scale)
  const tsReserve = Math.round(46 * T.scale)
  const quarterUnit = Math.round(86 * T.scale)
  const eighthUnit = Math.round(46 * T.scale)
  const trailingPad = Math.round(16 * T.scale)
  const tsXOffset = Math.round(20 * T.scale)

  const noteUnit = (n: AccentNote) => (n.value === 'eighth' ? eighthUnit : quarterUnit)
  const measureWidth = (m: AccentedMeasure) =>
    tsReserve + m.notes.reduce((a, n) => a + noteUnit(n), 0) + trailingPad

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
    const tsX = measureStart + tsXOffset
    const showTimeSig = mi === 0
    const noteAreaStart = measureStart + tsReserve

    const noteOffsets = m.notes.reduce<number[]>(
      (acc, n) => [...acc, acc[acc.length - 1] + noteUnit(n)],
      [0]
    )
    const noteXs = m.notes.map((n, i) => noteAreaStart + noteOffsets[i] + noteUnit(n) / 2)
    const measureEnd = noteAreaStart + m.notes.reduce((a, n) => a + noteUnit(n), 0) + trailingPad
    return { m, mi, tsX, showTimeSig, noteXs, measureEnd }
  })

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={ariaLabel ?? caption ?? 'Accented rhythm pattern'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />

        {layout.map(({ m, mi, tsX, showTimeSig, measureEnd }) => (
          <g key={`mhead-${mi}`}>
            {showTimeSig && (
              <TimeSignature
                numerator={m.numerator}
                denominator={m.denominator}
                x={tsX}
                staffTop={staffY}
                T={T}
              />
            )}
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
          const out: React.ReactNode[] = []
          // Beams for eighth-only groups
          const allEighth = m.notes.every((n) => n.value === 'eighth')
          if (allEighth) {
            const groups = m.beamGroups ?? [m.notes.length]
            let read = 0
            groups.forEach((gSize, gi) => {
              const xs = noteXs.slice(read, read + gSize)
              read += gSize
              if (xs.length >= 2) {
                out.push(
                  <Beam
                    key={`m${mi}-beam-${gi}`}
                    noteXs={xs}
                    beamY={beamY}
                    beamCount={1}
                    stemDirection="up"
                    T={T}
                  />
                )
              }
            })
          }

          // Notes + accents
          m.notes.forEach((n, ni) => {
            const x = noteXs[ni]
            out.push(
              <RhythmicNote
                key={`m${mi}-n${ni}`}
                value={n.value}
                x={x}
                y={noteY}
                T={T}
                stemDirection="up"
                noFlag={allEighth}
                ariaLabel={`${pitch} ${n.value}${n.accent ? ' accented' : ''}`}
              />
            )
            if (n.accent) {
              const accentY = beamY - Math.round(T.step * 2.6)
              out.push(
                <AccentMark
                  key={`m${mi}-n${ni}-acc`}
                  x={x}
                  y={accentY}
                  T={T}
                />
              )
            }
          })
          return out
        })}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
