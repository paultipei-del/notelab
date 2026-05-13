/** Persisted shape in localStorage (`notelab-clickcounter-state`).
 *  /tools dashboard hook reads `count` and `target` only — the new
 *  fields are additive and safe for older clients. */
export interface ClickCounterState {
  count: number
  target: number
  sets: number
  setTarget: number
  bestThisSession: number
}

export const DEFAULT_STATE: ClickCounterState = {
  count: 0,
  target: 10,
  sets: 0,
  setTarget: 3,
  bestThisSession: 0,
}

/** Loose typing: existing users have `{count, target}` only. Missing
 *  fields fall back to defaults. */
export function parseState(raw: string | null): ClickCounterState {
  if (!raw) return DEFAULT_STATE
  try {
    const p = JSON.parse(raw) as Partial<ClickCounterState>
    return {
      count: typeof p.count === 'number' ? p.count : DEFAULT_STATE.count,
      target:
        typeof p.target === 'number' && p.target > 0
          ? p.target
          : DEFAULT_STATE.target,
      sets: typeof p.sets === 'number' ? p.sets : DEFAULT_STATE.sets,
      setTarget:
        typeof p.setTarget === 'number' && p.setTarget > 0
          ? p.setTarget
          : DEFAULT_STATE.setTarget,
      bestThisSession:
        typeof p.bestThisSession === 'number'
          ? p.bestThisSession
          : DEFAULT_STATE.bestThisSession,
    }
  } catch {
    return DEFAULT_STATE
  }
}

/** Segmented-control presets for the TargetPopover. Five for each
 *  kind — 15 and 20 dropped from reps (rarely used; the stepper
 *  handles them). */
export const REP_PRESETS = [5, 10, 25, 50, 100] as const
export const SET_PRESETS = [1, 2, 3, 5, 10] as const

export const MIN_TARGET = 1
export const MAX_REP_TARGET = 999
export const MAX_SET_TARGET = 99
