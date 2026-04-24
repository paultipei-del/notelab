'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { DECKS } from '@/lib/decks'
import { useAuth } from '@/hooks/useAuth'
import { Deck, DeckCategory, Tier } from '@/lib/types'
import DeckTile from '@/components/flashcards/DeckTile'
import ContinueAnchor from '@/components/flashcards/ContinueAnchor'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const TIER_ORDER: Tier[] = ['foundations', 'intermediate', 'advanced', 'application']

const TIER_LABELS: Record<Tier, string> = {
  foundations: 'Foundations',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  application: 'Application & Review',
}

// Canonical category order within a tier. Any category not listed here falls
// back to alphabetical at the end.
const CATEGORY_ORDER: DeckCategory[] = [
  'Notation & Terms',
  'Music symbols',
  'Pitch & Harmony',
  'Rhythm & Meter',
  'Form & Structure',
  'Reading & Analysis',
  'Construction',
  'Applied Reading',
  'Applied Listening',
]

const TIER_DESCRIPTIONS: Partial<Record<Tier, string>> = {
  application:
    'Cross-concept problems that test how theory fits together. Each card combines multiple ideas — recognition, construction, and reasoning — in the way real music theory questions appear.',
}

type TierCollapseState = Record<Tier, boolean>

const STORAGE_KEY = 'notelab.flashcards.tierCollapseState'
// `true` = collapsed, `false` = expanded. First-visit default: only Foundations
// is expanded.
const DEFAULT_COLLAPSE: TierCollapseState = {
  foundations: false,
  intermediate: true,
  advanced: true,
  application: true,
}

// localStorage-backed external store for the collapse map. Reads stay stable
// (returns the same object until the stored value actually changes) so
// useSyncExternalStore doesn't churn renders.
const COLLAPSE_EVENT = 'notelab:flashcards-collapse-change'

let cachedSnapshot: TierCollapseState | null = null
let cachedRaw: string | null = null

function readStoredCollapse(): TierCollapseState {
  if (typeof window === 'undefined') return DEFAULT_COLLAPSE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw && cachedSnapshot) return cachedSnapshot
    cachedRaw = raw
    if (!raw) {
      cachedSnapshot = DEFAULT_COLLAPSE
      return cachedSnapshot
    }
    const parsed = JSON.parse(raw) as Partial<TierCollapseState>
    cachedSnapshot = { ...DEFAULT_COLLAPSE, ...parsed }
    return cachedSnapshot
  } catch {
    cachedSnapshot = DEFAULT_COLLAPSE
    return cachedSnapshot
  }
}

function subscribeCollapse(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  window.addEventListener(COLLAPSE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(COLLAPSE_EVENT, onChange)
  }
}

function writeCollapse(next: TierCollapseState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    // Invalidate cache so the next read returns the new snapshot.
    cachedRaw = null
    cachedSnapshot = null
    window.dispatchEvent(new Event(COLLAPSE_EVENT))
  } catch { /* quota / privacy mode — ignore */ }
}

function groupDecksByCategory(decks: Deck[]): Map<DeckCategory, Deck[]> {
  const out = new Map<DeckCategory, Deck[]>()
  for (const d of decks) {
    if (!d.category) continue
    const list = out.get(d.category) ?? []
    list.push(d)
    out.set(d.category, list)
  }
  for (const list of out.values()) {
    list.sort((a, b) => (a.tierOrder ?? 0) - (b.tierOrder ?? 0))
  }
  return out
}

function sortedCategories(map: Map<DeckCategory, Deck[]>): DeckCategory[] {
  const present = Array.from(map.keys())
  const known = CATEGORY_ORDER.filter(c => present.includes(c))
  const unknown = present.filter(c => !CATEGORY_ORDER.includes(c)).sort()
  return [...known, ...unknown]
}

export default function FlashcardsPage() {
  const { user, loading } = useAuth()
  const collapse = useSyncExternalStore(
    subscribeCollapse,
    readStoredCollapse,
    () => DEFAULT_COLLAPSE,
  )

  useEffect(() => {
    if (!loading && !user) window.location.href = '/landing'
  }, [loading, user])

  const toggleTier = (tier: Tier) =>
    writeCollapse({ ...collapse, [tier]: !collapse[tier] })

  // Only decks with a `tier` show here — others (CM-tagged, ear training,
  // sight-read, grand-staff) intentionally stay off the flashcards landing.
  const tieredDecks: Record<Tier, Deck[]> = {
    foundations: [],
    intermediate: [],
    advanced: [],
    application: [],
  }
  for (const d of DECKS) {
    if (d.tier) tieredDecks[d.tier].push(d)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 64px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>
            Flashcards
          </h1>
          <p style={{ fontFamily: F, fontSize: '15px', fontWeight: 300, color: '#7A7060', lineHeight: 1.7, maxWidth: '560px', margin: 0 }}>
            Spaced repetition collections for terms, symbols, and notation
          </p>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <ContinueAnchor />
        </div>

        {TIER_ORDER.map(tier => {
          const decks = tieredDecks[tier]
          const isCollapsed = collapse[tier]
          const byCategory = groupDecksByCategory(decks)
          const categories = sortedCategories(byCategory)
          const empty = categories.length === 0

          return (
            <section key={tier} style={{ marginBottom: '40px' }}>
              <button
                type="button"
                onClick={() => toggleTier(tier)}
                aria-expanded={!isCollapsed}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '0 0 16px 0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#2A2318',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    fontFamily: F,
                    fontSize: '14px',
                    color: '#7A7060',
                    width: '14px',
                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 0.18s ease',
                  }}
                >
                  ▸
                </span>
                <h2 style={{
                  fontFamily: F,
                  fontWeight: 500,
                  fontSize: '16px',
                  color: '#2A2318',
                  margin: 0,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}>
                  {TIER_LABELS[tier]}
                </h2>
              </button>

              {!isCollapsed && (
                <div style={{ paddingLeft: '0' }}>
                  {TIER_DESCRIPTIONS[tier] && (
                    <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#7A7060', fontStyle: 'italic', margin: '4px 0 20px', lineHeight: 1.7, maxWidth: '620px' }}>
                      {TIER_DESCRIPTIONS[tier]}
                    </p>
                  )}
                  {empty ? (
                    <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#7A7060', fontStyle: 'italic', margin: '4px 0 8px' }}>
                      No decks in this tier yet.
                    </p>
                  ) : tier === 'application' ? (
                    // Application & Review renders as a single flat grid —
                    // no subsection labels — so one card per category doesn't
                    // collapse to a narrow left-aligned column.
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', alignItems: 'stretch' }}>
                      {decks
                        .slice()
                        .sort((a, b) => (a.tierOrder ?? 0) - (b.tierOrder ?? 0))
                        .map(deck => <DeckTile key={deck.id} deck={deck} />)}
                    </div>
                  ) : (
                    categories.map(cat => {
                      const list = byCategory.get(cat) ?? []
                      return (
                        <div key={cat} style={{ marginBottom: '28px' }}>
                          <p style={{
                            fontFamily: F,
                            fontSize: 'var(--nl-text-compact)',
                            fontWeight: 400,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: '#7A7060',
                            marginBottom: '10px',
                          }}>
                            {cat}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', alignItems: 'stretch' }}>
                            {list.map(deck => <DeckTile key={deck.id} deck={deck} />)}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
