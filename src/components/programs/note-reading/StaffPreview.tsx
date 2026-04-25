'use client'

import React, { useState } from 'react'
import {
  TREBLE_POSITIONS,
  BASS_POSITIONS,
} from '@/lib/programs/note-reading/staffPositions'
import type { NoteStats } from '@/lib/programs/note-reading/types'

// Mastery colours used when the preview doubles as the student's
// progress dashboard (Module 1's unified "Your grand staff" section).
// Same palette as the original NoteHeatMap so the visual language is
// consistent across the program.
const MASTERY_COLORS = {
  unseen:     '#D9D6CE',
  weak:       '#C9614A',
  developing: '#D4963A',
  strong:     '#5A8A5E',
} as const
type MasteryLevel = keyof typeof MASTERY_COLORS

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
  /**
   * Optional mastery data. When present, each notehead is filled with
   * the colour for that note's masteryLevel — the preview becomes the
   * student's progress dashboard. When absent, noteheads render in
   * the standard charcoal.
   */
  noteStats?: NoteStats[]
  /**
   * Show the four-dot mastery legend below the staff. Only meaningful
   * when `noteStats` is provided. Hide on a fresh user (no sessions
   * yet) — there's nothing to explain.
   */
  showLegend?: boolean
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

// Decide which clef of a grand staff a pitch belongs on. Threshold at
// middle C (MIDI 60): C4 and above → treble, below → bass. This puts
// gap-zone notes like B3 / A3 / G3 on the bass staff (top line / space
// above) instead of as ledger-line notes below the treble — matching
// musical convention. Local to StaffPreview to avoid touching the
// shared `isOnTrebleStaff` used by other staff components.
function preferTreble(pitch: string): boolean {
  return pitchToMidi(pitch) >= 60
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
  noteStats,
  showLegend,
}: Props) {
  const sorted = [...notes].sort((a, b) => pitchToMidi(a) - pitchToMidi(b))
  // Default the legend visibility to the presence of noteStats — if
  // we're rendering as a progress dashboard the legend explains the
  // colours; in plain teaching-reference mode there's nothing to
  // explain. Caller can still force on/off by passing `showLegend`.
  const renderLegend = showLegend ?? noteStats !== undefined

  // Per-pitch mastery colour. Falls back to the unseen tone when no
  // stats are supplied so the chart still reads as a teaching reference.
  function colorFor(pitch: string): string {
    if (!noteStats) return '#1A1A18'
    const stat = noteStats.find(s => s.noteId === pitch)
    if (!stat || stat.attempts === 0) return MASTERY_COLORS.unseen
    return MASTERY_COLORS[stat.masteryLevel as MasteryLevel] ?? MASTERY_COLORS.unseen
  }

  // Hover tooltip — only meaningful when noteStats is provided. State
  // tracks the active note and its anchor in svg coordinates; the
  // tooltip renders via a foreignObject overlay near the notehead.
  const [tooltip, setTooltip] = useState<{ noteId: string; x: number; y: number } | null>(null)
  const interactive = noteStats !== undefined

  // Sizing — notehead font size sits at ~7× step (matching the
  // GrandStaffCard reference at step=6, fontSize=46). All other
  // dimensions are derived to keep the chart visually proportional.
  const step = compact ? 8 : 12
  const noteFontSize = compact ? 56 : 84
  const noteSpacing = compact ? 60 : 84
  const labelGap = compact ? 22 : 32
  const accidentalOffset = compact ? -18 : -26
  const labelFontSize = compact ? 18 : 22
  // Larger landmark caption since the new 2-line wrapping gives the
  // caption visual presence — at smaller sizes it read as a footnote.
  const landmarkFontSize = compact ? 14 : 18

  // staffPad — left margin from svg edge to where the staff lines
  // start. Sized to leave engraving-style breathing room for the brace
  // on grand-staff modules; the brace glyph extends ~half its em-width
  // around its anchor and should sit fully left of the staff bar.
  // clefRoom — horizontal space INSIDE the staff reserved for the clef
  // glyph. Notes start at staffPad + clefRoom.
  const staffPad = compact ? 36 : 56
  const clefRoom = compact ? 38 : 56
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
    const trebleTop = compact ? 36 : 52
    const noteAreaLeft = staffPad + clefRoom
    const staffWidth = noteAreaLeft + rightPad + sorted.length * noteSpacing
    // Landmark captions wrap to two lines, so reserve 2× the font
    // height for them when present.
    const labelBlockH = (showLabels ? labelGap + labelFontSize + 4 : 0) +
      (showLandmarks ? landmarkFontSize * 2.4 + 8 : 0)
    const H = (trebleTop + 8 * step + 6 * step) + labelBlockH + (caption ? 28 : 12)

    return (
      <PreviewFrame caption={caption} compact={compact} legend={renderLegend ? <MasteryLegend /> : null}>
        <svg
          width="100%"
          viewBox={`0 0 ${staffWidth} ${H}`}
          style={{ maxWidth: `${staffWidth}px`, height: 'auto' }}
          xmlns="http://www.w3.org/2000/svg"
          aria-label={`${clef} staff preview: ${sorted.join(', ')}`}
        >
          <StaffLines top={trebleTop} step={step} left={staffPad} right={staffWidth - rightPad} />
          <Clef clef={clef} top={trebleTop} step={step} x={staffPad + 4} />

          {sorted.map((pitch, i) => {
            const y = yPosFn(pitch, trebleTop)
            if (y === null) return null
            const x = noteAreaLeft + i * noteSpacing + noteSpacing / 2
            const hoverHandlers = interactive ? {
              onMouseEnter: () => setTooltip({ noteId: pitch, x, y }),
              onMouseLeave: () => setTooltip(null),
              onClick: () => setTooltip(t => t?.noteId === pitch ? null : { noteId: pitch, x, y }),
              style: { cursor: 'pointer' as const },
            } : {}
            return (
              <g key={`n-${pitch}-${i}`} {...hoverHandlers}>
                <LedgerLines pitch={pitch} clefSide={clef} top={trebleTop} step={step} x={x} />
                <Notehead x={x} y={y} fontSize={noteFontSize} fill={colorFor(pitch)} />
                <Accidental pitch={pitch} x={x + accidentalOffset} y={y} fontSize={noteFontSize} fill={colorFor(pitch)} />
                {showLabels && (
                  <NoteLabel
                    pitch={pitch}
                    x={x}
                    y={trebleTop + 8 * step + labelGap + labelFontSize}
                    fontSize={labelFontSize}
                  />
                )}
                {showLandmarks && landmarkLabels?.[pitch] && (
                  <LandmarkCaption
                    label={landmarkLabels[pitch]}
                    x={x}
                    y={trebleTop + 8 * step + labelGap + labelFontSize + landmarkFontSize + 6}
                    fontSize={landmarkFontSize}
                  />
                )}
              </g>
            )
          })}
          {tooltip && noteStats && (
            <TooltipOverlay
              tooltip={tooltip}
              stats={noteStats.find(s => s.noteId === tooltip.noteId)}
              svgWidth={staffWidth}
            />
          )}
        </svg>
      </PreviewFrame>
    )
  }
  // Grand staff — split notes by clef, share x-axis so columns align.
  // Stave-to-stave gap leaves room for both staves' ledger zones plus
  // labels under treble notes that sit in the middle-C overlap.
  const trebleTop = compact ? 36 : 56
  const staveGap = compact ? 56 : 84
  const bassTop = trebleTop + 8 * step + staveGap
  // 2-line landmark captions on grand staff — reserve enough vertical
  // room below the bass staff for both letter label and 2-line caption.
  const labelBlockH = (showLabels ? labelGap + labelFontSize + 6 : 0) +
    (showLandmarks ? landmarkFontSize * 2.4 + 8 : 0)
  const H = bassTop + 8 * step + (compact ? 18 : 28) + labelBlockH + (caption ? 28 : 12)
  const noteAreaLeft = staffPad + clefRoom
  const staffWidth = noteAreaLeft + rightPad + sorted.length * noteSpacing
  const braceTop = trebleTop
  const braceBottom = bassTop + 8 * step
  const braceHeight = braceBottom - braceTop

  return (
    <PreviewFrame caption={caption} compact={compact} legend={renderLegend ? <MasteryLegend /> : null}>
      <svg
        width="100%"
        viewBox={`0 0 ${staffWidth} ${H}`}
        style={{ maxWidth: `${staffWidth}px`, height: 'auto' }}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Grand staff preview: ${sorted.join(', ')}`}
      >
        {/* Bravura brace glyph. textAnchor=middle and a small fixed
            offset from staffPad puts the brace's right edge a few px
            short of the staff bar — the engraving gap is small but
            present, matching standard notation practice. */}
        <text
          x={staffPad - 6}
          y={braceTop + braceHeight}
          fontSize={braceHeight}
          fontFamily="Bravura, serif"
          fill="#6B6459"
          textAnchor="end"
          dominantBaseline="auto"
        >
          {String.fromCodePoint(0xE000)}
        </text>
        {/* Vertical connecting line where the brace meets the staves. */}
        <line x1={staffPad} y1={trebleTop} x2={staffPad} y2={bassTop + 8 * step} stroke="#6B6459" strokeWidth="1.5" />
        <StaffLines top={trebleTop} step={step} left={staffPad} right={staffWidth - rightPad} />
        <StaffLines top={bassTop} step={step} left={staffPad} right={staffWidth - rightPad} />
        <Clef clef="treble" top={trebleTop} step={step} x={staffPad + 4} />
        <Clef clef="bass" top={bassTop} step={step} x={staffPad + 4} />

        {sorted.map((pitch, i) => {
          const useTreble = groupByClef ? preferTreble(pitch) : true
          const top = useTreble ? trebleTop : bassTop
          const y = useTreble ? trebleY(pitch, top) : bassY(pitch, top)
          if (y === null) return null
          const x = noteAreaLeft + i * noteSpacing + noteSpacing / 2
          const labelY = bassTop + 8 * step + labelGap + labelFontSize
          const hoverHandlers = interactive ? {
            onMouseEnter: () => setTooltip({ noteId: pitch, x, y }),
            onMouseLeave: () => setTooltip(null),
            onClick: () => setTooltip(t => t?.noteId === pitch ? null : { noteId: pitch, x, y }),
            style: { cursor: 'pointer' as const },
          } : {}
          return (
            <g key={`n-${pitch}-${i}`} {...hoverHandlers}>
              <LedgerLines pitch={pitch} clefSide={useTreble ? 'treble' : 'bass'} top={top} step={step} x={x} />
              <Notehead x={x} y={y} fontSize={noteFontSize} fill={colorFor(pitch)} />
              <Accidental pitch={pitch} x={x + accidentalOffset} y={y} fontSize={noteFontSize} fill={colorFor(pitch)} />
              {showLabels && (
                <NoteLabel pitch={pitch} x={x} y={labelY} fontSize={labelFontSize} />
              )}
              {showLandmarks && landmarkLabels?.[pitch] && (
                <LandmarkCaption
                  label={landmarkLabels[pitch]}
                  x={x}
                  y={labelY + landmarkFontSize + 6}
                  fontSize={landmarkFontSize}
                />
              )}
            </g>
          )
        })}
        {tooltip && noteStats && (
          <TooltipOverlay
            tooltip={tooltip}
            stats={noteStats.find(s => s.noteId === tooltip.noteId)}
            svgWidth={staffWidth}
          />
        )}
      </svg>
    </PreviewFrame>
  )
}

function PreviewFrame({ caption, compact, children, legend }: { caption?: string; compact?: boolean; children: React.ReactNode; legend?: React.ReactNode }) {
  return (
    <div style={{
      background: '#FDFAF3',
      border: '1px solid #DDD8CA',
      borderRadius: '14px',
      padding: compact ? '16px 18px' : '24px 22px',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>{children}</div>
      {legend}
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

// Hover tooltip — shows the student's accuracy / attempts / response
// time for the note under the pointer. Positioned via a foreignObject
// overlay anchored near the notehead's svg coordinates so it follows
// the staff layout without needing screen-coordinate math.
function TooltipOverlay({ tooltip, stats, svgWidth }: {
  tooltip: { noteId: string; x: number; y: number }
  stats: NoteStats | undefined
  svgWidth: number
}) {
  const F = 'var(--font-jost), sans-serif'
  const SERIF = 'var(--font-cormorant), serif'
  const tipW = 150
  const tipH = stats && stats.avgResponseMs > 0 ? 78 : 62
  let tx = tooltip.x - tipW / 2
  let ty = tooltip.y - tipH - 14
  if (tx < 4) tx = 4
  if (tx + tipW > svgWidth - 4) tx = svgWidth - tipW - 4
  if (ty < 4) ty = tooltip.y + 18
  return (
    <foreignObject x={tx} y={ty} width={tipW} height={tipH}>
      <div
        // @ts-ignore — foreignObject children can carry an xmlns hint
        xmlns="http://www.w3.org/1999/xhtml"
        style={{
          background: '#1A1A18',
          borderRadius: '8px',
          padding: '8px 12px',
          pointerEvents: 'none',
        }}
      >
        <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400, color: 'white', margin: '0 0 2px' }}>
          {tooltip.noteId.replace('#', '♯').replace('b', '♭')}
        </p>
        {stats && stats.attempts > 0 ? (
          <>
            <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              {Math.round(stats.accuracy * 100)}% · {stats.attempts} attempt{stats.attempts !== 1 ? 's' : ''}
            </p>
            {stats.avgResponseMs > 0 && (
              <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                avg {(stats.avgResponseMs / 1000).toFixed(1)}s response
              </p>
            )}
          </>
        ) : (
          <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Not yet attempted
          </p>
        )}
      </div>
    </foreignObject>
  )
}

function MasteryLegend() {
  const F = 'var(--font-jost), sans-serif'
  return (
    <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {(Object.entries(MASTERY_COLORS) as [MasteryLevel, string][]).map(([level, color]) => (
        <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: color, border: '1px solid #FDFAF3', flexShrink: 0,
          }} />
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', textTransform: 'capitalize' as const }}>
            {level}
          </span>
        </div>
      ))}
    </div>
  )
}

function StaffLines({ top, step, left, right }: { top: number; step: number; left: number; right: number }) {
  return (
    <g>
      {[0, 2, 4, 6, 8].map(p => (
        <line key={p} x1={left} y1={top + p * step} x2={right} y2={top + p * step} stroke="#6B6459" strokeWidth="1.1" />
      ))}
    </g>
  )
}

function Clef({ clef, top, step, x }: { clef: 'treble' | 'bass'; top: number; step: number; x: number }) {
  // Clef glyph sits inside the staff. The treble glyph extends well
  // above and below its anchor; the bass glyph is shorter and sits near
  // the top of the staff. Sizing tuned to fill ~70% of the staff height
  // without crowding the reserved clefRoom.
  if (clef === 'bass') {
    return (
      <text x={x} y={top + step * 2.2} fontSize={step * 7.4} fontFamily="Bravura, serif" fill="#6B6459" dominantBaseline="auto">
        𝄢
      </text>
    )
  }
  return (
    <text x={x} y={top + step * 6} fontSize={step * 8} fontFamily="Bravura, serif" fill="#6B6459" dominantBaseline="auto">
      𝄞
    </text>
  )
}

function Notehead({ x, y, fontSize, fill = '#1A1A18' }: { x: number; y: number; fontSize: number; fill?: string }) {
  return (
    <text x={x} y={y} fontSize={fontSize} fontFamily="Bravura, serif" fill={fill} textAnchor="middle" dominantBaseline="central">
      {String.fromCodePoint(0xE0A4)}
    </text>
  )
}

function Accidental({ pitch, x, y, fontSize, fill = '#1A1A18' }: { pitch: string; x: number; y: number; fontSize: number; fill?: string }) {
  const m = ACCIDENTAL_MAP[pitch]
  if (!m) return null
  return (
    <text x={x} y={y} fontSize={fontSize * 0.78} fontFamily="Bravura, serif" fill={fill} textAnchor="middle" dominantBaseline="central">
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

// Multi-line landmark caption. Long labels like "Bass C (octave below
// middle)" don't fit a single column, so they render across two tspans
// with the line break supplied as `\n` in the label string.
function LandmarkCaption({ label, x, y, fontSize }: { label: string; x: number; y: number; fontSize: number }) {
  const lines = label.split('\n')
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily="var(--font-cormorant), serif"
      fontSize={fontSize}
      fontStyle="italic"
      fill="#5A4F40"
    >
      {lines.map((line, idx) => (
        <tspan key={idx} x={x} dy={idx === 0 ? 0 : fontSize * 1.15}>
          {line}
        </tspan>
      ))}
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
      lines.push(<line key={`lb-${p}`} x1={x - halfWidth} y1={ly} x2={x + halfWidth} y2={ly} stroke="#6B6459" strokeWidth="1.1" />)
    }
  } else if (pos <= -2) {
    for (let p = -2; p >= pos; p -= 2) {
      const ly = top + p * step
      lines.push(<line key={`la-${p}`} x1={x - halfWidth} y1={ly} x2={x + halfWidth} y2={ly} stroke="#6B6459" strokeWidth="1.1" />)
    }
  }
  return <g>{lines}</g>
}
