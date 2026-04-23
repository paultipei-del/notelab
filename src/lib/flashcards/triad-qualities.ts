import { Card } from '../types'

// Triad Qualities — Tier 2 / Pitch & Harmony
// Sequence: four qualities on C first (Major → Minor → Diminished → Augmented),
// then same qualities transposed. Each back gives the notes and the 1/3/5
// formula where concise.
export const TRIAD_QUALITIES_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'C major triad',       back: 'C E G — formula 1-3-5' },
  { id: 2,  type: 'text', front: 'C minor triad',       back: 'C E♭ G — formula 1-♭3-5' },
  { id: 3,  type: 'text', front: 'C diminished triad',  back: 'C E♭ G♭ — formula 1-♭3-♭5' },
  { id: 4,  type: 'text', front: 'C augmented triad',   back: 'C E G♯ — formula 1-3-♯5' },
  { id: 5,  type: 'text', front: 'G major triad',       back: 'G B D' },
  { id: 6,  type: 'text', front: 'G minor triad',       back: 'G B♭ D' },
  { id: 7,  type: 'text', front: 'D major triad',       back: 'D F♯ A' },
  { id: 8,  type: 'text', front: 'D minor triad',       back: 'D F A' },
  { id: 9,  type: 'text', front: 'F major triad',       back: 'F A C' },
  { id: 10, type: 'text', front: 'F♯ diminished triad', back: 'F♯ A C' },
  { id: 11, type: 'text', front: 'B diminished triad',  back: 'B D F' },
  { id: 12, type: 'text', front: 'E♭ augmented triad',  back: 'E♭ G B' },
]
