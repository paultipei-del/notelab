'use client'

import { useState } from 'react'

const F = 'var(--font-jost), sans-serif'

// Raised, paper-toned nav button used for Back / Forward between phases of
// a lesson. Has hover + press states so it feels pressable instead of flat.
function NavButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [pressed, setPressed] = useState(false)
  const [hover,   setHover]   = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false) }}
      style={{
        background: hover
          ? 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)'
          : 'linear-gradient(to bottom, #F9F6F0, #EFEBDE)',
        border: '1px solid #D7D1C0',
        borderRadius: 9,
        cursor: 'pointer',
        fontFamily: F, fontSize: 13, fontWeight: 600,
        color: '#4A4540',
        padding: '9px 20px',
        letterSpacing: '0.02em',
        boxShadow: pressed
          ? '0 1px 0 #CAC3B0, 0 1px 1px rgba(0,0,0,0.04), inset 0 1px 1px rgba(0,0,0,0.04)'
          : hover
            ? '0 3px 0 #CAC3B0, 0 4px 8px rgba(0,0,0,0.06)'
            : '0 2px 0 #CAC3B0, 0 2px 4px rgba(0,0,0,0.04)',
        transform: pressed ? 'translateY(2px)' : hover ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease',
      }}
    >
      {children}
    </button>
  )
}

interface ExerciseNavBarProps {
  canBack: boolean
  canForward: boolean
  onBack: () => void
  onForward: () => void
}

export function ExerciseNavBar({ canBack, canForward, onBack, onForward }: ExerciseNavBarProps) {
  if (!canBack && !canForward) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
      {canBack && <NavButton onClick={onBack}>← Back</NavButton>}
      {canForward && (
        <div style={{ marginLeft: 'auto' }}>
          <NavButton onClick={onForward}>Forward →</NavButton>
        </div>
      )}
    </div>
  )
}
