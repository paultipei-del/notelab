import { Card } from '../types'

// Treble Clef Notes — Tier 1 / Notation & Terms
// Sequence per spec §5: Middle C → lines bottom-to-top (E-G-B-D-F) → spaces
// bottom-to-top (F-A-C-E) → space above top line → ledger notes above → ledger
// notes below. This walks the staff as a sight-reader would — anchored pitches
// first, then pattern-building from there.
// Type 'staff' + `note` + `clef` fields let the study UI render the note on a
// staff (see existing `notes-treble` deck for the reference pattern).
export const TREBLE_CLEF_NOTES_CARDS: Card[] = [
  { id: 1,  type: 'staff', front: 'C4', note: 'C4', clef: 'treble', back: 'Middle C — one ledger line below the staff' },
  { id: 2,  type: 'staff', front: 'E4', note: 'E4', clef: 'treble', back: 'Bottom line of the treble staff' },
  { id: 3,  type: 'staff', front: 'G4', note: 'G4', clef: 'treble', back: 'Second line of the treble staff' },
  { id: 4,  type: 'staff', front: 'B4', note: 'B4', clef: 'treble', back: 'Middle (third) line of the treble staff' },
  { id: 5,  type: 'staff', front: 'D5', note: 'D5', clef: 'treble', back: 'Fourth line of the treble staff' },
  { id: 6,  type: 'staff', front: 'F5', note: 'F5', clef: 'treble', back: 'Top (fifth) line of the treble staff' },
  { id: 7,  type: 'staff', front: 'F4', note: 'F4', clef: 'treble', back: 'First space of the treble staff' },
  { id: 8,  type: 'staff', front: 'A4', note: 'A4', clef: 'treble', back: 'Second space of the treble staff' },
  { id: 9,  type: 'staff', front: 'C5', note: 'C5', clef: 'treble', back: 'Third space of the treble staff' },
  { id: 10, type: 'staff', front: 'E5', note: 'E5', clef: 'treble', back: 'Top (fourth) space of the treble staff' },
  { id: 11, type: 'staff', front: 'G5', note: 'G5', clef: 'treble', back: 'Space just above the top line' },
  { id: 12, type: 'staff', front: 'A5', note: 'A5', clef: 'treble', back: 'First ledger line above the staff' },
  { id: 13, type: 'staff', front: 'C6', note: 'C6', clef: 'treble', back: 'Second ledger line above the staff' },
  { id: 14, type: 'staff', front: 'D4', note: 'D4', clef: 'treble', back: 'Space just below the bottom line' },
  { id: 15, type: 'staff', front: 'B3', note: 'B3', clef: 'treble', back: 'Space below Middle C' },
]
