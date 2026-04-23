import { Card } from '../types'

// Triad Inversions — Tier 2 / Pitch & Harmony
// Sequence: define the three positions, then walk C major / G major / D minor
// through all three. Voicing shown as bass → top for clarity of "what's in the
// bass" (which is the identifying feature of each inversion).
export const TRIAD_INVERSIONS_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Root position',               back: 'Root is in the bass' },
  { id: 2,  type: 'text', front: 'First inversion',             back: '3rd is in the bass' },
  { id: 3,  type: 'text', front: 'Second inversion',            back: '5th is in the bass' },
  { id: 4,  type: 'text', front: 'C major — root position',     back: 'C – E – G' },
  { id: 5,  type: 'text', front: 'C major — 1st inversion',     back: 'E – G – C' },
  { id: 6,  type: 'text', front: 'C major — 2nd inversion',     back: 'G – C – E' },
  { id: 7,  type: 'text', front: 'G major — root position',     back: 'G – B – D' },
  { id: 8,  type: 'text', front: 'G major — 1st inversion',     back: 'B – D – G' },
  { id: 9,  type: 'text', front: 'G major — 2nd inversion',     back: 'D – G – B' },
  { id: 10, type: 'text', front: 'D minor — root position',     back: 'D – F – A' },
  { id: 11, type: 'text', front: 'D minor — 1st inversion',     back: 'F – A – D' },
  { id: 12, type: 'text', front: 'D minor — 2nd inversion',     back: 'A – D – F' },
]
