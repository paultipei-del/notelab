'use client'

import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { getRhythmProgram, categorySlug as makeCategorySlug, categoryNameFromSlug } from '@/lib/programs/rhythm/config'
import { summariseProgress } from '@/lib/programs/rhythm/progress'
import {
  fetchExerciseLibrary, fetchProgress,
  sortRhythmExercises, buildRhythmLibraryTree,
} from '@/lib/rhythmLibrary'
import { useAuth } from '@/hooks/useAuth'
import ExerciseList from '@/components/programs/rhythm/ExerciseList'
import CategoryProgressBar from '@/components/programs/rhythm/CategoryProgressBar'
import RhythmStaffPreview from '@/components/programs/rhythm/RhythmStaffPreview'
import { getTeachingSummary } from '@/lib/programs/rhythm/teaching-summaries'
import type { RhythmExerciseMeta, RhythmProgress, RhythmCategoryNode } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert',
}

interface Props { params: Promise<{ programSlug: string; categorySlug: string }> }

export default function RhythmCategoryPage({ params }: Props) {
  const { programSlug, categorySlug } = use(params)
  const program = getRhythmProgram(programSlug)
  const { user } = useAuth()

  const [category, setCategory] = useState<RhythmCategoryNode | null>(null)
  const [exercises, setExercises] = useState<RhythmExerciseMeta[]>([])
  const [unlockOrder, setUnlockOrder] = useState<RhythmExerciseMeta[]>([])
  const [progress, setProgress] = useState<Record<string, RhythmProgress>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchExerciseLibrary().then(({ flat }) => {
      const programFlat = flat.filter(e => e.program_slug === programSlug)
      const sorted = sortRhythmExercises(programFlat)
      setUnlockOrder(sorted)

      const tree = buildRhythmLibraryTree(sorted)
      const prog = tree.find(p => p.slug === programSlug)
      const allCategoryNames = prog?.categories.map(c => c.name) ?? []
      const categoryName = categoryNameFromSlug(categorySlug, allCategoryNames)

      if (categoryName) {
        const cat = prog?.categories.find(c => c.name === categoryName) ?? null
        setCategory(cat)
        setExercises(sorted.filter(e => e.category === categoryName))
      }
      setLoaded(true)
    })
  }, [programSlug, categorySlug])

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

  if (loaded && !category) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, color: '#7A7060' }}>Category not found.</p>
      </div>
    )
  }

  const a = program.accent
  const { done, total } = loaded ? summariseProgress(exercises, progress) : { done: 0, total: 0 }

  // Representative exercise for the "What you'll learn" preview — first
  // exercise of the lowest-numbered level. Falls back to the first overall
  // exercise if no levels exist (defensive — empty topic).
  const previewExercise: RhythmExerciseMeta | undefined =
    category?.levels[0]?.exercises[0] ?? exercises[0]
  const teachingSummary = category ? getTeachingSummary(category.name) : ''

  // Difficulty range
  const difficulties = exercises.map(e => e.difficulty)
  const minDiff = difficulties.length > 0 ? Math.min(...difficulties) : 1
  const maxDiff = difficulties.length > 0 ? Math.max(...difficulties) : 1
  const diffLabel = minDiff === maxDiff
    ? DIFFICULTY_LABEL[minDiff]
    : `${DIFFICULTY_LABEL[minDiff]} – ${DIFFICULTY_LABEL[maxDiff]}`

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

        <Link href={`/programs/rhythm/${programSlug}`} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← {program.title}
          </span>
        </Link>

        <div style={{ marginTop: '28px', marginBottom: '32px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '8px' }}>
            {program.title}
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(24px, 3.5vw, 36px)', color: '#2A2318', marginBottom: '10px', letterSpacing: '0.02em' }}>
            {category?.name ?? '…'}
          </h1>

          {loaded && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060' }}>
                {total} exercises · {category?.levels.length ?? 0} levels
              </span>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060' }}>·</span>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060' }}>{diffLabel}</span>
            </div>
          )}

          {loaded && total > 0 && (
            <div style={{ maxWidth: '280px' }}>
              <CategoryProgressBar done={done} total={total} accentColor={a.text} />
            </div>
          )}
        </div>

        {!loaded && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#F7F4ED', border: '1px solid #DDD8CA', borderRadius: '14px', height: '140px', opacity: 0.5 }} />
            ))}
          </div>
        )}

        {loaded && category && previewExercise && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 10px 0' }}>
              What you&rsquo;ll learn
            </p>
            <RhythmStaffPreview exerciseId={previewExercise.id} maxHeight={220} />
            {teachingSummary && (
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#4A4540', lineHeight: 1.6, margin: '12px 4px 0' }}>
                {teachingSummary}
              </p>
            )}
          </div>
        )}

        {loaded && category && (
          <ExerciseList
            programSlug={programSlug}
            categorySlug={categorySlug}
            levels={category.levels}
            progress={progress}
            unlockOrder={unlockOrder}
          />
        )}

      </div>
    </div>
  )
}
