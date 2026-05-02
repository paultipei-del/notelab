'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface FunctionalTriangleProps {
  /** 'major' uses I, IV, V; 'minor' uses i, iv, V (V stays major in tonal minor). */
  mode?: 'major' | 'minor'
  /** Optionally highlight one function in coral. */
  highlightedFunction?: 'tonic' | 'subdominant' | 'dominant'
  size?: LearnSize
  caption?: string
}

export function FunctionalTriangle({
  mode = 'major',
  highlightedFunction,
  size = 'inline',
  caption,
}: FunctionalTriangleProps) {
  const T = tokensFor(size)

  const tonic = mode === 'major' ? 'I' : 'i'
  const subdominant = mode === 'major' ? 'IV' : 'iv'
  const dominant = 'V'

  // SVG geometry — centered diagram, 480 wide × 380 tall
  const width = 480
  const height = 380
  const cx = width / 2
  const nodeR = 50
  const tonicY = 290
  const sideY = 110
  const sdX = 110
  const dmX = width - 110

  const numeralFont = 38
  const labelFont = 14
  const sublabelFont = 12

  type FuncKey = 'tonic' | 'subdominant' | 'dominant'
  const isHl = (f: FuncKey) => highlightedFunction === f

  const node = (
    fn: FuncKey,
    cxN: number,
    cyN: number,
    numeral: string,
    label: string,
    sublabel: string,
  ) => (
    <g>
      <circle
        cx={cxN}
        cy={cyN}
        r={nodeR}
        fill={isHl(fn) ? T.highlightFill : T.bgPaper}
        stroke={isHl(fn) ? T.highlightAccent : T.ink}
        strokeWidth={1.6}
      />
      <text
        x={cxN}
        y={cyN}
        fontSize={numeralFont}
        fontFamily={T.fontDisplay}
        fontWeight={600}
        fill={T.ink}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {numeral}
      </text>
      <text
        x={cxN}
        y={cyN + nodeR + 22}
        fontSize={labelFont}
        fontFamily={T.fontLabel}
        fill={T.ink}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
      <text
        x={cxN}
        y={cyN + nodeR + 22 + sublabelFont + 4}
        fontSize={sublabelFont}
        fontFamily={T.fontLabel}
        fill={T.inkMuted}
        fontStyle="italic"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {sublabel}
      </text>
    </g>
  )

  // Curved arrow path between two centers, offset from node radius.
  const curvedArrow = (
    x1: number, y1: number,
    x2: number, y2: number,
    curve: number = 60,
    color: string = T.highlightAccent,
    dashed: boolean = false,
    strokeW: number = 2,
  ) => {
    // Start/end on the edge of the node, not the center
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / len
    const uy = dy / len
    const sx = x1 + ux * (nodeR + 4)
    const sy = y1 + uy * (nodeR + 4)
    const ex = x2 - ux * (nodeR + 12)
    const ey = y2 - uy * (nodeR + 12)
    // Control point: midpoint shifted perpendicular by `curve`
    const mx = (sx + ex) / 2
    const my = (sy + ey) / 2
    const px = -uy
    const py = ux
    const cxC = mx + px * curve
    const cyC = my + py * curve
    // Arrowhead at end, tangent to curve direction
    const tdx = ex - cxC
    const tdy = ey - cyC
    const tlen = Math.sqrt(tdx * tdx + tdy * tdy) || 1
    const tux = tdx / tlen
    const tuy = tdy / tlen
    const tpx = -tuy
    const tpy = tux
    const ahLen = 14
    const ahHalf = 6
    const baseX = ex - tux * ahLen
    const baseY = ey - tuy * ahLen
    const leftX = baseX + tpx * ahHalf
    const leftY = baseY + tpy * ahHalf
    const rightX = baseX - tpx * ahHalf
    const rightY = baseY - tpy * ahHalf
    return (
      <g>
        <path
          d={`M ${sx} ${sy} Q ${cxC} ${cyC} ${baseX} ${baseY}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={dashed ? '6 6' : undefined}
        />
        <polygon
          points={`${ex},${ey} ${leftX},${leftY} ${rightX},${rightY}`}
          fill={color}
        />
      </g>
    )
  }

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', maxWidth: width, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? `Functional triangle: ${tonic}, ${subdominant}, ${dominant}`}
      >
        {/* Arrows: drawn first so nodes paint on top */}
        {/* IV → V (subdominant to dominant — moving toward tension) */}
        {curvedArrow(sdX, sideY, dmX, sideY, -40, T.highlightAccent)}
        {/* V → I (dominant to tonic — strongest resolution) */}
        {curvedArrow(dmX, sideY, cx, tonicY, 40, T.highlightAccent, false, 2.4)}
        {/* IV → I (plagal — softer resolution). Curves out to the LEFT of
            the IV–I axis. */}
        {curvedArrow(sdX, sideY, cx, tonicY, -50, T.inkMuted, false, 1.8)}
        {/* I → IV (less common, dashed). The arrow runs in the opposite
            direction, so reusing the same curve sign would land it on the
            same physical side as IV → I and the two arrows would overlap.
            Flipping the sign here puts this arrow on the RIGHT of the axis
            so the two-way motion reads cleanly. */}
        {curvedArrow(cx, tonicY, sdX, sideY, -50, T.inkSubtle, true, 1.4)}

        {node('subdominant', sdX, sideY, subdominant, 'Subdominant', 'departure')}
        {node('dominant', dmX, sideY, dominant, 'Dominant', 'tension')}
        {node('tonic', cx, tonicY, tonic, 'Tonic', 'home / rest')}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
