import { Card } from '../types'

export const CM_LEVEL5_CARDS: Card[] = [
  // ── SIGNS AND TERMS (Level 5 additions) ──
  { id: 101, type: 'text', front: 'Animato', back: 'Animated, with spirit, energetic' },
  { id: 102, type: 'text', front: 'Appoggiatura', back: 'A non-harmonic note leaned on and performed on the beat, borrowing time from the main note it precedes' },
  { id: 103, type: 'text', front: 'Arpeggio', back: 'A broken chord — tones of a chord played melodically (one at a time) rather than simultaneously' },
  { id: 104, type: 'text', front: 'Con brio', back: 'With vigor, spirit' },
  { id: 105, type: 'text', front: 'Con moto', back: 'With motion' },
  { id: 106, type: 'text', front: 'Enharmonic', back: 'Pitches that are the same but named differently — e.g. C# and Db' },
  { id: 107, type: 'text', front: 'Largo', back: 'Stately, broadly, dignified — slower than Adagio' },
  { id: 108, type: 'text', front: 'Mordent', back: 'An ornament — the main note and the note below played quickly in succession, then returning to the main note' },
  { id: 109, type: 'text', front: 'Ornaments', back: 'Notes that embellish a melody — including trills, mordents, and turns' },
  { id: 110, type: 'text', front: 'Ostinato', back: 'A short musical pattern repeated persistently throughout a composition or section' },
  { id: 111, type: 'text', front: 'Tranquillo', back: 'Peacefully, tranquil, calm' },
  { id: 112, type: 'text', front: 'Turn', back: 'An ornament consisting of 4 notes: note above, main note, note below, main note' },
  { id: 113, type: 'text', front: 'Vivo', back: 'Brisk, lively' },

  // ── TONALITY — ALL MAJOR KEYS ──
  { id: 201, type: 'text', front: 'Order of sharps', back: 'F# C# G# D# A# E# B# — Father Charles Goes Down And Ends Battle' },
  { id: 202, type: 'text', front: 'Order of flats', back: 'Bb Eb Ab Db Gb Cb Fb — Battle Ends And Down Goes Charles Father' },
  { id: 203, type: 'text', front: 'Identifying a sharp key signature', back: 'The last sharp + one half step up = the key name (e.g. one sharp = F#, F# up a half = G major)' },
  { id: 204, type: 'text', front: 'Identifying a flat key signature', back: 'The second-to-last flat = the key name (e.g. two flats: Bb Eb — Bb major)' },
  { id: 205, type: 'text', front: 'f natural minor scale', back: 'F G Ab Bb C Db Eb F — same key signature as Ab major' },
  { id: 206, type: 'text', front: 'f harmonic minor scale', back: 'F G Ab Bb C Db E F — raised 7th (E natural)' },

  // ── FIGURED BASS ──
  { id: 301, type: 'text', front: 'Figured bass', back: 'Numbers placed below a bass note to indicate the intervals above it — shows chord position' },
  { id: 302, type: 'text', front: 'Root position figured bass (5/3 or no numbers)', back: 'Root in bass — intervals of a 5th and 3rd above the bass note' },
  { id: 303, type: 'text', front: 'First inversion figured bass (6 or 6/3)', back: '3rd in bass — interval of a 6th above the bass note' },
  { id: 304, type: 'text', front: 'Second inversion figured bass (6/4)', back: '5th in bass — intervals of a 6th and 4th above the bass note' },

  // ── DOMINANT 7TH ──
  { id: 401, type: 'text', front: 'V7 — Dominant 7th (root position)', back: 'The V chord with a minor 7th added above the root — strongest tension chord' },
  { id: 402, type: 'text', front: 'V6/5 — Dominant 7th (first inversion)', back: 'Dominant 7th with the 3rd in the bass' },
  { id: 403, type: 'text', front: 'Primary triads in harmonic minor', back: 'i (minor tonic), iv (minor subdominant), V (MAJOR dominant — raised 7th creates leading tone)' },

  // ── HISTORY ──
  { id: 501, type: 'text', front: 'J.S. Bach', back: 'Baroque period — German composer, master of counterpoint and fugue' },
  { id: 502, type: 'text', front: 'Mozart', back: 'Classical period — Austrian composer, master of opera, symphony, and piano sonata' },
  { id: 503, type: 'text', front: 'Chopin', back: 'Romantic period — Polish composer, master of piano music' },
  { id: 504, type: 'text', front: 'Kabalevsky', back: '20th/21st Century — Russian composer, wrote extensively for young pianists' },
  { id: 505, type: 'text', front: 'Bartók', back: '20th/21st Century — Hungarian composer, incorporated folk music elements' },
  { id: 506, type: 'text', front: 'Schumann', back: 'Romantic period — German composer, known for piano works and art songs' },

  // ── EAR TRAINING ──
  { id: 601, type: 'text', front: 'Mordent vs. turn (ear training)', back: 'Mordent = quick dip to note below and back | Turn = 4-note figure: above, main, below, main' },
  { id: 602, type: 'text', front: 'Vivo vs. Largo (ear training)', back: 'Vivo = brisk, lively | Largo = very slow, stately' },
  { id: 603, type: 'text', front: 'Tranquillo vs. Animato (ear training)', back: 'Tranquillo = peaceful, calm | Animato = animated, energetic' },
  { id: 604, type: 'text', front: 'Half cadence vs. authentic cadence (ear training)', back: 'Half cadence = ends on V (unfinished) | Authentic cadence = V to I (finished, final)' },
  { id: 605, type: 'text', front: 'Major key vs. minor key (ear training)', back: 'Major = bright, stable sound | Minor = darker, more somber sound' },
  { id: 606, type: 'text', front: '2/4, 3/4, and 4/4 meters (ear training)', back: '2/4 = strong-weak | 3/4 = strong-weak-weak | 4/4 = strong-weak-medium-weak' },
]
