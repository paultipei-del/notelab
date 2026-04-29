// src/lib/learn/curriculum.ts
//
// Linear-order view over the topic tree, used for previous/next lesson
// navigation on /learn lesson pages. The order is derived from TOPIC_TREE
// so it stays in sync with the Learn index automatically — adding a
// subtopic in topicTree.ts adds it here too.

import { TOPIC_TREE } from './topicTree'

export interface LessonRef {
  /** URL slug, e.g. 'the-staff'. */
  slug: string
  /** URL prefix segment (parent topic slug), e.g. 'reading-and-notation'. */
  topic: string
  /** Display title shown in the navigation. */
  title: string
  /** Chapter/topic display name, shown when crossing chapter boundaries. */
  chapter: string
}

/**
 * The full curriculum in linear reading order. Includes only subtopics with
 * `hasPage: true` so prev/next never points to a 404.
 */
export const CURRICULUM: LessonRef[] = TOPIC_TREE.flatMap(topic =>
  topic.subtopics
    .filter(s => s.hasPage)
    .map(subtopic => ({
      slug: subtopic.slug,
      topic: topic.slug,
      title: subtopic.title,
      chapter: topic.title,
    })),
)

export function findLessonIndex(topic: string, slug: string): number {
  return CURRICULUM.findIndex(l => l.topic === topic && l.slug === slug)
}

export function getCurrentLesson(topic: string, slug: string): LessonRef | null {
  const i = findLessonIndex(topic, slug)
  return i >= 0 ? CURRICULUM[i] : null
}

export function getPrevLesson(topic: string, slug: string): LessonRef | null {
  const i = findLessonIndex(topic, slug)
  if (i <= 0) return null
  return CURRICULUM[i - 1]
}

export function getNextLesson(topic: string, slug: string): LessonRef | null {
  const i = findLessonIndex(topic, slug)
  if (i < 0 || i >= CURRICULUM.length - 1) return null
  return CURRICULUM[i + 1]
}
