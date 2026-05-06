import { PARTS } from '@/app/learn/_data/parts'
import { LearnIndex } from '@/components/learn/LearnIndex'

/**
 * /learn — the redesigned Learn index.
 *
 * Pulls part + lesson data from the topic tree (via `_data/parts.ts`)
 * and renders the frontispiece-and-ledger layout with client-side
 * search. User progress (read state, resume position) isn't wired up
 * yet — empty data is passed so the page degrades gracefully.
 *
 * When a reading-progress source lands (Supabase table, MDX frontmatter,
 * etc.), populate `read` and `resume` here.
 */
export default function LearnLandingPage() {
  const read = new Set<string>()
  const resume = null
  const currentSlug = null

  return (
    <LearnIndex
      parts={PARTS}
      resume={resume}
      read={read}
      currentSlug={currentSlug}
    />
  )
}
