// Allow named exports from MDX files. The default `.d.ts` shipped via
// `@types/mdx` only declares a default export, but our lesson MDX files
// export a `learnPage` object alongside the rendered component. This
// declaration adds typed access to that named export so the lesson-deck
// registry (src/lib/learn/lessonDecks.ts) can import it directly.

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { LessonPageData } from '@/lib/learn/lessonDecks'

  export const learnPage: LessonPageData & {
    practice?: unknown[]
    related?: unknown[]
    [key: string]: unknown
  }

  const Component: ComponentType<Record<string, unknown>>
  export default Component
}
