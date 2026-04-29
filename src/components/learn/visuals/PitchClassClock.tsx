'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface PitchClassClockProps {
  size?: LearnSize
  /** Pitch classes to highlight in coral. Accepts either spelling: e.g. 'C#' or 'Db'. */
  highlightedPitchClasses?: string[]
  /** Show only sharp names ('C#'), flat names ('Db'), or both stacked. Default 'sharp'. */
  spelling?: 'sharp' | 'flat' | 'both'
  /**
   * Pair of adjacent pitch classes to annotate with a "½ step" coral arc.
   * Defaults to ['C', 'C#']. Pass `null` to disable the annotation entirely.
   */
  annotateHalfStepBetween?: [string, string] | null
  /** Show the small clockwise direction indicator inside the circle. Default true. */
  showDirectionIndicator?: boolean
  caption?: string
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

function toUnicode(name: string): string {
  return name.replace('#', '\u266F').replace('b', '\u266D')
}

function nameToIndex(name: string): number {
  const s = SHARP_NAMES.indexOf(name)
  if (s >= 0) return s
  const f = FLAT_NAMES.indexOf(name)
  return f
}

export function PitchClassClock({
  size = 'inline',
  highlightedPitchClasses = [],
  spelling = 'sharp',
  annotateHalfStepBetween = ['C', 'C#'],
  showDirectionIndicator = true,
  caption,
}: PitchClassClockProps) {
  const T = tokensFor(size)

  // Normalize highlight inputs (either spelling) to indices 0..11
  const highlights = new Set<number>()
  for (const h of highlightedPitchClasses) {
    const idx = nameToIndex(h)
    if (idx >= 0) highlights.add(idx)
  }

  const margin = Math.round(28 * T.scale + 8)
  // Circle bigger than before (was 120 * scale) so the labels have more room
  // and the half-step annotation can sit clear of the pitch labels.
  const radius = Math.round(150 * T.scale)
  const labelOffset = Math.round(30 * T.scale)
  const labelRadius = radius + labelOffset

  const fontSize = size === 'small' ? 14 : size === 'hero' ? 24 : 19
  const dualFontSize = size === 'small' ? 11 : size === 'hero' ? 17 : 13
  const annotationFontSize = size === 'small' ? 11 : size === 'hero' ? 15 : 13

  // Half-step annotation geometry. Place the arc just OUTSIDE the main circle
  // (between circle and pitch labels) and the "½ step" label OUTSIDE the pitch
  // labels at the angular midpoint between the two annotated pitches — that
  // angle has no pitch label of its own, so the text reads cleanly.
  const halfStepLabelExtension = Math.round(26 * T.scale)
  const annotation = (() => {
    if (!annotateHalfStepBetween) return null
    const a = nameToIndex(annotateHalfStepBetween[0])
    const b = nameToIndex(annotateHalfStepBetween[1])
    if (a < 0 || b < 0 || a === b) return null
    const cwDist = ((b - a) % 12 + 12) % 12
    const sweep = 1
    const angleA = angleAt(a)
    const angleB = angleAt(b)
    const arcRadius = radius + Math.round(8 * T.scale)
    const midAngle = angleA + (cwDist * Math.PI / 12)
    const halfStepLabelRadius = labelRadius + halfStepLabelExtension
    return { angleA, angleB, sweep, arcRadius, midAngle, halfStepLabelRadius }
  })()

  // SVG total size accounts for the half-step label which extends beyond the
  // pitch labels at its angle.
  const halfStepTextWidth = annotationFontSize * 4 // approximate "½ step" half-width buffer
  const outerExtent = annotation
    ? Math.max(labelRadius + Math.round(8 * T.scale), annotation.halfStepLabelRadius + halfStepTextWidth)
    : labelRadius + Math.round(8 * T.scale)
  const center = outerExtent + margin
  const totalSize = (outerExtent + margin) * 2

  const tickInner = radius - Math.round(5 * T.scale)
  const tickOuter = radius + Math.round(2 * T.scale)
  const tickStroke = Math.max(1, T.staffLineStroke)

  // C at top (12 o'clock) → angle = -π/2; advance clockwise (positive y is down in SVG)
  function angleAt(i: number) { return -Math.PI / 2 + (i * 2 * Math.PI) / 12 }

  // Now that center is known, compute concrete arc path + label coordinates
  const annotationGeom = annotation ? (() => {
    const sx = center + annotation.arcRadius * Math.cos(annotation.angleA)
    const sy = center + annotation.arcRadius * Math.sin(annotation.angleA)
    const ex = center + annotation.arcRadius * Math.cos(annotation.angleB)
    const ey = center + annotation.arcRadius * Math.sin(annotation.angleB)
    const path = `M ${sx} ${sy} A ${annotation.arcRadius} ${annotation.arcRadius} 0 0 ${annotation.sweep} ${ex} ${ey}`
    const labelX = center + annotation.halfStepLabelRadius * Math.cos(annotation.midAngle)
    const labelY = center + annotation.halfStepLabelRadius * Math.sin(annotation.midAngle)
    return { path, labelX, labelY }
  })() : null

  // Direction indicator: small "↻" near the top, inside the circle
  const dirIndicator = showDirectionIndicator
    ? {
        x: center,
        y: center - Math.round(radius * 0.55),
        size: Math.round(annotationFontSize * 1.7),
      }
    : null

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalSize, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalSize, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Pitch class clock — twelve pitch classes arranged in a circle'}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={T.staffLineColor}
          strokeWidth={T.staffLineStroke}
        />

        {Array.from({ length: 12 }, (_, i) => {
          const a = angleAt(i)
          const x1 = center + tickInner * Math.cos(a)
          const y1 = center + tickInner * Math.sin(a)
          const x2 = center + tickOuter * Math.cos(a)
          const y2 = center + tickOuter * Math.sin(a)
          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={T.staffLineColor}
              strokeWidth={tickStroke}
            />
          )
        })}

        {Array.from({ length: 12 }, (_, i) => {
          const a = angleAt(i)
          const x = center + labelRadius * Math.cos(a)
          const y = center + labelRadius * Math.sin(a)
          const isHighlighted = highlights.has(i)
          const fill = isHighlighted ? T.highlightAccent : T.ink
          const fontWeight = isHighlighted ? 600 : 400
          const sharpDisplay = toUnicode(SHARP_NAMES[i])
          const flatDisplay = toUnicode(FLAT_NAMES[i])
          const sameName = SHARP_NAMES[i] === FLAT_NAMES[i]

          if (spelling === 'both' && !sameName) {
            return (
              <g key={`label-${i}`} fontFamily={T.fontLabel}>
                <text
                  x={x}
                  y={y - dualFontSize * 0.55}
                  fontSize={dualFontSize}
                  fill={fill}
                  fontWeight={fontWeight}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {sharpDisplay}
                </text>
                <text
                  x={x}
                  y={y + dualFontSize * 0.55}
                  fontSize={dualFontSize}
                  fill={fill}
                  fontWeight={fontWeight}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {flatDisplay}
                </text>
              </g>
            )
          }

          const display = spelling === 'flat' ? flatDisplay : sharpDisplay
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              fontSize={fontSize}
              fontFamily={T.fontLabel}
              fill={fill}
              fontWeight={fontWeight}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {display}
            </text>
          )
        })}

        {annotationGeom && (
          <g>
            <path
              d={annotationGeom.path}
              fill="none"
              stroke={T.highlightAccent}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
            <text
              x={annotationGeom.labelX}
              y={annotationGeom.labelY}
              fontSize={annotationFontSize}
              fontFamily={T.fontLabel}
              fill={T.highlightAccent}
              fontWeight={500}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {'\u00BD step'}
            </text>
          </g>
        )}

        {dirIndicator && (
          <text
            x={dirIndicator.x}
            y={dirIndicator.y}
            fontSize={dirIndicator.size}
            fontFamily={T.fontLabel}
            fill={T.highlightAccent}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {'\u21BB'}
          </text>
        )}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
