'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import repertoireData from '@/lib/data/cm-repertoire-complete.json'

// ── Data shapes ────────────────────────────────────────────────────

interface CMEntry {
  composer: string
  title: string
  publisher: string
  restrictions?: string
}

interface CMCategory {
  id: string
  label: string
  repertoire: CMEntry[]
}

interface CMLevel {
  id: string
  label: string
  requirements: {
    pieces: number
    memorized: number
    categories: boolean
    notes: string
  }
  categories: CMCategory[]
}

interface MagrathEntry {
  composer: string
  dates: string
  country: string
  title: string
  level: string
  level_sort: number
  description: string
  period: string
}

interface MagrathPeriod {
  id: string
  label: string
  entries: MagrathEntry[]
}

interface MagrathData {
  meta: { source: string; author: string; publisher: string; year: string; level_system: string; notes: string }
  periods: MagrathPeriod[]
}

// ── Constants ──────────────────────────────────────────────────────

const cmData = repertoireData as { meta: { source: string; program: string; notes: string }; levels: CMLevel[] }
const CM_LEVELS = cmData.levels

// Publisher abbreviation → full name. Some codes use a "/" to mark
// "distributor / publisher" (e.g. Hal Leonard distributes many
// publishers in North America). Three codes (BB, NV, JL) are
// educated guesses; if upstream data corrects them, drop the
// new value in here.
const PUBLISHER_MAP: Record<string, string> = {
  'Alf':      'Alfred Music',
  'Alf/Dov':  'Alfred Music / Dover Publications',
  'Alf/Kal':  'Alfred Music / Kalmus',
  'BB/Kjo':   'Bastien & Bastien / Neil A. Kjos Music Company',
  'CF':       'Carl Fischer',
  'ECS':      'ECS Publishing',
  'FH':       'Frederick Harris Music',
  'FJH':      'FJH Music Company',
  'HL':       'Hal Leonard',
  'HL/BH':    'Hal Leonard / Boosey & Hawkes',
  'HL/Bos':   'Hal Leonard / Boston Music',
  'HL/FPA':   'Hal Leonard / Faber Piano Adventures',
  'HL/Hen':   'Hal Leonard / G. Henle Verlag',
  'HL/LR':    'Hal Leonard / Lee Roberts Music',
  'HL/Wil':   'Hal Leonard / Willis Music',
  'JL':       'Jerona Music',
  'Kjo':      'Neil A. Kjos Music Company',
  'MS/Ches':  'Music Sales / Chester Music',
  'NV':       'Neumes Verlag',
  'Sch':      'G. Schirmer',
  'any ed.':  'Any edition',
}

function expandPublisher(raw: string | undefined): string {
  if (!raw) return ''
  return PUBLISHER_MAP[raw] ?? raw
}

const SECRET_WORD = 'magrath'
const SECRET_RESET_MS = 2000
const SECRET_CLICKS_REQUIRED = 5
const SECRET_CLICK_RESET_MS = 1000
const MAGRATH_UNLOCK_KEY = 'notelab-repertoire-magrath-unlocked'

function imslpUrl(composer: string, title: string) {
  const q = encodeURIComponent(`${title} ${composer}`.trim())
  return `https://imslp.org/index.php?search=${q}&title=Special%3ASearch`
}

