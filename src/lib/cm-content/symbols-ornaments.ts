import { Card } from '../types'
import { B } from '../bravura'

export const ORNAMENT_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.trill, back: 'Rapidly alternate between the written note and the note a step above', symbolName: 'Trill (tr)' },
  { id: 2, type: 'symbol', front: B.mordentUpper, back: 'Quickly alternate: written note → note above → written note', symbolName: 'Upper Mordent (Pralltriller)' },
  { id: 3, type: 'symbol', front: B.mordentLower, back: 'Quickly alternate: written note → note below → written note', symbolName: 'Lower Mordent' },
  { id: 4, type: 'symbol', front: B.turnSymbol, back: 'Four-note figure: note above → main note → note below → main note', symbolName: 'Turn' },
  { id: 5, type: 'symbol', front: '𝒻', back: 'A small note played quickly before the main note, taking its value', symbolName: 'Acciaccatura (grace note)' },
  { id: 6, type: 'symbol', front: 'gliss.', back: 'Slide smoothly from one pitch to another', symbolName: 'Glissando' },
  { id: 7, type: 'symbol', front: '~', back: 'A gentle, continuous pitch fluctuation', symbolName: 'Vibrato' },
  // A1 expansion — moves the deck into Tier 3 Advanced. Existing IDs 1–7
  // preserved to keep user SM-2 progress intact.
  { id: 8,  type: 'text', front: 'Appoggiatura', back: 'An on-beat accented grace note — takes half the value of the main note (two-thirds if the main note is dotted)' },
  { id: 9,  type: 'text', front: 'Inverted turn', back: 'A turn that starts on the note below the main note — reverses the standard turn pattern' },
  { id: 10, type: 'text', front: 'Tremolo', back: 'Rapid repetition of a single note, or rapid alternation between two notes' },
  { id: 11, type: 'text', front: 'Arpeggio', back: 'A chord played as a rapid broken chord — usually indicated with a wavy vertical line' },
  { id: 12, type: 'text', front: 'Schleifer (slide)', back: 'Two quick stepwise notes leading into the main note from below (or above)' },
  { id: 13, type: 'text', front: 'Nachschlag', back: 'The concluding notes at the end of a trill that lead into the next pitch' },
  { id: 14, type: 'text', front: 'Cadential trill', back: 'A long trill with preparation and termination, typical at Baroque cadences' },
  { id: 15, type: 'text', front: 'Half-trill (Schneller)', back: 'A short trill of three or four notes — no preparation, no termination' },
]
