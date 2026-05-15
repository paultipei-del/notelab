import { Card } from '../types'

export const CM_PREP_CARDS: Card[] = [
  // ── SIGNS AND TERMS (Preparatory) ──
  { id: 101, type: 'text', front: 'a tempo', back: 'Return to the original tempo' },
  { id: 102, type: 'text', front: 'Accent', back: 'With emphasis or stress on a note' },
  { id: 103, type: 'text', front: 'Bar line', back: 'A vertical line that separates notes on the staff into measures' },
  { id: 104, type: 'text', front: 'Bass clef (F clef)', back: 'Names the fourth line of the bass staff, used for lower notes' },
  { id: 105, type: 'text', front: 'Brace', back: 'A wavy line that joins the treble and bass staves of a grand staff' },
  { id: 106, type: 'text', front: 'D.C. al Fine (da capo al fine)', back: 'Return to the beginning, play to Fine (the end)' },
  { id: 107, type: 'text', front: 'Dynamics', back: 'Symbols or terms that indicate loud or soft, variations in volume' },
  { id: 108, type: 'text', front: 'Fermata', back: 'Hold longer: sustain the note beyond its normal value' },
  { id: 109, type: 'text', front: 'Fine', back: 'The end' },
  { id: 110, type: 'text', front: 'Forte (f)', back: 'Loud' },
  { id: 111, type: 'text', front: 'Grand staff', back: 'Two staves joined together by a brace: treble and bass clef combined' },
  { id: 112, type: 'text', front: 'Measure', back: 'The space between two bar lines' },
  { id: 113, type: 'text', front: 'Piano (p)', back: 'Soft' },
  { id: 114, type: 'text', front: 'Repeat sign', back: 'A sign with two dots that indicates a section of music should be repeated' },
  { id: 115, type: 'text', front: 'Ritardando / rit.', back: 'Gradually slower' },
  { id: 116, type: 'text', front: 'Slur', back: 'A curved line connecting two or more different pitches, play smoothly (legato)' },
  { id: 117, type: 'text', front: 'Staccato', back: 'Separated, detached, not connected' },
  { id: 118, type: 'text', front: 'Tie', back: 'A curved line connecting notes of the same pitch, hold for full value, do not re-strike' },
  { id: 119, type: 'text', front: 'Treble clef (G clef)', back: 'Names the second line of the treble staff, used for higher notes' },

  // ── TONALITY ──
  { id: 201, type: 'text', front: 'Staff notes', back: 'Notes placed on the lines and spaces of the staff, identified by letter name (A through G)' },
  { id: 202, type: 'text', front: 'Half step', back: 'The smallest distance between two notes: from one key to the very next key on the piano' },
  { id: 203, type: 'text', front: 'Whole step', back: 'Two half steps, skips one key on the piano' },
  { id: 204, type: 'text', front: 'Lines of the treble staff (bottom to top)', back: 'E G B D F · Every Good Boy Does Fine' },
  { id: 205, type: 'text', front: 'Spaces of the treble staff (bottom to top)', back: 'F A C E · FACE' },
  { id: 206, type: 'text', front: 'Lines of the bass staff (bottom to top)', back: 'G B D F A · Good Boys Do Fine Always' },
  { id: 207, type: 'text', front: 'Spaces of the bass staff (bottom to top)', back: 'A C E G · All Cows Eat Grass' },
  { id: 208, type: 'text', front: 'Middle C', back: 'The C between the treble and bass staves: first ledger line below treble, first ledger line above bass' },

  // ── INTERVALS ──
  { id: 301, type: 'text', front: '2nd', back: 'An interval moving to the next letter name, line to space or space to line' },
  { id: 302, type: 'text', front: '3rd', back: 'An interval skipping one letter name, line to line or space to space' },
  { id: 303, type: 'text', front: '4th', back: 'An interval spanning 4 letter names' },
  { id: 304, type: 'text', front: '5th', back: 'An interval spanning 5 letter names' },

  // ── FIVE-FINGER PATTERNS ──
  { id: 401, type: 'text', front: 'Major five-finger pattern', back: 'Five adjacent notes using the pattern W W H W, sounds bright (e.g. C D E F G)' },
  { id: 402, type: 'text', front: 'Minor five-finger pattern', back: 'Five adjacent notes using the pattern W H W W, sounds darker' },
  { id: 403, type: 'text', front: 'C, G, D, F major five-finger patterns', back: 'The four major five-finger patterns required at Prep level' },

  // ── SCALES AND KEY SIGNATURES ──
  { id: 501, type: 'text', front: 'C major scale', back: 'C D E F G A B C · no sharps or flats' },
  { id: 502, type: 'text', front: 'G major scale', back: 'G A B C D E F# G · one sharp (F#)' },
  { id: 503, type: 'text', front: 'F major scale', back: 'F G A Bb C D E F · one flat (Bb)' },

  // ── CHORDS / TRIADS ──
  { id: 601, type: 'text', front: 'Triad', back: 'A three-note chord built in 3rds: root, third, and fifth' },
  { id: 602, type: 'text', front: 'Root position', back: 'A triad with the root (bottom note) in the bass' },
  { id: 603, type: 'text', front: 'Major triad', back: 'A triad with a major 3rd on the bottom and a minor 3rd on top, sounds bright and stable' },
  { id: 604, type: 'text', front: 'Minor triad', back: 'A triad with a minor 3rd on the bottom and a major 3rd on top, sounds darker' },
  { id: 605, type: 'text', front: 'C major triad', back: 'C - E - G' },
  { id: 606, type: 'text', front: 'G major triad', back: 'G - B - D' },
  { id: 607, type: 'text', front: 'D major triad', back: 'D - F# - A' },
  { id: 608, type: 'text', front: 'F major triad', back: 'F - A - C' },

  // ── TIME AND RHYTHM ──
  { id: 701, type: 'text', front: 'Time signature · top number', back: 'How many beats are in each measure' },
  { id: 702, type: 'text', front: 'Time signature · bottom number', back: 'What type of note gets one beat (4 = quarter note)' },
  { id: 703, type: 'text', front: 'Whole note', back: '4 beats · open oval, no stem' },
  { id: 704, type: 'text', front: 'Half note', back: '2 beats · open oval with stem' },
  { id: 705, type: 'text', front: 'Quarter note', back: '1 beat · filled oval with stem' },
  { id: 706, type: 'text', front: 'Eighth note', back: '½ beat · filled oval with stem and flag' },
  { id: 707, type: 'text', front: 'Whole rest', back: 'Silence for 4 beats · hangs from a line' },
  { id: 708, type: 'text', front: 'Half rest', back: 'Silence for 2 beats · sits on top of a line' },
  { id: 709, type: 'text', front: 'Quarter rest', back: 'Silence for 1 beat' },

  // ── EAR TRAINING ──
  { id: 801, type: 'text', front: 'Major vs. minor five-finger pattern (ear training)', back: 'Major = bright, W W H W | Minor = darker, W H W W' },
  { id: 802, type: 'text', front: 'Legato vs. staccato (ear training)', back: 'Legato = smooth and connected | Staccato = short and detached' },
  { id: 803, type: 'text', front: 'Forte vs. Piano (ear training)', back: 'Forte (f) = loud | Piano (p) = soft' },
]
