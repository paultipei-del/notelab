import { CM_BUNDLE_PRICE_ID } from '@/lib/decks'

/**
 * Catalog of public-facing programs surfaced on /programs. Adding a new
 * program here is the single source of truth — page.tsx and the
 * marketplace components read from this list, so a new entry
 * automatically appears in the right filter, with the right stripe
 * color, and in the grid.
 *
 * Why a separate file (not in src/lib/programs/, which is per-program
 * curriculum data): that directory holds long-form lesson/question
 * trees specific to each program; this one is the surface-level
 * marketing/marketplace shape.
 */

/** Filter taxonomy. Drives both the chip row on /programs and the
 *  category color stripe on each card. */
export type ProgramCategory = 'foundation' | 'reading' | 'theory' | 'aural'

/** Variant for non-program cards in the grid. */
export type PlaceholderVariant = 'coming-soon' | 'suggest'

export interface ProgramPreviewItem {
  /** Lesson title (or deck name). Wraps to 2 lines on mobile if long. */
  title: string
  /** Item count — "12 questions", "24 cards", or "—" if not yet authored. */
  count: string
}

export interface ProgramStat {
  value: string
  label: string
}

export interface ProgramEntry {
  kind: 'program'
  id: string
  title: string
  href: string
  /** One-of taxonomy bucket. Drives stripe color + filter membership. */
  category: ProgramCategory
  /** Tag label rendered first in the type-tag row. */
  typeTag: string
  /** When true, render in the FeaturedProgramCard slot above the grid
   *  instead of as a regular grid card. Currently CM only. */
  featured?: boolean
  /** Free programs skip the price/owned chip logic. */
  free?: boolean
  /** Stripe Price ID — used for ownership detection. CM uses bundle. */
  priceId: string | null
  /** "From $29" rendered next to the amount on the featured price row.
   *  Single-tier programs use just `priceFrom`. */
  priceFrom?: string
  /** "$199" full-program price; only shown on the featured card. */
  priceFull?: string

  // ── Standard grid card content ──
  /** Italic Cormorant short pitch under the title. Replaces the
   *  current `description` field. */
  pitch: string
  /** Cream-tinted "Includes:" line on the standard grid card. Format
   *  is short fragments separated by ` · ` middle-dot. */
  includes: string

  // ── Featured card content (CM only) ──
  /** ✦-bullet list above the author signature. */
  features?: string[]
  /** Italic Cormorant author/credibility line, hairline-bordered. */
  author?: string
  /** "What's inside · Pre-Level 1" preview-pane label. */
  previewLabel?: string
  /** 5 mini-shelf rows. */
  preview?: ProgramPreviewItem[]
  /** "+ N more · view full Pre-Level 1 →" link target + label. */
  previewMoreHref?: string
  previewMoreLabel?: string
  /** 3-stat row at the bottom of the preview pane. */
  stats?: ProgramStat[]
  /** Sample-lesson CTA on the featured card. */
  sampleHref?: string
  sampleLabel?: string
}

export interface ProgramPlaceholder {
  kind: 'placeholder'
  id: string
  variant: PlaceholderVariant
  /** Eyebrow row above the title — e.g. "COMING SOON" or "HELP US BUILD". */
  eyebrow: string
  title: string
  /** Italic Cormorant body text under the title. */
  body: string
}

export type ProgramCatalogEntry = ProgramEntry | ProgramPlaceholder

/** Lesson 1 of CM Pre-Level 1 — entry point for "Try a sample lesson"
 *  per the spec. Foundational enough that any visitor can engage
 *  without prior context. */
const SAMPLE_LESSON_HREF = '/programs/cm/prep/grand-staff'

/** First 5 lessons of CM Pre-Level 1. Question counts are stable
 *  enough to hard-code; if a lesson hasn't been authored yet, we
 *  show "—" rather than hide the row (the lesson title is still
 *  useful information). Verify counts against
 *  src/lib/programs/cm-prep/questions.ts before shipping. */
const CM_PREP_PREVIEW: ProgramPreviewItem[] = [
  { title: 'The Grand Staff', count: '24 questions' },
  { title: 'Lines and Spaces', count: '20 questions' },
  { title: 'Treble Clef Note Names', count: '28 questions' },
  { title: 'Bass Clef Note Names', count: '28 questions' },
  { title: 'Review: Letter Names', count: '32 questions' },
]

