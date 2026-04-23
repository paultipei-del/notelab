import { Card } from '../types'

// Pentatonic, Blues, Chromatic, Whole Tone — Tier 2 / Pitch & Harmony
// Sequence: major penta → minor penta → blues (built on minor penta) → chromatic
// → whole tone (theory), then two concrete penta examples to anchor the pattern.
export const OTHER_SCALES_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Major pentatonic',              back: 'Five notes — 1 2 3 5 6 (no 4 or 7)' },
  { id: 2, type: 'text', front: 'Minor pentatonic',              back: 'Five notes — 1 ♭3 4 5 ♭7' },
  { id: 3, type: 'text', front: 'Blues scale',                   back: 'Minor pentatonic plus the ♭5 — 1 ♭3 4 ♭5 5 ♭7' },
  { id: 4, type: 'text', front: 'Chromatic scale',               back: 'All 12 half steps' },
  { id: 5, type: 'text', front: 'Whole tone scale',              back: 'Six notes, all whole steps — 1 2 3 ♯4 ♯5 ♯6' },
  { id: 6, type: 'text', front: 'How many whole tone scales?',   back: 'Two — starting on C or on C♯/D♭' },
  { id: 7, type: 'text', front: 'C major pentatonic',            back: 'C D E G A' },
  { id: 8, type: 'text', front: 'A minor pentatonic',            back: 'A C D E G' },
]
