import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTopic, visibleSubtopics } from '@/lib/learn/topicTree'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

/**
 * Renders a section landing page for a single topic — breadcrumb, title,
 * description, then a list of visible (published) subtopics. Shared by both
 * the dynamic `[topic]/page.tsx` and any literal per-topic wrappers
 * (`pitch/page.tsx`), so the rendering lives in one place.
 */
export default function TopicSectionView({ topicSlug }: { topicSlug: string }) {
  const topic = getTopic(topicSlug)
  if (!topic) notFound()

  const subtopics = visibleSubtopics(topic)

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 64px' }}>
        <nav
          aria-label="Breadcrumb"
          style={{
            fontFamily: F,
            fontSize: '13px',
            fontWeight: 300,
            color: '#7A7060',
            letterSpacing: '0.05em',
            marginBottom: '16px',
          }}
        >
          <Link href="/learn" style={{ color: 'inherit', textDecoration: 'none' }}>
            Learn
          </Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#2A2318' }}>{topic.title}</span>
        </nav>

        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: '#2A2318',
            letterSpacing: '0.02em',
            marginBottom: '12px',
          }}
        >
          {topic.title}
        </h1>
        <p
          style={{
            fontFamily: F,
            fontSize: '15px',
            fontWeight: 300,
            color: '#7A7060',
            lineHeight: 1.7,
            maxWidth: '640px',
            margin: '0 0 40px 0',
          }}
        >
          {topic.description}
        </p>

        {subtopics.length === 0 ? (
          <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#7A7060', fontStyle: 'italic' }}>
            No pages published yet in this section.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {subtopics.map(s => (
              <li key={s.slug} style={{ marginBottom: '12px' }}>
                <Link
                  href={`/learn/${topic.slug}/${s.slug}`}
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 500,
                    fontSize: '20px',
                    color: ACCENT,
                    textDecoration: 'none',
                    letterSpacing: '0.01em',
                  }}
                >
                  {s.title} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
