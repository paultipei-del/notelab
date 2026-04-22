import { Card } from '../types'

// Tuplets — Tier 1 / Rhythm & Meter
// Sequence: the most common tuplet (triplet) first, then the rarer duplet (the
// compound-meter mirror), then the rest in ascending size, ending with the
// general definition.
export const TUPLETS_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Triplet',     back: 'Three notes played in the time of two' },
  { id: 2, type: 'text', front: 'Duplet',      back: 'Two notes played in the time of three (used in compound meter)' },
  { id: 3, type: 'text', front: 'Quadruplet',  back: 'Four notes played in the time of three' },
  { id: 4, type: 'text', front: 'Quintuplet',  back: 'Five notes played in the time of four' },
  { id: 5, type: 'text', front: 'Sextuplet',   back: 'Six notes played in the time of four (two groups of three)' },
  { id: 6, type: 'text', front: 'Tuplet',      back: 'Any irregular subdivision of a beat, marked with a number' },
]
