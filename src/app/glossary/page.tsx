'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { GLOSSARY, type GlossaryLanguage } from '@/lib/glossaryData'

type Filter = 'All' | GlossaryLanguage

interface FilterDef {
  id: Filter
  label: string
}

const FILTERS: FilterDef[] = [
  { id: 'All',           label: 'All' },
  { id: 'French',        label: 'French' },
  { id: 'German',        label: 'German' },
  { id: 'Italian',       label: 'Italian' },
  { id: 'Notation',      label: 'Notation' },
  { id: 'Form',          label: 'Form' },
  { id: 'Theory',        label: 'Theory' },
  { id: 'Abbreviation',  label: 'Abbr.' },
]

// Tag CSS modifier per language. Ornament + Affekt aren't in the
// 7-chip set but their entries still appear under All / search;
// they fall back to the neutral notation palette.
const TAG_CLASS_MAP: Record<GlossaryLanguage, string> = {
  French:        'french',
  German:        'german',
  Italian:       'italian',
  Notation:      'notation',
  Form:          'form',
  Theory:        'theory',
  Abbreviation:  'abbreviation',
  Ornament:      'notation',
  Affekt:        'notation',
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function SearchIcon() {
  return (
    <svg
      className="nl-glossary-search__icon"
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

export default function GlossaryPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [currentLetter, setCurrentLetter] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  // Debounce search by 150ms — 848-entry corpus needs it for
  // smooth typing on slower devices.
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), 150)
    return () => window.clearTimeout(id)
  }, [query])

  // ⌘K / Ctrl+K focuses the search input. Only the global shortcut;
  // input doesn't otherwise hijack keys.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim()
    return GLOSSARY.filter(e => {
      if (filter !== 'All' && e.language !== filter) return false
      if (!q) return true
      return (
        e.term.toLowerCase().includes(q) ||
        e.definition.toLowerCase().includes(q)
      )
    })
  }, [debouncedQuery, filter])

  const grouped = useMemo(() => {
    const map: Record<string, typeof GLOSSARY> = {}
    for (const e of results) {
      const letter = (e.term[0] ?? '#').toUpperCase()
      if (!map[letter]) map[letter] = []
      map[letter].push(e)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [results])

  // Track which letter section is currently nearest the viewport
  // top for the alphabet jump strip highlight.
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // Pick the section closest to the viewport top among those
        // currently intersecting. rootMargin biases the trigger
        // line just below the sticky toolbar.
        const intersecting = entries.filter(e => e.isIntersecting)
        if (intersecting.length === 0) return
        const top = intersecting.reduce((nearest, e) =>
          e.boundingClientRect.top < nearest.boundingClientRect.top ? e : nearest,
        intersecting[0])
        const letter = top.target.id.replace('letter-', '').toUpperCase()
        setCurrentLetter(letter)
      },
      // Trigger zone is between the toolbar bottom and 60% down
      // the viewport. Anything below 60% doesn't count as "current".
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
    )
    const sections = document.querySelectorAll('.nl-glossary-letter-section')
    sections.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [grouped])

  function scrollToLetter(letter: string) {
    const el = document.getElementById(`letter-${letter.toLowerCase()}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function resetFilters() {
    setQuery('')
    setFilter('All')
    searchRef.current?.focus()
  }

  const totalCount = GLOSSARY.length
  const filterLabel = filter === 'All' ? 'all categories' : filter

  // Which letters have entries under the current filter+search. Used
  // to disable rail letters that would scroll to an empty section.
  const availableLetters = useMemo(
    () => new Set(grouped.map(([letter]) => letter)),
    [grouped],
  )

  return (
    <div className="nl-glossary-page">
      <header className="nl-glossary-hero">
        <span className="nl-glossary-hero__eyebrow">GLOSSARY</span>
        <h1 className="nl-glossary-hero__title">
          Look it <em>up.</em>
        </h1>
        <p className="nl-glossary-hero__sub">
          A reference of musical terms. French, German, Italian,
          notation marks, form, theory, and common abbreviations.
        </p>
        <p className="nl-glossary-hero__count">
          <b>{totalCount} terms</b> across 7 categories · all free
        </p>
      </header>

      <div className="nl-glossary-toolbar">
        <Link href="/tools" className="nl-glossary-toolbar__back">
          ← Back to tools
        </Link>
        <label className="nl-glossary-search">
          <SearchIcon />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search terms or definitions"
            className="nl-glossary-search__input"
            aria-label="Search glossary"
          />
          <span className="nl-glossary-search__hint" aria-hidden>⌘K</span>
        </label>
        <div className="nl-glossary-chips" role="tablist" aria-label="Filter by category">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={
                'nl-glossary-chip' + (filter === f.id ? ' is-active' : '')
              }
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="nl-glossary-result-meta">
        <span className="nl-glossary-result-meta__count">
          <b>{results.length} of {totalCount}</b>, {filterLabel}
        </span>
      </div>

      {/* Body wraps the main content + rail into a 2-column grid
          so the rail can use position: sticky and live in the DOM
          flow next to entries. Sticky needs a scrolling ancestor
          that doesn't have overflow: hidden — the body inherits
          html scrolling, which is what we want. */}
      <div className="nl-glossary-body">
        <div className="nl-glossary-body__main">
          {grouped.length === 0 ? (
            <div className="nl-glossary-empty">
              <p className="nl-glossary-empty__title">No terms match.</p>
              <p className="nl-glossary-empty__sub">
                Try a different search or reset the filter.
              </p>
              <button
                type="button"
                className="nl-glossary-empty__reset"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="nl-glossary-entries">
          {grouped.map(([letter, entries]) => (
            <section
              key={letter}
              id={`letter-${letter.toLowerCase()}`}
              className="nl-glossary-letter-section"
            >
              <h2 className="nl-glossary-letter-mark" aria-hidden>{letter}</h2>
              {entries.map((entry, i) => (
                <article key={`${letter}-${i}`} className="nl-glossary-entry">
                  <span className="nl-glossary-term">{entry.term}</span>
                  <span
                    className={
                      'nl-glossary-tag nl-glossary-tag--' +
                      TAG_CLASS_MAP[entry.language]
                    }
                  >
                    {entry.language}
                  </span>
                  <p className="nl-glossary-def">{entry.definition}</p>
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
        </div>

        {/* Vertical alphabet rail. position: sticky relative to
            .nl-glossary-body; at scroll-top it sits at the top of
            its grid cell (inline with entries), then pins to
            top: 152px once scrolled past. Hidden on mobile +
            short viewports via media query. */}
        <nav className="nl-glossary-rail" aria-label="Jump to letter">
          {ALPHABET.map(L => {
            const available = availableLetters.has(L)
            return (
              <button
                key={L}
                type="button"
                className={
                  'nl-glossary-rail__letter' +
                  (currentLetter === L && available ? ' is-current' : '') +
                  (available ? '' : ' is-disabled')
                }
                onClick={() => available && scrollToLetter(L)}
                aria-label={`Jump to ${L}`}
                aria-disabled={!available}
                tabIndex={available ? 0 : -1}
              >
                {L}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
