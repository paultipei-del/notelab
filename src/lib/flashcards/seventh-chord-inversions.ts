import { Card } from '../types'

// Seventh Chord Inversions — Tier 2 / Pitch & Harmony
// Sequence: define the four positions (root + three inversions), walk C7
// through all four, then figured-bass shorthand.
export const SEVENTH_CHORD_INVERSIONS_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Root position (7th chord)',  back: 'Root in the bass — figured bass: 7' },
  { id: 2,  type: 'text', front: 'First inversion (7th chord)', back: '3rd in the bass — figured bass: 6/5' },
  { id: 3,  type: 'text', front: 'Second inversion (7th chord)', back: '5th in the bass — figured bass: 4/3' },
  { id: 4,  type: 'text', front: 'Third inversion (7th chord)', back: '7th in the bass — figured bass: 4/2 (or 2)' },
  { id: 5,  type: 'text', front: 'C7 — root position',         back: 'C – E – G – B♭' },
  { id: 6,  type: 'text', front: 'C7 — 1st inversion',         back: 'E – G – B♭ – C' },
  { id: 7,  type: 'text', front: 'C7 — 2nd inversion',         back: 'G – B♭ – C – E' },
  { id: 8,  type: 'text', front: 'C7 — 3rd inversion',         back: 'B♭ – C – E – G' },
  { id: 9,  type: 'text', front: 'Positions a 7th chord can take', back: 'Four — root plus three inversions' },
  { id: 10, type: 'text', front: 'Figured bass "7"',           back: 'Root-position 7th chord' },
  { id: 11, type: 'text', front: 'Figured bass "6/5"',         back: '1st inversion 7th chord' },
  { id: 12, type: 'text', front: 'Figured bass "4/2"',         back: '3rd inversion 7th chord' },
]
