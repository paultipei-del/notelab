/**
 * useTone — React hook for a continuous sine-wave generator.
 *
 * Backed by raw Web Audio (AudioContext + OscillatorNode + GainNode),
 * not Tone.js. The earlier Tone-backed version was unreliable in Safari
 * because the click handler awaited a dynamic `import('tone')` *before*
 * resuming the audio context — Safari drops the user-gesture context
 * across awaits, so the resume silently failed.
 *
 * Raw Web Audio sidesteps the issue: the AudioContext exists from the
 * moment the hook mounts, no async import sits between the click and
 * the resume call, and `unlockSync()` always has a real context to
 * resume.
 *
 * Contract:
 *   - Module-global singleton context + nodes; one tone per browser tab.
 *   - Fire-and-forget. Errors are swallowed.
 *   - Frequency / gain updates are smoothed with a tiny ramp so slider
 *     drags don't produce zipper noise.
 */

import { useEffect, useRef, useState } from 'react'
import {
  createAudioContext,
  unlockSync,
  installDocumentUnlocker,
} from '@/lib/audio/audioContext'

let sharedCtx: AudioContext | null = null
let sharedOsc: OscillatorNode | null = null
let sharedGain: GainNode | null = null
let isStarted = false
let unlockerInstalled = false

function ensureGraph(): void {
  if (sharedCtx) return
  const ctx = createAudioContext()
  if (!ctx) return
  sharedCtx = ctx

  const gain = ctx.createGain()
  // Start at 0 so the very first oscillator.start() doesn't pop —
  // the start() handler ramps it up to the requested gain.
  gain.gain.value = 0
  gain.connect(ctx.destination)
  sharedGain = gain

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 440
  osc.connect(gain)
  sharedOsc = osc

  if (!unlockerInstalled) {
    installDocumentUnlocker(ctx)
    unlockerInstalled = true
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
    // Eagerly build the audio graph on mount so the AudioContext exists
    // by the time the user clicks Play. The context starts suspended;
    // the document-level unlocker (or unlockSync inside start) resumes it.
    ensureGraph()
    return () => {
      if (isPlayingRef.current && sharedGain && sharedCtx) {
        try {
          sharedGain.gain.cancelScheduledValues(sharedCtx.currentTime)
          sharedGain.gain.linearRampToValueAtTime(0, sharedCtx.currentTime + 0.02)
        } catch {}
        isPlayingRef.current = false
      }
    }
  }, [])

  const start = async (frequency: number = 440, gain: number = 0.3): Promise<void> => {
    try {
      // Build the graph if it's not built yet (e.g. SSR -> first interaction).
      ensureGraph()
      if (!sharedCtx || !sharedOsc || !sharedGain) return

      // Synchronous resume FIRST so the user-gesture chain stays intact.
      unlockSync(sharedCtx)

      // Lazily start the oscillator on the first call. OscillatorNode is
      // single-use in Web Audio — once stopped it can't be restarted, so
      // we keep one running for the lifetime of the page and modulate
      // gain/frequency to play and pause.
      if (!isStarted) {
        sharedOsc.start()
        isStarted = true
      }

      const t = sharedCtx.currentTime
      sharedOsc.frequency.cancelScheduledValues(t)
      sharedOsc.frequency.linearRampToValueAtTime(frequency, t + 0.01)
      sharedGain.gain.cancelScheduledValues(t)
      sharedGain.gain.linearRampToValueAtTime(gain, t + 0.01)

      isPlayingRef.current = true
      setIsPlaying(true)
    } catch {}
  }

  const stop = async (): Promise<void> => {
    try {
      if (sharedCtx && sharedGain) {
        const t = sharedCtx.currentTime
        sharedGain.gain.cancelScheduledValues(t)
        sharedGain.gain.linearRampToValueAtTime(0, t + 0.02)
      }
      isPlayingRef.current = false
      setIsPlaying(false)
    } catch {}
  }

  const setFrequency = (hz: number): void => {
    if (!sharedCtx || !sharedOsc) return
    try {
      const t = sharedCtx.currentTime
      sharedOsc.frequency.cancelScheduledValues(t)
      sharedOsc.frequency.linearRampToValueAtTime(hz, t + 0.02)
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
