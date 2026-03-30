import { Card } from '../types'
import { B } from '../bravura'

export const CLEF_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.trebleClef, back: 'Used for higher-pitched instruments and right hand piano. G clef — circles around the G line.', symbolName: 'Treble Clef' },
  { id: 2, type: 'symbol', front: B.bassClef, back: 'Used for lower-pitched instruments and left hand piano. F clef — the two dots surround the F line.', symbolName: 'Bass Clef' },
  { id: 3, type: 'symbol', front: B.altoClef, back: 'C clef on the middle line — used by violas. Middle line = middle C.', symbolName: 'Alto Clef' },
  { id: 4, type: 'symbol', front: B.tenorClef, back: 'C clef on the fourth line — used by cellos and bassoons in upper range.', symbolName: 'Tenor Clef' },
  { id: 5, type: 'symbol', front: B.percussionClef, back: 'Used for unpitched percussion instruments.', symbolName: 'Percussion Clef' },
  { id: 6, type: 'symbol', front: B.commonTime, back: '4/4 time — four quarter-note beats per measure', symbolName: 'Common Time' },
  { id: 7, type: 'symbol', front: B.cutTime, back: '2/2 time — two half-note beats per measure. Also called alla breve.', symbolName: 'Cut Time' },
]
