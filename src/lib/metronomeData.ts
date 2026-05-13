// Shared data for the /metronome page. Two range sets with different
// jobs:
//
// 1. TEMPO_NAMES — ordered list of single best-fit labels for the
//    italian word shown above the BPM number. Granular and expressive
//    (grave / allegretto / prestissimo all exist), with overlap
//    resolved by ordering: the first entry whose `max` covers the BPM
//    wins.
//
// 2. TEMPO_STRIP_RANGES — non-overlapping ranges for the reference
//    strip cell. The strip is navigational, so we need exactly one
//    range to highlight for any given BPM. Edges agreed with Paul:
//    vivace 168–176, presto 177–400 — every integer has a single home.

export interface TempoNameEntry {
  name: string
  max: number
}

export const TEMPO_NAMES: TempoNameEntry[] = [
  { name: 'grave',       max: 39 },
  { name: 'largo',       max: 49 },
  { name: 'larghetto',   max: 59 },
  { name: 'lento',       max: 65 },
  { name: 'adagio',      max: 71 },
  { name: 'andante',     max: 89 },
  { name: 'andantino',   max: 99 },
  { name: 'moderato',    max: 119 },
  { name: 'allegretto',  max: 131 },
  { name: 'allegro',     max: 167 },
  { name: 'vivace',      max: 176 },
  { name: 'presto',      max: 199 },
  { name: 'prestissimo', max: 400 },
]

export const nameFor = (bpm: number): string =>
  TEMPO_NAMES.find(t => bpm <= t.max)?.name ?? 'prestissimo'

export interface StripRange {
  name: string
  min: number
  max: number
}

/** Non-overlapping ranges for the reference strip's position bar. */
export const TEMPO_STRIP_RANGES: StripRange[] = [
  { name: 'grave',    min: 20,  max: 40 },
  { name: 'largo',    min: 40,  max: 66 },
  { name: 'adagio',   min: 66,  max: 76 },
  { name: 'andante',  min: 76,  max: 108 },
  { name: 'moderato', min: 108, max: 120 },
  { name: 'allegro',  min: 120, max: 168 },
  { name: 'vivace',   min: 168, max: 176 },
  { name: 'presto',   min: 177, max: 400 },
]

/** Range whose `[min, max]` covers the BPM, falling back to the first
 *  / last entry for under- or over-flow. Also returns the BPM's
 *  position within the range as a [0, 1] number for the position dot. */
export function rangeFor(bpm: number): { range: StripRange; position: number } {
  const first = TEMPO_STRIP_RANGES[0]
  const last = TEMPO_STRIP_RANGES[TEMPO_STRIP_RANGES.length - 1]
  if (bpm < first.min) return { range: first, position: 0 }
  if (bpm > last.max) return { range: last, position: 1 }
  const range = TEMPO_STRIP_RANGES.find(r => bpm >= r.min && bpm <= r.max) ?? first
  const span = range.max - range.min
  const position = span > 0 ? Math.min(1, Math.max(0, (bpm - range.min) / span)) : 0
  return { range, position }
}

/** Identifier for the active beat-subdivision. `quarter` is the
 *  neutral default (one click per beat, no in-beat ticks). Dotted
 *  variants are reference-only — they appear in the grid but click
 *  doesn't change the audio. */
export type SubdivisionId =
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth'
  | 'dotted-quarter'
  | 'dotted-eighth'
  | 'quarter-triplet'
  | 'eighth-triplet'

export const SUBDIVISION_IDS: SubdivisionId[] = [
  'half',
  'quarter',
  'eighth',
  'sixteenth',
  'dotted-quarter',
  'dotted-eighth',
  'quarter-triplet',
  'eighth-triplet',
]

export const isSubdivisionId = (v: unknown): v is SubdivisionId =>
  typeof v === 'string' && (SUBDIVISION_IDS as string[]).includes(v)

