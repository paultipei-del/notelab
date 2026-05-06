import Link from 'next/link'
import styles from './learn.module.css'

export type ResumeData = {
  partNum: string
  partSlug: string
  lessonName: string
  lessonSlug: string
  lessonIndex: number
  totalLessons: number
  minutesLeft: number
}

export function ResumeStrip({ resume }: { resume: ResumeData | null }) {
  if (!resume) return null
  return (
    <section className={styles.resume}>
      <div className={styles.resumeGlyph}>𝄞</div>
      <div className={styles.resumeBody}>
        <div className={styles.resumeKicker}>Continue reading</div>
        <p className={styles.resumeTitle}>{resume.lessonName}</p>
        <p className={styles.resumeMeta}>
          Part {resume.partNum} · lesson {resume.lessonIndex} of {resume.totalLessons} · about {resume.minutesLeft} min left
        </p>
      </div>
      <Link href={`/learn/${resume.partSlug}/${resume.lessonSlug}`} className={styles.resumeBtn}>
        Resume →
      </Link>
    </section>
  )
}
