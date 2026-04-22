import { Card } from '../types'

// Compound Intervals — Tier 2 / Pitch & Harmony
// Sequence: definition first, then by size from 9th up to 13th. Compound =
// simple interval + one octave.
export const COMPOUND_INTERVALS_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Compound interval',  back: 'An interval larger than an octave' },
  { id: 2, type: 'text', front: 'Minor 9th',          back: 'Minor 2nd + octave' },
  { id: 3, type: 'text', front: 'Major 9th',          back: 'Major 2nd + octave' },
  { id: 4, type: 'text', front: 'Minor 10th',         back: 'Minor 3rd + octave' },
  { id: 5, type: 'text', front: 'Major 10th',         back: 'Major 3rd + octave' },
  { id: 6, type: 'text', front: 'Perfect 11th',       back: 'Perfect 4th + octave' },
  { id: 7, type: 'text', front: 'Perfect 12th',       back: 'Perfect 5th + octave' },
  { id: 8, type: 'text', front: 'Major 13th',         back: 'Major 6th + octave' },
]
