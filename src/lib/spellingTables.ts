/**
 * Per-key pitch-class spelling tables.
 *
 * 12 major + 12 minor keys, each a 12-entry array indexed by pitch class
 * (0 = C). Spellings follow common-practice conventions:
 *
 *   - Diatonic notes always take their key-signature spelling.
 *   - Chromatic notes in sharp keys lean sharp; in flat keys lean flat.
 *   - Minor keys additionally spell the harmonic-minor leading tone
 *     (raised 7) with the appropriate accidental (e.g. G# in A minor,
 *     C# in D minor).
 *
 * Used by chordDetection.ts to render note letter names consistent with
 * the staff's key signature, so the user never sees "A#" when the staff
 * is in F major.
 */

export type SpellingTable = readonly [
  string, string, string, string, string, string,
  string, string, string, string, string, string,
]

// ── MAJOR KEYS ────────────────────────────────────────────────────────────
const MAJOR: Record<string, SpellingTable> = {
  // 0♯/♭
  'C':  ['C',  'Db', 'D',  'Eb', 'E',  'F',  'F#', 'G',  'Ab', 'A',  'Bb', 'B'],
  // 1♯ — F#
  'G':  ['C',  'C#', 'D',  'Eb', 'E',  'F',  'F#', 'G',  'Ab', 'A',  'Bb', 'B'],
  // 2♯ — F#, C#
  'D':  ['C',  'C#', 'D',  'D#', 'E',  'F',  'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // 3♯ — F#, C#, G#
  'A':  ['C',  'C#', 'D',  'D#', 'E',  'F',  'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // 4♯ — F#, C#, G#, D#
  'E':  ['C',  'C#', 'D',  'D#', 'E',  'F',  'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // 5♯ — F#, C#, G#, D#, A#
  'B':  ['C',  'C#', 'D',  'D#', 'E',  'F',  'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // 6♯ — F#, C#, G#, D#, A#, E#
  'F#': ['C',  'C#', 'D',  'D#', 'E',  'E#', 'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // 7♯ — F#, C#, G#, D#, A#, E#, B#
  'C#': ['B#', 'C#', 'D',  'D#', 'E',  'E#', 'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // 1♭ — Bb
  'F':  ['C',  'Db', 'D',  'Eb', 'E',  'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'B'],
  // 2♭ — Bb, Eb
  'Bb': ['C',  'Db', 'D',  'Eb', 'E',  'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'B'],
  // 3♭ — Bb, Eb, Ab
  'Eb': ['C',  'Db', 'D',  'Eb', 'E',  'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'B'],
  // 4♭ — Bb, Eb, Ab, Db
  'Ab': ['C',  'Db', 'D',  'Eb', 'E',  'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'B'],
  // 5♭ — Bb, Eb, Ab, Db, Gb
  'Db': ['C',  'Db', 'D',  'Eb', 'E',  'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'B'],
  // 6♭ — Bb, Eb, Ab, Db, Gb, Cb
  'Gb': ['C',  'Db', 'D',  'Eb', 'E',  'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'Cb'],
  // 7♭ — Bb, Eb, Ab, Db, Gb, Cb, Fb
  'Cb': ['C',  'Db', 'D',  'Eb', 'Fb', 'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'Cb'],
}

// ── MINOR KEYS (relative-minor key signatures + harmonic-minor leading tone) ─
const MINOR: Record<string, SpellingTable> = {
  // A minor — 0♯/♭, leading tone G#
  'A':  ['C',  'Db', 'D',  'Eb', 'E',  'F',  'F#', 'G',  'G#', 'A',  'Bb', 'B'],
  // E minor — 1♯ (F#), leading tone D#
  'E':  ['C',  'C#', 'D',  'D#', 'E',  'F',  'F#', 'G',  'G#', 'A',  'Bb', 'B'],
  // B minor — 2♯, leading tone A#
  'B':  ['C',  'C#', 'D',  'D#', 'E',  'F',  'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // F# minor — 3♯, leading tone E#
  'F#': ['C',  'C#', 'D',  'D#', 'E',  'E#', 'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // C# minor — 4♯, leading tone B#
  'C#': ['B#', 'C#', 'D',  'D#', 'E',  'F',  'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // G# minor — 5♯, leading tone F##≈G (use G natural pragmatically)
  'G#': ['C',  'C#', 'D',  'D#', 'E',  'F',  'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // D# minor — 6♯, leading tone C##≈D (use D natural pragmatically)
  'D#': ['C',  'C#', 'D',  'D#', 'E',  'E#', 'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // A# minor — 7♯
  'A#': ['B#', 'C#', 'D',  'D#', 'E',  'E#', 'F#', 'G',  'G#', 'A',  'A#', 'B'],
  // D minor — 1♭, leading tone C#
  'D':  ['C',  'C#', 'D',  'Eb', 'E',  'F',  'F#', 'G',  'Ab', 'A',  'Bb', 'B'],
  // G minor — 2♭, leading tone F#
  'G':  ['C',  'Db', 'D',  'Eb', 'E',  'F',  'F#', 'G',  'Ab', 'A',  'Bb', 'B'],
  // C minor — 3♭, leading tone B
  'C':  ['C',  'Db', 'D',  'Eb', 'E',  'F',  'F#', 'G',  'Ab', 'A',  'Bb', 'B'],
  // F minor — 4♭, leading tone E
  'F':  ['C',  'Db', 'D',  'Eb', 'E',  'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'B'],
  // Bb minor — 5♭, leading tone A
  'Bb': ['C',  'Db', 'D',  'Eb', 'E',  'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'B'],
  // Eb minor — 6♭, leading tone D
  'Eb': ['C',  'Db', 'D',  'Eb', 'E',  'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'Cb'],
  // Ab minor — 7♭, leading tone G
  'Ab': ['C',  'Db', 'D',  'Eb', 'Fb', 'F',  'Gb', 'G',  'Ab', 'A',  'Bb', 'Cb'],
}

/** Parse "C major" / "F# minor" / "Bb major" / "Eb minor" / etc. */
export function parseKey(input: string): { tonic: string; mode: 'major' | 'minor' } {
  const trimmed = input.trim()
  // Accept ♯/♭ unicode or # / b ASCII interchangeably.
  const normalized = trimmed.replace('♯', '#').replace('♭', 'b')
  const m = /^([A-Ga-g][#b]?)\s+(major|minor|maj|min|M|m)$/i.exec(normalized)
  if (!m) {
    // Fall back to C major to keep callers safe; chord-detection itself
    // doesn't crash on a bad key, just produces no roman numeral.
    return { tonic: 'C', mode: 'major' }
  }
  const tonic = m[1][0].toUpperCase() + m[1].slice(1)
  const modeRaw = m[2].toLowerCase()
  const mode = modeRaw.startsWith('m') && modeRaw !== 'maj' && modeRaw !== 'major'
    ? 'minor'
    : 'major'
  return { tonic, mode }
}

/** Look up the 12-entry spelling table for a key string. */
export function spellingTableFor(keyString: string): SpellingTable {
  const { tonic, mode } = parseKey(keyString)
  const table = mode === 'major' ? MAJOR[tonic] : MINOR[tonic]
  return table ?? MAJOR['C']
}

/** Spell a pitch class (0–11) for a given key. */
export function spellPC(pc: number, keyString: string): string {
  const idx = ((pc % 12) + 12) % 12
  return spellingTableFor(keyString)[idx]
}

/** Convert a chord-root letter (e.g. "C#", "Bb") to a pitch class. */
const LETTER_PC: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}
export function letterToPC(letter: string): number {
  const base = LETTER_PC[letter[0].toUpperCase()]
  if (base === undefined) return 0
  let pc = base
  for (let i = 1; i < letter.length; i++) {
    const c = letter[i]
    if (c === '#') pc += 1
    else if (c === 'b') pc -= 1
  }
  return ((pc % 12) + 12) % 12
}
