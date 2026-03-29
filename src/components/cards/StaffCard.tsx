'use client'

interface StaffCardProps {
  note: string
  clef: 'treble' | 'bass' | 'grand'
  className?: string
}

// pos 0 = top staff line, pos 8 = bottom staff line
// each integer step = one line or space = step/2 px
const TREBLE_POSITIONS: Record<string, number> = {
  'E6': -6, 'D6': -5, 'C6': -4, 'B5': -3, 'A5': -2, 'G5': -1,
  'F5': 0, 'E5': 1, 'D5': 2, 'C5': 3, 'B4': 4,
  'A4': 5, 'G4': 6, 'F4': 7, 'E4': 8,
  'D4': 9, 'C4': 10, 'B3': 11, 'A3': 12, 'G3': 13, 'F3': 14, 'E3': 15, 'D3': 16, 'C3': 17,
}

const BASS_POSITIONS: Record<string, number> = {
  'G4': -6, 'F4': -5, 'E4': -4, 'D4': -3, 'C4': -2, 'B3': -1,
  'A3': 0, 'G3': 1, 'F3': 2, 'E3': 3, 'D3': 4,
  'C3': 5, 'B2': 6, 'A2': 7, 'G2': 8,
  'F2': 9, 'E2': 10, 'D2': 11, 'C2': 12, 'B1': 13, 'A1': 14,
}

// Map enharmonic/chromatic notes to their natural position + accidental
// e.g. C#4 sits on C4's line with a sharp before it
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
  'F#6': { natural: 'F6', acc: 'sharp' }, 'Gb6': { natural: 'G6', acc: 'flat' },
  'D#6': { natural: 'D6', acc: 'sharp' }, 'Eb6': { natural: 'E6', acc: 'flat' },
  // Bass octave 2
  'C#2': { natural: 'C2', acc: 'sharp' }, 'Db2': { natural: 'D2', acc: 'flat' },
  'D#2': { natural: 'D2', acc: 'sharp' }, 'Eb2': { natural: 'E2', acc: 'flat' },
  'F#2': { natural: 'F2', acc: 'sharp' }, 'Gb2': { natural: 'G2', acc: 'flat' },
  'G#2': { natural: 'G2', acc: 'sharp' }, 'Ab2': { natural: 'A2', acc: 'flat' },
  'A#2': { natural: 'A2', acc: 'sharp' }, 'Bb2': { natural: 'B2', acc: 'flat' },
  // Bass octave 1
  'G#1': { natural: 'G1', acc: 'sharp' }, 'Ab1': { natural: 'A1', acc: 'flat' },
  'A#1': { natural: 'A1', acc: 'sharp' }, 'Bb1': { natural: 'B1', acc: 'flat' },
}

export default function StaffCard({ note, clef, className = '' }: StaffCardProps) {
  const W = 280
  const H = 210
  const step = 6
  const staffTop = 65
  const staffLeft = 50
  const staffWidth = 185
  const noteX = staffLeft + staffWidth / 2 + 10

  const positions = clef === 'bass' ? BASS_POSITIONS : TREBLE_POSITIONS

  // Resolve chromatic notes
  const accInfo = ACCIDENTAL_MAP[note]
  const naturalNote = accInfo ? accInfo.natural : note
  const accidental = accInfo ? accInfo.acc : null

  const pos = positions[naturalNote]
  const noteY = pos !== undefined ? staffTop + pos * step : staffTop + 24

  // 5 staff lines
  const staffLines = [0, 2, 4, 6, 8].map(p => {
    const y = staffTop + p * step
    return <line key={p} x1={staffLeft} y1={y} x2={staffLeft + staffWidth} y2={y}
      stroke="#1A1A18" strokeWidth="1.2" />
  })

  // Ledger lines
  const ledgerLines = []
  if (pos !== undefined) {
    for (let p = 10; p <= pos; p += 2) {
      const y = staffTop + p * step
      ledgerLines.push(<line key={'b'+p} x1={noteX-14} y1={y} x2={noteX+14} y2={y}
        stroke="#1A1A18" strokeWidth="1.2" />)
    }
    for (let p = -2; p >= pos; p -= 2) {
      const y = staffTop + p * step
      ledgerLines.push(<line key={'a'+p} x1={noteX-14} y1={y} x2={noteX+14} y2={y}
        stroke="#1A1A18" strokeWidth="1.2" />)
    }
  }

  // Clef
  const clefSymbol = clef !== 'bass' ? (
    <text x={staffLeft} y={staffTop + 36} fontSize="50" fontFamily="Bravura, serif"
      fill="#1A1A18" dominantBaseline="auto">𝄞</text>
  ) : (
    <text x={staffLeft + 2} y={staffTop + 13} fontSize="52" fontFamily="Bravura, serif"
      fill="#1A1A18" dominantBaseline="auto">𝄢</text>
  )

  // Accidental glyph (Bravura: sharp=E262, flat=E260)
  const accidentalEl = accidental && pos !== undefined ? (
    <text
      x={noteX - 16}
      y={noteY}
      fontSize="36"
      fontFamily="Bravura, serif"
      fill="#1A1A18"
      dominantBaseline="central"
      textAnchor="middle"
    >
      {accidental === 'sharp' ? '\uE262' : '\uE260'}
    </text>
  ) : null

  // Note + stem — Bravura notehead glyph U+E0A4
  const stemUp = pos === undefined || pos >= 4
  // U+E0A4 = filled notehead only, U+E0A3 = half notehead
  const noteEl = pos !== undefined ? (
    <g>
      <text
        x={noteX}
        y={noteY}
        fontSize="44"
        fontFamily="Bravura, serif"
        fill="#1A1A18"
        textAnchor="middle"
        dominantBaseline="central"
      >{String.fromCodePoint(0xE0A4)}</text>
      <line
        x1={stemUp ? noteX + 7 : noteX - 8} y1={noteY}
        x2={stemUp ? noteX + 7 : noteX - 8} y2={stemUp ? noteY - 44 : noteY + 44}
        stroke="#1A1A18" strokeWidth="1.6" />
    </g>
  ) : null

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg" className={className}
      aria-label={`${note} on ${clef} clef`}>
      {staffLines}
      {ledgerLines}
      {clefSymbol}
      {accidentalEl}
      {noteEl}
    </svg>
  )
}
