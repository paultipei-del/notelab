import { Card } from '../types'

// Modes — Tier 2 / Pitch & Harmony
// Sequence: modes in their traditional order (starting on each degree of the
// major scale), Ionian → Locrian. Each card names the mode's defining quality
// in one line.
export const MODES_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Ionian',     back: 'Major scale — W-W-H-W-W-W-H (1st mode)' },
  { id: 2, type: 'text', front: 'Dorian',     back: 'Minor with a raised 6th — W-H-W-W-W-H-W (2nd mode)' },
  { id: 3, type: 'text', front: 'Phrygian',   back: 'Minor with a lowered 2nd — H-W-W-W-H-W-W (3rd mode)' },
  { id: 4, type: 'text', front: 'Lydian',     back: 'Major with a raised 4th — W-W-W-H-W-W-H (4th mode)' },
  { id: 5, type: 'text', front: 'Mixolydian', back: 'Major with a lowered 7th — W-W-H-W-W-H-W (5th mode)' },
  { id: 6, type: 'text', front: 'Aeolian',    back: 'Natural minor — W-H-W-W-H-W-W (6th mode)' },
  { id: 7, type: 'text', front: 'Locrian',    back: 'Diminished — H-W-W-H-W-W-W (7th mode)' },
]
