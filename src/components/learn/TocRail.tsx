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
                // Direct scrollTo on .nl-page-scroll instead of
                // scrollIntoView — avoids iOS Safari's visual-viewport
                // adjustment that can shift the SiteHeader. On
                // desktop the chrome offset is smaller (no pill nav),
                // so 24px clearance matches scroll-margin-top on .part.
                const part = document.getElementById(`part-${i}`)
                const scrollEl = document.querySelector<HTMLElement>('.nl-page-scroll')
                if (!part || !scrollEl) return
                const partRect = part.getBoundingClientRect()
                const scrollRect = scrollEl.getBoundingClientRect()
                const target = partRect.top - scrollRect.top + scrollEl.scrollTop - 24
                scrollEl.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
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
