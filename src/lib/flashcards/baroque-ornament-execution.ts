import { Card } from '../types'

// Baroque Ornament Execution — Tier 3 / Music symbols
// Baroque performance practice for the ornaments from A1. These are guidelines
// from treatises of the era (C.P.E. Bach, Quantz, d'Anglebert) — later style
// periods execute the same symbols differently (see A3).
// TODO: verify — Baroque ornament execution has disputed conventions; these
// cards follow the most widely-taught modern consensus.
export const BAROQUE_ORNAMENT_EXECUTION_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Baroque trill — where to start',   back: 'Start on the upper auxiliary (the dissonance), then alternate — resolves down to the main note' },
  { id: 2, type: 'text', front: 'Baroque trill — how long',          back: 'Fills the full written value of the main note' },
  { id: 3, type: 'text', front: 'Baroque appoggiatura — duration',   back: 'Takes half the value of the main note (two-thirds if the main note is dotted)' },
  { id: 4, type: 'text', front: 'Baroque mordent — pattern',         back: 'Main note → lower auxiliary → main note, played quickly on the beat' },
  { id: 5, type: 'text', front: 'Baroque Pralltriller (upper mordent)', back: 'Rapid main → upper auxiliary → main, executed on the beat' },
  { id: 6, type: 'text', front: 'Baroque turn — pattern',            back: 'Upper auxiliary → main → lower auxiliary → main, fitted around the note' },
  { id: 7, type: 'text', front: 'Acciaccatura in Baroque',           back: 'Very short — played almost simultaneously with the main note, "crushed" and released' },
  { id: 8, type: 'text', front: 'Baroque cadential trill',           back: 'Typically starts on the upper note and ends with a Nachschlag (two-note termination) leading to the final note' },
]
