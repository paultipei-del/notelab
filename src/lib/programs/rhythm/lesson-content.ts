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
  // categorySlug('Pulse Games & Meter Basics') === 'pulse-games--meter-basics'
  // (the existing slugifier collapses the ampersand, leaving a double dash —
  // ugly but consistent with other topics like 'core-values--rests').
  'pulse-games--meter-basics': {
    title: 'Pulse and Meter',
    subtitle: 'Where the beat lives, and how it groups.',
    paragraphs: [
      {
        heading: 'What is the pulse?',
        body: 'Pulse is the steady beat that runs underneath every piece of music. If you tap your foot while listening to a song, that\'s the pulse. It doesn\'t change when the rhythm gets complicated — the pulse keeps moving regardless.',
      },
      {
        heading: 'What is meter?',
        body: 'Meter is how we group those pulses. Some music groups beats in twos (march time, 2/4), some in threes (waltz time, 3/4), and most popular music groups them in fours (4/4). The first beat of each group feels the strongest — that\'s the downbeat.',
      },
      {
        heading: 'Reading time signatures',
        body: 'A time signature like 4/4 has two numbers stacked on top of each other. The top number tells you how many beats are in each measure. The bottom number tells you what kind of note gets one beat — a 4 means the quarter note. So 4/4 reads as "four quarter notes per measure."',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll tap quarter notes — one tap per beat — across three time signatures. Start in 4/4, then move to 3/4 (waltz time), then 2/4 (march time). The notes themselves are the same; only the way they group changes.',
      },
    ],
    goalBpm: 80,
    remember: 'The pulse keeps moving. The time signature tells you how to group it.',
  },

  // categorySlug('Quarter/Half/Whole Notes') === 'quarterhalfwhole-notes'
  'quarterhalfwhole-notes': {
    title: 'Note Values',
    subtitle: 'Notes have lengths. The shape tells you how long to hold.',
    paragraphs: [
      {
        heading: 'Quarter, half, whole',
        body: 'These are the three foundational note values you\'ll see most often. A quarter note lasts one beat. A half note lasts two beats. A whole note lasts four beats — a full measure of 4/4. Each one is drawn slightly differently so you can tell them apart at a glance.',
      },
      {
        heading: 'How to read them',
        body: 'Tap once on the start of each note. Then count out loud — "one, two" for a half note, "one, two, three, four" for a whole note — while letting that single tap "ring" through the held beats. The tap doesn\'t happen again until the next note starts.',
      },
      {
        heading: 'Why mixing matters',
        body: 'Music breathes when you alternate short and long notes. A whole note after a string of quarters gives the listener (and you) a place to settle. Reading these mixed values is the foundation of everything else — once you can hold a note for the right number of beats, every other rhythm builds on top.',
      },
      {
        heading: 'What you\'ll practice here',
        body: 'You\'ll start with quarter and half notes in 4/4, then add whole notes, then move the same vocabulary into 3/4. By the end, your hand will know what "two beats" and "four beats" feel like without you having to count.',
      },
    ],
    goalBpm: 80,
    remember: 'Quarter = 1 beat. Half = 2. Whole = 4. Tap once at the start; let it ring.',
  },

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
