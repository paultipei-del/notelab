export type CardType = 'text' | 'staff' | 'image' | 'symbol'

export type DeckTag = 'free' | 'cm' | 'theory' | 'repertoire'

export interface Card {
  id: number
  front: string       // for symbol cards: the Bravura unicode character(s), | separated for multiple
  back: string        // definition/explanation
  type: CardType
  note?: string       // for staff cards e.g. 'G4'
  clef?: 'treble' | 'bass'
  imageUrl?: string   // for image cards
  symbolName?: string // for symbol cards: the name shown on the answer (e.g. 'Fermata')
  symbolLabel?: string // optional label shown below symbol on front (e.g. 'Articulation')
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
