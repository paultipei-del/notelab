import { Card } from '../types'

// Bass Clef Notes — Tier 1 / Notation & Terms
// Sequence per spec §5: Middle C → lines top-to-bottom (A-F-D-B-G) → spaces
// top-to-bottom (G-E-C-A) → space below bottom line → ledger notes below →
// space above top line. Mirrors the treble deck's "anchor first, then radiate"
// logic but working downward from the clef's signature F3 line.
export const BASS_CLEF_NOTES_CARDS: Card[] = [
  { id: 1,  type: 'staff', front: 'C4', note: 'C4', clef: 'bass', back: 'Middle C — one ledger line above the staff' },
  { id: 2,  type: 'staff', front: 'A3', note: 'A3', clef: 'bass', back: 'Top (fifth) line of the bass staff' },
  { id: 3,  type: 'staff', front: 'F3', note: 'F3', clef: 'bass', back: 'Fourth line of the bass staff — the F line the clef wraps around' },
  { id: 4,  type: 'staff', front: 'D3', note: 'D3', clef: 'bass', back: 'Middle (third) line of the bass staff' },
  { id: 5,  type: 'staff', front: 'B2', note: 'B2', clef: 'bass', back: 'Second line of the bass staff' },
  { id: 6,  type: 'staff', front: 'G2', note: 'G2', clef: 'bass', back: 'Bottom line of the bass staff' },
  { id: 7,  type: 'staff', front: 'G3', note: 'G3', clef: 'bass', back: 'Top (fourth) space of the bass staff' },
  { id: 8,  type: 'staff', front: 'E3', note: 'E3', clef: 'bass', back: 'Third space of the bass staff' },
  { id: 9,  type: 'staff', front: 'C3', note: 'C3', clef: 'bass', back: 'Second space of the bass staff' },
  { id: 10, type: 'staff', front: 'A2', note: 'A2', clef: 'bass', back: 'First (bottom) space of the bass staff' },
  { id: 11, type: 'staff', front: 'F2', note: 'F2', clef: 'bass', back: 'Space just below the bottom line' },
  { id: 12, type: 'staff', front: 'E2', note: 'E2', clef: 'bass', back: 'First ledger line below the staff' },
  { id: 13, type: 'staff', front: 'D2', note: 'D2', clef: 'bass', back: 'Space below the first ledger line below' },
  { id: 14, type: 'staff', front: 'C2', note: 'C2', clef: 'bass', back: 'Second ledger line below the staff' },
  { id: 15, type: 'staff', front: 'B3', note: 'B3', clef: 'bass', back: 'Space just above the top line' },
]
