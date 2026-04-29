'use client'

import React from 'react'
import { RhythmicNote, Beam, Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface NoteValueHierarchyProps {
  size?: LearnSize
  caption?: string
}

interface RowSpec {
  value: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
  count: number
  /** How many notes share each beam group. 0 = no beaming. */
  beamGroup: number
  /** Beam thickness count (1 for eighth, 2 for sixteenth). */
  beamCount: number
  word: string
  fraction: string
}

const ROWS: RowSpec[] = [
  { value: 'whole',     count: 1,  beamGroup: 0, beamCount: 0, word: 'Whole',     fraction: '1' },
  { value: 'half',      count: 2,  beamGroup: 0, beamCount: 0, word: 'Half',      fraction: '1/2' },
  { value: 'quarter',   count: 4,  beamGroup: 0, beamCount: 0, word: 'Quarter',   fraction: '1/4' },
  { value: 'eighth',    count: 8,  beamGroup: 2, beamCount: 1, word: 'Eighth',    fraction: '1/8' },
  { value: 'sixteenth', count: 16, beamGroup: 4, beamCount: 2, word: 'Sixteenth', fraction: '1/16' },
]

export function NoteValueHierarchy({ size = 'inline', caption }: NoteValueHierarchyProps) {
  const T = tokensFor(size)

  const margin = Math.round(20 * T.scale + 8)
  const labelGutter = Math.round(160 * T.scale)
  const innerWidth = Math.round(800 * T.scale)
  const bandHeight = Math.round(140 * T.scale)
  const noteAreaX = margin + labelGutter

  const totalH = ROWS.length * bandHeight + 2 * margin
  const totalW = labelGutter + innerWidth + 2 * margin

  const bandNoteY = (bandTop: number) => bandTop + Math.round(bandHeight * 0.62)

  // The 16-note bottom row is the reference grid. Each row above has notes at
  // the binary midpoint of two siblings below: parents always at the geometric
  // midpoint of their two children, all the way up. With innerWidth fixed and
  // notes at (i + 0.5) × innerWidth / count, this is exact at every level.
  const rowPositions = ROWS.map((row, ri) => {
    const bandTop = margin + ri * bandHeight
    const noteY = bandNoteY(bandTop)
    // Per-row x-nudge for the eighth row so its stems sit slightly right of
    // the binary midpoint. Lines feeding in track the new x.
    const rowShift = row.value === 'eighth' ? 6
      : row.value === 'quarter' ? 6
      : row.value === 'half' ? 4
      : row.value === 'whole' ? 4
      : 0
    const xs: number[] = Array.from({ length: row.count }, (_, i) =>
      noteAreaX + ((i + 0.5) * innerWidth) / row.count + rowShift,
    )
    return { row, ri, noteY, xs }
  })

  const linkColor = '#9A8F7E'
  const linkStroke = Math.max(1, Math.round(0.9 * T.scale))
  const noteheadHalf = T.noteheadHalfHeight

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Note-value pyramid: whole halves into halves, quarters, eighths, sixteenths'}
      >
        {/* Connecting V-lines drawn FIRST so they sit behind notes/stems. Each
            child connects to its parent (floor(childIdx / 2)). Lines start
            below parent's notehead and end above the child's stem-top
            (i.e. above any beam) so they read as binary-tree branches. */}
        {rowPositions.slice(1).map((cur, idx) => {
          const parent = rowPositions[idx]
          // V apex anchored at the parent's NOTEHEAD CENTER (xs - stemXOffset
          // since notes are rendered shifted left to put stems at xs).
          // Each child line lands at the CHILD'S STEM (xs) so the line
          // continues into the stem visibly.
          const parentDx = -T.stemXOffset
          const childStemDx = 0
          const startY = parent.noteY + noteheadHalf + Math.round(10 * T.scale)
          const endY = cur.noteY - T.stemLength - Math.round(12 * T.scale)
          return (
            <g key={`links-${cur.ri}`}>
              {cur.xs.map((cx, ci) => {
                const px = parent.xs[Math.floor(ci / 2)]
                return (
                  <line
                    key={`lk-${cur.ri}-${ci}`}
                    x1={px + parentDx}
                    y1={startY}
                    x2={cx + childStemDx}
                    y2={endY}
                    stroke={linkColor}
                    strokeWidth={linkStroke}
                  />
                )
              })}
            </g>
          )
        })}

        {/* Per-row content: label on the left + beams + notes */}
        {rowPositions.map(({ row, ri, noteY, xs }) => {
          const stemTopY = noteY - T.stemLength
          // Label sits left of the pyramid, vertically aligned with the notehead.
          return (
            <g key={row.value}>
              <text
                x={margin + labelGutter - Math.round(28 * T.scale)}
                y={noteY}
                textAnchor="end"
                dominantBaseline="central"
              >
                <tspan
                  fontSize={Math.round(T.labelFontSize * 1.35)}
                  fontFamily={'var(--font-cormorant), serif'}
                  fill={T.ink}
                  fontWeight={500}
                >
                  {row.word}
                </tspan>
                <tspan
                  fontSize={Math.round(T.labelFontSize * 1.15)}
                  fontFamily={T.fontLabel}
                  fill={T.highlightAccent}
                  fontWeight={600}
                  dx={Math.round(10 * T.scale)}
                >
                  {row.fraction}
                </tspan>
              </text>

              {/* Notes are shifted LEFT by stemXOffset so each note's stem
                  lands exactly at the V-line endpoint (xs[i]). Lines stay put;
                  noteheads move so visually the stem continues the line. */}
              {(() => {
                const shifted = xs.map(x => x - T.stemXOffset)
                const beamGroupsShifted: number[][] = []
                if (row.beamGroup > 0) {
                  for (let g = 0; g < row.count; g += row.beamGroup) {
                    beamGroupsShifted.push(shifted.slice(g, g + row.beamGroup))
                  }
                }
                return (
                  <>
                    {beamGroupsShifted.map((groupXs, gi) => (
                      <Beam
                        key={`beam-${ri}-${gi}`}
                        noteXs={groupXs}
                        beamY={stemTopY}
                        beamCount={row.beamCount}
                        stemDirection="up"
                        T={T}
                      />
                    ))}
                    {shifted.map((x, i) => (
                      <RhythmicNote
                        key={`n-${ri}-${i}`}
                        value={row.value}
                        x={x}
                        y={noteY}
                        T={T}
                        stemDirection="up"
                        noFlag={row.beamGroup > 0}
                      />
                    ))}
                  </>
                )
              })()}
            </g>
          )
        })}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
