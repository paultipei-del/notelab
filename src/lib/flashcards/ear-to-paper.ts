import { Card } from '../types'

// Ear to Paper — Application & Review / Applied Listening
// Bridges ear training and theory: the prompt describes what a listener
// would hear, and the answer reasons through Roman numerals, cadences,
// intervals in harmonic context, and basic melodic dictation inference.
export const EAR_TO_PAPER_CARDS: Card[] = [
  {
    id: 1,
    type: 'text',
    front:
      'You hear a four-chord progression in C major. Bass line: C → G → A → F. Soprano line: E → D → C → C. All chords are in root position.\n\n1. Identify each chord by Roman numeral and quality.\n2. What kind of cadence occurs between the last two chords?\n3. Is this progression typical or atypical?',
    back:
      '1. I (C major) — V (G major) — vi (A minor) — IV (F major).\n2. vi → IV is not a standard named cadence on its own; in context it functions as a plagal-like motion. The full progression is the famous I-V-vi-IV (the "Axis" progression).\n3. Extremely typical. I-V-vi-IV underlies thousands of pop/rock songs from the 1950s forward.',
  },
  {
    id: 2,
    type: 'text',
    front:
      'You hear a two-chord cadence in G major. Bass moves D → G. Soprano moves F♯ → G. Both chords are in root position.\n\n1. Identify each chord by Roman numeral.\n2. What cadence is this?\n3. What scale-degree tendency is at play in the soprano?',
    back:
      '1. V (D major) → I (G major).\n2. Perfect Authentic Cadence (PAC) — V → I with scale degree 1 in the soprano and both chords in root position.\n3. The leading tone (F♯, scale degree 7) resolves up by step to the tonic (G, scale degree 1). Strong upward tendency.',
  },
  {
    id: 3,
    type: 'text',
    front:
      'You hear a melodic interval: two notes played in succession. The first is a C4; the second is an F♯4. Ascending.\n\n1. What is the interval by number and quality?\n2. What nickname does this interval have?\n3. Name a famous melody that opens with this interval ascending.',
    back:
      '1. Augmented 4th (C to F♯ is 6 half steps; 4 letter names).\n2. Tritone ("three whole tones") — also called "the devil in music" historically.\n3. "Maria" from West Side Story opens with an ascending tritone.',
  },
  {
    id: 4,
    type: 'text',
    front:
      'You hear a triad played harmonically (all three notes at once). The pitches are C, E♭, and G♭.\n\n1. What is the root?\n2. What is the quality?\n3. What is the interval from root to the top note?',
    back:
      '1. C.\n2. Diminished (minor 3rd + minor 3rd stacked).\n3. Diminished 5th (C to G♭ = 6 half steps = tritone, spelled as a 5th).',
  },
  {
    id: 5,
    type: 'text',
    front:
      'You hear a four-bar melody in D major, 4/4. Each bar has four quarter notes. The melody outlines: D-F♯-A-D | G-B-D-G | A-C♯-E-A | D-F♯-A-D.\n\n1. What chord does each bar outline?\n2. What is the progression in Roman numerals?\n3. Is this a complete phrase?',
    back:
      '1. Bar 1: D major (I). Bar 2: G major (IV). Bar 3: A major (V). Bar 4: D major (I).\n2. I – IV – V – I.\n3. Yes — it\'s the classic primary-chord phrase ending in a perfect authentic cadence (V → I with scale degree 1 on top).',
  },
  {
    id: 6,
    type: 'text',
    front:
      'You hear an 8-bar period in F major. The first 4 bars end on a C major chord with scale degree 2 on top. The second 4 bars end on an F major chord with scale degree 1 on top.\n\n1. What cadence ends the antecedent?\n2. What cadence ends the consequent?\n3. Classify the period (parallel/contrasting).',
    back:
      '1. Half Cadence — antecedent ends on V (C major, the dominant of F major).\n2. Perfect Authentic Cadence — consequent ends on I (F major) with scale degree 1 in soprano.\n3. Need more information about whether the openings match, but the cadence structure (HC + PAC) is the signature of a period.',
  },
  {
    id: 7,
    type: 'text',
    front:
      'You hear a seventh chord played harmonically on C: the pitches sound C, E, G, and B♭.\n\n1. What quality seventh chord is this?\n2. What scale degree does this chord typically appear on in a major key, and with what Roman numeral?\n3. What creates the characteristic tritone inside this chord?',
    back:
      '1. Dominant 7 (major triad + minor 7th).\n2. It typically appears on scale degree 5 (V) — e.g., G7 in C major, which is G-B-D-F. Built on C, the dominant 7 suggests C7 is V⁷ in F major.\n3. The tritone between the 3rd and the 7th — E and B♭ are a tritone apart (6 half steps), producing the chord\'s strong pull to resolve.',
  },
  {
    id: 8,
    type: 'text',
    front:
      'You hear a cadence in E minor. The two final chords: B major → E minor (a melodic figure ends with D♯ resolving up to E on top).\n\n1. Why is the V chord major rather than minor?\n2. What is the cadence name?\n3. What would the progression look like using natural minor only?',
    back:
      '1. Because harmonic minor raises the 7th scale degree (D to D♯), producing a major V chord with D♯ as its 3rd — restoring the leading tone needed for the cadence.\n2. Perfect Authentic Cadence (V → i) in minor.\n3. v → i — using D natural, the V chord would be minor (B minor), producing a weak, modal-sounding cadence without a true leading tone.',
  },
  {
    id: 9,
    type: 'text',
    front:
      'You hear a 2-bar gesture in 4/4: beats 1-and-2-and-3-and-4-and, but the accents fall on "and-1" and "and-3" (the weak halves of beats 1 and 3), not on the beats themselves.\n\n1. What rhythmic effect is this?\n2. What style of music typically uses this emphasis pattern heavily?\n3. How might this be notated on the page (hint: what notational device crosses a beat)?',
    back:
      '1. Syncopation — stress on weak beats or off-beats rather than strong beats.\n2. Jazz, funk, Latin music, and reggae use syncopation heavily. Most African-diasporic popular music relies on it.\n3. Ties — a note that begins on an off-beat and extends via a tie into the next beat is a common way to notate syncopation.',
  },
  {
    id: 10,
    type: 'text',
    front:
      'You hear a short 3-chord progression in A minor: A minor → D minor → E major. Each chord in root position.\n\n1. Identify each chord by Roman numeral.\n2. What scale form is the E major chord drawn from (natural, harmonic, or melodic minor)?\n3. What typically comes next in this progression, and what is that cadence called?',
    back:
      '1. i (A minor) — iv (D minor) — V (E major).\n2. Harmonic minor — the 7th is raised (G → G♯) so V is major rather than minor.\n3. Next typically: i (A minor). i – iv – V – i is a complete phrase ending with a perfect authentic cadence.',
  },
]
