import { Deck } from './types'
import { SIGHT_READ_DECKS, SIGHT_READ_PRO_IDS } from './sightReadDecks'
import { GRAND_STAFF_DECKS, GRAND_STAFF_PRO_IDS } from './grandStaffDecks'
import { EAR_TRAINING_INTERVALS, EAR_TRAINING_INTERVALS_II, EAR_TRAINING_INTERVALS_III, EAR_TRAINING_TRIADS, EAR_TRAINING_TRIADS_BROWSE, EAR_TRAINING_TRIADS_INVERSIONS, EAR_TRAINING_SEVENTH_CHORDS, EAR_TRAINING_CADENCES, EAR_TRAINING_SCALES } from './cm-content/audio-ear-training'
import { DYNAMICS_SYMBOL_CARDS, ARTICULATION_SYMBOL_CARDS, ACCIDENTAL_SYMBOL_CARDS, NOTE_VALUES_SYMBOL_CARDS } from './cm-content/symbols-dynamics'
import { REPEAT_SYMBOL_CARDS } from './cm-content/symbols-repeats'
import { CLEF_SYMBOL_CARDS } from './cm-content/symbols-clefs'
import { ORNAMENT_SYMBOL_CARDS } from './cm-content/symbols-ornaments'
import { CM_PREP_CARDS } from "./cm-content/preparatory"
import { CM_LEVEL1_CARDS } from "./cm-content/level1"
import { CM_LEVEL2_CARDS } from './cm-content/level2'
import { CM_LEVEL3_CARDS } from './cm-content/level3'
import { CM_LEVEL4_CARDS } from './cm-content/level4'
import { CM_LEVEL5_CARDS } from './cm-content/level5'
import { CM_LEVEL6_CARDS } from './cm-content/level6'
import { CM_LEVEL7_CARDS } from './cm-content/level7'
import { CM_LEVEL8_CARDS } from './cm-content/level8'
import { CM_LEVEL9_CARDS } from './cm-content/level9'
import { CM_ADVANCED_CARDS } from './cm-content/advanced'

export const CM_BUNDLE_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_CM_PRICE_ID ?? ''
export const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? ''

