'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/toolsCatalog'
import {
  DEFAULT_STATE,
  MAX_REP_TARGET,
  MAX_SET_TARGET,
  MIN_TARGET,
  parseState,
  type ClickCounterState,
} from '@/components/click-counter/clickCounterState'
import ClickCounterStage from '@/components/click-counter/ClickCounterStage'
import ConfigStrip from '@/components/click-counter/ConfigStrip'
import SessionCompleteScreen from '@/components/click-counter/SessionCompleteScreen'

// 600ms set-completion celebration; 400ms reset-streak dissolve.
const CELEBRATION_MS = 600
const DISSOLVE_MS = 400

interface WakeLockSentinel {
  release: () => Promise<void>
}
interface WakeLockApi {
  request: (type: 'screen') => Promise<WakeLockSentinel>
}

export default function ClickCounterPage() {
  const [count, setCount] = useState(DEFAULT_STATE.count)
  const [target, setRepTarget] = useState(DEFAULT_STATE.target)
  const [sets, setSets] = useState(DEFAULT_STATE.sets)
  const [setTarget, setSetTarget] = useState(DEFAULT_STATE.setTarget)
  const [bestThisSession, setBestThisSession] = useState(
    DEFAULT_STATE.bestThisSession,
  )
  // Runtime-only — not persisted. Becomes true on first Reset streak
  // press; resets to false on End session.
  const [hasResetThisSession, setHasResetThisSession] = useState(false)

  // Animation states.
  const [celebrating, setCelebrating] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [justFilledIndex, setJustFilledIndex] = useState<number | null>(null)
  const [sessionDone, setSessionDone] = useState(false)
  const [timerStart, setTimerStart] = useState<number | null>(null)

  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dissolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoadedRef = useRef(false)

  // ── Wake lock (silent quality-of-life) ──
  const acquireWakeLock = useCallback(async () => {
    try {
      const api = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock
      if (!api) return
      wakeLockRef.current = await api.request('screen')
    } catch {
      // ignore unsupported / denied
    }
  }, [])
  const releaseWakeLock = useCallback(() => {
    if (!wakeLockRef.current) return
    void wakeLockRef.current.release().catch(() => undefined)
    wakeLockRef.current = null
  }, [])

  const startTimer = useCallback(() => {
    setTimerStart(prev => {
      if (prev) return prev
      void acquireWakeLock()
      return Date.now()
    })
  }, [acquireWakeLock])

  // ── localStorage load on mount ──
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.clickCounterState)
      const s = parseState(raw)
      setCount(s.count)
      setRepTarget(s.target)
      setSets(s.sets)
      setSetTarget(s.setTarget)
      setBestThisSession(s.bestThisSession)
    } catch {
      // ignore parse / privacy errors
    } finally {
      hasLoadedRef.current = true
    }
  }, [])

  // ── localStorage write on change ──
  useEffect(() => {
    // Don't overwrite on the very first render (which has default
    // state) — wait until the load effect above has settled.
    if (!hasLoadedRef.current) return
    try {
      const snapshot: ClickCounterState = {
        count,
        target,
        sets,
        setTarget,
        bestThisSession,
      }
      window.localStorage.setItem(
        STORAGE_KEYS.clickCounterState,
        JSON.stringify(snapshot),
      )
    } catch {
      // ignore quota errors
    }
  }, [count, target, sets, setTarget, bestThisSession])

  // ── Cleanup timers + wake lock on unmount ──
  useEffect(
    () => () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current)
      if (dissolveTimerRef.current) clearTimeout(dissolveTimerRef.current)
      releaseWakeLock()
    },
    [releaseWakeLock],
  )

  // ── Re-acquire wake lock on tab refocus during an active session ──
  useEffect(() => {
    const onVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        timerStart &&
        !sessionDone
      ) {
        void acquireWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [acquireWakeLock, timerStart, sessionDone])

  // ── Computed: contextual encouragement during the celebration ──
  const celebrationText =
    sets + 1 >= setTarget
      ? 'Session complete!'
      : sets + 1 === setTarget - 1
        ? 'Final set — push through'
        : `Keep going — ${setTarget - sets - 1} more sets for the goal`

  // ── Increment ──
  const increment = useCallback(() => {
    if (sessionDone || celebrating || dissolving) return
    startTimer()
    setCount(prev => {
      const next = prev + 1
      setBestThisSession(b => (next > b ? next : b))
      if (next >= target) {
        // Trigger set-completion celebration.
        setJustFilledIndex(sets)
        setCelebrating(true)
        if (celebrationTimerRef.current) {
          clearTimeout(celebrationTimerRef.current)
        }
        celebrationTimerRef.current = setTimeout(() => {
          setCelebrating(false)
          setJustFilledIndex(null)
          setCount(0)
          setSets(s => {
            const nextSets = s + 1
            if (nextSets >= setTarget) {
              setSessionDone(true)
              releaseWakeLock()
            }
            return nextSets
          })
        }, CELEBRATION_MS)
      }
      return next
    })
  }, [
    sessionDone,
    celebrating,
    dissolving,
    target,
    sets,
    setTarget,
    startTimer,
    releaseWakeLock,
  ])

  // ── Undo (decrement by 1) ──
  const undo = useCallback(() => {
    if (sessionDone || celebrating || dissolving) return
    setCount(c => (c > 0 ? c - 1 : 0))
    // bestThisSession is a high-water mark — never decreases.
  }, [sessionDone, celebrating, dissolving])

  // ── Reset streak (dissolve animation → count=0) ──
  const resetStreak = useCallback(() => {
    if (sessionDone || dissolving) return
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current)
      celebrationTimerRef.current = null
    }
    setCelebrating(false)
    setJustFilledIndex(null)
    setDissolving(true)
    setHasResetThisSession(true)
    if (dissolveTimerRef.current) clearTimeout(dissolveTimerRef.current)
    dissolveTimerRef.current = setTimeout(() => {
      setDissolving(false)
      setCount(0)
    }, DISSOLVE_MS)
  }, [sessionDone, dissolving])

  // ── End session (open SessionCompleteScreen) ──
  const endSession = useCallback(() => {
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current)
    if (dissolveTimerRef.current) clearTimeout(dissolveTimerRef.current)
    setCelebrating(false)
    setDissolving(false)
    setJustFilledIndex(null)
    setSessionDone(true)
    releaseWakeLock()
  }, [releaseWakeLock])

  const dismissSessionComplete = useCallback(() => {
    setCount(0)
    setSets(0)
    setBestThisSession(0)
    setHasResetThisSession(false)
    setSessionDone(false)
    setTimerStart(null)
  }, [])

  const clampRepTarget = (v: number) =>
    Math.max(MIN_TARGET, Math.min(MAX_REP_TARGET, Math.round(v)))
  const clampSetTarget = (v: number) =>
    Math.max(MIN_TARGET, Math.min(MAX_SET_TARGET, Math.round(v)))

  const onTargetChange = useCallback((v: number) => {
    setRepTarget(clampRepTarget(v))
  }, [])
  const onSetTargetChange = useCallback((v: number) => {
    setSetTarget(prev => {
      const next = clampSetTarget(v)
      // If the user lowers setTarget below the current sets count,
      // the page would render fewer dots than sets-completed. Cap
      // sets at the new target to keep state consistent.
      setSets(s => Math.min(s, next))
      return next
    })
  }, [])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null
      const tag = tgt?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        increment()
      } else if (
        e.key === 'Backspace' ||
        e.key === 'ArrowLeft' ||
        e.key === 'z' ||
        e.key === 'Z'
      ) {
        e.preventDefault()
        undo()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        resetStreak()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [increment, undo, resetStreak])

  const elapsedMs = timerStart ? Date.now() - timerStart : 0

  return (
    <div className="nl-cc-page">
      <ClickCounterStage
        count={count}
        target={target}
        sets={sets}
        setTarget={setTarget}
        bestThisSession={bestThisSession}
        hasResetThisSession={hasResetThisSession}
        celebrating={celebrating}
        dissolving={dissolving}
        celebrationText={celebrationText}
        justFilledIndex={justFilledIndex}
        onIncrement={increment}
        onUndo={undo}
        onResetStreak={resetStreak}
        onTargetChange={onTargetChange}
      />
      <ConfigStrip
        target={target}
        setTarget={setTarget}
        onTargetChange={onTargetChange}
        onSetTargetChange={onSetTargetChange}
        onEndSession={endSession}
      />
      {sessionDone && (
        <SessionCompleteScreen
          sets={sets}
          target={target}
          elapsedMs={elapsedMs}
          onDismiss={dismissSessionComplete}
        />
      )}
    </div>
  )
}
