import { Card } from '../types'

// Minor Scales — Tier 2 / Pitch & Harmony
// Sequence: define each form (natural → harmonic → melodic), then walk through
// concrete scales (A → D → E), then cover the distinctive augmented 2nd and the
// role of the leading tone.
export const MINOR_SCALES_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Natural minor step pattern',             back: 'W–H–W–W–H–W–W' },
  { id: 2,  type: 'text', front: 'Harmonic minor — how it differs from natural', back: 'Raised 7th' },
  { id: 3,  type: 'text', front: 'Melodic minor ascending — differences',  back: 'Raised 6th and 7th' },
  { id: 4,  type: 'text', front: 'Melodic minor descending',               back: 'Same as natural minor' },
  { id: 5,  type: 'text', front: 'A natural minor',                        back: 'A B C D E F G A' },
  { id: 6,  type: 'text', front: 'A harmonic minor',                       back: 'A B C D E F G♯ A' },
  { id: 7,  type: 'text', front: 'A melodic minor (ascending)',            back: 'A B C D E F♯ G♯ A' },
  { id: 8,  type: 'text', front: 'D natural minor',                        back: 'D E F G A B♭ C D' },
  { id: 9,  type: 'text', front: 'D harmonic minor',                       back: 'D E F G A B♭ C♯ D' },
  { id: 10, type: 'text', front: 'D melodic minor (ascending)',            back: 'D E F G A B C♯ D' },
  { id: 11, type: 'text', front: 'E natural minor',                        back: 'E F♯ G A B C D E' },
  { id: 12, type: 'text', front: 'E harmonic minor',                       back: 'E F♯ G A B C D♯ E' },
  { id: 13, type: 'text', front: 'Interval between 6 and 7 in harmonic minor', back: 'Augmented 2nd' },
  { id: 14, type: 'text', front: 'Which minor form has a leading tone?',   back: 'Harmonic and melodic (ascending) — both raise the 7th' },
  { id: 15, type: 'text', front: 'Which form drives classical cadences?',  back: 'Harmonic minor — the raised 7th creates V–i' },
]
