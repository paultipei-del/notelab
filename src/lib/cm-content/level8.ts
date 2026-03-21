import { Card } from '../types'

export const CM_LEVEL8_CARDS: Card[] = [
  // ── SIGNS AND TERMS (Level 8 additions) ──
  { id: 101, type: 'text', front: 'Augmentation', back: 'Presenting a subject or theme with note values doubled — everything twice as slow' },
  { id: 102, type: 'text', front: 'Diminution', back: 'Presenting a subject or theme with note values halved — everything twice as fast' },
  { id: 103, type: 'text', front: 'Homophonic texture', back: 'A melody in one voice with accompaniment — chordal texture is a type of homophonic texture' },
  { id: 104, type: 'text', front: 'Locrian mode', back: 'Half steps between notes 1-2 and 4-5 — like playing all white keys from B to B — rarely used' },
  { id: 105, type: 'text', front: 'Lydian mode', back: 'Half steps between notes 4-5 and 7-8 — like playing all white keys from F to F — major scale with raised 4th' },
  { id: 106, type: 'text', front: 'm.d. (mano destra)', back: 'Play with the right hand' },
  { id: 107, type: 'text', front: 'm.s. (mano sinistra)', back: 'Play with the left hand' },
  { id: 108, type: 'text', front: 'Pedal point (organ point)', back: 'A sustained or repeated tone, usually in the bass, over which other harmonies change' },
  { id: 109, type: 'text', front: 'Phrygian mode', back: 'Half steps between notes 1-2 and 5-6 — like playing all white keys from E to E' },
  { id: 110, type: 'text', front: 'Pivot chord', back: 'A chord common to both the original key and the new key — used to smoothly transition in a modulation' },
  { id: 111, type: 'text', front: 'Polyphonic texture', back: 'Music with two or more independent melodic lines sounding simultaneously — also called contrapuntal' },

  // ── MODES (all seven) ──
  { id: 201, type: 'text', front: 'Seven modes (in order from C)', back: 'Ionian (C), Dorian (D), Phrygian (E), Lydian (F), Mixolydian (G), Aeolian (A), Locrian (B)' },
  { id: 202, type: 'text', front: 'Ionian mode', back: 'Half steps: 3-4 and 7-8 — identical to major scale' },
  { id: 203, type: 'text', front: 'Dorian mode', back: 'Half steps: 2-3 and 6-7 — minor scale with raised 6th' },
  { id: 204, type: 'text', front: 'Phrygian mode', back: 'Half steps: 1-2 and 5-6 — minor scale with lowered 2nd' },
  { id: 205, type: 'text', front: 'Lydian mode', back: 'Half steps: 4-5 and 7-8 — major scale with raised 4th' },
  { id: 206, type: 'text', front: 'Mixolydian mode', back: 'Half steps: 3-4 and 6-7 — major scale with lowered 7th' },
  { id: 207, type: 'text', front: 'Aeolian mode', back: 'Half steps: 2-3 and 5-6 — identical to natural minor scale' },
  { id: 208, type: 'text', front: 'Locrian mode', back: 'Half steps: 1-2 and 4-5 — rarely used in tonal music' },

  // ── SECONDARY DOMINANT ──
  { id: 301, type: 'text', front: 'Secondary dominant', back: 'A dominant 7th chord built on a scale degree other than V — temporarily tonicizes another chord (e.g. V/V = dominant of the dominant)' },
  { id: 302, type: 'text', front: 'Modulation from C to G', back: 'Move from C major to G major — the pivot chord is often I in C = IV in G' },
  { id: 303, type: 'text', front: 'Modulation from G to D', back: 'Move from G major to D major — the pivot chord is often I in G = IV in D' },

  // ── RHYTHM ──
  { id: 401, type: 'text', front: 'Syncopation', back: 'Emphasizing normally weak beats or offbeats — contradicts the expected metric accent' },
  { id: 402, type: 'text', front: '5/4 time', back: '5 beats per measure — quarter note gets one beat — often felt as 3+2 or 2+3' },
  { id: 403, type: 'text', front: '6/8 time', back: '6 eighth notes per measure — compound duple — usually felt in 2 with each beat divided into 3' },

  // ── HISTORY ──
  { id: 501, type: 'text', front: 'Diabelli', back: 'Classical period — Austrian composer, known for piano sonatinas' },
  { id: 502, type: 'text', front: 'Czerny', back: 'Classical period — Austrian composer/teacher, known for piano etudes and exercises' },
  { id: 503, type: 'text', front: 'Vivaldi', back: 'Baroque period — Italian composer, known for The Four Seasons and concertos' },
  { id: 504, type: 'text', front: 'Mendelssohn', back: 'Romantic period — German composer, known for piano Songs Without Words and orchestral works' },
  { id: 505, type: 'text', front: 'Brahms', back: 'Romantic period — German composer, known for piano works and symphonies' },
  { id: 506, type: 'text', front: 'Terraced dynamics', back: 'Sudden shifts between dynamic levels (p and f) without gradual crescendo/decrescendo — common in Baroque keyboard music due to harpsichord limitations' },

  // ── EAR TRAINING ──
  { id: 601, type: 'text', front: 'Polyphonic vs. homophonic texture (ear training)', back: 'Polyphonic = multiple independent melodies | Homophonic = one melody with accompaniment' },
  { id: 602, type: 'text', front: '4/4 vs. 5/4 (ear training)', back: '4/4 = 4 equal beats | 5/4 = 5 beats, uneven feel' },
  { id: 603, type: 'text', front: '5/4 vs. 6/8 (ear training)', back: '5/4 = 5 quarter note beats | 6/8 = 2 dotted quarter beats (compound duple)' },
]
