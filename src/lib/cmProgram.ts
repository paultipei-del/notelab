/**
 * Certificate of Merit program data. Single source of truth for level
 * metadata (slug, deck id, tier, price, topic tags, overview copy) and
 * bundle offers — consumed by /programs/cm, /programs/cm/[slug], and the
 * entitlement system.
 */

export type CMTier = 'elementary' | 'intermediate' | 'advanced'

export type CMLevel = {
  /** URL slug used in /programs/cm/[slug]. */
  slug: string
  /** Display name (e.g. "Level 3" or "Preparatory"). */
  label: string
  /** Deck id in src/lib/decks.ts. */
  deckId: string
  tier: CMTier
  /** One-time purchase price for this single level. */
  price: number
  /** Short comma-separated topic keywords shown on the level card. */
  topicKeywords: string
  /**
   * "For students with..." one-line description shown on the level page.
   * Derived from MTAC syllabus intent, not deck data.
   */
  whoFor: string
  /**
   * Topics breakdown for the overview "What's covered" section. One entry
   * per topic area. Card counts are approximate estimates drawn from deck
   * content proportions — they don't need to sum exactly to deck total.
   */
  topics: Array<{ name: string; blurb: string }>
}

export const CM_LEVELS: CMLevel[] = [
  {
    slug: 'preparatory',
    label: 'Preparatory',
    deckId: 'cm-prep',
    tier: 'elementary',
    price: 29,
    topicKeywords: 'signs & terms · note reading · five-finger patterns · basic scales & chords',
    whoFor: 'For first-time CM students. No prior theory experience required.',
    topics: [
      { name: 'Signs & Terms', blurb: 'Essential dynamic, tempo, and articulation markings.' },
      { name: 'Note Reading', blurb: 'Treble and bass clef within the staff.' },
      { name: 'Scales & Chords', blurb: 'C, G, F major scales and their tonic triads.' },
      { name: 'Rhythm', blurb: 'Basic note values and simple time signatures.' },
    ],
  },
  {
    slug: 'level-1',
    label: 'Level 1',
    deckId: 'cm-level1',
    tier: 'elementary',
    price: 29,
    topicKeywords: 'signs & terms · note reading · intervals · rhythm · scales · chords · ear training',
    whoFor: 'For beginning students with a few months of instrument study.',
    topics: [
      { name: 'Signs & Terms', blurb: 'Expanding the basic terminology set.' },
      { name: 'Intervals', blurb: 'Recognizing melodic and harmonic 2nds through 5ths.' },
      { name: 'Scales', blurb: 'C, G, F major — scale degrees and spelling.' },
      { name: 'Rhythm', blurb: 'Simple meters in 2/4, 3/4, 4/4.' },
      { name: 'Ear Training', blurb: 'Hearing major vs. minor triads by ear.' },
    ],
  },
  {
    slug: 'level-2',
    label: 'Level 2',
    deckId: 'cm-level2',
    tier: 'elementary',
    price: 29,
    topicKeywords: 'cadences · minor scales · new keys · sequences',
    whoFor: 'Builds on Level 1 — adds cadences, minor scales, and more keys.',
    topics: [
      { name: 'Cadences', blurb: 'Authentic and plagal cadences.' },
      { name: 'Minor Scales', blurb: 'A natural minor and its relative major.' },
      { name: 'New Keys', blurb: 'D, A, Bb, Eb major key signatures.' },
      { name: 'Sequences', blurb: 'Melodic and harmonic sequences identified.' },
    ],
  },
  {
    slug: 'level-3',
    label: 'Level 3',
    deckId: 'cm-level3',
    tier: 'intermediate',
    price: 29,
    topicKeywords: 'triad inversions · perfect & major intervals · signs & terms',
    whoFor: 'For students with at least a year of theory. First-inversion analysis and more intervals.',
    topics: [
      { name: 'Triad Inversions', blurb: 'Root, first, and second inversions.' },
      { name: 'Intervals', blurb: 'Perfect 4ths, 5ths, 8ves and major 2nds, 3rds, 6ths, 7ths.' },
      { name: 'Signs & Terms', blurb: 'New terms for ornamentation and expression.' },
      { name: 'Ear Training', blurb: 'Identifying triad qualities by ear.' },
    ],
  },
  {
    slug: 'level-4',
    label: 'Level 4',
    deckId: 'cm-level4',
    tier: 'intermediate',
    price: 29,
    topicKeywords: 'Roman numerals · minor & diminished intervals · history',
    whoFor: 'Introduces Roman-numeral analysis and minor/diminished intervals.',
    topics: [
      { name: 'Roman Numerals', blurb: 'Scale degrees labelled with I, ii, iii, IV, V, vi, vii°.' },
      { name: 'Intervals', blurb: 'Minor and diminished intervals added.' },
      { name: 'Music History', blurb: 'Introductory composer and period identification.' },
    ],
  },
  {
    slug: 'level-5',
    label: 'Level 5',
    deckId: 'cm-level5',
    tier: 'intermediate',
    price: 29,
    topicKeywords: 'all major keys · figured bass · dominant 7th · ornaments · history',
    whoFor: 'Rounds out the major-key system and introduces the dominant 7th.',
    topics: [
      { name: 'All Major Keys', blurb: 'Every major key signature and its tonic.' },
      { name: 'Figured Bass', blurb: 'Basic figured-bass symbols.' },
      { name: 'V⁷ Chord', blurb: 'Constructing and identifying the dominant 7th.' },
      { name: 'Ornaments', blurb: 'Trills, turns, mordents, grace notes.' },
    ],
  },
  {
    slug: 'level-6',
    label: 'Level 6',
    deckId: 'cm-level6',
    tier: 'intermediate',
    price: 29,
    topicKeywords: 'melodic minor · augmented & diminished intervals · deceptive cadence · modulation',
    whoFor: 'The three minor-scale forms and the deceptive cadence.',
    topics: [
      { name: 'Melodic Minor', blurb: 'Ascending vs. descending melodic minor.' },
      { name: 'Intervals', blurb: 'Augmented and diminished qualities.' },
      { name: 'Deceptive Cadence', blurb: 'V → vi substitution.' },
      { name: 'Modulation', blurb: 'Introductory modulation concepts.' },
    ],
  },
  {
    slug: 'level-7',
    label: 'Level 7',
    deckId: 'cm-level7',
    tier: 'advanced',
    price: 29,
    topicKeywords: 'circle of fifths · modes · diminished 7th · sonata form',
    whoFor: 'Upper-intermediate theory: modes, diminished 7ths, and sonata form.',
    topics: [
      { name: 'Circle of Fifths', blurb: 'Key relationships all the way around.' },
      { name: 'Modes', blurb: 'The seven diatonic modes.' },
      { name: 'Diminished 7th Chord', blurb: 'Fully diminished and half-diminished.' },
      { name: 'Sonata Form', blurb: 'Exposition, development, recapitulation.' },
    ],
  },
  {
    slug: 'level-8',
    label: 'Level 8',
    deckId: 'cm-level8',
    tier: 'advanced',
    price: 29,
    topicKeywords: 'seven modes · secondary dominants · pivot chords · polyphony',
    whoFor: 'Advanced harmonic analysis — secondary dominants and modulation by pivot.',
    topics: [
      { name: 'Modes', blurb: 'Deeper mode work — transposition and identification.' },
      { name: 'Secondary Dominants', blurb: 'V/V, V/vi, V/IV and resolutions.' },
      { name: 'Pivot Chords', blurb: 'Common-chord modulation technique.' },
      { name: 'Polyphonic Texture', blurb: 'Reading multiple independent voices.' },
    ],
  },
  {
    slug: 'level-9',
    label: 'Level 9',
    deckId: 'cm-level9',
    tier: 'advanced',
    price: 29,
    topicKeywords: 'baroque dances · fugue structure · 7th chords · Impressionism',
    whoFor: 'Form-focused: Baroque suites, fugue architecture, and Impressionism.',
    topics: [
      { name: 'Baroque Suite', blurb: 'Allemande, courante, sarabande, gigue.' },
      { name: 'Fugue', blurb: 'Subject, answer, countersubject, stretto.' },
      { name: '7th Chords', blurb: 'All five qualities and their contexts.' },
      { name: 'Impressionism', blurb: 'Debussy, Ravel — harmonic and textural features.' },
    ],
  },
  {
    slug: 'advanced',
    label: 'Advanced',
    deckId: 'cm-advanced',
    tier: 'advanced',
    price: 29,
    topicKeywords: 'fugue analysis · non-harmonic tones · serialism · compositional technique',
    whoFor: 'The capstone level — fugue analysis and 20th-century techniques.',
    topics: [
      { name: 'Fugue Analysis', blurb: 'Complete fugue structural analysis.' },
      { name: 'Non-Harmonic Tones', blurb: 'Passing, neighbor, suspension, appoggiatura, and more.' },
      { name: 'Serialism', blurb: '12-tone technique and row analysis.' },
      { name: 'Compositional Technique', blurb: 'Advanced analysis across eras.' },
    ],
  },
]

