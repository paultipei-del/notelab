'use client'

import React from 'react'
import { KeySignatureStaff } from './KeySignatureStaff'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface KeySignatureTableProps {
  size?: LearnSize
  caption?: string
}

interface KeyRow {
  accidentals: number
  major: string
  minor: string
}

const ROWS: KeyRow[] = [
  { accidentals: -7, major: 'C♭ major', minor: 'A♭ minor' },
  { accidentals: -6, major: 'G♭ major', minor: 'E♭ minor' },
  { accidentals: -5, major: 'D♭ major', minor: 'B♭ minor' },
  { accidentals: -4, major: 'A♭ major', minor: 'F minor' },
  { accidentals: -3, major: 'E♭ major', minor: 'C minor' },
  { accidentals: -2, major: 'B♭ major', minor: 'G minor' },
  { accidentals: -1, major: 'F major',  minor: 'D minor' },
  { accidentals:  0, major: 'C major',  minor: 'A minor' },
  { accidentals:  1, major: 'G major',  minor: 'E minor' },
  { accidentals:  2, major: 'D major',  minor: 'B minor' },
  { accidentals:  3, major: 'A major',  minor: 'F♯ minor' },
  { accidentals:  4, major: 'E major',  minor: 'C♯ minor' },
  { accidentals:  5, major: 'B major',  minor: 'G♯ minor' },
  { accidentals:  6, major: 'F♯ major', minor: 'D♯ minor' },
  { accidentals:  7, major: 'C♯ major', minor: 'A♯ minor' },
]

function accidentalLabel(n: number): string {
  if (n === 0) return '0'
  return `${Math.abs(n)} ${n > 0 ? '♯' : '♭'}`
}

export function KeySignatureTable({
  size = 'small',
  caption,
}: KeySignatureTableProps) {
  const T = tokensFor(size)
  const labelFont = T.size === 'small' ? 13 : T.size === 'hero' ? 15 : 14
  const headerFont = T.size === 'small' ? 11 : 13

  const cellPad = '10px 14px'
  const rowBorder = `1px solid ${T.border}`

  return (
    <figure style={{ margin: '24px auto', width: '100%', maxWidth: 720 }}>
      <div
        role="table"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(72px, auto) auto auto auto',
          alignItems: 'stretch',
          fontFamily: T.fontLabel,
          fontSize: labelFont,
          color: T.ink,
          background: 'rgba(255, 255, 255, 0.25)',
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: cellPad,
            fontSize: headerFont,
            color: T.inkSubtle,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: rowBorder,
          }}
        >
          Accidentals
        </div>
        <div
          style={{
            padding: cellPad,
            fontSize: headerFont,
            color: T.inkSubtle,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: rowBorder,
          }}
        >
          Key Signature
        </div>
        <div
          style={{
            padding: cellPad,
            fontSize: headerFont,
            color: T.inkSubtle,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: rowBorder,
          }}
        >
          Major
        </div>
        <div
          style={{
            padding: cellPad,
            fontSize: headerFont,
            color: T.inkSubtle,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: rowBorder,
          }}
        >
          Minor
        </div>

        {ROWS.map((row, i) => {
          const isLast = i === ROWS.length - 1
          const isCMajor = row.accidentals === 0
          // Warm honey-cream that nests with the page's #EFE8D2 background
          // without introducing the soft-coral hue used by T.highlightFill.
          const cMajorHighlight = '#E8DCB5'
          const cellStyle: React.CSSProperties = {
            padding: cellPad,
            borderBottom: isLast ? 'none' : rowBorder,
            background: isCMajor ? cMajorHighlight : 'transparent',
            display: 'flex',
            alignItems: 'center',
          }
          return (
            <React.Fragment key={i}>
              <div style={{ ...cellStyle, color: T.inkMuted }}>
                {accidentalLabel(row.accidentals)}
              </div>
              <div style={cellStyle}>
                <KeySignatureStaff
                  accidentals={row.accidentals}
                  size="small"
                  compact
                />
              </div>
              <div style={cellStyle}>{row.major}</div>
              <div style={{ ...cellStyle, color: T.inkMuted }}>{row.minor}</div>
            </React.Fragment>
          )
        })}
      </div>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
