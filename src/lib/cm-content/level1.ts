import { Card } from '../types'

export const CM_LEVEL1_CARDS: Card[] = [
  // ── SIGNS AND TERMS (Level 1 additions — beyond Prep) ──
  { id: 101, type: 'text', front: '8va', back: 'Play eight notes (an octave) higher than written' },
  { id: 102, type: 'text', front: '8vb (8va below staff)', back: 'Play eight notes (an octave) lower than written' },
  { id: 103, type: 'text', front: 'Accidental', back: 'Sharps, flats, or naturals introduced apart from the key signature — applies only for the rest of that measure' },
  { id: 104, type: 'text', front: 'Crescendo / cresc.', back: 'Gradually getting louder' },
  { id: 105, type: 'text', front: 'Damper pedal', back: 'The pedal on the far right — depress and release' },
  { id: 106, type: 'text', front: 'Decrescendo / decresc.', back: 'Gradually getting softer' },
  { id: 107, type: 'text', front: 'Diminuendo / dim.', back: 'Gradually getting softer' },
  { id: 108, type: 'text', front: 'First and second endings', back: 'Play to the end of the first ending, repeat from repeat sign; on repetition skip the first ending and play the second' },
  { id: 109, type: 'text', front: 'Fortissimo (ff)', back: 'Very loud' },
  { id: 110, type: 'text', front: 'Mezzo forte (mf)', back: 'Moderately loud' },
  { id: 111, type: 'text', front: 'Mezzo piano (mp)', back: 'Moderately soft' },
  { id: 112, type: 'text', front: 'Pianissimo (pp)', back: 'Very soft' },
  { id: 113, type: 'text', front: 'Repetition', back: 'A compositional technique — repeating the same melodic pattern exactly' },
  { id: 114, type: 'text', front: 'Tenuto', back: 'Hold the note for its full value and/or emphasize it' },

  // ── TONALITY ──
  { id: 201, type: 'text', front: 'Staff notes up to two ledger lines', back: 'Notes extend above and below the staff on short ledger lines — must be able to identify up to two ledger lines above and below' },
  { id: 202, type: 'text', front: 'Sharp (#)', back: 'Raises a note by a half step' },
  { id: 203, type: 'text', front: 'Flat (♭)', back: 'Lowers a note by a half step' },
  { id: 204, type: 'text', front: 'Natural (♮)', back: 'Cancels a sharp or flat — returns the note to its original pitch' },
  { id: 205, type: 'text', front: 'Key signature', back: 'Sharps or flats at the beginning of each staff — tells you which notes are always sharp or flat throughout the piece' },
  { id: 206, type: 'text', front: 'D major scale', back: 'D E F# G A B C# D — two sharps (F#, C#)' },
  { id: 207, type: 'text', front: 'Half steps and whole steps on the staff', back: 'On the staff, half steps occur between E-F and B-C (no black key between them); all other adjacent white keys are whole steps' },

  // ── INTERVALS (Level 1 adds 6th, 7th, octave) ──
  { id: 301, type: 'text', front: '6th', back: 'An interval spanning 6 letter names' },
  { id: 302, type: 'text', front: '7th', back: 'An interval spanning 7 letter names' },
  { id: 303, type: 'text', front: 'Octave (8th)', back: 'An interval spanning 8 letter names — the same note name, one octave apart (12 half steps)' },

  // ── FIVE-FINGER PATTERNS (Level 1 adds A E Bb B) ──
  { id: 401, type: 'text', front: 'A, E, Bb, B major five-finger patterns', back: 'Level 1 adds these four patterns to the Prep level patterns (C, G, D, F)' },
  { id: 402, type: 'text', front: 'A, E, Bb, B minor five-finger patterns', back: 'Minor versions of the Level 1 patterns — W H W W starting on each note' },

  // ── SCALES ──
  { id: 501, type: 'text', front: 'A major scale', back: 'A B C# D E F# G# A — three sharps (F#, C#, G#)' },
  { id: 502, type: 'text', front: 'E major scale', back: 'E F# G# A B C# D# E — four sharps (F#, C#, G#, D#)' },
  { id: 503, type: 'text', front: 'Bb major scale', back: 'Bb C D Eb F G A Bb — two flats (Bb, Eb)' },

  // ── PRIMARY TRIADS WITH ROMAN NUMERALS ──
  { id: 601, type: 'text', front: 'Primary triads by Roman numeral (C, G, F major)', back: 'I = Tonic, IV = Subdominant, V = Dominant — in the keys of C, G, and F major' },
  { id: 602, type: 'text', front: 'Tonic (I)', back: 'The first scale degree — the home base chord of the key' },
  { id: 603, type: 'text', front: 'Subdominant (IV)', back: 'The fourth scale degree chord' },
  { id: 604, type: 'text', front: 'Dominant (V)', back: 'The fifth scale degree chord — creates tension that resolves to I' },

  // ── RHYTHM ──
  { id: 701, type: 'text', front: 'Dotted half note', back: '3 beats — half note with a dot (the dot adds half the note\'s value)' },
  { id: 702, type: 'text', front: 'Dotted quarter note', back: '1½ beats — quarter note with a dot' },
  { id: 703, type: 'text', front: 'Eighth rest', back: 'Silence for ½ beat' },
  { id: 704, type: 'text', front: '4/4, 3/4, 2/4 time signatures', back: '4/4 = 4 beats | 3/4 = 3 beats | 2/4 = 2 beats — quarter note gets one beat in all three' },

  // ── EAR TRAINING ──
  { id: 801, type: 'text', front: 'Major vs. minor triads (ear training)', back: 'Major triad = bright (major 3rd on bottom) | Minor triad = dark (minor 3rd on bottom)' },
  { id: 802, type: 'text', front: 'Intervals up to octave — ascending (ear training)', back: 'Level 1 ear training requires identifying all intervals from unison through octave, ascending' },
  { id: 803, type: 'text', front: 'Fortissimo vs. Pianissimo (ear training)', back: 'ff = very loud | pp = very soft' },
  { id: 804, type: 'text', front: 'Mezzo forte vs. Mezzo piano (ear training)', back: 'mf = moderately loud | mp = moderately soft' },
  { id: 805, type: 'text', front: 'Crescendo vs. Decrescendo (ear training)', back: 'Crescendo = gradually louder | Decrescendo = gradually softer' },
]
