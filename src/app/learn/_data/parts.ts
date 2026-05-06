/**
 * Data layer for the redesigned Learn index.
 *
 * Derived from the existing `TOPIC_TREE` so MDX content stays the source
 * of truth and route slugs match the existing `/learn/<topic>/<slug>`
 * lessons. Per-lesson `desc` and `minutes` aren't tracked in the topic
 * tree yet — sensible defaults are filled in here. The user can refine
 * these by editing the `LESSON_META` map below (or wire up to MDX
 * frontmatter later) without touching the layout components.
 */

import { TOPIC_TREE, type LearnTier } from '@/lib/learn/topicTree'

export type Tier = 'Foundations' | 'Plus'

export type FlashCard = { q: string; a: string }

export type LessonBodySection =
  | { kind: 'prose'; id: string; heading: string; html: string }
  | { kind: 'wave';  id: string; heading: string; html: string }

export type Lesson = {
  slug: string
  name: string
  desc: string
  minutes: number
  subtitle?: string
  body?: LessonBodySection[]
  cards?: FlashCard[]
}

export type Part = {
  num: string
  slug: string
  title: string
  tier: Tier
  epigraph: string
  image?: string
  lessons: Lesson[]
}

interface LessonMeta {
  desc?: string
  minutes?: number
  subtitle?: string
  body?: LessonBodySection[]
  cards?: FlashCard[]
}

/**
 * Per-lesson supplemental metadata. Keyed by `<topicSlug>/<lessonSlug>`.
 */
const LESSON_META: Record<string, LessonMeta> = {
  // Test/preview slug routed through the new dynamic lesson view. No MDX file
  // exists for this slug, so /learn/sound-and-hearing/lesson-design-preview
  // hits the [topic]/[lessonSlug]/page.tsx dynamic route.
  'sound-and-hearing/lesson-design-preview': {
    desc: 'New lesson reading view — preview',
    minutes: 6,
    subtitle:
      'Before pitch, before harmony, before notation — there is just air, vibrating.',
    body: [
      {
        kind: 'prose',
        id: 'intuition',
        heading: 'The intuition',
        html: `
          <p>When something vibrates — a guitar string, a drumhead, the vocal cords in your throat — it pushes against the air around it. Those pushes ripple outward as waves of slightly denser and slightly thinner air, traveling until they reach your ears. Your eardrum, a thin membrane, moves in response to those pressure changes, and your brain translates the movement into what we call <em>sound</em>.</p>
          <p>That's all sound is, at its root: a pattern of air pressure changing over time. Everything we'll talk about in music — pitch, harmony, rhythm, timbre — comes from this simple physical fact.</p>
        `,
      },
      {
        kind: 'wave',
        id: 'shape',
        heading: 'The shape of a vibration',
        html: `
          <p>Plot air pressure against time and you get a wave. The simplest is a <em>sine wave</em>: a clean, repeating cycle that rises and falls smoothly. Two numbers describe it: how quickly it repeats (frequency) and how far it swings from rest (amplitude).</p>
          <p>Drag the slider below to feel how frequency changes the wave. Faster repetition means a higher pitch; the same shape, just compressed in time.</p>
        `,
      },
      {
        kind: 'prose',
        id: 'frequency',
        heading: 'Frequency &amp; pitch',
        html: `
          <p>Frequency is measured in <em>hertz</em> (Hz) — cycles per second. A 440 Hz tone vibrates the air four hundred and forty times every second. We hear higher frequencies as higher pitches; lower frequencies as lower pitches.</p>
          <p>Human hearing roughly spans 20 Hz at the low end to 20,000 Hz at the high end, and the relationship between frequency and our sensation of pitch is logarithmic, not linear — doubling the frequency raises the pitch by exactly one <em>octave</em>.</p>
        `,
      },
      {
        kind: 'prose',
        id: 'amplitude',
        heading: 'Amplitude &amp; loudness',
        html: `
          <p>Amplitude is how far the wave swings from its resting position. A bigger swing means more pressure displacement, which we hear as a louder sound. Loudness, like pitch, is logarithmic — that's why we measure it in decibels.</p>
          <p>Frequency and amplitude are independent: a quiet high note and a loud high note share a pitch but differ in amplitude.</p>
        `,
      },
      {
        kind: 'prose',
        id: 'why',
        heading: 'Why this matters',
        html: `
          <p>Every distinction music makes — between two notes, two instruments, two performances — eventually traces back to differences in the underlying waveform. Holding the wave in mind, even loosely, gives you a foothold for everything that follows.</p>
        `,
      },
    ],
    cards: [
      { q: 'What is sound, physically?',         a: 'A pattern of air pressure changing over time.' },
      { q: 'What does frequency measure?',       a: 'How many cycles of the wave occur per second — measured in hertz (Hz).' },
      { q: 'What does amplitude measure?',       a: 'How far the wave swings from rest — corresponds to loudness.' },
      { q: 'Doubling the frequency does what?',  a: 'Raises the pitch by exactly one octave.' },
      { q: 'Roughly what range can humans hear?', a: 'About 20 Hz to 20,000 Hz.' },
    ],
  },
  'sound-and-hearing/what-sound-is': {
    desc: 'Vibration, frequency, amplitude',
    minutes: 6,
    subtitle:
      'Before pitch, before harmony, before notation — there is just air, vibrating.',
    body: [
      {
        kind: 'prose',
        id: 'intuition',
        heading: 'The intuition',
        html: `
          <p>When something vibrates — a guitar string, a drumhead, the vocal cords in your throat — it pushes against the air around it. Those pushes ripple outward as waves of slightly denser and slightly thinner air, traveling until they reach your ears. Your eardrum, a thin membrane, moves in response to those pressure changes, and your brain translates the movement into what we call <em>sound</em>.</p>
          <p>That's all sound is, at its root: a pattern of air pressure changing over time. Everything we'll talk about in music — pitch, harmony, rhythm, timbre — comes from this simple physical fact.</p>
        `,
      },
      {
        kind: 'wave',
        id: 'shape',
        heading: 'The shape of a vibration',
        html: `
          <p>Plot air pressure against time and you get a wave. The simplest is a <em>sine wave</em>: a clean, repeating cycle that rises and falls smoothly. Two numbers describe it: how quickly it repeats (frequency) and how far it swings from rest (amplitude).</p>
          <p>Drag the slider below to feel how frequency changes the wave. Faster repetition means a higher pitch; the same shape, just compressed in time.</p>
        `,
      },
      {
        kind: 'prose',
        id: 'frequency',
        heading: 'Frequency &amp; pitch',
        html: `
          <p>Frequency is measured in <em>hertz</em> (Hz) — cycles per second. A 440 Hz tone vibrates the air four hundred and forty times every second. We hear higher frequencies as higher pitches; lower frequencies as lower pitches.</p>
          <p>Human hearing roughly spans 20 Hz at the low end to 20,000 Hz at the high end, and the relationship between frequency and our sensation of pitch is logarithmic, not linear — doubling the frequency raises the pitch by exactly one <em>octave</em>.</p>
        `,
      },
      {
        kind: 'prose',
        id: 'amplitude',
        heading: 'Amplitude &amp; loudness',
        html: `
          <p>Amplitude is how far the wave swings from its resting position. A bigger swing means more pressure displacement, which we hear as a louder sound. Loudness, like pitch, is logarithmic — that's why we measure it in decibels.</p>
          <p>Frequency and amplitude are independent: a quiet high note and a loud high note share a pitch but differ in amplitude.</p>
        `,
      },
      {
        kind: 'prose',
        id: 'why',
        heading: 'Why this matters',
        html: `
          <p>Every distinction music makes — between two notes, two instruments, two performances — eventually traces back to differences in the underlying waveform. Holding the wave in mind, even loosely, gives you a foothold for everything that follows.</p>
        `,
      },
    ],
    cards: [
      { q: 'What is sound, physically?',         a: 'A pattern of air pressure changing over time.' },
      { q: 'What does frequency measure?',       a: 'How many cycles of the wave occur per second — measured in hertz (Hz).' },
      { q: 'What does amplitude measure?',       a: 'How far the wave swings from rest — corresponds to loudness.' },
      { q: 'Doubling the frequency does what?',  a: 'Raises the pitch by exactly one octave.' },
      { q: 'Roughly what range can humans hear?', a: 'About 20 Hz to 20,000 Hz.' },
    ],
  },
}

