'use client'

import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getRhythmProgram, categoryNameFromSlug } from '@/lib/programs/rhythm/config'
import {
  fetchExerciseLibrary, fetchProgress,
  sortRhythmExercises, buildRhythmLibraryTree,
} from '@/lib/rhythmLibrary'
import { useAuth } from '@/hooks/useAuth'
import SessionSummary from '@/components/programs/rhythm/SessionSummary'
import type { RhythmExerciseMeta, RhythmProgress } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const DIFFICULTY_LABEL: Record<number, string> = {
  1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert',
}

interface Props { params: Promise<{ programSlug: string; categorySlug: string; exerciseId: string }> }

export default function RhythmExercisePage({ params }: Props) {
  const { programSlug, categorySlug, exerciseId } = use(params)
  const program = getRhythmProgram(programSlug)
  const { user } = useAuth()
  const router = useRouter()

  const [exercise, setExercise] = useState<RhythmExerciseMeta | null>(null)
  const [nextExercise, setNextExercise] = useState<RhythmExerciseMeta | null>(null)
  const [progress, setProgress] = useState<Record<string, RhythmProgress>>({})
  const [loaded, setLoaded] = useState(false)
  const [unlockOrder, setUnlockOrder] = useState<RhythmExerciseMeta[]>([])

  useEffect(() => {
    fetchExerciseLibrary().then(({ flat }) => {
      const programFlat = flat.filter(e => e.program_slug === programSlug)
      const sorted = sortRhythmExercises(programFlat)
      setUnlockOrder(sorted)

      const found = sorted.find(e => e.id === exerciseId) ?? null
      setExercise(found)

      if (found) {
        const idx = sorted.findIndex(e => e.id === exerciseId)
        setNextExercise(sorted[idx + 1] ?? null)
      }
      setLoaded(true)
    })
  }, [programSlug, exerciseId])

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

  if (loaded && !exercise) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, color: '#7A7060' }}>Exercise not found.</p>
      </div>
    )
  }

  const a = program.accent
  const returnTo = `/programs/rhythm/${programSlug}/${categorySlug}`
  const practiceUrl = exercise
    ? `/rhythm?exercise=${exercise.id}&returnTo=${encodeURIComponent(returnTo)}`
    : '#'

  const exerciseProgress = exercise ? progress[exercise.id] : undefined
  const idx = exercise ? unlockOrder.findIndex(e => e.id === exercise.id) : -1
  const isUnlocked = idx <= 0 || (progress[unlockOrder[idx - 1]?.id]?.completed ?? false)

  // Next exercise for summary
  const nextCatSlug = nextExercise
    ? (() => {
        // If next exercise is in same category, link to it; otherwise link back
        return nextExercise.category === exercise?.category ? categorySlug : null
      })()
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        <Link href={returnTo} style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← {exercise?.category ?? program.title}
          </span>
        </Link>

        {exercise && (
          <>
            <div style={{ marginTop: '28px', marginBottom: '28px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '8px' }}>
                {program.title} · {exercise.category}
              </p>
              <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(24px, 3.5vw, 36px)', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>
                {exercise.title}
              </h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', background: '#EDE8DF', color: '#7A7060', borderRadius: '20px', padding: '3px 10px' }}>
                  {exercise.beats}/{exercise.beat_type}
                </span>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', background: '#EDE8DF', color: '#7A7060', borderRadius: '20px', padding: '3px 10px' }}>
                  {DIFFICULTY_LABEL[exercise.difficulty]}
                </span>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', background: '#EDE8DF', color: '#7A7060', borderRadius: '20px', padding: '3px 10px' }}>
                  Level {exercise.level}
                </span>
              </div>
            </div>

            {/* Progress summary */}
            {exerciseProgress && exerciseProgress.attempts > 0 && (
              <SessionSummary
                progress={exerciseProgress}
                exerciseTitle={exercise.title}
                timeSig={`${exercise.beats}/${exercise.beat_type}`}
                backHref={returnTo}
                nextExerciseHref={
                  nextExercise && nextCatSlug
                    ? `/programs/rhythm/${programSlug}/${nextCatSlug}/${nextExercise.id}`
                    : nextExercise
                    ? `/programs/rhythm/${programSlug}`
                    : undefined
                }
                nextExerciseTitle={nextExercise?.title}
                accentColor={a.text}
              />
            )}

            {/* Practice card */}
            <div style={{ background: 'white', border: '1px solid #DDD8CA', borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
              <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: '#2A2318', marginBottom: '8px' }}>
                Practice this exercise
              </p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', marginBottom: '20px', lineHeight: 1.6 }}>
                Opens the rhythm reader with this exercise pre-loaded. Tap the beats with the metronome. Hit 90% timing to mark it complete.
              </p>
              {isUnlocked ? (
                <a href={practiceUrl} style={{ textDecoration: 'none' }}>
                  <button style={{
                    background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px',
                    padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400,
                    cursor: 'pointer',
                  }}>
                    {exerciseProgress?.completed ? 'Practice again' : exerciseProgress?.attempts ? 'Continue' : 'Start'} →
                  </button>
                </a>
              ) : (
                <div>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B5402A', marginBottom: '12px' }}>
                    🔒 Complete the previous exercise first to unlock this one.
                  </p>
                  <button disabled style={{
                    background: '#EDE8DF', color: '#B0ACA4', border: 'none', borderRadius: '10px',
                    padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400,
                    cursor: 'default',
                  }}>
                    Locked
                  </button>
                </div>
              )}
            </div>

            {/* Navigation */}
            {loaded && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                {idx > 0 && (
                  <Link href={`/programs/rhythm/${programSlug}/${categorySlug}/${unlockOrder[idx - 1].id}`} style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', padding: '8px 0' }}>← Previous</span>
                  </Link>
                )}
                {nextExercise && nextExercise.category === exercise.category && (
                  <Link href={`/programs/rhythm/${programSlug}/${categorySlug}/${nextExercise.id}`} style={{ textDecoration: 'none', marginLeft: 'auto' }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', padding: '8px 0' }}>Next →</span>
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {!loaded && (
          <div style={{ marginTop: '28px' }}>
            <div style={{ background: '#F7F4ED', borderRadius: '14px', height: '120px', marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ background: '#F7F4ED', borderRadius: '14px', height: '180px', opacity: 0.5 }} />
          </div>
        )}

      </div>
    </div>
  )
}
