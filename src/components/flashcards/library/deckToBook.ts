import { Deck, ProgressStore, Tier } from '@/lib/types'
import { isDue } from '@/lib/sm2'
import type { BookProps, BookHeight, BookWidth, BookState, BookTier, BookTopic } from './Book'

const TOPIC_SET: ReadonlySet<BookTopic> = new Set([
  'pitch', 'rhythm', 'harmony', 'expression', 'notation', 'form', 'technique',
  'analysis', 'aural', 'construction',
])

export function firstTopic(deck: Deck): BookTopic | undefined {
  if (!deck.tags) return undefined
  for (const tag of deck.tags) {
    if (tag.startsWith('topic:')) {
      const t = tag.slice('topic:'.length) as BookTopic
      if (TOPIC_SET.has(t)) return t
    }
  }
  return undefined
}

const ROMAN: Record<number, string> = {
  1: 'i', 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v',
  6: 'vi', 7: 'vii', 8: 'viii', 9: 'ix', 10: 'x',
  11: 'xi', 12: 'xii', 13: 'xiii', 14: 'xiv', 15: 'xv',
  16: 'xvi', 17: 'xvii', 18: 'xviii', 19: 'xix', 20: 'xx',
}
function roman(n: number | undefined): string | undefined {
  if (!n || n < 1) return undefined
  return ROMAN[n] ?? String(n)
}

const TIER_MAP: Record<Tier, BookTier> = {
  foundations: 'found',
  intermediate: 'inter',
  advanced: 'adv',
  application: 'adv',
}

const TIER_LABEL: Record<Tier, string> = {
  foundations: 'Foundations',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  application: 'Application',
}

function pickHeight(cardCount: number): BookHeight {
  if (cardCount <= 8) return 's'
  if (cardCount <= 12) return 'm'
  if (cardCount <= 15) return 'l'
  return 'xl'
}

// Width varies on tierOrder so each shelf reads as varied without being random.
function pickWidth(tierOrder: number | undefined, cardCount: number): BookWidth {
  if (cardCount > 14) return 'thick'
  if (cardCount < 8) return 'thin'
  const o = tierOrder ?? 0
  if (o % 5 === 0) return 'thick'
  if (o % 3 === 0) return 'thin'
  return 'med'
}

function relTime(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 0) return 'soon'
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 14) return 'last week'
  if (days < 28) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export interface DeckProgressSummary {
  state: BookState
  dueCount: number
  learning: number
  mastered: number
  pctMastered: number
  lastSeenLabel?: string
  lastSeenAt?: number
}

export function summarize(deck: Deck, progress: ProgressStore): DeckProgressSummary {
  let due = 0
  let learning = 0
  let mastered = 0
  let touched = 0
  let lastSeenAt: number | undefined

  for (const card of deck.cards) {
    const p = progress[`${deck.id}-${card.id}`]
    if (!p) continue
    touched++
    // Track most recent "due-set" time as a proxy for last seen — dueDate
    // minus interval gives the moment we last reviewed. Avoids needing
    // updated_at locally.
    const seenAt = p.dueDate - p.interval * 86400000
    if (lastSeenAt === undefined || seenAt > lastSeenAt) lastSeenAt = seenAt
    if ((p.repetitions ?? 0) >= 2 && (p.interval ?? 0) >= 21) {
      mastered++
    } else if (isDue(p)) {
      due++
    } else {
      learning++
    }
  }

  const total = deck.cards.length || 1
  const pctMastered = mastered / total

  let state: BookState = 'new'
  if (touched > 0) {
    if (mastered === deck.cards.length) state = 'mastered'
    else state = 'active'
  }

  return {
    state,
    dueCount: due,
    learning,
    mastered,
    pctMastered,
    lastSeenAt,
    lastSeenLabel: lastSeenAt ? relTime(lastSeenAt) : undefined,
  }
}

export function deckToBookProps(deck: Deck, progress: ProgressStore): BookProps | null {
  if (!deck.tier) return null
  const summary = summarize(deck, progress)
  const tier = TIER_MAP[deck.tier]
  return {
    id: deck.id,
    href: `/study/${deck.id}`,
    title: deck.title,
    volume: roman(deck.tierOrder),
    tier,
    topic: firstTopic(deck),
    height: pickHeight(deck.cards.length),
    width: pickWidth(deck.tierOrder, deck.cards.length),
    state: summary.state,
    cardCount: deck.cards.length,
    dueCount: summary.dueCount,
    learning: summary.learning,
    mastered: summary.mastered,
    categoryLabel: deck.category ?? TIER_LABEL[deck.tier],
    lastSeenLabel: summary.lastSeenLabel,
    pctMastered: summary.pctMastered,
  }
}
