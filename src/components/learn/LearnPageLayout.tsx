import Link from 'next/link'
import type { ReactNode } from 'react'
import { getTopic, getSubtopic } from '@/lib/learn/topicTree'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

export type PracticeLink = {
  kind: 'flashcard' | 'tool' | 'ear-training' | 'program'
  label: string
  detail?: string
  href: string
}

export type RelatedLink = {
  title: string
  href: string
  blurb?: string
}

export type LearnPageLayoutProps = {
  topic: string          // slug, e.g. 'pitch'
  subtopic: string       // slug, e.g. 'major-key-signatures'
  title: string          // display title for the heading
  oneSentence: string    // the lead paragraph directly under the heading
  children: ReactNode    // the MDX body (sections 2–5 of the template)
  practice: PracticeLink[]
  related: RelatedLink[]
}

const PRACTICE_KIND_LABEL: Record<PracticeLink['kind'], string> = {
  flashcard:     'Flashcards',
  tool:          'Tool',
  'ear-training': 'Ear training',
  program:       'Program',
}

/**
 * Parses /learn/<topic>/<subtopic> from a related.href and checks the tree.
 * Returns whether the target is a published reference page — if not, the link
 * renders as plain text with a "(coming soon)" suffix per spec §5.
 */
function relatedIsPublished(href: string): boolean {
  const match = href.match(/^\/learn\/([^/]+)\/([^/]+)\/?$/)
  if (!match) return false
  const found = getSubtopic(match[1], match[2])
  return !!found && found.subtopic.hasPage
}

export default function LearnPageLayout({
  topic,
  subtopic,
  title,
  oneSentence,
  children,
  practice,
  related,
}: LearnPageLayoutProps) {
  const topicNode = getTopic(topic)
  const topicTitle = topicNode?.title ?? topic

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <article style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 32px 96px' }}>
        {/* Breadcrumb */}
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
          <Link href="/learn" style={{ color: 'inherit', textDecoration: 'none' }}>Learn</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href={`/learn/${topic}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {topicTitle}
          </Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#2A2318' }}>{title}</span>
        </nav>

        {/* Page heading */}
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            color: '#2A2318',
            letterSpacing: '0.02em',
            margin: '0 0 20px 0',
          }}
        >
          {title}
        </h1>

        {/* The one-sentence answer */}
        <p
          style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '20px',
            color: '#4A4540',
            lineHeight: 1.55,
            margin: '0 0 40px 0',
            maxWidth: '640px',
          }}
        >
          {oneSentence}
        </p>

        {/* MDX body — sections 2-5 of the template. The MDX file provides its
            own prose + notation. Typography for headings and paragraphs lives
            in the CSS class below so MDX markdown stays clean. */}
        <div className="nl-learn-prose">
          {children}
        </div>

        {/* Where this connects */}
        {related.length > 0 && (
          <section style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #DDD8CA' }}>
            <h2
              style={{
                fontFamily: F,
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#7A7060',
                margin: '0 0 16px 0',
              }}
            >
              Where this connects
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {related.map(r => {
                const published = relatedIsPublished(r.href)
                return (
                  <li key={r.href} style={{ marginBottom: '10px' }}>
                    {published ? (
                      <Link
                        href={r.href}
                        style={{
                          fontFamily: SERIF,
                          fontWeight: 500,
                          fontSize: '17px',
                          color: ACCENT,
                          textDecoration: 'none',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {r.title} →
                      </Link>
                    ) : (
                      <span
                        style={{
                          fontFamily: SERIF,
                          fontWeight: 400,
                          fontSize: '17px',
                          color: '#9A9081',
                          letterSpacing: '0.01em',
                        }}
                      >
                        {r.title}{' '}
                        <span style={{ fontFamily: F, fontSize: '12px', fontStyle: 'italic', color: '#9A9081' }}>
                          (coming soon)
                        </span>
                      </span>
                    )}
                    {r.blurb && (
                      <span style={{ display: 'block', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060', marginTop: '2px' }}>
                        {r.blurb}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Practice */}
        {practice.length > 0 && (
          <section style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #DDD8CA' }}>
            <h2
              style={{
                fontFamily: F,
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#7A7060',
                margin: '0 0 16px 0',
              }}
            >
              Practice
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {practice.map(p => (
                <li key={p.href} style={{ marginBottom: '12px' }}>
                  <Link
                    href={p.href}
                    style={{
                      display: 'block',
                      padding: '14px 18px',
                      border: '1px solid #DDD8CA',
                      borderRadius: '12px',
                      background: '#FDFAF3',
                      textDecoration: 'none',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontFamily: F,
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: '#7A7060',
                        marginBottom: '4px',
                      }}
                    >
                      {PRACTICE_KIND_LABEL[p.kind]}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: SERIF,
                        fontWeight: 500,
                        fontSize: '18px',
                        color: '#1A1A18',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {p.label}
                      <span style={{ color: ACCENT, marginLeft: '6px' }}>→</span>
                    </span>
                    {p.detail && (
                      <span style={{ display: 'block', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060', marginTop: '2px' }}>
                        {p.detail}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* reference to subtopic slug kept for debuggability; not rendered */}
        <span data-subtopic={subtopic} hidden />
      </article>
    </div>
  )
}
