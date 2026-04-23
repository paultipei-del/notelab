import { Card } from '../types'

// Circle of Fifths Relationships — Tier 2 / Pitch & Harmony
// Sequence: relative-key rules first (conceptual), then parallel-key, then motion
// around the circle, then enharmonic pairs, then reverse lookups by accidental count.
export const CIRCLE_OF_FIFTHS_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Relative minor of C major',       back: 'A minor — same key signature, starts on the 6th degree' },
  { id: 2,  type: 'text', front: 'Relative major of E minor',       back: 'G major — same key signature, starts on the ♭3rd degree' },
  { id: 3,  type: 'text', front: 'Parallel minor of D major',       back: 'D minor — same tonic, different key signature' },
  { id: 4,  type: 'text', front: 'Parallel major of F♯ minor',      back: 'F♯ major — same tonic, different key signature' },
  { id: 5,  type: 'text', front: 'One step clockwise from C major', back: 'G major — add one sharp (F♯)' },
  { id: 6,  type: 'text', front: 'One step counterclockwise from C major', back: 'F major — add one flat (B♭)' },
  { id: 7,  type: 'text', front: 'Enharmonic of F♯ major',          back: 'G♭ major (6 sharps ↔ 6 flats)' },
  { id: 8,  type: 'text', front: 'Enharmonic of C♯ major',          back: 'D♭ major (7 sharps ↔ 5 flats)' },
  { id: 9,  type: 'text', front: 'Enharmonic of B major',           back: 'C♭ major (5 sharps ↔ 7 flats)' },
  { id: 10, type: 'text', front: 'Key with 3 sharps',               back: 'A major, or its relative F♯ minor' },
  { id: 11, type: 'text', front: 'Key with 2 flats',                back: 'B♭ major, or its relative G minor' },
  { id: 12, type: 'text', front: 'Keys on the circle of fifths',    back: '12 positions, 15 key-name spellings (3 enharmonic pairs)' },
]
