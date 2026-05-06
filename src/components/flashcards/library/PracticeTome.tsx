'use client'

import Link from 'next/link'
import s from './library.module.css'
import type { BookProps } from './Book'

/**
 * Workbook treatment for Practice & Review decks. Renders each deck as a
 * horizontal leather-bound cover (closed book viewed from above) with a
 * gilt-embossed title — distinct from the vertical book spines on the
 * concept shelves so cross-concept synthesis decks read as a different
 * class of work.
 */
export function PracticeTome(props: BookProps) {
  const {
    href, title, volume, topic, state,
    dueCount, cardCount, pctMastered, lastSeenLabel,
  } = props

  return (
    <Link
      href={href}
      className={s.tome}
      data-topic={topic ?? 'analysis'}
      data-state={state}
    >
      {dueCount > 0 && (
        <span className={s.tomeSeal} aria-label={`${dueCount} due`}>{dueCount}</span>
      )}
      <div className={s.tomeBorder}>
        <div className={s.tomeCenter}>
          <div className={s.tomeKicker}>Workbook{volume ? ` · ${volume}` : ''}</div>
          <div className={s.tomeTitle}>{title}</div>
          <div className={s.tomeSub}>
            {cardCount} cards
            {state !== 'new' && ` · ${Math.round(pctMastered * 100)}% mastered`}
            {lastSeenLabel && ` · ${lastSeenLabel}`}
          </div>
        </div>
      </div>
    </Link>
  )
}

export interface PracticeShelfProps {
  title: string
  count: string
  books: BookProps[]
}

export function PracticeShelf({ title, count, books }: PracticeShelfProps) {
  if (books.length === 0) return null
  return (
    <section className={s.shelf}>
      <div className={s.shelfHead}>
        <div className={s.shelfHeadLeft}>
          <h2>{title}</h2>
          <span className={s.shelfCt}>{count}</span>
        </div>
      </div>
      <div className={s.tomeGrid}>
        {books.map(b => <PracticeTome key={b.id} {...b} />)}
      </div>
    </section>
  )
}
