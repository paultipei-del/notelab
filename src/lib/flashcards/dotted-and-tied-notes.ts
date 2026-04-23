import { Card } from '../types'

// Dotted & Tied Notes — Tier 1 / Music symbols
// Sequence: what a dot does (the rule), then concrete dotted values from longest
// to shortest, then the double-dot rule, then ties (definition → vs slur → use
// cases). Pure concept cards; the existing note-value deck covers the glyphs.
export const DOTTED_AND_TIED_NOTES_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Augmentation dot',               back: 'Adds half the value of the note to itself' },
  { id: 2,  type: 'text', front: 'Dotted whole note',              back: '6 beats in 4/4' },
  { id: 3,  type: 'text', front: 'Dotted half note',               back: '3 beats in 4/4' },
  { id: 4,  type: 'text', front: 'Dotted quarter note',            back: '1½ beats in 4/4' },
  { id: 5,  type: 'text', front: 'Dotted eighth note',             back: '¾ of a beat in 4/4' },
  { id: 6,  type: 'text', front: 'Double dot',                     back: 'Adds half, then a quarter — three quarters of the note’s original value' },
  { id: 7,  type: 'text', front: 'Tie',                            back: 'A curved line joining two notes of the same pitch — sum their durations' },
  { id: 8,  type: 'text', front: 'Tie vs. slur',                   back: 'Tie = same pitch (sustain); slur = different pitches (play smoothly)' },
  { id: 9,  type: 'text', front: 'Tied note across a barline',     back: 'Sustains the pitch across the bar — sum the values on both sides' },
  { id: 10, type: 'text', front: 'Why use a tie instead of a longer note', back: 'When the duration crosses a barline or can’t be written as a single value' },
]