export const DECKS: Deck[] = [
  // ── FREE COLLECTIONS ──
  {
    id: 'dynamics',
    title: 'Dynamic Markings',
    description: 'Essential volume and expression markings found in music notation.',
    tag: 'free',
    cards: [
      { id: 1, front: 'pp', back: 'Pianissimo — very soft', type: 'text' },
      { id: 2, front: 'p', back: 'Piano — soft', type: 'text' },
      { id: 3, front: 'mp', back: 'Mezzo-piano — moderately soft', type: 'text' },
      { id: 4, front: 'mf', back: 'Mezzo-forte — moderately loud', type: 'text' },
      { id: 5, front: 'f', back: 'Forte — loud', type: 'text' },
      { id: 6, front: 'ff', back: 'Fortissimo — very loud', type: 'text' },
      { id: 7, front: 'sfz', back: 'Sforzando — sudden strong accent', type: 'text' },
      { id: 8, front: 'crescendo', back: 'Gradually getting louder', type: 'text' },
      { id: 9, front: 'diminuendo', back: 'Gradually getting softer', type: 'text' },
      { id: 10, front: 'fp', back: 'Forte-piano — loud then immediately soft', type: 'text' },
    ],
  },
  {
    id: 'tempo',
    title: 'Tempo Markings',
    description: 'Italian tempo terms from Largo to Prestissimo.',
    tag: 'free',
    cards: [
      { id: 1, front: 'Largo', back: 'Very slow and broad (40–60 BPM)', type: 'text' },
      { id: 2, front: 'Adagio', back: 'Slow and stately (66–76 BPM)', type: 'text' },
      { id: 3, front: 'Andante', back: 'Walking pace (76–108 BPM)', type: 'text' },
      { id: 4, front: 'Moderato', back: 'Moderate tempo (108–120 BPM)', type: 'text' },
      { id: 5, front: 'Allegro', back: 'Fast and lively (120–156 BPM)', type: 'text' },
      { id: 6, front: 'Vivace', back: 'Lively and fast (156–176 BPM)', type: 'text' },
      { id: 7, front: 'Presto', back: 'Very fast (168–200 BPM)', type: 'text' },
      { id: 8, front: 'Ritardando', back: 'Gradually slowing down', type: 'text' },
      { id: 9, front: 'Accelerando', back: 'Gradually speeding up', type: 'text' },
      { id: 10, front: 'A tempo', back: 'Return to the original tempo', type: 'text' },
    ],
  },
  {
    id: 'intervals',
    title: 'Intervals',
    description: 'Recognize and name melodic and harmonic intervals.',
    tag: 'free',
    cards: [
      { id: 1, front: 'Minor 2nd', back: '1 half step — dissonant, tense', type: 'text' },
      { id: 2, front: 'Major 2nd', back: '2 half steps — whole tone', type: 'text' },
      { id: 3, front: 'Minor 3rd', back: '3 half steps — dark, introspective', type: 'text' },
      { id: 4, front: 'Major 3rd', back: '4 half steps — bright, stable', type: 'text' },
      { id: 5, front: 'Perfect 4th', back: '5 half steps — open, stable', type: 'text' },
      { id: 6, front: 'Tritone', back: "6 half steps — the devil's interval, highly dissonant", type: 'text' },
      { id: 7, front: 'Perfect 5th', back: '7 half steps — the most consonant interval', type: 'text' },
      { id: 8, front: 'Minor 6th', back: '8 half steps — somewhat dark', type: 'text' },
      { id: 9, front: 'Major 6th', back: '9 half steps — warm, open', type: 'text' },
      { id: 10, front: 'Octave', back: '12 half steps — same note, higher register', type: 'text' },
    ],
  },
  {
    id: 'notes-treble',
    title: 'Note Reading — Treble',
    description: 'Identify notes on the treble clef staff.',
    tag: 'free',
    cards: [
      { id: 1, front: 'E4', back: 'First ledger line below treble staff', type: 'staff', note: 'E4', clef: 'treble' },
      { id: 2, front: 'F4', back: 'First line of treble staff', type: 'staff', note: 'F4', clef: 'treble' },
      { id: 3, front: 'G4', back: 'Second line of treble staff', type: 'staff', note: 'G4', clef: 'treble' },
      { id: 4, front: 'A4', back: 'Second space of treble staff', type: 'staff', note: 'A4', clef: 'treble' },
      { id: 5, front: 'B4', back: 'Third line of treble staff', type: 'staff', note: 'B4', clef: 'treble' },
      { id: 6, front: 'C5', back: 'Third space of treble staff', type: 'staff', note: 'C5', clef: 'treble' },
      { id: 7, front: 'D5', back: 'Fourth line of treble staff', type: 'staff', note: 'D5', clef: 'treble' },
      { id: 8, front: 'E5', back: 'Fourth space of treble staff', type: 'staff', note: 'E5', clef: 'treble' },
      { id: 9, front: 'F5', back: 'Fifth line of treble staff', type: 'staff', note: 'F5', clef: 'treble' },
    ],
  },

  {
    id: 'symbols-dynamics',
    title: 'Dynamic Markings',
    description: 'Read and identify dynamic symbols — p, f, mf, mp, ff, pp, sfz, crescendo and more.',
    tag: 'free',
    cards: DYNAMICS_SYMBOL_CARDS,
  },
  {
    id: 'symbols-articulation',
    title: 'Articulation Markings',
    description: 'Identify staccato, tenuto, accent, fermata, and trill symbols.',
    tag: 'free',
    cards: ARTICULATION_SYMBOL_CARDS,
  },
  {
    id: 'symbols-accidentals',
    title: 'Accidentals',
    description: 'Identify sharp, flat, natural, double sharp, and double flat symbols.',
    tag: 'free',
    cards: ACCIDENTAL_SYMBOL_CARDS,
  },
  {
    id: 'symbols-note-values',
    title: 'Note & Rest Values',
    description: 'Identify whole, half, quarter, eighth, and sixteenth notes and rests.',
    tag: 'free',
    cards: NOTE_VALUES_SYMBOL_CARDS,
  },

  {
    id: 'symbols-repeats',
    title: 'Repeat & Structure Signs',
    description: 'Identify repeat barlines, D.C., D.S., coda, segno, and endings.',
    tag: 'free' as const,
    cards: REPEAT_SYMBOL_CARDS,
  },
  {
    id: 'symbols-clefs',
    title: 'Clefs & Time Signatures',
    description: 'Identify treble, bass, alto, tenor clefs and common/cut time.',
    tag: 'free' as const,
    cards: CLEF_SYMBOL_CARDS,
  },
  {
    id: 'symbols-ornaments',
    title: 'Ornaments',
    description: 'Identify trills, mordents, turns, and grace notes.',
    tag: 'free' as const,
    cards: ORNAMENT_SYMBOL_CARDS,
  },
  {
    id: 'ear-intervals',
    title: 'Intervals I',
    description: 'Listen and identify all intervals from minor 2nd to octave, ascending.',
    tag: 'free',
    group: 'Intervals',
    cards: EAR_TRAINING_INTERVALS,
  },
  {
    id: 'ear-intervals-ii',
    title: 'Intervals II',
    description: 'Compound intervals — minor 9th through double octave, ascending.',
    tag: 'free',
    group: 'Intervals',
    cards: EAR_TRAINING_INTERVALS_II,
  },
  {
    id: 'ear-intervals-iii',
    title: 'Intervals III — Advanced',
    description: 'All intervals m2–P15, ascending and descending, varied roots.',
    tag: 'free',
    group: 'Intervals',
    cards: EAR_TRAINING_INTERVALS_III,
  },
  {
    id: 'ear-triads',
    title: 'Triads',
    description: 'Identify major, minor, diminished, and augmented triads by ear — root position.',
    tag: 'free',
    group: 'Chords & Harmony',
    cards: EAR_TRAINING_TRIADS,
    browseCards: EAR_TRAINING_TRIADS_BROWSE,
  },
  {
    id: 'ear-triads-inversions',
    title: 'Triads — Inversions',
    description: 'Identify first and second inversions of major and minor triads by ear.',
    tag: 'free',
    group: 'Chords & Harmony',
    cards: EAR_TRAINING_TRIADS_INVERSIONS,
  },
  {
    id: 'ear-seventh-chords',
    title: '7th Chords',
    description: 'Identify m7, mM7, maj7, dom7, half-diminished, and fully diminished 7th chords by ear — root position.',
    tag: 'free',
    group: 'Chords & Harmony',
    cards: EAR_TRAINING_SEVENTH_CHORDS,
  },
  {
    id: 'ear-cadences',
    title: 'Cadences',
    description: 'Identify authentic, half, plagal, and deceptive cadences by ear.',
    tag: 'free',
    group: 'Chords & Harmony',
    cards: EAR_TRAINING_CADENCES,
  },
  {
    id: 'ear-scales',
    title: 'Scales',
    description: 'Identify major, natural minor, harmonic minor, and melodic minor scales.',
    tag: 'free',
    group: 'Scales',
    cards: EAR_TRAINING_SCALES,
  },

  // ── CM COLLECTIONS ──
  {
    id: 'cm-prep',
    title: 'CM Preparatory',
    description: 'Certificate of Merit Preparatory level — signs & terms, note reading, five-finger patterns, basic scales and chords.',
    tag: 'cm',
    cards: CM_PREP_CARDS,
  },
  {
    id: 'cm-level1',
    title: 'CM Level 1',
    description: 'Signs & terms, note reading, intervals, rhythm, scales, chords, and ear training.',
    tag: 'cm',
    cards: CM_LEVEL1_CARDS,
  },
  {
    id: 'cm-level2',
    title: 'CM Level 2',
    description: 'Builds on Level 1 — adds cadences, minor scales, new keys, and sequence.',
    tag: 'cm',
    cards: CM_LEVEL2_CARDS,
  },
  {
    id: 'cm-level3',
    title: 'CM Level 3',
    description: 'Adds triad inversions, Perfect/Major intervals, and new signs & terms.',
    tag: 'cm',
    cards: CM_LEVEL3_CARDS,
  },
  {
    id: 'cm-level4',
    title: 'CM Level 4',
    description: 'Scale degrees with Roman numerals, minor/diminished intervals, music history.',
    tag: 'cm',
    cards: CM_LEVEL4_CARDS,
  },
  {
    id: 'cm-level5',
    title: 'CM Level 5',
    description: 'All major keys, figured bass, dominant 7th, ornaments, and history.',
    tag: 'cm',
    cards: CM_LEVEL5_CARDS,
  },
  {
    id: 'cm-level6',
    title: 'CM Level 6',
    description: 'Melodic minor, augmented/diminished intervals, deceptive cadence, modulation.',
    tag: 'cm',
    cards: CM_LEVEL6_CARDS,
  },
  {
    id: 'cm-level7',
    title: 'CM Level 7',
    description: 'Circle of fifths, modes, diminished 7th chord, sonata form.',
    tag: 'cm',
    cards: CM_LEVEL7_CARDS,
  },
  {
    id: 'cm-level8',
    title: 'CM Level 8',
    description: 'All seven modes, secondary dominants, pivot chords, polyphonic texture.',
    tag: 'cm',
    cards: CM_LEVEL8_CARDS,
  },
  {
    id: 'cm-level9',
    title: 'CM Level 9',
    description: 'Baroque suite dances, fugue structure, 7th chords, Impressionism.',
    tag: 'cm',
    cards: CM_LEVEL9_CARDS,
  },
  {
    id: 'cm-advanced',
    title: 'CM Advanced',
    description: 'Fugue analysis, non-harmonic tones, serialism, advanced compositional techniques.',
    tag: 'cm',
    cards: CM_ADVANCED_CARDS,
  },
  ...SIGHT_READ_DECKS,
  ...GRAND_STAFF_DECKS,
]

export const CM_DECK_IDS = [
  'cm-prep', 'cm-level1', 'cm-level2', 'cm-level3', 'cm-level4', 'cm-level5',
  'cm-level6', 'cm-level7', 'cm-level8', 'cm-level9', 'cm-advanced',
]

export const SIGHT_READ_PRO_DECK_IDS = SIGHT_READ_PRO_IDS
export const GRAND_STAFF_PRO_DECK_IDS = GRAND_STAFF_PRO_IDS

export function deckRequiresPurchase(deckId: string): boolean {
  return CM_DECK_IDS.includes(deckId)
}

export function getDeckById(id: string): Deck | undefined {
  return DECKS.find(d => d.id === id)
}
