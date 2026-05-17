/**
 * Chord dictionary for v1 chord detection.
 *
 * Hand-curated set covering ~95% of what users will play: triads, common
 * sevenths, sixths, basic 9ths, and a few altered dominants. The long
 * tail (13ths, polychords, hybrids) is punted to v2.
 *
 * `intervals` is the canonical interval set from the root, mod 12.
 * `required` is the subset that MUST be present for the chord to match
 * (the 5th can often be omitted; the 3rd and 7th usually cannot).
 * `common` flags chords that should be preferred when scoring ties.
 *
 * Note: `symbol` for the plain major triad is the empty string so that
 * `${rootLetter}${symbol}` renders as just "C" (not "Cmaj").
 */

export interface ChordDefinition {
  symbol: string
  verbose: string
  intervals: number[]
  required: number[]
  common: boolean
}

export const CHORD_DICTIONARY: ChordDefinition[] = [
  // ── Triads ──────────────────────────────────────────────────────────────
  { symbol: '',     verbose: 'major',              intervals: [0, 4, 7],     required: [0, 4, 7],     common: true  },
  { symbol: 'm',    verbose: 'minor',              intervals: [0, 3, 7],     required: [0, 3, 7],     common: true  },
  { symbol: 'dim',  verbose: 'diminished',         intervals: [0, 3, 6],     required: [0, 3, 6],     common: true  },
  { symbol: 'aug',  verbose: 'augmented',          intervals: [0, 4, 8],     required: [0, 4, 8],     common: true  },
  { symbol: 'sus2', verbose: 'suspended second',   intervals: [0, 2, 7],     required: [0, 2, 7],     common: true  },
  { symbol: 'sus4', verbose: 'suspended fourth',   intervals: [0, 5, 7],     required: [0, 5, 7],     common: true  },

  // ── Sixths ──────────────────────────────────────────────────────────────
  { symbol: '6',    verbose: 'major sixth',        intervals: [0, 4, 7, 9],  required: [0, 4, 9],     common: true  },
  { symbol: 'm6',   verbose: 'minor sixth',        intervals: [0, 3, 7, 9],  required: [0, 3, 9],     common: true  },

  // ── Sevenths ────────────────────────────────────────────────────────────
  { symbol: 'maj7',   verbose: 'major seventh',          intervals: [0, 4, 7, 11], required: [0, 4, 11],     common: true  },
  { symbol: '7',      verbose: 'dominant seventh',       intervals: [0, 4, 7, 10], required: [0, 4, 10],     common: true  },
  { symbol: 'm7',     verbose: 'minor seventh',          intervals: [0, 3, 7, 10], required: [0, 3, 10],     common: true  },
  { symbol: 'mMaj7',  verbose: 'minor-major seventh',    intervals: [0, 3, 7, 11], required: [0, 3, 11],     common: false },
  { symbol: 'dim7',   verbose: 'diminished seventh',     intervals: [0, 3, 6, 9],  required: [0, 3, 6, 9],   common: true  },
  { symbol: 'm7b5',   verbose: 'half-diminished seventh',intervals: [0, 3, 6, 10], required: [0, 3, 6, 10],  common: true  },
  { symbol: '7sus4',  verbose: 'dominant seventh sus4',  intervals: [0, 5, 7, 10], required: [0, 5, 10],     common: false },

  // ── Ninths (add9 has no 7th; the others build on 7ths) ──────────────────
  { symbol: 'maj9',  verbose: 'major ninth',          intervals: [0, 4, 7, 11, 2], required: [0, 4, 11, 2],  common: false },
  { symbol: '9',     verbose: 'dominant ninth',       intervals: [0, 4, 7, 10, 2], required: [0, 4, 10, 2],  common: true  },
  { symbol: 'm9',    verbose: 'minor ninth',          intervals: [0, 3, 7, 10, 2], required: [0, 3, 10, 2],  common: false },
  { symbol: 'add9',  verbose: 'major add nine',       intervals: [0, 4, 7, 2],     required: [0, 4, 7, 2],   common: false },
  { symbol: 'madd9', verbose: 'minor add nine',       intervals: [0, 3, 7, 2],     required: [0, 3, 7, 2],   common: false },

  // ── Altered dominants ──────────────────────────────────────────────────
  { symbol: '7b9',   verbose: 'dominant seventh flat nine',  intervals: [0, 4, 7, 10, 1], required: [0, 4, 10, 1], common: false },
  { symbol: '7#9',   verbose: 'dominant seventh sharp nine', intervals: [0, 4, 7, 10, 3], required: [0, 4, 10, 3], common: false },
  { symbol: '7#11',  verbose: 'dominant seventh sharp eleven',intervals: [0, 4, 7, 10, 6], required: [0, 4, 10, 6], common: false },
  { symbol: '7b13',  verbose: 'dominant seventh flat thirteen',intervals: [0, 4, 7, 10, 8], required: [0, 4, 10, 8], common: false },
]
