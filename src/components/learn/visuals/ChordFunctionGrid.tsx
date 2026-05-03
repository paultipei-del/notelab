'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

export interface ChordFunctionGridCell {
  chord: string
  romanNumeral: string
  function: 'I' | 'IV' | 'V'
}

interface ChordFunctionGridProps {
  /** Exactly 12 cells in playing order. */
  cells: ChordFunctionGridCell[]
  /** Show 1–12 bar numbers above each cell. Default true. */
  showBarNumbers?: boolean
  size?: LearnSize
  caption?: string
}

const FUNCTION_BG: Record<ChordFunctionGridCell['function'], string> = {
  I: '#FDFAF3',
  IV: '#FAECE7',
  V: '#F5D5C8',
}

const FUNCTION_INK: Record<ChordFunctionGridCell['function'], string> = {
  I: '#1A1A18',
  IV: '#B5402A',
  V: '#A03316',
}

/**
 * 12-bar blues grid: 3 rows × 4 columns. Each cell color-codes the chord
 * function (I = cream, IV = light coral, V = stronger coral) so the AABB
 * shape of the form pops at a glance. Silent — purely structural diagram.
 */
export function ChordFunctionGrid({
  cells,
  showBarNumbers = true,
  size = 'inline',
  caption,
}: ChordFunctionGridProps) {
  const T = tokensFor(size)

  const chordFont = T.size === 'small' ? 18 : T.size === 'hero' ? 26 : 22
  const rnFont = T.size === 'small' ? 12 : T.size === 'hero' ? 16 : 14
  const barNumberFont = T.size === 'small' ? 9 : T.size === 'hero' ? 12 : 11

  return (
    <figure
      style={{
        margin: '24px auto',
        width: '100%',
        maxWidth: 720,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
        }}
      >
        {cells.map((cell, i) => {
          const bg = FUNCTION_BG[cell.function]
          const ink = FUNCTION_INK[cell.function]
          return (
            <div
              key={`bar-${i}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 84,
                padding: '10px 6px',
                background: bg,
                border: '1px solid #1A1A18',
                marginLeft: i % 4 === 0 ? 0 : -1,
                marginTop: i < 4 ? 0 : -1,
                textAlign: 'center',
              }}
            >
              {showBarNumbers && (
                <div
                  style={{
                    fontFamily: T.fontLabel,
                    fontSize: barNumberFont,
                    color: T.inkSubtle,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Bar {i + 1}
                </div>
              )}
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: chordFont,
                  fontWeight: 500,
                  color: ink,
                  lineHeight: 1.1,
                  marginTop: showBarNumbers ? 4 : 0,
                }}
              >
                {cell.chord}
              </div>
              <div
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: rnFont,
                  color: T.inkMuted,
                  marginTop: 2,
                }}
              >
                {cell.romanNumeral}
              </div>
            </div>
          )
        })}
      </div>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
