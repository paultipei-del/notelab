'use client'

import Link from 'next/link'
import type { RhythmProgress } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  progress: RhythmProgress | undefined
  exerciseTitle: string
  timeSig: string
  backHref: string
  nextExerciseHref?: string
  nextExerciseTitle?: string
  accentColor?: string
}

export default function SessionSummary({
  progress,
  exerciseTitle,
  timeSig,
  backHref,
  nextExerciseHref,
  nextExerciseTitle,
  accentColor = '#3B6D11',
}: Props) {
  if (!progress || progress.attempts === 0) return null

  const completed = progress.completed
  const pct = progress.best_timing

  return (
    <div style={{
      background: completed ? '#EAF3DE' : '#FDFAF3',
      border: `1px solid ${completed ? '#C0DD97' : '#DDD8CA'}`,
      borderRadius: '14px',
      padding: '20px 24px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            {completed && <span style={{ color: accentColor, fontSize: '14px' }}>✓</span>}
            <p style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400, color: completed ? accentColor : '#2A2318', margin: 0 }}>
              {completed ? 'Completed' : 'In progress'}
            </p>
          </div>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 4px' }}>
            Best timing: <strong style={{ color: '#2A2318' }}>{pct}%</strong>
            {progress.best_duration > 0 && <> · Duration: <strong style={{ color: '#2A2318' }}>{progress.best_duration}%</strong></>}
          </p>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', margin: 0 }}>
            {progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}
          </p>
        </div>
        {completed && nextExerciseHref && nextExerciseTitle && (
          <Link href={nextExerciseHref} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', background: '#1A1A18', color: 'white', borderRadius: '10px', padding: '10px 20px', display: 'inline-block' }}>
              Next →
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}
