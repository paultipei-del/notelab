// Thin helpers on top of the existing rhythm progress system in rhythmLibrary.ts
import type { RhythmProgress, RhythmExerciseMeta } from '@/lib/rhythmLibrary'

export type { RhythmProgress }

/** Summarise progress across a list of exercises for a category or program. */
export function summariseProgress(
  exercises: RhythmExerciseMeta[],
  progress: Record<string, RhythmProgress>,
): { done: number; total: number; bestPct: number; started: boolean } {
  let done = 0
  let bestPct = 0
  let started = false
  for (const ex of exercises) {
    const p = progress[ex.id]
    if (!p) continue
    started = true
    if (p.completed) done++
    if (p.best_timing > bestPct) bestPct = p.best_timing
  }
  return { done, total: exercises.length, bestPct, started }
}
