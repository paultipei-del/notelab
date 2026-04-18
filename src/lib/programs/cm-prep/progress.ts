import { CM_PREP_LESSONS } from './lessons'
import { getSupabaseClient } from '@/lib/supabase'

const STORAGE_KEY = 'notelab-cm-prep-v1'

export interface CMPrepSessionRecord {
  score: number     // 0–1 fraction correct
  total: number
  timestamp: number
}

export interface CMPrepLessonProgress {
  sessions: CMPrepSessionRecord[]
  completed: boolean
  bestScore: number
}

export type CMPrepProgressStore = Record<string, CMPrepLessonProgress>

// ── localStorage (offline / signed-out fallback) ──────────────────────────────
export function loadCMPrepProgress(): CMPrepProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCMPrepProgress(store: CMPrepProgressStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getLessonProgress(slug: string): CMPrepLessonProgress | undefined {
  return loadCMPrepProgress()[slug]
}

export function recordCMPrepSession(slug: string, score: number, total: number) {
  const store = loadCMPrepProgress()
  const lesson = CM_PREP_LESSONS.find(l => l.slug === slug)
  if (!lesson) return

  const prev = store[slug] ?? { sessions: [], completed: false, bestScore: 0 }
  const newBest = Math.max(prev.bestScore, score)
  const completed = prev.completed || newBest >= lesson.passingScore

  store[slug] = {
    sessions: [...prev.sessions, { score, total, timestamp: Date.now() }],
    completed,
    bestScore: newBest,
  }
  saveCMPrepProgress(store)
}

export function isCMPrepLessonUnlocked(slug: string, store?: CMPrepProgressStore): boolean {
  const lesson = CM_PREP_LESSONS.find(l => l.slug === slug)
  if (!lesson) return false
  if (!lesson.unlockAfter) return true
  const s = store ?? loadCMPrepProgress()
  return s[lesson.unlockAfter]?.completed ?? false
}

export function cmPrepSummary(store: CMPrepProgressStore) {
  const total = CM_PREP_LESSONS.length
  const done = CM_PREP_LESSONS.filter(l => store[l.slug]?.completed).length
  return { done, total }
}

// ── Supabase sync (signed-in users) ──────────────────────────────────────────
// Load every row for this user and merge into a CMPrepProgressStore. Falls back
// to localStorage if the request fails. Also seeds Supabase with any local
// progress on first sign-in (rows for this user don't exist yet).
export async function loadCMPrepProgressRemote(userId: string): Promise<CMPrepProgressStore> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('cm_prep_progress')
    .select('lesson_slug, sessions, completed, best_score')
    .eq('user_id', userId)

  if (error || !data) return loadCMPrepProgress()

  const remote: CMPrepProgressStore = {}
  data.forEach(row => {
    remote[row.lesson_slug] = {
      sessions: (row.sessions as CMPrepSessionRecord[]) ?? [],
      completed: row.completed,
      bestScore: row.best_score,
    }
  })

  // First-time seed: if the user has local progress but no remote rows, push up.
  if (data.length === 0) {
    const local = loadCMPrepProgress()
    const slugs = Object.keys(local)
    if (slugs.length > 0) {
      await supabase.from('cm_prep_progress').upsert(
        slugs.map(slug => ({
          user_id: userId,
          lesson_slug: slug,
          sessions: local[slug].sessions,
          completed: local[slug].completed,
          best_score: local[slug].bestScore,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'user_id,lesson_slug' }
      )
      // Keep the local cache in sync with what we just seeded
      saveCMPrepProgress(local)
      return local
    }
  }

  // Mirror remote to local so the next load has an offline-ready cache
  saveCMPrepProgress(remote)
  return remote
}

// Append a session to a single lesson's progress and upsert to Supabase.
// Returns the updated lesson record so callers can reflect it immediately.
export async function recordCMPrepSessionRemote(
  userId: string,
  slug: string,
  score: number,
  total: number,
): Promise<CMPrepLessonProgress | null> {
  const lesson = CM_PREP_LESSONS.find(l => l.slug === slug)
  if (!lesson) return null

  // Update local first so the UI never lags behind
  recordCMPrepSession(slug, score, total)
  const next = loadCMPrepProgress()[slug]!

  const supabase = getSupabaseClient()
  await supabase.from('cm_prep_progress').upsert({
    user_id: userId,
    lesson_slug: slug,
    sessions: next.sessions,
    completed: next.completed,
    best_score: next.bestScore,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_slug' })

  return next
}
