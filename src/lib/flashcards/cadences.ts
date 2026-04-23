import { Card } from '../types'

// Cadences — Tier 3 / Pitch & Harmony
// Sequence: what a cadence is, then authentic (strongest → weakest specificity:
// PAC → IAC), the half cadence (pause), plagal ("amen"), deceptive (expectation
// upended), and the Phrygian cadence as a Baroque special case.
export const CADENCES_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Cadence',                       back: 'The harmonic progression that ends a phrase — signals pause, closure, or surprise' },
  { id: 2, type: 'text', front: 'Authentic cadence (V → I)',     back: 'The strongest resolution — creates a sense of closure' },
  { id: 3, type: 'text', front: 'Perfect authentic cadence (PAC)', back: 'V → I in root position, with the soprano landing on the tonic — strongest form' },
  { id: 4, type: 'text', front: 'Imperfect authentic cadence (IAC)', back: 'V → I where the voicing or inversion makes it less conclusive (e.g., soprano not on tonic)' },
  { id: 5, type: 'text', front: 'Half cadence (HC)',             back: 'Phrase ends on V — sense of pause, not closure' },
  { id: 6, type: 'text', front: 'Plagal cadence (IV → I)',       back: 'The “amen” cadence — softer than authentic' },
  { id: 7, type: 'text', front: 'Deceptive cadence (V → vi)',    back: 'Expected V → I is replaced by V → vi, avoiding closure' },
  { id: 8, type: 'text', front: 'Phrygian cadence (iv⁶ → V)',    back: 'In minor, a Baroque cadence ending on V with characteristic half-step descent in the bass' },
]
