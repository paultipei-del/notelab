/**
 * Pure helpers for the <MusicalExample> notation pipeline. No rendering, no
 * React. Tested against the v1 fixtures in /learn/_test/musical-example.
 */

import type {
  Duration,
  MusicalElement,
  MusicalNote,
  TimeSignature,
} from './notation-types'
import { parsePitch, staffPosition, type Clef } from './pitch'

/** Beat value of each base duration relative to a quarter note. */
const BASE_BEATS: Record<'w' | 'h' | 'q' | 'e' | 's', number> = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
}

function isDotted(d: Duration): boolean {
  return d.endsWith('.')
}

function baseValue(d: Duration): 'w' | 'h' | 'q' | 'e' | 's' {
  return d[0] as 'w' | 'h' | 'q' | 'e' | 's'
}

export interface Tuplet {
  actual: number
  normal: number
}

function tupletScale(t?: Tuplet): number {
  return t ? t.normal / t.actual : 1
}

/**
 * Beats this duration occupies in the given time signature. The "beat" is
 * the time-signature's denominator (4 → quarter, 8 → eighth). E.g. in 4/4
 * a quarter is 1 beat; in 6/8 a quarter is 2 (eighth) beats.
 *
 * If `tuplet` is given, the result is scaled by `normal/actual` (e.g. an
 * eighth in a 3:2 triplet is 1/3 quarter rather than 1/2).
 */
export function durationToBeats(
  d: Duration,
  ts: TimeSignature,
  tuplet?: Tuplet,
): number {
  const inQuarters = BASE_BEATS[baseValue(d)] * (isDotted(d) ? 1.5 : 1) * tupletScale(tuplet)
  return inQuarters * (ts.denominator / 4)
}

/** Real-time seconds for a duration at a given tempo (BPM = beats/min). */
export function durationToSeconds(
  d: Duration,
  bpm: number,
  ts: TimeSignature,
  tuplet?: Tuplet,
): number {
  const secondsPerBeat = 60 / bpm
  return durationToBeats(d, ts, tuplet) * secondsPerBeat
}

/** A single measure's worth of elements + the metric position each occupies. */
export interface MeasuredElement {
  element: MusicalElement
  /** Index into the flat input array — preserved across the split so
   *  annotations referencing the original index still resolve. */
  origIdx: number
  /** Beats from the start of this measure that this element starts at. */
  beatStart: number
  /** Length in beats. */
  beatLen: number
}

/**
 * Split a flat element array into measures based on the time signature.
 * Elements are kept whole — v1 doesn't auto-split a note that crosses a
 * bar line (callers should pre-tie those manually). If a measure overflows
 * we still group by the natural break and let the overflow start a new
 * measure; in practice the inputs are constructed correctly so this is a
 * cheap safety net.
 */
export function groupIntoMeasures(
  elements: MusicalElement[],
  ts: TimeSignature,
): MeasuredElement[][] {
  const beatsPerMeasure = ts.numerator
  const measures: MeasuredElement[][] = []
  let current: MeasuredElement[] = []
  let cursor = 0

  elements.forEach((element, origIdx) => {
    const len = durationToBeats(element.duration, ts, element.tuplet)
    if (cursor + len > beatsPerMeasure + 1e-6) {
      // Push the current measure and start a new one. Element starts the
      // new measure at beat 0.
      if (current.length > 0) measures.push(current)
      current = []
      cursor = 0
    }
    current.push({ element, origIdx, beatStart: cursor, beatLen: len })
    cursor += len
    if (cursor >= beatsPerMeasure - 1e-6) {
      measures.push(current)
      current = []
      cursor = 0
    }
  })

  if (current.length > 0) measures.push(current)
  return measures
}

/** A run of adjacent eighths/sixteenths to be beamed together. */
export interface BeamGroup {
  /** Indices into the measure's element array (NOT the flat array). */
  indices: number[]
  /** Per-note beam count: 1 = eighth, 2 = sixteenth. */
  beamCounts: number[]
}

