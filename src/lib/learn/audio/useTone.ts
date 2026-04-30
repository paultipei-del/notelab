/**
 * useTone — React hook for a continuous sine-wave generator.
 *
 * Backed by raw Web Audio. Safari pattern in use:
 *   - The AudioContext is created LAZILY inside the click handler, not
 *     on hook mount. iOS Safari (and some desktop Safari versions) will
 *     refuse to resume a context that was first created outside a user
 *     gesture, even if resume() is later called inside one.
 *   - We `await ctx.resume()` synchronously after creation. The await
 *     is fine inside the click handler — Safari only requires the
 *     resume to start inside the gesture, not finish.
 *   - A fresh OscillatorNode is created per play because
 *     OscillatorNode.start() can only be called once per node.
 *
 * Diagnostic logs are kept in for now (TONE_DEBUG=true) so users
 * reporting silent playback can capture the actual state in Safari's
 * Web Inspector. Remove once confirmed working in production.
 */

import { useEffect, useRef, useState } from 'react'
import { createAudioContext, waitForCtxClock } from '@/lib/audio/audioContext'

const TONE_DEBUG = true
function dbg(...args: unknown[]): void {
  if (TONE_DEBUG && typeof console !== 'undefined') {
    console.log('[useTone]', ...args)
  }
}

let sharedCtx: AudioContext | null = null
let sharedGain: GainNode | null = null
let currentOsc: OscillatorNode | null = null

function ensureGraph(): boolean {
  if (sharedCtx && sharedGain) return true
  const ctx = createAudioContext()
  if (!ctx) {
    dbg('createAudioContext returned null')
    return false
  }
  sharedCtx = ctx
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(ctx.destination)
  sharedGain = gain
  dbg('graph created, state =', ctx.state, 'sampleRate =', ctx.sampleRate)
  return true
}

function killCurrentOsc(stopAt: number): void {
  if (!currentOsc) return
  try {
    currentOsc.stop(stopAt)
    currentOsc.disconnect()
  } catch {
    /* already-stopped / not-started: ignore */
  }
  currentOsc = null
}

export interface ToneControls {
  isPlaying: boolean
  start: (frequency?: number, gain?: number) => Promise<void>
  stop: () => Promise<void>
  setFrequency: (hz: number) => void
  setGain: (gain: number) => void
}

export function useTone(): ToneControls {
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (isPlayingRef.current && sharedCtx && sharedGain) {
        const t = sharedCtx.currentTime
        try {
          sharedGain.gain.cancelScheduledValues(t)
          sharedGain.gain.linearRampToValueAtTime(0, t + 0.02)
        } catch {}
        killCurrentOsc(t + 0.05)
        isPlayingRef.current = false
      }
    }
  }, [])

  const start = async (frequency: number = 440, gain: number = 0.3): Promise<void> => {
    dbg('start invoked', { frequency, gain })
    try {
      // Create the AudioContext on first click (inside the user gesture)
      // so Safari treats it as gesture-originated.
      if (!ensureGraph()) {
        dbg('ensureGraph failed')
        return
      }
      if (!sharedCtx || !sharedGain) return

      dbg('before resume, state =', sharedCtx.state)
      if (sharedCtx.state === 'suspended') {
        await sharedCtx.resume()
        dbg('after resume, state =', sharedCtx.state)
      }

      if (sharedCtx.state !== 'running') {
        dbg('context still not running after resume; aborting')
        return
      }

      // Safari quirk: ctx.currentTime can stay at 0 for several frames
      // after resume() resolves. Scheduling at t=0 during that window
      // puts events "in the past" once the clock starts and they
      // silently don't fire. Wait for the clock to actually advance.
      await waitForCtxClock(sharedCtx)
      dbg('clock advanced, currentTime =', sharedCtx.currentTime)

      const t = sharedCtx.currentTime
      killCurrentOsc(t)

      const osc = sharedCtx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = frequency
      osc.connect(sharedGain)

      sharedGain.gain.cancelScheduledValues(t)
      sharedGain.gain.setValueAtTime(0, t)
      sharedGain.gain.linearRampToValueAtTime(gain, t + 0.01)

      osc.start(t)
      currentOsc = osc

      isPlayingRef.current = true
      setIsPlaying(true)
      dbg('osc started at', t)
    } catch (err) {
      dbg('caught error', err)
    }
  }

  const stop = async (): Promise<void> => {
    try {
      if (sharedCtx && sharedGain) {
        const t = sharedCtx.currentTime
        sharedGain.gain.cancelScheduledValues(t)
        sharedGain.gain.linearRampToValueAtTime(0, t + 0.02)
        killCurrentOsc(t + 0.05)
      }
      isPlayingRef.current = false
      setIsPlaying(false)
    } catch {}
  }

  const setFrequency = (hz: number): void => {
    if (!sharedCtx || !currentOsc) return
    try {
      const t = sharedCtx.currentTime
      currentOsc.frequency.cancelScheduledValues(t)
      currentOsc.frequency.linearRampToValueAtTime(hz, t + 0.02)
    } catch {}
  }

  const setGain = (gain: number): void => {
    if (!sharedCtx || !sharedGain) return
    try {
      const t = sharedCtx.currentTime
      sharedGain.gain.cancelScheduledValues(t)
      sharedGain.gain.linearRampToValueAtTime(gain, t + 0.02)
    } catch {}
  }

  return { isPlaying, start, stop, setFrequency, setGain }
}
