import { Card } from '../types'

export const CM_LEVEL4_CARDS: Card[] = [
  // ── SIGNS AND TERMS (Level 4 additions) ──
  { id: 101, type: 'text', front: 'Allegretto', back: 'Slightly slower than Allegro, but faster than Moderato' },
  { id: 102, type: 'text', front: 'Andantino', back: 'A little faster than Andante' },
  { id: 103, type: 'text', front: 'Articulation', back: 'The various ways notes are played or attacked — including staccato and legato' },
  { id: 104, type: 'text', front: 'Cantabile', back: 'In a singing style' },
  { id: 105, type: 'text', front: 'Espressivo', back: 'Expressively' },
  { id: 106, type: 'text', front: 'Imitation', back: 'A statement of a motive in another voice or octave' },
  { id: 107, type: 'text', front: 'Leggiero', back: 'Lightly' },
  { id: 108, type: 'text', front: 'Meter', back: 'The arrangement of beats into groups of equal size with regular recurring accents' },
  { id: 109, type: 'text', front: 'Parallel major and minor', back: 'Keys with the same tonic note (e.g. C major and c minor)' },
  { id: 110, type: 'text', front: 'Presto', back: 'Very fast' },
  { id: 111, type: 'text', front: 'Subito', back: 'Suddenly (e.g. subito piano = suddenly soft)' },
  { id: 112, type: 'text', front: 'Transposition', back: 'To write or perform a piece in a key other than that in which it was written' },
  { id: 113, type: 'text', front: 'Trill', back: 'An ornament — rapid alternation of two adjacent tones' },

  // ── SCALE DEGREES ──
  { id: 201, type: 'text', front: 'I — Tonic', back: 'The 1st scale degree — home base of the key' },
  { id: 202, type: 'text', front: 'ii — Supertonic', back: 'The 2nd scale degree — lower case because it is a minor chord in major keys' },
  { id: 203, type: 'text', front: 'iii — Mediant', back: 'The 3rd scale degree — lower case because it is a minor chord in major keys' },
  { id: 204, type: 'text', front: 'IV — Subdominant', back: 'The 4th scale degree — upper case because it is a major chord' },
  { id: 205, type: 'text', front: 'V — Dominant', back: 'The 5th scale degree — creates strong tension that resolves to tonic' },
  { id: 206, type: 'text', front: 'vi — Submediant', back: 'The 6th scale degree — lower case because it is a minor chord in major keys' },
  { id: 207, type: 'text', front: 'viiº — Leading tone', back: 'The 7th scale degree — diminished chord, lower case with degree symbol' },
  { id: 208, type: 'text', front: 'Upper case Roman numerals', back: 'Used for MAJOR chords (I, IV, V)' },
  { id: 209, type: 'text', front: 'Lower case Roman numerals', back: 'Used for minor and diminished chords (ii, iii, vi, viiº)' },

  // ── TONALITY ──
  { id: 301, type: 'text', front: 'F# major scale', back: 'F# G# A# B C# D# E# F# — six sharps' },
  { id: 302, type: 'text', front: 'Ab major scale', back: 'Ab Bb C Db Eb F G Ab — four flats (Bb, Eb, Ab, Db)' },
  { id: 303, type: 'text', front: 'Db major scale', back: 'Db Eb F Gb Ab Bb C Db — five flats (Bb, Eb, Ab, Db, Gb)' },
  { id: 304, type: 'text', front: 'b natural minor', back: 'B C# D E F# G A B — same key signature as D major' },
  { id: 305, type: 'text', front: 'b harmonic minor', back: 'B C# D E F# G A# B — raised 7th (A#)' },
  { id: 306, type: 'text', front: 'g natural minor', back: 'G A Bb C D Eb F G — same key signature as Bb major' },
  { id: 307, type: 'text', front: 'g harmonic minor', back: 'G A Bb C D Eb F# G — raised 7th (F#)' },
  { id: 308, type: 'text', front: 'c natural minor', back: 'C D Eb F G Ab Bb C — same key signature as Eb major' },
  { id: 309, type: 'text', front: 'c harmonic minor', back: 'C D Eb F G Ab B C — raised 7th (B natural)' },

  // ── INTERVALS ──
  { id: 401, type: 'text', front: 'Minor interval', back: 'One half step smaller than a major interval of the same number (e.g. minor 3rd = 3 half steps)' },
  { id: 402, type: 'text', front: 'Minor 2nd', back: '1 half step — the smallest interval' },
  { id: 403, type: 'text', front: 'Minor 3rd', back: '3 half steps — dark, introspective sound' },
  { id: 404, type: 'text', front: 'Minor 6th', back: '8 half steps — somewhat dark' },
  { id: 405, type: 'text', front: 'Minor 7th', back: '10 half steps' },
  { id: 406, type: 'text', front: 'Ascending vs. descending intervals', back: 'Ascending = bottom note to top note | Descending = top note to bottom note' },

  // ── CHORDS ──
  { id: 501, type: 'text', front: 'Diminished triad', back: 'A triad with two minor thirds — sounds tense and unstable (e.g. B-D-F in C major)' },
  { id: 502, type: 'text', front: 'Secondary triads', back: 'The ii, iii, vi, and vii° chords — built on scale degrees other than I, IV, V' },
  { id: 503, type: 'text', front: 'Dominant 7th chord (V7)', back: 'The V chord with an added minor 7th above the root — creates strong tension pulling to I' },
  { id: 504, type: 'text', front: 'Common tone', back: 'A note shared between two consecutive chords — helps create smooth voice leading' },

  // ── HISTORY ──
  { id: 601, type: 'text', front: 'Four periods of music history (in order)', back: 'Baroque → Classical → Romantic → 20th/21st Centuries' },
  { id: 602, type: 'text', front: 'Baroque period', back: 'Approximately 1600–1750 — J.S. Bach, Handel, Scarlatti' },
  { id: 603, type: 'text', front: 'Classical period', back: 'Approximately 1750–1820 — Mozart, Haydn, Beethoven' },
  { id: 604, type: 'text', front: 'Romantic period', back: 'Approximately 1820–1900 — Chopin, Schumann, Schubert' },
  { id: 605, type: 'text', front: '20th/21st Century period', back: 'Approximately 1900–present — Bartók, Kabalevsky, Shostakovich' },

  // ── EAR TRAINING ──
  { id: 701, type: 'text', front: 'Repetition vs. sequence (ear training)', back: 'Repetition = same pattern at same pitch | Sequence = same pattern repeated at different pitch' },
  { id: 702, type: 'text', front: 'Presto vs. Andantino (ear training)', back: 'Presto = very fast | Andantino = a little faster than Andante' },
  { id: 703, type: 'text', front: 'Adagio vs. Allegro (ear training)', back: 'Adagio = slow | Allegro = fast and lively' },
]
