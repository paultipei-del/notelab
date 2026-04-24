'use client'

import React from 'react'
import {
  TREBLE_POSITIONS,
  BASS_POSITIONS,
  isOnTrebleStaff,
} from '@/lib/programs/note-reading/staffPositions'

/**
 * Module 8 (Intervallic Reading) preview chart. Shows two example
 * note-pairs side by side, each pair connected by a slur arc with the
 * interval name above. The visual frame mirrors StaffPreview so the
 * module pages share a consistent look. Static — no interactivity.
 */

const PAIRS: Array<{ from: string; to: string; label: string }> = [
  { from: 'F4', to: 'A4', label: 'Major 3rd' },
  { from: 'G4', to: 'D5', label: 'Perfect 5th' },
]

interface Props {
  caption?: string
  compact?: boolean
}

export default function IntervallicPreview({ caption, compact = false }: Props) {
  const step = compact ? 6 : 9
  const staffPad = compact ? 24 : 36
  const trebleTop = compact ? 36 : 56
  const bassTop = trebleTop + 8 * step + (compact ? 36 : 60)
  const innerH = bassTop + 8 * step + 28
  const noteFontSize = compact ? 28 : 42

  const groupWidth = compact ? 180 : 260
  const groupGap = compact ? 28 : 48
  const totalW = staffPad + PAIRS.length * groupWidth + (PAIRS.length - 1) * groupGap + 18

  function notePos(pitch: string): { onTreble: boolean; y: number } | null {
    const onTreble = isOnTrebleStaff(pitch)
    const positions = onTreble ? TREBLE_POSITIONS : BASS_POSITIONS
    const top = onTreble ? trebleTop : bassTop
    const pos = positions[pitch.replace(/[#b]/, '')]
    if (pos === undefined) return null
    return { onTreble, y: top + pos * step }
  }

  return (
    <div style={{
      background: '#FDFAF3',
      border: '1px solid #DDD8CA',
      borderRadius: '14px',
      padding: compact ? '16px 18px' : '24px 22px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg
          width="100%"
          viewBox={`0 0 ${totalW} ${innerH + 36}`}
          style={{ maxWidth: `${totalW}px`, height: 'auto' }}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Intervallic reading preview: two interval examples"
        >
          {PAIRS.map((pair, idx) => {
            const baseX = staffPad + idx * (groupWidth + groupGap)
            const leftX = baseX + groupWidth * 0.32
            const rightX = baseX + groupWidth * 0.78
            const fromCoords = notePos(pair.from)
            const toCoords = notePos(pair.to)
            return (
              <g key={`pair-${idx}`}>
                {/* Group's own grand staff */}
                <line x1={baseX} y1={trebleTop} x2={baseX} y2={bassTop + 8 * step} stroke="#1A1A18" strokeWidth="1.4" />
                {[0, 2, 4, 6, 8].map(p => (
                  <line key={`tt-${idx}-${p}`} x1={baseX} y1={trebleTop + p * step} x2={baseX + groupWidth} y2={trebleTop + p * step} stroke="#1A1A18" strokeWidth="1.1" />
                ))}
                {[0, 2, 4, 6, 8].map(p => (
                  <line key={`bb-${idx}-${p}`} x1={baseX} y1={bassTop + p * step} x2={baseX + groupWidth} y2={bassTop + p * step} stroke="#1A1A18" strokeWidth="1.1" />
                ))}
                {/* Clefs */}
                <text x={baseX + 8} y={trebleTop + step * 6} fontSize={step * 8} fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄞</text>
                <text x={baseX + 8} y={bassTop + step * 2.2} fontSize={step * 8} fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄢</text>

                {/* Notes */}
                {fromCoords && (
                  <g>
                    <text x={leftX} y={fromCoords.y} fontSize={noteFontSize} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="central">
                      {String.fromCodePoint(0xE0A4)}
                    </text>
                    <text x={leftX} y={innerH} textAnchor="middle" fontFamily="var(--font-jost), sans-serif" fontSize={compact ? 12 : 14} fill="#7A7060">
                      {pair.from}
                    </text>
                  </g>
                )}
                {toCoords && (
                  <g>
                    <text x={rightX} y={toCoords.y} fontSize={noteFontSize} fontFamily="Bravura, serif" fill="#B5402A" textAnchor="middle" dominantBaseline="central">
                      {String.fromCodePoint(0xE0A4)}
                    </text>
                    <text x={rightX} y={innerH} textAnchor="middle" fontFamily="var(--font-jost), sans-serif" fontSize={compact ? 12 : 14} fill="#B5402A">
                      {pair.to}
                    </text>
                  </g>
                )}

                {/* Slur arc connecting the two notes (above the higher
                    of the two y values, going up and over) */}
                {fromCoords && toCoords && (() => {
                  const arcTopY = Math.min(fromCoords.y, toCoords.y) - (compact ? 22 : 30)
                  const midX = (leftX + rightX) / 2
                  return (
                    <>
                      <path
                        d={`M ${leftX} ${fromCoords.y - 8} Q ${midX} ${arcTopY} ${rightX} ${toCoords.y - 8}`}
                        fill="none"
                        stroke="#7A7060"
                        strokeWidth="1.4"
                      />
                      <text
                        x={midX}
                        y={arcTopY - 4}
                        textAnchor="middle"
                        fontFamily="var(--font-cormorant), serif"
                        fontSize={compact ? 13 : 16}
                        fontStyle="italic"
                        fill="#2A2318"
                      >
                        {pair.label}
                      </text>
                    </>
                  )
                })()}
              </g>
            )
          })}
        </svg>
      </div>
      {caption && (
        <p style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontSize: 'var(--nl-text-badge)',
          color: '#7A7060',
          margin: '14px 0 0',
          textAlign: 'center',
          lineHeight: 1.55,
        }}>
          {caption}
        </p>
      )}
    </div>
  )
}
