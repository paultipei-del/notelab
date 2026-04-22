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
import { MAJOR_KEY_SIGNATURES_CARDS } from './flashcards/major-key-signatures'
import { MINOR_KEY_SIGNATURES_CARDS } from './flashcards/minor-key-signatures'
import { CIRCLE_OF_FIFTHS_CARDS } from './flashcards/circle-of-fifths'
import { MAJOR_SCALE_CONSTRUCTION_CARDS } from './flashcards/major-scale-construction'
import { MINOR_SCALES_CARDS } from './flashcards/minor-scales'
import { MODES_CARDS } from './flashcards/modes'
import { OTHER_SCALES_CARDS } from './flashcards/other-scales'
import { INTERVAL_INVERSIONS_CARDS } from './flashcards/interval-inversions'
import { ENHARMONIC_INTERVALS_CARDS } from './flashcards/enharmonic-intervals'
import { COMPOUND_INTERVALS_CARDS } from './flashcards/compound-intervals'
import { TRIAD_QUALITIES_CARDS } from './flashcards/triad-qualities'
import { TRIAD_INVERSIONS_CARDS } from './flashcards/triad-inversions'
import { SEVENTH_CHORD_QUALITIES_CARDS } from './flashcards/seventh-chord-qualities'
import { SEVENTH_CHORD_INVERSIONS_CARDS } from './flashcards/seventh-chord-inversions'
import { STAFF_ANATOMY_CARDS } from './flashcards/staff-anatomy'
import { TREBLE_CLEF_NOTES_CARDS } from './flashcards/treble-clef-notes'
import { BASS_CLEF_NOTES_CARDS } from './flashcards/bass-clef-notes'
import { MIDDLE_C_ACROSS_CLEFS_CARDS } from './flashcards/middle-c-across-clefs'
import { DOTTED_AND_TIED_NOTES_CARDS } from './flashcards/dotted-and-tied-notes'
import { SIMPLE_METERS_CARDS } from './flashcards/simple-meters'
import { COMPOUND_METERS_CARDS } from './flashcards/compound-meters'
import { TUPLETS_CARDS } from './flashcards/tuplets'

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
      // Dynamic letter glyphs use SMuFL Bravura codepoints (U+E520–E526) so
      // they render in the authentic italic-bold form found in real scores,
      // not plain Latin letters.  p=E520, m=E521, f=E522, s=E524, z=E525.
      { id: 1, front: '',         symbolName: 'pp',  back: 'Pianissimo — very soft',              type: 'symbol' },
      { id: 2, front: '',               symbolName: 'p',   back: 'Piano — soft',                        type: 'symbol' },
      { id: 3, front: '',         symbolName: 'mp',  back: 'Mezzo-piano — moderately soft',       type: 'symbol' },
      { id: 4, front: '',         symbolName: 'mf',  back: 'Mezzo-forte — moderately loud',       type: 'symbol' },
      { id: 5, front: '',               symbolName: 'f',   back: 'Forte — loud',                        type: 'symbol' },
      { id: 6, front: '',         symbolName: 'ff',  back: 'Fortissimo — very loud',              type: 'symbol' },
      { id: 7, front: '',   symbolName: 'sfz', back: 'Sforzando — sudden strong accent',    type: 'symbol' },
      // Crescendo / diminuendo are spelled out in italic serif (FlipCard
      // renders the italic); in full score they'd be hairpins, but we keep
      // the word here for study clarity.
      { id: 8, front: 'crescendo',            back: 'Gradually getting louder',                                type: 'text' },
      { id: 9, front: 'diminuendo',           back: 'Gradually getting softer',                                type: 'text' },
      { id: 10, front: '',        symbolName: 'fp',  back: 'Forte-piano — loud then immediately soft', type: 'symbol' },
    ],
  },
  {
    id: 'tempo',
    title: 'Tempo Markings',
    description: 'Italian tempo terms from Largo to Prestissimo.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 1,
    category: 'Notation & Terms',
    tags: ['topic:expression', 'type:terminology', 'lang:italian'],
    cards: [
      { id: 1, front: 'Grave', back: 'Very slow and solemn (under 40 BPM)', type: 'text' },
      { id: 2, front: 'Largo', back: 'Very slow and broad (40–60 BPM)', type: 'text' },
      { id: 3, front: 'Adagio', back: 'Slow and stately (66–76 BPM)', type: 'text' },
      { id: 4, front: 'Andante', back: 'Walking pace (76–108 BPM)', type: 'text' },
      { id: 5, front: 'Moderato', back: 'Moderate tempo (108–120 BPM)', type: 'text' },
      { id: 6, front: 'Allegro', back: 'Fast and lively (120–156 BPM)', type: 'text' },
      { id: 7, front: 'Vivace', back: 'Lively and fast (156–176 BPM)', type: 'text' },
      { id: 8, front: 'Presto', back: 'Very fast (168–200 BPM)', type: 'text' },
      { id: 9, front: 'Prestissimo', back: 'As fast as possible (200+ BPM)', type: 'text' },
      { id: 10, front: 'Ritardando', back: 'Gradually slowing down', type: 'text' },
      { id: 11, front: 'Accelerando', back: 'Gradually speeding up', type: 'text' },
      { id: 12, front: 'A tempo', back: 'Return to the original tempo', type: 'text' },
    ],
  },
  {
    id: 'intervals',
    title: 'Intervals',
    description: 'Recognize and name melodic and harmonic intervals.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 50,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:recognition'],
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
    tier: 'foundations',
    tierOrder: 1,
    category: 'Music symbols',
    tags: ['topic:expression', 'type:recognition'],
    cards: DYNAMICS_SYMBOL_CARDS,
  },
  {
    id: 'symbols-articulation',
    title: 'Articulation Markings',
    description: 'Identify staccato, tenuto, accent, fermata, and trill symbols.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 2,
    category: 'Music symbols',
    tags: ['topic:expression', 'type:recognition'],
    cards: ARTICULATION_SYMBOL_CARDS,
  },
  {
    id: 'symbols-accidentals',
    title: 'Accidentals',
    description: 'Identify sharp, flat, natural, double sharp, and double flat symbols.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 3,
    category: 'Music symbols',
    tags: ['topic:notation', 'type:recognition'],
    cards: ACCIDENTAL_SYMBOL_CARDS,
  },
  {
    id: 'symbols-note-values',
    title: 'Note & Rest Values',
    description: 'Identify whole, half, quarter, eighth, and sixteenth notes and rests.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 4,
    category: 'Music symbols',
    tags: ['topic:rhythm', 'type:recognition'],
    cards: NOTE_VALUES_SYMBOL_CARDS,
  },

  {
    id: 'symbols-repeats',
    title: 'Repeat & Structure Signs',
    description: 'Identify repeat barlines, D.C., D.S., coda, segno, and endings.',
    tag: 'free' as const,
    tier: 'foundations',
    tierOrder: 5,
    category: 'Music symbols',
    tags: ['topic:notation', 'type:recognition'],
    cards: REPEAT_SYMBOL_CARDS,
  },
  {
    id: 'symbols-clefs',
    title: 'Clefs & Time Signatures',
    description: 'Identify treble, bass, alto, tenor clefs and common/cut time.',
    tag: 'free' as const,
    tier: 'foundations',
    tierOrder: 6,
    category: 'Music symbols',
    tags: ['topic:notation', 'type:recognition'],
    cards: CLEF_SYMBOL_CARDS,
  },
  {
    id: 'symbols-ornaments',
    title: 'Ornaments',
    description: 'Identify trills, mordents, turns, and grace notes.',
    tag: 'free' as const,
    tier: 'foundations',
    tierOrder: 7,
    category: 'Music symbols',
    tags: ['topic:expression', 'type:recognition'],
    cards: ORNAMENT_SYMBOL_CARDS,
  },

  // ── FLASHCARDS EXPANSION (tiered decks) ──
  {
    id: 'major-key-signatures',
    title: 'Major Key Signatures',
    description: 'Name the sharps or flats for every major key.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 1,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:recognition'],
    cards: MAJOR_KEY_SIGNATURES_CARDS,
  },
  {
    id: 'minor-key-signatures',
    title: 'Minor Key Signatures',
    description: 'Name the sharps or flats for every minor key.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 2,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:recognition'],
    cards: MINOR_KEY_SIGNATURES_CARDS,
  },
  {
    id: 'circle-of-fifths',
    title: 'Circle of Fifths Relationships',
    description: 'Relative and parallel keys, motion around the circle, enharmonics.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 3,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:calculation'],
    cards: CIRCLE_OF_FIFTHS_CARDS,
  },
  {
    id: 'major-scale-construction',
    title: 'Major Scale Construction',
    description: 'The step pattern, scale-degree names, and building major scales.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 4,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:calculation'],
    cards: MAJOR_SCALE_CONSTRUCTION_CARDS,
  },
  {
    id: 'minor-scales',
    title: 'Minor Scales',
    description: 'Natural, harmonic, and melodic minor forms and how they differ.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 5,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:calculation'],
    cards: MINOR_SCALES_CARDS,
  },
  {
    id: 'modes',
    title: 'Modes',
    description: 'Ionian through Locrian — step patterns and defining qualities.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 6,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:terminology'],
    cards: MODES_CARDS,
  },
  {
    id: 'other-scales',
    title: 'Pentatonic, Blues, Chromatic, Whole Tone',
    description: 'Beyond major and minor — the other common scale families.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 7,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:terminology'],
    cards: OTHER_SCALES_CARDS,
  },
  {
    id: 'interval-inversions',
    title: 'Interval Inversions',
    description: 'The sum-is-9 rule and how quality flips under inversion.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 8,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:calculation'],
    cards: INTERVAL_INVERSIONS_CARDS,
  },
  {
    id: 'enharmonic-intervals',
    title: 'Enharmonic Intervals',
    description: 'Intervals that sound the same but function differently.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 9,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:calculation'],
    cards: ENHARMONIC_INTERVALS_CARDS,
  },
  {
    id: 'compound-intervals',
    title: 'Compound Intervals',
    description: 'Intervals larger than an octave — 9ths, 10ths, 11ths, and up.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 10,
    category: 'Pitch & Harmony',
    tags: ['topic:pitch', 'type:recognition'],
    cards: COMPOUND_INTERVALS_CARDS,
  },
  {
    id: 'triad-qualities',
    title: 'Triad Qualities',
    description: 'Major, minor, diminished, augmented — formulas and examples.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 11,
    category: 'Pitch & Harmony',
    tags: ['topic:harmony', 'type:recognition'],
    cards: TRIAD_QUALITIES_CARDS,
  },
  {
    id: 'triad-inversions',
    title: 'Triad Inversions',
    description: 'Root, first, and second inversions across common triads.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 12,
    category: 'Pitch & Harmony',
    tags: ['topic:harmony', 'type:recognition'],
    cards: TRIAD_INVERSIONS_CARDS,
  },
  {
    id: 'seventh-chord-qualities',
    title: 'Seventh Chord Qualities',
    description: 'Major 7, dominant 7, minor 7, half-diminished, fully diminished, minor-major.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 13,
    category: 'Pitch & Harmony',
    tags: ['topic:harmony', 'type:recognition'],
    cards: SEVENTH_CHORD_QUALITIES_CARDS,
  },
  {
    id: 'seventh-chord-inversions',
    title: 'Seventh Chord Inversions',
    description: 'The four positions and their figured-bass shorthand.',
    tag: 'free',
    tier: 'intermediate',
    tierOrder: 14,
    category: 'Pitch & Harmony',
    tags: ['topic:harmony', 'type:recognition'],
    cards: SEVENTH_CHORD_INVERSIONS_CARDS,
  },

  // ── TIER 1 NEW DECKS ──
  {
    id: 'staff-anatomy',
    title: 'Staff Anatomy',
    description: 'The parts of the staff — lines, spaces, bar lines, grand staff.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 2,
    category: 'Notation & Terms',
    tags: ['topic:notation', 'type:terminology'],
    cards: STAFF_ANATOMY_CARDS,
  },
  {
    id: 'treble-clef-notes',
    title: 'Treble Clef Notes',
    description: 'Name every note on the treble staff plus ledger lines.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 3,
    category: 'Notation & Terms',
    tags: ['topic:pitch', 'type:recognition'],
    cards: TREBLE_CLEF_NOTES_CARDS,
  },
  {
    id: 'bass-clef-notes',
    title: 'Bass Clef Notes',
    description: 'Name every note on the bass staff plus ledger lines.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 4,
    category: 'Notation & Terms',
    tags: ['topic:pitch', 'type:recognition'],
    cards: BASS_CLEF_NOTES_CARDS,
  },
  {
    id: 'middle-c-across-clefs',
    title: 'Middle C Across Clefs',
    description: 'Where Middle C lives on treble, bass, alto, and tenor clefs.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 5,
    category: 'Notation & Terms',
    tags: ['topic:pitch', 'type:recognition'],
    cards: MIDDLE_C_ACROSS_CLEFS_CARDS,
  },
  {
    id: 'dotted-and-tied-notes',
    title: 'Dotted & Tied Notes',
    description: 'How dots and ties change note durations.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 8,
    category: 'Music symbols',
    tags: ['topic:rhythm', 'type:recognition'],
    cards: DOTTED_AND_TIED_NOTES_CARDS,
  },
  {
    id: 'simple-meters',
    title: 'Simple Meters',
    description: 'Meters where each beat divides into two — 2/4, 3/4, 4/4, 2/2, 3/8.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 1,
    category: 'Rhythm & Meter',
    tags: ['topic:rhythm', 'type:recognition'],
    cards: SIMPLE_METERS_CARDS,
  },
  {
    id: 'compound-meters',
    title: 'Compound Meters',
    description: 'Meters where each beat divides into three — 6/8, 9/8, 12/8 and kin.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 2,
    category: 'Rhythm & Meter',
    tags: ['topic:rhythm', 'type:recognition'],
    cards: COMPOUND_METERS_CARDS,
  },
  {
    id: 'tuplets',
    title: 'Tuplets',
    description: 'Triplets, duplets, and other irregular subdivisions.',
    tag: 'free',
    tier: 'foundations',
    tierOrder: 3,
    category: 'Rhythm & Meter',
    tags: ['topic:rhythm', 'type:recognition'],
    cards: TUPLETS_CARDS,
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
