'use client'

import { getNRModule } from './modules'
import type { NoteResult, NoteStats, MasteryLevel } from './types'

const STORAGE_KEY = 'notelab-nr-progress-v1'

export interface NRSessionRecord {
  accuracy: number
  avgResponseMs?: number
  timestamp: number
  noteResults?: Record<string, NoteResult>  // per full-pitch: 'C4', 'F#4', etc.
}

export interface NRToolProgress {
  sessions: NRSessionRecord[]
  mastered: boolean
}

export interface NRModuleProgress {
  identify: NRToolProgress
  locate: NRToolProgress
  play: NRToolProgress
  completed: boolean
}

export type NRProgressStore = Record<string, NRModuleProgress>

function emptyModuleProgress(): NRModuleProgress {
  return {
    identify: { sessions: [], mastered: false },
    locate: { sessions: [], mastered: false },
    play: { sessions: [], mastered: false },
    completed: false,
  }
}

// Migration: modules saved before locate was introduced won't have the
// locate slot. Backfill it on read so downstream code never sees undefined.
function normalizeModuleProgress(raw: Partial<NRModuleProgress> | undefined): NRModuleProgress {
  const base = emptyModuleProgress()
  if (!raw) return base
  return {
    identify: raw.identify ?? base.identify,
    locate: raw.locate ?? base.locate,
    play: raw.play ?? base.play,
    completed: raw.completed ?? false,
  }
}

export function loadNRProgress(): NRProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Partial<NRModuleProgress>>
    const out: NRProgressStore = {}
    for (const [id, mp] of Object.entries(parsed)) out[id] = normalizeModuleProgress(mp)
    return out
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

export function isNRModuleUnlocked(moduleId: string, store?: NRProgressStore): boolean {
  const mod = getNRModule(moduleId)
  if (!mod) return false
  if (mod.unlockAfter.length === 0) return true
  const s = store ?? loadNRProgress()
  return mod.unlockAfter.every(prereqId => s[prereqId]?.completed === true)
}

export function isNRPlayUnlocked(moduleId: string, store?: NRProgressStore): boolean {
  const mod = getNRModule(moduleId)
  if (!mod) return false
  if (!mod.tools.includes('identify')) return true
  const s = store ?? loadNRProgress()
  return s[moduleId]?.identify?.mastered === true
}

// Locate unlocks on the same rule as Play: identify must be mastered first
// (or no identify requirement exists). Keeps the three-drill progression
// consistent — learners prove recognition before switching to active recall.
export function isNRLocateUnlocked(moduleId: string, store?: NRProgressStore): boolean {
  const mod = getNRModule(moduleId)
  if (!mod) return false
  if (!mod.tools.includes('identify')) return true
  const s = store ?? loadNRProgress()
  return s[moduleId]?.identify?.mastered === true
}

// Record an identify session. Returns the updated progress and whether mastery
// was achieved for the first time in this session.
export function recordNRIdentifySession(
  moduleId: string,
  accuracy: number,
  noteResults: Record<string, NoteResult> = {},
): { mp: NRModuleProgress; identifyJustMastered: boolean } {
  const mod = getNRModule(moduleId)
  if (!mod) return { mp: emptyModuleProgress(), identifyJustMastered: false }

  const store = loadNRProgress()
  const mp = store[moduleId] ?? emptyModuleProgress()

  const wasMastered = mp.identify.mastered

  const record: NRSessionRecord = { accuracy, timestamp: Date.now(), noteResults }
  mp.identify.sessions = [...mp.identify.sessions, record]

  const needed = mod.criteria.sessions
  const threshold = mod.criteria.identifyAccuracy ?? 0.9
  const recent = mp.identify.sessions.slice(-needed)
  mp.identify.mastered =
    recent.length >= needed && recent.every(s => s.accuracy >= threshold)

  const identifyJustMastered = !wasMastered && mp.identify.mastered

  mp.completed = checkModuleComplete(mod, mp)
  store[moduleId] = mp
  saveNRProgress(store)
  return { mp, identifyJustMastered }
}

