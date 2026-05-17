/**
 * Chord detection — the brain of the Harmony Reading Program.
 *
 * Given raw MIDI note numbers and a key context, produce:
 *   - a chord name ("Cmaj7", "F/C", "G7" …)
 *   - a roman numeral when the root is diatonic to the key
 *   - spelled note names that match the staff's key signature
 *   - inversion index and bass note
 *   - a confidence label so the UI can choose how loudly to display
 *
 * Pure module — no DOM, no Tonal dependency. Scope per the v1 spec:
 * triads, common sevenths, sixths, basic 9ths, a few altered dominants,
 * cluster rejection, single-note + interval handling.
 */

import { CHORD_DICTIONARY, type ChordDefinition } from './chordDictionary'
import { spellPC } from './spellingTables'
import { romanNumeralFor } from './romanNumerals'

const NATURAL_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

export type DetectInput = {
  midiNotes: number[]
  currentKey: string
}

export type ChordResult = {
  chordName: string | null
  chordNameVerbose: string | null
  romanNumeral: string | null
  spelledNotes: string[]
  bassNote: string | null
  inversion: number
  confidence: 'high' | 'medium' | 'low' | 'none'
  isCluster: boolean
}

// ── helpers ───────────────────────────────────────────────────────────────
function pcOf(midi: number): number { return ((midi % 12) + 12) % 12 }
function intervalFrom(rootPc: number, pc: number): number {
  return ((pc - rootPc) % 12 + 12) % 12
}

const INTERVAL_NAMES: Record<number, string> = {
  1:  'm2', 2:  'M2', 3:  'm3', 4:  'M3', 5:  'P4', 6:  'TT',
  7:  'P5', 8:  'm6', 9:  'M6', 10: 'm7', 11: 'M7', 0:  'P8',
}

const EMPTY: ChordResult = {
  chordName: null, chordNameVerbose: null, romanNumeral: null,
  spelledNotes: [], bassNote: null, inversion: -1,
  confidence: 'none', isCluster: false,
}

// ── cluster rejection ─────────────────────────────────────────────────────
function circDist(a: number, b: number): number {
  const d = ((a - b) % 12 + 12) % 12
  return Math.min(d, 12 - d)
}

function isCluster(pcs: number[]): boolean {
  if (pcs.length < 3) return false
  // For each pc, count how many other pcs are within a minor third
  // (circular distance ≤ 3). A pc with ≥ 2 such neighbours indicates a
  // cluster centred on that pc — handles wraparound (B-C-C# is a cluster
  // even though raw subtraction makes them look far apart).
  let maxNeighbours = 0
  for (const p of pcs) {
    let n = 0
    for (const q of pcs) {
      if (q !== p && circDist(p, q) <= 3) n++
    }
    if (n > maxNeighbours) maxNeighbours = n
  }
  if (maxNeighbours < 2) return false
  // Triad rescue: if any pc forms a 3rd (maj or min) AND a 5th (dim, P,
  // or aug), the input has recognisable triadic structure and is NOT a
  // cluster. Covers major, minor, diminished, and augmented triads.
  const set = new Set(pcs)
  for (const root of set) {
    const hasThird = set.has((root + 3) % 12) || set.has((root + 4) % 12)
    const hasFifth = set.has((root + 6) % 12)
                  || set.has((root + 7) % 12)
                  || set.has((root + 8) % 12)
    if (hasThird && hasFifth) return false
  }
  return true
}

// ── scoring ───────────────────────────────────────────────────────────────
interface Candidate {
  root: number
  def: ChordDefinition
  score: number
  missingRequired: number
  unusedPcs: number
}

function scoreCandidate(
  rootPc: number, def: ChordDefinition,
  inputPcs: Set<number>, bassPc: number,
): Candidate | null {
  // All REQUIRED intervals must be either present or counted as missing.
  let missingRequired = 0
  for (const iv of def.required) {
    if (!inputPcs.has((rootPc + iv) % 12)) missingRequired++
  }
  // Require: root must be a played pitch class.
  if (!inputPcs.has(rootPc)) return null
  // Reject the match entirely if more than one required interval is missing
  // (e.g. a "maj7" with no 3rd AND no 7th is just a 5th).
  if (missingRequired > 1) return null

  // Count how many input pitch classes are explained by the chord.
  const chordPcs = new Set(def.intervals.map(iv => (rootPc + iv) % 12))
  let unusedPcs = 0
  for (const pc of inputPcs) if (!chordPcs.has(pc)) unusedPcs++

  let score = 0
  if (rootPc === bassPc) score += 10
  if (unusedPcs === 0)   score += 5
  if (def.common)        score += 3
  score -= missingRequired * 2
  // Unused-pc penalty is -5 (not -3) so that a clean inversion that uses
  // every input note wins against a smaller chord with the bass note
  // happening to be its root (e.g. Cmaj7/E beats Em + C-as-leftover).
  score -= unusedPcs * 5

  return { root: rootPc, def, score, missingRequired, unusedPcs }
}

