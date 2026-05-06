'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { FlashCard } from '@/app/learn/_data/parts'
import styles from './learn.module.css'

export function PracticeDeck({
  cards,
  fullDeckHref = '/flashcards',
}: {
  cards: FlashCard[]
  fullDeckHref?: string
}) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const c = cards[idx]

  const onTap = () => {
    if (!flipped) setFlipped(true)
    else {
      setFlipped(false)
      setIdx((idx + 1) % cards.length)
    }
  }

  return (
    <section id="practice" className={styles.deck}>
      <div className={styles.deckHead}>
        <div className={styles.deckHeadL}>
          <span className={styles.deckKicker}>Practice</span>
          <h3 className={styles.deckTitle}>Lock in the vocabulary</h3>
        </div>
        <span className={styles.deckMeta}>Card {idx + 1} of {cards.length}</span>
      </div>

      <div
        className={styles.deckStack}
        onClick={onTap}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap() } }}
      >
        <div className={`${styles.deckCard} ${styles.deckCardS2}`} />
        <div className={`${styles.deckCard} ${styles.deckCardS1}`} />
        <div className={`${styles.deckCard} ${styles.deckCardS0}`}>
          <span className={styles.deckCardLbl}>{flipped ? 'Answer' : 'Term'}</span>
          {flipped
            ? <div className={styles.deckCardA}>{c.a}</div>
            : <div className={styles.deckCardQ}>{c.q}</div>}
          <span className={styles.deckCardTap}>{flipped ? 'Tap for next' : 'Tap to reveal'}</span>
        </div>
      </div>

      <div className={styles.deckActions}>
        <div className={styles.deckDots}>
          {cards.map((_, i) => (
            <span key={i} className={`${styles.deckDot} ${i === idx ? styles.deckDotActive : ''}`} />
          ))}
        </div>
        <Link href={fullDeckHref} className={styles.deckOpenAll}>
          Open the full deck <span className={styles.deckOpenAllArr}>→</span>
        </Link>
      </div>
    </section>
  )
}
