'use client'

const F = 'var(--font-jost), sans-serif'

interface ExerciseNavBarProps {
  canBack: boolean
  canForward: boolean
  onBack: () => void
  onForward: () => void
}

export function ExerciseNavBar({ canBack, canForward, onBack, onForward }: ExerciseNavBarProps) {
  if (!canBack && !canForward) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
      {canBack && (
        <button onClick={onBack}
          style={{
            padding: '8px 14px', borderRadius: 8,
            border: '1.5px solid #DDD8CA', background: 'white',
            color: '#4A4540', fontFamily: F, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A18' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD8CA' }}
        >
          ← Previous
        </button>
      )}
      {canForward && (
        <button onClick={onForward}
          style={{
            marginLeft: 'auto',
            padding: '8px 14px', borderRadius: 8,
            border: '1.5px solid #DDD8CA', background: 'white',
            color: '#4A4540', fontFamily: F, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A18' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD8CA' }}
        >
          Next →
        </button>
      )}
    </div>
  )
}
