export type CardType = 'text' | 'staff' | 'image'

export type DeckTag = 'free' | 'cm' | 'theory' | 'repertoire'

export interface Card {
  id: number
  front: string
  back: string
  type: CardType
  note?: string       // for staff cards e.g. 'G4'
  clef?: 'treble' | 'bass'
  imageUrl?: string   // for image cards
}

export interface Deck {
  id: string
  title: string
  description: string
  tag: DeckTag
  cards: Card[]
}

export interface CardProgress {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: number
}

export type ProgressStore = Record<string, CardProgress>
// key format: `${deckId}-${cardId}`

export interface QueueCard extends Card {
  easeFactor?: number
  interval?: number
  repetitions?: number
  dueDate?: number
}

export type StudyMode = 'flip' | 'mc' | 'type'

export type RatingValue = 1 | 2 | 3
// 1 = Again, 2 = Hard, 3 = Easy

export interface SessionStats {
  correct: number
  total: number
  streak: number
  bestStreak: number
  streakHistory: Array<'hit' | 'miss'>
  startTime: number
}