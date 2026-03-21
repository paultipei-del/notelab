import { Card } from '../types'

export const CM_LEVEL6_CARDS: Card[] = [
  // ── SIGNS AND TERMS (Level 6 additions) ──
  { id: 101, type: 'text', front: 'Deceptive cadence', back: 'V resolves to vi instead of I — unexpected, creates a sense of surprise' },
  { id: 102, type: 'text', front: 'Doloroso', back: 'Sadly, sorrowfully' },
  { id: 103, type: 'text', front: 'Double flat (bb)', back: 'Lowers a note by two half steps' },
  { id: 104, type: 'text', front: 'Double sharp (x)', back: 'Raises a note by two half steps' },
  { id: 105, type: 'text', front: 'Forte-piano (fp)', back: 'Loud, then immediately soft' },
  { id: 106, type: 'text', front: 'Marcato', back: 'Stressed, marked, accented' },
  { id: 107, type: 'text', front: 'Modulation', back: 'Changing from one key to another within a composition' },
  { id: 108, type: 'text', front: 'Opus', back: 'Indicates the chronological number of a composer\'s works as published (e.g. Op. 9)' },
  { id: 109, type: 'text', front: 'Robusto', back: 'Boldly, robustly' },
  { id: 110, type: 'text', front: 'Scherzando', back: 'Lightly, playfully' },
  { id: 111, type: 'text', front: 'Simile', back: 'Continue in the same manner (e.g. continue the same pedaling or articulation)' },
  { id: 112, type: 'text', front: 'Sostenuto', back: 'Sustained' },
  { id: 113, type: 'text', front: 'Syncopation', back: 'A contradiction of the meter — changing strong and weak beats or accenting weak beats' },

  // ── MINOR SCALES ──
  { id: 201, type: 'text', front: 'Melodic minor scale', back: 'Ascending: raise 6th and 7th | Descending: return to natural minor (lower 6th and 7th back down)' },
  { id: 202, type: 'text', front: 'a melodic minor (ascending)', back: 'A B C D E F# G# A' },
  { id: 203, type: 'text', front: 'a melodic minor (descending)', back: 'A G F E D C B A — same as natural minor descending' },
  { id: 204, type: 'text', front: 'Three forms of minor scale', back: 'Natural minor — Harmonic minor — Melodic minor' },
  { id: 205, type: 'text', front: 'Why use harmonic minor?', back: 'The raised 7th creates a leading tone that pulls strongly to the tonic — used for harmony' },
  { id: 206, type: 'text', front: 'Why use melodic minor?', back: 'The raised 6th and 7th (ascending) smooth out the awkward augmented 2nd in harmonic minor — used for melody' },

  // ── INTERVALS ──
  { id: 301, type: 'text', front: 'Augmented interval', back: 'One half step larger than a perfect or major interval of the same number' },
  { id: 302, type: 'text', front: 'Diminished interval', back: 'One half step smaller than a perfect or minor interval of the same number' },
  { id: 303, type: 'text', front: 'Augmented 2nd', back: '3 half steps — same sound as a minor 3rd but spelled differently (e.g. G to A# vs. G to Bb)' },
  { id: 304, type: 'text', front: 'Diminished 5th', back: '6 half steps — same sound as a tritone/augmented 4th' },
  { id: 305, type: 'text', front: 'Augmented 4th', back: '6 half steps — the tritone — same sound as diminished 5th' },

  // ── CHORDS ──
  { id: 401, type: 'text', front: 'Augmented triad', back: 'A triad with two major thirds — root, major 3rd, augmented 5th — sounds tense and unstable' },
  { id: 402, type: 'text', front: 'V4/3 — Dominant 7th (second inversion)', back: 'Dominant 7th with the 5th in the bass' },
  { id: 403, type: 'text', front: 'V2 or V4/2 — Dominant 7th (third inversion)', back: 'Dominant 7th with the 7th in the bass' },
  { id: 404, type: 'text', front: 'Chord progression I-IV-I-V7-I', back: 'The fundamental tonal chord progression — Tonic, Subdominant, Tonic, Dominant 7th, Tonic' },

  // ── SCALE DEGREES IN MINOR ──
  { id: 501, type: 'text', front: 'i — Tonic (minor)', back: 'Lower case — minor chord on the 1st degree of a minor key' },
  { id: 502, type: 'text', front: 'iv — Subdominant (minor)', back: 'Lower case — minor chord on the 4th degree of a minor key' },
  { id: 503, type: 'text', front: 'V — Dominant (harmonic minor)', back: 'Upper case — MAJOR chord in harmonic minor because of the raised 7th' },

  // ── HISTORY ──
  { id: 601, type: 'text', front: 'Scarlatti', back: 'Baroque period — Italian/Spanish composer, known for harpsichord sonatas' },
  { id: 602, type: 'text', front: 'Handel', back: 'Baroque period — German-British composer, known for oratorios (Messiah) and orchestral music' },
  { id: 603, type: 'text', front: 'Clementi', back: 'Classical period — Italian composer, known for piano sonatas and sonatinas' },
  { id: 604, type: 'text', front: 'Kuhlau', back: 'Classical period — German-Danish composer, known for piano sonatinas' },
  { id: 605, type: 'text', front: 'Schubert', back: 'Romantic period — Austrian composer, known for piano works and art songs (lieder)' },
  { id: 606, type: 'text', front: 'Shostakovich', back: '20th/21st Century — Russian composer' },

  // ── EAR TRAINING ──
  { id: 701, type: 'text', front: 'Scherzando vs. Doloroso (ear training)', back: 'Scherzando = light and playful | Doloroso = sad and sorrowful' },
  { id: 702, type: 'text', front: 'Marcato vs. Sostenuto (ear training)', back: 'Marcato = stressed, accented | Sostenuto = sustained, held' },
  { id: 703, type: 'text', front: 'Four cadence types (ear training)', back: 'Authentic (V-I), Half (ends on V), Plagal (IV-I), Deceptive (V-vi)' },
  { id: 704, type: 'text', front: 'Natural, harmonic, and melodic minor (ear training)', back: 'Natural = no alterations | Harmonic = raised 7th | Melodic = raised 6th and 7th ascending, natural descending' },
]
