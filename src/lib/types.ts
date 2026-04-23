export type CardType = 'text' | 'staff' | 'image' | 'symbol' | 'audio'

export type DeckTag = 'free' | 'cm' | 'theory' | 'repertoire'

// Pedagogical tier — separate from product-axis `DeckTag`. Drives grouping on
// /flashcards. Application is reserved for cross-deck challenge decks (empty for now).
export type Tier = 'foundations' | 'intermediate' | 'advanced' | 'application'

export type DeckCategory =
  | 'Notation & Terms'
  | 'Music symbols'
  | 'Pitch & Harmony'
  | 'Rhythm & Meter'
  | 'Form & Structure'

export interface Card {
  id: number
  front: string
  back: string
  type: CardType
  // staff cards
  note?: string
  clef?: 'treble' | 'bass' | 'grand'
  // image cards
  imageUrl?: string
  // symbol cards
  symbolName?: string
  symbolLabel?: string
  // audio cards
  audioNotes?: string[]        // e.g. ['C4', 'E4', 'G4'] for harmonic playback
  audioChords?: string[][]     // e.g. [['C4','E4','G4'], ['G4','B4','D5']] for cadences
  audioPattern?: 'harmonic' | 'ascending' | 'descending' | 'cadence' | 'scale' | 'interval-ascending' | 'interval-descending' | 'chord-cascade'
  audioLabel?: string          // shown on front: e.g. 'Major Triad'
  audioHint?: string           // optional hint: e.g. 'Root position, C major'
  audioDuration?: string       // Tone.js duration e.g. '4n', '2n', '1n'
  // Pedagogical tags — union-merged with the parent deck's tags for filtering.
  tags?: string[]
}

export interface Deck {
  id: string
  title: string
  description: string
  tag: DeckTag
  cards: Card[]
  browseCards?: Card[] // optional override for browse view
  group?: string       // optional section label for grouped collection views
  // Pedagogical grouping — drives tier-sectioned /flashcards layout.
  tier?: Tier
  tierOrder?: number   // sort within (tier, category)
  category?: DeckCategory
  tags?: string[]      // pedagogical tags — controlled namespaces: era:, topic:, type:, lang:
}

export interface CardProgress {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: number
}

export type ProgressStore = Record<string, CardProgress>

export interface QueueCard extends Card {
  easeFactor?: number
  interval?: number
  repetitions?: number
  dueDate?: number
}

export type StudyMode = 'flip' | 'mc' | 'explain' | 'play'

export type RatingValue = 1 | 2 | 3

export interface SessionStats {
  correct: number
  total: number
  streak: number
  bestStreak: number
  streakHistory: Array<'hit' | 'miss'>
  startTime: number
}
