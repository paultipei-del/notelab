'use client'

import React from 'react'
import {
  TREBLE_POSITIONS,
  BASS_POSITIONS,
  isOnTrebleStaff,
} from '@/lib/programs/note-reading/staffPositions'

/**
 * Static "what you'll learn" reference chart for a Note Reading module.
 *
 * Renders the supplied pitches in ascending order on a real staff
 * (treble, bass, or grand) so beginners see *spatially* what the module
 * will drill — letter codes alone don't help when the goal is to learn
 * the codes. Optional letter labels and landmark hints render below
 * each note.
 *
 * Static visual only — no interactivity, no audio. The drill UIs
 * provide both, and the preview is meant to feel like a textbook chart
 * sitting at the top of the module page.
 */

const ACCIDENTAL_MAP: Record<string, { natural: string; acc: 'sharp' | 'flat' }> = {
  'C#4': { natural: 'C4', acc: 'sharp' }, 'Db4': { natural: 'D4', acc: 'flat' },
  'D#4': { natural: 'D4', acc: 'sharp' }, 'Eb4': { natural: 'E4', acc: 'flat' },
  'F#4': { natural: 'F4', acc: 'sharp' }, 'Gb4': { natural: 'G4', acc: 'flat' },
  'G#4': { natural: 'G4', acc: 'sharp' }, 'Ab4': { natural: 'A4', acc: 'flat' },
  'A#4': { natural: 'A4', acc: 'sharp' }, 'Bb4': { natural: 'B4', acc: 'flat' },
  'C#5': { natural: 'C5', acc: 'sharp' }, 'Db5': { natural: 'D5', acc: 'flat' },
  'D#5': { natural: 'D5', acc: 'sharp' }, 'Eb5': { natural: 'E5', acc: 'flat' },
  'F#5': { natural: 'F5', acc: 'sharp' }, 'Gb5': { natural: 'G5', acc: 'flat' },
  'G#5': { natural: 'G5', acc: 'sharp' }, 'Ab5': { natural: 'A5', acc: 'flat' },
  'A#5': { natural: 'A5', acc: 'sharp' }, 'Bb5': { natural: 'B5', acc: 'flat' },
  'C#3': { natural: 'C3', acc: 'sharp' }, 'Db3': { natural: 'D3', acc: 'flat' },
  'D#3': { natural: 'D3', acc: 'sharp' }, 'Eb3': { natural: 'E3', acc: 'flat' },
  'F#3': { natural: 'F3', acc: 'sharp' }, 'Gb3': { natural: 'G3', acc: 'flat' },
  'G#3': { natural: 'G3', acc: 'sharp' }, 'Ab3': { natural: 'A3', acc: 'flat' },
  'A#3': { natural: 'A3', acc: 'sharp' }, 'Bb3': { natural: 'B3', acc: 'flat' },
  'C#6': { natural: 'C6', acc: 'sharp' },
  'F#2': { natural: 'F2', acc: 'sharp' }, 'Bb2': { natural: 'B2', acc: 'flat' },
  'G#2': { natural: 'G2', acc: 'sharp' }, 'Ab2': { natural: 'A2', acc: 'flat' },
  'A#2': { natural: 'A2', acc: 'sharp' }, 'Eb2': { natural: 'E2', acc: 'flat' },
}

interface Props {
  notes: string[]
  clef: 'treble' | 'bass' | 'grand'
  showLabels?: boolean
  showLandmarks?: boolean
  landmarkLabels?: Record<string, string>
  groupByClef?: boolean
  caption?: string
  compact?: boolean
}

const NATURAL_BASE_MIDI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

