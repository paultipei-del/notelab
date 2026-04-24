/**
 * Intervallic Reading drill helpers.
 *
 * Module 8 generates questions of the form "first note + interval size +
 * direction → target note." This file keeps all the letter-step math in
 * one place so the three intervallic drills stay consistent.
 *
 * Intervals are **letter-counted** (C→E is a 3rd regardless of whether
 * it's a major or minor third). We only deal with diatonic naturals in
 * Module 8, so enharmonic accidentals are out of scope here.
 */

export type IntervalSize = 2 | 3 | 4 | 5 | 6 | 7 | 8
export type IntervalDirection = 'up' | 'down'

export interface IntervallicQuestion {
  firstPitch: string
  intervalSize: IntervalSize
  direction: IntervalDirection
  secondPitch: string
}

export const INTERVAL_LABELS: Record<IntervalSize, string> = {
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  8: 'octave',
}

export const INTERVAL_SIZES: IntervalSize[] = [2, 3, 4, 5, 6, 7, 8]

const LETTER_ORDER = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

// Encode a natural pitch ("C4", "A3") as an integer line-and-space position.
// Two pitches whose positions differ by N have an interval of size N+1
// (a 3rd = 2 line-steps apart). Returns null for non-natural pitches.
export function pitchToLetterPos(pitch: string): number | null {
  const m = pitch.match(/^([A-G])(\d+)$/)
  if (!m) return null
  const letterIdx = LETTER_ORDER.indexOf(m[1] as typeof LETTER_ORDER[number])
  if (letterIdx < 0) return null
  return parseInt(m[2], 10) * 7 + letterIdx
}

export function letterPosToPitch(pos: number): string {
  // `pos` can be negative for sub-contra octaves; floor division handles that.
  const octave = Math.floor(pos / 7)
  const letterIdx = ((pos % 7) + 7) % 7
  return `${LETTER_ORDER[letterIdx]}${octave}`
}

// Apply an interval to a starting pitch. "Up a 3rd" from C4 = E4.
// Returns null if inputs don't resolve cleanly.
export function transposeByInterval(
  firstPitch: string,
  size: IntervalSize,
  direction: IntervalDirection,
): string | null {
  const start = pitchToLetterPos(firstPitch)
  if (start === null) return null
  const steps = size - 1
  const delta = direction === 'up' ? steps : -steps
  return letterPosToPitch(start + delta)
}

// Measure the letter-based interval between two pitches. Returns null if
// either pitch can't be parsed or if the interval exceeds an octave.
export function intervalBetween(
  from: string,
  to: string,
): { size: IntervalSize; direction: IntervalDirection } | null {
  const a = pitchToLetterPos(from)
  const b = pitchToLetterPos(to)
  if (a === null || b === null) return null
  const delta = b - a
  const size = Math.abs(delta) + 1
  if (size < 2 || size > 8) return null
  return {
    size: size as IntervalSize,
    direction: delta >= 0 ? 'up' : 'down',
  }
}

// Build a single intervallic question: pick a random starting pitch from
// the module pool, a random interval size, and a direction. Reject any
// combination whose target pitch falls outside the module's rendering
// range (caller supplies `renderRange` as [minPos, maxPos]).
export function buildIntervallicQuestion(
  pool: string[],
  renderRange: { min: number; max: number },
): IntervallicQuestion | null {
  const candidates = pool.slice()
  // Shuffle so we don't always start from the same pitch.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  for (const first of candidates) {
    const firstPos = pitchToLetterPos(first)
    if (firstPos === null) continue
    // Randomise interval + direction. Try both directions per size if the
    // first choice goes off-range.
    const sizes = INTERVAL_SIZES.slice()
    for (let i = sizes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[sizes[i], sizes[j]] = [sizes[j], sizes[i]]
    }
    for (const size of sizes) {
      const directions: IntervalDirection[] =
        Math.random() < 0.5 ? ['up', 'down'] : ['down', 'up']
      for (const direction of directions) {
        const target = transposeByInterval(first, size, direction)
        if (!target) continue
        const targetPos = pitchToLetterPos(target)
        if (targetPos === null) continue
        if (targetPos < renderRange.min || targetPos > renderRange.max) continue
        return { firstPitch: first, intervalSize: size, direction, secondPitch: target }
      }
    }
  }
  return null
}

// Build an N-question queue for an intervallic drill session. Avoids
// back-to-back identical starting pitches so the student isn't answering
// the same card twice in a row.
export function buildIntervallicQueue(
  pool: string[],
  length: number,
  renderRange: { min: number; max: number },
): IntervallicQuestion[] {
  const out: IntervallicQuestion[] = []
  let safety = 0
  while (out.length < length && safety < length * 5) {
    safety++
    const q = buildIntervallicQuestion(pool, renderRange)
    if (!q) continue
    if (out.length > 0 && out[out.length - 1].firstPitch === q.firstPitch) continue
    out.push(q)
  }
  return out
}
