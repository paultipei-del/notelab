import { Card } from '../types'

// Middle C Across Clefs — Tier 1 / Notation & Terms
// Sequence: the two clefs the student knows first (treble, bass), then the two
// C-clefs that hinge on Middle C by definition (alto = middle-line C, tenor =
// fourth-line C). Text cards — staff rendering for alto/tenor isn't in the
// current UI.
export const MIDDLE_C_ACROSS_CLEFS_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Middle C in treble clef', back: 'One ledger line below the staff' },
  { id: 2, type: 'text', front: 'Middle C in bass clef',   back: 'One ledger line above the staff' },
  { id: 3, type: 'text', front: 'Middle C in alto clef',   back: 'Middle (third) line of the staff — the alto clef is centered on it' },
  { id: 4, type: 'text', front: 'Middle C in tenor clef',  back: 'Fourth line of the staff' },
]
