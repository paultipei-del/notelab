import { Card } from '../types'

// Compound Meters — Tier 1 / Rhythm & Meter
// Sequence per spec §5: 6/8 → 9/8 → 12/8 → 6/4 → 6/16 → 9/16 → 12/16 → simple
// vs compound identification. Beat grows dotted (quarter → half → eighth) as we
// descend, ending with the distinguishing rule.
export const COMPOUND_METERS_CARDS: Card[] = [
  { id: 1, type: 'text', front: '6/8',  back: 'Two dotted-quarter beats per measure (compound duple)' },
  { id: 2, type: 'text', front: '9/8',  back: 'Three dotted-quarter beats per measure (compound triple)' },
  { id: 3, type: 'text', front: '12/8', back: 'Four dotted-quarter beats per measure (compound quadruple)' },
  { id: 4, type: 'text', front: '6/4',  back: 'Two dotted-half beats per measure' },
  { id: 5, type: 'text', front: '6/16', back: 'Two dotted-eighth beats per measure' },
  { id: 6, type: 'text', front: '9/16', back: 'Three dotted-eighth beats per measure' },
  { id: 7, type: 'text', front: '12/16', back: 'Four dotted-eighth beats per measure' },
  { id: 8, type: 'text', front: 'Simple vs. compound meter', back: 'In simple meter the beat divides into 2; in compound it divides into 3' },
]
