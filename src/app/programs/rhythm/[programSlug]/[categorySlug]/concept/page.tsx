'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, use } from 'react'
import { getRhythmProgram, categoryNameFromSlug } from '@/lib/programs/rhythm/config'
import { fetchExerciseLibrary, sortRhythmExercises } from '@/lib/rhythmLibrary'
import RhythmLessonShell from '@/components/programs/rhythm/RhythmLessonShell'
import RhythmStaffPreview from '@/components/programs/rhythm/RhythmStaffPreview'
import { getLessonConcept } from '@/lib/programs/rhythm/lesson-content'
import type { RhythmExerciseMeta } from '@/lib/rhythmLibrary'
import type { LessonStep } from '@/components/programs/rhythm/RhythmLessonShell'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props { params: Promise<{ programSlug: string; categorySlug: string }> }

export default function ConceptPage({ params }: Props) {
  const { programSlug, categorySlug } = use(params)
  const program = getRhythmProgram(programSlug)
  const concept = getLessonConcept(categorySlug)

  const [exerciseList, setExerciseList] = useState<RhythmExerciseMeta[]>([])
  const [loaded, setLoaded] = useState(false)
  const [topicName, setTopicName] = useState<string>('')

  useEffect(() => {
    fetchExerciseLibrary().then(({ flat }) => {
      const sorted = sortRhythmExercises(flat.filter(e => e.program_slug === programSlug))
      const names = Array.from(new Set(sorted.map(e => e.category)))
      const matchedName = categoryNameFromSlug(categorySlug, names) ?? names[0] ?? ''
      setTopicName(matchedName)
      setExerciseList(sorted.filter(e => e.category === matchedName))
      setLoaded(true)
    })
  }, [programSlug, categorySlug])

  const sampleExerciseId = useMemo(() => {
    if (!loaded) return null
    if (concept?.exampleExerciseId) {
      const found = exerciseList.find(e => e.id === concept.exampleExerciseId)
      if (found) return found.id
    }
    return exerciseList[0]?.id ?? null
  }, [exerciseList, loaded, concept])

  if (!program) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, color: '#7A7060' }}>Program not found.</p>
      </div>
    )
  }

  const topicHref = `/programs/rhythm/${programSlug}/${categorySlug}`
  const steps: LessonStep[] = [
    { kind: 'concept', label: 'Concept',  href: `${topicHref}/concept`, active: true },
    { kind: 'listen',  label: 'Listen',   href: `${topicHref}/listen` },
    { kind: 'practice', label: 'Practice', href: topicHref },
    { kind: 'check',   label: 'Check',    href: `${topicHref}/check` },
  ]

  return (
    <RhythmLessonShell
      topicName={topicName || (concept?.title ?? 'Topic')}
      programSlug={programSlug}
      programTitle={program.title}
      topicHref={topicHref}
      steps={steps}
    >
      {!concept && loaded && (
        <FallbackConcept topicName={topicName} topicHref={topicHref} />
      )}

      {concept && (
        <>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 42px)', color: '#1A1A18', margin: '0 0 8px 0', letterSpacing: '0.01em', lineHeight: 1.1 }}>
            {concept.title}
          </h1>
          <p style={{ fontFamily: F, fontSize: '15px', color: '#4A4540', lineHeight: 1.6, margin: '0 0 24px 0', maxWidth: '560px' }}>
            {concept.subtitle}
          </p>

          {/* Notation example */}
          {sampleExerciseId && (
            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 10px 0' }}>
                Example
              </p>
              <RhythmStaffPreview exerciseId={sampleExerciseId} maxHeight={200} />
            </div>
          )}

          {/* Body */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '20px', maxWidth: '600px' }}>
            {concept.paragraphs.map((p, i) => (
              <div key={i}>
                {p.heading && (
                  <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '20px', color: '#1A1A18', margin: '0 0 8px 0' }}>
                    {p.heading}
                  </h3>
                )}
                <p style={{ fontFamily: F, fontSize: '15px', color: '#2A2318', lineHeight: 1.7, margin: 0 }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>

          {/* Remember card */}
          {concept.remember && (
            <div style={{
              marginTop: '28px', maxWidth: '600px',
              background: 'white', border: '1px solid #DDD8CA', borderRadius: '12px',
              padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}>
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#3B6D11', flexShrink: 0, marginTop: '2px' }}>
                Remember
              </span>
              <p style={{ fontFamily: F, fontSize: '14px', color: '#2A2318', lineHeight: 1.6, margin: 0 }}>
                {concept.remember}
              </p>
            </div>
          )}

          {/* Footer CTA */}
          <div style={{ marginTop: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '600px' }}>
            <span style={{ fontFamily: F, fontSize: '12px', color: '#7A7060' }}>
              Goal tempo: {concept.goalBpm} BPM
            </span>
            <Link href={`${topicHref}/listen`} style={{ textDecoration: 'none' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                fontFamily: F, fontSize: '14px', fontWeight: 500,
                color: 'white', background: '#1A1A18',
                padding: '10px 22px', borderRadius: '10px',
              }}>
                Listen to it →
              </span>
            </Link>
          </div>
        </>
      )}
    </RhythmLessonShell>
  )
}

function FallbackConcept({ topicName, topicHref }: { topicName: string; topicHref: string }) {
  return (
    <div>
      <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(24px, 3.5vw, 32px)', color: '#1A1A18', margin: '0 0 12px 0' }}>
        {topicName || 'Concept'}
      </h1>
      <p style={{ fontFamily: F, fontSize: '15px', color: '#4A4540', lineHeight: 1.65, marginBottom: '20px', maxWidth: '560px' }}>
        Concept content for this topic is in development. The exercises are still available in the standard practice flow.
      </p>
      <Link href={topicHref} style={{ textDecoration: 'none' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          fontFamily: F, fontSize: '14px', fontWeight: 500,
          color: 'white', background: '#1A1A18',
          padding: '10px 22px', borderRadius: '10px',
        }}>
          Go to practice →
        </span>
      </Link>
    </div>
  )
}
