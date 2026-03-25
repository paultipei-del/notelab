'use client'
import React from 'react'

interface GrandStaffCardProps {
  note: string
  className?: string
}

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
  'F2': 9, 'E2': 10, 'D2': 11, 'C2': 12, 'B1': 13, 'A1': 14,
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
  'G#1': { natural: 'G1', acc: 'sharp' }, 'Ab1': { natural: 'A1', acc: 'flat' },
  'A#1': { natural: 'A1', acc: 'sharp' }, 'Bb1': { natural: 'B1', acc: 'flat' },
}

const TREBLE_NOTES = new Set(Object.keys(TREBLE_POSITIONS))

function isOnTreble(note: string): boolean {
  const accInfo = ACCIDENTAL_MAP[note]
  const natural = accInfo ? accInfo.natural : note
  return TREBLE_NOTES.has(natural)
}

export default function GrandStaffCard({ note, className = '' }: GrandStaffCardProps) {
  const W = 300
  const step = 6
  const staffLeft = 60
  const staffWidth = 200
  const noteX = staffLeft + staffWidth / 2 + 10

  const trebleTop = 55
  const bassTop = trebleTop + 8 * step + 48

  const accInfo = ACCIDENTAL_MAP[note]
  const naturalNote = accInfo ? accInfo.natural : note
  const accidental = accInfo ? accInfo.acc : null

  const onTreble = isOnTreble(note)
  const positions = onTreble ? TREBLE_POSITIONS : BASS_POSITIONS
  const activeStaffTop = onTreble ? trebleTop : bassTop
  const pos = positions[naturalNote]
  const noteY = pos !== undefined ? activeStaffTop + pos * step : activeStaffTop + 24

  const braceTop = trebleTop
  const braceBottom = bassTop + 8 * step
  const braceMid = (braceTop + braceBottom) / 2
  const braceHeight = braceBottom - braceTop
  const braceFontSize = braceHeight * 1.00

  const H = bassTop + 8 * step + 50

  function staffLines(top: number, key: string) {
    return [0, 2, 4, 6, 8].map(p => (
      <line key={key + p} x1={staffLeft} y1={top + p * step}
        x2={staffLeft + staffWidth} y2={top + p * step}
        stroke="#1A1A18" strokeWidth="1.2" />
    ))
  }

  const ledgerLines: React.ReactElement[] = []
  if (pos !== undefined) {
    for (let p = 10; p <= pos; p += 2) {
      const y = activeStaffTop + p * step
      ledgerLines.push(<line key={'b'+p} x1={noteX-14} y1={y} x2={noteX+14} y2={y} stroke="#1A1A18" strokeWidth="1.2" />)
    }
    for (let p = -2; p >= pos; p -= 2) {
      const y = activeStaffTop + p * step
      ledgerLines.push(<line key={'a'+p} x1={noteX-14} y1={y} x2={noteX+14} y2={y} stroke="#1A1A18" strokeWidth="1.2" />)
    }
  }

  const connectLine = (
    <line x1={staffLeft} y1={trebleTop} x2={staffLeft} y2={bassTop + 8 * step}
      stroke="#1A1A18" strokeWidth="1.5" />
  )

  const brace = (
    <text
      x={staffLeft - 8}
      y={braceTop + braceFontSize * 1.00}
      fontSize={braceFontSize}
      fontFamily="Bravura, serif"
      fill="#1A1A18"
      textAnchor="middle"
      dominantBaseline="auto"
    >
      {'\uE000'}
    </text>
  )

  const trebleClef = (
    <text x={staffLeft + 2} y={trebleTop + 36} fontSize="50" fontFamily="Bravura, serif"
      fill="#1A1A18" dominantBaseline="auto">𝄞</text>
  )

  const bassClef = (
    <text x={staffLeft + 2} y={bassTop + 13} fontSize="52" fontFamily="Bravura, serif"
      fill="#1A1A18" dominantBaseline="auto">𝄢</text>
  )

  const accidentalEl = accidental && pos !== undefined ? (
    <text x={noteX - 16} y={noteY} fontSize="30" fontFamily="Bravura, serif"
      fill="#1A1A18" dominantBaseline="central" textAnchor="middle">
      {accidental === 'sharp' ? '\uE262' : '\uE260'}
    </text>
  ) : null

  const stemUp = pos === undefined || pos >= 4
  const noteEl = pos !== undefined ? (
    <g>
      <ellipse cx={noteX} cy={noteY} rx={9} ry={6} fill="#1A1A18"
        transform={`rotate(-15, ${noteX}, ${noteY})`} />
      <line
        x1={stemUp ? noteX + 8.5 : noteX - 8.5} y1={noteY}
        x2={stemUp ? noteX + 8.5 : noteX - 8.5} y2={stemUp ? noteY - 44 : noteY + 44}
        stroke="#1A1A18" strokeWidth="1.6" />
    </g>
  ) : null

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg" className={className}
      aria-label={`${note} on grand staff`}>
      {connectLine}
      {brace}
      {staffLines(trebleTop, 't')}
      {staffLines(bassTop, 'b')}
      {ledgerLines}
      {trebleClef}
      {bassClef}
      {accidentalEl}
      {noteEl}
    </svg>
  )
}
