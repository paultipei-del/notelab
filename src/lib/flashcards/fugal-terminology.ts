import { Card } from '../types'

// Fugal Terminology — Tier 3 / Form & Structure
// Sequence: the fugue itself, then the ingredients announced in the exposition
// (subject, answer, real vs. tonal, countersubject), then episodes and stretto,
// and finally the pedal point common at the end.
export const FUGAL_TERMINOLOGY_CARDS: Card[] = [
  { id: 1,  type: 'text', front: 'Fugue',                    back: 'A polyphonic composition in which a main theme (the subject) is imitated in successive voices' },
  { id: 2,  type: 'text', front: 'Subject',                  back: 'The main theme of a fugue, announced in the first voice in the tonic' },
  { id: 3,  type: 'text', front: 'Answer',                   back: 'The subject restated in a second voice — typically at the dominant' },
  { id: 4,  type: 'text', front: 'Real answer',              back: 'An exact transposition of the subject to the new key' },
  { id: 5,  type: 'text', front: 'Tonal answer',             back: 'An answer adjusted to stay in the tonic area — certain intervals are altered (often 5ths ↔ 4ths)' },
  { id: 6,  type: 'text', front: 'Countersubject',           back: 'A secondary theme that sounds in another voice against the subject or answer' },
  { id: 7,  type: 'text', front: 'Episode',                  back: 'A passage between subject entries — often sequential, modulatory, or developmental' },
  { id: 8,  type: 'text', front: 'Stretto',                  back: 'Overlapping entries of the subject in different voices — the answer begins before the subject finishes' },
  { id: 9,  type: 'text', front: 'Pedal point (in a fugue)', back: 'A sustained bass note — commonly appears near the end, building tension before the final cadence' },
  { id: 10, type: 'text', front: 'Fugal exposition',         back: 'The opening section — each voice enters in turn with the subject or answer' },
]
