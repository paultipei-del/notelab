'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_VISUAL_LEAD_MS,
  VISUAL_LEAD_LIMITS,
  getDeviceKey,
  getVisualLeadMs,
  setVisualLead,
} from '@/lib/programs/rhythm/calibration'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  open: boolean
  onClose: () => void
  /** Called after the user saves a new lead value. The trainer reads its lead from storage on next start(). */
  onCalibrated?: (leadMs: number) => void
}

const TEMPO_BPM = 90              // Slow enough to feel each beat clearly
const COUNT_DIGITS = 4            // 1, 2, 3, 4 looping
const SCHEDULE_LOOKAHEAD_S = 0.25 // Look this far ahead and schedule any clicks landing in the window

/**
 * Visual-sync calibration. Plays a continuous metronome at a slow tempo with
 * a digit cycling 1–4 in sync with the audio scheduling. The user drags a
 * slider until the *visible* digit change feels coincident with each *heard*
 * click, then saves. The result is a per-device `visualLeadMs` value the
 * trainer applies to its countdown and (eventually) playhead position.
 *
 * Independent from the audio CalibrationModal — solves a different problem
 * (display + render lag) and stores its own value in the same per-device record.
 */
export default function VisualCalibrationModal({ open, onClose, onCalibrated }: Props) {
  const [running, setRunning] = useState(false)
  const [leadMs, setLeadMs] = useState(DEFAULT_VISUAL_LEAD_MS)
  const [activeDigit, setActiveDigit] = useState(0)   // 0..3, displayed as digit+1
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const startCtxTimeRef = useRef(0)
  const nextScheduleIdxRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const leadRef = useRef(DEFAULT_VISUAL_LEAD_MS)

  // Keep the live lead in a ref so the rAF tick reads the latest slider value
  // without React re-rendering it into the closure.
  useEffect(() => { leadRef.current = leadMs }, [leadMs])

  const getCtx = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state !== 'closed') return ctxRef.current
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    ctxRef.current = ctx
    return ctx
  }, [])

  const getOutputLatencySec = useCallback((ctx: AudioContext) => {
    const ex = ctx as AudioContext & { outputLatency?: number }
    return typeof ex.outputLatency === 'number' && Number.isFinite(ex.outputLatency) && ex.outputLatency > 0
      ? ex.outputLatency : 0
  }, [])

  // Load saved value when modal opens.
  useEffect(() => {
    if (!open) return
    try {
      const ctx = getCtx()
      const stored = getVisualLeadMs(getDeviceKey(ctx))
      setLeadMs(stored)
      leadRef.current = stored
    } catch {
      setLeadMs(DEFAULT_VISUAL_LEAD_MS)
    }
    setSavedAt(null)
  }, [open, getCtx])

  const playClick = useCallback((ctx: AudioContext, t: number, accent: boolean) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = accent ? 1600 : 1000
    osc.type = 'square'
    gain.gain.setValueAtTime(accent ? 0.5 : 0.25, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    osc.start(t); osc.stop(t + 0.06)
  }, [])

  const stop = useCallback(() => {
    setRunning(false)
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (schedulerRef.current !== null) {
      clearInterval(schedulerRef.current)
      schedulerRef.current = null
    }
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(() => {})
      ctxRef.current = null
    }
    setActiveDigit(0)
  }, [])

  const start = useCallback(async () => {
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    const beatDurSec = 60 / TEMPO_BPM
    startCtxTimeRef.current = ctx.currentTime + 0.3
    nextScheduleIdxRef.current = 0
    setRunning(true)
    setActiveDigit(0)

    // Audio scheduler — runs every 100ms, schedules any clicks landing within
    // the next SCHEDULE_LOOKAHEAD_S window. This mirrors the standard "look-ahead
    // metronome" pattern so audio scheduling never falls behind even if the JS
    // thread stalls.
    schedulerRef.current = setInterval(() => {
      const c = ctxRef.current
      if (!c || c.state === 'closed') return
      while (true) {
        const idx = nextScheduleIdxRef.current
        const t = startCtxTimeRef.current + idx * beatDurSec
        if (t > c.currentTime + SCHEDULE_LOOKAHEAD_S) break
        if (t < c.currentTime - 0.05) {
          // Fell behind; skip but advance the index.
          nextScheduleIdxRef.current = idx + 1
          continue
        }
        playClick(c, t, idx % COUNT_DIGITS === 0)
        nextScheduleIdxRef.current = idx + 1
      }
    }, 100)

    // Visual rAF loop — flips activeDigit when the *perceived* moment of click
    // arrives, accounting for output latency and the slider-controlled lead.
    const tick = () => {
      const c = ctxRef.current
      if (!c || c.state === 'closed') {
        rafRef.current = null
        return
      }
      const outputLatencySec = getOutputLatencySec(c)
      const leadSec = leadRef.current / 1000
      // Perceived elapsed = scheduled elapsed + outputLatency − leadSec
      // (we want the visual to fire `lead` early so display lag lands it on the heard click)
      const elapsedHeard = c.currentTime - startCtxTimeRef.current - outputLatencySec
      const elapsedAdjusted = elapsedHeard + leadSec
      const beat = Math.max(0, Math.floor(elapsedAdjusted / beatDurSec))
      setActiveDigit(beat % COUNT_DIGITS)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [getCtx, getOutputLatencySec, playClick])

  const save = useCallback(() => {
    try {
      const ctx = ctxRef.current ?? getCtx()
      const deviceKey = getDeviceKey(ctx)
      setVisualLead(deviceKey, leadMs)
      setSavedAt(new Date().toLocaleTimeString())
      onCalibrated?.(leadMs)
    } catch {
      // ignore — localStorage may be disabled in some browser modes
    }
  }, [leadMs, getCtx, onCalibrated])

  // Stop everything when modal closes.
  useEffect(() => {
    if (!open) stop()
    return () => { stop() }
  }, [open, stop])

  if (!open) return null

  const closable = !running

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visual sync calibration"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.62)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget && closable) onClose() }}
    >
      <div style={{
        background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '16px',
        padding: '28px 32px', maxWidth: '520px', width: '100%',
        boxShadow: '0 20px 60px rgba(26,26,24,0.35)',
      }}>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 6px 0' }}>
          Visual sync
        </p>
        <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '24px', color: '#1A1A18', margin: '0 0 12px 0' }}>
          Tune the countdown lead
        </h2>
        <p style={{ fontFamily: F, fontSize: '14px', color: '#4A4540', lineHeight: 1.6, margin: '0 0 18px 0' }}>
          Press <strong>Start</strong> to play a slow metronome with a cycling digit. Drag the slider until the digit change
          and the click sound feel simultaneous. <strong>Save</strong> when it&rsquo;s right. The trainer&rsquo;s countdown
          will use this value going forward.
        </p>

        {/* Live preview area */}
        <div style={{
          background: 'white', border: '1px solid #DDD8CA', borderRadius: '12px',
          padding: '24px', marginBottom: '18px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            {running ? 'Listen + watch' : 'Press Start to begin'}
          </span>
          <div style={{
            fontFamily: SERIF, fontSize: '88px', fontWeight: 300, color: '#1A1A18',
            lineHeight: 1, minWidth: '80px', textAlign: 'center' as const,
            opacity: running ? 1 : 0.25,
          }}>
            {activeDigit + 1}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: COUNT_DIGITS }).map((_, i) => (
              <span key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: i === activeDigit ? '#1A1A18' : '#EDE8DF',
                transition: 'background 0.08s',
              }} />
            ))}
          </div>
        </div>

        {/* Slider */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <label htmlFor="visual-lead" style={{ fontFamily: F, fontSize: '13px', fontWeight: 500, color: '#2A2318' }}>
              Visual lead
            </label>
            <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px', color: '#1A1A18' }}>
              {leadMs} ms
            </code>
          </div>
          <input
            id="visual-lead"
            type="range"
            min={VISUAL_LEAD_LIMITS.minMs}
            max={VISUAL_LEAD_LIMITS.maxMs}
            step={1}
            value={leadMs}
            onChange={e => setLeadMs(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F, fontSize: '11px', color: '#7A7060', marginTop: '4px' }}>
            <span>{VISUAL_LEAD_LIMITS.minMs} ms</span>
            <span>visual leads sound ↔ visual lags sound</span>
            <span>{VISUAL_LEAD_LIMITS.maxMs} ms</span>
          </div>
        </div>

        {/* Help text */}
        <p style={{ fontFamily: F, fontSize: '12px', color: '#7A7060', lineHeight: 1.6, margin: '0 0 18px 0' }}>
          If the digit changes <em>before</em> you hear the click, lower the value.
          If you hear the click <em>before</em> the digit changes, raise it.
          Typical values are 30–80 ms on a 60 Hz desktop monitor.
        </p>

        {savedAt && (
          <p style={{ fontFamily: F, fontSize: '12px', color: '#3B6D11', margin: '0 0 12px 0' }}>
            ✓ Saved at {savedAt}
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
          {!running ? (
            <button onClick={start} style={btnPrimary}>Start</button>
          ) : (
            <button onClick={stop} style={btnSecondary}>Stop</button>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={btnSecondary} disabled={running}>
              {savedAt ? 'Done' : 'Cancel'}
            </button>
            <button onClick={save} style={btnPrimary}>
              Save
            </button>
          </div>
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
  background: 'transparent', color: '#4A4540', border: '1px solid #DDD8CA', borderRadius: '10px',
  padding: '10px 18px', fontFamily: F, fontSize: '14px', fontWeight: 400, cursor: 'pointer',
}
