'use client'

import { useEffect, useState } from 'react'

const F = 'var(--font-jost), sans-serif'

/**
 * Animated staff card used as the /landing hero preview. Cycles a note
 * through four staff positions on a 6-second loop, shows a pulse ring
 * on each appearance, and updates a small pitch label below the staff.
 *
 * CSS keyframes handle the fade; we manage the current-position index
 * in React state so the label and pitch stay in sync with the visual.
 */

type NotePos = {
  /** y-coordinate of the notehead on the 120-tall SVG viewbox. */
  y: number
  /** Pitch label shown under the staff. */
  pitch: string
}

// Treble-staff positions (y values line up with the 5 staff lines).
// Line y-values in the viewbox: F5=20, D5=36, B4=52, G4=68, E4=84.
const POSITIONS: NotePos[] = [
  { y: 20, pitch: 'F5' }, // top line
  { y: 52, pitch: 'B4' }, // middle line
  { y: 84, pitch: 'E4' }, // bottom line
  { y: 68, pitch: 'G4' }, // 2nd line from bottom
]

const STEP_MS = 1500 // 1.5s per position × 4 = 6s loop

export default function HeroStaffAnimation() {
  const [idx, setIdx] = useState(0)
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx(i => (i + 1) % POSITIONS.length)
      setPulseKey(k => k + 1)
    }, STEP_MS)
    return () => window.clearInterval(id)
  }, [])

  const pos = POSITIONS[idx]

  return (
    <div
      style={{
        background: '#ECE3CC',
        borderRadius: '24px',
        border: '1px solid #D9CFAE',
        padding: '48px 56px',
        boxShadow: '0 8px 48px rgba(26,26,24,0.08)',
        position: 'relative',
        width: 'min(320px, 100%)',
      }}
    >
      {/* Staff + animated note */}
      <div style={{ position: 'relative', height: '120px', marginBottom: '12px' }}>
        <svg width="100%" height="120" viewBox="0 0 240 120" aria-label="Animated staff showing successive notes" role="img">
          {/* Staff lines */}
          {[20, 36, 52, 68, 84].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="240" y2={y} stroke="#D9CFAE" strokeWidth="1" />
          ))}
          {/* Treble clef. Bravura's alphabetic baseline anchors the G-curl,
              so y is placed on the G4 line (top + 3*sw = 68 here). Matches
              StaffCard / TwoNoteGrandStaff / MultiNoteStaff (codebase
              canonical: y=trebleTop+36, fontSize=50 at sw=12 → ratio 4.17).
              Scaled to sw=16: fontSize = 4.17*16 ≈ 66; clamped to 64 to
              keep the scroll inside the 120-tall viewbox. */}
          <text x="8" y="68" fontSize="64" fontFamily="Bravura, serif" fill="#1A1A18">𝄞</text>

          {/* Pulse ring (keyed so it restarts each note change) */}
          <circle
            key={`pulse-${pulseKey}`}
            cx="160"
            cy={pos.y}
            r="15"
            fill="none"
            stroke="#B5402A"
            strokeWidth="1.5"
            style={{
              transformOrigin: `160px ${pos.y}px`,
              animation: 'nl-hero-pulse-ring 600ms ease-out',
              opacity: 0,
            }}
          />

          {/* Active note. Notehead fontSize = 3.5*sw renders the head at
              ~1 staff-space tall. Stem direction follows convention:
              notes above the middle line (B4, y=52) get stem DOWN on the
              left side; notes on or below the middle line get stem UP on
              the right side. Stem length = 3*sw = 48, the standard
              quarter-note stem. */}
          <g
            key={`note-${pulseKey}`}
            style={{ opacity: 0, animation: 'nl-hero-note-cycle 1.5s ease-in-out' }}
          >
            <text x="160" y={pos.y} fontSize="56" fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="central">{String.fromCodePoint(0xe0a4)}</text>
            {pos.y < 52 ? (
              // Above middle line → stem down on left side of notehead
              <line x1="152" y1={pos.y} x2="152" y2={pos.y + 48} stroke="#1A1A18" strokeWidth="1.6" />
            ) : (
              // On or below middle line → stem up on right side of notehead
              <line x1="168" y1={pos.y} x2="168" y2={pos.y - 48} stroke="#1A1A18" strokeWidth="1.6" />
            )}
          </g>
        </svg>
      </div>

      {/* Pitch label */}
      <div
        key={`label-${pulseKey}`}
        style={{
          textAlign: 'center',
          fontFamily: F,
          fontSize: '12px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#7A7060',
          marginBottom: '18px',
          minHeight: '14px',
          animation: 'nl-hero-label-cycle 1.5s ease-in-out',
        }}
      >
        {pos.pitch}
      </div>

      {/* Listening status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#F2EDDF', borderRadius: '10px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50', boxShadow: '0 0 0 3px rgba(76,175,80,0.2)' }} />
        <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#7A7060' }}>Listening for your piano…</span>
      </div>

      {/* Pinned corner badge */}
      <div
        style={{
          position: 'absolute',
          top: '-16px',
          right: '-16px',
          background: '#B5402A',
          color: 'white',
          borderRadius: '10px',
          padding: '6px 14px',
          fontFamily: F,
          fontSize: '12px',
          fontWeight: 400,
          letterSpacing: '0.08em',
          boxShadow: '0 4px 12px rgba(186,117,23,0.3)',
        }}
      >
        Real-time detection
      </div>
    </div>
  )
}
