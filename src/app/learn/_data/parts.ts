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
  // Add entries here to override the default empty desc / 5 min estimate, or
  // to seed subtitle/body/cards for lessons authored as data (no MDX file).
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
