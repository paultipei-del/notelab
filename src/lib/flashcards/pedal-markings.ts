import { Card } from '../types'

// Pedal Markings — Tier 3 / Music symbols
// Sequence: sustain pedal first (the pedal beginners meet), then una corda/tre
// corde, then the middle (sostenuto) pedal and the advanced half-pedal
// technique.
export const PEDAL_MARKINGS_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Ped.',               back: 'Depress the sustain (right) pedal — lifts the dampers, sustaining all pitches' },
  { id: 2, type: 'text', front: '✻ (or *)',           back: 'Release the sustain pedal' },
  { id: 3, type: 'text', front: 'Una corda',          back: '“One string” — depress the left (soft) pedal, softening the tone' },
  { id: 4, type: 'text', front: 'Tre corde',          back: '“Three strings” — release the una corda, returning to full tone' },
  { id: 5, type: 'text', front: 'Con sordino',        back: 'With the soft pedal (equivalent to una corda)' },
  { id: 6, type: 'text', front: 'Senza sordino',      back: 'Without the soft pedal (equivalent to tre corde)' },
  { id: 7, type: 'text', front: 'Sostenuto pedal',    back: 'Middle pedal on grand pianos — sustains only the notes held down at the moment it’s depressed' },
  { id: 8, type: 'text', front: 'Half-pedal',         back: 'Partial release of the sustain pedal — clears some resonance while retaining some sustain' },
]
