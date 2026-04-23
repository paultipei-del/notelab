import { Card } from '../types'

// Staff Anatomy — Tier 1 / Notation & Terms
// Sequence: staff basics first (staff, lines/spaces, ledger lines), then bar-line
// types by complexity (single → double → final), then the grand staff, then
// Middle C as the connecting pivot.
export const STAFF_ANATOMY_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Staff',           back: 'Five parallel horizontal lines with four spaces between them' },
  { id: 2, type: 'text', front: 'Lines and spaces', back: 'Five lines and four spaces — each holds a different pitch' },
  { id: 3, type: 'text', front: 'Ledger line',     back: 'A short line above or below the staff for notes outside its range' },
  { id: 4, type: 'text', front: 'Bar line',        back: 'A vertical line that divides the staff into measures' },
  { id: 5, type: 'text', front: 'Double bar line', back: 'Two thin vertical lines — marks a section break' },
  { id: 6, type: 'text', front: 'Final bar line',  back: 'Thin line followed by a thick line — marks the end of a piece' },
  { id: 7, type: 'text', front: 'Grand staff',     back: 'Treble and bass staves connected by a brace — used for piano' },
  { id: 8, type: 'text', front: 'Middle C',        back: 'The pitch shared between treble and bass staves, on a ledger line between them' },
]
