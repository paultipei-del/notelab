import { Card } from '../types'

// Hand Division & Piano-Specific Symbols — Tier 3 / Music symbols
// Sequence: hand labels in common languages (Italian and French, since the
// Italian terminology deck already covered tempo/character), the arpeggio line,
// octave and register directions, then two notational specifics used in piano
// music that don't appear in other instruments.
export const PIANO_SPECIFIC_SYMBOLS_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'L.H.',            back: 'Left hand' },
  { id: 2,  type: 'text', front: 'R.H.',            back: 'Right hand' },
  { id: 3,  type: 'text', front: 'M.S. (mano sinistra)', back: 'Italian for left hand' },
  { id: 4,  type: 'text', front: 'M.D. (mano destra)',   back: 'Italian for right hand' },
  { id: 5,  type: 'text', front: 'm.g. (main gauche)',   back: 'French for left hand' },
  { id: 6,  type: 'text', front: 'm.d. (main droite)',   back: 'French for right hand' },
  { id: 7,  type: 'text', front: 'Arpeggio line (wavy vertical) before a chord', back: 'Roll the chord from the bottom note upward (reversed if an arrow points down)' },
  { id: 8,  type: 'text', front: '8va (ottava)',    back: 'Play one octave higher than written — a dashed line shows how far it extends' },
  { id: 9,  type: 'text', front: '8vb / 8va bassa', back: 'Play one octave lower than written' },
  { id: 10, type: 'text', front: 'Loco',            back: 'Return to the normal written register — cancels a preceding 8va or 8vb' },
]
