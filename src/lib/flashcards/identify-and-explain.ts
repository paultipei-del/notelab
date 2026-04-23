import { Card } from '../types'

// Identify and Explain — Application & Review / Reading & Analysis
// Multi-part cards that present a short phrase and ask the student to
// identify key, cadence, and phrase function in one go. Presented as text
// prompts (notation descriptions in words) so the card format stays simple
// and portable across study modes.
export const IDENTIFY_AND_EXPLAIN_CARDS: Card[] = [
  {
    id: 1,
    type: 'text',
    front:
      "A 4-measure phrase in G major, 4/4. Progression: I – V – I – V – I. Melody ends on scale degree 1, bass ends on G.\n\n1. What is the key?\n2. What is the cadence at the end?\n3. Is this phrase an antecedent or a consequent?",
    back:
      '1. G major (one sharp, F♯; final chord is a G major triad in root position).\n2. Perfect Authentic Cadence (V → I with scale degree 1 in the soprano and both chords in root position).\n3. Consequent — a PAC is conclusive; antecedents typically end on a half cadence or IAC.',
  },
  {
    id: 2,
    type: 'text',
    front:
      "A 4-measure phrase in D minor, 3/4. Progression: i – iv – V – ?. Final chord is A major (V) with scale degree 2 on top.\n\n1. What is the key?\n2. What is the cadence at the end?\n3. Is this phrase an antecedent or a consequent?",
    back:
      '1. D minor (one flat, B♭; raised 7th C♯ appears in V).\n2. Half Cadence — the phrase ends on V (A major), not resolving to i.\n3. Antecedent — half cadences are inconclusive and typically open a period, expecting a consequent to answer.',
  },
  {
    id: 3,
    type: 'text',
    front:
      "A 4-measure phrase in F major, 4/4. Progression: I – IV – I – IV – I. Melody moves by step; final bass is F.\n\n1. What is the key?\n2. What is the cadence at the end?\n3. Classify the cadence type (authentic, half, plagal, deceptive).",
    back:
      '1. F major (one flat, B♭).\n2. Plagal Cadence (IV → I — the "amen" cadence).\n3. Plagal.',
  },
  {
    id: 4,
    type: 'text',
    front:
      "A 4-measure phrase in C major. Progression: I – IV – V – vi. The listener expects a resolution to I after V but is surprised by vi.\n\n1. What is the cadence at the end?\n2. Why is it called that?\n3. What would the chord have been if this were an authentic cadence?",
    back:
      '1. Deceptive Cadence (V → vi).\n2. Because the listener\'s expectation of V → I is "deceived" by the substitution of vi for I.\n3. I (C major) — an authentic cadence resolves V to I.',
  },
  {
    id: 5,
    type: 'text',
    front:
      "A short piece in A major has an 8-measure opening: measures 1–4 end on E major (V), measures 5–8 begin like measures 1–4 but end on A major (I) with scale degree 1 in the soprano.\n\n1. What is the form of this 8-measure unit?\n2. Name the cadence at measure 4.\n3. Name the cadence at measure 8.",
    back:
      '1. A parallel period — two phrases with matching openings and contrasting cadences.\n2. Half Cadence (ends on V).\n3. Perfect Authentic Cadence (V → I, root position, scale degree 1 in soprano).',
  },
  {
    id: 6,
    type: 'text',
    front:
      "A piece has two clearly marked sections with repeat signs: ||: A :||: B :||. A modulates from the tonic to the dominant; B returns to the tonic.\n\n1. What form is this?\n2. What key relationship is typical for A → B → end?\n3. Is this the same as ternary form?",
    back:
      '1. Binary form (two-part structure with repeats).\n2. A: tonic → dominant; B: dominant → (exploration) → tonic.\n3. No. Ternary form has three clear sections (A-B-A) with the opening A literally returning; binary form has two sections, and B does not restate A — it just returns to the home key.',
  },
  {
    id: 7,
    type: 'text',
    front:
      "A piece in E♭ major, 4/4, ends its final phrase with this progression: ii⁶ – V⁷ – I. Melody ends on scale degree 1.\n\n1. What is the cadence?\n2. What is the function of ii⁶ in this progression?\n3. What key-signature alteration confirms E♭ major?",
    back:
      '1. Perfect Authentic Cadence (V⁷ → I with scale degree 1 on top).\n2. ii⁶ is a pre-dominant — it prepares V. First inversion smooths bass motion into V.\n3. Three flats (B♭, E♭, A♭).',
  },
  {
    id: 8,
    type: 'text',
    front:
      "A short movement labels its outer sections A and its middle section B. The A sections are identical; B contrasts in key (moves to the parallel minor) and character.\n\n1. What form is this?\n2. What harmonic relationship does the B section have to A?\n3. What marking might indicate the return of A without being written out?",
    back:
      '1. Ternary form (A-B-A).\n2. Parallel minor (same tonic, different mode — e.g., A major → A minor).\n3. D.C. al Fine — "from the beginning to the end marker" — sends the performer back to A without restating it on the page.',
  },
  {
    id: 9,
    type: 'text',
    front:
      "A 4-measure phrase in B♭ major, 2/4. The phrase begins on an upbeat before measure 1. Progression: V – I – IV – I.\n\n1. What is the key?\n2. What is the term for a note that begins before beat 1?\n3. What is the cadence at the end?",
    back:
      '1. B♭ major (two flats, B♭ and E♭).\n2. Anacrusis (also called an upbeat or pickup).\n3. Plagal Cadence (IV → I).',
  },
  {
    id: 10,
    type: 'text',
    front:
      "A phrase ends with a minor chord on V moving to a minor i. The piece is in D minor using only natural-minor scale pitches.\n\n1. What cadence is this, and why is it weaker than a standard V – i?\n2. What scale modification would strengthen it?\n3. Name the resulting raised pitch.",
    back:
      '1. A "modal" or weak authentic cadence — v → i. The dominant is minor because natural minor\'s 7th is not raised, so there is no leading tone.\n2. Using harmonic minor (raising the 7th) turns v into V, restoring the leading tone and creating a true V → i perfect authentic cadence.\n3. C♯ (the raised 7th of D minor).',
  },
]