const DEFAULT_LESSON_MINUTES = 5

function compressTier(tier: LearnTier): Tier {
  return tier === 'Foundations' ? 'Foundations' : 'Plus'
}

export const PARTS: Part[] = TOPIC_TREE.map(topic => ({
  num: topic.romanNumeral,
  slug: topic.slug,
  title: topic.title,
  tier: compressTier(topic.tier),
  epigraph: topic.description,
  lessons: topic.subtopics
    .filter(s => s.hasPage)
    .map(s => {
      const meta = LESSON_META[`${topic.slug}/${s.slug}`] ?? {}
      return {
        slug: s.slug,
        name: s.title,
        desc: meta.desc ?? '',
        minutes: meta.minutes ?? DEFAULT_LESSON_MINUTES,
        subtitle: meta.subtitle,
        body: meta.body,
        cards: meta.cards,
      }
    }),
}))

// Lowercase alias to match the prompt's import style.
export const parts = PARTS

export function findLesson(allParts: Part[], partSlug: string, lessonSlug: string) {
  const partIndex = allParts.findIndex(p => p.slug === partSlug)
  if (partIndex < 0) return null
  const part = allParts[partIndex]
  const lessonIndex = part.lessons.findIndex(l => l.slug === lessonSlug)
  if (lessonIndex < 0) return null

  const flat = allParts.flatMap(p => p.lessons.map(l => ({ part: p, lesson: l })))
  const courseIndex = flat.findIndex(
    x => x.lesson.slug === lessonSlug && x.part.slug === partSlug,
  )

  const prev = flat[courseIndex - 1] ?? null
  const next = flat[courseIndex + 1] ?? null

  return {
    part,
    partIndex,
    lesson: part.lessons[lessonIndex],
    lessonIndex,
    courseIndex,
    courseTotal: flat.length,
    prev,
    next,
  }
}
