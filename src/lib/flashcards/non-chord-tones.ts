import { Card } from '../types'

// Non-Chord Tones — Tier 3 / Pitch & Harmony
// Sequence: the umbrella definition, then the stepwise NCTs (passing, neighbor),
// the approached-by-leap NCTs (appoggiatura, escape tone), then held/delayed
// categories (suspension, retardation, anticipation), and finally pedal point.
export const NON_CHORD_TONES_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Non-chord tone (NCT)',        back: 'A note that’s not part of the prevailing chord' },
  { id: 2,  type: 'text', front: 'Passing tone',                back: 'Stepwise motion through an NCT between two different chord tones' },
  { id: 3,  type: 'text', front: 'Neighbor tone',               back: 'Steps away from a chord tone to an NCT, then steps back to the same chord tone' },
  { id: 4,  type: 'text', front: 'Appoggiatura (as NCT)',       back: 'Accented NCT approached by leap and resolved by step' },
  { id: 5,  type: 'text', front: 'Escape tone (échappée)',      back: 'Unaccented NCT approached by step and left by leap in the opposite direction' },
  { id: 6,  type: 'text', front: 'Suspension',                  back: 'A chord tone from the previous chord held over and resolved down by step' },
  { id: 7,  type: 'text', front: 'Retardation',                 back: 'Like a suspension but resolves upward by step' },
  { id: 8,  type: 'text', front: 'Anticipation',                back: 'A chord tone of the next chord arriving early — before that chord changes' },
  { id: 9,  type: 'text', front: 'Pedal point (pedal tone)',    back: 'A sustained pitch, usually in the bass, held through changing harmonies' },
  { id: 10, type: 'text', front: 'Accented vs. unaccented passing tones', back: 'Accented falls on a strong beat; unaccented falls on a weak beat' },
]