const BEAMABLE: ReadonlySet<string> = new Set(['e', 's', 'e.', 's.'])

/**
 * Beat-group boundaries for a given time signature, expressed in beats
 * from the start of the measure. A beam group never crosses one of these
 * boundaries — that's the engraving rule that keeps beats visually clean.
 *
 *   - simple meter (2/4, 3/4, 4/4) → beam each beat (denominator unit)
 *   - compound meter (6/8, 9/8, 12/8) → beam each compound beat (3 eighths)
 *   - 3/8 → single group of 3 eighths
 */
function beatBoundaries(ts: TimeSignature): number[] {
  const { numerator, denominator } = ts
  const isCompound = denominator === 8 && numerator % 3 === 0 && numerator >= 6
  if (denominator === 8 && numerator === 3) {
    // 3/8 — beam the whole bar as one group.
    return [0, 3]
  }
  if (isCompound) {
    // Compound: each beat = 3 eighths = 1.5 quarters → in our beat-unit
    // (the denominator), each beat group is 3 units long.
    const out: number[] = []
    for (let b = 0; b <= numerator; b += 3) out.push(b)
    return out
  }
  // Simple: each beat = 1 unit (the denominator). Boundaries = 0,1,2,...,N.
  const out: number[] = []
  for (let b = 0; b <= numerator; b++) out.push(b)
  return out
}

/** Beam-grouping mode. 'standard' is the only correct setting for real
 *  music; 'all-together' and 'none' exist for ONE pedagogical demo on
 *  the beaming-rules lesson and should never be used elsewhere. */
export type BeamOverride = 'standard' | 'all-together' | 'none'

/**
 * Identify beam groups within a single measure. Beamable durations
 * (eighths and sixteenths, dotted or not) that share a beat-group and are
 * adjacent get joined into one beam. Notes longer than an eighth, rests,
 * and beat boundaries terminate any in-progress group.
 *
 * `override`:
 *   - 'standard' (default): the engraving rule above.
 *   - 'all-together': beam ALL beamable elements as one group, ignoring
 *     beat boundaries. (Wrong-on-purpose demo only.)
 *   - 'none': no beam groups; every eighth/sixteenth gets a flag.
 */
export function groupIntoBeams(
  measure: MeasuredElement[],
  ts: TimeSignature,
  override: BeamOverride = 'standard',
): BeamGroup[] {
  if (override === 'none') return []
  if (override === 'all-together') {
    const indices: number[] = []
    const counts: number[] = []
    measure.forEach((m, i) => {
      const isNote = m.element.type === 'note'
      const dur = m.element.duration
      if (isNote && BEAMABLE.has(dur)) {
        indices.push(i)
        counts.push(dur.startsWith('s') ? 2 : 1)
      }
    })
    return indices.length >= 2 ? [{ indices, beamCounts: counts }] : []
  }
  const boundaries = beatBoundaries(ts)
  const groups: BeamGroup[] = []
  let current: { indices: number[]; counts: number[] } | null = null

  const beatGroupOf = (beat: number): number => {
    for (let i = 1; i < boundaries.length; i++) {
      if (beat < boundaries[i] - 1e-6) return i - 1
    }
    return boundaries.length - 2
  }

  const flush = () => {
    if (current && current.indices.length >= 2) {
      groups.push({
        indices: current.indices,
        beamCounts: current.counts,
      })
    }
    current = null
  }

  measure.forEach((m, i) => {
    const isNote = m.element.type === 'note'
    const dur = m.element.duration
    const beamable = isNote && BEAMABLE.has(dur)
    if (!beamable) {
      flush()
      return
    }
    const myGroup = beatGroupOf(m.beatStart)
    const startGroup = current ? beatGroupOf(measure[current.indices[0]].beatStart) : null
    if (current && myGroup !== startGroup) flush()
    if (!current) current = { indices: [], counts: [] }
    current.indices.push(i)
    current.counts.push(dur.startsWith('s') ? 2 : 1)
  })
  flush()

  return groups
}

