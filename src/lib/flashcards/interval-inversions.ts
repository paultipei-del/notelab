import { Card } from '../types'

// Interval Inversions — Tier 2 / Pitch & Harmony
// Sequence: the "sum is 9" rule first and the quality-flip rule, then concrete
// inversions grouped by size (3rds, 4ths/5ths, 2nds/7ths), then the tritone.
export const INTERVAL_INVERSIONS_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Rule: interval + inversion',         back: 'The numbers always add to 9' },
  { id: 2,  type: 'text', front: 'Rule: quality under inversion',       back: 'Major↔Minor, Augmented↔Diminished, Perfect stays Perfect' },
  { id: 3,  type: 'text', front: 'Major 3rd inverts to',                back: 'Minor 6th' },
  { id: 4,  type: 'text', front: 'Minor 3rd inverts to',                back: 'Major 6th' },
  { id: 5,  type: 'text', front: 'Perfect 5th inverts to',              back: 'Perfect 4th' },
  { id: 6,  type: 'text', front: 'Perfect 4th inverts to',              back: 'Perfect 5th' },
  { id: 7,  type: 'text', front: 'Major 2nd inverts to',                back: 'Minor 7th' },
  { id: 8,  type: 'text', front: 'Minor 7th inverts to',                back: 'Major 2nd' },
  { id: 9,  type: 'text', front: 'Tritone (aug 4th) inverts to',        back: 'Tritone (diminished 5th)' },
  { id: 10, type: 'text', front: 'Perfect unison inverts to',           back: 'Perfect octave' },
]
