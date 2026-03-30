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

const TREBLE_NOTES = new Set(Object.keys(TREBLE_POSITIONS))
// In grand staff context, notes D4 and below go to bass staff
const GRAND_TREBLE_NOTES = new Set(['E6','D6','C6','B5','A5','G5','F5','E5','D5','C5','B4','A4','G4','F4','E4'])

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

function drawNote(
  noteState: NoteState,
  noteX: number,
  staffTop: number,
  pos: number,
  step: number,
  i: number,
  feedbackY: number
): React.ReactElement {
  const { note, status } = noteState
  const accInfo = ACCIDENTAL_MAP[note]
  const accidental = accInfo ? accInfo.acc : null
  const color = NOTE_COLORS[status]
  const noteY = staffTop + pos * step
  const stemUp = pos >= 4

  const ledgers: React.ReactElement[] = []
  for (let p = 10; p <= pos; p += 2) {
    const y = staffTop + p * step
    ledgers.push(<line key={'b'+p+i} x1={noteX-12} y1={y} x2={noteX+12} y2={y} stroke="#1A1A18" strokeWidth="1.2" />)
  }
  for (let p = -2; p >= pos; p -= 2) {
    const y = staffTop + p * step
    ledgers.push(<line key={'a'+p+i} x1={noteX-12} y1={y} x2={noteX+12} y2={y} stroke="#1A1A18" strokeWidth="1.2" />)
  }

  return (
    <g key={i}>
      {ledgers}
      {accidental && (
        <text x={noteX - 18} y={noteY} fontSize="36" fontFamily="Bravura, serif"
          fill={color} dominantBaseline="central" textAnchor="middle">
          {accidental === 'sharp' ? '' : ''}
        </text>
      )}
      <text x={noteX} y={noteY} fontSize="46" fontFamily="Bravura, serif" fill={color} textAnchor="middle" dominantBaseline="central">{String.fromCodePoint(0xE0A4)}</text>
      <line
        x1={stemUp ? noteX + 6 : noteX - 6} y1={noteY}
        x2={stemUp ? noteX + 6 : noteX - 6} y2={stemUp ? noteY - 38 : noteY + 38}
        stroke={color} strokeWidth="1.6" />
    </g>
  )
}

export default function MultiNoteStaff({ notes, clef }: MultiNoteStaffProps) {
  const step = 6
  const trebleTop = 70
  const bassTop = trebleTop + 8 * step + 48
  const staffLeft = 20
  const clefWidth = 52
  const noteSpacing = 52
  const rightPad = 24
  const staffWidth = clefWidth + notes.length * noteSpacing + rightPad
  const W = staffLeft + staffWidth
  const H = clef === 'grand' ? bassTop + 8 * step + 60 : trebleTop + 8 * step + 60
  const feedbackY = trebleTop - 24  // above staff

  const noteXs = notes.map((_, i) => staffLeft + clefWidth + i * noteSpacing + 20)

  function staffLines(top: number, key: string) {
    return [0, 2, 4, 6, 8].map(p => (
      <line key={key+p} x1={staffLeft} y1={top + p * step}
        x2={staffLeft + staffWidth} y2={top + p * step}
        stroke="#1A1A18" strokeWidth="1.2" />
    ))
  }

  // For grand staff: vertical connecting line + brace
  const grandConnectors = clef === 'grand' ? (
    <>
      <line x1={staffLeft} y1={trebleTop} x2={staffLeft} y2={bassTop + 8 * step}
        stroke="#1A1A18" strokeWidth="1.5" />
    </>
  ) : null

  const trebleClef = <text x={staffLeft + 2} y={trebleTop + 36} fontSize="50"
    fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄞</text>
  const bassClef = <text x={staffLeft + 2} y={bassTop + 13} fontSize="52"
    fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">𝄢</text>

  const noteEls = notes.map((noteState, i) => {
    const { note } = noteState
    const accInfo = ACCIDENTAL_MAP[note]
    const naturalNote = accInfo ? accInfo.natural : note
    const noteX = noteXs[i]

    if (clef === 'grand') {
      const onTreble = GRAND_TREBLE_NOTES.has(naturalNote)
      const positions = onTreble ? TREBLE_POSITIONS : BASS_POSITIONS
      const activeStaffTop = onTreble ? trebleTop : bassTop
      const pos = positions[naturalNote]
      if (pos === undefined) return null
      return drawNote(noteState, noteX, activeStaffTop, pos, step, i, feedbackY)
    } else {
      const positions = clef === 'bass' ? BASS_POSITIONS : TREBLE_POSITIONS
      const pos = positions[naturalNote]
      if (pos === undefined) return null
      return drawNote(noteState, noteX, trebleTop, pos, step, i, feedbackY)
    }
  })

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
      {grandConnectors}
      {staffLines(trebleTop, 't')}
      {clef === 'grand' && staffLines(bassTop, 'b')}
      {clef !== 'bass' && trebleClef}
      {(clef === 'bass' || clef === 'grand') && bassClef}
      {clef === 'bass' && staffLines(trebleTop, 't')}
      {noteEls}
      {/* Status indicators below each note */}
      {notes.map((ns, i) => {
        const nx = noteXs[i]
        const indicatorY = feedbackY
        if (ns.status === 'correct') {
          return (
            <g key={`ind-${i}`}>
              <circle cx={nx} cy={indicatorY} r={10} fill="#4CAF50" />
              <text x={nx} y={indicatorY} fontSize="12" fontFamily="var(--font-jost), sans-serif"
                fill="white" textAnchor="middle" dominantBaseline="central">✓</text>
            </g>
          )
        }
        if (ns.status === 'wrong') {
          return (
            <g key={`ind-${i}`}>
              <circle cx={nx} cy={indicatorY} r={10} fill="#E53935" />
              <text x={nx} y={indicatorY} fontSize="12" fontFamily="var(--font-jost), sans-serif"
                fill="white" textAnchor="middle" dominantBaseline="central">✗</text>
              <text x={nx} y={indicatorY + 22} fontSize="12" fontFamily="var(--font-cormorant), serif"
                fill="#E53935" textAnchor="middle" dominantBaseline="central">
                {ns.note.replace(/\d+$/, '')}
              </text>
            </g>
          )
        }
        return null
      })}
    </svg>
  )
}
