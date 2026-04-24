'use client'

import { getNRModule, NOTE_READING_MODULES } from './modules'
import { canRenderOnClef } from './staffPositions'
import type { NoteResult, NoteStats, MasteryLevel } from './types'

const STORAGE_KEY = 'notelab-nr-progress-v1'
const RETENTION_KEY = 'notelab-nr-retention-v1'
const RETENTION_CAP = 500     // keep the most recent N retention answers

// A single "review" answer logged during a later module's session. Used to
// compute the dashboard retention score and to bias future review picks
// toward historically weak notes.
export interface RetentionRecord {
  sourceModuleId: string
  pitch: string
  correct: boolean
  timestamp: number
}

export interface RetentionSummary {
  totalAnswered: number
  totalCorrect: number
  accuracy: number           // 0–1 across all retention answers
  recent30Accuracy: number   // rolling window over last 30 answers
  byModule: Record<string, { answered: number; correct: number }>
  lastAnsweredAt: number | null
}

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

// ── Cumulative review & retention ──────────────────────────────────────────
// Review questions are injected into later modules' drill sessions, pulled
// from the weakest notes across already-completed modules. They're logged
// to a separate retention store so they don't affect the current module's
// mastery calculation, but do surface a dashboard-level "forgetting curve"
// signal.

export function loadRetention(): RetentionRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RETENTION_KEY)
    return raw ? (JSON.parse(raw) as RetentionRecord[]) : []
  } catch {
    return []
  }
}

export function recordRetention(entry: Omit<RetentionRecord, 'timestamp'>): void {
  if (typeof window === 'undefined') return
  const list = loadRetention()
  list.push({ ...entry, timestamp: Date.now() })
  const capped = list.length > RETENTION_CAP ? list.slice(-RETENTION_CAP) : list
  try {
    localStorage.setItem(RETENTION_KEY, JSON.stringify(capped))
  } catch {
    /* quota / privacy mode — ignore */
  }
}

export function computeRetentionSummary(): RetentionSummary {
  const list = loadRetention()
  const byModule: Record<string, { answered: number; correct: number }> = {}
  let totalCorrect = 0
  for (const r of list) {
    if (!byModule[r.sourceModuleId]) byModule[r.sourceModuleId] = { answered: 0, correct: 0 }
    byModule[r.sourceModuleId].answered++
    if (r.correct) {
      byModule[r.sourceModuleId].correct++
      totalCorrect++
    }
  }
  const totalAnswered = list.length
  const recent = list.slice(-30)
  const recentCorrect = recent.filter(r => r.correct).length
  return {
    totalAnswered,
    totalCorrect,
    accuracy: totalAnswered > 0 ? totalCorrect / totalAnswered : 0,
    recent30Accuracy: recent.length > 0 ? recentCorrect / recent.length : 0,
    byModule,
    lastAnsweredAt: list.length > 0 ? list[list.length - 1].timestamp : null,
  }
}

// Build a review pool of weak-note candidates drawn from completed modules
// OTHER than the current one. Returns up to `count` pitches paired with
// their source module ID. Candidates are filtered to pitches that can be
// rendered sensibly on the current module's clef, skip any pitch already
// in the current module's own note pool, and are weighted toward lower
// historical accuracy.
export function buildReviewPool(
  currentModuleId: string,
  count: number,
): Array<{ pitch: string; sourceModuleId: string }> {
  const mod = getNRModule(currentModuleId)
  if (!mod) return []
  const store = loadNRProgress()
  const completedModules = NOTE_READING_MODULES.filter(
    m => m.id !== currentModuleId && store[m.id]?.completed === true,
  )
  if (completedModules.length === 0) return []

  type Candidate = { pitch: string; sourceModuleId: string; weakness: number }
  const candidates: Candidate[] = []
  const currentPoolSet = new Set(mod.notes)

  for (const sourceMod of completedModules) {
    const stats = getNoteStats(sourceMod.id, 'both', store)
    for (const s of stats) {
      if (s.attempts < 2) continue
      if (s.accuracy >= 0.95) continue
      if (currentPoolSet.has(s.noteId)) continue
      if (!canRenderOnClef(s.noteId, mod.clef)) continue
      candidates.push({
        pitch: s.noteId,
        sourceModuleId: sourceMod.id,
        weakness: 1 - s.accuracy,
      })
    }
  }

  // Fallback: if the user hasn't missed anything from completed modules
  // yet, still surface a small sample of earlier-module pitches so review
  // happens even for a perfect learner.
  if (candidates.length === 0) {
    for (const sourceMod of completedModules) {
      for (const pitch of [...new Set(sourceMod.notes)]) {
        if (currentPoolSet.has(pitch)) continue
        if (!canRenderOnClef(pitch, mod.clef)) continue
        candidates.push({ pitch, sourceModuleId: sourceMod.id, weakness: 0.05 })
      }
    }
  }

  if (candidates.length === 0) return []

  candidates.sort((a, b) => b.weakness - a.weakness)
  const topSlice = candidates.slice(0, Math.max(count * 3, 6))
  for (let i = topSlice.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[topSlice[i], topSlice[j]] = [topSlice[j], topSlice[i]]
  }
  return topSlice.slice(0, count).map(c => ({
    pitch: c.pitch,
    sourceModuleId: c.sourceModuleId,
  }))
}

// Given a raw weighted queue of module pitches, replace 2–3 non-consecutive
// interior positions with review entries. Returns the tagged queue. Edge
// positions (first two / last two) are avoided so the session opens and
// closes with the current module's own material.
export interface QueueEntry {
  pitch: string
  review: { sourceModuleId: string } | null
}

export function injectReviewQuestions(
  baseQueue: string[],
  reviewPool: Array<{ pitch: string; sourceModuleId: string }>,
): QueueEntry[] {
  const tagged: QueueEntry[] = baseQueue.map(pitch => ({ pitch, review: null }))
  if (reviewPool.length === 0 || baseQueue.length < 8) return tagged

  const minIdx = 2
  const maxIdx = baseQueue.length - 3
  const spots: number[] = []
  for (let i = minIdx; i <= maxIdx; i++) spots.push(i)
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[spots[i], spots[j]] = [spots[j], spots[i]]
  }
  const placements: number[] = []
  for (const spot of spots) {
    if (placements.length >= reviewPool.length) break
    if (placements.every(p => Math.abs(p - spot) > 1)) placements.push(spot)
  }

  for (let i = 0; i < placements.length && i < reviewPool.length; i++) {
    const r = reviewPool[i]
    tagged[placements[i]] = { pitch: r.pitch, review: { sourceModuleId: r.sourceModuleId } }
  }
  return tagged
}
