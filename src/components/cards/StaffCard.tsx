'use client'

interface StaffCardProps {
  note: string
  clef: 'treble' | 'bass'
  className?: string
}

const TREBLE_POSITIONS: Record<string, number> = {
  E4: 8, F4: 7.5, G4: 7, A4: 6.5, B4: 6,
  C5: 5.5, D5: 5, E5: 4.5, F5: 4, G5: 3.5,
  A5: 3, B5: 2.5, C6: 2,
}

const BASS_POSITIONS: Record<string, number> = {
  G2: 8, A2: 7.5, B2: 7, C3: 6.5, D3: 6,
  E3: 5.5, F3: 5, G3: 4.5, A3: 4, B3: 3.5,
  C4: 3, D4: 2.5, E4: 2,
}

export default function StaffCard({ note, clef, className = '' }: StaffCardProps) {
  const W = 280
  const H = 130
  const lineSpacing = 12
  const staffTop = 35
  const staffLeft = 50
  const staffWidth = 180
  const noteX = staffLeft + staffWidth / 2 + 10

  const positions = clef === 'treble' ? TREBLE_POSITIONS : BASS_POSITIONS
  const pos = positions[note]
  const noteY = pos !== undefined ? staffTop + pos * lineSpacing : staffTop + 48

  // Staff lines
  const staffLines = Array.from({ length: 5 }, (_, i) => {
    const y = staffTop + i * lineSpacing
    return (
      <line
        key={i}
        x1={staffLeft}
        y1={y}
        x2={staffLeft + staffWidth}
        y2={y}
        stroke="#1A1A18"
        strokeWidth="1.2"
      />
    )
  })

  // Ledger lines if needed
  const ledgerLines = []
  if (pos !== undefined) {
    if (pos >= 8) {
      ledgerLines.push(
        <line key="l1" x1={noteX - 16} y1={staffTop + 8 * lineSpacing}
          x2={noteX + 16} y2={staffTop + 8 * lineSpacing}
          stroke="#1A1A18" strokeWidth="1.2" />
      )
    }
    if (pos <= 0) {
      ledgerLines.push(
        <line key="l2" x1={noteX - 16} y1={staffTop}
          x2={noteX + 16} y2={staffTop}
          stroke="#1A1A18" strokeWidth="1.2" />
      )
    }
  }

  // Clef symbol
  const clefSymbol = clef === 'treble' ? (
    <text
      x={staffLeft + 4}
      y={staffTop + 46}
      fontSize="68"
      fontFamily="serif"
      fill="#1A1A18"
      dominantBaseline="auto"
    >
      𝄞
    </text>
  ) : (
    <text
      x={staffLeft + 4}
      y={staffTop + 26}
      fontSize="42"
      fontFamily="serif"
      fill="#1A1A18"
      dominantBaseline="auto"
    >
      𝄢
    </text>
  )

  // Note head + stem
  const noteEl = pos !== undefined ? (
    <g>
      <ellipse
        cx={noteX}
        cy={noteY}
        rx={9}
        ry={6.5}
        fill="#1A1A18"
        transform={`rotate(-15, ${noteX}, ${noteY})`}
      />
      <line
        x1={noteX + 8}
        y1={noteY}
        x2={noteX + 8}
        y2={noteY - 36}
        stroke="#1A1A18"
        strokeWidth="1.6"
      />
    </g>
  ) : null

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`${note} on ${clef} clef`}
    >
      {staffLines}
      {ledgerLines}
      {clefSymbol}
      {noteEl}
    </svg>
  )
}