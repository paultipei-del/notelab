import { Card } from '../types'

// Enharmonic Intervals — Tier 2 / Pitch & Harmony
// Sequence: the tritone pair first (most common), then common-→ rare pairs, and
// a final card explaining why enharmonic spelling matters.
export const ENHARMONIC_INTERVALS_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Augmented 4th ↔',          back: 'Diminished 5th — both are the tritone' },
  { id: 2, type: 'text', front: 'Major 3rd ↔',              back: 'Diminished 4th' },
  { id: 3, type: 'text', front: 'Minor 3rd ↔',              back: 'Augmented 2nd' },
  { id: 4, type: 'text', front: 'Major 6th ↔',              back: 'Diminished 7th' },
  { id: 5, type: 'text', front: 'Minor 6th ↔',              back: 'Augmented 5th' },
  { id: 6, type: 'text', front: 'Perfect 4th ↔',            back: 'Augmented 3rd' },
  { id: 7, type: 'text', front: 'Minor 2nd ↔',              back: 'Augmented unison' },
  { id: 8, type: 'text', front: 'Why does enharmonic spelling matter?', back: 'Same sound, different harmonic function and voice leading' },
]
