import type { Part } from '@/app/learn/_data/parts'
import styles from './learn.module.css'

export function PartFrontispiece({ part, readCount }: { part: Part; readCount: number }) {
  const totalMin = part.lessons.reduce((a, l) => a + l.minutes, 0)
  const pct = part.lessons.length > 0
    ? (readCount / part.lessons.length) * 100
    : 0

  return (
    <div className={styles.frontispiece}>
      <div className={styles.partNum}>{part.num}</div>

      <div>
        <div className={styles.partMeta}>
          <span className={`${styles.chip} ${part.tier === 'Foundations' ? styles.chipFoundations : styles.chipPlus}`}>
            {part.tier}
          </span>
          <span className={`${styles.chip} ${styles.chipNeutral}`}>{part.lessons.length} lessons</span>
          <span className={`${styles.chip} ${styles.chipNeutral}`}>{totalMin} min</span>
        </div>
        <h2 className={styles.partTitle}>{part.title}</h2>
        <p className={styles.epigraph}>{part.epigraph}</p>
        <div className={styles.partProgress}>
          <span>{readCount} of {part.lessons.length} read</span>
          <span className={styles.progressBar}>
            <span className={styles.progressFill} style={{ width: `${pct}%` }} />
          </span>
        </div>
      </div>

    </div>
  )
}
