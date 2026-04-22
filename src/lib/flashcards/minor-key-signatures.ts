import { Card } from '../types'

// Minor Key Signatures — Tier 2 / Pitch & Harmony
// Sequence parallels I1 (Major): no accidentals, then sharps one-at-a-time, then
// flats one-at-a-time. a → e → b → f♯ → c♯ → g♯ → d♯ → a♯ → d → g → c → f → b♭ → e♭ → a♭.
// Lowercase key names are conventional shorthand for minor.
export const MINOR_KEY_SIGNATURES_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'A minor',   back: 'No sharps or flats' },
  { id: 2,  type: 'text', front: 'E minor',   back: '1 sharp — F♯' },
  { id: 3,  type: 'text', front: 'B minor',   back: '2 sharps — F♯, C♯' },
  { id: 4,  type: 'text', front: 'F♯ minor',  back: '3 sharps — F♯, C♯, G♯' },
  { id: 5,  type: 'text', front: 'C♯ minor',  back: '4 sharps — F♯, C♯, G♯, D♯' },
  { id: 6,  type: 'text', front: 'G♯ minor',  back: '5 sharps — F♯, C♯, G♯, D♯, A♯' },
  { id: 7,  type: 'text', front: 'D♯ minor',  back: '6 sharps — F♯, C♯, G♯, D♯, A♯, E♯' },
  { id: 8,  type: 'text', front: 'A♯ minor',  back: '7 sharps — F♯, C♯, G♯, D♯, A♯, E♯, B♯' },
  { id: 9,  type: 'text', front: 'D minor',   back: '1 flat — B♭' },
  { id: 10, type: 'text', front: 'G minor',   back: '2 flats — B♭, E♭' },
  { id: 11, type: 'text', front: 'C minor',   back: '3 flats — B♭, E♭, A♭' },
  { id: 12, type: 'text', front: 'F minor',   back: '4 flats — B♭, E♭, A♭, D♭' },
  { id: 13, type: 'text', front: 'B♭ minor',  back: '5 flats — B♭, E♭, A♭, D♭, G♭' },
  { id: 14, type: 'text', front: 'E♭ minor',  back: '6 flats — B♭, E♭, A♭, D♭, G♭, C♭' },
  { id: 15, type: 'text', front: 'A♭ minor',  back: '7 flats — B♭, E♭, A♭, D♭, G♭, C♭, F♭' },
]
