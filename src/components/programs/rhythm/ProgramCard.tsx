'use client'

import Link from 'next/link'
import type { RhythmProgramMeta } from '@/lib/programs/rhythm/types'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  program: RhythmProgramMeta
  totalExercises: number
  doneExercises: number
  topicCount: number
}

const GLYPH_BY_SLUG: Record<string, string> = {
  'fundamentals': '♩ ♪',
  'personal-practice': '♬',
  'conservatory-prep': '♩. ♩',
}

export default function ProgramCard({ program, totalExercises, doneExercises, topicCount }: Props) {
  const inProgress = doneExercises > 0
  const cta = inProgress ? 'Continue →' : 'Start sub-program →'
  const glyph = GLYPH_BY_SLUG[program.slug] ?? '♩'

  return (
    <Link
      href={`/programs/rhythm/${program.slug}`}
      style={{ textDecoration: 'none', borderRadius: '16px', display: 'block' }}
    >
      <div
        className="nl-tile-hover"
        style={{
          background: '#FDFAF3',
          border: '1px solid #DDD8CA',
          borderRadius: '16px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 320px)',
          minHeight: '260px',
          overflow: 'hidden',
          boxShadow: '0 1px 0 rgba(255,255,255,0.65) inset, 0 2px 6px rgba(26,26,24,0.05), 0 10px 28px rgba(26,26,24,0.07)',
        }}
      >
        {/* Text side */}
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              fontFamily: F,
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: '#7A7060',
              background: '#EDE8DF',
              borderRadius: '20px',
              padding: '3px 10px',
              marginBottom: '10px',
              width: 'fit-content',
            }}
          >
            Free
          </span>
          <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(26px, 3vw, 34px)', color: '#1A1A18', marginBottom: '10px', letterSpacing: '0.01em', lineHeight: 1.1 }}>
            {program.title}
          </h2>
          <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 400, color: '#4A4540', lineHeight: 1.65, marginBottom: '8px', maxWidth: '420px' }}>
            {program.description}
          </p>
          {totalExercises > 0 && (
            <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#7A7060', letterSpacing: '0.02em', marginBottom: '18px' }}>
              {totalExercises} exercises · {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
            </p>
          )}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: F,
              fontSize: '13px',
              fontWeight: 500,
              color: 'white',
              background: '#1A1A18',
              padding: '9px 18px',
              borderRadius: '10px',
              width: 'fit-content',
            }}
          >
            {cta}
          </span>
        </div>

        {/* Decorative side — same cream background, single faint glyph */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontFamily: 'Bravura, serif',
              fontSize: program.slug === 'personal-practice' ? '160px' : '120px',
              fontWeight: 300,
              color: '#2A2318',
              opacity: 0.08,
              lineHeight: 1,
              userSelect: 'none' as const,
              pointerEvents: 'none' as const,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {glyph}
          </span>
        </div>
      </div>
    </Link>
  )
}
