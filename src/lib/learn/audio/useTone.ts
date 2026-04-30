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
 *   - We then `await waitForCtxClock(ctx)` because Safari's
 *     ctx.currentTime can stay at 0 for several frames after resume()
 *     resolves; scheduling at t=0 during that window puts events "in
 *     the past" once the clock starts and they silently never fire.
 *   - A fresh OscillatorNode + GainNode is built per play. Direct
 *     `.value` assignment (no automation curves) avoids quirks with
 *     setValueAtTime / linearRampToValueAtTime running before the
 *     clock fully stabilises.
 *
 * If a user reports no sound: confirm Safari extensions aren't
 * blocking the page (test in a Private Browsing window — Safari
 * disables extensions there). Some privacy/ad-block extensions
 * silently suppress Web Audio.
 */

import { useEffect, useRef, useState } from 'react'
import { createAudioContext, waitForCtxClock } from '@/lib/audio/audioContext'

let sharedCtx: AudioContext | null = null
let currentOsc: OscillatorNode | null = null
let currentGain: GainNode | null = null

function ensureCtx(): boolean {
  if (sharedCtx) return true
  const ctx = createAudioContext()
  if (!ctx) return false
  sharedCtx = ctx
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
    try {
      if (!ensureCtx() || !sharedCtx) return

      if (sharedCtx.state === 'suspended') {
        await sharedCtx.resume()
      }
      if (sharedCtx.state !== 'running') return

      await waitForCtxClock(sharedCtx)

      killCurrent(sharedCtx.currentTime)

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
    } catch {
      /* swallow — audio is best-effort */
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
    try { currentOsc.frequency.value = hz } catch {}
  }

  const setGain = (gain: number): void => {
    if (!currentGain) return
    try { currentGain.gain.value = gain } catch {}
  }

  return { isPlaying, start, stop, setFrequency, setGain }
}
