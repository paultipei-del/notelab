import { Deck } from './types'
import { CM_LEVEL1_CARDS } from './cm-content/level1'
import { CM_LEVEL2_CARDS } from './cm-content/level2'

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

  // ── CM COLLECTIONS ──
  {
    id: 'cm-level1',
    title: 'CM Level 1',
    description: 'Certificate of Merit Level 1 — signs & terms, tonality, intervals, rhythm, chords, and ear training.',
    tag: 'cm',
    cards: CM_LEVEL1_CARDS,
  },
  {
    id: 'cm-level2',
    title: 'CM Level 2',
    description: 'Certificate of Merit Level 2 — builds on Level 1, adds cadences, minor scales, and new keys.',
    tag: 'cm',
    cards: CM_LEVEL2_CARDS,
  },
]

// Decks that require CM bundle purchase
export const CM_DECK_IDS = ['cm-level1', 'cm-level2']

export function deckRequiresPurchase(deckId: string): boolean {
  return CM_DECK_IDS.includes(deckId)
}

export function getDeckById(id: string): Deck | undefined {
  return DECKS.find(d => d.id === id)
}
