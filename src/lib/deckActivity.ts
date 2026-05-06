// Deck-level "last visited" timestamps. Independent of SM-2 progress so
// that flip-mode reviews (which don't call rate()) still register as
// recent activity for the /flashcards "Last session" resume tile.

const STORAGE_KEY = 'notelab-deck-activity'

export type DeckActivityMap = Record<string, number>

export function readDeckActivity(): DeckActivityMap {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function markDeckVisited(deckId: string, ts: number = Date.now()): void {
  if (typeof window === 'undefined') return
  try {
    const existing = readDeckActivity()
    existing[deckId] = ts
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch {}
}
