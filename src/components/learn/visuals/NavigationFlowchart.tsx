import React from 'react'
import { Caption } from './primitives/Caption'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

export type NavigationStepVariant = 'normal' | 'highlighted' | 'destination'

export interface NavigationStep {
  label: string
  /** Italic supporting line below the main label (e.g. 'D.S. al Coda'). */
  sublabel?: string
  variant?: NavigationStepVariant
}

export interface NavigationJump {
  /** Index in the sections array to jump FROM. */
  fromIdx: number
  /** Index to jump TO. */
  toIdx: number
  /** Label rendered above (for forward jumps) or below (for backward). */
  label: string
}

interface NavigationFlowchartProps {
  sections: NavigationStep[]
  jumps?: NavigationJump[]
  size?: LearnSize
  caption?: string
}

/**
 * Horizontal flowchart of musical-form sections with directional jumps.
 * Used for D.C., D.S., al Coda, and similar repeat-and-navigate
 * instructions. Forward jumps draw straight arrows along the row;
 * backward jumps loop above the row of boxes.
 */
export function NavigationFlowchart({
  sections,
  jumps = [],
  size = 'inline',
  caption,
}: NavigationFlowchartProps) {
  const T = tokensFor(size)

  const boxW = Math.round(120 * T.scale + 24)
  const boxH = Math.round(54 * T.scale + 16)
  const boxGap = Math.round(16 * T.scale + 4)
  const padX = 24
  const loopHeight = Math.round(40 * T.scale + 12)

  const totalBoxesW = sections.length * boxW + (sections.length - 1) * boxGap
  const totalW = totalBoxesW + padX * 2

  const hasBackwardJump = jumps.some(j => j.toIdx <= j.fromIdx)
  const hasForwardJump = jumps.some(j => j.toIdx > j.fromIdx + 1)

  const padTop = hasBackwardJump ? loopHeight + 22 : 18
  const padBottom = hasForwardJump ? loopHeight + 22 : 18
  const totalH = padTop + boxH + padBottom

  const boxX = (i: number): number => padX + i * (boxW + boxGap)
  const boxCenterX = (i: number): number => boxX(i) + boxW / 2
  const boxTopY = padTop
  const boxBottomY = padTop + boxH
  const boxCenterY = padTop + boxH / 2

  const colorFor = (variant: NavigationStepVariant | undefined) => {
    if (variant === 'highlighted') return {
      stroke: T.highlightAccent, fill: '#FAECE7', textColor: T.ink,
    }
    if (variant === 'destination') return {
      stroke: T.ink, fill: '#F4F0E0', textColor: T.ink,
    }
    return { stroke: T.border, fill: '#FAFAFA', textColor: T.ink }
  }

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Section navigation flowchart'}
      >
        <defs>
          <marker
            id="nav-arrow"
            viewBox="0 0 10 10"
            refX="9" refY="5"
            markerWidth="8" markerHeight="8"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill={T.ink} />
          </marker>
          <marker
            id="nav-arrow-coral"
            viewBox="0 0 10 10"
            refX="9" refY="5"
            markerWidth="8" markerHeight="8"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill={T.highlightAccent} />
          </marker>
        </defs>

        {/* Forward connectors between adjacent sections (the linear flow). */}
        {sections.slice(0, -1).map((_, i) => (
          <line
            key={`flow-${i}`}
            x1={boxX(i) + boxW + 2}
            y1={boxCenterY}
            x2={boxX(i + 1) - 4}
            y2={boxCenterY}
            stroke={T.inkSubtle}
            strokeWidth={1}
            markerEnd="url(#nav-arrow)"
          />
        ))}

        {/* Section boxes. */}
        {sections.map((step, i) => {
          const c = colorFor(step.variant)
          return (
            <g key={`box-${i}`}>
              <rect
                x={boxX(i)} y={boxTopY}
                width={boxW} height={boxH}
                rx={6}
                fill={c.fill}
                stroke={c.stroke}
                strokeWidth={step.variant === 'highlighted' ? 1.6 : 1.2}
              />
              <text
                x={boxCenterX(i)}
                y={step.sublabel ? boxCenterY - 8 : boxCenterY}
                fontSize={Math.round(T.labelFontSize + 3)}
                fontFamily={T.fontDisplay}
                fontWeight={500}
                fill={c.textColor}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {step.label}
              </text>
              {step.sublabel && (
                <text
                  x={boxCenterX(i)}
                  y={boxCenterY + 12}
                  fontSize={T.smallLabelFontSize}
                  fontFamily={T.fontLabel}
                  fontStyle="italic"
                  fill={T.inkMuted}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {step.sublabel}
                </text>
              )}
            </g>
          )
        })}

        {/* Jump arrows. Backward jumps loop ABOVE the row; forward jumps
            spanning more than one box loop BELOW the row to avoid the
            adjacent-section connector arrows. */}
        {jumps.map((jump, ji) => {
          const fromX = boxCenterX(jump.fromIdx)
          const toX = boxCenterX(jump.toIdx)
          const isBackward = jump.toIdx <= jump.fromIdx
          const isCoral = isBackward
          const above = isBackward
          const startY = above ? boxTopY : boxBottomY
          const apex = above
            ? startY - loopHeight
            : startY + loopHeight
          const labelY = above ? apex - 6 : apex + 14
          const labelX = (fromX + toX) / 2
          const fromTop = above ? boxTopY - 2 : boxBottomY + 2
          const stroke = isCoral ? T.highlightAccent : T.ink
          const arrowMarker = isCoral ? 'url(#nav-arrow-coral)' : 'url(#nav-arrow)'
          const path = `M ${fromX} ${fromTop}
            C ${fromX} ${apex}, ${toX} ${apex}, ${toX} ${fromTop}`
          return (
            <g key={`jump-${ji}`}>
              <path
                d={path}
                fill="none"
                stroke={stroke}
                strokeWidth={1.4}
                strokeDasharray={isCoral ? undefined : '4 3'}
                markerEnd={arrowMarker}
              />
              <text
                x={labelX}
                y={labelY}
                fontSize={T.smallLabelFontSize}
                fontFamily={T.fontLabel}
                fontStyle="italic"
                fill={isCoral ? T.highlightAccent : T.inkMuted}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {jump.label}
              </text>
            </g>
          )
        })}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
