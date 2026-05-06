'use client'

import styles from './learn.module.css'

type Props = {
  lessonCount: number
  query: string
  onQueryChange: (q: string) => void
}

export function LearnHeader({ lessonCount, query, onQueryChange }: Props) {
  return (
    <section className={styles.header}>
      <div className={styles.headerLeft}>
        <h1>Learn</h1>
        <p className={styles.headerLead}>
          Eleven parts covering music theory from sound itself to advanced harmony. Read straight through, or dip in wherever you are.
          Parts I–III are foundational; most others can be read independently.
        </p>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.search}>
          <input
            className={styles.searchInput}
            placeholder={`Search ${lessonCount} lessons…`}
            value={query}
            onChange={e => onQueryChange(e.target.value)}
          />
        </div>
      </div>
    </section>
  )
}
