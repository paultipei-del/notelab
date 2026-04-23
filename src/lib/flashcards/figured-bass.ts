import { Card } from '../types'

// Figured Bass Symbols — Tier 3 / Pitch & Harmony
// Sequence: what figured bass is, then triad inversions (5/3 → 6 → 6/4), then
// seventh-chord inversions (7 → 6/5 → 4/3 → 4/2), then chromatic alterations
// and the common suspension notation.
export const FIGURED_BASS_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Figured bass',               back: 'Baroque shorthand — numbers below a bass line tell the player what intervals to stack above it' },
  { id: 2,  type: 'text', front: '5/3 (or no figures)',        back: 'Root-position triad — usually left unmarked' },
  { id: 3,  type: 'text', front: '6',                          back: 'First-inversion triad — a 6th and 3rd above the bass' },
  { id: 4,  type: 'text', front: '6/4',                        back: 'Second-inversion triad — a 6th and 4th above the bass' },
  { id: 5,  type: 'text', front: '7',                          back: 'Root-position seventh chord' },
  { id: 6,  type: 'text', front: '6/5',                        back: 'First-inversion seventh chord' },
  { id: 7,  type: 'text', front: '4/3',                        back: 'Second-inversion seventh chord' },
  { id: 8,  type: 'text', front: '4/2 (or 2)',                 back: 'Third-inversion seventh chord' },
  { id: 9,  type: 'text', front: 'Accidental alone (e.g., ♯)', back: 'Modifies the 3rd above the bass by default' },
  { id: 10, type: 'text', front: 'Slash through a figure',     back: 'Raises that interval by a half step (equivalent to a sharp applied to that figure)' },
  { id: 11, type: 'text', front: 'Horizontal dash',            back: 'Sustain the previous harmony — do not restrike the chord' },
  { id: 12, type: 'text', front: '4–3 suspension',             back: 'A common figured-bass suspension — the 4th resolves down by step to the 3rd over the same bass' },
]
