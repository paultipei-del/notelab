'use client'

import s from './library.module.css'
import Book, { BookProps } from './Book'

export interface ShelfProps {
  title: string
  count: string
  seeAllHref?: string
  books: BookProps[]
}

export default function Shelf({ title, count, seeAllHref = '#', books }: ShelfProps) {
  if (books.length === 0) return null
  return (
    <section className={s.shelf}>
      <div className={s.shelfHead}>
        <div className={s.shelfHeadLeft}>
          <h2>{title}</h2>
          <span className={s.shelfCt}>{count}</span>
        </div>
        <a href={seeAllHref} className={s.seeAll}>See all →</a>
      </div>

      <div className={s.shelfStage}>
        <div className={s.books}>
          {books.map(b => <Book key={b.id} {...b} />)}
          <div className={s.bookend} aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
