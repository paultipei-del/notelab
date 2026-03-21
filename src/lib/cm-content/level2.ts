import { Card } from '../types'

export const CM_LEVEL2_CARDS: Card[] = [
  // ── SIGNS AND TERMS (Level 2 additions) ──
  { id: 101, type: 'text', front: 'Allegro', back: 'Fast, quick tempo' },
  { id: 102, type: 'text', front: 'Andante', back: 'Walking tempo — moderately slow' },
  { id: 103, type: 'text', front: 'Authentic cadence (V - I)', back: 'A cadence using the harmonic progression of Dominant to Tonic — V to I — the strongest cadence' },
  { id: 104, type: 'text', front: 'Cadence', back: 'The chords that end a phrase or section of a composition' },
  { id: 105, type: 'text', front: 'Fortississimo (fff)', back: 'Very, very loud' },
  { id: 106, type: 'text', front: 'Half cadence (I - V)', back: 'A cadence using a harmonic progression that ends on the Dominant — V — sounds unfinished' },
  { id: 107, type: 'text', front: 'Moderato', back: 'Moderate tempo' },
  { id: 108, type: 'text', front: 'Pianississimo (ppp)', back: 'Very, very soft' },
  { id: 109, type: 'text', front: 'Plagal cadence (IV - I)', back: 'A cadence using the harmonic progression of Subdominant to Tonic — IV to I — the "Amen" cadence' },
  { id: 110, type: 'text', front: 'Sequence', back: 'Repeating a melodic pattern at a higher or lower pitch, often a 2nd or 3rd above or below' },
  { id: 111, type: 'text', front: 'Sforzando (sfz)', back: 'A sudden, strong accent' },
  { id: 112, type: 'text', front: 'Vivace', back: 'Quickly, lively' },

  // ── TONALITY ──
  { id: 201, type: 'text', front: 'A major scale', back: 'A B C# D E F# G# A — three sharps (F#, C#, G#)' },
  { id: 202, type: 'text', front: 'E major scale', back: 'E F# G# A B C# D# E — four sharps (F#, C#, G#, D#)' },
  { id: 203, type: 'text', front: 'Bb major scale', back: 'Bb C D Eb F G A Bb — two flats (Bb, Eb)' },
  { id: 204, type: 'text', front: 'a natural minor scale', back: 'A B C D E F G A — same key signature as C major (relative minor)' },
  { id: 205, type: 'text', front: 'a harmonic minor scale', back: 'A B C D E F G# A — natural minor with raised 7th (G#)' },
  { id: 206, type: 'text', front: 'Harmonic minor scale', back: 'Natural minor scale with a raised 7th degree — creates a leading tone that pulls to the tonic' },
  { id: 207, type: 'text', front: 'Natural minor scale', back: 'Uses the same notes as its relative major — no raised 7th' },
  { id: 208, type: 'text', front: 'Relative major and minor', back: 'Major and minor keys that share the same key signature (e.g., C major and a minor)' },

  // ── INTERVALS ──
  { id: 301, type: 'text', front: 'Interval by number', back: 'Count every letter name from the bottom note to the top note — include both notes in the count' },

  // ── CHORDS / TRIADS ──
  { id: 401, type: 'text', front: 'I chord (Tonic)', back: 'Built on the 1st scale degree — the most stable chord in the key' },
  { id: 402, type: 'text', front: 'IV chord (Subdominant)', back: 'Built on the 4th scale degree' },
  { id: 403, type: 'text', front: 'V chord (Dominant)', back: 'Built on the 5th scale degree — creates tension that resolves to I' },
  { id: 404, type: 'text', front: 'Roman numeral — upper case (I, IV, V)', back: 'Indicates a MAJOR chord' },
  { id: 405, type: 'text', front: 'D major triad', back: 'D - F# - A' },
  { id: 406, type: 'text', front: 'A major triad', back: 'A - C# - E' },
  { id: 407, type: 'text', front: 'Bb major triad', back: 'Bb - D - F' },
  { id: 408, type: 'text', front: 'a minor triad', back: 'A - C - E' },

  // ── RHYTHM ──
  { id: 501, type: 'text', front: 'Sixteenth note', back: '¼ beat — filled oval with stem and two flags or two beams' },
  { id: 502, type: 'text', front: 'Dotted eighth note', back: '¾ beat — often paired with a sixteenth note' },
  { id: 503, type: 'text', front: 'Repeat sign (two-bar)', back: 'Play from the first repeat sign to the second, then repeat that section' },

  // ── EAR TRAINING ──
  { id: 601, type: 'text', front: 'Like phrase', back: 'Two phrases that begin the same way but end differently' },
  { id: 602, type: 'text', front: 'Unlike phrase', back: 'Two phrases that begin differently' },
  { id: 603, type: 'text', front: 'Major triad sound', back: 'Bright, stable — built with major 3rd on bottom, minor 3rd on top' },
  { id: 604, type: 'text', front: 'Minor triad sound', back: 'Dark, somber — built with minor 3rd on bottom, major 3rd on top' },
]
