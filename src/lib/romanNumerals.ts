/**
 * Diatonic roman-numeral mapping for v1.
 *
 * - Major keys: I, ii, iii, IV, V, vi, vii° plus seventh variants.
 * - Minor keys: natural-minor diatonic (i, ii°, III, iv, v, VI, VII) with
 *   ONE exception — the major V chord on the 5th scale degree, which is
 *   the harmonic-minor leading-tone harmonization. So in A minor the
 *   E major triad maps to "V" (not null and not "v").
 *
 * Anything outside this table returns null. Secondary dominants, modal
 * mixture, chromatic mediants, and other non-diatonic relationships are
 * v2 work.
 */

import { letterToPC, parseKey } from './spellingTables'

interface DiatonicEntry {
  interval: number    // semitones from tonic
  symbol: string      // chord symbol (e.g. '', 'm', 'dim', 'maj7', 'm7', etc.)
  roman: string
}

// ── Major-key diatonic ────────────────────────────────────────────────────
const MAJOR_TABLE: DiatonicEntry[] = [
  // Triads
  { interval: 0,  symbol: '',     roman: 'I'    },
  { interval: 2,  symbol: 'm',    roman: 'ii'   },
  { interval: 4,  symbol: 'm',    roman: 'iii'  },
  { interval: 5,  symbol: '',     roman: 'IV'   },
  { interval: 7,  symbol: '',     roman: 'V'    },
  { interval: 9,  symbol: 'm',    roman: 'vi'   },
  { interval: 11, symbol: 'dim',  roman: 'vii°' },
  // Sevenths
  { interval: 0,  symbol: 'maj7', roman: 'IM7'   },
  { interval: 2,  symbol: 'm7',   roman: 'ii7'   },
  { interval: 4,  symbol: 'm7',   roman: 'iii7'  },
  { interval: 5,  symbol: 'maj7', roman: 'IVM7'  },
  { interval: 7,  symbol: '7',    roman: 'V7'    },
  { interval: 9,  symbol: 'm7',   roman: 'vi7'   },
  { interval: 11, symbol: 'm7b5', roman: 'viiø7' },
]

// ── Minor-key diatonic (natural + harmonic V exception) ───────────────────
const MINOR_TABLE: DiatonicEntry[] = [
  // Triads — natural minor
  { interval: 0,  symbol: 'm',    roman: 'i'    },
  { interval: 2,  symbol: 'dim',  roman: 'ii°'  },
  { interval: 3,  symbol: '',     roman: 'III'  },
  { interval: 5,  symbol: 'm',    roman: 'iv'   },
  { interval: 7,  symbol: 'm',    roman: 'v'    },
  { interval: 8,  symbol: '',     roman: 'VI'   },
  { interval: 10, symbol: '',     roman: 'VII'  },
  // Harmonic-minor V exception (major triad on scale degree 5)
  { interval: 7,  symbol: '',     roman: 'V'    },
  // Sevenths
  { interval: 0,  symbol: 'm7',   roman: 'i7'    },
  { interval: 2,  symbol: 'm7b5', roman: 'iiø7'  },
  { interval: 3,  symbol: 'maj7', roman: 'IIIM7' },
  { interval: 5,  symbol: 'm7',   roman: 'iv7'   },
  { interval: 7,  symbol: 'm7',   roman: 'v7'    },
  { interval: 8,  symbol: 'maj7', roman: 'VIM7'  },
  { interval: 10, symbol: '7',    roman: 'VII7'  },
  // Harmonic-minor V7 exception
  { interval: 7,  symbol: '7',    roman: 'V7'    },
]

export function romanNumeralFor(
  rootPC: number,
  chordSymbol: string,
  keyString: string,
): string | null {
  const { tonic, mode } = parseKey(keyString)
  const tonicPC = letterToPC(tonic)
  const interval = ((rootPC - tonicPC) % 12 + 12) % 12
  const table = mode === 'major' ? MAJOR_TABLE : MINOR_TABLE
  const match = table.find(e => e.interval === interval && e.symbol === chordSymbol)
  return match ? match.roman : null
}
