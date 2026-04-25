'use client'

import Link from 'next/link'
import type { RhythmExerciseMeta, RhythmProgress } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  exercise: RhythmExerciseMeta
  progress: RhythmProgress | undefined
  globalIndex: number
  href: string
  isUnlocked: boolean
  isCurrent?: boolean
}

export default function ExerciseRow({ exercise, progress, globalIndex, href, isUnlocked, isCurrent }: Props) {
  const completed = progress?.completed ?? false
  const bestPct = progress?.best_timing ?? 0

  if (!isUnlocked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px',
        background: '#FDFAF3',
        opacity: 0.5,
        cursor: 'default',
      }}>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#DDD8CA', width: '28px', flexShrink: 0, textAlign: 'center' as const }}>{globalIndex}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: 300, color: '#B0AEA8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{exercise.title}</p>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0AEA8', margin: 0 }}>
            {exercise.beats}/{exercise.beat_type}
          </p>
        </div>
        <span style={{ fontSize: 'var(--nl-text-compact)', opacity: 0.5, flexShrink: 0 }}>🔒</span>
      </div>
    )
  }

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px',
          background: isCurrent ? '#F2EDDF' : 'white',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = '#F9F7F2' }}
        onMouseLeave={e => { e.currentTarget.style.background = isCurrent ? '#F2EDDF' : 'white' }}
      >
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0AEA8', width: '28px', flexShrink: 0, textAlign: 'center' as const }}>{globalIndex}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: 300, color: '#1A1A18', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{exercise.title}</p>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0 }}>
            {exercise.beats}/{exercise.beat_type}
          </p>
        </div>
        {completed && <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#3B6D11', fontWeight: 500, flexShrink: 0 }}>✓</span>}
        {!completed && bestPct > 0 && <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B5402A', flexShrink: 0 }}>{bestPct}%</span>}
        {!completed && bestPct === 0 && <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#DDD8CA', flexShrink: 0 }}>→</span>}
      </div>
    </Link>
  )
}
