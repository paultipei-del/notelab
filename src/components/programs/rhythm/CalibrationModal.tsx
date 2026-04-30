'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  CALIBRATION_LIMITS,
  getDeviceKey,
  getStoredOffsetMs,
  hasCalibration,
  rootMeanSquare,
  setCalibration,
  trimmedMedian,
} from '@/lib/programs/rhythm/calibration'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

type Phase =
  | 'idle'
  | 'measuring'
  | 'computing'
  | 'verifying'
  | 'done_ok'
  | 'done_warn'
  | 'failed'

interface Props {
  open: boolean
  onClose: () => void
  /** Called after calibration is saved. The trainer reloads its offset from storage on next start(). */
  onCalibrated?: (offsetMs: number, rmseMs: number) => void
}

const TEMPO_BPM = 100        // 600 ms per beat — fast enough for NMA to surface, slow enough for novices
const WARMUP_BEATS = 4
const MEASURE_BEATS = 8
const VERIFY_BEATS = 8
const TRIM_PER_SIDE = 2
const COUNTDOWN_LEAD_S = 0.5

/**
 * Calibration modal for the rhythm trainer. Plays a metronome, asks the user
 * to tap with each click, and stores the median tap-vs-click offset keyed by
 * the audio output device fingerprint. After the measurement round it runs a
 * verification round with the offset applied and reports residual error so
 * the user can decide whether the calibration is trustworthy.
 *
 * Self-contained — does not touch trainer state. Trainer reads the stored
 * offset on its own start().
 */
