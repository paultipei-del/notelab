'use client'
import React from 'react'

interface NoteState {
  note: string
  status: 'pending' | 'correct' | 'wrong' | 'active'
}

interface MultiNoteStaffProps {
  notes: NoteState[]
  clef: 'treble' | 'bass' | 'grand'
}

const TREBLE_POSITIONS: Record<string, number> = {
  'E6': -6, 'D6': -5, 'C6': -4, 'B5': -3, 'A5': -2, 'G5': -1,
  'F5': 0, 'E5': 1, 'D5': 2, 'C5': 3, 'B4': 4,
  'A4': 5, 'G4': 6, 'F4': 7, 'E4': 8,
  'D4': 9, 'C4': 10, 'B3': 11, 'A3': 12, 'G3': 13, 'F3': 14,
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
  'C#2': { natural: 'C2', acc: 'sharp' }, 'Db2': { natural: 'D2', acc: 'flat' },
  'D#2': { natural: 'D2', acc: 'sharp' }, 'Eb2': { natural: 'E2', acc: 'flat' },
  'F#2': { natural: 'F2', acc: 'sharp' }, 'Gb2': { natural: 'G2', acc: 'flat' },
  'G#2': { natural: 'G2', acc: 'sharp' }, 'Ab2': { natural: 'A2', acc: 'flat' },
  'A#2': { natural: 'A2', acc: 'sharp' }, 'Bb2': { natural: 'B2', acc: 'flat' },
  'C#6': { natural: 'C6', acc: 'sharp' }, 'Db6': { natural: 'D6', acc: 'flat' },
  'D#6': { natural: 'D6', acc: 'sharp' }, 'Eb6': { natural: 'E6', acc: 'flat' },
}

const NOTE_COLORS = {
  pending: '#1A1A18',
  active: '#BA7517',
  correct: '#4CAF50',
  wrong: '#E53935',
}

const FEEDBACK_SYMBOLS = {
  correct: '✓',
  wrong: '✗',
  pending: '',
  active: '',
}

export default function MultiNoteStaff({ notes, clef }: MultiNoteStaffProps) {
  const step = 6
  const staffTop = 65
  const clefWidth = 52
  const noteSpacing = 52
  const leftPad = 20
  const rightPad = 24

  const staffWidth = clefWidth + notes.length * noteSpacing + rightPad
  const W = leftPad + staffWidth
  const H = 210

  const positions = clef === 'bass' ? BASS_POSITIONS : TREBLE_POSITIONS

  // Compute noteX for each note
  const noteXs = notes.map((_, i) => leftPad + clefWidth + i * noteSpacing + 20)

  // Staff lines
  const staffLines = [0, 2, 4, 6, 8].map(p => {
    const y = staffTop + p * step
    return <line key={p} x1={leftPad} y1={y} x2={leftPad + staffWidth} y2={y}
      stroke="#1A1A18" strokeWidth="1.2" />
  })

  // Clef
  const clefEl = clef === 'bass'
    ? <text x={leftPad + 2} y={staffTop + 13} fontSize="52" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄢</text>
    : <text x={leftPad} y={staffTop + 36} fontSize="50" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄞</text>

  const noteEls = notes.map((noteState, i) => {
    const { note, status } = noteState
    const accInfo = ACCIDENTAL_MAP[note]
    const naturalNote = accInfo ? accInfo.natural : note
    const accidental = accInfo ? accInfo.acc : null
    const pos = positions[naturalNote]
    if (pos === undefined) return null

    const noteX = noteXs[i]
    const noteY = staffTop + pos * step
    const color = NOTE_COLORS[status]
    const stemUp = pos >= 4

    // Ledger lines below
    const ledgers: React.ReactElement[] = []
    for (let p = 10; p <= pos; p += 2) {
      const y = staffTop + p * step
      ledgers.push(<line key={'b'+p+i} x1={noteX-12} y1={y} x2={noteX+12} y2={y} stroke="#1A1A18" strokeWidth="1.2" />)
    }
    // Ledger lines above
    for (let p = -2; p >= pos; p -= 2) {
      const y = staffTop + p * step
      ledgers.push(<line key={'a'+p+i} x1={noteX-12} y1={y} x2={noteX+12} y2={y} stroke="#1A1A18" strokeWidth="1.2" />)
    }

    // Active indicator — small dot below staff
    const activeIndicator = status === 'active'
      ? <circle cx={noteX} cy={staffTop + 10 * step + 12} r={3} fill="#BA7517" />
      : null

    // Feedback symbol above/below
    const feedbackEl = (status === 'correct' || status === 'wrong') ? (
      <text
        x={noteX}
        y={stemUp ? noteY - 52 : noteY + 52}
        fontSize="14"
        fontFamily="var(--font-jost), sans-serif"
        fill={color}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {FEEDBACK_SYMBOLS[status]}
      </text>
    ) : null

    return (
      <g key={i}>
        {ledgers}
        {/* Accidental */}
        {accidental && (
          <text x={noteX - 14} y={noteY} fontSize="30" fontFamily="Bravura, serif"
            fill={color} dominantBaseline="central" textAnchor="middle">
            {accidental === 'sharp' ? '' : ''}
          </text>
        )}
        {/* Notehead */}
        <ellipse cx={noteX} cy={noteY} rx={9} ry={6} fill={color}
          transform={`rotate(-15, ${noteX}, ${noteY})`} />
        {/* Stem */}
        <line
          x1={stemUp ? noteX + 8.5 : noteX - 8.5} y1={noteY}
          x2={stemUp ? noteX + 8.5 : noteX - 8.5} y2={stemUp ? noteY - 44 : noteY + 44}
          stroke={color} strokeWidth="1.6" />
        {activeIndicator}
        {feedbackEl}
      </g>
    )
  })

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      {staffLines}
      {clefEl}
      {noteEls}
    </svg>
  )
}