export const PROGRAMS_CATALOG: ProgramCatalogEntry[] = [
  {
    kind: 'program',
    id: 'cm',
    title: 'Certificate of Merit',
    href: '/programs/cm',
    category: 'theory',
    typeTag: 'Curriculum',
    featured: true,
    priceId: CM_BUNDLE_PRICE_ID,
    priceFrom: '$29',
    priceFull: '$199',
    pitch:
      'Complete theory exam preparation from Preparatory through Advanced. Covers signs & terms, scales, intervals, chords, history, and ear training — aligned to the May 2026 MTAC exam.',
    includes: '11 levels · 168 decks · ~6 mo to complete',
    features: [
      'Signs, terms, intervals, scales, chords across all 11 CM levels',
      'Spaced repetition queue plus written-style multiple-choice review',
      'Per-level progress tracking and exam-style mixed quizzes',
    ],
    author:
      'Built by <b>Paul Voia-Tipei</b>, for the students who actually have to play the exam.',
    previewLabel: "What's inside · Pre-Level 1",
    preview: CM_PREP_PREVIEW,
    previewMoreHref: '/programs/cm/prep',
    previewMoreLabel: '+ 6 more · view full Pre-Level 1 →',
    stats: [
      { value: '11', label: 'levels' },
      { value: '168', label: 'decks' },
      { value: '~6 mo', label: 'to complete' },
    ],
    sampleHref: SAMPLE_LESSON_HREF,
    sampleLabel: 'Try a sample lesson',
  },
  {
    kind: 'program',
    id: 'note-reading',
    title: 'Note Reading',
    href: '/programs/note-reading',
    category: 'reading',
    typeTag: 'Reading',
    priceId: null,
    priceFrom: '$29',
    pitch:
      'Nine modules — single-pitch recognition through intervallic and rhythmic reading — for college music students and serious adult learners.',
    includes: '9 modules · audio-paired drills · grand staff to ledger lines',
  },
  {
    kind: 'program',
    id: 'rhythm',
    title: 'Rhythm Reading',
    href: '/programs/rhythm',
    category: 'foundation',
    typeTag: 'Foundation',
    free: true,
    priceId: null,
    pitch:
      'Three structured programs — Fundamentals, Personal Practice, Conservatory Prep — 356 progressive exercises from basic note values through mixed meter and polyrhythm.',
    includes: '356 exercises · metronome-paced · tap-along audio',
  },
  // ── Placeholders ──
  {
    kind: 'placeholder',
    id: 'harmony',
    variant: 'coming-soon',
    eyebrow: 'Coming Soon',
    title: 'Harmony in Practice',
    body: 'Roman numeral analysis, voice leading, and figured bass realisation. Targeting Q4 2026.',
  },
  {
    kind: 'placeholder',
    id: 'aural',
    variant: 'coming-soon',
    eyebrow: 'Coming Soon',
    title: 'Aural Skills',
    body: 'Interval, chord, scale, and dictation drills. Targeting Q1 2027.',
  },
  {
    kind: 'placeholder',
    id: 'score-reading',
    variant: 'coming-soon',
    eyebrow: 'Coming Soon',
    title: 'Score Reading',
    body: 'Multi-staff orchestral and chamber score reading. Targeting Q3 2026.',
  },
  {
    kind: 'placeholder',
    id: 'suggest',
    variant: 'suggest',
    eyebrow: 'Help us build',
    title: "What's missing?",
    body: 'Tell us what curriculum or skill you’d like to see next — every request is read.',
  },
]

/** Category metadata: stripe color + filter chip label. Centralised
 *  so adding a new category requires touching one place. */
export const CATEGORY_META: Record<ProgramCategory, { label: string; stripe: string }> = {
  foundation: { label: 'Foundation', stripe: '#2d5a3e' },
  reading: { label: 'Reading', stripe: '#2a4470' },
  theory: { label: 'Theory', stripe: '#6b4423' },
  aural: { label: 'Aural', stripe: '#8a3a55' },
}

/** Order of filter chips, including the implicit "All". */
export const FILTER_ORDER: (ProgramCategory | 'all')[] = [
  'all',
  'foundation',
  'reading',
  'theory',
  'aural',
]
