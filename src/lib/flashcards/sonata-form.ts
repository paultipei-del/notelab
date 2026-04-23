import { Card } from '../types'

// Sonata Form Sections — Tier 3 / Form & Structure
// Sequence: the three-part overview, then each exposition component (P, S,
// closing), then development, recapitulation, and the optional coda.
export const SONATA_FORM_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Sonata form',         back: 'Classical-era structure — Exposition → Development → Recapitulation' },
  { id: 2, type: 'text', front: 'Exposition',          back: 'Presents the themes — modulates from tonic to dominant (major keys) or relative major (minor keys)' },
  { id: 3, type: 'text', front: 'Primary theme (P)',   back: 'The opening theme, in the tonic key' },
  { id: 4, type: 'text', front: 'Secondary theme (S)', back: 'A contrasting theme in the dominant (major key) or relative major (minor key)' },
  { id: 5, type: 'text', front: 'Closing theme',       back: 'Concludes the exposition — reinforces the new key before the repeat or development' },
  { id: 6, type: 'text', front: 'Development',         back: 'Modulates through remote keys, fragments and transforms themes, builds tension' },
  { id: 7, type: 'text', front: 'Recapitulation',      back: 'Returns to the tonic — both P and S are now restated in the tonic key' },
  { id: 8, type: 'text', front: 'Coda',                back: 'An optional final section that extends the recapitulation and drives to a decisive ending' },
]
