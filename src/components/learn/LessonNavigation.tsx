import Link from 'next/link'
import {
  getPrevLesson,
  getNextLesson,
  getCurrentLesson,
} from '@/lib/learn/curriculum'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface LessonNavigationProps {
  /** Topic slug, e.g. 'reading-and-notation'. */
  topic: string
  /** Lesson slug within the topic. */
  slug: string
}

interface CardProps {
  href: string
  direction: 'prev' | 'next'
  title: string
  /** Chapter name shown only when crossing chapter boundaries. */
  showChapter: string | null
}

function NavCard({ href, direction, title, showChapter }: CardProps) {
  const isPrev = direction === 'prev'
  return (
    <Link
      href={href}
      className="nl-lesson-nav-card"
      style={{
        display: 'block',
        padding: '20px 22px',
        border: '1px solid #DDD8CA',
        borderRadius: 12,
        background: '#FDFAF3',
        textDecoration: 'none',
        color: 'inherit',
        textAlign: isPrev ? 'left' : 'right',
        transition: 'background 150ms ease, border-color 150ms ease',
      }}
    >
      <div
        style={{
          fontFamily: F,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#7A7060',
          marginBottom: 6,
        }}
      >
        {isPrev ? '← Previous' : 'Next →'}
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: 20,
          color: '#1A1A18',
          letterSpacing: '0.01em',
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
      {showChapter && (
        <div
          style={{
            fontFamily: F,
            fontSize: 12,
            fontWeight: 300,
            color: '#9A9081',
            marginTop: 6,
            fontStyle: 'italic',
          }}
        >
          {showChapter}
        </div>
      )}
    </Link>
  )
}

export function LessonNavigation({ topic, slug }: LessonNavigationProps) {
  const current = getCurrentLesson(topic, slug)
  const prev = getPrevLesson(topic, slug)
  const next = getNextLesson(topic, slug)

  if (!prev && !next) return null

  const currentChapter = current?.chapter ?? null
  const prevShowChapter =
    prev && prev.chapter !== currentChapter ? prev.chapter : null
  const nextShowChapter =
    next && next.chapter !== currentChapter ? next.chapter : null

  return (
    <>
      <nav
        aria-label="Lesson navigation"
        className="nl-lesson-nav"
        style={{
          marginTop: 40,
          paddingTop: 32,
          borderTop: '1px solid #DDD8CA',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {prev ? (
          <NavCard
            href={`/learn/${prev.topic}/${prev.slug}`}
            direction="prev"
            title={prev.title}
            showChapter={prevShowChapter}
          />
        ) : (
          <div />
        )}
        {next ? (
          <NavCard
            href={`/learn/${next.topic}/${next.slug}`}
            direction="next"
            title={next.title}
            showChapter={nextShowChapter}
          />
        ) : (
          <div />
        )}
      </nav>
      <style>{`
        .nl-lesson-nav-card:hover {
          background: #F5EFDF !important;
          border-color: #C9C0AE !important;
        }
        @media (max-width: 600px) {
          .nl-lesson-nav {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}
