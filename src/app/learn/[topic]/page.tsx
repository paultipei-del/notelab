import TopicSectionView from '@/components/learn/TopicSectionView'

type Params = Promise<{ topic: string }>

/**
 * Dynamic section landing. Handles any topic slug whose folder doesn't exist
 * as a literal sibling of this dynamic route. Literal topic folders (e.g.
 * `pitch/` which holds the major-key-signatures MDX) need their own `page.tsx`
 * wrapper because App Router literal folders take precedence over dynamic
 * siblings and don't fall through.
 */
export default async function Page({ params }: { params: Params }) {
  const { topic } = await params
  return <TopicSectionView topicSlug={topic} />
}
