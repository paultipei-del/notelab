'use client'

import type { Part } from '@/app/learn/_data/parts'
import styles from './learn.module.css'

interface TocRailProps {
  parts: Part[]
  activeIndex: number
  onJump: (i: number) => void
}

export function TocRail({ parts, activeIndex, onJump }: TocRailProps) {
  let cumPage = 1

  return (
    <aside className={styles.toc}>
      <div className={styles.tocLabel}>Contents</div>
      <ol className={styles.tocList}>
        {parts.map((p, i) => {
          const pageStart = cumPage
          cumPage += p.lessons.length + 1
          const isActive = activeIndex === i
          return (
            <li
              key={p.slug}
              className={`${styles.tocItem} ${isActive ? styles.tocItemActive : ''}`}
              onClick={() => {
                onJump(i)
                document
                  .getElementById(`part-${i}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className={styles.tocNum}>{p.num}.</span>
              <span className={styles.tocTitle}>{p.title}</span>
              <span className={styles.tocPage}>{pageStart}</span>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