export type CMBundle = {
  id: string
  title: string
  subtitle: string
  /** Slugs of included levels. */
  levelSlugs: string[]
  price: number
  /** Savings vs. buying all levels individually at their per-level price. */
  savings: number
  /** Short contents line shown on the bundle card. */
  contentsSummary: string
  tagline: string
}

export const CM_BUNDLES: CMBundle[] = [
  {
    id: 'cm-elementary',
    title: 'Elementary Bundle',
    subtitle: 'Preparatory + Level 1 + Level 2',
    levelSlugs: ['preparatory', 'level-1', 'level-2'],
    price: 69,
    savings: 18,
    contentsSummary: '3 levels included',
    tagline: 'Start here if you’re new to CM.',
  },
  {
    id: 'cm-intermediate',
    title: 'Intermediate Bundle',
    subtitle: 'Levels 3–6',
    levelSlugs: ['level-3', 'level-4', 'level-5', 'level-6'],
    price: 99,
    savings: 17,
    contentsSummary: '4 levels included',
    tagline: 'Build your core theory.',
  },
  {
    id: 'cm-advanced',
    title: 'Advanced Bundle',
    subtitle: 'Levels 7–9 + Advanced',
    levelSlugs: ['level-7', 'level-8', 'level-9', 'advanced'],
    price: 99,
    savings: 17,
    contentsSummary: '4 levels included',
    tagline: 'Exam-ready prep.',
  },
  {
    id: 'cm-full',
    title: 'Full CM Program',
    subtitle: 'All 11 levels',
    levelSlugs: CM_LEVELS.map(l => l.slug),
    price: 199,
    savings: 120,
    contentsSummary: '11 levels · lifetime access',
    tagline: 'Lifetime access to everything.',
  },
]

