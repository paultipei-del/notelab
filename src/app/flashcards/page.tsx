'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { DECKS } from '@/lib/decks'
import { loadProgress } from '@/lib/progressSync'
import { Deck, ProgressStore } from '@/lib/types'

import s from '@/components/flashcards/library/library.module.css'
import Shelf from '@/components/flashcards/library/Shelf'
import TodayStrip from '@/components/flashcards/library/TodayStrip'
import MiniStreak, { StreakLevel } from '@/components/flashcards/library/MiniStreak'
import Toolbar, { LibraryView, FilterChipDef } from '@/components/flashcards/library/Toolbar'
import {
  deckToBookProps, summarize, DeckProgressSummary,
} from '@/components/flashcards/library/deckToBook'
import { BookProps } from '@/components/flashcards/library/Book'

const TIERED_DECKS: Deck[] = DECKS.filter(d => !!d.tier)

interface DeckWithSummary {
  deck: Deck
  book: BookProps
  summary: DeckProgressSummary
}

function buildStreak(decks: DeckWithSummary[]): {
  current: number
  days: StreakLevel[]
  todayIndex: number
} {
  const buckets: number[] = [0, 0, 0, 0, 0, 0, 0]
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  for (const d of decks) {
    const t = d.summary.lastSeenAt
    if (!t) continue
    const days = Math.floor((startOfToday - t) / 86400000)
    if (days < 0) buckets[6]++
    else if (days < 7) buckets[6 - days]++
  }
  // Mon..Sun layout — todayIndex is JS day-of-week (0 Sun .. 6 Sat) mapped to Mon-first
  const jsDow = now.getDay() // 0 Sun ... 6 Sat
  const todayIndex = (jsDow + 6) % 7 // 0 Mon ... 6 Sun
  // We populated bucket[6] = today, [5] = yesterday, etc. Re-index so the last
  // entry is "today" sitting at todayIndex.
  const days: StreakLevel[] = []
  for (let i = 0; i < 7; i++) {
    // Position i in week. Distance from today = todayIndex - i (positive past).
    const past = todayIndex - i
    const count = past >= 0 && past < 7 ? buckets[6 - past] : 0
    days.push(toLevel(count))
  }
  // Current streak: walk back from today until a 0
  let current = 0
  for (let back = 0; back < 7; back++) {
    if (buckets[6 - back] > 0) current++
    else break
  }
  return { current, days, todayIndex }
}

function toLevel(count: number): StreakLevel {
  if (count <= 0) return 0
  if (count < 4) return 1
  if (count < 10) return 2
  return 3
}

