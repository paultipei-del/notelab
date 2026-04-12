'use client'

import { useState } from 'react'
import type { NoteStats } from '@/lib/programs/note-reading/types'

// ── Position tables (same coordinate system as StaffCard / GrandStaffCard) ──
// pos 0 = top line, pos 8 = bottom line, step=6px per position
const TREBLE_POSITIONS: Record<string, number> = {
  'E6': -6, 'D6': -5, 'C6': -4, 'B5': -3, 'A5': -2, 'G5': -1,
  'F5': 0, 'E5': 1, 'D5': 2, 'C5': 3, 'B4': 4,
  'A4': 5, 'G4': 6, 'F4': 7, 'E4': 8,
  'D4': 9, 'C4': 10, 'B3': 11, 'A3': 12,
}

const BASS_POSITIONS: Record<string, number> = {
  'G4': -6, 'F4': -5, 'E4': -4, 'D4': -3, 'C4': -2, 'B3': -1,
  'A3': 0, 'G3': 1, 'F3': 2, 'E3': 3, 'D3': 4,
  'C3': 5, 'B2': 6, 'A2': 7, 'G2': 8,
  'F2': 9, 'E2': 10, 'D2': 11, 'C2': 12,
}

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
  'C#6': { natural: 'C6', acc: 'sharp' }, 'Db6': { natural: 'D6', acc: 'flat' },
  'D#6': { natural: 'D6', acc: 'sharp' }, 'Eb6': { natural: 'E6', acc: 'flat' },
  'F#6': { natural: 'F6', acc: 'sharp' }, 'Gb6': { natural: 'G6', acc: 'flat' },
  'C#2': { natural: 'C2', acc: 'sharp' }, 'Db2': { natural: 'D2', acc: 'flat' },
  'D#2': { natural: 'D2', acc: 'sharp' }, 'Eb2': { natural: 'E2', acc: 'flat' },
  'F#2': { natural: 'F2', acc: 'sharp' }, 'Gb2': { natural: 'G2', acc: 'flat' },
  'G#2': { natural: 'G2', acc: 'sharp' }, 'Ab2': { natural: 'A2', acc: 'flat' },
  'A#2': { natural: 'A2', acc: 'sharp' }, 'Bb2': { natural: 'B2', acc: 'flat' },
}

const TREBLE_NOTES = new Set(Object.keys(TREBLE_POSITIONS))

function isOnTreble(note: string): boolean {
  const accInfo = ACCIDENTAL_MAP[note]
  const natural = accInfo ? accInfo.natural : note
  return TREBLE_NOTES.has(natural)
}

