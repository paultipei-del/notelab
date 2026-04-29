'use client'

import React from 'react'
import { Staff, Caption } from './primitives'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'

interface AnnotatedStaffProps {
  variant: 'empty' | 'labeled'
  size?: LearnSize
  caption?: string
}

export function AnnotatedStaff({
  variant,
  size = 'inline',
  caption,
}: AnnotatedStaffProps) {
  const T = tokensFor(size)

  const margin = Math.round(20 * T.scale + 8)
  const baseStaffWidth = Math.round(280 * T.scale)
  // Labeled variant uses two label columns (lines column + spaces column further
  // right) to avoid alternating-row overlap when labels stacked vertically.
  const linesColX = baseStaffWidth + Math.round(28 * T.scale)
  const spacesColX = linesColX + Math.round(96 * T.scale)
  const labelGutter = variant === 'labeled'
    ? spacesColX + Math.round(80 * T.scale) - baseStaffWidth
    : 0
  const staffX = margin
  const staffWidth = baseStaffWidth
  const staffY = margin + Math.round(20 * T.scale)
  const staffBottomY = staffY + 8 * T.step
  const totalH = staffBottomY + margin
  const totalW = staffX + staffWidth + labelGutter + margin

  // staffPos convention: pos 0 = top staff line; user-facing numbering is bottom-up
  // (line 1 = bottom, line 5 = top). spaces fall between lines.
  const userToSvgLineIdx = (userLineNum: number) => 5 - userLineNum
  const spaceY = (userSpaceNum: number) => {
    const lowerLineIdx = userToSvgLineIdx(userSpaceNum)
    const upperLineIdx = userToSvgLineIdx(userSpaceNum + 1)
    return (lineY(staffY, lowerLineIdx, T) + lineY(staffY, upperLineIdx, T)) / 2
  }

  // Absolute x positions (computed inside the SVG — staffX-relative).
  const lineLeaderEndX = staffX + linesColX
  const lineLabelTextX = lineLeaderEndX + Math.round(8 * T.scale)
  const spaceLeaderEndX = staffX + spacesColX
  const spaceLabelTextX = spaceLeaderEndX + Math.round(8 * T.scale)

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? (variant === 'empty' ? 'Empty five-line staff' : 'Five-line staff with line and space labels')}
      >
        <Staff
          clef="treble"
          x={staffX}
          y={staffY}
          width={staffWidth}
          showClef={false}
          T={T}
        />

        {variant === 'labeled' && (
          <g>
            {/* Line labels — solid coral leader, label on inner column */}
            {[1, 2, 3, 4, 5].map((n) => {
              const y = lineY(staffY, userToSvgLineIdx(n), T)
              return (
                <g key={`line-${n}`}>
                  <line
                    x1={staffX + staffWidth}
                    y1={y}
                    x2={lineLeaderEndX}
                    y2={y}
                    stroke={T.highlightAccent}
                    strokeWidth={1}
                  />
                  <text
                    x={lineLabelTextX}
                    y={y}
                    fontSize={T.labelFontSize}
                    fontFamily={T.fontLabel}
                    fill={T.ink}
                    dominantBaseline="central"
                  >
                    {`line ${n}`}
                  </text>
                </g>
              )
            })}
            {/* Space labels — dashed coral leader, label on outer column */}
            {[1, 2, 3, 4].map((n) => {
              const y = spaceY(n)
              return (
                <g key={`space-${n}`}>
                  <line
                    x1={staffX + staffWidth}
                    y1={y}
                    x2={spaceLeaderEndX}
                    y2={y}
                    stroke={T.highlightAccent}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                  <text
                    x={spaceLabelTextX}
                    y={y}
                    fontSize={T.labelFontSize}
                    fontFamily={T.fontLabel}
                    fill={T.inkMuted}
                    dominantBaseline="central"
                  >
                    {`space ${n}`}
                  </text>
                </g>
              )
            })}
          </g>
        )}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
