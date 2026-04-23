import { Card } from '../types'

// Simple Meters — Tier 1 / Rhythm & Meter
// Sequence per spec §5: 2/4 → 3/4 → 4/4 → common time → cut time → 2/2 → 3/2 →
// 3/8. Quarter-note-based meters first (most common), then the symbol variants
// (C, ¢), then half-note-based (2/2, 3/2), then 3/8 as the eighth-note case.
export const SIMPLE_METERS_CARDS: Card[] = [
  { id: 1, type: 'text', front: '2/4',          back: 'Two quarter-note beats per measure (simple duple)' },
  { id: 2, type: 'text', front: '3/4',          back: 'Three quarter-note beats per measure (simple triple — waltz)' },
  { id: 3, type: 'text', front: '4/4',          back: 'Four quarter-note beats per measure (simple quadruple — the most common meter)' },
  { id: 4, type: 'text', front: 'Common time',  back: 'The C symbol — equals 4/4' },
  { id: 5, type: 'text', front: 'Cut time',     back: 'The ¢ symbol — equals 2/2 (alla breve)' },
  { id: 6, type: 'text', front: '2/2',          back: 'Two half-note beats per measure' },
  { id: 7, type: 'text', front: '3/2',          back: 'Three half-note beats per measure' },
  { id: 8, type: 'text', front: '3/8',          back: 'Three eighth-note beats per measure (simple triple)' },
]
