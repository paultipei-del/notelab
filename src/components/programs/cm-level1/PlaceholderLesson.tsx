'use client'

interface PlaceholderLessonProps {
  title: string
  passingScore: number
  previouslyCompleted: boolean
  onComplete: (score: number, total: number) => void
}

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function PlaceholderLesson({
  title,
  passingScore,
  previouslyCompleted,
  onComplete,
}: PlaceholderLessonProps) {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 400, color: '#2A2318', margin: '0 0 8px' }}>
        Placeholder Activity
      </p>
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', lineHeight: 1.6, margin: '0 0 16px' }}>
        This lesson is scaffolded and ready. We can now replace this placeholder with your exercise instructions for:
        {' '}
        <strong style={{ color: '#2A2318' }}>{title}</strong>.
      </p>
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 20px' }}>
        Current completion threshold: <strong style={{ color: '#2A2318' }}>{Math.round(passingScore * 100)}%</strong>
        {previouslyCompleted ? ' · previously completed' : ''}
      </p>
      <button
        onClick={() => onComplete(1, 1)}
        style={{
          background: '#1A1A18',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          padding: '11px 24px',
          fontFamily: F,
          fontSize: 'var(--nl-text-meta)',
          cursor: 'pointer',
        }}
      >
        Mark placeholder complete
      </button>
    </div>
  )
}
