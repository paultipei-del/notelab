import { Card } from '../types'
import { B } from '../bravura'

export const REPEAT_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.repeatBarlineLeft, back: 'Begin a repeated section', symbolName: 'Repeat sign (begin)' },
  { id: 2, type: 'symbol', front: B.repeatBarlineRight, back: 'End a repeated section — go back to the begin repeat', symbolName: 'Repeat sign (end)' },
  { id: 3, type: 'symbol', front: B.segno, back: 'Sign — jump point for D.S.', symbolName: 'Segno' },
  { id: 4, type: 'symbol', front: B.coda, back: 'Coda — the ending section of a piece', symbolName: 'Coda' },
  { id: 5, type: 'symbol', front: 'D.C.', back: 'Da Capo — return to the beginning', symbolName: 'Da Capo' },
  { id: 6, type: 'symbol', front: 'D.S.', back: 'Dal Segno — return to the segno sign', symbolName: 'Dal Segno' },
  { id: 7, type: 'symbol', front: 'Fine', back: 'The end — stop here after a repeat', symbolName: 'Fine' },
  { id: 8, type: 'symbol', front: 'D.C. al Fine', back: 'Return to beginning and play to Fine', symbolName: 'Da Capo al Fine' },
  { id: 9, type: 'symbol', front: 'D.S. al Coda', back: 'Return to segno, then jump to coda', symbolName: 'Dal Segno al Coda' },
  { id: 10, type: 'symbol', front: '1.', back: 'First ending — play on first pass only', symbolName: 'First ending' },
  { id: 11, type: 'symbol', front: '2.', back: 'Second ending — play on second pass', symbolName: 'Second ending' },
]
