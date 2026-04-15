'use client'

import Link from 'next/link'
import CategoryProgressBar from './CategoryProgressBar'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  programSlug: string
  categorySlug: string
  categoryName: string
  levelCount: number
  exerciseCount: number
  done: number
  accentColor?: string
}

export default function CategoryCard({
  programSlug,
  categorySlug,
  categoryName,
  levelCount,
  exerciseCount,
  done,
  accentColor = '#1A1A18',
}: Props) {
  const completed = done === exerciseCount && exerciseCount > 0

  return (
    <Link href={`/programs/rhythm/${programSlug}/${categorySlug}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: completed ? '#F7F4ED' : 'white',
          border: `1px solid ${completed ? '#C8C4BA' : '#DDD8CA'}`,
          borderRadius: '14px',
          padding: '20px 24px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A18' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = completed ? '#C8C4BA' : '#DDD8CA' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: '#2A2318', margin: 0 }}>
                {categoryName}
              </h2>
              {completed && <span style={{ color: '#3B6D11', fontSize: '13px' }}>✓</span>}
            </div>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0 }}>
              {levelCount} {levelCount === 1 ? 'level' : 'levels'} · {exerciseCount} exercises
            </p>
          </div>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', flexShrink: 0, marginTop: '4px' }}>→</span>
        </div>
        <CategoryProgressBar done={done} total={exerciseCount} accentColor={accentColor} />
      </div>
    </Link>
  )
}