function SearchIcon() {
  return (
    <svg
      className="nl-repertoire-search__icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <line
        x1="9.5"
        y1="9.5"
        x2="12.5"
        y2="12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Page ───────────────────────────────────────────────────────────

export default function RepertoirePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { hasSubscription, hasPurchased } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription() || hasPurchased('pro')

  // Source + filters
  const [source, setSource] = useState<'cm' | 'magrath'>('cm')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // CM state
  const [selectedLevel, setSelectedLevel] = useState<string>('level_1')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Magrath state
  const [magrathData, setMagrathData] = useState<MagrathData | null>(null)
  const [magrathLoading, setMagrathLoading] = useState(false)
  const [magrathPeriod, setMagrathPeriod] = useState('baroque')
  const [magrathLevels, setMagrathLevels] = useState<Set<number>>(new Set())

  // Secret unlock
  const [magrathUnlocked, setMagrathUnlocked] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const keyBufferRef = useRef('')
  const keyBufferTimerRef = useRef<number | null>(null)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<number | null>(null)

  // Load unlock state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(MAGRATH_UNLOCK_KEY) === '1') {
      setMagrathUnlocked(true)
    }
  }, [])

  // Lazy-load Magrath data when needed
  useEffect(() => {
    if (source !== 'magrath' || magrathData || magrathLoading) return
    setMagrathLoading(true)
    import('@/lib/data/magrath-repertoire.json').then(m => {
      setMagrathData(m.default as MagrathData)
      setMagrathLoading(false)
    })
  }, [source, magrathData, magrathLoading])

  // Debounce search
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 150)
    return () => window.clearTimeout(id)
  }, [query])

  // Unlock helper — wraps both paths so the toast + persistence is
  // identical regardless of trigger.
  function unlockMagrath() {
    if (magrathUnlocked) return
    setMagrathUnlocked(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(MAGRATH_UNLOCK_KEY, '1')
    }
    setShowToast(true)
    window.setTimeout(() => setShowToast(false), 3000)
    // Reset the keyboard buffer so we don't accidentally re-fire.
    keyBufferRef.current = ''
  }

  // Keyboard sequence detector. Listens at document level, ignores
  // keys while a form input is focused (so the search field can
  // accept "magrath" without unlocking).
  useEffect(() => {
    if (magrathUnlocked) return
    function onKey(e: KeyboardEvent) {
      const target = e.target as Element | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
        return
      }
      // Only track plain letter keys.
      if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) {
        keyBufferRef.current = ''
        return
      }
      keyBufferRef.current = (keyBufferRef.current + e.key.toLowerCase()).slice(-SECRET_WORD.length)
      if (keyBufferTimerRef.current) window.clearTimeout(keyBufferTimerRef.current)
      keyBufferTimerRef.current = window.setTimeout(() => {
        keyBufferRef.current = ''
      }, SECRET_RESET_MS)
      if (keyBufferRef.current === SECRET_WORD) {
        unlockMagrath()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (keyBufferTimerRef.current) window.clearTimeout(keyBufferTimerRef.current)
    }
  }, [magrathUnlocked])

  // Period-click detector — 5 clicks within 1s windows of each other.
  function handleSecretClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (magrathUnlocked) return
    clickCountRef.current += 1
    if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current)
    if (clickCountRef.current >= SECRET_CLICKS_REQUIRED) {
      clickCountRef.current = 0
      unlockMagrath()
      return
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0
    }, SECRET_CLICK_RESET_MS)
  }

  // ── CM derived state ────────────────────────────────────────────

  const currentLevel = CM_LEVELS.find(l => l.id === selectedLevel)
  useEffect(() => {
    if (currentLevel && currentLevel.categories.length > 0) {
      setSelectedCategory(currentLevel.categories[0].id)
    }
  }, [selectedLevel])

  const currentCategory = currentLevel?.categories.find(c => c.id === selectedCategory)

  const cmEntries = useMemo(() => {
    if (!currentCategory) return []
    const q = debouncedQuery.toLowerCase().trim()
    return currentCategory.repertoire.filter(e =>
      !q ||
      e.composer.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q),
    ).sort((a, b) => a.composer.localeCompare(b.composer))
  }, [currentCategory, debouncedQuery])

  // ── Magrath derived state ───────────────────────────────────────

  const currentMagrathPeriod = magrathData?.periods.find(p => p.id === magrathPeriod)
  const magrathEntries = useMemo(() => {
    if (!currentMagrathPeriod) return []
    const q = debouncedQuery.toLowerCase().trim()
    const levelFilter = magrathLevels.size > 0
    return currentMagrathPeriod.entries
      .filter(e => !levelFilter || magrathLevels.has(e.level_sort))
      .filter(e =>
        !q ||
        e.composer.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q),
      )
      .sort((a, b) => a.level_sort - b.level_sort)
  }, [currentMagrathPeriod, magrathLevels, debouncedQuery])

  function toggleMagrathLevel(n: number) {
    setMagrathLevels(prev => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  function resetFilters() {
    setQuery('')
    if (source === 'magrath') setMagrathLevels(new Set())
  }

  // ── Render gates ────────────────────────────────────────────────

  if (loading) return <div className="nl-repertoire-page" />

  if (!isPro) {
    return (
      <div className="nl-repertoire-page">
        <header className="nl-repertoire-hero">
          <span className="nl-repertoire-hero__eyebrow">REPERTOIRE</span>
          <h1 className="nl-repertoire-hero__title">Pro feature.</h1>
          <p className="nl-repertoire-hero__sub">
            Browse graded repertoire by level. Search by composer and
            title across the full catalog.
          </p>
        </header>
        <div className="nl-repertoire-pro-gate">
          <button
            type="button"
            className="nl-repertoire-pro-gate__cta"
            onClick={() => router.push('/pricing')}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    )
  }

  // ── Main view ───────────────────────────────────────────────────

  return (
    <div className="nl-repertoire-page">
      <header className="nl-repertoire-hero">
        <span className="nl-repertoire-hero__eyebrow">REPERTOIRE</span>
        <h1 className="nl-repertoire-hero__title">
          Repertoire Browser
          <span
            className="nl-repertoire-secret"
            onClick={handleSecretClick}
            aria-hidden
          >.</span>
        </h1>
        <p className="nl-repertoire-hero__sub">
          Browse graded repertoire by level. Search by composer and
          title across the full catalog.
        </p>
      </header>

      <div className="nl-repertoire-toolbar">
        <div className="nl-repertoire-source-switcher">
          <button
            type="button"
            className={
              'nl-repertoire-source-pill' +
              (source === 'cm' ? ' is-active' : '')
            }
            onClick={() => setSource('cm')}
          >
            CM Syllabus
          </button>
          {magrathUnlocked && (
            <button
              type="button"
              className={
                'nl-repertoire-source-pill' +
                (source === 'magrath' ? ' is-active' : '')
              }
              onClick={() => setSource('magrath')}
            >
              Magrath Guide
            </button>
          )}
        </div>
        <label className="nl-repertoire-search">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              source === 'cm'
                ? 'Search composer or title in this level'
                : 'Search composer or title across all periods'
            }
            className="nl-repertoire-search__input"
            aria-label="Search repertoire"
          />
        </label>
      </div>

      {source === 'cm' ? (
        <>
          <div
            className="nl-repertoire-levels"
            role="tablist"
            aria-label="Repertoire levels"
          >
            {CM_LEVELS.map(l => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={selectedLevel === l.id}
                className={
                  'nl-repertoire-level-chip' +
                  (selectedLevel === l.id ? ' is-active' : '')
                }
                onClick={() => setSelectedLevel(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>

          {currentLevel && (
            <div className="nl-repertoire-level-summary">
              <div className="nl-repertoire-level-summary__stat">
                <span className="nl-repertoire-level-summary__label">Pieces required</span>
                <span className="nl-repertoire-level-summary__value">
                  {currentLevel.requirements.pieces}
                </span>
              </div>
              <div className="nl-repertoire-level-summary__stat">
                <span className="nl-repertoire-level-summary__label">Memorized</span>
                <span className="nl-repertoire-level-summary__value">
                  {currentLevel.requirements.memorized}
                </span>
              </div>
              {currentLevel.requirements.notes && (
                <div className="nl-repertoire-level-summary__notes">
                  <span className="nl-repertoire-level-summary__label">Notes</span>
                  <p>{currentLevel.requirements.notes}</p>
                </div>
              )}
            </div>
          )}

          {currentLevel && currentLevel.categories.length > 1 && (
            <div
              className="nl-repertoire-subtabs"
              role="tablist"
              aria-label="Repertoire categories"
            >
              {currentLevel.categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === c.id}
                  className={
                    'nl-repertoire-subtab' +
                    (selectedCategory === c.id ? ' is-active' : '')
                  }
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {c.label} <em>({c.repertoire.length})</em>
                </button>
              ))}
            </div>
          )}

          {cmEntries.length === 0 ? (
            <div className="nl-repertoire-empty">
              <p className="nl-repertoire-empty__title">No repertoire matches.</p>
              <p className="nl-repertoire-empty__sub">
                Try a different search or reset the filters.
              </p>
              <button
                type="button"
                className="nl-repertoire-empty__reset"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="nl-repertoire-table">
              <div className="nl-repertoire-table__header">
                <span>Composer</span>
                <span>Title</span>
                <span>Publisher</span>
                <span aria-hidden />
              </div>
              {cmEntries.map((entry, i) => (
                <a
                  key={`${entry.composer}-${entry.title}-${i}`}
                  href={imslpUrl(entry.composer, entry.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nl-repertoire-row"
                  title="Search on IMSLP"
                >
                  <span className="nl-repertoire-row__composer">{entry.composer}</span>
                  <span className="nl-repertoire-row__title">
                    {entry.title}
                    {entry.restrictions && (
                      <em className="nl-repertoire-row__restrictions">
                        {' '}{entry.restrictions}
                      </em>
                    )}
                  </span>
                  <span className="nl-repertoire-row__publisher">
                    {expandPublisher(entry.publisher)}
                  </span>
                  <span className="nl-repertoire-row__arrow" aria-hidden>↗</span>
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {magrathLoading && !magrathData ? (
            <div className="nl-repertoire-empty">
              <p className="nl-repertoire-empty__title">Loading Magrath data…</p>
            </div>
          ) : magrathData ? (
            <>
              <div className="nl-repertoire-magrath-attribution">
                <span className="nl-repertoire-magrath-attribution__eyebrow">
                  JANE MAGRATH · ALFRED PUBLISHING, 1995
                </span>
                <p className="nl-repertoire-magrath-attribution__body">
                  3,141 entries · 552 composers · 4 periods · Levels 1 to 10
                </p>
              </div>

              <div
                className="nl-repertoire-periods"
                role="tablist"
                aria-label="Repertoire periods"
              >
                {magrathData.periods.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={magrathPeriod === p.id}
                    className={
                      'nl-repertoire-period-chip' +
                      (magrathPeriod === p.id ? ' is-active' : '')
                    }
                    onClick={() => setMagrathPeriod(p.id)}
                  >
                    {p.label} <em>({p.entries.length})</em>
                  </button>
                ))}
              </div>

              <div className="nl-repertoire-level-pills-row">
                <span className="nl-repertoire-level-pills-row__label">Level</span>
                <div
                  className="nl-repertoire-level-pills"
                  role="group"
                  aria-label="Magrath levels"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={magrathLevels.has(n)}
                      className={
                        'nl-repertoire-level-pill' +
                        (magrathLevels.has(n) ? ' is-active' : '')
                      }
                      onClick={() => toggleMagrathLevel(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="nl-repertoire-level-pills-row__count">
                  {magrathEntries.length} entries
                </span>
              </div>

              {magrathEntries.length === 0 ? (
                <div className="nl-repertoire-empty">
                  <p className="nl-repertoire-empty__title">No repertoire matches.</p>
                  <p className="nl-repertoire-empty__sub">
                    Try a different search or reset the filters.
                  </p>
                  <button
                    type="button"
                    className="nl-repertoire-empty__reset"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="nl-repertoire-table nl-repertoire-table--magrath">
                  <div className="nl-repertoire-table__header">
                    <span>Level</span>
                    <span>Composer</span>
                    <span>Title</span>
                    <span>Description</span>
                    <span aria-hidden />
                  </div>
                  {magrathEntries.map((entry, i) => (
                    <a
                      key={`${entry.composer}-${entry.title}-${i}`}
                      href={imslpUrl(entry.composer, entry.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nl-repertoire-row"
                      title="Search on IMSLP"
                    >
                      <span className="nl-repertoire-row__level">{entry.level}</span>
                      <span className="nl-repertoire-row__composer">{entry.composer}</span>
                      <span className="nl-repertoire-row__title">
                        {entry.title || (
                          <em>{entry.description.slice(0, 60)}…</em>
                        )}
                      </span>
                      <span className="nl-repertoire-row__description">
                        {entry.description}
                      </span>
                      <span className="nl-repertoire-row__arrow" aria-hidden>↗</span>
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {showToast && (
        <div className="nl-repertoire-unlock-toast" role="status">
          Magrath Guide unlocked.
        </div>
      )}
    </div>
  )
}
