import { Deck, Card, DeckTag } from './types'
import { getSupabaseClient } from './supabase'

const STORAGE_KEY = 'notelab-user-decks'

function getLocalDecks(): Deck[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocalDecks(decks: Deck[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
}

export async function loadUserDecks(userId: string | null): Promise<Deck[]> {

  if (!userId) {
    return getLocalDecks()
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('user_decks')
    .select('*')
    .eq('user_id', userId)
    


  if (error || !data) {
    return getLocalDecks()
  }


  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    tag: row.tag as DeckTag,
    cards: row.cards as Card[],
  }))
}

export async function createDeck(
  title: string,
  description: string,
  tag: DeckTag,
  userId: string | null
): Promise<Deck> {
  const deck: Deck = {
    id: `user-${Date.now()}`,
    title,
    description,
    tag,
    cards: [],
  }

  const local = getLocalDecks()
  saveLocalDecks([...local, deck])

  if (userId) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('user_decks').insert({
      id: deck.id,
      user_id: userId,
      title: deck.title,
      description: deck.description,
      tag: deck.tag,
      cards: deck.cards,
    }).select()
  }

  return deck
}

export async function updateDeck(
  id: string,
  updates: Partial<Omit<Deck, 'id'>>,
  userId: string | null
): Promise<void> {
  const local = getLocalDecks()
  saveLocalDecks(local.map(d => d.id === id ? { ...d, ...updates } : d))

  if (userId) {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('user_decks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
  }
}

export async function deleteDeck(id: string, userId: string | null): Promise<void> {
  const local = getLocalDecks()
  saveLocalDecks(local.filter(d => d.id !== id))

  if (userId) {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('user_decks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
  }
}

export async function addCard(
  deckId: string,
  card: Omit<Card, 'id'>,
  userId: string | null
): Promise<Card> {
  const newCard: Card = { ...card, id: Date.now() }

  const local = getLocalDecks()
  const deck = local.find(d => d.id === deckId)
  if (deck) {
    deck.cards = [...deck.cards, newCard]
    saveLocalDecks(local)

    if (userId) {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('user_decks')
        .update({ cards: deck.cards, updated_at: new Date().toISOString() })
        .eq('id', deckId)
        .eq('user_id', userId)
    }
  }

  return newCard
}

export async function updateCard(
  deckId: string,
  cardId: number,
  updates: Partial<Card>,
  userId: string | null
): Promise<void> {
  const local = getLocalDecks()
  const deck = local.find(d => d.id === deckId)
  if (deck) {
    deck.cards = deck.cards.map(c => c.id === cardId ? { ...c, ...updates } : c)
    saveLocalDecks(local)

    if (userId) {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('user_decks')
        .update({ cards: deck.cards, updated_at: new Date().toISOString() })
        .eq('id', deckId)
        .eq('user_id', userId)
    }
  }
}

export async function deleteCard(
  deckId: string,
  cardId: number,
  userId: string | null
): Promise<void> {
  const local = getLocalDecks()
  const deck = local.find(d => d.id === deckId)
  if (deck) {
    deck.cards = deck.cards.filter(c => c.id !== cardId)
    saveLocalDecks(local)

    if (userId) {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('user_decks')
        .update({ cards: deck.cards, updated_at: new Date().toISOString() })
        .eq('id', deckId)
        .eq('user_id', userId)
    }
  }
}

export function getUserDecks(): Deck[] {
  return getLocalDecks()
}
