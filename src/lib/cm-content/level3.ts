import { Card } from '../types'

export const CM_LEVEL3_CARDS: Card[] = [
  // ── SIGNS AND TERMS (Level 3 additions) ──
  { id: 101, type: 'text', front: 'Accelerando / accel.', back: 'Gradually faster — accelerate the tempo' },
  { id: 102, type: 'text', front: 'Adagio', back: 'Slow tempo — slower than Andante' },
  { id: 103, type: 'text', front: 'Dolce', back: 'Sweetly' },
  { id: 104, type: 'text', front: 'Legato pedal (syncopated pedal)', back: 'Creating seamless legato by raising and quickly depressing the damper pedal immediately after the keys are played' },
  { id: 105, type: 'text', front: 'Molto', back: 'Much, very (e.g. molto allegro = very fast)' },
  { id: 106, type: 'text', front: 'Motif / motive', back: 'A short musical idea — melodic or rhythmic — that recurs throughout a piece' },
  { id: 107, type: 'text', front: 'Poco', back: 'Little (e.g. poco ritardando = slow down a little)' },
  { id: 108, type: 'text', front: 'Relative major and minor', back: 'Major and minor keys that share the same key signature (e.g. C major and a minor)' },
  { id: 109, type: 'text', front: 'Spiritoso', back: 'Spirited' },
  { id: 110, type: 'text', front: 'Tre corde', back: 'Release the soft pedal (left pedal)' },
  { id: 111, type: 'text', front: 'Una corda', back: 'Apply the soft pedal (left pedal) — literally "one string"' },

  // ── TONALITY ──
  { id: 201, type: 'text', front: 'B major scale', back: 'B C# D# E F# G# A# B — five sharps (F# C# G# D# A#)' },
  { id: 202, type: 'text', front: 'Eb major scale', back: 'Eb F G Ab Bb C D Eb — three flats (Bb, Eb, Ab)' },
  { id: 203, type: 'text', front: 'e natural minor scale', back: 'E F# G A B C D E — same key signature as G major' },
  { id: 204, type: 'text', front: 'e harmonic minor scale', back: 'E F# G A B C D# E — raised 7th (D#)' },
  { id: 205, type: 'text', front: 'd natural minor scale', back: 'D E F G A Bb C D — same key signature as F major' },
  { id: 206, type: 'text', front: 'd harmonic minor scale', back: 'D E F G A Bb C# D — raised 7th (C#)' },

  // ── INTERVALS (Perfect and Major) ──
  { id: 301, type: 'text', front: 'Perfect interval', back: 'Unison, 4th, 5th, and octave — these intervals have only one "perfect" quality (not major or minor)' },
  { id: 302, type: 'text', front: 'Major interval', back: '2nd, 3rd, 6th, and 7th built from the major scale — sounds bright' },
  { id: 303, type: 'text', front: 'Perfect Unison', back: 'Two notes of the exact same pitch — 0 half steps' },
  { id: 304, type: 'text', front: 'Perfect 4th', back: '5 half steps — open, stable sound' },
  { id: 305, type: 'text', front: 'Perfect 5th', back: '7 half steps — the most consonant interval after the octave' },
  { id: 306, type: 'text', front: 'Major 2nd', back: '2 half steps — a whole step' },
  { id: 307, type: 'text', front: 'Major 3rd', back: '4 half steps — bright, stable' },
  { id: 308, type: 'text', front: 'Major 6th', back: '9 half steps — warm, open' },
  { id: 309, type: 'text', front: 'Major 7th', back: '11 half steps — tense, dissonant, wants to resolve up by half step' },

  // ── CHORDS / TRIADS ──
  { id: 401, type: 'text', front: 'Triad inversion', back: 'A triad with a note other than the root in the bass' },
  { id: 402, type: 'text', front: 'Root position (R)', back: 'Root is the lowest note — labeled R or 5/3' },
  { id: 403, type: 'text', front: 'First inversion (1st)', back: 'Third is the lowest note — labeled 1st or 6/3' },
  { id: 404, type: 'text', front: 'Second inversion (2nd)', back: 'Fifth is the lowest note — labeled 2nd or 6/4' },
  { id: 405, type: 'text', front: 'Root of an inverted triad', back: 'The note that is a 4th above the bass note in first inversion, or a 4th below the bass note in second inversion' },

  // ── CADENCES ──
  { id: 501, type: 'text', front: 'Authentic cadence', back: 'V to I — Dominant resolves to Tonic — the strongest, most final cadence' },
  { id: 502, type: 'text', front: 'Half cadence', back: 'Ends on V — sounds unfinished, like a musical question' },
  { id: 503, type: 'text', front: 'Plagal cadence', back: 'IV to I — the "Amen" cadence — softer feeling of finality' },

  // ── RHYTHM ──
  { id: 601, type: 'text', front: 'Sixteenth note pattern', back: 'Four sixteenth notes equal one beat in 4/4 time' },
  { id: 602, type: 'text', front: 'Eighth note triplet', back: 'Three eighth notes played in the time of two — marked with a "3" above or below the group' },
  { id: 603, type: 'text', front: 'Time signature — determining', back: 'Count the beats in a measure to find the top number; identify the beat note for the bottom number' },

  // ── EAR TRAINING ──
  { id: 701, type: 'text', front: 'Adagio vs. Spiritoso (ear training)', back: 'Adagio = slow and stately | Spiritoso = spirited and energetic' },
  { id: 702, type: 'text', front: 'Andante vs. Vivace (ear training)', back: 'Andante = walking pace | Vivace = lively and fast' },
  { id: 703, type: 'text', front: '2/4 vs. 3/4 (ear training)', back: '2/4 = 2 beats per measure (strong-weak) | 3/4 = 3 beats per measure (strong-weak-weak)' },
]
