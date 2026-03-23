'use client'

interface StaffCardProps {
  note: string
  clef: 'treble' | 'bass'
  className?: string
}

// pos 0 = top staff line, pos 8 = bottom staff line
// each integer step = one line or space = lineSpacing/2 px
// negative = above staff, >8 = below staff
const TREBLE_POSITIONS: Record<string, number> = {
  'C6': -4, 'B5': -3, 'A5': -2, 'G5': -1,
  'F5': 0, 'E5': 1, 'D5': 2, 'C5': 3, 'B4': 4,
  'A4': 5, 'G4': 6, 'F4': 7, 'E4': 8,
  'D4': 9, 'C4': 10,
}

const BASS_POSITIONS: Record<string, number> = {
  'E4': -4, 'D4': -3, 'C4': -2, 'B3': -1,
  'A3': 0, 'G3': 1, 'F3': 2, 'E3': 3, 'D3': 4,
  'C3': 5, 'B2': 6, 'A2': 7, 'G2': 8,
  'F2': 9, 'E2': 10,
}

export default function StaffCard({ note, clef, className = '' }: StaffCardProps) {
  const W = 280
  const H = 160
  const step = 6          // pixels per half-step (line-to-space)
  const staffTop = 55     // y of top staff line
  const staffLeft = 50
  const staffWidth = 185
  const noteX = staffLeft + staffWidth / 2 + 10

  const positions = clef === 'treble' ? TREBLE_POSITIONS : BASS_POSITIONS
  const pos = positions[note]
  const noteY = pos !== undefined ? staffTop + pos * step : staffTop + 24

  // 5 staff lines at positions 0, 2, 4, 6, 8
  const staffLines = [0, 2, 4, 6, 8].map(p => {
    const y = staffTop + p * step
    return <line key={p} x1={staffLeft} y1={y} x2={staffLeft + staffWidth} y2={y}
      stroke="#1A1A18" strokeWidth="1.2" />
  })

  // Ledger lines below staff (pos 10, 12...)
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

  const clefSymbol = clef === 'treble' ? (
    <text x={staffLeft} y={staffTop + 36} fontSize="50" fontFamily="Bravura, serif"
      fill="#1A1A18" dominantBaseline="auto">𝄞</text>
  ) : (
    <text x={staffLeft + 2} y={staffTop + 13} fontSize="52" fontFamily="Bravura, serif"
      fill="#1A1A18" dominantBaseline="auto">𝄢</text>
  )

  const stemUp = pos === undefined || pos >= 3
  const noteEl = pos !== undefined ? (
    <g>
      <ellipse
        cx={noteX}
        cy={noteY}
        rx={9}
        ry={6}
        fill="#1A1A18"
        transform={`rotate(-15, ${noteX}, ${noteY})`}
      />
      <line
        x1={stemUp ? noteX + 8.5 : noteX - 8.5}
        y1={noteY}
        x2={stemUp ? noteX + 8.5 : noteX - 8.5}
        y2={stemUp ? noteY - 44 : noteY + 44}
        stroke="#1A1A18"
        strokeWidth="1.6"
      />
    </g>
  ) : null

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg" className={className}
      aria-label={`${note} on ${clef} clef`}>
      {staffLines}
      {ledgerLines}
      {clefSymbol}
      {noteEl}
    </svg>
  )
}
