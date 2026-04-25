'use client'

import Link from 'next/link'
import { useEffect, useState, use } from 'react'
import { getRhythmProgram, categoryNameFromSlug } from '@/lib/programs/rhythm/config'
import { fetchExerciseLibrary, sortRhythmExercises } from '@/lib/rhythmLibrary'
import RhythmLessonShell from '@/components/programs/rhythm/RhythmLessonShell'
import RhythmStaffPreview from '@/components/programs/rhythm/RhythmStaffPreview'
import RhythmAudioDemo from '@/components/programs/rhythm/RhythmAudioDemo'
import { getLessonConcept } from '@/lib/programs/rhythm/lesson-content'
import type { RhythmExerciseMeta } from '@/lib/rhythmLibrary'
import type { LessonStep } from '@/components/programs/rhythm/RhythmLessonShell'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props { params: Promise<{ programSlug: string; categorySlug: string }> }

/**
 * v1 placeholder: shows the topic's notation example with a "v2: looping
 * audio demo coming soon" note. Until the embedded preview-mode trainer
 * lands, this page just re-displays the concept's example and points the
 * user at the practice step. The lesson rail still lights up correctly.
 */
export default function ListenPage({ params }: Props) {
  const { programSlug, categorySlug } = use(params)
  const program = getRhythmProgram(programSlug)
  const concept = getLessonConcept(categorySlug)

  const [topicName, setTopicName] = useState<string>('')
  const [exerciseId, setExerciseId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchExerciseLibrary().then(({ flat }) => {
      const sorted = sortRhythmExercises(flat.filter(e => e.program_slug === programSlug))
      const names = Array.from(new Set(sorted.map(e => e.category)))
      const matchedName = categoryNameFromSlug(categorySlug, names) ?? names[0] ?? ''
      setTopicName(matchedName)
      const inTopic = sorted.filter(e => e.category === matchedName)
      setExerciseId(concept?.exampleExerciseId ?? inTopic[0]?.id ?? null)
      setLoaded(true)
    })
  }, [programSlug, categorySlug, concept])

  if (!program) return null
  const topicHref = `/programs/rhythm/${programSlug}/${categorySlug}`
  const steps: LessonStep[] = [
    { kind: 'concept', label: 'Concept', href: `${topicHref}/concept`, done: true },
    { kind: 'listen', label: 'Listen', href: `${topicHref}/listen`, active: true },
    { kind: 'practice', label: 'Practice', href: topicHref },
    { kind: 'check', label: 'Check', href: `${topicHref}/check` },
  ]

  return (
    <RhythmLessonShell
      topicName={topicName || (concept?.title ?? 'Topic')}
      programSlug={programSlug}
      programTitle={program.title}
      topicHref={topicHref}
      steps={steps}
    >
      <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 38px)', color: '#1A1A18', margin: '0 0 12px 0', letterSpacing: '0.01em' }}>
        Listen to it
      </h1>
      <p style={{ fontFamily: F, fontSize: '15px', color: '#4A4540', lineHeight: 1.6, marginBottom: '24px', maxWidth: '560px' }}>
        Read along while the rhythm plays. No tapping yet — just internalize how the notation sounds.
      </p>

      {loaded && exerciseId && (
        <div style={{ marginBottom: '24px' }}>
          <RhythmStaffPreview exerciseId={exerciseId} maxHeight={220} />
        </div>
      )}

      {loaded && exerciseId && (
        <div style={{ marginBottom: '24px' }}>
          <RhythmAudioDemo exerciseId={exerciseId} bpm={concept?.goalBpm ?? 80} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', maxWidth: '600px' }}>
        {exerciseId && (
          <a
            href={`/rhythm?exercise=${exerciseId}&returnTo=${encodeURIComponent(`${topicHref}/listen`)}`}
            style={{ textDecoration: 'none', fontFamily: F, fontSize: '13px', color: '#7A7060', borderBottom: '1px solid #DDD8CA' }}
          >
            Open in trainer →
          </a>
        )}
        <Link href={topicHref} style={{ textDecoration: 'none', marginLeft: 'auto' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            fontFamily: F, fontSize: '14px', fontWeight: 500,
            color: 'white', background: '#1A1A18',
            padding: '10px 22px', borderRadius: '10px',
          }}>
            Start practicing →
          </span>
        </Link>
      </div>
    </RhythmLessonShell>
  )
}
