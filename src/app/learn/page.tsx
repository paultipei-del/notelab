import Link from 'next/link'
import { visibleTopics, visibleSubtopics } from '@/lib/learn/topicTree'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

export default function LearnLandingPage() {
  const topics = visibleTopics()

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
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
            maxWidth: '640px',
            margin: '0 0 28px 0',
          }}
        >
          Eleven parts covering music theory from sound itself to advanced harmony. Read straight through, or dip in wherever you are. Parts I–III are foundational; most others can be read independently.
        </p>

        {/* Start here callout */}
        <div
          style={{
            border: '1px solid #D9CFAE',
            borderRadius: '12px',
            background: '#ECE3CC',
            padding: '16px 20px',
            marginBottom: '48px',
            maxWidth: '640px',
          }}
        >
          <p
            style={{
              fontFamily: F,
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#7A7060',
              margin: '0 0 6px 0',
            }}
          >
            New to music theory?
          </p>
          <p
            style={{
              fontFamily: F,
              fontSize: '14px',
              fontWeight: 300,
              color: '#2A2318',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Start with{' '}
            <Link href="/learn/sound-and-hearing" style={{ color: ACCENT, textDecoration: 'none', fontWeight: 400 }}>
              Part I (Sound and How We Hear It)
            </Link>
            , or jump straight to{' '}
            <Link href="/learn/reading-and-notation" style={{ color: ACCENT, textDecoration: 'none', fontWeight: 400 }}>
              Part II (Reading and Writing Music)
            </Link>{' '}
            if you already know what sound is.
          </p>
        </div>

        {topics.length === 0 ? (
          <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#7A7060', fontStyle: 'italic' }}>
            No reference pages published yet.
          </p>
        ) : (
          topics.map(topic => (
            <section key={topic.slug} style={{ marginBottom: '40px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  margin: '0 0 6px 0',
                }}
              >
                <h2
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: '24px',
                    color: '#2A2318',
                    margin: 0,
                    letterSpacing: '0.01em',
                  }}
                >
                  <Link href={`/learn/${topic.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {topic.romanNumeral}. {topic.title}
                  </Link>
                </h2>
                <span
                  style={{
                    fontFamily: F,
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#9A9081',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {topic.tier}
                </span>
              </div>
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
                      {s.title}
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
