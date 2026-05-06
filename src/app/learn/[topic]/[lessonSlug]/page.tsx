import { notFound } from 'next/navigation'
import { PARTS, findLesson } from '@/app/learn/_data/parts'
import { LessonPosLine } from '@/components/learn/LessonPosLine'
import { LessonView } from '@/components/learn/LessonView'
import styles from '@/components/learn/learn.module.css'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

type Params = Promise<{ topic: string; lessonSlug: string }>

export function generateStaticParams() {
  return PARTS.flatMap(p =>
    p.lessons.map(l => ({ topic: p.slug, lessonSlug: l.slug })),
  )
}

export default async function LessonPage({ params }: { params: Params }) {
  const { topic, lessonSlug } = await params
  const found = findLesson(PARTS, topic, lessonSlug)
  if (!found) notFound()
  const { part, partIndex, lesson, lessonIndex, courseIndex, courseTotal, prev, next } = found

  return (
    <div className={styles.page}>
      <div className={styles.chrome}>
        <LessonPosLine
          partLabel={`Part ${ROMAN[partIndex] ?? partIndex + 1}`}
          partTitle={part.title}
          lessonIndexInPart={lessonIndex + 1}
          lessonsInPart={part.lessons.length}
          courseIndex={courseIndex + 1}
          courseTotal={courseTotal}
          prev={prev ? { name: prev.lesson.name, href: `/learn/${prev.part.slug}/${prev.lesson.slug}` } : null}
          next={next ? { name: next.lesson.name, href: `/learn/${next.part.slug}/${next.lesson.slug}` } : null}
        />
      </div>

      <LessonView
        part={part}
        partIndex={partIndex}
        lesson={lesson}
        next={next}
      />
    </div>
  )
}
