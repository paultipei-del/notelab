/**
 * Per-topic lesson content for the rhythm program. Each entry drives the
 * Concept page (and optionally Listen / Check) for one topic — keyed by
 * the canonical category slug (`categorySlug(category.name)` from
 * `@/lib/programs/rhythm/config`).
 *
 * Topics not listed here fall back to a generic "no concept yet" placeholder
 * on the concept page. As you add curriculum content, append entries here.
 */

export interface ConceptParagraph {
  /** Optional small heading shown above the paragraph. */
  heading?: string
  /** Paragraph body text. Plain prose; no inline markdown rendering for now. */
  body: string
}

export interface LessonConcept {
  /** Big serif title at the top of the concept page. */
  title: string
  /** One-line subtitle below the title (the "what you'll learn" pitch). */
  subtitle: string
  /** Body paragraphs — written in teaching voice, ~2–4 short paragraphs total. */
  paragraphs: ConceptParagraph[]
  /** Tempo (BPM) the topic targets at mastery. Drives the goal-tempo display + check threshold. */
  goalBpm: number
  /** Optional ID of an exercise to use as the visual notation example on the concept page.
   * Falls back to the first exercise of the topic if not specified. */
  exampleExerciseId?: string
  /** A reminder line shown at the bottom of the concept page — like a "remember this" cue. */
  remember?: string
}

const CONCEPTS: Record<string, LessonConcept> = {
  'basic-rests': {
    title: 'Basic Rests',
    subtitle: 'Silence is a rhythm too — learning to hold a beat without playing it.',
    paragraphs: [
      {
        heading: 'What is a rest?',
        body: 'A rest is a pause. It looks different from a note, but it has a length, just like a note does. A quarter rest takes up one beat. A half rest takes up two beats. A whole rest takes up four beats — a full bar in 4/4.',
      },
      {
        heading: 'Why rests matter',
        body: 'Music isn\'t just sound. The space between sounds shapes the rhythm. A rhythm with quarter notes on every beat feels relentless; the same rhythm with rests on beats 2 and 4 feels open and breathable. Reading rests well is half of reading rhythm.',
      },
      {
        heading: 'How to count them',
        body: 'Count out loud while you tap. In 4/4, count "one, two, three, four." When a beat has a note, you tap and say the number. When a beat has a rest, you say the number but don\'t tap. The pulse keeps moving in your head; only the tapping stops.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with quarter rests on the strong beats (1 and 3) alternating with quarter notes on the weak beats (2 and 4). From there you\'ll layer in half rests, whole rests, and patterns that mix all three.',
      },
    ],
    goalBpm: 80,
    remember: 'A rest has a length. Count it like a note, but don\'t tap.',
  },
}

/** Look up the lesson concept for a topic slug, or null if no concept is configured. */
export function getLessonConcept(categorySlug: string): LessonConcept | null {
  return CONCEPTS[categorySlug] ?? null
}

/** Topics that have a configured concept — used to decide whether to show "Lesson" CTAs. */
export function hasLessonConcept(categorySlug: string): boolean {
  return categorySlug in CONCEPTS
}
