import { Card } from '../types'

// Build and Transform — Application & Review / Construction
// Multi-step construction problems: build a scale, compute an interval
// between specific degrees, transpose, invert.
export const BUILD_AND_TRANSFORM_CARDS: Card[] = [
  {
    id: 1,
    type: 'text',
    front:
      "1. Write out the E♭ major scale, ascending, with scale-degree numbers.\n2. What is the interval from scale degree 3 to scale degree 7?\n3. If this scale is transposed up a perfect 5th, what is the new tonic?",
    back:
      '1. E♭ (1) – F (2) – G (3) – A♭ (4) – B♭ (5) – C (6) – D (7) – E♭ (8).\n2. Perfect 5th (G up to D: G–A–B–C–D is 5 letter names and a perfect 5th).\n3. B♭ — transposing E♭ up a perfect 5th gives B♭.',
  },
  {
    id: 2,
    type: 'text',
    front:
      "1. Write out the A natural minor scale ascending, with scale-degree numbers.\n2. Convert it to A harmonic minor (which degree changes?).\n3. Convert A harmonic minor to A melodic minor ascending (which additional degree changes?).",
    back:
      '1. A – B – C – D – E – F – G – A (1–8, no sharps or flats).\n2. A harmonic minor: raise the 7th. A – B – C – D – E – F – G♯ – A.\n3. A melodic minor ascending: also raise the 6th. A – B – C – D – E – F♯ – G♯ – A. (Descending melodic minor reverts to natural minor.)',
  },
  {
    id: 3,
    type: 'text',
    front:
      "1. Build a D major triad (root position).\n2. Name its first-inversion and second-inversion bass notes.\n3. If you transpose the triad up a minor 3rd, what is the new chord?",
    back:
      '1. D – F♯ – A.\n2. First inversion: F♯ in bass. Second inversion: A in bass.\n3. F major (D + m3 = F). The transposed chord is F – A – C.',
  },
  {
    id: 4,
    type: 'text',
    front:
      '1. Identify the interval from F♯ up to C.\n2. Identify its inversion.\n3. What is the sum of any interval and its inversion (the "rule of 9")?',
    back:
      '1. Diminished 5th (F♯ – G – A – B – C = 5 letter names; 6 half steps = diminished 5th, i.e. a tritone).\n2. Inverted: C up to F♯ = Augmented 4th (also a tritone).\n3. The two number-names always sum to 9 (5th + 4th), and qualities flip: perfect ↔ perfect, major ↔ minor, augmented ↔ diminished.',
  },
  {
    id: 5,
    type: 'text',
    front:
      "1. Write out the G major scale ascending, with scale-degree numbers.\n2. What is the interval from scale degree 2 to scale degree 6?\n3. Transpose the scale down a perfect 4th. What is the new tonic and key signature?",
    back:
      '1. G (1) – A (2) – B (3) – C (4) – D (5) – E (6) – F♯ (7) – G (8).\n2. Perfect 5th (A up to E).\n3. New tonic: D. New key signature: two sharps (D major — F♯ and C♯). (G down a perfect 4th = D.)',
  },
  {
    id: 6,
    type: 'text',
    front:
      "1. Build a C dominant 7 chord (C7), root position.\n2. Invert the interval C up to B♭ (the chord\'s root-to-seventh).\n3. If C7 resolves as V⁷, what is the tonic key, and what is the typical resolution chord?",
    back:
      '1. C – E – G – B♭.\n2. The original is a minor 7th (C up to B♭, 10 half steps). Inverted (B♭ up to C): Major 2nd (2 half steps). A minor 7th inverts to a major 2nd.\n3. F major. V⁷ in F major is C7; it resolves to F (I).',
  },
  {
    id: 7,
    type: 'text',
    front:
      "1. Transpose a C major triad (C – E – G) up a major 3rd.\n2. Transpose the same triad down a minor 3rd.\n3. What is the relationship between the three keys (original and two transpositions)?",
    back:
      '1. Up a major 3rd: E major (E – G♯ – B).\n2. Down a minor 3rd: A major (A – C♯ – E).\n3. C, E, and A outline an augmented triad\'s root positions — or (more usefully) C and E are a major 3rd apart; C and A are a minor 3rd apart (below C). This is the chromatic mediant network composers use for color shifts.',
  },
  {
    id: 8,
    type: 'text',
    front:
      "1. Write A major\'s key signature (number and names of sharps).\n2. Write A major\'s relative minor.\n3. Write A major\'s parallel minor.",
    back:
      '1. Three sharps: F♯, C♯, G♯.\n2. F♯ minor — same key signature, tonic is scale degree 6 of A major.\n3. A minor — same tonic (A), but with the minor mode (no sharps in its key signature).',
  },
  {
    id: 9,
    type: 'text',
    front:
      "1. Invert a D minor triad (D – F – A). Give both first and second inversions.\n2. What figured-bass symbols correspond to each inversion?\n3. In a 6/4 chord, what chord tone is in the bass?",
    back:
      '1. First inversion: F – A – D (F in bass). Second inversion: A – D – F (A in bass).\n2. First inversion: ⁶ (or ⁶₃). Second inversion: ⁶₄.\n3. The 5th of the chord (e.g., A in a D minor 6/4).',
  },
  {
    id: 10,
    type: 'text',
    front:
      "1. Build a B♭ major scale ascending.\n2. Build the triads on scale degrees I, IV, and V (by name and quality).\n3. What cadential progression uses scale degrees IV–V–I and what is its function?",
    back:
      '1. B♭ – C – D – E♭ – F – G – A – B♭.\n2. I = B♭ major (B♭ – D – F). IV = E♭ major (E♭ – G – B♭). V = F major (F – A – C).\n3. IV – V – I forms a full cadential progression: pre-dominant (IV) → dominant (V) → tonic (I). It is the backbone of countless tonal phrases and produces an authentic cadence from V to I.',
  },
]
