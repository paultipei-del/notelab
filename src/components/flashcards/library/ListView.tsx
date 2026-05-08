'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import s from './library.module.css'
import Status from './Status'
import SectionHeader from './SectionHeader'
import { useBookBinding } from './bookBindings'
import { deriveStatusState, Section, DeckWithSummary } from './sectionGrouping'

export type ListSortKey = 'default' | 'name' | 'category' | 'due' | 'lastSeen'

const LIST_SORTS: { key: ListSortKey; label: string }[] = [
  { key: 'default',  label: 'Default' },
  { key: 'name',     label: 'Name (A→Z)' },
  { key: 'category', label: 'Category' },
  { key: 'due',      label: 'Most due' },
  { key: 'lastSeen', label: 'Recently seen' },
]

export interface ListViewProps {
  sections: Section[]
}

function sortItems(items: DeckWithSummary[], key: ListSortKey): DeckWithSummary[] {
  if (key === 'default') return items
  const arr = [...items]
  if (key === 'name') {
    arr.sort((a, b) => a.deck.title.localeCompare(b.deck.title))
  } else if (key === 'category') {
    arr.sort((a, b) => {
      const ca = a.deck.category ?? '￿'
      const cb = b.deck.category ?? '￿'
      const c = ca.localeCompare(cb)
      return c !== 0 ? c : a.deck.title.localeCompare(b.deck.title)
    })
  } else if (key === 'due') {
    arr.sort((a, b) => {
      const diff = b.summary.dueCount - a.summary.dueCount
      return diff !== 0 ? diff : a.deck.title.localeCompare(b.deck.title)
    })
  } else if (key === 'lastSeen') {
    arr.sort((a, b) => (b.summary.lastSeenAt ?? 0) - (a.summary.lastSeenAt ?? 0))
  }
  return arr
}

export default function ListView({ sections }: ListViewProps) {
  const [sortKey, setSortKey] = useState<ListSortKey>('default')

  const sortedSections = useMemo(
    () =>
      sections
        .map(sec => ({ ...sec, items: sortItems(sec.items, sortKey) }))
        .filter(sec => sec.items.length > 0),
    [sections, sortKey],
  )

  if (sortedSections.length === 0) {
    return <p className={s.empty}>No volumes match this view.</p>
  }

  return (
    <div className={s.listViewWrap}>
      <div className={s.listSortBar}>
        <span className={s.listSortLabel}>Sort</span>
        {LIST_SORTS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortKey(key)}
            className={`${s.listSortChip} ${sortKey === key ? s.active : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Desktop — grid table */}
      <div className={s.desktopOnly}>
        {sortedSections.map(sec => (
          <section key={sec.id} className={s.listSection}>
            <SectionHeader
              label={sec.label}
              count={sec.items.length}
              subtitle={sec.subtitle}
              seeAllHref={sec.seeAllHref}
            />
            <div className={s.listTableHead}>
              <div />
              <div>Volume</div>
              <div>Category</div>
              <div>Status</div>
              <div className={s.listTableHeadRight}>Last seen</div>
            </div>
            {sec.items.map(item => (
              <DesktopListRow key={item.deck.id} item={item} />
            ))}
          </section>
        ))}
      </div>

      {/* Mobile — stacked rows */}
      <div className={s.mobileOnly}>
        {sortedSections.map(sec => (
          <section key={sec.id} className={s.listSectionMobile}>
            <div className={s.listSectionHeaderPadMobile}>
              <SectionHeader
                label={sec.label}
                count={sec.items.length}
                subtitle={sec.subtitle}
                seeAllHref={sec.seeAllHref}
              />
            </div>
            {sec.items.map(item => (
              <MobileListRow key={item.deck.id} item={item} />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}

function DesktopListRow({ item }: { item: DeckWithSummary }) {
  const binding = useBookBinding(item.deck.title)
  const state = deriveStatusState(item.summary)
  const percentLearned = Math.round(item.summary.pctMastered * 100)
  return (
    <Link
      href={`/study/${item.deck.id}`}
      className={s.listRowDesktop}
      data-tier={item.book.tier}
      data-topic={item.book.topic ?? undefined}
    >
      <div className={s.listRowStripe} style={{ background: binding.stripe }} />
      <div className={s.listRowTitle}>{item.deck.title}</div>
      <div className={s.listRowCategory}>{item.deck.category ?? ''}</div>
      <div className={s.listRowStatus}>
        <Status
          state={state}
          density="default"
          totalCards={item.deck.cards.length}
          due={item.summary.dueCount}
          percentLearned={percentLearned}
          lastSeen={item.summary.lastSeenLabel}
          instanceKey={item.deck.id}
        />
      </div>
      <div className={s.listRowLastSeen}>{item.summary.lastSeenLabel ?? '—'}</div>
    </Link>
  )
}

function MobileListRow({ item }: { item: DeckWithSummary }) {
  const binding = useBookBinding(item.deck.title)
  const state = deriveStatusState(item.summary)
  const percentLearned = Math.round(item.summary.pctMastered * 100)
  const category = (item.deck.category ?? '').toUpperCase()
  const gradId = `gilt-check-list-mob-${item.deck.id}`

  return (
    <Link href={`/study/${item.deck.id}`} className={s.listRowMobile}>
      <div className={s.listRowMobileStripe} style={{ background: binding.stripe }} />
      <div className={s.listRowMobileBody}>
        <div className={s.listRowMobileTitleRow}>
          <div className={s.listRowMobileTitle}>{item.deck.title}</div>
          {state === 'in-progress' && item.summary.dueCount > 0 && (
            <div className={s.listRowMobileDue}>
              <span style={{ fontWeight: 600 }}>{item.summary.dueCount}</span>
              <span style={{ fontStyle: 'italic', marginLeft: 3 }}>due</span>
            </div>
          )}
          {state === 'mastered' && (
            <svg
              width={14}
              height={14}
              viewBox="0 0 14 14"
              fill="none"
              style={{ flex: '0 0 auto' }}
            >
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f4e5a1" />
                  <stop offset="50%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#8b6914" />
                </linearGradient>
              </defs>
              <path
                d="M3 7.5 L6 10.5 L11 4.5"
                stroke={`url(#${gradId})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          )}
        </div>
        <div className={s.listRowMobileMeta}>
          {category && <span className={s.listRowMobileMetaCat}>{category}</span>}
          {category && <span className={s.listRowMobileMetaSep}>·</span>}
          {state === 'unstarted' && (
            <span>Not started · {item.deck.cards.length} cards</span>
          )}
          {state === 'in-progress' && (
            <span>
              {percentLearned}%
              {item.summary.lastSeenLabel ? ` · ${item.summary.lastSeenLabel}` : ''}
            </span>
          )}
          {state === 'mastered' && item.summary.lastSeenLabel && (
            <span>{item.summary.lastSeenLabel}</span>
          )}
        </div>
        {state === 'in-progress' && (
          <div className={s.listRowMobileBar}>
            <div
              style={{
                width: `${Math.max(0, Math.min(100, percentLearned))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #c9a449 0%, #d4af37 100%)',
              }}
            />
          </div>
        )}
      </div>
    </Link>
  )
}