function pitchToMidi(p: string): number {
  const m = p.match(/^([A-G])(b|#)?(\d+)$/)
  if (!m) return 0
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0
  return (parseInt(m[3], 10) + 1) * 12 + (NATURAL_BASE_MIDI[m[1]] ?? 0) + acc
}

function asciiSharpFlat(pitch: string): string {
  return pitch.replace('#', '♯').replace('b', '♭')
}

export default function StaffPreview({
  notes,
  clef,
  showLabels = true,
  showLandmarks = false,
  landmarkLabels,
  groupByClef = clef === 'grand',
  caption,
  compact = false,
}: Props) {
  const sorted = [...notes].sort((a, b) => pitchToMidi(a) - pitchToMidi(b))

  // Sizing — notehead font size sits at ~7.3× step to match the
  // GrandStaffCard reference (step=6, fontSize=46). Spacing is generous
  // enough that adjacent letter labels and ledger lines don't collide.
  const step = compact ? 7 : 11
  const noteSpacing = compact ? 50 : 72
  const labelGap = compact ? 18 : 26
  const accidentalOffset = compact ? -17 : -26
  const noteFontSize = compact ? 52 : 80
  const labelFontSize = compact ? 13 : 16
  const landmarkFontSize = compact ? 11 : 13

  const staffPad = compact ? 36 : 56      // left padding for clef
  const rightPad = compact ? 14 : 20

  // Y position of a pitch's notehead within its own clef section.
  function trebleY(pitch: string, top: number): number | null {
    const m = ACCIDENTAL_MAP[pitch]
    const natural = m ? m.natural : pitch
    const pos = TREBLE_POSITIONS[natural]
    return pos === undefined ? null : top + pos * step
  }
  function bassY(pitch: string, top: number): number | null {
    const m = ACCIDENTAL_MAP[pitch]
    const natural = m ? m.natural : pitch
    const pos = BASS_POSITIONS[natural]
    return pos === undefined ? null : top + pos * step
  }

  // Single-staff (treble or bass) — render all notes on one staff.
  if (clef !== 'grand') {
    const yPosFn = clef === 'treble' ? trebleY : bassY
    const trebleTop = compact ? 38 : 56
    const staffWidth = staffPad + rightPad + sorted.length * noteSpacing
    const labelBlockH = (showLabels ? labelGap + labelFontSize + 4 : 0) +
      (showLandmarks ? labelGap : 0)
    const H = (trebleTop + 8 * step + 6 * step) + labelBlockH + (caption ? 28 : 12)

    return (
      <PreviewFrame caption={caption} compact={compact}>
        <svg
          width="100%"
          viewBox={`0 0 ${staffWidth} ${H}`}
          style={{ maxWidth: `${staffWidth}px`, height: 'auto' }}
          xmlns="http://www.w3.org/2000/svg"
          aria-label={`${clef} staff preview: ${sorted.join(', ')}`}
        >
          <StaffLines top={trebleTop} step={step} left={staffPad} right={staffWidth - rightPad} />
          <Clef clef={clef} top={trebleTop} step={step} x={staffPad - 24} />

          {sorted.map((pitch, i) => {
            const y = yPosFn(pitch, trebleTop)
            if (y === null) return null
            const x = staffPad + i * noteSpacing + noteSpacing / 2
            return (
              <g key={`n-${pitch}-${i}`}>
                <LedgerLines pitch={pitch} clefSide={clef} top={trebleTop} step={step} x={x} />
                <Notehead x={x} y={y} fontSize={noteFontSize} />
                <Accidental pitch={pitch} x={x + accidentalOffset} y={y} fontSize={noteFontSize} />
                {showLabels && (
                  <NoteLabel
                    pitch={pitch}
                    x={x}
                    y={trebleTop + 8 * step + labelGap + labelFontSize}
                    fontSize={labelFontSize}
                  />
                )}
                {showLandmarks && landmarkLabels?.[pitch] && (
                  <text
                    x={x}
                    y={trebleTop + 8 * step + labelGap + labelFontSize + landmarkFontSize + 4}
                    textAnchor="middle"
                    fontFamily="var(--font-cormorant), serif"
                    fontSize={landmarkFontSize}
                    fontStyle="italic"
                    fill="#7A7060"
                  >
                    {landmarkLabels[pitch]}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </PreviewFrame>
    )
  }
  // Grand staff — split notes by clef, share x-axis so columns align.
  // Stave-to-stave gap leaves room for both staves' ledger zones plus
  // labels under treble notes that sit in the middle-C overlap.
  const trebleTop = compact ? 40 : 64
  const staveGap = compact ? 64 : 96
  const bassTop = trebleTop + 8 * step + staveGap
  const labelBlockH = (showLabels ? labelGap + labelFontSize + 6 : 0) +
    (showLandmarks ? landmarkFontSize + 6 : 0)
  const H = bassTop + 8 * step + (compact ? 18 : 28) + labelBlockH + (caption ? 28 : 12)
  const staffWidth = staffPad + rightPad + sorted.length * noteSpacing

  return (
    <PreviewFrame caption={caption} compact={compact}>
      <svg
        width="100%"
        viewBox={`0 0 ${staffWidth} ${H}`}
        style={{ maxWidth: `${staffWidth}px`, height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Grand staff preview: ${sorted.join(', ')}`}
      >
        {/* Connecting line + clefs */}
        <line x1={staffPad} y1={trebleTop} x2={staffPad} y2={bassTop + 8 * step} stroke="#1A1A18" strokeWidth="1.5" />
        <StaffLines top={trebleTop} step={step} left={staffPad} right={staffWidth - rightPad} />
        <StaffLines top={bassTop} step={step} left={staffPad} right={staffWidth - rightPad} />
        <Clef clef="treble" top={trebleTop} step={step} x={staffPad - 24} />
        <Clef clef="bass" top={bassTop} step={step} x={staffPad - 24} />

        {sorted.map((pitch, i) => {
          const useTreble = groupByClef ? isOnTrebleStaff(pitch) : true
          const top = useTreble ? trebleTop : bassTop
          const y = useTreble ? trebleY(pitch, top) : bassY(pitch, top)
          if (y === null) return null
          const x = staffPad + i * noteSpacing + noteSpacing / 2
          // Per-clef label band so treble notes don't end up with labels
          // far below the bass staff.
          const labelY = (useTreble ? trebleTop + 8 * step : bassTop + 8 * step) + labelGap + labelFontSize
          return (
            <g key={`n-${pitch}-${i}`}>
              <LedgerLines pitch={pitch} clefSide={useTreble ? 'treble' : 'bass'} top={top} step={step} x={x} />
              <Notehead x={x} y={y} fontSize={noteFontSize} />
              <Accidental pitch={pitch} x={x + accidentalOffset} y={y} fontSize={noteFontSize} />
              {showLabels && (
                <NoteLabel pitch={pitch} x={x} y={labelY} fontSize={labelFontSize} />
              )}
              {showLandmarks && landmarkLabels?.[pitch] && (
                <text
                  x={x}
                  y={labelY + landmarkFontSize + 4}
                  textAnchor="middle"
                  fontFamily="var(--font-cormorant), serif"
                  fontSize={landmarkFontSize}
                  fontStyle="italic"
                  fill="#7A7060"
                >
                  {landmarkLabels[pitch]}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </PreviewFrame>
  )
}

function PreviewFrame({ caption, compact, children }: { caption?: string; compact?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#FDFAF3',
      border: '1px solid #DDD8CA',
      borderRadius: '14px',
      padding: compact ? '16px 18px' : '24px 22px',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>{children}</div>
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

function StaffLines({ top, step, left, right }: { top: number; step: number; left: number; right: number }) {
  return (
    <g>
      {[0, 2, 4, 6, 8].map(p => (
        <line key={p} x1={left} y1={top + p * step} x2={right} y2={top + p * step} stroke="#1A1A18" strokeWidth="1.1" />
      ))}
    </g>
  )
}

function Clef({ clef, top, step, x }: { clef: 'treble' | 'bass'; top: number; step: number; x: number }) {
  const fontSize = step * 8.2
  if (clef === 'bass') {
    return (
      <text x={x + 14} y={top + step * 2.2} fontSize={fontSize} fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">
        𝄢
      </text>
    )
  }
  return (
    <text x={x + 12} y={top + step * 6} fontSize={fontSize} fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">
      𝄞
    </text>
  )
}

function Notehead({ x, y, fontSize }: { x: number; y: number; fontSize: number }) {
  return (
    <text x={x} y={y} fontSize={fontSize} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="central">
      {String.fromCodePoint(0xE0A4)}
    </text>
  )
}

function Accidental({ pitch, x, y, fontSize }: { pitch: string; x: number; y: number; fontSize: number }) {
  const m = ACCIDENTAL_MAP[pitch]
  if (!m) return null
  return (
    <text x={x} y={y} fontSize={fontSize * 0.78} fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="central">
      {m.acc === 'sharp' ? String.fromCodePoint(0xE262) : String.fromCodePoint(0xE260)}
    </text>
  )
}

function NoteLabel({ pitch, x, y, fontSize }: { pitch: string; x: number; y: number; fontSize: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily="var(--font-jost), sans-serif" fontSize={fontSize} fill="#2A2318">
      {asciiSharpFlat(pitch)}
    </text>
  )
}

function LedgerLines({ pitch, clefSide, top, step, x }: { pitch: string; clefSide: 'treble' | 'bass'; top: number; step: number; x: number }) {
  const m = ACCIDENTAL_MAP[pitch]
  const natural = m ? m.natural : pitch
  const positions = clefSide === 'treble' ? TREBLE_POSITIONS : BASS_POSITIONS
  const pos = positions[natural]
  if (pos === undefined) return null
  const lines: React.ReactElement[] = []
  const halfWidth = Math.round(step * 2.2)
  if (pos >= 10) {
    for (let p = 10; p <= pos; p += 2) {
      const ly = top + p * step
      lines.push(<line key={`lb-${p}`} x1={x - halfWidth} y1={ly} x2={x + halfWidth} y2={ly} stroke="#1A1A18" strokeWidth="1.1" />)
    }
  } else if (pos <= -2) {
    for (let p = -2; p >= pos; p -= 2) {
      const ly = top + p * step
      lines.push(<line key={`la-${p}`} x1={x - halfWidth} y1={ly} x2={x + halfWidth} y2={ly} stroke="#1A1A18" strokeWidth="1.1" />)
    }
  }
  return <g>{lines}</g>
}
