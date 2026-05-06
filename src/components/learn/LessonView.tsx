import Link from 'next/link'
import type { Lesson, Part } from '@/app/learn/_data/parts'
import { OnThisPage } from './OnThisPage'
import { WaveDemo } from './WaveDemo'
import { PracticeDeck } from './PracticeDeck'
import styles from './learn.module.css'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

type Props = {
  part: Part
  partIndex: number
  lesson: Lesson
  next: { part: Part; lesson: Lesson } | null
}

export function LessonView({ part, partIndex, lesson, next }: Props) {
  const partLabel = `Part ${ROMAN[partIndex] ?? partIndex + 1}`
  const tocItems = [
    ...(lesson.body ?? []).map(s => ({ id: s.id, label: s.heading.replace(/&amp;/g, '&') })),
    ...(lesson.cards?.length ? [{ id: 'practice', label: 'Practice' }] : []),
  ]

  return (
    <>
      <Link
        href={`/learn#part-${partIndex}`}
        className={styles.gutterTab}
        title={`Back to ${partLabel} contents`}
      >
        <span className={styles.gutterRoman}>{ROMAN[partIndex] ?? partIndex + 1}</span>
        <span className={styles.gutterLabel}>{partLabel}</span>
      </Link>

      {tocItems.length > 0 && <OnThisPage items={tocItems} />}

      <main className={styles.stage}>
        <div className={styles.col}>
          <h1 className={styles.lessonTitle}>{lesson.name}</h1>
          {lesson.subtitle && <p className={styles.lessonSubtitle}>{lesson.subtitle}</p>}

          {lesson.body?.length ? lesson.body.map(section => (
            <div key={section.id}>
              <h2 className={styles.lessonH2} id={section.id}>
                <span dangerouslySetInnerHTML={{ __html: section.heading }} />
              </h2>
              <div className={styles.lessonProse} dangerouslySetInnerHTML={{ __html: section.html }} />
              {section.kind === 'wave' && <WaveDemo />}
            </div>
          )) : (
            <div className={styles.lessonPlaceholder}>
              This lesson&rsquo;s content is still in the works. Check back soon.
            </div>
          )}

          {lesson.cards?.length ? <PracticeDeck cards={lesson.cards} /> : null}

          {next && (
            <div className={styles.endLink}>
              <span className={styles.endLinkKicker}>Up next</span>
              <Link href={`/learn/${next.part.slug}/${next.lesson.slug}`} className={styles.endLinkA}>
                {next.lesson.name}
              </Link>{' '}→
            </div>
          )}
        </div>
      </main>
    </>
  )
}
