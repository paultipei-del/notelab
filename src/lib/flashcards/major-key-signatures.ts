import { Card } from '../types'

// Major Key Signatures — Tier 2 / Pitch & Harmony
// Sequence (per spec §5): no accidentals first, then sharps added one at a time
// (order of sharps: F C G D A E B), then flats added one at a time (order of
// flats: B E A D G C F). Reading this top-to-bottom walks the sharp side of the
// circle of fifths, then the flat side.
export const MAJOR_KEY_SIGNATURES_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'C major',  back: 'No sharps or flats' },
  { id: 2,  type: 'text', front: 'G major',  back: '1 sharp — F♯' },
  { id: 3,  type: 'text', front: 'D major',  back: '2 sharps — F♯, C♯' },
  { id: 4,  type: 'text', front: 'A major',  back: '3 sharps — F♯, C♯, G♯' },
  { id: 5,  type: 'text', front: 'E major',  back: '4 sharps — F♯, C♯, G♯, D♯' },
  { id: 6,  type: 'text', front: 'B major',  back: '5 sharps — F♯, C♯, G♯, D♯, A♯' },
  { id: 7,  type: 'text', front: 'F♯ major', back: '6 sharps — F♯, C♯, G♯, D♯, A♯, E♯' },
  { id: 8,  type: 'text', front: 'C♯ major', back: '7 sharps — F♯, C♯, G♯, D♯, A♯, E♯, B♯' },
  { id: 9,  type: 'text', front: 'F major',  back: '1 flat — B♭' },
  { id: 10, type: 'text', front: 'B♭ major', back: '2 flats — B♭, E♭' },
  { id: 11, type: 'text', front: 'E♭ major', back: '3 flats — B♭, E♭, A♭' },
  { id: 12, type: 'text', front: 'A♭ major', back: '4 flats — B♭, E♭, A♭, D♭' },
  { id: 13, type: 'text', front: 'D♭ major', back: '5 flats — B♭, E♭, A♭, D♭, G♭' },
  { id: 14, type: 'text', front: 'G♭ major', back: '6 flats — B♭, E♭, A♭, D♭, G♭, C♭' },
  { id: 15, type: 'text', front: 'C♭ major', back: '7 flats — B♭, E♭, A♭, D♭, G♭, C♭, F♭' },
]
