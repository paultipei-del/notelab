'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m} min ${rem < 10 ? '0' : ''}${rem} sec`
}

function vibrate(ms: number) {
  if (typeof navigator === 'undefined') return
  if (typeof navigator.vibrate === 'function') navigator.vibrate(ms)
}

export default function ClickCounterPage() {
  const [count, setCount] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [sets, setSets] = useState<number[]>([])
  const [history, setHistory] = useState<number[]>([])
  const [repsTarget, setRepsTarget] = useState<number | ''>('')
  const [setsTarget, setSetsTarget] = useState<number | ''>('')
  const [sessionDone, setSessionDone] = useState(false)
  const [pendingLog, setPendingLog] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [countFlash, setCountFlash] = useState(0)
  const [tapPulse, setTapPulse] = useState(0)
  const [touchTapActive, setTouchTapActive] = useState(false)
  const [touchMinusActive, setTouchMinusActive] = useState(false)
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const [completeLabel, setCompleteLabel] = useState<'set' | 'session' | null>(null)

  const wakeLockRef = useRef<any>(null)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completeLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const repsGoal = typeof repsTarget === 'number' && repsTarget > 0 ? repsTarget : 0
  const setsGoal = typeof setsTarget === 'number' && setsTarget > 0 ? setsTarget : 0

  const acquireWakeLock = useCallback(async () => {
    try {
      const wakeLockApi = (navigator as any).wakeLock
      if (!wakeLockApi) return
      wakeLockRef.current = await wakeLockApi.request('screen')
    } catch {
      // Ignore unsupported / denied wake lock.
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (!wakeLockRef.current) return
    void wakeLockRef.current.release().catch(() => undefined)
    wakeLockRef.current = null
  }, [])

  const startTimer = useCallback(() => {
    setTimerStart((prev) => {
      if (prev) return prev
      void acquireWakeLock()
      return Date.now()
    })
  }, [acquireWakeLock])

  const newSession = useCallback(() => {
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
    pendingTimeoutRef.current = null
    if (completeLabelTimeoutRef.current) clearTimeout(completeLabelTimeoutRef.current)
    completeLabelTimeoutRef.current = null
    setCount(0)
    setSessionTotal(0)
    setSets([])
    setHistory([])
    setSessionDone(false)
    setPendingLog(false)
    setShowOverlay(false)
    setCompleteLabel(null)
    setTimerStart(null)
    releaseWakeLock()
  }, [releaseWakeLock])

  const flashCompleteLabel = useCallback((kind: 'set' | 'session') => {
    setCompleteLabel(kind)
    if (completeLabelTimeoutRef.current) clearTimeout(completeLabelTimeoutRef.current)
    completeLabelTimeoutRef.current = setTimeout(() => setCompleteLabel(null), 1500)
  }, [])

  const flash = useCallback(() => {
    setCountFlash((n) => n + 1)
  }, [])

  const showCompletion = useCallback(() => {
    setShowOverlay(true)
    setSessionDone(true)
    releaseWakeLock()
  }, [releaseWakeLock])

  const logSet = useCallback(() => {
    setCount((currentCount) => {
      if (currentCount === 0 || sessionDone) return currentCount
      setSets((prevSets) => {
        const next = [...prevSets, currentCount]
        if (setsGoal > 0 && next.length >= setsGoal) {
          flashCompleteLabel('session')
          vibrate(50)
          setTimeout(showCompletion, 1500)
        }
        return next
      })
      setHistory([])
      return 0
    })
  }, [flashCompleteLabel, sessionDone, setsGoal, showCompletion])

  const increment = useCallback(() => {
    if (sessionDone || pendingLog) return
    startTimer()
    setCount((prev) => {
      setHistory((h) => [...h, prev])
      const next = prev + 1
      if (repsGoal > 0 && next >= repsGoal) {
        setPendingLog(true)
        setTapPulse((n) => n + 1)
        flashCompleteLabel('set')
        vibrate(50)
        if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = setTimeout(() => {
          setPendingLog(false)
          logSet()
        }, 500)
      }
      return next
    })
    setSessionTotal((t) => t + 1)
    flash()
  }, [flash, flashCompleteLabel, logSet, pendingLog, repsGoal, sessionDone, startTimer])

  const decrement = useCallback(() => {
    if (sessionDone) return
    setCount((prev) => {
      if (prev <= 0) return prev
      setHistory((h) => [...h, prev])
      setSessionTotal((t) => Math.max(0, t - 1))
      return prev - 1
    })
  }, [sessionDone])

  const resetCount = useCallback(() => {
    if (sessionDone) return
    setHistory((h) => [...h, count])
    setCount(0)
  }, [count, sessionDone])

  const undo = useCallback(() => {
    if (sessionDone) return
    setHistory((h) => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      const diff = count - prev
      setSessionTotal((t) => Math.max(0, t - diff))
      setCount(prev)
      return h.slice(0, -1)
    })
  }, [count, sessionDone])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timerStart && !sessionDone) {
        void acquireWakeLock()
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT') return
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        increment()
      } else if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Z') {
        undo()
      } else if (e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D') {
        decrement()
      } else if (e.key === 'r' || e.key === 'R') {
        resetCount()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [acquireWakeLock, decrement, increment, resetCount, sessionDone, timerStart, undo])

  useEffect(() => {
    return () => {
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
      if (completeLabelTimeoutRef.current) clearTimeout(completeLabelTimeoutRef.current)
      releaseWakeLock()
    }
  }, [releaseWakeLock])

  const overlaySub = useMemo(() => {
    if (repsGoal && setsGoal) return `${sets.length} sets × ${repsGoal} reps`
    return `${sets.length} sets completed`
  }, [repsGoal, sets.length, setsGoal])

  const segBar = useMemo(() => {
    if (!repsGoal && !setsGoal) return []
    const n = setsGoal > 0 ? setsGoal : Math.max(sets.length + 1, 1)
    return Array.from({ length: n }, (_, i) => {
      if (i < sets.length) return 100
      if (i === sets.length && repsGoal) return Math.min(100, Math.round((count / repsGoal) * 100))
      return 0
    })
  }, [count, repsGoal, sets.length, setsGoal])

  // Ring geometry
  const RING_SIZE = 244
  const TAP_SIZE = 220
  const RING_R = (RING_SIZE - 8) / 2
  const RING_C = 2 * Math.PI * RING_R
  const ringProgress = repsGoal > 0 ? Math.min(1, count / repsGoal) : 0

  return (
    <div style={{ background: '#F2EDDF', minHeight: 'calc(var(--nl-viewport-h) - var(--nl-site-header-h))', paddingBottom: '1rem' }}>
      {showOverlay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(242,237,223,0.97)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', gap: '1.2rem' }}>
          <p style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '2.4rem', letterSpacing: '0.04em', color: '#2A2318', lineHeight: 1.1 }}>Session complete.</p>
          <p style={{ fontFamily: SERIF, fontSize: '1rem', color: '#7A7060' }}>{overlaySub}</p>
          <p style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A7060', marginTop: '-0.4rem' }}>
            {timerStart ? formatTime(Date.now() - timerStart) : ''}
          </p>
          <div style={{ display: 'flex', gap: '2.5rem', margin: '0.5rem 0' }}>
            <div style={{ textAlign: 'center' }}><span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: '#2A2318', display: 'block' }}>{sets.length}</span><span style={{ fontFamily: F, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7060' }}>Sets</span></div>
            <div style={{ textAlign: 'center' }}><span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: '#2A2318', display: 'block' }}>{sessionTotal}</span><span style={{ fontFamily: F, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7060' }}>Total reps</span></div>
          </div>
          <button type="button" onClick={newSession} style={{ fontFamily: F, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#2A2318', background: 'transparent', border: '1px solid rgba(42,35,24,0.4)', padding: '0.7rem 1.8rem', borderRadius: 2, cursor: 'pointer' }}>
            New session
          </button>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', textAlign: 'center', padding: '1.2rem 0 1rem' }}>
          <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '1.9rem', letterSpacing: '0.04em', color: '#2A2318', lineHeight: 1.1 }}>Click Counter</div>
          <div style={{ fontFamily: SERIF, fontSize: '0.95rem', color: '#7A7060', marginTop: '0.4rem' }}>Track repetitions during practice. Stack sets for higher retention.</div>
        </div>

        <div style={{ height: 1, width: 'calc(100% - 4rem)', background: 'rgba(42,35,24,0.15)' }} />

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.6rem 2rem 1.2rem' }}>
          <div style={{ fontFamily: F, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A7060', marginBottom: '0.5rem' }}>Count</div>
          <div key={countFlash} style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '7rem', lineHeight: 1, color: '#2A2318', letterSpacing: '-0.02em', userSelect: 'none', textAlign: 'center', animation: 'pvt-count-flash 0.12s ease' }}>
            {count}
          </div>

          <div style={{ display: 'flex', marginTop: '0.75rem', width: '100%', justifyContent: 'center', alignItems: 'stretch', gap: 0 }}>
            <StatColumn
              value={count}
              target={repsGoal}
              label="Reps"
              targetLabel="Rep target"
              targetInput={repsTarget}
              onTargetChange={(v) => setRepsTarget(v === '' ? '' : Math.max(0, Number(v) || 0))}
            />
            <div style={{ width: 1, background: 'rgba(42,35,24,0.18)', alignSelf: 'stretch', margin: '4px 6px' }} />
            <StatColumn
              value={sets.length}
              target={setsGoal}
              label="Sets"
              targetLabel="Set target"
              targetInput={setsTarget}
              onTargetChange={(v) => setSetsTarget(v === '' ? '' : Math.max(0, Number(v) || 0))}
            />
          </div>

          <div style={{ width: 'calc(100% - 4rem)', display: 'flex', gap: 3, marginTop: '1rem' }}>
            {segBar.map((pct, i) => (
              <div key={i} style={{ flex: 1, height: 3, background: 'rgba(42,35,24,0.1)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: '#2A2318', width: `${pct}%`, transition: 'width 0.12s ease', borderRadius: 2 }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 2rem 0.5rem', gap: '1rem' }}>
          <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
            {repsGoal > 0 && (
              <svg
                width={RING_SIZE}
                height={RING_SIZE}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                aria-hidden="true"
              >
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} fill="none" stroke="rgba(42,35,24,0.12)" strokeWidth={3} />
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_R}
                  fill="none"
                  stroke="#2A2318"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - ringProgress)}
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  style={{ transition: 'stroke-dashoffset 0.12s ease' }}
                />
              </svg>
            )}
            <button
              type="button"
              disabled={sessionDone}
              onTouchStart={(e) => { e.preventDefault(); setTouchTapActive(true); increment() }}
              onTouchEnd={() => setTouchTapActive(false)}
              onClick={increment}
              style={{
                position: 'absolute',
                top: (RING_SIZE - TAP_SIZE) / 2,
                left: (RING_SIZE - TAP_SIZE) / 2,
                width: TAP_SIZE,
                height: TAP_SIZE,
                borderRadius: TAP_SIZE / 2,
                backgroundColor: touchTapActive ? '#3A352D' : '#2A2318',
                cursor: sessionDone ? 'default' : 'pointer',
                display: 'block',
                border: 'none',
                userSelect: 'none',
                opacity: sessionDone ? 0.35 : 1,
                pointerEvents: sessionDone ? 'none' : undefined,
                animation: pendingLog ? 'pvt-pulse 0.5s ease-out' : undefined,
              }}
              key={tapPulse}
            >
              <div style={{ width: 52, height: 5, background: '#F2EDDF', borderRadius: 2, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
              <div style={{ width: 5, height: 52, background: '#F2EDDF', borderRadius: 2, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
            </button>

            <button
              type="button"
              disabled={sessionDone}
              onTouchStart={(e) => { e.preventDefault(); setTouchMinusActive(true); decrement() }}
              onTouchEnd={() => setTouchMinusActive(false)}
              onClick={decrement}
              aria-label="Decrement count"
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 44,
                height: 44,
                borderRadius: 22,
                border: '1px solid rgba(42,35,24,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                lineHeight: 1,
                cursor: sessionDone ? 'default' : 'pointer',
                background: touchMinusActive ? '#2A2318' : '#F2EDDF',
                color: touchMinusActive ? '#F2EDDF' : '#2A2318',
                userSelect: 'none',
                opacity: sessionDone ? 0.35 : 1,
                pointerEvents: sessionDone ? 'none' : undefined,
                boxShadow: '0 1px 3px rgba(42,35,24,0.18)',
                fontFamily: F,
              }}
            >
              −
            </button>
          </div>

          <div style={{ position: 'relative', height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {completeLabel ? (
              <div
                key={completeLabel + tapPulse}
                style={{
                  fontFamily: F,
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#2A2318',
                  animation: 'pvt-complete-fade 1.5s ease forwards',
                }}
              >
                {completeLabel === 'set' ? 'Set complete' : 'Session complete'}
              </div>
            ) : (
              <div style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A7060' }}>
                Tap or press Space
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
            <button type="button" onClick={resetCount} style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(42,35,24,0.3)', padding: '0.7rem 1.8rem', borderRadius: 2, cursor: 'pointer', whiteSpace: 'nowrap' }}>Reset</button>
            <button type="button" onClick={newSession} style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(42,35,24,0.3)', padding: '0.7rem 1.8rem', borderRadius: 2, cursor: 'pointer', whiteSpace: 'nowrap' }}>New session</button>
          </div>
          <div style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A7060', textAlign: 'center' }}>← Undo · R Reset</div>
        </div>

        {sets.length > 0 && (
          <div style={{ width: '100%', padding: '0.5rem 2rem 0.3rem' }}>
            <div style={{ fontFamily: F, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A7060', marginBottom: '0.4rem' }}>Sets</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {sets.map((s, i) => (
                <span key={`${s}-${i}`} style={{ fontFamily: SERIF, fontSize: '0.9rem', color: '#7A7060', background: 'rgba(42,35,24,0.06)', borderRadius: 2, padding: '2px 8px' }} title={`Set ${i + 1}`}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pvt-pulse {
          0% { box-shadow: 0 0 0 0 rgba(42,35,24,0.25); }
          50% { box-shadow: 0 0 0 18px rgba(42,35,24,0); }
          100% { box-shadow: 0 0 0 0 rgba(42,35,24,0); }
        }
        @keyframes pvt-count-flash {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        @keyframes pvt-complete-fade {
          0% { opacity: 0; transform: translateY(2px); }
          15% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-2px); }
        }
        .pvt-target-input::-webkit-outer-spin-button,
        .pvt-target-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .pvt-target-input { -moz-appearance: textfield; }
      `}</style>
    </div>
  )
}

function StatColumn({
  value,
  target,
  label,
  targetLabel,
  targetInput,
  onTargetChange,
}: {
  value: number
  target: number
  label: string
  targetLabel: string
  targetInput: number | ''
  onTargetChange: (v: string) => void
}) {
  const hasTarget = target > 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', width: 160 }}>
      <span style={{ fontFamily: SERIF, fontSize: '1.6rem', color: '#2A2318', lineHeight: 1, display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
        {value}
        {hasTarget && (
          <span style={{ fontSize: '1.1rem', color: '#A39A8D' }}> / {target}</span>
        )}
      </span>
      <span style={{ fontFamily: F, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A7060', marginTop: 4 }}>{label}</span>
      <span style={{ display: 'block', height: '0.9rem' }} />
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px 5px 12px',
          border: '1px solid rgba(42,35,24,0.22)',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.5)',
          cursor: 'text',
        }}
      >
        <span style={{ fontFamily: F, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7060' }}>{targetLabel}</span>
        <input
          className="pvt-target-input"
          value={targetInput}
          onChange={(e) => onTargetChange(e.target.value)}
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="—"
          style={{
            width: 36,
            fontFamily: F,
            fontSize: 13,
            color: '#2A2318',
            background: 'transparent',
            border: 'none',
            textAlign: 'center',
            outline: 'none',
            padding: 0,
          }}
        />
      </label>
    </div>
  )
}
