export type CardType = 'text' | 'staff' | 'image' | 'symbol' | 'audio'

export type DeckTag = 'free' | 'cm' | 'theory' | 'repertoire'

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
  audioPattern?: 'harmonic' | 'ascending' | 'descending' | 'cadence' | 'scale'
  audioLabel?: string          // shown on front: e.g. 'Major Triad'
  audioHint?: string           // optional hint: e.g. 'Root position, C major'
  audioDuration?: string       // Tone.js duration e.g. '4n', '2n', '1n'
}

export interface Deck {
  id: string
  title: string
  description: string
  tag: DeckTag
  cards: Card[]
  browseCards?: Card[] // optional override for browse view
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

export type StudyMode = 'flip' | 'mc' | 'type' | 'explain' | 'play'

export type RatingValue = 1 | 2 | 3

export interface SessionStats {
  correct: number
  total: number
  streak: number
  bestStreak: number
  streakHistory: Array<'hit' | 'miss'>
  startTime: number
}
