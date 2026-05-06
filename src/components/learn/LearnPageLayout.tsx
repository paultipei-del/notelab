import Link from 'next/link'
import type { ReactNode } from 'react'
import { getTopic } from '@/lib/learn/topicTree'
import { PARTS, findLesson } from '@/app/learn/_data/parts'
import { LessonPosLine } from './LessonPosLine'
import { AutoTOC } from './AutoTOC'
import { lessonDeckId, type LessonFlashCard } from '@/lib/learn/lessonDeckMeta'
import styles from './learn.module.css'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

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
  topic: string
  subtopic: string
  title: string
  oneSentence: string
  children: ReactNode
  practice: PracticeLink[]
  related: RelatedLink[]
  /**
   * Optional Q/A pairs authored alongside the lesson prose. When non-empty
   * AND the lesson is registered in `LESSON_DECKS`, a Practice link to the
   * auto-generated lesson deck is prepended automatically.
   */
  flashcards?: LessonFlashCard[]
}

const PRACTICE_KIND_LABEL: Record<PracticeLink['kind'], string> = {
  flashcard:     'Flashcards',
  tool:          'Tool',
  'ear-training': 'Ear training',
  program:       'Program',
}

function relatedIsPublished(href: string): boolean {
  const match = href.match(/^\/learn\/([^/]+)\/([^/]+)\/?$/)
  if (!match) return false
  const topicNode = getTopic(match[1])
  if (!topicNode) return false
  const sub = topicNode.subtopics.find(s => s.slug === match[2])
  return !!sub && sub.hasPage
}

export default function LearnPageLayout({
  topic,
  subtopic,
  title,
  oneSentence,
  children,
  practice,
  related,
  flashcards,
}: LearnPageLayoutProps) {
  const found = findLesson(PARTS, topic, subtopic)

  // Auto-prepend a Practice link to the lesson's own deck when flashcards
  // are authored. Skip when an entry for the same href already exists, so
  // adding flashcards never duplicates a hand-curated link.
  const lessonDeckHref = `/study/${lessonDeckId(topic, subtopic)}`
  const practiceWithLessonDeck: PracticeLink[] =
    flashcards && flashcards.length > 0 && !practice.some(p => p.href === lessonDeckHref)
      ? [
          {
            kind: 'flashcard' as const,
            label: `${title} — Concept Review`,
            detail: `${flashcards.length} card${flashcards.length === 1 ? '' : 's'} from this lesson`,
            href: lessonDeckHref,
          },
          ...practice,
        ]
      : practice

  const partLabel = found ? `Part ${ROMAN[found.partIndex] ?? found.partIndex + 1}` : ''
  const partRoman = found ? (ROMAN[found.partIndex] ?? `${found.partIndex + 1}`) : ''

  return (
    <div className={styles.page}>
      {/* Sticky chrome — prev/next buttons + part progress, blends with site header */}
      {found && (
        <div className={styles.chrome}>
          <LessonPosLine
            partLabel={partLabel}
            partTitle={found.part.title}
            lessonIndexInPart={found.lessonIndex + 1}
            lessonsInPart={found.part.lessons.length}
            courseIndex={found.courseIndex + 1}
            courseTotal={found.courseTotal}
            prev={found.prev ? {
              name: found.prev.lesson.name,
              href: `/learn/${found.prev.part.slug}/${found.prev.lesson.slug}`,
            } : null}
            next={found.next ? {
              name: found.next.lesson.name,
              href: `/learn/${found.next.part.slug}/${found.next.lesson.slug}`,
            } : null}
          />
        </div>
      )}

      {/* Floating "back to part" tab on the left edge */}
      {found && (
        <Link
          href={`/learn#part-${found.partIndex}`}
          className={styles.gutterTab}
          title={`Back to ${partLabel} contents`}
        >
          <span className={styles.gutterRoman}>{partRoman}</span>
          <span className={styles.gutterLabel}>{partLabel}</span>
        </Link>
      )}

      {/* Right-rail "On this page" auto-built from MDX h2 headings */}
      <AutoTOC containerSelector=".nl-learn-prose" />

      <main className={styles.stage}>
        <div className={styles.col}>
          <h1 className={styles.lessonTitle}>{title}</h1>
          <p className={styles.lessonSubtitle}>{oneSentence}</p>

          {/* MDX body */}
          <div className={`${styles.lessonProse} nl-learn-prose`}>
            {children}
          </div>

          {/* Where this connects */}
          {related.length > 0 && (
            <section style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #E5DCC0' }}>
              <h2
                style={{
                  fontFamily: F,
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.18em',
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
          {practiceWithLessonDeck.length > 0 && (
            <section style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #E5DCC0' }}>
              <h2
                style={{
                  fontFamily: F,
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#7A7060',
                  margin: '0 0 16px 0',
                }}
              >
                Practice
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {practiceWithLessonDeck.map(p => {
                  // Tag the link with a `from` param so the study page's
                  // Back button can return here instead of /flashcards.
                  const sep = p.href.includes('?') ? '&' : '?'
                  const lessonPath = `/learn/${topic}/${subtopic}`
                  const href = `${p.href}${sep}from=${encodeURIComponent(lessonPath)}`
                  return (
                  <li key={p.href} style={{ marginBottom: '12px' }}>
                    <Link
                      href={href}
                      style={{
                        display: 'block',
                        padding: '14px 18px',
                        border: '1px solid #D9CFAE',
                        borderRadius: '12px',
                        background: '#ECE3CC',
                        textDecoration: 'none',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontFamily: F,
                          fontSize: '11px',
                          fontWeight: 500,
                          letterSpacing: '0.18em',
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
                  )
                })}
              </ul>
            </section>
          )}

          {/* Up next end-link */}
          {found?.next && (
            <div className={styles.endLink}>
              <span className={styles.endLinkKicker}>Up next</span>
              <Link
                href={`/learn/${found.next.part.slug}/${found.next.lesson.slug}`}
                className={styles.endLinkA}
              >
                {found.next.lesson.name}
              </Link>{' '}→
            </div>
          )}

          {/* reference to subtopic slug kept for debuggability; not rendered */}
          <span data-subtopic={subtopic} hidden />
        </div>
      </main>
    </div>
  )
}