/**
 * Average staff position of a chord — used to decide stem direction for
 * a beamed group as a whole.
 */
export function averageStaffPosition(
  pitches: string[],
  clef: Clef,
): number {
  let sum = 0
  let n = 0
  for (const p of pitches) {
    const parsed = parsePitch(p)
    if (!parsed) continue
    sum += staffPosition(parsed, clef)
    n++
  }
  return n === 0 ? 4 : sum / n
}

/**
 * Stem direction for a single note (or chord). Stem points down when the
 * average staff position is above the middle line (pos 4), up otherwise.
 * Higher pitches → smaller pos values, so "above middle" means pos < 4.
 */
export function computeStemDirection(
  pitches: string[],
  clef: Clef,
): 'up' | 'down' {
  const avg = averageStaffPosition(pitches, clef)
  return avg < 4 ? 'down' : 'up'
}

const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'] as const
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'] as const

/**
 * Letters whose default form in the given key signature is altered. The
 * value is the alteration ('#' or 'b'). Used to decide whether a note's
 * accidental needs explicit rendering or is implied by the key.
 */
export function accidentalsForKey(keySignature: number): Map<string, '#' | 'b'> {
  const result = new Map<string, '#' | 'b'>()
  if (keySignature === 0) return result
  const isSharp = keySignature > 0
  const count = Math.abs(keySignature)
  const order = isSharp ? SHARP_ORDER : FLAT_ORDER
  for (let i = 0; i < count; i++) {
    result.set(order[i], isSharp ? '#' : 'b')
  }
  return result
}