export default function CalibrationModal({ open, onClose, onCalibrated }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [taps, setTaps] = useState<number[]>([])
  const [clickTimes, setClickTimes] = useState<number[]>([])
  const [savedOffsetMs, setSavedOffsetMs] = useState<number | null>(null)
  const [savedRmseMs, setSavedRmseMs] = useState<number | null>(null)
  const [verifyTaps, setVerifyTaps] = useState<number[]>([])
  const [verifyClicks, setVerifyClicks] = useState<number[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeBeat, setActiveBeat] = useState(0)
  const [hasPrior, setHasPrior] = useState(false)

  const ctxRef = useRef<AudioContext | null>(null)
  const phaseRef = useRef<Phase>('idle')
  const tapsRef = useRef<number[]>([])
  const clicksRef = useRef<number[]>([])
  const verifyTapsRef = useRef<number[]>([])
  const verifyClicksRef = useRef<number[]>([])
  const offsetSecRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  /** Reads ctx.outputLatency in seconds — what sits between scheduling and being heard. */
  const getOutputLatencySec = useCallback((ctx: AudioContext) => {
    const ex = ctx as AudioContext & { outputLatency?: number }
    return typeof ex.outputLatency === 'number' && Number.isFinite(ex.outputLatency) && ex.outputLatency > 0
      ? ex.outputLatency : 0
  }, [])

  // Keep a phaseRef in sync so async callbacks always see the latest state.
  useEffect(() => { phaseRef.current = phase }, [phase])

  const getCtx = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state !== 'closed') return ctxRef.current
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    ctxRef.current = ctx
    return ctx
  }, [])

  // Read existing calibration when the modal opens so we can show "Recalibrate" copy.
  useEffect(() => {
    if (!open) return
    try {
      const ctx = getCtx()
      setHasPrior(hasCalibration(getDeviceKey(ctx)))
    } catch {
      setHasPrior(false)
    }
  }, [open, getCtx])

  const reset = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setPhase('idle')
    setTaps([])
    setClickTimes([])
    setVerifyTaps([])
    setVerifyClicks([])
    setSavedOffsetMs(null)
    setSavedRmseMs(null)
    setErrorMessage(null)
    setActiveBeat(0)
    tapsRef.current = []
    clicksRef.current = []
    verifyTapsRef.current = []
    verifyClicksRef.current = []
  }, [])

  // Schedule N clicks at TEMPO_BPM starting at startCtxTime. Records each click
  // arrival time (in ms via performance.now() approximation) into the given
  // ref so taps can be diffed against them.
  const scheduleClicks = useCallback((
    ctx: AudioContext,
    startCtxTime: number,
    count: number,
    accentEvery: number,
    onClickAtBeat: (beat: number, ctxTime: number) => void,
  ) => {
    const beatDurSec = 60 / TEMPO_BPM
    for (let i = 0; i < count; i++) {
      const t = startCtxTime + i * beatDurSec
      const accent = i % accentEvery === 0
      // Click sound: short oscillator burst — same character as the trainer's playClick.
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = accent ? 1600 : 1000
      osc.type = 'square'
      gain.gain.setValueAtTime(accent ? 0.5 : 0.25, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
      osc.start(t); osc.stop(t + 0.06)
      onClickAtBeat(i, t)
    }
  }, [])

  const start = useCallback(async () => {
    setErrorMessage(null)
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()

    tapsRef.current = []
    clicksRef.current = []
    verifyTapsRef.current = []
    verifyClicksRef.current = []
    setTaps([])
    setClickTimes([])
    setVerifyTaps([])
    setVerifyClicks([])
    setActiveBeat(0)

    const beatDurSec = 60 / TEMPO_BPM
    const startTime = ctx.currentTime + COUNTDOWN_LEAD_S
    const totalBeats = WARMUP_BEATS + MEASURE_BEATS

    // Schedule all clicks (warmup + measured) up front. Audio scheduling is
    // sample-accurate; we only care about wall-clock ordering for the
    // collected taps.
    scheduleClicks(ctx, startTime, totalBeats, 4, (beatIdx, ctxTime) => {
      // Convert ctx.currentTime to a performance.now()-equivalent ms baseline:
      // delta from now to scheduled click in ms, added to the wall-clock now.
      const wallNow = performance.now()
      const ctxNow = ctx.currentTime
      const deltaMs = (ctxTime - ctxNow) * 1000
      const wallClickMs = wallNow + deltaMs
      if (beatIdx >= WARMUP_BEATS) {
        clicksRef.current.push(wallClickMs)
      }
    })

    setPhase('measuring')

    // Drive the UI beat indicator via rAF so it stays smooth, and subtract
    // outputLatency so the dot flips at the moment the user *hears* the click,
    // not at the moment audio was scheduled.
    const outputLatencySec = getOutputLatencySec(ctx)
    const tick = () => {
      const heardElapsedSec = ctx.currentTime - startTime - outputLatencySec
      const beat = Math.max(0, Math.floor(heardElapsedSec / beatDurSec))
      setActiveBeat(beat)
      if (beat >= totalBeats) {
        rafRef.current = null
        // Grace window so a tap on the final beat can still register.
        setTimeout(() => compute(), 250)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [getCtx, scheduleClicks, getOutputLatencySec])

  const compute = useCallback(() => {
    setPhase('computing')
    const collectedTaps = tapsRef.current
    const collectedClicks = clicksRef.current

    if (collectedTaps.length < MEASURE_BEATS - 2) {
      setErrorMessage(`Only ${collectedTaps.length} taps registered (expected ${MEASURE_BEATS}). Try again.`)
      setPhase('failed')
      return
    }

    // Match each click to its closest tap by wall-clock time. Each tap can be
    // used once. Discard taps that are too far from any click.
    const used = new Set<number>()
    const offsetsMs: number[] = []
    for (const click of collectedClicks) {
      let bestIdx = -1
      let bestDist = 600  // half a beat at 100 BPM — anything farther is noise
      for (let i = 0; i < collectedTaps.length; i++) {
        if (used.has(i)) continue
        const dist = Math.abs(collectedTaps[i] - click)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = i
        }
      }
      if (bestIdx >= 0) {
        used.add(bestIdx)
        offsetsMs.push(collectedTaps[bestIdx] - click)
      }
    }

    if (offsetsMs.length < MEASURE_BEATS - 2) {
      setErrorMessage(`Only ${offsetsMs.length} taps could be matched to clicks. Try again with steadier taps.`)
      setPhase('failed')
      return
    }

    const offsetMs = trimmedMedian(offsetsMs, TRIM_PER_SIDE)

    if (Math.abs(offsetMs) > CALIBRATION_LIMITS.maxAbsOffsetMs) {
      setErrorMessage(
        `Measured offset (${Math.round(offsetMs)} ms) is outside the plausible range. ` +
        `Make sure you tap with each click — let's try once more.`,
      )
      setPhase('failed')
      return
    }

    setSavedOffsetMs(offsetMs)
    offsetSecRef.current = offsetMs / 1000
    // Move into verification round automatically.
    setTimeout(() => verify(), 400)
  }, [])

  const verify = useCallback(async () => {
    setPhase('verifying')
    setActiveBeat(0)
    verifyTapsRef.current = []
    verifyClicksRef.current = []

    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    const startTime = ctx.currentTime + COUNTDOWN_LEAD_S
    scheduleClicks(ctx, startTime, WARMUP_BEATS + VERIFY_BEATS, 4, (beatIdx, ctxTime) => {
      const wallNow = performance.now()
      const deltaMs = (ctxTime - ctx.currentTime) * 1000
      const wallClickMs = wallNow + deltaMs
      if (beatIdx >= WARMUP_BEATS) {
        verifyClicksRef.current.push(wallClickMs)
      }
    })

    const beatDurSec = 60 / TEMPO_BPM
    const totalBeats = WARMUP_BEATS + VERIFY_BEATS
    const outputLatencySec = getOutputLatencySec(ctx)
    const tick = () => {
      const heardElapsedSec = ctx.currentTime - startTime - outputLatencySec
      const beat = Math.max(0, Math.floor(heardElapsedSec / beatDurSec))
      setActiveBeat(beat)
      if (beat >= totalBeats) {
        rafRef.current = null
        setTimeout(() => finalize(), 250)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [getCtx, scheduleClicks, getOutputLatencySec])

  const finalize = useCallback(() => {
    const offsetMs = savedOffsetMs ?? 0
    const collectedTaps = verifyTapsRef.current
    const collectedClicks = verifyClicksRef.current

    if (collectedTaps.length < VERIFY_BEATS - 2 || collectedClicks.length < 4) {
      setErrorMessage('Not enough taps in the verification round. Try the whole calibration again.')
      setPhase('failed')
      return
    }

    // Apply the offset to each tap and measure residual error against clicks.
    const correctedTaps = collectedTaps.map(t => t - offsetMs)
    const used = new Set<number>()
    const residuals: number[] = []
    for (const click of collectedClicks) {
      let bestIdx = -1
      let bestDist = 600
      for (let i = 0; i < correctedTaps.length; i++) {
        if (used.has(i)) continue
        const dist = Math.abs(correctedTaps[i] - click)
        if (dist < bestDist) { bestDist = dist; bestIdx = i }
      }
      if (bestIdx >= 0) {
        used.add(bestIdx)
        residuals.push(correctedTaps[bestIdx] - click)
      }
    }

    const rmseMs = rootMeanSquare(residuals)

    try {
      const ctx = getCtx()
      const deviceKey = getDeviceKey(ctx)
      setCalibration(deviceKey, offsetMs, rmseMs)
      setSavedRmseMs(rmseMs)
      onCalibrated?.(offsetMs, rmseMs)
      setPhase(rmseMs > CALIBRATION_LIMITS.maxRmseMs ? 'done_warn' : 'done_ok')
    } catch (e) {
      setErrorMessage('Could not save calibration: ' + (e instanceof Error ? e.message : String(e)))
      setPhase('failed')
    }
  }, [savedOffsetMs, getCtx, onCalibrated])

  // Tap handler — installs while a measuring/verifying phase is active.
  useEffect(() => {
    if (!open) return
    if (phase !== 'measuring' && phase !== 'verifying') return
    const handler = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== ' ' && e.key !== 'Enter') return
      if (e instanceof KeyboardEvent && e.repeat) return
      const t = performance.now()
      if (phaseRef.current === 'measuring') {
        tapsRef.current = [...tapsRef.current, t]
        setTaps(prev => [...prev, t])
      } else if (phaseRef.current === 'verifying') {
        verifyTapsRef.current = [...verifyTapsRef.current, t]
        setVerifyTaps(prev => [...prev, t])
      }
    }
    window.addEventListener('pointerdown', handler)
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [open, phase])

  // Reset when modal closes; tear down audio context so a fresh state is
  // captured on the next open (handles user switching headphones between sessions).
  useEffect(() => {
    if (!open) {
      reset()
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close().catch(() => {})
        ctxRef.current = null
      }
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [open, reset])

  if (!open) return null

  const totalBeatsThisRound =
    phase === 'measuring' ? WARMUP_BEATS + MEASURE_BEATS :
    phase === 'verifying' ? WARMUP_BEATS + VERIFY_BEATS : 0
  const inRound = phase === 'measuring' || phase === 'verifying'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Calibration"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.62)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && phase !== 'measuring' && phase !== 'verifying') onClose() }}
    >
      <div style={{
        background: '#ECE3CC', border: '1px solid #D9CFAE', borderRadius: '16px',
        padding: '28px 32px', maxWidth: '480px', width: '100%',
        boxShadow: '0 20px 60px rgba(26,26,24,0.35)',
      }}>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 6px 0' }}>
          Audio calibration
        </p>
        <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '24px', color: '#1A1A18', margin: '0 0 14px 0' }}>
          {phase === 'idle' && (hasPrior ? 'Recalibrate timing' : 'Calibrate timing')}
          {phase === 'measuring' && 'Tap with the click'}
          {phase === 'computing' && 'Computing…'}
          {phase === 'verifying' && 'Verifying — keep tapping'}
          {phase === 'done_ok' && '✓ Calibration saved'}
          {phase === 'done_warn' && '⚠ Saved with high error'}
          {phase === 'failed' && 'Try again'}
        </h2>

        {phase === 'idle' && (
          <>
            <p style={{ fontFamily: F, fontSize: '14px', color: '#4A4540', lineHeight: 1.65, margin: '0 0 14px 0' }}>
              We&rsquo;ll play 12 clicks at 100 BPM. Tap the spacebar (or anywhere) on each one. After 8 measured beats we&rsquo;ll run a verification round with your offset applied so you can confirm it feels right.
            </p>
            <p style={{ fontFamily: F, fontSize: '13px', color: '#7A7060', lineHeight: 1.6, margin: '0 0 18px 0' }}>
              Use the audio device you&rsquo;ll practice with. Bluetooth headphones, in particular, add latency that this measurement compensates for.
            </p>
            {hasPrior && (
              <p style={{ fontFamily: F, fontSize: '12px', color: '#7A7060', margin: '0 0 14px 0' }}>
                Current saved offset for this device:&nbsp;
                <code style={{ fontFamily: 'ui-monospace, monospace', color: '#2A2318' }}>
                  {(() => {
                    try { return getStoredOffsetMs(getDeviceKey(getCtx())).toFixed(0) } catch { return '0' }
                  })()} ms
                </code>
              </p>
            )}
          </>
        )}

        {inRound && (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontFamily: F, fontSize: '14px', color: '#4A4540', lineHeight: 1.6, margin: '0 0 12px 0' }}>
              {activeBeat < WARMUP_BEATS
                ? `Listening… ${WARMUP_BEATS - activeBeat} until you start.`
                : `Tap with each click. Beat ${activeBeat - WARMUP_BEATS + 1} of ${(phase === 'measuring' ? MEASURE_BEATS : VERIFY_BEATS)}.`}
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {Array.from({ length: totalBeatsThisRound }).map((_, i) => {
                const isWarmup = i < WARMUP_BEATS
                const isActive = i === activeBeat
                const isDone = i < activeBeat
                return (
                  <span
                    key={i}
                    style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: isActive ? '#1A1A18' : isDone ? (isWarmup ? '#C8C4BA' : '#7DA8E8') : '#EDE8DF',
                      transition: 'background 0.15s',
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}

        {phase === 'computing' && (
          <p style={{ fontFamily: F, fontSize: '14px', color: '#4A4540', margin: '0 0 12px 0' }}>
            Crunching {tapsRef.current.length} taps…
          </p>
        )}

        {(phase === 'done_ok' || phase === 'done_warn') && savedOffsetMs !== null && (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontFamily: F, fontSize: '14px', color: '#4A4540', lineHeight: 1.6, margin: '0 0 8px 0' }}>
              Timing offset:&nbsp;
              <code style={{ fontFamily: 'ui-monospace, monospace', color: '#1A1A18', fontSize: '15px' }}>
                {savedOffsetMs > 0 ? '+' : ''}{Math.round(savedOffsetMs)} ms
              </code>
            </p>
            {savedRmseMs !== null && (
              <p style={{ fontFamily: F, fontSize: '12px', color: '#7A7060', margin: 0 }}>
                Residual error after calibration: {savedRmseMs.toFixed(1)} ms
                {savedRmseMs > CALIBRATION_LIMITS.maxRmseMs && ' — your taps were inconsistent; consider redoing for a tighter result.'}
              </p>
            )}
          </div>
        )}

        {phase === 'failed' && errorMessage && (
          <p style={{ fontFamily: F, fontSize: '14px', color: '#B5402A', lineHeight: 1.6, margin: '0 0 14px 0' }}>
            {errorMessage}
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
          {(phase === 'idle' || phase === 'failed') && (
            <>
              <button
                onClick={onClose}
                style={btnSecondary}
              >
                {phase === 'failed' ? 'Cancel' : 'Skip'}
              </button>
              <button
                onClick={start}
                style={btnPrimary}
              >
                {phase === 'failed' ? 'Try again' : 'Start'}
              </button>
            </>
          )}
          {(phase === 'done_ok' || phase === 'done_warn') && (
            <>
              <button onClick={() => { reset(); start() }} style={btnSecondary}>
                Run again
              </button>
              <button onClick={onClose} style={btnPrimary}>Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const btnPrimary: React.CSSProperties = {
  background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px',
  padding: '10px 22px', fontFamily: F, fontSize: '14px', fontWeight: 500, cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  background: 'transparent', color: '#4A4540', border: '1px solid #D9CFAE', borderRadius: '10px',
  padding: '10px 18px', fontFamily: F, fontSize: '14px', fontWeight: 400, cursor: 'pointer',
}
