'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { RHYTHM_PROGRAMS, categorySlug } from '@/lib/programs/rhythm/config'
import { fetchExerciseLibrary, fetchProgress } from '@/lib/rhythmLibrary'
import { useAuth } from '@/hooks/useAuth'
import ModuleRow from '@/components/programs/ModuleRow'
import LevelChip from '@/components/programs/LevelChip'
import RhythmTopLevelOverview from '@/components/programs/rhythm/RhythmTopLevelOverview'
import type { OverviewEntry } from '@/components/programs/rhythm/RhythmTopLevelOverview'
import type { RhythmExerciseMeta, RhythmProgress, RhythmProgramNode } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function RhythmProgramsPage() {
  const { user } = useAuth()
  const [tree, setTree] = useState<RhythmProgramNode[]>([])
  const [exercises, setExercises] = useState<RhythmExerciseMeta[]>([])
  const [progress, setProgress] = useState<Record<string, RhythmProgress>>({})
  const [loaded, setLoaded] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)

  useEffect(() => {
    fetchExerciseLibrary().then(({ flat, tree }) => {
      setExercises(flat)
      setTree(tree)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    fetchProgress(user?.id ?? null).then(setProgress)
  }, [user?.id])

  // Honour ?highlight=slug or #slug after a redirect from /programs/rhythm/[programSlug].
  // Apply the fade once data is rendered so scroll lands on the right offset.
  useEffect(() => {
    if (!loaded) return
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    const el = document.getElementById(hash)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlight(hash)
    const t = setTimeout(() => setHighlight(null), 1500)
    return () => clearTimeout(t)
  }, [loaded])

  // Continuous module index across the three sub-programs.
  let moduleIndex = 0

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

        <Link href="/programs" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Programs
          </span>
        </Link>

        <div style={{ marginTop: '28px', marginBottom: '40px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '10px' }}>
            Rhythm Reading Program
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px,4vw,44px)', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>
            From Steady Pulse to Conservatory Reading
          </h1>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#7A7060', maxWidth: '520px', lineHeight: 1.7 }}>
            Three structured paths — fundamentals, personal practice, conservatory prep. Every exercise is generated from notation and tapped in real time with the metronome.
          </p>
        </div>

        {loaded && exercises.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <RhythmTopLevelOverview
              entries={RHYTHM_PROGRAMS.map((program): OverviewEntry => {
                const programExercises = exercises.filter(e => e.program_slug === program.slug)
                const done = programExercises.filter(e => progress[e.id]?.completed).length
                return {
                  slug: program.slug,
                  title: program.title,
                  done,
                  total: programExercises.length,
                }
              })}
            />
          </div>
        )}

        {!loaded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ background: '#F7F4ED', border: '1px solid #D9CFAE', borderRadius: '14px', padding: '20px 24px', height: '108px', opacity: 0.5 }} />
            ))}
          </div>
        )}

        {loaded && RHYTHM_PROGRAMS.map(program => {
          const progNode = tree.find(t => t.slug === program.slug)
          const categories = progNode?.categories ?? []
          if (categories.length === 0) return null

          return (
            <section
              key={program.slug}
              id={program.slug}
              className={highlight === program.slug ? 'nl-anchor-highlight' : undefined}
              style={{ marginTop: '32px', scrollMarginTop: '20px' }}
            >
              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
                  {program.title}
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0, lineHeight: 1.5 }}>
                  {program.subtitle}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map(cat => {
                  moduleIndex++
                  const exs = cat.levels.flatMap(l => l.exercises)
                  const done = exs.filter(e => progress[e.id]?.completed).length
                  const total = exs.length
                  const allComplete = total > 0 && done === total
                  const inProgress = !allComplete && done > 0

                  const subtitle =
                    `${total} exercise${total === 1 ? '' : 's'} across ${cat.levels.length} level${cat.levels.length === 1 ? '' : 's'}`
                  const progressText = total > 0
                    ? (allComplete ? 'Complete' : `${done}/${total} complete`)
                    : ''

                  const titleIcon = inProgress
                    ? <span aria-hidden="true" style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: '#B5402A', display: 'inline-block', verticalAlign: 'middle',
                      }} />
                    : undefined

                  const chips = (
                    <>
                      {cat.levels.map(l => <LevelChip key={l.level} level={l.level} />)}
                    </>
                  )

                  return (
                    <ModuleRow
                      key={`${program.slug}-${cat.name}`}
                      state={allComplete ? 'completed' : 'unlocked'}
                      number={moduleIndex}
                      title={cat.name}
                      titleIcon={titleIcon}
                      subtitle={subtitle}
                      chips={chips}
                      secondaryText={progressText || undefined}
                      href={`/programs/rhythm/${program.slug}/${categorySlug(cat.name)}`}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}

      </div>
    </div>
  )
}
