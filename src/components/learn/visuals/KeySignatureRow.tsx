'use client'

import React from 'react'
import { KeySignatureStaff } from './KeySignatureStaff'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

export interface KeySignatureRowEntry {
  /** Number of accidentals. Negative = flats, positive = sharps. */
  accidentals: number
  /** Short label shown above this staff. */
  label: string
  /** Optional second label below (e.g. for relative-minor pairs). */
  sublabel?: string
}

interface KeySignatureRowProps {
  entries: KeySignatureRowEntry[]
  /** 'row' for compact horizontal, 'wrap' for multi-row grid (≥4 entries). */
  layout?: 'row' | 'wrap'
  size?: LearnSize
  caption?: string
}

export function KeySignatureRow({
  entries,
  layout = 'row',
  size = 'small',
  caption,
}: KeySignatureRowProps) {
  const T = tokensFor(size)
  const labelFont = T.size === 'small' ? 13 : T.size === 'hero' ? 16 : 14
  const sublabelFont = T.size === 'small' ? 11 : T.size === 'hero' ? 13 : 12

  const containerStyle: React.CSSProperties = layout === 'wrap'
    ? {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 16,
        justifyItems: 'center',
        alignItems: 'start',
      }
    : {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 14,
      }

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <div style={containerStyle}>
        {entries.map((entry, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: T.fontLabel,
                fontSize: labelFont,
                color: T.ink,
                fontWeight: 600,
              }}
            >
              {entry.label}
            </div>
            <KeySignatureStaff accidentals={entry.accidentals} size={size} />
            {entry.sublabel && (
              <div
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: sublabelFont,
                  color: T.inkMuted,
                }}
              >
                {entry.sublabel}
              </div>
            )}
          </div>
        ))}
      </div>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
