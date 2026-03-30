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
]
