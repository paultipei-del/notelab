import type { RhythmProgramMeta } from './types'

export const RHYTHM_PROGRAMS: RhythmProgramMeta[] = [
  {
    slug: 'fundamentals',
    title: 'Fundamentals',
    subtitle: 'Core rhythm skills from the ground up',
    description: 'Master the essential building blocks of rhythm reading — note values, rests, ties, dots, and compound meter — through structured, progressive exercises.',
    sort: 1,
    accent: {
      bg: 'rgba(59,109,17,0.22)',
      text: '#7DC44E',
      border: 'rgba(59,109,17,0.35)',
      ctaBg: 'rgba(59,109,17,0.15)',
      gradientGlyphColor: 'rgba(59,109,17,0.14)',
      gradient: 'linear-gradient(145deg, #060A04 0%, #101A08 50%, #182510 100%)',
    },
  },
  {
    slug: 'personal-practice',
    title: 'Personal Practice',
    subtitle: 'Daily reading routines for working musicians',
    description: 'Short, focused drill sessions designed for the practicing musician — build fluency in grooves, syncopation, compound meter, and reading etudes at your own pace.',
    sort: 2,
    accent: {
      bg: 'rgba(59,97,181,0.22)',
      text: '#7DA8E8',
      border: 'rgba(59,97,181,0.35)',
      ctaBg: 'rgba(59,97,181,0.15)',
      gradientGlyphColor: 'rgba(59,97,181,0.14)',
      gradient: 'linear-gradient(145deg, #040610 0%, #080E1E 50%, #101828 100%)',
    },
  },
  {
    slug: 'conservatory-prep',
    title: 'Conservatory Prep',
    subtitle: 'Audition-level rhythmic reading',
    description: 'Advanced rhythmic vocabulary for college auditions and conservatory entrance — syncopation systems, mixed meter, polyrhythm prep, and extended performance etudes.',
    sort: 3,
    accent: {
      bg: 'rgba(186,117,23,0.2)',
      text: '#E8A84A',
      border: 'rgba(186,117,23,0.3)',
      ctaBg: 'rgba(186,117,23,0.15)',
      gradientGlyphColor: 'rgba(186,117,23,0.14)',
      gradient: 'linear-gradient(145deg, #0A0A08 0%, #1E1A10 50%, #2E2618 100%)',
    },
  },
]

export function getRhythmProgram(slug: string): RhythmProgramMeta | undefined {
  return RHYTHM_PROGRAMS.find(p => p.slug === slug)
}

/** Deterministic slug for a category name — used in URL params. */
export function categorySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/** Reverse lookup: given a slug and a list of category names, return the matching name. */
export function categoryNameFromSlug(slug: string, names: string[]): string | undefined {
  return names.find(n => categorySlug(n) === slug)
}