export interface NoteValueDef {
  id: SubdivisionId
  /** SMuFL Bravura codepoint for the parent note glyph. */
  glyph: string
  /** Multiplier applied to the BPM to derive the displayed rate. */
  multiplier: number
  /** Triplet — render parent glyph + small "3" superscript via ::after. */
  isTriplet?: boolean
  /** Dotted — render parent glyph + augmentation dot inline. Dotted
   *  notes are reference-only; clicking them flashes a tooltip but
   *  does not change audio. */
  isDotted?: boolean
  /** Reference-only entries are not audible subdivisions. */
  isReferenceOnly?: boolean
  label: string
  mobileLabel: string
}

/** Codepoints — validated visually against Bravura in v1:
 *   noteHalfUp  U+E1D7
 *   noteQuarterUp U+E1D5
 *   note8thUp   U+E1D3
 *   note16thUp  U+E1D2
 *  Dotted variants reuse the parent glyph + augmentation dot (U+E1E7). */
export const STRAIGHT_NOTE_VALUES: NoteValueDef[] = [
  { id: 'half',      glyph: '', multiplier: 0.5, label: 'half',      mobileLabel: 'half' },
  { id: 'quarter',   glyph: '', multiplier: 1.0, label: 'quarter',   mobileLabel: 'qtr' },
  { id: 'eighth',    glyph: '', multiplier: 2.0, label: 'eighth',    mobileLabel: '8th' },
  { id: 'sixteenth', glyph: '', multiplier: 4.0, label: 'sixteenth', mobileLabel: '16th' },
]

export const MODIFIED_NOTE_VALUES: NoteValueDef[] = [
  {
    id: 'dotted-quarter',
    glyph: '',
    multiplier: 2 / 3, // dotted quarter = 1.5 quarter-note durations → 2/3 the rate
    isDotted: true,
    isReferenceOnly: true,
    label: 'dot. quarter',
    mobileLabel: '·qtr',
  },
  {
    id: 'dotted-eighth',
    glyph: '',
    multiplier: 4 / 3,
    isDotted: true,
    isReferenceOnly: true,
    label: 'dot. eighth',
    mobileLabel: '·8th',
  },
  {
    id: 'quarter-triplet',
    glyph: '',
    multiplier: 1.5,
    isTriplet: true,
    label: 'qtr triplet',
    mobileLabel: 'q-trip',
  },
  {
    id: 'eighth-triplet',
    glyph: '',
    multiplier: 3.0,
    isTriplet: true,
    label: '8th triplet',
    mobileLabel: '8-trip',
  },
]

/** Number of clicks per accented "downbeat" for each subdivision.
 *  Used by the audio scheduler to attenuate non-downbeat ticks. For
 *  reference-only entries (dotted notes) and 'quarter' / 'half' the
 *  value is 1 — every click is a downbeat. */
export const SUBDIVISIONS_PER_DOWNBEAT: Record<SubdivisionId, number> = {
  half: 1,
  quarter: 1,
  eighth: 2,
  sixteenth: 4,
  // dotted-* are reference-only (no audio change); value is unused
  'dotted-quarter': 1,
  'dotted-eighth': 1,
  // quarter-triplet = 3 clicks per 2 beats → accent every 3rd
  'quarter-triplet': 3,
  // eighth-triplet  = 3 clicks per beat       → accent every 3rd
  'eighth-triplet': 3,
}

/** Audio multiplier applied to the base beat interval to derive the
 *  click rate for each subdivision. For the default 'quarter' this is
 *  1.0; for sixteenth it's 4.0 (four clicks per beat); etc. */
export const SUBDIVISION_RATE: Record<SubdivisionId, number> = {
  half: 0.5,
  quarter: 1.0,
  eighth: 2.0,
  sixteenth: 4.0,
  // reference-only — unused by the scheduler but kept symmetric
  'dotted-quarter': 2 / 3,
  'dotted-eighth': 4 / 3,
  'quarter-triplet': 1.5,
  'eighth-triplet': 3.0,
}

/** Copy for the info popover, rendered with `<em>` highlights on
 *  "70 BPM" and "andante" in brick red italic. */
export const PULSE_COPY = {
  heading: 'Why these ranges',
  body: 'Many tempos sit near a human pulse. A resting adult heart runs about <em>70 BPM</em> — close to <em>andante</em>, which lines up with a comfortable walking pace. Smaller bodies beat faster: a child of seven runs near 90, and a fetal heart can reach 180.',
}
