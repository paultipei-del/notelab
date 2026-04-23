import { Card } from '../types'

// Fingering Conventions — Tier 3 / Music symbols
// Sequence: the numbering itself, how it applies to both hands, then the key
// fingering techniques (crossing, substitution, position), ending with the
// substitution notation readers encounter in scores.
export const FINGERING_CONVENTIONS_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Fingering numbers',            back: 'Thumb = 1, index = 2, middle = 3, ring = 4, pinky = 5' },
  { id: 2, type: 'text', front: 'Fingering for both hands',     back: 'The numbers 1–5 apply to both hands the same way — thumb is always 1' },
  { id: 3, type: 'text', front: 'Thumb-under / crossing',       back: 'In scales, the thumb passes under the other fingers (or fingers cross over the thumb) to keep the line smooth' },
  { id: 4, type: 'text', front: 'Finger substitution',          back: 'Changing fingers silently on the same held key — used to preserve legato or prepare the next passage' },
  { id: 5, type: 'text', front: 'Five-finger position',         back: 'The hand placed so five adjacent keys sit under the five fingers with no shifts' },
  { id: 6, type: 'text', front: 'Fingering substitution notation', back: 'Shown as “3–4” above a single note — change from finger 3 to finger 4 on that note without relifting' },
]
