'use client'

import { useState } from 'react'
import type { Part } from '@/app/learn/_data/parts'
import styles from './learn.module.css'

export function TocRail({ parts }: { parts: Part[] }) {
  const [active, setActive] = useState(0)
  let cumPage = 1

  return (
    <aside className={styles.toc}>
      <div className={styles.tocLabel}>Contents</div>
      <ol className={styles.tocList}>
        {parts.map((p, i) => {
          const pageStart = cumPage
          cumPage += p.lessons.length + 1
          return (
            <li
              key={p.slug}
              className={`${styles.tocItem} ${active === i ? styles.tocItemActive : ''}`}
              onClick={() => {
                setActive(i)
                document.getElementById(`part-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
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
