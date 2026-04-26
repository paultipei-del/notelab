'use client'

import ExerciseRow from './ExerciseRow'
import type { RhythmExerciseMeta, RhythmProgress } from '@/lib/rhythmLibrary'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  programSlug: string
  categorySlug: string
  levels: { level: number; exercises: RhythmExerciseMeta[] }[]
  progress: Record<string, RhythmProgress>
  /** Flat unlock order for the entire program (determines sequential unlocking) */
  unlockOrder: RhythmExerciseMeta[]
}

// Local override for previewing locked content during development. The env
// check makes it physically impossible for this to be true in a production
// build — flip `&& false` to `&& true` only while iterating.
const DEV_UNLOCK_ALL = process.env.NODE_ENV === 'development' && false

export default function ExerciseList({ programSlug, categorySlug, levels, progress, unlockOrder }: Props) {
  const unlockMap = new Map(unlockOrder.map((e, i) => [e.id, i]))

  function isUnlocked(ex: RhythmExerciseMeta): boolean {
    if (DEV_UNLOCK_ALL) return true
    const idx = unlockMap.get(ex.id) ?? -1
    if (idx <= 0) return true
    const prev = unlockOrder[idx - 1]
    return prev ? (progress[prev.id]?.completed ?? false) : true
  }

  // Assign display index across all levels in this category
  let globalIdx = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
      {levels.map(levelNode => {
        const levelLabel = `Level ${levelNode.level}`
        return (
          <div key={levelNode.level} style={{ background: 'white', border: '1px solid #DDD8CA', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #EDE8DF' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', margin: 0 }}>
                {levelLabel}
              </p>
            </div>
            <div>
              {levelNode.exercises.map((ex, exIdx) => {
                globalIdx++
                const idx = globalIdx
                return (
                  <div
                    key={ex.id}
                    style={{
                      borderBottom: exIdx < levelNode.exercises.length - 1 ? '1px solid #F2EDDF' : 'none',
                    }}
                  >
                    <ExerciseRow
                      exercise={ex}
                      progress={progress[ex.id]}
                      globalIndex={idx}
                      href={`/programs/rhythm/${programSlug}/${categorySlug}/${ex.id}`}
                      isUnlocked={isUnlocked(ex)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
