'use client'

import Link from 'next/link'
import s from './library.module.css'

export type BookTier = 'found' | 'inter' | 'adv'
export type BookTopic =
  | 'pitch' | 'rhythm' | 'harmony'
  | 'expression' | 'notation' | 'form' | 'technique'
  | 'analysis' | 'aural' | 'construction'
export type BookHeight = 's' | 'm' | 'l' | 'xl'
export type BookWidth = 'thin' | 'med' | 'thick'
export type BookState = 'new' | 'active' | 'mastered'

export interface BookProps {
  id: string
  href: string
  title: string
  volume?: string
  tier: BookTier
  topic?: BookTopic
  height: BookHeight
  width: BookWidth
  state: BookState
  cardCount: number
  dueCount: number
  learning: number
  mastered: number
  categoryLabel: string
  lastSeenLabel?: string
  pctMastered: number
}

function StatN({ n, kind }: { n: number; kind?: 'due' | 'learning' }) {
  const variant = n === 0 ? s.zero : kind === 'due' ? s.due : kind === 'learning' ? s.learning : ''
  return <span className={`${s.n} ${variant}`.trim()}>{n}</span>
}

export default function Book(props: BookProps) {
  const {
    href, title, volume, tier, topic, height, width, state,
    cardCount, dueCount, learning, mastered,
    categoryLabel, lastSeenLabel, pctMastered,
  } = props

  const showRibbon = state === 'active'
  const showSeal = dueCount > 0
  const showMastered = state === 'mastered'

  return (
    <Link
      href={href}
      className={s.book}
      data-tier={tier}
      data-topic={topic ?? undefined}
      data-h={height}
      data-w={width}
      data-state={state}
    >
      {showRibbon && <div className={s.bookRibbon} aria-hidden="true" />}
      {showSeal && (
        <span className={s.bookSeal} aria-label={`${dueCount} due`}>
          {dueCount}
        </span>
      )}

      <div className={s.bookHead} aria-hidden="true" />
      <div className={s.bookHub} aria-hidden="true" />
      <div className={s.bookRule} aria-hidden="true" />

      <div className={s.bookPlate}>
        <div className={s.bookTitle}>{title}</div>
        {volume && <div className={s.bookVolume}>{volume}</div>}
      </div>

      {showMastered && (
        <div className={s.bookMastered} aria-label="mastered">✓</div>
      )}

      <div className={s.bookRule} aria-hidden="true" />
      <div className={s.bookHub} aria-hidden="true" />
      <div className={s.bookFoot} aria-hidden="true" />

      <div className={s.popover} role="tooltip">
        <h3 className={s.pTitle}>{title}</h3>
        <div className={s.pSub}>
          {categoryLabel} · {cardCount} cards
          {state === 'new' && ' · not started'}
        </div>
        {state !== 'new' && (
          <>
            <div className={s.pBar}>
              <div style={{ width: `${Math.round(pctMastered * 100)}%` }} />
            </div>
            <div className={s.pPct}>
              <b>{Math.round(pctMastered * 100)}%</b> mastered
              {lastSeenLabel && <> · {lastSeenLabel}</>}
            </div>
            <div className={s.pStats}>
              <div>
                <StatN n={dueCount} kind="due" />
                <span className={s.l}>Due</span>
              </div>
              <div>
                <StatN n={learning} kind="learning" />
                <span className={s.l}>Learning</span>
              </div>
              <div>
                <StatN n={mastered} />
                <span className={s.l}>Mastered</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  )
}
