'use client'

import React from 'react'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { Caption } from './primitives/Caption'

interface VibratingStringDiagramProps {
  size?: LearnSize
  caption?: string
}

export function VibratingStringDiagram({
  size = 'inline',
  caption,
}: VibratingStringDiagramProps) {
  const T = tokensFor(size)

  const margin = Math.round(40 * T.scale + 16)
  const innerWidth = Math.max(420, T.keyboardWhiteKeyWidth * 7 + 80)
  const innerHeight = Math.round(220 * T.scale + 40)
  const totalW = innerWidth + 2 * margin
  const totalH = innerHeight + 2 * margin

  // String anchor points (left and right ends)
  const stringStartX = margin + 60
  const stringEndX = margin + innerWidth - 60
  const stringY = margin + innerHeight / 2
  const stringMidX = (stringStartX + stringEndX) / 2

  // Vibration amplitude (visual). Generous so the vibration is visually obvious
  // even at small sizes.
  const vibAmp = Math.round(48 * T.scale)

  // Two curved string positions: one above, one below (showing vibration extent)
  const stringUp = `M ${stringStartX} ${stringY} Q ${stringMidX} ${stringY - vibAmp}, ${stringEndX} ${stringY}`
  const stringDown = `M ${stringStartX} ${stringY} Q ${stringMidX} ${stringY + vibAmp}, ${stringEndX} ${stringY}`

  // Anchors: small filled rectangles at each end (the bridge/nut)
  const anchorW = 8
  const anchorH = 24

  // Concentric sound wave arcs radiating from the midpoint of the string
  const arcCenterX = stringMidX
  const arcCenterY = stringY
  const numArcs = 4
  const arcs: { r: number; opacity: number }[] = []
  for (let i = 0; i < numArcs; i++) {
    const r = vibAmp * 2 + (i + 1) * Math.round(40 * T.scale)
    const opacity = 0.6 - i * 0.12  // fade out with distance
    arcs.push({ r, opacity })
  }

  // The arcs are drawn as full circles dashed, but only the parts that are within
  // the diagram bounds will be visible. Use stroke-dasharray to make them feel
  // wave-like rather than solid.

  const stringColor = T.ink
  const ghostStringColor = T.inkSubtle
  const waveColor = T.highlightAccent

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'A vibrating string with sound waves propagating outward'}
      >
        {/* Concentric sound-wave arcs (rendered behind the string) */}
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={arcCenterX} cy={arcCenterY} r={arc.r}
            fill="none"
            stroke={waveColor}
            strokeWidth={1.2}
            strokeDasharray="6 6"
            opacity={arc.opacity}
          />
        ))}

        {/* Anchors at each end */}
        <rect
          x={stringStartX - anchorW / 2} y={stringY - anchorH / 2}
          width={anchorW} height={anchorH}
          fill={stringColor}
        />
        <rect
          x={stringEndX - anchorW / 2} y={stringY - anchorH / 2}
          width={anchorW} height={anchorH}
          fill={stringColor}
        />

        {/* Ghost string position (the other extreme of the vibration) */}
        <path
          d={stringDown}
          fill="none" stroke={ghostStringColor} strokeWidth={1.4}
          strokeDasharray="3 3" opacity={0.5}
        />

        {/* The main string, displaced upward */}
        <path
          d={stringUp}
          fill="none" stroke={stringColor} strokeWidth={2.2}
        />

        {/* Labels */}
        <text
          x={arcCenterX} y={margin + 8}
          fontSize={T.labelFontSize} fontFamily={T.fontLabel}
          fill={waveColor} textAnchor="middle" fontWeight={500}
        >
          sound waves
        </text>

        <text
          x={stringStartX - 8} y={stringY + 4}
          fontSize={T.labelFontSize} fontFamily={T.fontLabel}
          fill={stringColor} textAnchor="end" fontWeight={500}
        >
          vibrating string
        </text>
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
