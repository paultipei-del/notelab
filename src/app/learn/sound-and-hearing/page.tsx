import TopicSectionView from '@/components/learn/TopicSectionView'

/**
 * Literal section landing for `/learn/sound-and-hearing`. Required because
 * the `sound-and-hearing/` folder exists to hold subtopic MDX pages, and App
 * Router literal folders take precedence over dynamic `[topic]` siblings
 * without falling through. Delegates to the shared view.
 */
export default function Page() {
  return <TopicSectionView topicSlug="sound-and-hearing" />
}
