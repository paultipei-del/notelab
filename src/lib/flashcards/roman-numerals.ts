import { Card } from '../types'

// Roman Numerals — Tier 3 / Pitch & Harmony
// Sequence: diatonic triads I through vii° in order of scale degree (the case
// convention teaches itself as you go), then the quality/case rule, then
// inversion figures, then secondary dominants, then borrowed chromatic chords.
export const ROMAN_NUMERALS_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'I (major key)',        back: 'Tonic — major triad on the 1st degree' },
  { id: 2,  type: 'text', front: 'ii (major key)',       back: 'Supertonic — minor triad on the 2nd degree' },
  { id: 3,  type: 'text', front: 'iii (major key)',      back: 'Mediant — minor triad on the 3rd degree' },
  { id: 4,  type: 'text', front: 'IV (major key)',       back: 'Subdominant — major triad on the 4th degree' },
  { id: 5,  type: 'text', front: 'V (major key)',        back: 'Dominant — major triad on the 5th degree' },
  { id: 6,  type: 'text', front: 'vi (major key)',       back: 'Submediant — minor triad on the 6th degree' },
  { id: 7,  type: 'text', front: 'vii° (major key)',     back: 'Leading-tone — diminished triad on the 7th degree' },
  { id: 8,  type: 'text', front: 'i (minor key)',        back: 'Tonic — minor triad on the 1st degree' },
  { id: 9,  type: 'text', front: 'Uppercase vs. lowercase Roman numerals', back: 'Uppercase = major (or augmented); lowercase = minor (or diminished)' },
  { id: 10, type: 'text', front: 'Figured-bass superscripts on Roman numerals', back: 'Indicate inversion — e.g., V6 = 1st inversion, V⁶₄ = 2nd inversion' },
  { id: 11, type: 'text', front: 'Secondary dominant',   back: 'A dominant chord of a chord other than I — written as V/V (“five of five”), V/ii, etc.' },
  { id: 12, type: 'text', front: 'Roman numeral analysis', back: 'Labeling each chord in a passage with a Roman numeral (and figures) to show its function' },
  { id: 13, type: 'text', front: 'Neapolitan 6th (♭II⁶)', back: 'Major triad built on the lowered 2nd degree, typically in first inversion' },
  { id: 14, type: 'text', front: 'Augmented 6th chords (It, Fr, Ger)', back: 'Chromatic pre-dominant chords containing an augmented 6th interval — Italian, French, and German variants' },
]
