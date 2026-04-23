import { Card } from '../types'

// Solfège & Scale Degrees — Tier 2 / Pitch & Harmony
// Pairs movable-do syllables with scale-degree names and introduces the two
// most common chromatic alterations.
export const SOLFEGE_AND_SCALE_DEGREES_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'The syllable for the 1st scale degree (tonic)',      back: 'do' },
  { id: 2,  type: 'text', front: 'The syllable for the 2nd scale degree (supertonic)', back: 're' },
  { id: 3,  type: 'text', front: 'The syllable for the 3rd scale degree (mediant)',    back: 'mi' },
  { id: 4,  type: 'text', front: 'The syllable for the 4th scale degree (subdominant)', back: 'fa' },
  { id: 5,  type: 'text', front: 'The syllable for the 5th scale degree (dominant)',   back: 'sol' },
  { id: 6,  type: 'text', front: 'The syllable for the 6th scale degree (submediant)', back: 'la' },
  { id: 7,  type: 'text', front: 'The syllable for the 7th scale degree (leading tone)', back: 'ti' },
  { id: 8,  type: 'text', front: 'The scale-degree name for do',  back: 'tonic (1st degree)' },
  { id: 9,  type: 'text', front: 'The scale-degree name for sol', back: 'dominant (5th degree)' },
  { id: 10, type: 'text', front: 'The scale-degree name for ti',  back: 'leading tone (7th degree)' },
  { id: 11, type: 'text', front: 'The raised version of re (chromatic syllable)', back: 'ri' },
  { id: 12, type: 'text', front: 'The lowered version of mi (chromatic syllable)', back: 'me' },
]
