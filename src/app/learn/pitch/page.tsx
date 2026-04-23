import TopicSectionView from '@/components/learn/TopicSectionView'

/**
 * Literal section landing for `/learn/pitch`. Required because the `pitch/`
 * folder exists to hold subtopic MDX pages, and App Router literal folders
 * take precedence over dynamic `[topic]` siblings without falling through.
 * Delegates to the shared view component.
 */
export default function Page() {
  return <TopicSectionView topicSlug="pitch" />
}
