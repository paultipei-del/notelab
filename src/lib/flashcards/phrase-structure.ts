import { Card } from '../types'

// Phrase Structure — Tier 3 / Form & Structure
// Sequence: the base unit (phrase), then the period and its two halves,
// parallel/contrasting variants, the sentence as a different building block,
// and the motive as the smallest element.
export const PHRASE_STRUCTURE_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Phrase',              back: 'A complete musical thought, typically about four bars, ending with a cadence' },
  { id: 2, type: 'text', front: 'Period',              back: 'Two phrases — antecedent (half cadence) + consequent (authentic cadence)' },
  { id: 3, type: 'text', front: 'Antecedent phrase',   back: 'The first phrase of a period — ends inconclusively, usually on a half cadence' },
  { id: 4, type: 'text', front: 'Consequent phrase',   back: 'The second phrase of a period — ends conclusively, usually on an authentic cadence' },
  { id: 5, type: 'text', front: 'Parallel period',     back: 'Antecedent and consequent begin with the same (or very similar) material' },
  { id: 6, type: 'text', front: 'Contrasting period',  back: 'Antecedent and consequent begin with different material' },
  { id: 7, type: 'text', front: 'Sentence',            back: 'A phrase built from presentation (basic idea + repetition) followed by a continuation to the cadence' },
  { id: 8, type: 'text', front: 'Motive',              back: 'The smallest identifiable musical idea — a building block for phrases and themes' },
]
