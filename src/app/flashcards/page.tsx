'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { DECKS } from '@/lib/decks'
import { loadProgress } from '@/lib/progressSync'
import { readDeckActivity, DeckActivityMap } from '@/lib/deckActivity'
import { Deck, ProgressStore } from '@/lib/types'

import s from '@/components/flashcards/library/library.module.css'
import Shelf from '@/components/flashcards/library/Shelf'
import MobileShelf from '@/components/flashcards/library/MobileShelf'
import ExaminationHall from '@/components/flashcards/library/ExaminationHall'
import MobileExaminationHall from '@/components/flashcards/library/MobileExaminationHall'
import TodayStrip from '@/components/flashcards/library/TodayStrip'
import Toolbar, { LibraryView, FilterChipDef } from '@/components/flashcards/library/Toolbar'
import CardsView from '@/components/flashcards/library/CardsView'
import ListView from '@/components/flashcards/library/ListView'
import {
  deckToBookProps, summarize,
} from '@/components/flashcards/library/deckToBook'
import {
  groupBySection, TOPIC_SHELF_DEFS, DeckWithSummary,
} from '@/components/flashcards/library/sectionGrouping'

const TIERED_DECKS: Deck[] = DECKS.filter(d => !!d.tier)

function buildStreak(decks: DeckWithSummary[]): number {
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
  // Current streak: walk back from today until a 0
  let current = 0
  for (let back = 0; back < 7; back++) {
    if (buckets[6 - back] > 0) current++
    else break
  }
  return current
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
  const [deckActivity, setDeckActivity] = useState<DeckActivityMap>({})
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
        setDeckActivity(readDeckActivity())
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
  // Topic-grouped shelves use the same TOPIC_SHELF_DEFS that Cards/List read
  // from sectionGrouping.ts — single source of truth.
  const topicShelves = TOPIC_SHELF_DEFS.map(t => ({
    id: t.id,
    label: t.label,
    subtitle: t.subtitle ?? '',
    books: visible
      .filter(d =>
        d.book.state !== 'active' &&
        d.deck.tier !== 'application' &&
        d.book.topic === t.topic,
      )
      .map(d => d.book),
  }))
  const practiceBooks = visible
    .filter(d => d.book.state !== 'active' && d.deck.tier === 'application')
    .map(d => d.book)

  // Pre-grouped section list consumed by CardsView and ListView.
  const sections = useMemo(() => groupBySection(visible), [visible])

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

  // Resume target — most-recently-seen deck with cards still due/learning.
  // SM-2 progress only updates on rate(), which doesn't fire in flip mode,
  // so we fold in deckActivity (visit timestamp written on every study load)
  // and take the max so flip-mode reviews count too.
  const lastTouchedAt = (d: DeckWithSummary): number => {
    const sm2 = d.summary.lastSeenAt ?? 0
    const visit = deckActivity[d.deck.id] ?? 0
    return Math.max(sm2, visit)
  }
  const resumeCandidate = [...allDecks]
    .filter(d => lastTouchedAt(d) > 0 && d.book.state !== 'mastered')
    .sort((a, b) => lastTouchedAt(b) - lastTouchedAt(a))[0]
  const resumeName = resumeCandidate?.deck.title
  const resumeAgo = resumeCandidate
    ? relTimeShort(lastTouchedAt(resumeCandidate))
    : undefined
  const resumeHref = resumeCandidate
    ? `/study/${resumeCandidate.deck.id}`
    : `/study/${allDecks[0]?.deck.id ?? ''}`

  const streakCurrent = useMemo(() => buildStreak(allDecks), [allDecks])

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
        </section>

        {progressLoaded && totalDue > 0 && (
          <TodayStrip
            dueCount={totalDue}
            setCount={setsDue}
            overdueCount={overdue}
            estMinutes={estMinutes}
            streakCurrent={streakCurrent}
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
              {/* Desktop layout — hidden below 768px via CSS */}
              <div className={s.desktopOnly}>
                <Shelf
                  title="Currently reading"
                  count={`${activeBooks.length} volumes · ${activeBooks.reduce((n, b) => n + b.dueCount, 0)} due`}
                  books={activeBooks}
                />
                {topicShelves.map(t => (
                  <Shelf
                    key={t.id}
                    title={t.label}
                    count={`${t.books.length} volumes · ${t.subtitle}`}
                    books={t.books}
                  />
                ))}
                <ExaminationHall books={practiceBooks} />
              </div>

              {/* Mobile layout — hidden at and above 768px via CSS */}
              <div className={s.mobileOnly}>
                <MobileShelf
                  title="Currently reading"
                  count={`${activeBooks.length} volumes · ${activeBooks.reduce((n, b) => n + b.dueCount, 0)} due`}
                  books={activeBooks}
                />
                {topicShelves.map(t => (
                  <MobileShelf
                    key={t.id}
                    title={t.label}
                    count={`${t.books.length} volumes · ${t.subtitle}`}
                    books={t.books}
                  />
                ))}
                <MobileExaminationHall books={practiceBooks} />
              </div>

              {visible.length === 0 && (
                <p className={s.empty}>No volumes match this view.</p>
              )}
            </>
          )}

          {view === 'cards' && <CardsView sections={sections} />}
          {view === 'list'  && <ListView sections={sections} />}
        </main>
      </div>
    </div>
  )
}
