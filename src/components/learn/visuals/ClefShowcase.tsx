'use client'

import React from 'react'
import { Staff, Caption } from './primitives'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'

interface ClefShowcaseProps {
  clef: 'treble' | 'bass'
  /** Show a coral arrow + label pointing to the anchor line. Default true. */
  showAnchorAnnotation?: boolean
  size?: LearnSize
  caption?: string
}

export function ClefShowcase({
  clef,
  showAnchorAnnotation = true,
  size = 'hero',
  caption,
}: ClefShowcaseProps) {
  const T = tokensFor(size)

  const margin = Math.round(28 * T.scale + 12)
  const staffWidth = Math.round(220 * T.scale)
  const annotationGutter = showAnchorAnnotation ? Math.round(120 * T.scale) : 0
  const staffX = margin
  const staffY = margin + Math.round(20 * T.scale)
  const staffBottomY = staffY + 8 * T.step
  const totalH = staffBottomY + margin
  const totalW = staffX + staffWidth + annotationGutter + margin

  // Anchor line: treble = G line (line 2 from bottom = SVG line idx 3)
  //             bass   = F line (line 4 from bottom = SVG line idx 1)
  const anchorSvgIdx = clef === 'treble' ? 3 : 1
  const anchorY = lineY(staffY, anchorSvgIdx, T)
  const anchorLabel = clef === 'treble' ? 'G line' : 'F line'

  const arrowStartX = staffX + staffWidth + Math.round(8 * T.scale)
  const arrowEndX = staffX + staffWidth + Math.round(60 * T.scale)
  const labelTextX = arrowEndX + Math.round(8 * T.scale)

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `${clef === 'treble' ? 'Treble' : 'Bass'} clef on a five-line staff`}
      >
        <Staff
          clef={clef}
          x={staffX}
          y={staffY}
          width={staffWidth}
          T={T}
        />

        {showAnchorAnnotation && (
          <g>
            <line
              x1={arrowStartX}
              y1={anchorY}
              x2={arrowEndX}
              y2={anchorY}
              stroke={T.highlightAccent}
              strokeWidth={1.4}
            />
            {/* Arrowhead */}
            <polyline
              points={`${arrowStartX + 6},${anchorY - 4} ${arrowStartX},${anchorY} ${arrowStartX + 6},${anchorY + 4}`}
              fill="none"
              stroke={T.highlightAccent}
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
            <text
              x={labelTextX}
              y={anchorY}
              fontSize={T.labelFontSize}
              fontFamily={T.fontLabel}
              fill={T.highlightAccent}
              fontWeight={500}
              dominantBaseline="central"
            >
              {anchorLabel}
            </text>
          </g>
        )}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