// Record a locate session. Mirrors the identify-session shape since the
// drill is a visual-recall task with no response-time threshold.
export function recordNRLocateSession(
  moduleId: string,
  accuracy: number,
  noteResults: Record<string, NoteResult> = {},
): { mp: NRModuleProgress; locateJustMastered: boolean } {
  const mod = getNRModule(moduleId)
  if (!mod) return { mp: emptyModuleProgress(), locateJustMastered: false }

  const store = loadNRProgress()
  const mp = store[moduleId] ?? emptyModuleProgress()

  const wasMastered = mp.locate.mastered

  const record: NRSessionRecord = { accuracy, timestamp: Date.now(), noteResults }
  mp.locate.sessions = [...mp.locate.sessions, record]

  const needed = mod.criteria.sessions
  const threshold = mod.criteria.locateAccuracy ?? 0.9
  const recent = mp.locate.sessions.slice(-needed)
  mp.locate.mastered =
    recent.length >= needed && recent.every(s => s.accuracy >= threshold)

  const locateJustMastered = !wasMastered && mp.locate.mastered

  mp.completed = checkModuleComplete(mod, mp)
  store[moduleId] = mp
  saveNRProgress(store)
  return { mp, locateJustMastered }
}

// Record a play session.
export function recordNRPlaySession(
  moduleId: string,
  accuracy: number,
  avgResponseMs: number,
  noteResults: Record<string, NoteResult> = {},
): NRModuleProgress {
  const mod = getNRModule(moduleId)
  if (!mod) return emptyModuleProgress()

  const store = loadNRProgress()
  const mp = store[moduleId] ?? emptyModuleProgress()

  const record: NRSessionRecord = { accuracy, avgResponseMs, timestamp: Date.now(), noteResults }
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
  if (mod.tools.includes('locate') && !mp.locate.mastered) return false
  if (mod.tools.includes('play') && !mp.play.mastered) return false
  return true
}

export function nrConsecutivePassing(
  moduleId: string,
  tool: 'identify' | 'locate' | 'play',
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
      : tool === 'locate'
        ? (mod.criteria.locateAccuracy ?? 0.9)
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

// Compute per-note stats by aggregating noteResults across all stored sessions.
// tool: 'identify' | 'locate' | 'play' | 'both'
export function getNoteStats(
  moduleId: string,
  tool: 'identify' | 'locate' | 'play' | 'both' = 'both',
  store?: NRProgressStore,
): NoteStats[] {
  const s = store ?? loadNRProgress()
  const mp = s[moduleId]
  if (!mp) return []

  const agg: Record<string, { attempts: number; correct: number; responseMsTotal: number }> = {}

  function aggregate(sessions: NRSessionRecord[]) {
    for (const session of sessions) {
      if (!session.noteResults) continue
      for (const [noteId, res] of Object.entries(session.noteResults)) {
        if (!agg[noteId]) agg[noteId] = { attempts: 0, correct: 0, responseMsTotal: 0 }
        agg[noteId].attempts += res.attempts
        agg[noteId].correct += res.correct
        agg[noteId].responseMsTotal += res.responseMsTotal ?? 0
      }
    }
  }

  if (tool === 'identify' || tool === 'both') aggregate(mp.identify.sessions)
  if (tool === 'locate' || tool === 'both') aggregate(mp.locate.sessions)
  if (tool === 'play' || tool === 'both') aggregate(mp.play.sessions)

  return Object.entries(agg).map(([noteId, stats]) => {
    const accuracy = stats.attempts > 0 ? stats.correct / stats.attempts : 0
    const avgResponseMs = stats.attempts > 0 ? stats.responseMsTotal / stats.attempts : 0
    const masteryLevel: MasteryLevel =
      stats.attempts === 0 ? 'unseen' :
      accuracy < 0.70 ? 'weak' :
      accuracy < 0.90 ? 'developing' : 'strong'
    return { noteId, attempts: stats.attempts, correct: stats.correct, accuracy, avgResponseMs, masteryLevel }
  })
}
