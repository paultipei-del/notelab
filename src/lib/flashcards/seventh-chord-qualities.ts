import { Card } from '../types'

// Seventh Chord Qualities — Tier 2 / Pitch & Harmony
// Sequence per spec: MM7 → Mm7 (dominant) → mm7 → ø7 (half-dim) → °7 → mM7.
// Each quality gets a theory card (formula) and a C-based concrete example.
export const SEVENTH_CHORD_QUALITIES_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Major 7th (MM7)',                back: 'Major triad + major 7th — 1-3-5-7' },
  { id: 2,  type: 'text', front: 'C major 7th (Cmaj7)',            back: 'C E G B' },
  { id: 3,  type: 'text', front: 'Dominant 7th (Mm7)',             back: 'Major triad + minor 7th — 1-3-5-♭7' },
  { id: 4,  type: 'text', front: 'C dominant 7th (C7)',            back: 'C E G B♭' },
  { id: 5,  type: 'text', front: 'Minor 7th (mm7)',                back: 'Minor triad + minor 7th — 1-♭3-5-♭7' },
  { id: 6,  type: 'text', front: 'C minor 7th (Cm7)',              back: 'C E♭ G B♭' },
  { id: 7,  type: 'text', front: 'Half-diminished 7th (ø7)',       back: 'Diminished triad + minor 7th — 1-♭3-♭5-♭7' },
  { id: 8,  type: 'text', front: 'C half-diminished 7th (Cø7)',    back: 'C E♭ G♭ B♭' },
  { id: 9,  type: 'text', front: 'Fully diminished 7th (°7)',      back: 'Diminished triad + diminished 7th — 1-♭3-♭5-♭♭7' },
  { id: 10, type: 'text', front: 'Minor-major 7th (mM7)',          back: 'Minor triad + major 7th — 1-♭3-5-7' },
]
