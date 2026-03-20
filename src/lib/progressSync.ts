import { getSupabaseClient } from './supabase'
import { CardProgress, ProgressStore } from './types'

// Load progress — tries Supabase first, falls back to localStorage
export async function loadProgress(userId: string | null): Promise<ProgressStore> {
  if (!userId) {
    try {
      return JSON.parse(localStorage.getItem('notelab-progress') || '{}')
    } catch {
      return {}
    }
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)

  if (error || !data) return {}

  const store: ProgressStore = {}
  data.forEach((row: any) => {
    store[`${row.deck_id}-${row.card_id}`] = {
      easeFactor: row.ease_factor,
      interval: row.interval,
      repetitions: row.repetitions,
      dueDate: row.due_date,
    }
  })
  return store
}

// Save a single card's progress
export async function saveCardProgress(
  userId: string | null,
  deckId: string,
  cardId: number,
  progress: CardProgress
) {
  // Always save to localStorage as backup
  try {
    const existing = JSON.parse(localStorage.getItem('notelab-progress') || '{}')
    existing[`${deckId}-${cardId}`] = progress
    localStorage.setItem('notelab-progress', JSON.stringify(existing))
  } catch {}

  if (!userId) return

  const supabase = getSupabaseClient()
  await supabase.from('progress').upsert({
    user_id: userId,
    deck_id: deckId,
    card_id: cardId,
    ease_factor: progress.easeFactor,
    interval: progress.interval,
    repetitions: progress.repetitions,
    due_date: progress.dueDate,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,deck_id,card_id' })
}
