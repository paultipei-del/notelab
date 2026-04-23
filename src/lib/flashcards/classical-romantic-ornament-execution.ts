import { Card } from '../types'

// Classical/Romantic Ornament Execution — Tier 3 / Music symbols
// Execution conventions shift from Baroque (see A2): trills start on the main
// note, appoggiaturas shorten, and grace notes move before the beat.
// TODO: verify — edge cases in early-Classical composers (Haydn, Mozart) still
// sometimes follow Baroque convention; the cards below describe what became
// dominant by the later Classical and Romantic periods.
export const CLASSICAL_ROMANTIC_ORNAMENT_EXECUTION_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Classical/Romantic trill — where to start', back: 'Start on the main note (reversed from Baroque) — the upper auxiliary is now the alternation, not the entry' },
  { id: 2, type: 'text', front: 'Classical appoggiatura',                    back: 'Shorter than Baroque — often a brief leaning note before the main note; length depends on context' },
  { id: 3, type: 'text', front: 'Romantic grace note',                        back: 'Short, unstressed — typically played before the beat rather than on it' },
  { id: 4, type: 'text', front: 'Classical mordent',                          back: 'Still main → lower auxiliary → main on the beat, but used less frequently than in Baroque' },
  { id: 5, type: 'text', front: 'Turn above a note',                          back: 'On-beat execution — upper → main → lower → main fit around the written note value' },
  { id: 6, type: 'text', front: 'Turn after a note',                          back: 'Placed between two notes — the turn fills the time leading to the next note' },
  { id: 7, type: 'text', front: 'Romantic arpeggio',                          back: 'Usually rolled from bottom to top unless notated otherwise (a downward arrow reverses direction)' },
  { id: 8, type: 'text', front: 'Cadenza-style ornaments',                    back: 'Improvised elaborations, especially at fermatas and cadences in concertos — flexible in rhythm' },
]