export const TIER_ORDER: CMTier[] = ['elementary', 'intermediate', 'advanced']
export const TIER_LABEL: Record<CMTier, string> = {
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}
export const TIER_DESCRIPTION: Record<CMTier, string> = {
  elementary:
    'Foundation levels for first-time CM students and early musicians. Basic notation, rhythm, and simple keys.',
  intermediate:
    'Expanding theory — major and minor keys, intervals, triads, and introductory analysis. For students with a year or more of foundational training.',
  advanced:
    'Sophisticated harmonic analysis, advanced aural skills, and historical period identification. For upper-intermediate through exam-ready students.',
}

export function getLevelBySlug(slug: string): CMLevel | undefined {
  return CM_LEVELS.find(l => l.slug === slug)
}

export function levelsInBundle(bundleId: string): CMLevel[] {
  const bundle = CM_BUNDLES.find(b => b.id === bundleId)
  if (!bundle) return []
  return bundle.levelSlugs
    .map(s => getLevelBySlug(s))
    .filter((l): l is CMLevel => !!l)
}

export function bundleForTier(tier: CMTier): CMBundle | undefined {
  if (tier === 'elementary') return CM_BUNDLES.find(b => b.id === 'cm-elementary')
  if (tier === 'intermediate') return CM_BUNDLES.find(b => b.id === 'cm-intermediate')
  return CM_BUNDLES.find(b => b.id === 'cm-advanced')
}