function relTimeShort(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 0) return 'soon'
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${Math.max(1, min)}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d ago`
  return 'last week'
}

const FILTERS: FilterChipDef[] = [
  { id: 'all',         label: 'All',          count: 0, group: 'status' },
  { id: 'due',         label: 'Due now',      count: 0, group: 'status' },
  { id: 'in-progress', label: 'In progress',  count: 0, group: 'status' },
  { id: 'mastered',    label: 'Mastered',     count: 0, group: 'status' },
  { id: 'new',         label: 'Not started',  count: 0, group: 'status' },
  { id: 'foundations', label: 'Foundations',  count: 0, group: 'tier' },
  { id: 'intermediate',label: 'Intermediate', count: 0, group: 'tier' },
  { id: 'advanced',    label: 'Advanced',     count: 0, group: 'tier' },
]

function applyFilter(d: DeckWithSummary, filter: string): boolean {
  switch (filter) {
    case 'all':         return true
    case 'due':         return d.summary.dueCount > 0
    case 'in-progress': return d.book.state === 'active'
    case 'mastered':    return d.book.state === 'mastered'
    case 'new':         return d.book.state === 'new'
    case 'foundations': return d.deck.tier === 'foundations'
    case 'intermediate':return d.deck.tier === 'intermediate'
    case 'advanced':    return d.deck.tier === 'advanced' || d.deck.tier === 'application'
    default: return true
  }
}

function applyQuery(d: DeckWithSummary, q: string): boolean {
  if (!q.trim()) return true
  const needle = q.trim().toLowerCase()
  if (d.deck.title.toLowerCase().includes(needle)) return true
  if (d.deck.description?.toLowerCase().includes(needle)) return true
  if (d.deck.category?.toLowerCase().includes(needle)) return true
  return false
}

export default function FlashcardsPage() {
  const { user, loading: authLoading } = useAuth()
  const [progress, setProgress] = useState<ProgressStore>({})
  const [progressLoaded, setProgressLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<LibraryView>('shelves')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/landing'
  }, [authLoading, user])

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    loadProgress(user?.id ?? null).then(p => {
      if (!cancelled) {
        setProgress(p)
        setProgressLoaded(true)
      }
    })
    return () => { cancelled = true }
  }, [user, authLoading])

  const allDecks: DeckWithSummary[] = useMemo(() => {
    return TIERED_DECKS.map(deck => {
      const summary = summarize(deck, progress)
      const book = deckToBookProps(deck, progress)!
      return { deck, book, summary }
    })
  }, [progress])

  // Filter chip counts (always reflect the unfiltered pool)
  const filtersWithCounts: FilterChipDef[] = useMemo(() => {
    return FILTERS.map(f => ({ ...f, count: allDecks.filter(d => applyFilter(d, f.id)).length }))
  }, [allDecks])

  // Visible set after filter + query
  const visible = useMemo(() => {
    return allDecks.filter(d => applyFilter(d, filter) && applyQuery(d, query))
  }, [allDecks, filter, query])

  const activeBooks = visible.filter(d => d.book.state === 'active').map(d => d.book)
  const foundationsBooks = visible
    .filter(d => d.deck.tier === 'foundations' && d.book.state !== 'active')
    .map(d => d.book)
  const intermediateBooks = visible
    .filter(d => d.deck.tier === 'intermediate' && d.book.state !== 'active')
    .map(d => d.book)
  const advancedBooks = visible
    .filter(d =>
      (d.deck.tier === 'advanced' || d.deck.tier === 'application') &&
      d.book.state !== 'active',
    )
    .map(d => d.book)

  // Today summary
  const totalDue = allDecks.reduce((sum, d) => sum + d.summary.dueCount, 0)
  const setsDue = allDecks.filter(d => d.summary.dueCount > 0).length
  const overdue = allDecks.reduce((sum, d) => {
    let count = 0
    for (const card of d.deck.cards) {
      const p = progress[`${d.deck.id}-${card.id}`]
      if (p?.dueDate && p.dueDate < Date.now() - 86400000) count++
    }
    return sum + count
  }, 0)
  const estMinutes = Math.max(1, Math.round(totalDue * 0.25))

  // Resume target — most-recently-seen deck with cards still due/learning
  const resumeCandidate = [...allDecks]
    .filter(d => d.summary.lastSeenAt && d.book.state !== 'mastered')
    .sort((a, b) => (b.summary.lastSeenAt ?? 0) - (a.summary.lastSeenAt ?? 0))[0]
  const resumeName = resumeCandidate?.deck.title
  const resumeAgo = resumeCandidate?.summary.lastSeenAt
    ? relTimeShort(resumeCandidate.summary.lastSeenAt)
    : undefined
  const resumeHref = resumeCandidate
    ? `/study/${resumeCandidate.deck.id}`
    : `/study/${allDecks[0]?.deck.id ?? ''}`

  const streak = useMemo(() => buildStreak(allDecks), [allDecks])

  if (authLoading || !user) {
    return <div className={s.page} />
  }

  return (
    <div className={s.page}>
      <div className={s.wrap}>

        <section className={s.pageHead}>
          <div className={s.titleCol}>
            <span className={s.eyebrow}>
              Spaced repetition · {TIERED_DECKS.length} sets
            </span>
            <h1 className={s.h1}>Your <em>library</em><br />of music theory.</h1>
            <p className={s.lead}>
              Browse the shelves. Pick a volume. Practice what&rsquo;s due, then
              explore the rest at your own pace.
            </p>
          </div>
          <MiniStreak
            current={streak.current}
            days={streak.days}
            todayIndex={streak.todayIndex}
          />
        </section>

        {progressLoaded && totalDue > 0 && (
          <TodayStrip
            dueCount={totalDue}
            setCount={setsDue}
            overdueCount={overdue}
            estMinutes={estMinutes}
            streakCurrent={streak.current}
            streakDays={streak.days}
            streakTodayIndex={streak.todayIndex}
            resumeName={resumeName}
            resumeAgo={resumeAgo}
            startHref={resumeHref}
          />
        )}

        <Toolbar
          query={query}
          onQuery={setQuery}
          view={view}
          onView={setView}
          filters={filtersWithCounts}
          activeFilterId={filter}
          onFilter={setFilter}
        />

        <main className={s.shelves}>
          {view === 'shelves' && (
            <>
              <Shelf
                title="Currently reading"
                count={`${activeBooks.length} volumes · ${activeBooks.reduce((n, b) => n + b.dueCount, 0)} due`}
                books={activeBooks}
              />
              <Shelf
                title="Foundations"
                count={`${foundationsBooks.length} volumes · the bedrock`}
                books={foundationsBooks}
              />
              <Shelf
                title="Intermediate"
                count={`${intermediateBooks.length} volumes · the working vocabulary`}
                books={intermediateBooks}
              />
              <Shelf
                title="Advanced"
                count={`${advancedBooks.length} volumes · the rare shelf`}
                books={advancedBooks}
              />
              {visible.length === 0 && (
                <p className={s.empty}>No volumes match this view.</p>
              )}
            </>
          )}

          {view === 'cards' && <CardsGrid items={visible} />}
          {view === 'list'  && <ListView items={visible} />}
        </main>
      </div>
    </div>
  )
}

function CardsGrid({ items }: { items: DeckWithSummary[] }) {
  if (items.length === 0) return <p className={s.empty}>No volumes match this view.</p>
  return (
    <div className={s.cardsGrid}>
      {items.map(d => {
        const pct = Math.round(d.summary.pctMastered * 100)
        const dueLbl = d.summary.dueCount > 0 ? `${d.summary.dueCount} due` : `${pct}%`
        return (
          <Link
            key={d.deck.id}
            href={`/study/${d.deck.id}`}
            className={s.deckCard}
            data-tier={d.book.tier}
          >
            <div className={s.deckCardNameRow}>
              <div className={s.deckCardName}>{d.deck.title}</div>
              <div className={`${s.deckCardPct} ${d.summary.dueCount > 0 ? s.due : ''}`}>
                {dueLbl}
              </div>
            </div>
            <div className={s.deckCardMeta}>
              {(d.deck.category ?? '').toUpperCase()} · {d.deck.cards.length} cards
              {d.summary.lastSeenLabel && ` · ${d.summary.lastSeenLabel}`}
            </div>
            <div className={s.deckCardStat}>
              <span><b>{d.summary.learning}</b> learning</span>
              <span><b>{d.summary.mastered}</b> mastered</span>
            </div>
            <div className={s.deckCardBar}>
              <div style={{ width: `${pct}%` }} />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function ListView({ items }: { items: DeckWithSummary[] }) {
  if (items.length === 0) return <p className={s.empty}>No volumes match this view.</p>
  return (
    <div className={s.listView}>
      <div className={s.listHead}>
        <span />
        <span>Volume</span>
        <span>Progress</span>
        <span>Due</span>
        <span>Cards</span>
        <span>Last seen</span>
      </div>
      {items.map(d => {
        const pct = Math.round(d.summary.pctMastered * 100)
        const tierColor = d.book.tier === 'found' ? '#B5402A'
          : d.book.tier === 'inter' ? '#4A6B8A' : '#6B4A8A'
        return (
          <Link
            key={d.deck.id}
            href={`/study/${d.deck.id}`}
            className={s.listRow}
            data-tier={d.book.tier}
          >
            <div className={s.listSwatch} />
            <div className={s.listName}>
              {d.deck.title}
              {d.deck.category && <small>{d.deck.category}</small>}
            </div>
            <div className={`${s.listCol} ${s.listColBar}`}>
              <div className="b" style={{
                flex: 1, height: 4,
                background: 'rgba(122,112,96,0.15)',
                borderRadius: 100, overflow: 'hidden',
              }}>
                <div style={{ width: `${pct}%`, height: '100%', background: tierColor }} />
              </div>
              <span>{pct > 0 ? `${pct}%` : '—'}</span>
            </div>
            <div className={`${s.listCol} ${d.summary.dueCount > 0 ? s.due : ''}`}>
              {d.summary.dueCount > 0 ? <><b>{d.summary.dueCount}</b> due</> : '—'}
            </div>
            <div className={s.listCol}><b>{d.deck.cards.length}</b></div>
            <div className={s.listCol}>
              {d.summary.lastSeenLabel ?? (d.book.state === 'mastered' ? 'mastered' : 'not started')}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
