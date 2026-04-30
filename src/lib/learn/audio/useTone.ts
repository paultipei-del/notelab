/**
 * useTone — React hook for a continuous sine-wave generator.
 *
 * Backed by raw Web Audio (AudioContext + OscillatorNode + GainNode),
 * not Tone.js. Tone.js's dynamic-import path was unreliable in Safari:
 * the AudioContext didn't exist yet when the user clicked Play, so the
 * gesture-based unlock had nothing to resume.
 *
 * Safari pattern in use here:
 *   - The AudioContext is created from outside any user gesture, on
 *     hook mount. Browsers create it in `suspended` state in this case.
 *   - On every Play click we (a) `await ctx.resume()` so the context is
 *     definitely running before we schedule audio, and (b) create a
 *     fresh OscillatorNode for the play (OscillatorNodes are
 *     single-shot — start() can only be called once per node).
 *   - The await on `resume()` is fine inside the click handler: Safari
 *     only requires that resume *start* inside the gesture, not finish.
 */

import { useEffect, useRef, useState } from 'react'
import { createAudioContext } from '@/lib/audio/audioContext'

let sharedCtx: AudioContext | null = null
let sharedGain: GainNode | null = null
let currentOsc: OscillatorNode | null = null

function ensureGraph(): void {
  if (sharedCtx) return
  const ctx = createAudioContext()
  if (!ctx) return
  sharedCtx = ctx

  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(ctx.destination)
  sharedGain = gain
}

function killCurrentOsc(now: number): void {
  if (!currentOsc) return
  try {
    currentOsc.stop(now + 0.05)
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
    ensureGraph()
    return () => {
      if (isPlayingRef.current && sharedCtx) {
        const t = sharedCtx.currentTime
        if (sharedGain) {
          try {
            sharedGain.gain.cancelScheduledValues(t)
            sharedGain.gain.linearRampToValueAtTime(0, t + 0.02)
          } catch {}
        }
        killCurrentOsc(t)
        isPlayingRef.current = false
      }
    }
  }, [])

  const start = async (frequency: number = 440, gain: number = 0.3): Promise<void> => {
    try {
      ensureGraph()
      if (!sharedCtx || !sharedGain) return

      // Resume the context if it's suspended. Awaiting is fine here —
      // Safari only requires the resume to *start* inside the gesture,
      // and `await` chains within the same handler invocation.
      if (sharedCtx.state === 'suspended') {
        await sharedCtx.resume()
      }

      const t = sharedCtx.currentTime

      // Stop any oscillator currently playing — we always create a
      // fresh node since OscillatorNode.start() can only be called once
      // per node lifetime in Web Audio.
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
    } catch {
      /* swallow — audio is best-effort */
    }
  }

  const stop = async (): Promise<void> => {
    try {
      if (sharedCtx && sharedGain) {
        const t = sharedCtx.currentTime
        sharedGain.gain.cancelScheduledValues(t)
        sharedGain.gain.linearRampToValueAtTime(0, t + 0.02)
        killCurrentOsc(t + 0.02)
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
