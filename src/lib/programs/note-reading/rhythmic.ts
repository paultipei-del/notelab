/**
 * Rhythmic Sight-Reading helpers (Module 9).
 *
 * Each "question" is a measure of four quarter notes in 4/4. The drill
 * plays a metronome at the chosen tempo; the student has to identify
 * (or play) each note in time with the click.
 */

export interface RhythmicMeasure {
  notes: string[]     // exactly 4 pitches for a 4/4 measure of quarter notes
  tempoBpm: number    // metronome tempo
}

const DEFAULT_TEMPO = 60   // forgiving beginner tempo — one beat per second

// Build a single measure. We pick 4 pitches from the pool, avoiding an
// immediate repeat so the rhythm feels like a musical line rather than
// a stutter.
export function buildRhythmicMeasure(pool: string[], tempoBpm = DEFAULT_TEMPO): RhythmicMeasure {
  const unique = [...new Set(pool)]
  const notes: string[] = []
  let safety = 0
  while (notes.length < 4 && safety < 32) {
    safety++
    const pick = unique[Math.floor(Math.random() * unique.length)]
    if (notes.length > 0 && notes[notes.length - 1] === pick) continue
    notes.push(pick)
  }
  return { notes, tempoBpm }
}

export function buildRhythmicQueue(
  pool: string[],
  length: number,
  tempoBpm = DEFAULT_TEMPO,
): RhythmicMeasure[] {
  return Array.from({ length }, () => buildRhythmicMeasure(pool, tempoBpm))
}

// Duration of one quarter-note beat at `tempoBpm`, in milliseconds.
export function beatMs(tempoBpm: number): number {
  return 60000 / tempoBpm
}
