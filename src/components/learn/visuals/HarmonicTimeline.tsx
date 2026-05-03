'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

export interface HarmonicTimelineRegion {
  /** Width as a fraction of total. Values across all regions should sum to 1. */
  width: number
  /** Section name shown inside the bar (e.g. "Exposition"). */
  sectionLabel: string
  /** Tonal annotation shown below the bar (e.g. "I → V"). */
  keyLabel: string
  /** Visual variant. Defaults to 'tonic'. */
  variant?: 'tonic' | 'dominant' | 'unstable'
}

interface HarmonicTimelineProps {
  regions: HarmonicTimelineRegion[]
  size?: LearnSize
  caption?: string
}

const VARIANT_BG: Record<NonNullable<HarmonicTimelineRegion['variant']>, string> = {
  tonic: '#FDFAF3',
  dominant: '#FAECE7',
  unstable: '#FBF1EC',
}

const VARIANT_LABEL_COLOR: Record<NonNullable<HarmonicTimelineRegion['variant']>, string> = {
  tonic: '#1A1A18',
  dominant: '#B5402A',
  unstable: '#1A1A18',
}

/**
 * Horizontal "tonal journey" timeline. Used for sonata-form's harmonic map:
 * a single bar divided into proportional regions, each labeled with a section
 * name (inside the bar) and a key annotation (below the bar). Stable regions
 * read as cream; tonally tense regions take a coral wash; unstable / wandering
 * regions get a faint diagonal stripe pattern so they're visually distinct
 * even from the dominant variant.
 */
export function HarmonicTimeline({
  regions,
  size = 'inline',
  caption,
}: HarmonicTimelineProps) {
  const T = tokensFor(size)

  const sectionFont = T.size === 'small' ? 16 : T.size === 'hero' ? 22 : 19
  const keyFont = T.size === 'small' ? 11 : T.size === 'hero' ? 14 : 12
  const barHeight = T.size === 'small' ? 56 : T.size === 'hero' ? 84 : 70

  // Stripe pattern for "unstable" regions — uniform diagonal lines, very low
  // contrast so they read as texture, not noise.
  const stripeId = React.useId()

  return (
    <figure
      style={{
        margin: '24px auto',
        width: '100%',
        maxWidth: 720,
      }}
    >
      <svg
        viewBox={`0 0 1000 ${barHeight + keyFont * 1.6 + 12}`}
        width="100%"
        style={{ display: 'block', height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Harmonic timeline'}
      >
        <defs>
          <pattern
            id={stripeId}
            patternUnits="userSpaceOnUse"
            width={10}
            height={10}
            patternTransform="rotate(45)"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={10}
              stroke="#E8C8B5"
              strokeWidth={2}
              opacity={0.55}
            />
          </pattern>
        </defs>

        {(() => {
          let cursor = 0
          return regions.map((r, i) => {
            const x = cursor * 1000
            const w = r.width * 1000
            cursor += r.width
            const variant = r.variant ?? 'tonic'
            const bg = VARIANT_BG[variant]
            const labelColor = VARIANT_LABEL_COLOR[variant]
            return (
              <g key={`region-${i}`}>
                <rect
                  x={x}
                  y={0}
                  width={w}
                  height={barHeight}
                  fill={bg}
                  stroke="#1A1A18"
                  strokeWidth={1}
                />
                {variant === 'unstable' && (
                  <rect
                    x={x + 0.5}
                    y={0.5}
                    width={w - 1}
                    height={barHeight - 1}
                    fill={`url(#${stripeId})`}
                  />
                )}
                <text
                  x={x + w / 2}
                  y={barHeight / 2}
                  fontSize={sectionFont}
                  fontFamily={T.fontDisplay}
                  fontWeight={500}
                  fill={labelColor}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {r.sectionLabel}
                </text>
                <text
                  x={x + w / 2}
                  y={barHeight + keyFont * 0.9 + 6}
                  fontSize={keyFont}
                  fontFamily={T.fontLabel}
                  fontStyle="italic"
                  fill={T.inkMuted}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {r.keyLabel}
                </text>
              </g>
            )
          })
        })()}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
