/** Client-only helpers for account “Progress” (localStorage-backed stats). */

export function readLocalStorageNumericByPrefix(prefix: string): { id: string; value: number }[] {
  if (typeof window === 'undefined') return []
  const out: { id: string; value: number }[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k?.startsWith(prefix)) continue
    const v = parseFloat(localStorage.getItem(k) ?? '0')
    if (!Number.isFinite(v) || v <= 0) continue
    out.push({ id: k.slice(prefix.length), value: v })
  }
  return out.sort((a, b) => a.id.localeCompare(b.id))
}

export function removeLocalStorageKeysByPrefix(prefix: string): void {
  if (typeof window === 'undefined') return
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(prefix)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

export type KeyDrillSnapshot = { correct: number; total: number; streak: number }

export function readKeyDrillSnapshot(): KeyDrillSnapshot {
  try {
    const s = localStorage.getItem('keydrill-score')
    const score = s ? JSON.parse(s) : { correct: 0, total: 0 }
    const streak = parseInt(localStorage.getItem('keydrill-order-streak') || '0', 10) || 0
    return {
      correct: typeof score.correct === 'number' ? score.correct : 0,
      total: typeof score.total === 'number' ? score.total : 0,
      streak,
    }
  } catch {
    return { correct: 0, total: 0, streak: 0 }
  }
}

export function resetKeyDrillStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('keydrill-score')
  localStorage.removeItem('keydrill-order-streak')
}

export const LS_PREFIX_PLAY_BEST = 'notelab-best-time-'
export const LS_PREFIX_NOTE_ID_BEST = 'notelab-note-id-best-'