/** Effective accidental — '', '#', 'b', '##', 'bb', or 'n' (natural). */
function effectiveAccidental(pitch: string): '' | '#' | 'b' | '##' | 'bb' | 'n' {
  const m = pitch.match(/^[A-G](##|bb|#|b|n)?-?\d+$/)
  if (!m) return ''
  return (m[1] ?? '') as '' | '#' | 'b' | '##' | 'bb' | 'n'
}

/**
 * Decide whether to render an accidental for this pitch. Walks the running
 * `prev` map (letter+octave → last accidental shown in this measure) and
 * applies the standard rules:
 *   1. If the same letter+octave was already altered earlier in this
 *      measure, the new appearance only needs an accidental if it differs.
 *   2. Otherwise compare against the key signature's default for the
 *      letter and render only if they disagree.
 *
 * Returns the glyph hint to render ('sharp', 'flat', 'natural', 'doubleSharp',
 * 'doubleFlat') or null if no accidental is needed. Mutates `prev`.
 */
export function shouldRenderAccidental(
  pitch: string,
  prev: Map<string, string>,
  keyAlt: Map<string, '#' | 'b'>,
): 'sharp' | 'flat' | 'natural' | 'doubleSharp' | 'doubleFlat' | null {
  const letterMatch = pitch.match(/^([A-G])(##|bb|#|b|n)?(-?\d+)$/)
  if (!letterMatch) return null
  const [, letter, accStr, octStr] = letterMatch
  const acc = (accStr ?? '') as '' | '#' | 'b' | '##' | 'bb' | 'n'
  const letterOct = `${letter}${octStr}`

  // Prior in this measure for the same letter+octave.
  const priorInMeasure = prev.get(letterOct)
  if (priorInMeasure !== undefined) {
    const same = priorInMeasure === acc
    if (same) return null
    // Differs from prior — render the new accidental.
    prev.set(letterOct, acc)
    return accToGlyph(acc, keyAlt.get(letter))
  }

  // No prior in measure — compare to key signature default.
  const keyAccForLetter = keyAlt.get(letter) ?? ''
  if (acc === '' && keyAccForLetter === '') return null
  if (acc === '' && keyAccForLetter !== '') {
    // Pitch is natural but the key signature would alter the letter.
    // Render an explicit natural.
    prev.set(letterOct, 'n')
    return 'natural'
  }
  if (acc === keyAccForLetter) {
    // Already implied by the key signature.
    return null
  }
  // Pitch has its own accidental different from the key signature default.
  prev.set(letterOct, acc)
  const keyDefault = keyAccForLetter === '' ? undefined : keyAccForLetter
  return accToGlyph(acc, keyDefault)
}

function accToGlyph(
  acc: '' | '#' | 'b' | '##' | 'bb' | 'n',
  _keyDefault: '#' | 'b' | undefined,
): 'sharp' | 'flat' | 'natural' | 'doubleSharp' | 'doubleFlat' | null {
  if (acc === '#') return 'sharp'
  if (acc === 'b') return 'flat'
  if (acc === 'n') return 'natural'
  if (acc === '##') return 'doubleSharp'
  if (acc === 'bb') return 'doubleFlat'
  return null
}

/**
 * Map a pitch's literal modifier to an accidental glyph kind, regardless
 * of measure context or key signature. Used for cautionary accidentals
 * where the glyph must always render (F5 → 'natural', F#5 → 'sharp', etc).
 */
export function cautionaryAccidentalKind(
  pitch: string,
): 'sharp' | 'flat' | 'natural' | 'doubleSharp' | 'doubleFlat' {
  const m = pitch.match(/^([A-G])(##|bb|#|b|n)?(-?\d+)$/)
  if (!m) return 'natural'
  const [, , accStr] = m
  const acc = (accStr ?? '') as '' | '#' | 'b' | '##' | 'bb' | 'n'
  if (acc === '#') return 'sharp'
  if (acc === 'b') return 'flat'
  if (acc === '##') return 'doubleSharp'
  if (acc === 'bb') return 'doubleFlat'
  return 'natural'
}

/**
 * Pitches of a note element as a uniform array. Handles both `pitch` and
 * `pitches` shapes.
 */
export function pitchesOf(n: MusicalNote): string[] {
  if (n.pitches && n.pitches.length > 0) return n.pitches
  if (n.pitch) return [n.pitch]
  return []
}

/**
 * Audio-pitches for a note element. Falls back to the displayed pitch when
 * no override is set, which is the case for almost every note. Used by the
 * transposing-instruments lesson where the staff shows the written pitch
 * but playback should produce the sounding pitch.
 */
export function playPitchesOf(n: MusicalNote): string[] {
  if (n.playPitches && n.playPitches.length > 0) return n.playPitches
  if (n.playPitch) return [n.playPitch]
  return pitchesOf(n)
}

/**
 * Walk `tied` flags forward and return the cumulative duration in seconds
 * for the chain starting at `startIdx`. Used by audio playback so a tied
 * sequence triggers one attack with the combined duration.
 */
export function tiedChainSeconds(
  elements: MusicalElement[],
  startIdx: number,
  bpm: number,
  ts: TimeSignature,
): { totalSeconds: number; chainEnd: number } {
  let total = 0
  let i = startIdx
  while (i < elements.length) {
    const el = elements[i]
    if (el.type !== 'note') break
    total += durationToSeconds(el.duration, bpm, ts, el.tuplet)
    if (!el.tied) break
    // Tie chains forward only when the next note shares a pitch with this
    // one. A `tied` flag without a same-pitch destination is a cross-voice
    // tie (or stray engraver mark) and shouldn't swallow the next note's
    // playback or flash.
    const next = elements[i + 1]
    if (!next || next.type !== 'note') break
    const elPitches = pitchesOf(el)
    const nextPitches = pitchesOf(next)
    const sharesPitch = elPitches.some(p => nextPitches.includes(p))
    if (!sharesPitch) break
    i++
  }
  return { totalSeconds: total, chainEnd: i }
}
