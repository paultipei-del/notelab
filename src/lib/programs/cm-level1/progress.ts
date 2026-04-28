import { CM_LEVEL1_LESSONS } from './lessons'

const STORAGE_KEY = 'notelab-cm-level1-v1'

export interface CMLevel1SessionRecord {
  score: number
  total: number
  timestamp: number
}

export interface CMLevel1LessonProgress {
  sessions: CMLevel1SessionRecord[]
  completed: boolean
  bestScore: number
}

export type CMLevel1ProgressStore = Record<string, CMLevel1LessonProgress>

export function loadCMLevel1Progress(): CMLevel1ProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCMLevel1Progress(store: CMLevel1ProgressStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function recordCMLevel1Session(slug: string, score: number, total: number) {
  const store = loadCMLevel1Progress()
  const lesson = CM_LEVEL1_LESSONS.find(l => l.slug === slug)
  if (!lesson) return

  const prev = store[slug] ?? { sessions: [], completed: false, bestScore: 0 }
  const bestScore = Math.max(prev.bestScore, score)
  const completed = prev.completed || bestScore >= lesson.passingScore

  store[slug] = {
    sessions: [...prev.sessions, { score, total, timestamp: Date.now() }],
    completed,
    bestScore,
  }

  saveCMLevel1Progress(store)
}

export function isCMLevel1LessonUnlocked(slug: string, store?: CMLevel1ProgressStore): boolean {
  const lesson = CM_LEVEL1_LESSONS.find(l => l.slug === slug)
  if (!lesson) return false
  if (!lesson.unlockAfter) return true
  const currentStore = store ?? loadCMLevel1Progress()
  return currentStore[lesson.unlockAfter]?.completed ?? false
}
