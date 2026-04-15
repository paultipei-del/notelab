import { CM_PREP_LESSONS } from './lessons'

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
