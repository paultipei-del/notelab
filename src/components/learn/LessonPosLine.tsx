import Link from 'next/link'
import styles from './learn.module.css'

type Props = {
  partLabel: string
  partTitle: string
  lessonIndexInPart: number
  lessonsInPart: number
  courseIndex: number
  courseTotal: number
  prev: { name: string; href: string } | null
  next: { name: string; href: string } | null
}

export function LessonPosLine(p: Props) {
  const readPct = ((p.lessonIndexInPart - 1) / p.lessonsInPart) * 100
  const slotPct = ((p.lessonIndexInPart - 0.5) / p.lessonsInPart) * 100

  return (
    <div className={styles.posLine}>
      {p.prev ? (
        <Link href={p.prev.href} className={`${styles.posLink} ${styles.posLinkPrev}`}>
          <span className={styles.posArr} aria-hidden="true">←</span>
          <span className={styles.posLinkText}>
            <span className={styles.posLinkKicker}>Previous</span>
            <span className={styles.posTtl}>{p.prev.name}</span>
          </span>
        </Link>
      ) : <span />}

      <div className={styles.posCenter}>
        <Link href="/learn" className={styles.posMetaLink} title="Back to Learn">
          <span className={styles.posMeta}>
            <span className={styles.posMetaNum}>{p.partLabel}</span>
            <span className={styles.posMetaSep}>·</span>
            <span className={styles.posMetaTtl}>{p.partTitle}</span>
            <span className={styles.posMetaSep}>·</span>
            <span className={styles.posMetaOf}>{p.courseIndex} / {p.courseTotal}</span>
          </span>
        </Link>
        <div className={styles.progLine}>
          <div className={styles.progFill} style={{ width: `${readPct}%` }} />
          <div className={styles.progKnob} style={{ left: `${slotPct}%` }} />
        </div>
      </div>

      {p.next ? (
        <Link href={p.next.href} className={`${styles.posLink} ${styles.posLinkNext}`}>
          <span className={styles.posLinkText}>
            <span className={styles.posLinkKicker}>Next</span>
            <span className={styles.posTtl}>{p.next.name}</span>
          </span>
          <span className={styles.posArr} aria-hidden="true">→</span>
        </Link>
      ) : <span />}
    </div>
  )
}
