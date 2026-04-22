import { Card } from '../types'
import { B } from '../bravura'

export const DYNAMICS_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.p, back: 'Soft', symbolName: 'Piano' },
  { id: 2, type: 'symbol', front: B.f, back: 'Loud', symbolName: 'Forte' },
  { id: 3, type: 'symbol', front: B.mp, back: 'Moderately soft', symbolName: 'Mezzo piano' },
  { id: 4, type: 'symbol', front: B.mf, back: 'Moderately loud', symbolName: 'Mezzo forte' },
  { id: 5, type: 'symbol', front: B.pp, back: 'Very soft', symbolName: 'Pianissimo' },
  { id: 6, type: 'symbol', front: B.ff, back: 'Very loud', symbolName: 'Fortissimo' },
  { id: 7, type: 'symbol', front: B.ppp, back: 'Very, very soft', symbolName: 'Pianississimo' },
  { id: 8, type: 'symbol', front: B.fff, back: 'Very, very loud', symbolName: 'Fortississimo' },
  { id: 9, type: 'symbol', front: B.sfz, back: 'A sudden, strong accent', symbolName: 'Sforzando' },
  { id: 10, type: 'symbol', front: B.fp, back: 'Loud, then immediately soft', symbolName: 'Forte-piano' },
  { id: 11, type: 'symbol', front: B.cresc, back: 'Gradually getting louder', symbolName: 'Crescendo', symbolLabel: 'hairpin' },
  { id: 12, type: 'symbol', front: B.decresc, back: 'Gradually getting softer', symbolName: 'Decrescendo / Diminuendo', symbolLabel: 'hairpin' },
  // Dynamic markings composed from SMuFL letter glyphs (B.s/f/p, etc.) —
  // renders in the correct italic-bold dynamics style.
  { id: 13, type: 'symbol', front: B.s + B.f + B.p, back: 'Strongly accented, then immediately soft', symbolName: 'Sforzando-piano' },
  { id: 14, type: 'symbol', front: B.n, back: 'Dying away to nothing — the softest possible dynamic', symbolName: 'Niente' },
  { id: 15, type: 'symbol', front: B.r + B.f + B.z, back: 'Reinforced — a strong, emphasized accent', symbolName: 'Rinforzando' },
]

export const ARTICULATION_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.staccatoAbove, back: 'Short and detached — play notes separated', symbolName: 'Staccato' },
  { id: 2, type: 'symbol', front: B.tenutoAbove, back: 'Hold the note for its full value and/or emphasize it', symbolName: 'Tenuto' },
  { id: 3, type: 'symbol', front: B.accentAbove, back: 'With emphasis or stress on the note', symbolName: 'Accent' },
  { id: 4, type: 'symbol', front: B.fermataAbove, back: 'Hold longer — sustain beyond its normal value', symbolName: 'Fermata' },
  { id: 5, type: 'symbol', front: B.trill, back: 'Rapid alternation between the written note and the note above it', symbolName: 'Trill' },
  { id: 6, type: 'symbol', front: B.marcatoAbove, back: 'Strongly accented — heavier than a regular accent', symbolName: 'Marcato' },
  { id: 7, type: 'symbol', front: B.staccatissimoAbove, back: 'Extremely short and detached — shorter than staccato', symbolName: 'Staccatissimo' },
  { id: 8, type: 'text',   front: 'Portato',                         back: 'Slurred staccato — dots under a slur; play lightly detached but connected' },
  { id: 9, type: 'text',   front: 'Louré',                           back: 'Tenuto dashes under a slur — sustain each note within a legato phrase' },
  { id: 10, type: 'text',  front: 'Wedge',                           back: 'An older notation for very short detached notes — a small wedge above the note' },
]

export const ACCIDENTAL_SYMBOL_CARDS: Card[] = [
  { id: 1, type: 'symbol', front: B.sharp, back: 'Raises a note by a half step', symbolName: 'Sharp' },
  { id: 2, type: 'symbol', front: B.flat, back: 'Lowers a note by a half step', symbolName: 'Flat' },
  { id: 3, type: 'symbol', front: B.natural, back: 'Cancels a sharp or flat — returns the note to its original pitch', symbolName: 'Natural' },
  { id: 4, type: 'symbol', front: B.doubleSharp, back: 'Raises a note by two half steps', symbolName: 'Double Sharp' },
  { id: 5, type: 'symbol', front: B.doubleFlat, back: 'Lowers a note by two half steps', symbolName: 'Double Flat' },
  { id: 6, type: 'text', front: 'Courtesy accidental', back: 'A reminder accidental (often in parentheses) — clarifies a pitch when a note might be ambiguous' },
  { id: 7, type: 'text', front: 'Accidentals within a measure', back: 'An accidental applies to the same pitch for the rest of the measure, then is cancelled by the next barline' },
  { id: 8, type: 'text', front: 'Enharmonic spelling', back: 'Two different accidentals can name the same pitch — e.g., F♯ and G♭' },
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
  { id: 11, type: 'text',   front: 'Dotted rest',       back: 'A dot after a rest adds half its value — a dotted half rest = 3 beats' },
  { id: 12, type: 'text',   front: 'Multi-measure rest', back: 'A single sign with a number above it — rest for that many full measures' },
]
