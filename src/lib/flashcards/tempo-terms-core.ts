import { Card } from '../types'

// Tempo Terms — Core — Tier 2 / Notation & Terms
// Italian tempo terms common to standard repertoire (Bach, Clementi, Chopin,
// Schumann, Mozart, Debussy, etc.). Alphabetical within the deck — SM-2
// handles learning order.
// Source: src/lib/cm-content/reference/glossary-italian.json
export const TEMPO_TERMS_CORE_CARDS: Card[] = [
  { id: 1, type: 'text', front: 'Adagio', back: 'slow and stately' },
  { id: 2, type: 'text', front: 'Allegretto', back: 'moderately fast, lighter than Allegro' },
  { id: 3, type: 'text', front: 'Allegro', back: 'fast and bright' },
  { id: 4, type: 'text', front: 'Andante', back: 'at a walking pace' },
  { id: 5, type: 'text', front: 'Andantino', back: 'slightly faster than Andante' },
  { id: 6, type: 'text', front: 'Grave', back: 'very slow and solemn' },
  { id: 7, type: 'text', front: 'Largo', back: 'very slow and broad' },
  { id: 8, type: 'text', front: 'Lento', back: 'slow' },
  { id: 9, type: 'text', front: 'Moderato', back: 'at a moderate speed' },
  { id: 10, type: 'text', front: 'Presto', back: 'very fast' },
  { id: 11, type: 'text', front: 'Prestissimo', back: 'as fast as possible' },
  { id: 12, type: 'text', front: 'Vivace', back: 'lively and fast' },
]
