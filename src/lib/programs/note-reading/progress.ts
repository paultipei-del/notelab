'use client'

// Progress is stored in localStorage for fast rendering.
// Each completed session is also written to Supabase for cross-device sync (best-effort).
//
// Supabase tables required (create via dashboard or migration):
//
// CREATE TABLE note_reading_sessions (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id uuid REFERENCES auth.users(id),
//   module_id text NOT NULL,
//   tool text NOT NULL,  -- 'identify' | 'play'
//   accuracy numeric NOT NULL,
//   avg_response_ms numeric,
//   note_results jsonb,  -- { [pitch]: { correct: number; total: number } }
//   created_at timestamptz DEFAULT now()
// );

import { getNRModule } from './modules'

const STORAGE_KEY = 'notelab-nr-progress-v1'

export interface NRSessionRecord {
  accuracy: number
  avgResponseMs?: number
  timestamp: number
}

export interface NRToolProgress {
  sessions: NRSessionRecord[]
  mastered: boolean
}

export interface NRModuleProgress {
  identify: NRToolProgress
  play: NRToolProgress
  completed: boolean
}

export type NRProgressStore = Record<string, NRModuleProgress>

function emptyModuleProgress(): NRModuleProgress {
  return {
    identify: { sessions: [], mastered: false },
    play: { sessions: [], mastered: false },
    completed: false,
  }
}

export function loadNRProgress(): NRProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveNRProgress(store: NRProgressStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getNRModuleProgress(moduleId: string): NRModuleProgress {
  const store = loadNRProgress()
  return store[moduleId] ?? emptyModuleProgress()
}

// Check if a module is unlocked based on current progress
export function isNRModuleUnlocked(moduleId: string, store?: NRProgressStore): boolean {
  const mod = getNRModule(moduleId)
  if (!mod) return false
  if (mod.unlockAfter.length === 0) return true
  const s = store ?? loadNRProgress()
  return mod.unlockAfter.every(prereqId => {
    const prereq = s[prereqId]
    return prereq?.completed === true
  })
}

// Check if the play tool is unlocked within a module
// (requires identify mastered if identify is in the tool list)
export function isNRPlayUnlocked(moduleId: string, store?: NRProgressStore): boolean {
  const mod = getNRModule(moduleId)
  if (!mod) return false
  if (!mod.tools.includes('identify')) return true  // play-only module
  const s = store ?? loadNRProgress()
  return s[moduleId]?.identify?.mastered === true
}

// Record a completed identify session and recompute mastery
export function recordNRIdentifySession(
  moduleId: string,
  accuracy: number,
): NRModuleProgress {
  const mod = getNRModule(moduleId)
  if (!mod) return emptyModuleProgress()

  const store = loadNRProgress()
  const mp = store[moduleId] ?? emptyModuleProgress()

  const record: NRSessionRecord = { accuracy, timestamp: Date.now() }
  mp.identify.sessions = [...mp.identify.sessions, record]

  // Compute mastery: last N sessions all meet accuracy threshold
  const needed = mod.criteria.sessions
  const threshold = mod.criteria.identifyAccuracy ?? 0.9
  const recent = mp.identify.sessions.slice(-needed)
  mp.identify.mastered =
    recent.length >= needed && recent.every(s => s.accuracy >= threshold)

  // Module complete if all tools mastered
  mp.completed = checkModuleComplete(mod, mp)

  store[moduleId] = mp
  saveNRProgress(store)
  return mp
}

// Record a completed play session and recompute mastery
export function recordNRPlaySession(
  moduleId: string,
  accuracy: number,
  avgResponseMs: number,
): NRModuleProgress {
  const mod = getNRModule(moduleId)
  if (!mod) return emptyModuleProgress()

  const store = loadNRProgress()
  const mp = store[moduleId] ?? emptyModuleProgress()

  const record: NRSessionRecord = { accuracy, avgResponseMs, timestamp: Date.now() }
  mp.play.sessions = [...mp.play.sessions, record]

  const needed = mod.criteria.sessions
  const threshold = mod.criteria.playAccuracy ?? 0.9
  const msThreshold = mod.criteria.playAvgResponseMs

  const recent = mp.play.sessions.slice(-needed)
  mp.play.mastered =
    recent.length >= needed &&
    recent.every(s =>
      s.accuracy >= threshold &&
      (msThreshold === undefined || (s.avgResponseMs ?? Infinity) <= msThreshold)
    )

  mp.completed = checkModuleComplete(mod, mp)
  store[moduleId] = mp
  saveNRProgress(store)
  return mp
}

function checkModuleComplete(mod: ReturnType<typeof getNRModule>, mp: NRModuleProgress): boolean {
  if (!mod) return false
  if (mod.tools.includes('identify') && !mp.identify.mastered) return false
  if (mod.tools.includes('play') && !mp.play.mastered) return false
  return true
}

// How many consecutive passing sessions do we have for a tool?
export function nrConsecutivePassing(
  moduleId: string,
  tool: 'identify' | 'play',
  store?: NRProgressStore,
): number {
  const mod = getNRModule(moduleId)
  if (!mod) return 0
  const s = store ?? loadNRProgress()
  const mp = s[moduleId]
  if (!mp) return 0

  const sessions = mp[tool].sessions
  const needed = mod.criteria.sessions
  const threshold =
    tool === 'identify'
      ? (mod.criteria.identifyAccuracy ?? 0.9)
      : (mod.criteria.playAccuracy ?? 0.9)
  const msThreshold = tool === 'play' ? mod.criteria.playAvgResponseMs : undefined

  let count = 0
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i]
    const accOk = s.accuracy >= threshold
    const msOk = msThreshold === undefined || (s.avgResponseMs ?? Infinity) <= msThreshold
    if (accOk && msOk) {
      count++
      if (count >= needed) break
    } else {
      break
    }
  }
  return Math.min(count, needed)
}
