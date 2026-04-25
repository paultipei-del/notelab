'use client'

import Link from 'next/link'
import { useEffect, useState, use } from 'react'
import { getRhythmProgram, categoryNameFromSlug } from '@/lib/programs/rhythm/config'
import { fetchExerciseLibrary, sortRhythmExercises, fetchProgress } from '@/lib/rhythmLibrary'
import { useAuth } from '@/hooks/useAuth'
import RhythmLessonShell from '@/components/programs/rhythm/RhythmLessonShell'
import { getLessonConcept } from '@/lib/programs/rhythm/lesson-content'
import type { RhythmExerciseMeta, RhythmProgress } from '@/lib/rhythmLibrary'
import type { LessonStep } from '@/components/programs/rhythm/RhythmLessonShell'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props { params: Promise<{ programSlug: string; categorySlug: string }> }

/**
 * v1 placeholder: shows the user how mastery will be measured and points at
 * the highest-level exercise in the topic. Threshold-gated unlock + pass/fail
 * UX lands in v2.
 */
export default function CheckPage({ params }: Props) {
  const { programSlug, categorySlug } = use(params)
  const program = getRhythmProgram(programSlug)
  const concept = getLessonConcept(categorySlug)
  const { user } = useAuth()

  const [topicName, setTopicName] = useState<string>('')
  const [exercises, setExercises] = useState<RhythmExerciseMeta[]>([])
  const [progress, setProgress] = useState<Record<string, RhythmProgress>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchExerciseLibrary().then(({ flat }) => {
      const sorted = sortRhythmExercises(flat.filter(e => e.program_slug === programSlug))
      const names = Array.from(new Set(sorted.map(e => e.category)))
      const matchedName = categoryNameFromSlug(categorySlug, names) ?? names[0] ?? ''
      setTopicName(matchedName)
      setExercises(sorted.filter(e => e.category === matchedName))
      setLoaded(true)
    })
  }, [programSlug, categorySlug])

  useEffect(() => {
    fetchProgress(user?.id ?? null).then(setProgress)
  }, [user?.id])

  if (!program) return null
  const topicHref = `/programs/rhythm/${programSlug}/${categorySlug}`
  const steps: LessonStep[] = [
    { kind: 'concept', label: 'Concept', href: `${topicHref}/concept`, done: true },
    { kind: 'listen', label: 'Listen', href: `${topicHref}/listen`, done: true },
    { kind: 'practice', label: 'Practice', href: topicHref, done: true },
    { kind: 'check', label: 'Check', href: `${topicHref}/check`, active: true },
  ]

  // The "check" exercise — last (highest-level) exercise in the topic.
  const checkExercise = exercises[exercises.length - 1]
  const goalBpm = concept?.goalBpm ?? 80
  const checkProgress = checkExercise ? progress[checkExercise.id] : undefined
  const passed = checkProgress?.completed === true && (checkProgress.best_timing ?? 0) >= 90

  return (
    <RhythmLessonShell
      topicName={topicName || (concept?.title ?? 'Topic')}
      programSlug={programSlug}
      programTitle={program.title}
      topicHref={topicHref}
      steps={steps}
    >
      <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 38px)', color: '#1A1A18', margin: '0 0 12px 0', letterSpacing: '0.01em' }}>
        Mastery check
      </h1>
      <p style={{ fontFamily: F, fontSize: '15px', color: '#4A4540', lineHeight: 1.6, marginBottom: '24px', maxWidth: '560px' }}>
        Hit <strong>90% timing</strong> at <strong>{goalBpm} BPM</strong> on the topic&rsquo;s final exercise to mark this topic complete.
      </p>

      {loaded && checkExercise && (
        <div style={{
          background: 'white', border: '1px solid #DDD8CA', borderRadius: '14px',
          padding: '20px 24px', maxWidth: '600px', marginBottom: '24px',
        }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 6px 0' }}>
            Final exercise
          </p>
          <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 400, color: '#1A1A18', margin: '0 0 4px 0' }}>
            {checkExercise.title}
          </p>
          <p style={{ fontFamily: F, fontSize: '13px', color: '#7A7060', margin: '0 0 16px 0' }}>
            {checkExercise.beats}/{checkExercise.beat_type} · Level {checkExercise.level}
          </p>
          {passed ? (
            <p style={{ fontFamily: F, fontSize: '14px', color: '#3B6D11', margin: '0 0 16px 0', fontWeight: 500 }}>
              ✓ Passed at {checkProgress?.best_timing}% timing
            </p>
          ) : checkProgress?.attempts ? (
            <p style={{ fontFamily: F, fontSize: '14px', color: '#B5402A', margin: '0 0 16px 0' }}>
              Best so far: {checkProgress.best_timing ?? 0}% timing — keep going.
            </p>
          ) : null}
          <a
            href={`/rhythm?exercise=${checkExercise.id}&returnTo=${encodeURIComponent(`${topicHref}/check`)}`}
            style={{ textDecoration: 'none' }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontFamily: F, fontSize: '14px', fontWeight: 500,
              color: 'white', background: '#1A1A18',
              padding: '10px 22px', borderRadius: '10px',
            }}>
              {passed ? 'Try again' : checkProgress?.attempts ? 'Continue' : 'Start check'} →
            </span>
          </a>
        </div>
      )}

      <div style={{
        background: '#FDFAF3', border: '1px dashed #DDD8CA', borderRadius: '12px',
        padding: '16px 20px', maxWidth: '600px',
      }}>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 8px 0' }}>
          Coming soon
        </p>
        <p style={{ fontFamily: F, fontSize: '14px', color: '#4A4540', lineHeight: 1.6, margin: 0 }}>
          Mastery gating, confetti on pass, and topic-unlock progression land in v2. For now this page just points you at the final exercise.
        </p>
      </div>
    </RhythmLessonShell>
  )
}