function pickBest(candidates: Candidate[]): Candidate | null {
  if (candidates.length === 0) return null
  // Sort by (score desc, common desc, lowest pc asc for deterministic tiebreak).
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.def.common !== b.def.common) return a.def.common ? -1 : 1
    return a.root - b.root
  })
  return sorted[0]
}

// ── spelling helpers ──────────────────────────────────────────────────────
function spellRootForChord(
  rootPc: number, def: ChordDefinition, keyString: string,
): string {
  // Triads/sevenths/etc. should spell the root, third, fifth, seventh on
  // consecutive staff degrees. Use the key's table for the root, then for
  // the staff-display spelling of inner chord tones derive enharmonics so
  // a Cmaj triad in F major reads as "C E G" (not "C Fb G").
  return spellPC(rootPc, keyString)
}

function spellMidiNotes(midiNotes: number[], keyString: string): string[] {
  return midiNotes.map(n => spellPC(pcOf(n), keyString))
}

// ── inversion ─────────────────────────────────────────────────────────────
function computeInversion(rootPc: number, def: ChordDefinition, bassPc: number): number {
  if (bassPc === rootPc) return 0
  const intervals = def.intervals.slice().sort((a, b) => a - b)
  for (let i = 0; i < intervals.length; i++) {
    if ((rootPc + intervals[i]) % 12 === bassPc) return i
  }
  return -1
}

// ── single-note + interval handling ──────────────────────────────────────
function singleNoteResult(midi: number, keyString: string): ChordResult {
  const name = spellPC(pcOf(midi), keyString)
  return {
    chordName: name, chordNameVerbose: `${name} (single note)`,
    romanNumeral: null,
    spelledNotes: [name], bassNote: name, inversion: -1,
    confidence: 'low', isCluster: false,
  }
}

function intervalResult(midiNotes: number[], keyString: string): ChordResult {
  const [low, high] = [...midiNotes].sort((a, b) => a - b)
  const lowName = spellPC(pcOf(low), keyString)
  const highName = spellPC(pcOf(high), keyString)
  const semi = ((pcOf(high) - pcOf(low)) % 12 + 12) % 12
  const ivName = INTERVAL_NAMES[semi] ?? '?'
  return {
    chordName: `${lowName} + ${highName} (${ivName})`,
    chordNameVerbose: `${lowName} ${ivName} ${highName}`,
    romanNumeral: null,
    spelledNotes: [lowName, highName],
    bassNote: lowName, inversion: -1,
    confidence: 'medium', isCluster: false,
  }
}

// ── public entry point ───────────────────────────────────────────────────
export function detectChord(input: DetectInput): ChordResult {
  const { midiNotes, currentKey } = input
  if (!midiNotes || midiNotes.length === 0) return EMPTY

  const sortedMidi = [...midiNotes].sort((a, b) => a - b)
  if (sortedMidi.length === 1) return singleNoteResult(sortedMidi[0], currentKey)
  if (sortedMidi.length === 2) return intervalResult(sortedMidi, currentKey)

  const pcArray = Array.from(new Set(sortedMidi.map(pcOf)))
  const pcSet = new Set(pcArray)
  const bassPc = pcOf(sortedMidi[0])

  if (pcArray.length > 7 || isCluster(pcArray)) {
    return {
      ...EMPTY,
      spelledNotes: spellMidiNotes(sortedMidi, currentKey),
      bassNote: spellPC(bassPc, currentKey),
      confidence: 'none', isCluster: true,
    }
  }

  // Score every (root × chord-definition) candidate.
  const candidates: Candidate[] = []
  for (const root of pcArray) {
    for (const def of CHORD_DICTIONARY) {
      const c = scoreCandidate(root, def, pcSet, bassPc)
      if (c) candidates.push(c)
    }
  }
  const best = pickBest(candidates)
  if (!best) {
    return {
      ...EMPTY,
      spelledNotes: spellMidiNotes(sortedMidi, currentKey),
      bassNote: spellPC(bassPc, currentKey),
      confidence: 'low', isCluster: false,
    }
  }

  const rootName = spellRootForChord(best.root, best.def, currentKey)
  const bassName = spellPC(bassPc, currentKey)
  const inversion = computeInversion(best.root, best.def, bassPc)
  const slash = bassPc !== best.root ? `/${bassName}` : ''
  const chordName = `${rootName}${best.def.symbol}${slash}`
  const verbose = `${rootName} ${best.def.verbose}${slash ? ` over ${bassName}` : ''}`
  const roman = romanNumeralFor(best.root, best.def.symbol, currentKey)

  const confidence: ChordResult['confidence'] =
    best.score >= 15 ? 'high'
    : best.score >= 8 ? 'medium'
    : 'low'

  return {
    chordName,
    chordNameVerbose: verbose,
    romanNumeral: roman,
    spelledNotes: spellMidiNotes(sortedMidi, currentKey),
    bassNote: bassName,
    inversion,
    confidence,
    isCluster: false,
  }
}

// Re-export so callers can reach the underlying types via this entry point.
export type { ChordDefinition } from './chordDictionary'
export type { SpellingTable } from './spellingTables'
// Internal helpers exposed for adjacent modules that want to share spelling.
export const _internal = { NATURAL_LETTERS }
