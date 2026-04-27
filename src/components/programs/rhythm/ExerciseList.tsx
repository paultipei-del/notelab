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

const PREFIX_RE = /^#\d+\s*-\s*/
const METER_SUFFIX_RE = /\s*\((\d+\/\d+)\)\s*$/

/**
 * Strip insert-time `#N -` prefix and trailing `(3/4)` meter tag so we can
 * compare base titles. The migration script removes the `#N -` prefix from
 * Supabase, but we strip defensively at render time so the UI stays correct
 * if the migration hasn't run yet.
 */
function baseTitle(raw: string): string {
  return raw.replace(PREFIX_RE, '').replace(METER_SUFFIX_RE, '').trim()
}

/**
 * Build a render order in which each meter-variant row (title ending in
 * "(X/Y)") is repositioned to immediately follow its base sibling, paired
 * 1:1 by their position within the base-title bucket. Rows without a
 * matching primary render as primaries themselves.
 *
 * Example: a level with 2 primaries + 2 variants of the same base title
 * renders as `primary[0], variant[0], primary[1], variant[1]` — not both
 * variants stacked under primary[0].
 */
function groupExercisesWithVariants(
  exercises: RhythmExerciseMeta[],
): Array<{ exercise: RhythmExerciseMeta; isVariant: boolean }> {
  // Bucket by base title; primaries and variants tracked in their natural
  // (order_index) order so we can pair by index.
  const buckets = new Map<string, { primaries: RhythmExerciseMeta[]; variants: RhythmExerciseMeta[] }>()
  for (const ex of exercises) {
    const stripped = ex.title.replace(PREFIX_RE, '')
    const isVariant = METER_SUFFIX_RE.test(stripped)
    const base = baseTitle(ex.title)
    if (!buckets.has(base)) buckets.set(base, { primaries: [], variants: [] })
    const b = buckets.get(base)!
    if (isVariant) b.variants.push(ex)
    else b.primaries.push(ex)
  }

  const placed = new Set<string>()
  const result: Array<{ exercise: RhythmExerciseMeta; isVariant: boolean }> = []

  for (const ex of exercises) {
    if (placed.has(ex.id)) continue
    const stripped = ex.title.replace(PREFIX_RE, '')
    if (METER_SUFFIX_RE.test(stripped)) continue // variants placed via primary walk

    const base = baseTitle(ex.title)
    const bucket = buckets.get(base)!
    const idxInBucket = bucket.primaries.indexOf(ex)
    result.push({ exercise: ex, isVariant: false })
    placed.add(ex.id)

    const pairedVariant = bucket.variants[idxInBucket]
    if (pairedVariant && !placed.has(pairedVariant.id)) {
      result.push({ exercise: pairedVariant, isVariant: true })
      placed.add(pairedVariant.id)
    }
  }

  // Orphan variants (no matching primary at their bucket index) render as
  // primaries themselves so they remain reachable.
  for (const ex of exercises) {
    if (placed.has(ex.id)) continue
    result.push({ exercise: ex, isVariant: false })
    placed.add(ex.id)
  }

  return result
}

export default function ExerciseList({ programSlug, categorySlug, levels, progress, unlockOrder }: Props) {
  const unlockMap = new Map(unlockOrder.map((e, i) => [e.id, i]))

  function isUnlocked(ex: RhythmExerciseMeta): boolean {
    if (DEV_UNLOCK_ALL) return true
    const idx = unlockMap.get(ex.id) ?? -1
    if (idx <= 0) return true
    const prev = unlockOrder[idx - 1]
    return prev ? (progress[prev.id]?.completed ?? false) : true
  }

  // Continuous numbering across levels — but variants share their parent's
  // number rather than incrementing. So if a category has 8 rows and 2 of
  // them are (3/4) variants, the user sees badges 1–6 with two un-badged
  // variant rows nested under their parents.
  let primaryCount = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
      {levels.map(levelNode => {
        const grouped = groupExercisesWithVariants(levelNode.exercises)
        return (
          <div key={levelNode.level} style={{ background: 'white', border: '1px solid #DDD8CA', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #EDE8DF' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', margin: 0 }}>
                {`Level ${levelNode.level}`}
              </p>
            </div>
            <div>
              {grouped.map((g, gIdx) => {
                if (!g.isVariant) primaryCount++
                const isLast = gIdx === grouped.length - 1
                return (
                  <div
                    key={g.exercise.id}
                    style={{
                      borderBottom: !isLast ? '1px solid #F2EDDF' : 'none',
                    }}
                  >
                    <ExerciseRow
                      exercise={g.exercise}
                      progress={progress[g.exercise.id]}
                      globalIndex={primaryCount}
                      href={`/programs/rhythm/${programSlug}/${categorySlug}/${g.exercise.id}`}
                      isUnlocked={isUnlocked(g.exercise)}
                      isMeterVariant={g.isVariant}
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
