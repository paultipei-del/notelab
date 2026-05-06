import { getSupabaseClient } from './supabase'
import { CardProgress, ProgressStore } from './types'

function readLocalProgress(): ProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('notelab-progress') || '{}')
  } catch {
    return {}
  }
}

// Load progress — for signed-in users, merge Supabase rows with the
// localStorage mirror. saveCardProgress writes localStorage synchronously
// before firing the (async) Supabase upsert, so a freshly-completed session
// can be in localStorage before the network round-trip lands. Letting
// localStorage override the Supabase response keeps the Today strip /
// resume / streak in sync with the most recent activity even when the
// user navigates back to /flashcards immediately after studying.
export async function loadProgress(userId: string | null): Promise<ProgressStore> {
  const local = readLocalProgress()

  if (!userId) return local

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)

  if (error || !data) return local

  const remote: ProgressStore = {}
  data.forEach((row: any) => {
    remote[`${row.deck_id}-${row.card_id}`] = {
      easeFactor: row.ease_factor,
      interval: row.interval,
      repetitions: row.repetitions,
      dueDate: row.due_date,
    }
  })
  // localStorage wins per-key — it's the freshest copy on this device.
  return { ...remote, ...local }
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
