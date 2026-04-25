'use client'

import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { getRhythmProgram, categorySlug } from '@/lib/programs/rhythm/config'
import { summariseProgress } from '@/lib/programs/rhythm/progress'
import { fetchExerciseLibrary, fetchProgress, sortRhythmExercises, buildRhythmLibraryTree } from '@/lib/rhythmLibrary'
import { useAuth } from '@/hooks/useAuth'
import CategoryCard from '@/components/programs/rhythm/CategoryCard'
import RhythmRetentionStrip from '@/components/programs/rhythm/RhythmRetentionStrip'
import type { RetentionEntry } from '@/components/programs/rhythm/RhythmRetentionStrip'
import type { RhythmExerciseMeta, RhythmProgress, RhythmCategoryNode } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props { params: Promise<{ programSlug: string }> }

export default function RhythmProgramDetailPage({ params }: Props) {
  const { programSlug } = use(params)
  const program = getRhythmProgram(programSlug)
  const { user } = useAuth()

  const [categories, setCategories] = useState<RhythmCategoryNode[]>([])
  const [exercisesByCategory, setExercisesByCategory] = useState<Record<string, RhythmExerciseMeta[]>>({})
  const [progress, setProgress] = useState<Record<string, RhythmProgress>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchExerciseLibrary().then(({ flat }) => {
      const programFlat = flat.filter(e => e.program_slug === programSlug)
      const sorted = sortRhythmExercises(programFlat)
      const tree = buildRhythmLibraryTree(sorted)
      const prog = tree.find(p => p.slug === programSlug)
      setCategories(prog?.categories ?? [])

      const byCategory: Record<string, RhythmExerciseMeta[]> = {}
      for (const ex of sorted) {
        if (!byCategory[ex.category]) byCategory[ex.category] = []
        byCategory[ex.category].push(ex)
      }
      setExercisesByCategory(byCategory)
      setLoaded(true)
    })
  }, [programSlug])

  useEffect(() => {
    fetchProgress(user?.id ?? null).then(setProgress)
  }, [user?.id])

  if (!program) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, color: '#7A7060' }}>Program not found.</p>
      </div>
    )
  }

  const a = program.accent
  const allExercises = Object.values(exercisesByCategory).flat()
  const { done: totalDone, total: totalExercises } = loaded
    ? summariseProgress(allExercises, progress)
    : { done: 0, total: 0 }

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

        <Link href="/programs/rhythm" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Rhythm Reading
          </span>
        </Link>

        <div style={{ marginTop: '28px', marginBottom: '36px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '10px' }}>
            Rhythm Reading
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(26px, 4vw, 40px)', color: '#2A2318', marginBottom: '8px', letterSpacing: '0.02em' }}>
            {program.title}
          </h1>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-body)', color: '#7A7060', lineHeight: 1.7, maxWidth: '480px', marginBottom: '20px' }}>
            {program.description}
          </p>

          {loaded && totalExercises > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '180px', height: '4px', background: '#DDD8CA', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(totalDone / totalExercises * 100)}%`, background: a.text, borderRadius: '2px', transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
                {totalDone} / {totalExercises} exercises
              </span>
            </div>
          )}
        </div>

        {loaded && categories.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <RhythmRetentionStrip entries={categories.map((cat): RetentionEntry => {
              const exs = exercisesByCategory[cat.name] ?? []
              const done = exs.filter(e => progress[e.id]?.completed).length
              return {
                name: cat.name,
                href: `/programs/rhythm/${programSlug}/${categorySlug(cat.name)}`,
                done,
                total: exs.length,
              }
            })} />
          </div>
        )}

        {!loaded && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: '#F7F4ED', border: '1px solid #DDD8CA', borderRadius: '14px', padding: '20px 24px', height: '88px', opacity: 0.5 }} />
            ))}
          </div>
        )}

        {loaded && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {categories.map(cat => {
              const exercises = exercisesByCategory[cat.name] ?? []
              const { done } = summariseProgress(exercises, progress)
              return (
                <CategoryCard
                  key={cat.name}
                  programSlug={programSlug}
                  categorySlug={categorySlug(cat.name)}
                  categoryName={cat.name}
                  levelCount={cat.levels.length}
                  exerciseCount={exercises.length}
                  done={done}
                  accentColor={a.text}
                />
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
