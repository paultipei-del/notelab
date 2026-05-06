import Link from 'next/link'
import type { Lesson } from '@/app/learn/_data/parts'
import styles from './learn.module.css'

type Props = {
  lesson: Lesson
  partSlug: string
  index: number
  isRead: boolean
  isCurrent: boolean
}

export function LessonRow({ lesson, partSlug, index, isRead, isCurrent }: Props) {
  const cls = [styles.lesson, isRead && styles.lessonRead, isCurrent && styles.lessonCurrent]
    .filter(Boolean)
    .join(' ')
  return (
    <Link href={`/learn/${partSlug}/${lesson.slug}`} className={cls}>
      <span className={styles.lessonNum}>{index + 1}</span>
      <span className={styles.lessonName}>
        {lesson.name}
        {lesson.desc && <span className={styles.lessonDesc}>{lesson.desc}</span>}
      </span>
      <span className={styles.lessonTime}>{lesson.minutes} min</span>
      <span className={styles.lessonDot} />
    </Link>
  )
}
