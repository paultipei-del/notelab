'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { RHYTHM_PROGRAMS } from '@/lib/programs/rhythm/config'
import { summariseProgress } from '@/lib/programs/rhythm/progress'
import { fetchExerciseLibrary } from '@/lib/rhythmLibrary'
import { fetchProgress } from '@/lib/rhythmLibrary'
import { useAuth } from '@/hooks/useAuth'
import ProgramCard from '@/components/programs/rhythm/ProgramCard'
import type { RhythmExerciseMeta, RhythmProgress } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function RhythmProgramsPage() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<RhythmExerciseMeta[]>([])
  const [progress, setProgress] = useState<Record<string, RhythmProgress>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchExerciseLibrary().then(({ flat }) => {
      setExercises(flat)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    fetchProgress(user?.id ?? null).then(setProgress)
  }, [user?.id])

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 80px' }}>

        <Link href="/programs" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Programs
          </span>
        </Link>

        <div style={{ marginTop: '28px', marginBottom: '40px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '12px' }}>
            Rhythm Reading
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#2A2318', marginBottom: '10px', letterSpacing: '0.02em' }}>
            Rhythm Reading Programs
          </h1>
          <p style={{ fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#7A7060', maxWidth: '520px', lineHeight: 1.7, fontFamily: F }}>
            Three structured paths — from core fundamentals through conservatory-level reading. Every exercise is generated from notation and tapped in real time with the metronome.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
          {RHYTHM_PROGRAMS.map(program => {
            const programExercises = loaded
              ? exercises.filter(e => e.program_slug === program.slug)
              : []
            const { done, total } = loaded
              ? summariseProgress(programExercises, progress)
              : { done: 0, total: 0 }
            const topicCount = loaded
              ? new Set(programExercises.map(e => e.category)).size
              : 0
            return (
              <ProgramCard
                key={program.slug}
                program={program}
                totalExercises={total}
                doneExercises={done}
                topicCount={topicCount}
              />
            )
          })}
        </div>

      </div>
    </div>
  )
}
