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
let currentOsc: OscillatorNode | null = null
let currentGain: GainNode | null = null

function ensureCtx(): boolean {
  if (sharedCtx) return true
  const ctx = createAudioContext()
  if (!ctx) {
    dbg('createAudioContext returned null')
    return false
  }
  sharedCtx = ctx
  dbg('ctx created, state =', ctx.state, 'sampleRate =', ctx.sampleRate)
  return true
}

function killCurrent(stopAt: number): void {
  if (currentOsc) {
    try {
      currentOsc.stop(stopAt)
      currentOsc.disconnect()
    } catch {}
    currentOsc = null
  }
  if (currentGain) {
    try { currentGain.disconnect() } catch {}
    currentGain = null
  }
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
      if (isPlayingRef.current && sharedCtx) {
        killCurrent(sharedCtx.currentTime + 0.02)
        isPlayingRef.current = false
      }
    }
  }, [])

  const start = async (frequency: number = 440, gain: number = 0.3): Promise<void> => {
    dbg('start invoked', { frequency, gain })
    try {
      if (!ensureCtx()) {
        dbg('ensureCtx failed')
        return
      }
      if (!sharedCtx) return

      dbg('before resume, state =', sharedCtx.state)
      if (sharedCtx.state === 'suspended') {
        await sharedCtx.resume()
        dbg('after resume, state =', sharedCtx.state)
      }

      if (sharedCtx.state !== 'running') {
        dbg('context still not running after resume; aborting')
        return
      }

      await waitForCtxClock(sharedCtx)
      dbg('clock advanced, currentTime =', sharedCtx.currentTime)

      // Stop and tear down anything previous so we don't stack oscillators.
      killCurrent(sharedCtx.currentTime)

      // Build a fresh, minimal graph: osc -> gain -> destination.
      // Direct .value assignment (no automation) avoids any Safari
      // quirks with cancelScheduledValues / linearRampToValueAtTime
      // running before currentTime fully stabilises.
      const g = sharedCtx.createGain()
      g.gain.value = gain
      g.connect(sharedCtx.destination)

      const osc = sharedCtx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = frequency
      osc.connect(g)

      osc.start()
      currentOsc = osc
      currentGain = g

      isPlayingRef.current = true
      setIsPlaying(true)
      dbg(
        'osc started; gain.value =', g.gain.value,
        'destination channels =', sharedCtx.destination.channelCount,
        'currentTime =', sharedCtx.currentTime,
      )
    } catch (err) {
      dbg('caught error', err)
    }
  }

  const stop = async (): Promise<void> => {
    try {
      if (sharedCtx) {
        killCurrent(sharedCtx.currentTime + 0.02)
      }
      isPlayingRef.current = false
      setIsPlaying(false)
    } catch {}
  }

  const setFrequency = (hz: number): void => {
    if (!currentOsc) return
    try {
      currentOsc.frequency.value = hz
    } catch {}
  }

  const setGain = (gain: number): void => {
    if (!currentGain) return
    try {
      currentGain.gain.value = gain
    } catch {}
  }

  return { isPlaying, start, stop, setFrequency, setGain }
}
