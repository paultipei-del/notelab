import { Card } from '../types'

// Binary & Ternary Forms — Tier 3 / Form & Structure
// Sequence: the two base forms (binary, ternary), then the common variations
// (rounded binary, simple binary), then the D.C.-based ternary and the
// importance of the return in ternary.
export const BINARY_TERNARY_FORMS_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Binary form',          back: 'Two-part form: AB — both sections usually repeated (‖: A :‖: B :‖)' },
  { id: 2, type: 'text', front: 'Ternary form',         back: 'Three-part form: ABA — outer sections are the same, middle contrasts' },
  { id: 3, type: 'text', front: 'Rounded binary',       back: '‖: A :‖: B A′ :‖ — the second half ends with a return of A' },
  { id: 4, type: 'text', front: 'Simple binary',        back: '‖: A :‖: B :‖ — no return of A' },
  { id: 5, type: 'text', front: 'Da capo (D.C.) ternary', back: 'ABA created by playing B, then returning “from the top” to play A again' },
  { id: 6, type: 'text', front: 'Return of A in ternary', back: 'The returning A section may be exact, shortened, or slightly varied — but the same thematic material' },
]