// MIDI pitch for sorting (low → high)
function noteToMidi(name: string): number {
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  const ENARH: Record<string,string> = { 'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#' }
  const m = name.match(/^([A-Gb#]+)(\d)$/)
  if (!m) return 60
  const pc = ENARH[m[1]] ?? m[1]
  return (parseInt(m[2]) + 1) * 12 + (NOTE_NAMES.indexOf(pc) ?? 0)
}

const MASTERY_COLORS = {
  unseen:     '#D9D6CE',
  weak:       '#C9614A',
  developing: '#D4963A',
  strong:     '#5A8A5E',
} as const

const F = 'var(--font-jost), sans-serif'

type Tooltip = { noteId: string; x: number; y: number; stats: NoteStats | undefined }

interface NoteHeatMapProps {
  notePool: string[]
  noteStats: NoteStats[]
  clef: 'treble' | 'bass' | 'grand'
}

export default function NoteHeatMap({ notePool, noteStats, clef }: NoteHeatMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  // ── Layout constants ──────────────────────────────────────────────────────
  const step = 6
  const staffLeft = 58
  const staffWidth = 390          // total staff line width
  const noteAreaLeft = 112        // where note circles start (after clef glyphs)
  const noteAreaRight = staffLeft + staffWidth - 8
  const R = 5                     // circle radius
  const trebleTop = 48
  const bassTop = trebleTop + 8 * step + 44

  // Choose which notes go on which staff
  const showTreble = clef === 'treble' || clef === 'grand'
  const showBass = clef === 'bass' || clef === 'grand'

  const trebleNotes = showTreble
    ? notePool.filter(n => isOnTreble(n)).sort((a, b) => noteToMidi(a) - noteToMidi(b))
    : []
  const bassNotes = showBass
    ? notePool.filter(n => !isOnTreble(n)).sort((a, b) => noteToMidi(a) - noteToMidi(b))
    : []

  // For single-staff modules, also include notes the other way if only one staff
  const allNotesOnOneSide = clef !== 'grand'
  const singleNotes = allNotesOnOneSide
    ? notePool.sort((a, b) => noteToMidi(a) - noteToMidi(b))
    : []

  // X position for the i-th note in a pool of n
  function noteX(i: number, n: number): number {
    if (n === 0) return noteAreaLeft
    const span = noteAreaRight - noteAreaLeft
    return noteAreaLeft + ((i + 1) * span) / (n + 1)
  }

  // Y position from staff top + position table
  function noteY(note: string, staffTop: number, posTable: Record<string, number>): number {
    const accInfo = ACCIDENTAL_MAP[note]
    const natural = accInfo ? accInfo.natural : note
    const pos = posTable[natural]
    return pos !== undefined ? staffTop + pos * step : staffTop + 4 * step
  }

  // SVG height
  const svgH = showBass ? bassTop + 8 * step + 56 : trebleTop + 8 * step + 56
  const svgW = staffLeft + staffWidth + 8

  // Staff lines
  function staffLines(top: number, key: string) {
    return [0, 2, 4, 6, 8].map(p => (
      <line key={key + p}
        x1={staffLeft} y1={top + p * step}
        x2={staffLeft + staffWidth} y2={top + p * step}
        stroke="#1A1A18" strokeWidth="1" opacity="0.5" />
    ))
  }

  // Ledger lines for a note
  function ledgerLines(note: string, cx: number, cy: number, staffTop: number, posTable: Record<string, number>) {
    const accInfo = ACCIDENTAL_MAP[note]
    const natural = accInfo ? accInfo.natural : note
    const pos = posTable[natural]
    if (pos === undefined) return null
    const lines = []
    // Below staff: pos > 8
    for (let p = 10; p <= pos; p += 2) {
      const y = staffTop + p * step
      lines.push(<line key={'b'+p} x1={cx - 11} y1={y} x2={cx + 11} y2={y} stroke="#1A1A18" strokeWidth="1" opacity="0.4" />)
    }
    // Above staff: pos < 0
    for (let p = -2; p >= pos; p -= 2) {
      const y = staffTop + p * step
      lines.push(<line key={'a'+p} x1={cx - 11} y1={y} x2={cx + 11} y2={y} stroke="#1A1A18" strokeWidth="1" opacity="0.4" />)
    }
    return lines
  }

  // Render notes for a given staff
  function renderNotes(
    notes: string[],
    staffTop: number,
    posTable: Record<string, number>,
    noteList: string[],  // same as notes, for index
  ) {
    return notes.map((note, i) => {
      const stats = noteStats.find(s => s.noteId === note)
      const level = stats?.masteryLevel ?? 'unseen'
      const fill = MASTERY_COLORS[level]
      const cx = noteX(i, notes.length)
      const cy = noteY(note, staffTop, posTable)
      const accInfo = ACCIDENTAL_MAP[note]

      return (
        <g key={note + i}>
          {ledgerLines(note, cx, cy, staffTop, posTable)}
          {/* Accidental glyph */}
          {accInfo && (
            <text
              x={cx - R - 8}
              y={cy}
              fontSize="14"
              fontFamily="Bravura, serif"
              fill={fill}
              dominantBaseline="central"
              textAnchor="middle"
              opacity="0.9"
            >
              {accInfo.acc === 'sharp' ? '\uE262' : '\uE260'}
            </text>
          )}
          {/* Bravura filled notehead U+E0A4 */}
          <text
            x={cx} y={cy}
            fontSize="44"
            fontFamily="Bravura, serif"
            fill={fill}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onMouseEnter={() => setTooltip({ noteId: note, x: cx, y: cy, stats })}
            onMouseLeave={() => setTooltip(null)}
            onClick={() => setTooltip(t => t?.noteId === note ? null : { noteId: note, x: cx, y: cy, stats })}
          >
            {String.fromCodePoint(0xE0A4)}
          </text>
        </g>
      )
    })
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${svgW} ${svgH}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible' }}
        onClick={e => {
          // Dismiss tooltip when clicking SVG background
          if ((e.target as SVGElement).tagName === 'svg') setTooltip(null)
        }}
      >
        {/* Grand staff connecting bar + brace */}
        {showTreble && showBass && (() => {
          const braceH = bassTop + 8 * step - trebleTop
          return (
            <>
              <line
                x1={staffLeft} y1={trebleTop}
                x2={staffLeft} y2={bassTop + 8 * step}
                stroke="#1A1A18" strokeWidth="1.5" opacity="0.5"
              />
              <text
                x={staffLeft - 8}
                y={trebleTop + braceH}
                fontSize={braceH}
                fontFamily="Bravura, serif"
                fill="#1A1A18"
                textAnchor="middle"
                dominantBaseline="auto"
                opacity="0.5"
              >{'\uE000'}</text>
            </>
          )
        })()}

        {/* Treble staff */}
        {showTreble && (
          <>
            {staffLines(trebleTop, 't')}
            <text
              x={staffLeft + 6} y={trebleTop + 36}
              fontSize="44" fontFamily="Bravura, serif"
              fill="#1A1A18" dominantBaseline="auto" opacity="0.5"
            >𝄞</text>
            {renderNotes(
              clef === 'grand' ? trebleNotes : singleNotes,
              trebleTop,
              TREBLE_POSITIONS,
              clef === 'grand' ? trebleNotes : singleNotes,
            )}
          </>
        )}

        {/* Bass staff */}
        {showBass && (
          <>
            {staffLines(bassTop, 'b')}
            <text
              x={staffLeft + 6} y={bassTop + 13}
              fontSize="46" fontFamily="Bravura, serif"
              fill="#1A1A18" dominantBaseline="auto" opacity="0.5"
            >𝄢</text>
            {renderNotes(
              clef === 'grand' ? bassNotes : singleNotes,
              bassTop,
              BASS_POSITIONS,
              clef === 'grand' ? bassNotes : singleNotes,
            )}
          </>
        )}

        {/* Tooltip (SVG foreignObject) */}
        {tooltip && (() => {
          const s = tooltip.stats
          const tipW = 130
          const tipH = s?.avgResponseMs ? 72 : 58
          let tx = tooltip.x - tipW / 2
          let ty = tooltip.y - tipH - 12
          if (tx < 4) tx = 4
          if (tx + tipW > svgW - 4) tx = svgW - tipW - 4
          if (ty < 4) ty = tooltip.y + 14  // flip below if no space above
          return (
            <foreignObject x={tx} y={ty} width={tipW} height={tipH}>
              <div
                // @ts-ignore
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  background: '#1A1A18',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  pointerEvents: 'none',
                }}
              >
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '16px', fontWeight: 400, color: 'white', margin: '0 0 2px' }}>
                  {tooltip.noteId}
                </p>
                {s && s.attempts > 0 ? (
                  <>
                    <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                      {Math.round(s.accuracy * 100)}% · {s.attempts} attempt{s.attempts !== 1 ? 's' : ''}
                    </p>
                    {s.avgResponseMs > 0 && (
                      <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                        avg {(s.avgResponseMs / 1000).toFixed(1)}s response
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    Not yet attempted
                  </p>
                )}
              </div>
            </foreignObject>
          )
        })()}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
        {(Object.entries(MASTERY_COLORS) as [keyof typeof MASTERY_COLORS, string][]).map(([level, color]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" style={{ flexShrink: 0, overflow: 'visible' }}>
              <text x="6" y="6" fontSize="18" fontFamily="Bravura, serif" fill={color} textAnchor="middle" dominantBaseline="central">
                {String.fromCodePoint(0xE0A4)}
              </text>
            </svg>
            <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', textTransform: 'capitalize' as const }}>
              {level}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
