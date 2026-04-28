export type CMLevel1LessonTool = 'placeholder-lesson' | 'placeholder-review' | 'placeholder-test'

export interface CMLevel1Lesson {
  slug: string
  number: string // '1'–'13', 'R', or 'T'
  title: string
  subtitle: string
  description: string
  type: 'lesson' | 'review'
  tool: CMLevel1LessonTool
  unlockAfter: string | null
  passingScore: number
}

export const CM_LEVEL1_LESSONS: CMLevel1Lesson[] = [
  {
    slug: 'letter-names-of-notes',
    number: '1',
    title: 'Letter Names of Notes',
    subtitle: 'Treble, bass, and ledger lines',
    description:
      'Learn (and drill) the letter names on both staves, then extend your reading with a small set of ledger-line notes. You’ll practice by naming notes, placing notes on the staff, and identifying a handful of notes beyond the staff.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: null,
    passingScore: 0.8,
  },
  {
    slug: 'sharps-flats-and-naturals',
    number: '2',
    title: 'Sharps, Flats, and Naturals',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 2.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'letter-names-of-notes',
    passingScore: 0.8,
  },
  {
    slug: 'half-steps-and-whole-steps',
    number: '3',
    title: 'Half Steps and Whole Steps',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 3.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'sharps-flats-and-naturals',
    passingScore: 0.8,
  },
  {
    slug: 'intervals',
    number: '4',
    title: 'Intervals',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 4.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'half-steps-and-whole-steps',
    passingScore: 0.8,
  },
  {
    slug: 'an-interval-game',
    number: 'R',
    title: 'An Interval Game',
    subtitle: 'Placeholder review activity',
    description: 'Placeholder review shell for the interval game.',
    type: 'review',
    tool: 'placeholder-review',
    unlockAfter: 'intervals',
    passingScore: 0.75,
  },
  {
    slug: 'major-key-signatures-c-g-d-f',
    number: '5',
    title: 'Major Key Signatures: C, G, D, and F',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 5.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'an-interval-game',
    passingScore: 0.8,
  },
  {
    slug: 'major-scales-c-g-d-f',
    number: '6',
    title: 'Major Scales: C, G, D, and F',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 6.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'major-key-signatures-c-g-d-f',
    passingScore: 0.8,
  },
  {
    slug: 'a-scale-game',
    number: 'R',
    title: 'A Scale Game',
    subtitle: 'Placeholder review activity',
    description: 'Placeholder review shell for the scale game.',
    type: 'review',
    tool: 'placeholder-review',
    unlockAfter: 'major-scales-c-g-d-f',
    passingScore: 0.75,
  },
  {
    slug: 'five-finger-patterns-triads-c-g-f-major-minor',
    number: '7',
    title: 'C, G, and F Major and Minor Five-Finger Patterns and Triads',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 7.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'a-scale-game',
    passingScore: 0.8,
  },
  {
    slug: 'five-finger-patterns-triads-d-a-e-bb-major-minor',
    number: '8',
    title: 'D, A, E, and Bb Major and Minor Five-Finger Patterns and Triads',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 8.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'five-finger-patterns-triads-c-g-f-major-minor',
    passingScore: 0.8,
  },
  {
    slug: 'review-major-minor-five-finger-patterns-triads',
    number: 'R',
    title: 'Review: Major and Minor Five-Finger Patterns and Triads',
    subtitle: 'Placeholder review',
    description: 'Placeholder review shell after Lesson 8.',
    type: 'review',
    tool: 'placeholder-review',
    unlockAfter: 'five-finger-patterns-triads-d-a-e-bb-major-minor',
    passingScore: 0.75,
  },
  {
    slug: 'triads-of-the-scale',
    number: '9',
    title: 'Triads of the Scale',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 9.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'review-major-minor-five-finger-patterns-triads',
    passingScore: 0.8,
  },
  {
    slug: 'primary-triads',
    number: '10',
    title: 'Primary Triads',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 10.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'triads-of-the-scale',
    passingScore: 0.8,
  },
  {
    slug: 'review-words-used-lessons-1-10',
    number: 'R',
    title: 'Review 1: Words Used in Lessons 1–10',
    subtitle: 'Placeholder review',
    description: 'Placeholder review shell for vocabulary used in Lessons 1–10.',
    type: 'review',
    tool: 'placeholder-review',
    unlockAfter: 'primary-triads',
    passingScore: 0.75,
  },
  {
    slug: 'review-lessons-1-10',
    number: 'R',
    title: 'Review 2: Lessons 1–10',
    subtitle: 'Placeholder review',
    description: 'Placeholder review shell for cumulative Lessons 1–10.',
    type: 'review',
    tool: 'placeholder-review',
    unlockAfter: 'review-words-used-lessons-1-10',
    passingScore: 0.75,
  },
  {
    slug: 'time-signatures',
    number: '11',
    title: 'Time Signatures',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 11.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'review-lessons-1-10',
    passingScore: 0.8,
  },
  {
    slug: 'signs-and-terms',
    number: '12',
    title: 'Signs and Terms',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 12.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'time-signatures',
    passingScore: 0.8,
  },
  {
    slug: 'motif-and-repetition',
    number: '13',
    title: 'Motif and Repetition',
    subtitle: 'Placeholder content',
    description: 'Placeholder lesson shell for Level 1 Lesson 13.',
    type: 'lesson',
    tool: 'placeholder-lesson',
    unlockAfter: 'signs-and-terms',
    passingScore: 0.8,
  },
  {
    slug: 'review-lessons-11-13',
    number: 'R',
    title: 'Review: Lessons 11–13',
    subtitle: 'Placeholder review',
    description: 'Placeholder review shell shown after Lesson 13.',
    type: 'review',
    tool: 'placeholder-review',
    unlockAfter: 'motif-and-repetition',
    passingScore: 0.75,
  },
  {
    slug: 'review-test',
    number: 'T',
    title: 'Review Test',
    subtitle: 'Placeholder test',
    description: 'Placeholder comprehensive review test shell for Level 1.',
    type: 'review',
    tool: 'placeholder-test',
    unlockAfter: 'review-lessons-11-13',
    passingScore: 0.8,
  },
]

export function getCMLevel1Lesson(slug: string): CMLevel1Lesson | undefined {
  return CM_LEVEL1_LESSONS.find(l => l.slug === slug)
}

export function getCMLevel1LessonIndex(slug: string): number {
  return CM_LEVEL1_LESSONS.findIndex(l => l.slug === slug)
}

export function nextCMLevel1Lesson(slug: string): CMLevel1Lesson | undefined {
  const idx = getCMLevel1LessonIndex(slug)
  return idx >= 0 ? CM_LEVEL1_LESSONS[idx + 1] : undefined
}

export function prevCMLevel1Lesson(slug: string): CMLevel1Lesson | undefined {
  const idx = getCMLevel1LessonIndex(slug)
  return idx > 0 ? CM_LEVEL1_LESSONS[idx - 1] : undefined
}
