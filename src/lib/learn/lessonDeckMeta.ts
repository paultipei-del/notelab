// Tiny leaf module shared between `LearnPageLayout` (which renders lesson
// pages) and `lessonDecks.ts` (which imports those pages' MDX exports).
// Keeping the shared bits free of MDX imports breaks the dependency cycle:
//   page.mdx → LearnPageLayout → lessonDecks → page.mdx ✗
// Now:
//   page.mdx → LearnPageLayout → lessonDeckMeta ✓
//   lessonDecks → lessonDeckMeta + page.mdx ✓

export interface LessonFlashCard {
  q: string
  a: string
}

export interface LessonPageData {
  topic: string
  subtopic: string
  title: string
  flashcards?: LessonFlashCard[]
}

export function lessonDeckId(topicSlug: string, subtopicSlug: string): string {
  return `lesson-${topicSlug}-${subtopicSlug}`
}
