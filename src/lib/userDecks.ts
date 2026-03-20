import { Deck, Card, DeckTag } from './types'

const STORAGE_KEY = 'notelab-user-decks'

export function getUserDecks(): Deck[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveUserDecks(decks: Deck[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
}

export function createDeck(title: string, description: string, tag: DeckTag): Deck {
  const deck: Deck = {
    id: `user-${Date.now()}`,
    title,
    description,
    tag,
    cards: [],
  }
  const existing = getUserDecks()
  saveUserDecks([...existing, deck])
  return deck
}

export function updateDeck(id: string, updates: Partial<Omit<Deck, 'id'>>): void {
  const decks = getUserDecks()
  saveUserDecks(decks.map(d => d.id === id ? { ...d, ...updates } : d))
}

export function deleteDeck(id: string): void {
  const decks = getUserDecks()
  saveUserDecks(decks.filter(d => d.id !== id))
}

export function addCard(deckId: string, card: Omit<Card, 'id'>): Card {
  const decks = getUserDecks()
  const deck = decks.find(d => d.id === deckId)
  if (!deck) throw new Error('Deck not found')
  const newCard: Card = { ...card, id: Date.now() }
  deck.cards = [...deck.cards, newCard]
  saveUserDecks(decks)
  return newCard
}

export function updateCard(deckId: string, cardId: number, updates: Partial<Card>): void {
  const decks = getUserDecks()
  const deck = decks.find(d => d.id === deckId)
  if (!deck) return
  deck.cards = deck.cards.map(c => c.id === cardId ? { ...c, ...updates } : c)
  saveUserDecks(decks)
}

export function deleteCard(deckId: string, cardId: number): void {
  const decks = getUserDecks()
  const deck = decks.find(d => d.id === deckId)
  if (!deck) return
  deck.cards = deck.cards.filter(c => c.id !== cardId)
  saveUserDecks(decks)
}

export function reorderCards(deckId: string, cards: Card[]): void {
  const decks = getUserDecks()
  const deck = decks.find(d => d.id === deckId)
  if (!deck) return
  deck.cards = cards
  saveUserDecks(decks)
}
