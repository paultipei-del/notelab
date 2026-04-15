'use client'

import Link from 'next/link'
import type { RhythmProgramMeta } from '@/lib/programs/rhythm/types'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  program: RhythmProgramMeta
  totalExercises: number
  doneExercises: number
}

export default function ProgramCard({ program, totalExercises, doneExercises }: Props) {
  const a = program.accent
  const pct = totalExercises > 0 ? Math.round(doneExercises / totalExercises * 100) : 0

  return (
    <Link href={`/programs/rhythm/${program.slug}`} style={{ textDecoration: 'none', borderRadius: '20px', display: 'block' }}>
      <div
        className="nl-cat-tile-inner"
        style={{
          background: '#1A1A18',
          border: '1px solid #2E2E2C',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 14px 40px rgba(0,0,0,0.22)',
          transition: 'transform 0.24s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.24s cubic-bezier(0.33, 1, 0.68, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)'
          e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.45), 0 28px 72px rgba(0,0,0,0.28)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35), 0 14px 40px rgba(0,0,0,0.22)'
        }}
      >
        {/* Text side */}
        <div style={{ flex: 1, padding: '36px 40px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
          <span style={{ display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '4px 10px', borderRadius: '20px', background: a.bg, color: a.text, marginBottom: '14px', width: 'fit-content' }}>
            {totalExercises > 0 ? `${doneExercises} / ${totalExercises} done` : 'Loading…'}
          </span>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(30px, 3.2vw, 42px)', color: 'white', marginBottom: '8px', letterSpacing: '0.01em', lineHeight: 1.05 }}>
            {program.title}
          </h2>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginBottom: '12px' }}>
            {program.subtitle}
          </p>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: '24px', maxWidth: '380px' }}>
            {program.description}
          </p>

          {totalExercises > 0 && (
            <div style={{ marginBottom: '20px', maxWidth: '280px' }}>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: a.text, borderRadius: '2px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.05em', color: a.text, padding: '7px 16px', borderRadius: '20px', background: a.ctaBg, border: `1px solid ${a.border}`, width: 'fit-content' }}>
            {pct === 100 ? 'Complete →' : pct > 0 ? 'Continue →' : 'Start program →'}
          </span>
        </div>

        {/* Gradient side */}
        <div
          className="nl-cat-tile-gradient"
          style={{
            background: a.gradient,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span aria-hidden="true" style={{ fontFamily: SERIF, fontSize: '160px', fontWeight: 300, color: a.gradientGlyphColor, lineHeight: 1, userSelect: 'none' as const, pointerEvents: 'none' as const }}>
            𝄩
          </span>
        </div>
      </div>
    </Link>
  )
}
