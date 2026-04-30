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
  // Sizing matches StaffPreview so the two module previews feel like
  // one visual family — step 12/8, notehead 84/56, ~7× step ratio.
  const step = compact ? 8 : 12
  const staffPad = compact ? 34 : 56
  // Extra headroom above trebleTop so the interval label (Major 3rd /
  // Perfect 5th) can sit above the staff regardless of where the pair's
  // noteheads fall within the staff.
  const trebleTop = compact ? 60 : 94
  const staveGap = compact ? 56 : 88
  const bassTop = trebleTop + 8 * step + staveGap
  const innerH = bassTop + 8 * step + (compact ? 24 : 36)
  const noteFontSize = compact ? 56 : 84
  const labelFontSize = compact ? 13 : 16

  const groupWidth = compact ? 230 : 340
  const groupGap = compact ? 40 : 60
  const totalW = staffPad + PAIRS.length * groupWidth + (PAIRS.length - 1) * groupGap + 24

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
      background: '#ECE3CC',
      border: '1px solid #D9CFAE',
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
                {/* Group's own grand staff — muted gray to match the
                    main StaffPreview treatment so the noteheads pop. */}
                {/* Brace glyph — spans full grand-staff height, anchored
                    just outside the staff bar to leave an engraving gap. */}
                {(() => {
                  const braceHeight = bassTop + 8 * step - trebleTop
                  return (
                    <text
                      x={baseX - 6}
                      y={trebleTop + braceHeight}
                      fontSize={braceHeight}
                      fontFamily="Bravura, serif"
                      fill="#6B6459"
                      textAnchor="end"
                      dominantBaseline="auto"
                    >
                      {String.fromCodePoint(0xE000)}
                    </text>
                  )
                })()}
                <line x1={baseX} y1={trebleTop} x2={baseX} y2={bassTop + 8 * step} stroke="#6B6459" strokeWidth="1.5" />
                {[0, 2, 4, 6, 8].map(p => (
                  <line key={`tt-${idx}-${p}`} x1={baseX} y1={trebleTop + p * step} x2={baseX + groupWidth} y2={trebleTop + p * step} stroke="#6B6459" strokeWidth="1.1" />
                ))}
                {[0, 2, 4, 6, 8].map(p => (
                  <line key={`bb-${idx}-${p}`} x1={baseX} y1={bassTop + p * step} x2={baseX + groupWidth} y2={bassTop + p * step} stroke="#6B6459" strokeWidth="1.1" />
                ))}
                {/* Clefs — sized 8× step as in the standard StaffPreview. */}
                <text x={baseX + 6} y={trebleTop + step * 6} fontSize={step * 8} fontFamily="Bravura, serif" fill="#6B6459" dominantBaseline="auto">𝄞</text>
                <text x={baseX + 6} y={bassTop + step * 2.2} fontSize={step * 7.4} fontFamily="Bravura, serif" fill="#6B6459" dominantBaseline="auto">𝄢</text>

                {/* Notes — noteheads only, no pitch labels on the staff. */}
                {fromCoords && (
                  <text x={leftX} y={fromCoords.y} fontSize={noteFontSize} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="central">
                    {String.fromCodePoint(0xE0A4)}
                  </text>
                )}
                {toCoords && (
                  <text x={rightX} y={toCoords.y} fontSize={noteFontSize} fontFamily="Bravura, serif" fill="#B5402A" textAnchor="middle" dominantBaseline="central">
                    {String.fromCodePoint(0xE0A4)}
                  </text>
                )}

                {/* Slur arc anchored ABOVE the staff so the interval
                    label is never buried between the two noteheads.
                    Arc top sits a fixed distance above trebleTop, with
                    the interval name higher still. */}
                {fromCoords && toCoords && (() => {
                  const noteOffset = noteFontSize * 0.22
                  const arcTopY = trebleTop - (compact ? 22 : 34)
                  const midX = (leftX + rightX) / 2
                  return (
                    <>
                      <path
                        d={`M ${leftX} ${fromCoords.y - noteOffset} Q ${midX} ${arcTopY} ${rightX} ${toCoords.y - noteOffset}`}
                        fill="none"
                        stroke="#7A7060"
                        strokeWidth="1.6"
                      />
                      <text
                        x={midX}
                        y={arcTopY - 12}
                        textAnchor="middle"
                        fontFamily="var(--font-cormorant), serif"
                        fontSize={compact ? 22 : 28}
                        fontWeight={500}
                        fill="#1A1A18"
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
          fontSize: compact ? '13px' : '15px',
          color: '#2A2318',
          margin: '18px 0 0',
          textAlign: 'center',
          lineHeight: 1.55,
        }}>
          {caption}
        </p>
      )}
    </div>
  )
}
