import Link from 'next/link'
import { visibleTopics, visibleSubtopics } from '@/lib/learn/topicTree'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

export default function LearnLandingPage() {
  const topics = visibleTopics()

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 64px' }}>
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
          Learn
        </h1>
        <p
          style={{
            fontFamily: F,
            fontSize: '15px',
            fontWeight: 300,
            color: '#7A7060',
            lineHeight: 1.7,
            maxWidth: '560px',
            margin: '0 0 48px 0',
          }}
        >
          A practical, comprehensive guide to music theory.
        </p>

        {topics.length === 0 ? (
          <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#7A7060', fontStyle: 'italic' }}>
            No reference pages published yet.
          </p>
        ) : (
          topics.map(topic => (
            <section key={topic.slug} style={{ marginBottom: '40px' }}>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  fontSize: '24px',
                  color: '#2A2318',
                  margin: '0 0 6px 0',
                  letterSpacing: '0.01em',
                }}
              >
                <Link href={`/learn/${topic.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {topic.title}
                </Link>
              </h2>
              <p
                style={{
                  fontFamily: F,
                  fontSize: '14px',
                  fontWeight: 300,
                  color: '#7A7060',
                  lineHeight: 1.65,
                  margin: '0 0 12px 0',
                  maxWidth: '620px',
                }}
              >
                {topic.description}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {visibleSubtopics(topic).map(s => (
                  <li key={s.slug} style={{ marginBottom: '6px' }}>
                    <Link
                      href={`/learn/${topic.slug}/${s.slug}`}
                      style={{
                        fontFamily: F,
                        fontSize: '15px',
                        fontWeight: 400,
                        color: ACCENT,
                        textDecoration: 'none',
                      }}
                    >
                      {s.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
