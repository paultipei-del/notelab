'use client'

import { useEffect, useState } from 'react'
import styles from './learn.module.css'

type Item = { id: string; label: string }

export function OnThisPage({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 200
      let cur = items[0]?.id ?? ''
      for (const it of items) {
        const el = document.getElementById(it.id)
        if (el && el.offsetTop <= y) cur = it.id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  const onClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' })
  }

  return (
    <aside className={styles.onThisPage}>
      <div className={styles.onThisPageLbl}>On this page</div>
      <ul className={styles.onThisPageList}>
        {items.map(it => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              onClick={e => onClick(e, it.id)}
              className={`${styles.onThisPageLink} ${active === it.id ? styles.onThisPageLinkActive : ''}`}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
