import type { Deck } from '@/lib/types'
import type { BookProps, BookTopic } from './Book'
import type { DeckProgressSummary } from './deckToBook'

export interface DeckWithSummary {
  deck: Deck
  book: BookProps
  summary: DeckProgressSummary
}

export interface SectionDef {
  id: string
  label: string
  /** Italic descriptor shown next to the section title when present. */
  subtitle?: string
  seeAllHref?: string
}

export interface Section<T = DeckWithSummary> extends SectionDef {
  items: T[]
}

/**
 * The seven topic sections that mirror the Shelves view. Order matters —
 * downstream views render in this order.
 */
export const TOPIC_SHELF_DEFS: ReadonlyArray<SectionDef & { topic: BookTopic }> = [
  { id: 'pitch',      label: 'Pitch',      subtitle: 'notes, scales, keys',                       topic: 'pitch'      },
  { id: 'rhythm',     label: 'Rhythm',     subtitle: 'time, meter, motion',                       topic: 'rhythm'     },
  { id: 'harmony',    label: 'Harmony',    subtitle: 'chords and the language between them',      topic: 'harmony'    },
  { id: 'expression', label: 'Expression', subtitle: 'tempo, dynamics, character',                 topic: 'expression' },
  { id: 'notation',   label: 'Notation',   subtitle: 'the page and its conventions',               topic: 'notation'   },
  { id: 'form',       label: 'Form',       subtitle: 'phrasing and architecture',                  topic: 'form'       },
  { id: 'technique',  label: 'Technique',  subtitle: 'the craft of playing',                       topic: 'technique'  },
]

/**
 * Group filtered decks into the same sections the Shelves view uses:
 *   1. Currently reading (active sets)
 *   2. Each topic shelf (non-active, non-application, by first topic tag)
 *   3. Practice & Review (non-active, application tier)
 *
 * Empty sections are kept in the returned array — callers decide whether
 * to render or skip empty sections (Cards/List skip; Shelves keeps them
 * because the section card always shows).
 */
export function groupBySection(items: DeckWithSummary[]): Section[] {
  const active = items.filter(d => d.book.state === 'active')
  const nonActive = items.filter(d => d.book.state !== 'active')

  const topicSections: Section[] = TOPIC_SHELF_DEFS.map(t => ({
    id: t.id,
    label: t.label,
    subtitle: t.subtitle,
    items: nonActive.filter(
      d => d.deck.tier !== 'application' && d.book.topic === t.topic,
    ),
  }))

  const practice: Section = {
    id: 'practice',
    label: 'Practice & Review',
    subtitle: 'cross-concept drills',
    items: nonActive.filter(d => d.deck.tier === 'application'),
  }

  return [
    {
      id: 'currently-reading',
      label: 'Currently reading',
      subtitle: undefined,
      items: active,
    },
    ...topicSections,
    practice,
  ]
}

/**
 * Translate the `summarize()` result to the three-state Cards/List status.
 */
export function deriveStatusState(
  summary: DeckProgressSummary,
): 'unstarted' | 'in-progress' | 'mastered' {
  if (summary.state === 'mastered') return 'mastered'
  if (summary.state === 'new') return 'unstarted'
  return 'in-progress'
}
