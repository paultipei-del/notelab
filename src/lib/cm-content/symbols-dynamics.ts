import { Card } from '../types'
import { B } from '../bravura'

export const DYNAMICS_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.p, back: 'Soft', symbolName: 'Piano (p)' },
  { id: 2, type: 'symbol', front: B.f, back: 'Loud', symbolName: 'Forte (f)' },
  { id: 3, type: 'symbol', front: B.mp, back: 'Moderately soft', symbolName: 'Mezzo piano (mp)' },
  { id: 4, type: 'symbol', front: B.mf, back: 'Moderately loud', symbolName: 'Mezzo forte (mf)' },
  { id: 5, type: 'symbol', front: B.pp, back: 'Very soft', symbolName: 'Pianissimo (pp)' },
  { id: 6, type: 'symbol', front: B.ff, back: 'Very loud', symbolName: 'Fortissimo (ff)' },
  { id: 7, type: 'symbol', front: B.ppp, back: 'Very, very soft', symbolName: 'Pianississimo (ppp)' },
  { id: 8, type: 'symbol', front: B.fff, back: 'Very, very loud', symbolName: 'Fortississimo (fff)' },
  { id: 9, type: 'symbol', front: B.sfz, back: 'A sudden, strong accent', symbolName: 'Sforzando (sfz)' },
  { id: 10, type: 'symbol', front: B.fp, back: 'Loud, then immediately soft', symbolName: 'Forte-piano (fp)' },
  { id: 11, type: 'symbol', front: B.cresc, back: 'Gradually getting louder', symbolName: 'Crescendo', symbolLabel: 'hairpin' },
  { id: 12, type: 'symbol', front: B.decresc, back: 'Gradually getting softer', symbolName: 'Decrescendo / Diminuendo', symbolLabel: 'hairpin' },
]

export const ARTICULATION_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.staccatoAbove, back: 'Short and detached — play notes separated', symbolName: 'Staccato' },
  { id: 2, type: 'symbol', front: B.tenutoAbove, back: 'Hold the note for its full value and/or emphasize it', symbolName: 'Tenuto' },
  { id: 3, type: 'symbol', front: B.accentAbove, back: 'With emphasis or stress on the note', symbolName: 'Accent (>)' },
  { id: 4, type: 'symbol', front: B.fermataAbove, back: 'Hold longer — sustain beyond its normal value', symbolName: 'Fermata' },
  { id: 5, type: 'symbol', front: B.trill, back: 'Rapid alternation between the written note and the note above it', symbolName: 'Trill (tr)' },
]

export const ACCIDENTAL_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.sharp, back: 'Raises a note by a half step', symbolName: 'Sharp (#)' },
  { id: 2, type: 'symbol', front: B.flat, back: 'Lowers a note by a half step', symbolName: 'Flat (♭)' },
  { id: 3, type: 'symbol', front: B.natural, back: 'Cancels a sharp or flat — returns the note to its original pitch', symbolName: 'Natural (♮)' },
  { id: 4, type: 'symbol', front: B.doubleSharp, back: 'Raises a note by two half steps', symbolName: 'Double Sharp (𝄪)' },
  { id: 5, type: 'symbol', front: B.doubleFlat, back: 'Lowers a note by two half steps', symbolName: 'Double Flat (𝄫)' },
]

export const NOTE_VALUES_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.wholeNote, back: '4 beats in 4/4 time', symbolName: 'Whole Note' },
  { id: 2, type: 'symbol', front: B.halfNoteUp, back: '2 beats in 4/4 time', symbolName: 'Half Note' },
  { id: 3, type: 'symbol', front: B.quarterNoteUp, back: '1 beat in 4/4 time', symbolName: 'Quarter Note' },
  { id: 4, type: 'symbol', front: B.eighthNoteUp, back: '½ beat in 4/4 time', symbolName: 'Eighth Note' },
  { id: 5, type: 'symbol', front: B.sixteenthNoteUp, back: '¼ beat in 4/4 time', symbolName: 'Sixteenth Note' },
  { id: 6, type: 'symbol', front: B.wholeRest, back: 'Silence for 4 beats — hangs from a line', symbolName: 'Whole Rest' },
  { id: 7, type: 'symbol', front: B.halfRest, back: 'Silence for 2 beats — sits on top of a line', symbolName: 'Half Rest' },
  { id: 8, type: 'symbol', front: B.quarterRest, back: 'Silence for 1 beat', symbolName: 'Quarter Rest' },
  { id: 9, type: 'symbol', front: B.eighthRest, back: 'Silence for ½ beat', symbolName: 'Eighth Rest' },
  { id: 10, type: 'symbol', front: B.sixteenthRest, back: 'Silence for ¼ beat', symbolName: 'Sixteenth Rest' },
]
