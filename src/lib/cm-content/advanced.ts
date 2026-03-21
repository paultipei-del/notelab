import { Card } from '../types'

export const CM_ADVANCED_CARDS: Card[] = [
  // ── ADVANCED VOCABULARY ──
  { id: 101, type: 'text', front: 'Answer (fugue)', back: 'The subject restated in another key, often the dominant — alternates with subject in different voices' },
  { id: 102, type: 'text', front: 'Real answer (fugue)', back: 'An answer with the exact same intervallic relationship as the original subject' },
  { id: 103, type: 'text', front: 'Tonal answer (fugue)', back: 'An answer with slightly different intervals to maintain the sense of tonality' },
  { id: 104, type: 'text', front: 'Atonality', back: 'A style of composition that avoids a tonal center — no home key' },
  { id: 105, type: 'text', front: 'Bitonality', back: 'The use of two keys (tonalities) simultaneously' },
  { id: 106, type: 'text', front: 'Polytonality', back: 'The use of two or more keys simultaneously' },
  { id: 107, type: 'text', front: 'Countersubject (fugue)', back: 'A melody in the first voice that continues against the subject as other voices enter — may recur throughout' },
  { id: 108, type: 'text', front: 'Episode (fugue)', back: 'Passages between subject entries — uses motivic material from subject/countersubject; may include modulation, sequence, diminution, augmentation' },
  { id: 109, type: 'text', front: 'Exposition (fugue)', back: 'The opening section where each voice states the subject — ends at the first cadence' },
  { id: 110, type: 'text', front: 'Subject (fugue)', back: 'The short melody that opens the fugue in the first voice, usually in tonic key — imitated by all voices' },
  { id: 111, type: 'text', front: 'Stretto (fugue)', back: 'The overlapping of subjects and answers — the answer begins before the subject is completed' },
  { id: 112, type: 'text', front: 'Melodic inversion', back: 'Each ascending interval becomes its corresponding descending interval — the melody is flipped upside down' },
  { id: 113, type: 'text', front: 'Retrograde', back: 'The theme or melody reversed — first note becomes last, second becomes second-to-last, etc.' },
  { id: 114, type: 'text', front: 'Retrograde inversion', back: 'The order of notes is reversed AND the direction of each interval is altered — both retrograde and inversion combined' },
  { id: 115, type: 'text', front: 'Rondo form', back: 'Multi-sectional form with a principal theme (A) that returns between contrasting sections (B, C) — e.g. ABACA or ABACABA' },
  { id: 116, type: 'text', front: 'Serialism', back: 'Composition based on a fixed succession (row) of pitches, rhythms, or other elements — repeated to provide structure' },
  { id: 117, type: 'text', front: 'Sonata structure', back: 'Three movements: Fast (sonata form) → Slow (ABA, related key) → Fast (rondo, theme & variations, or sonata form)' },
  { id: 118, type: 'text', front: 'Theme and variations', back: 'A musical form with a theme followed by varied versions — may differ in harmony, melody, rhythm, key, texture, or tempo' },
  { id: 119, type: 'text', front: 'Twelve-tone row', back: 'All twelve chromatic pitches arranged in a specific order by the composer — used as the basis for a serial composition' },
  { id: 120, type: 'text', front: 'Quartal harmony', back: 'Harmony based on combinations of the interval of the 4th — not built in 3rds like traditional triads' },
  { id: 121, type: 'text', front: 'Tertian harmony', back: 'Harmony built on combinations of the interval of a 3rd — triads, 7th chords, 9th, 11th, 13th chords — most traditional tonal music' },

  // ── NON-HARMONIC TONES ──
  { id: 201, type: 'text', front: 'Non-harmonic tone', back: 'A note that does not belong to the current chord — creates tension that usually resolves' },
  { id: 202, type: 'text', front: 'Passing tone', back: 'A nonharmonic tone that passes stepwise between chord tones of two different chords' },
  { id: 203, type: 'text', front: 'Suspension', back: 'A chord tone held beyond the next chord change, then resolved after the new chord occurs' },
  { id: 204, type: 'text', front: 'Anticipation', back: 'A chord tone presented immediately before the actual chord — anticipates the next harmony' },
  { id: 205, type: 'text', front: 'Upper and lower neighbor tones', back: 'Nonharmonic tones that step above or below a chord tone and then return to it' },

  // ── FUGUE STRUCTURE ──
  { id: 301, type: 'text', front: 'Fugue — number of voices', back: 'Usually 3 or 4 voices — each voice enters with the subject in succession' },
  { id: 302, type: 'text', front: 'Fugue — subject', back: 'Stated alone at the opening in the tonic key — the main theme of the fugue' },
  { id: 303, type: 'text', front: 'Fugue — answer', back: 'The subject in a different voice, usually in the dominant key' },
  { id: 304, type: 'text', front: 'Stretto vs. episode (fugue)', back: 'Stretto = overlapping subject entries | Episode = passage between subject entries using motivic fragments' },

  // ── HISTORY ──
  { id: 401, type: 'text', front: 'Britten', back: '20th/21st Century — British composer' },
  { id: 402, type: 'text', front: 'Copland', back: '20th/21st Century — American composer, known for incorporating jazz and folk elements' },
  { id: 403, type: 'text', front: 'Baroque Fugue vs. Classical Sonata (advanced)', back: 'Fugue = polyphonic, subject imitated, no clear key change plan | Sonata = homophonic, contrasting themes, moves to dominant/relative key in exposition' },
  { id: 404, type: 'text', front: 'Baroque vs. Romantic periods (ear training)', back: 'Baroque = terraced dynamics, polyphonic, ornamental | Romantic = large dynamic range, lyrical melodies, chromatic harmonies' },
]
