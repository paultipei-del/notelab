import { Card } from '../types'

export const CM_LEVEL7_CARDS: Card[] = [
  // ── SIGNS AND TERMS (Level 7 additions) ──
  { id: 101, type: 'text', front: 'Alberti bass', back: 'An accompaniment figure in the left hand using a three-pitch chord played lowest, highest, middle, highest — common in Classical period' },
  { id: 102, type: 'text', front: 'Allargando / allarg.', back: 'Gradually broader, slower, and usually fuller in tone — often at a climax' },
  { id: 103, type: 'text', front: 'Canon', back: 'A strict form of contrapuntal writing where each voice imitates the melody of the first voice exactly' },
  { id: 104, type: 'text', front: 'Con fuoco', back: 'With fire, force' },
  { id: 105, type: 'text', front: 'Development (sonata form)', back: 'Themes are developed through key changes and compositional devices — new material may appear' },
  { id: 106, type: 'text', front: 'Dorian mode', back: 'Half steps between notes 2-3 and 6-7 — like playing all white keys from D to D' },
  { id: 107, type: 'text', front: 'Exposition (sonata form)', back: 'Two contrasting themes — often ends in the dominant key or relative major' },
  { id: 108, type: 'text', front: 'Giocoso', back: 'Humorously, jokingly' },
  { id: 109, type: 'text', front: 'Grazioso', back: 'Gracefully' },
  { id: 110, type: 'text', front: 'Ionian mode', back: 'Half steps between notes 3-4 and 7-8 — identical to the major scale' },
  { id: 111, type: 'text', front: 'Lento', back: 'Slow tempo — not as slow as Largo' },
  { id: 112, type: 'text', front: 'Meno', back: 'Less (e.g. meno mosso = with less motion, slower)' },
  { id: 113, type: 'text', front: 'Meno mosso', back: 'With less motion — slower' },
  { id: 114, type: 'text', front: 'Mixolydian mode', back: 'Half steps between notes 3-4 and 6-7 — like playing all white keys from G to G' },
  { id: 115, type: 'text', front: 'Pesante', back: 'Heavily, ponderously' },
  { id: 116, type: 'text', front: 'Più', back: 'More (e.g. più mosso = more motion, faster)' },
  { id: 117, type: 'text', front: 'Più mosso', back: 'More motion — faster' },
  { id: 118, type: 'text', front: 'Rallentando / rall.', back: 'Gradually slower — similar to ritardando' },
  { id: 119, type: 'text', front: 'Recapitulation (sonata form)', back: 'The expositional material returns in the tonic key — typically ends in the tonic' },
  { id: 120, type: 'text', front: 'Ritenuto', back: 'Immediately slower — a sudden (not gradual) slowing down' },
  { id: 121, type: 'text', front: 'Sempre', back: 'Always (e.g. sempre legato = always smooth)' },
  { id: 122, type: 'text', front: 'Senza', back: 'Without (e.g. senza pedal = without pedal)' },
  { id: 123, type: 'text', front: 'Sonata form (Sonata-Allegro form)', back: 'Three sections: Exposition (themes) → Development (elaboration) → Recapitulation (return of themes in tonic)' },
  { id: 124, type: 'text', front: 'Whole tone scale', back: 'A six-note scale consisting entirely of whole steps — no half steps anywhere' },
  { id: 125, type: 'text', front: 'Aeolian mode', back: 'Half steps between notes 2-3 and 5-6 — identical to the natural minor scale' },

  // ── CIRCLE OF FIFTHS ──
  { id: 201, type: 'text', front: 'Circle of fifths', back: 'A diagram showing all 12 major and minor keys arranged by the number of sharps and flats — clockwise = sharps, counterclockwise = flats' },
  { id: 202, type: 'text', front: 'Enharmonic keys', back: 'Keys that sound the same but are spelled differently — e.g. F# major and Gb major' },

  // ── CHORDS ──
  { id: 301, type: 'text', front: 'Diminished 7th chord (º7)', back: 'A four-note chord built entirely of minor 3rds — very tense, equally spaced, can resolve in four ways' },
  { id: 302, type: 'text', front: 'Chord progression i-iv-iiº⁶-V-i', back: 'Common minor key progression — Tonic, Subdominant, diminished supertonic (1st inv.), Dominant, Tonic' },
  { id: 303, type: 'text', front: 'Chord progression I-IV-ii-V⁷-vi', back: 'Major key progression ending on the submediant — the deceptive cadence ending' },

  // ── HISTORY ──
  { id: 401, type: 'text', front: 'Telemann', back: 'Baroque period — German composer, prolific writer of baroque keyboard and orchestral music' },
  { id: 402, type: 'text', front: 'Haydn', back: 'Classical period — Austrian composer, "Father of the Symphony" and string quartet' },
  { id: 403, type: 'text', front: 'Beethoven', back: 'Classical/Romantic — German composer, bridges Classical and Romantic periods; known for piano sonatas and symphonies' },
  { id: 404, type: 'text', front: 'Grieg', back: 'Romantic period — Norwegian composer, known for piano music with folk influences' },
  { id: 405, type: 'text', front: 'Prokofiev', back: '20th/21st Century — Russian composer, known for piano works, ballets, and film scores' },
  { id: 406, type: 'text', front: 'Baroque characteristics', back: 'Polyphonic texture, use of ornamentation, dance suites, terraced dynamics (p/f), limited expression marks' },
  { id: 407, type: 'text', front: 'Classical characteristics', back: 'Homophonic texture predominates, clear cadence points, Alberti bass, multi-movement sonata/sonatina form' },
  { id: 408, type: 'text', front: 'Romantic characteristics', back: 'Programmatic music with descriptive titles, colorful harmonies, more chromaticism, lyrical melodies' },
  { id: 409, type: 'text', front: '20th/21st Century characteristics', back: 'Atonality, bitonality, polytonality; irregular and changing time signatures; more polyphonic texture; return to older forms' },

  // ── EAR TRAINING ──
  { id: 501, type: 'text', front: 'Alberti bass vs. ostinato (ear training)', back: 'Alberti bass = low-high-middle-high pattern | Ostinato = any short pattern repeated persistently' },
  { id: 502, type: 'text', front: 'Giocoso vs. Doloroso (ear training)', back: 'Giocoso = humorous, joking | Doloroso = sad, sorrowful' },
  { id: 503, type: 'text', front: 'Grazioso vs. Con fuoco (ear training)', back: 'Grazioso = gracefully | Con fuoco = with fire and force' },
  { id: 504, type: 'text', front: 'All four triad qualities (ear training)', back: 'Major = bright | Minor = dark | Diminished = tense, collapsed | Augmented = tense, expanded' },
]
