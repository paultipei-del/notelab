/**
 * useTone — React hook for a shared Tone.Oscillator (sine wave generator).
 *
 * Used by physics-of-sound diagrams that need to play pure sine tones rather
 * than piano samples. Unlike useSampler, this synthesizes audio directly and
 * has no sample-loading delay — it's instant.
 *
 * Same fire-and-forget contract as useSampler:
 *   - Errors are swallowed
 *   - Module-global singleton
 *   - Lazy-loaded on first call
 */

import { useEffect, useRef, useState } from 'react'

let sharedOscillator: any = null
let sharedGain: any = null
let sharedTone: any = null
let initialized = false
let initializing = false
const initCallbacks: Array<() => void> = []

async function ensureOscillator(): Promise<void> {
  if (initialized) return
  if (initializing) return new Promise(resolve => initCallbacks.push(resolve))
  initializing = true
  try {
    const Tone = await import('tone')
    sharedTone = Tone
    sharedGain = new Tone.Gain(0.3).toDestination()
    sharedOscillator = new Tone.Oscillator(440, 'sine').connect(sharedGain)
    initialized = true
    initializing = false
    initCallbacks.forEach(cb => cb())
    initCallbacks.length = 0
  } catch {
    initializing = false
  }
}

async function unlockContext(): Promise<void> {
  if (!sharedTone) return
  if (sharedTone.getContext && sharedTone.getContext().state !== 'running') {
    await sharedTone.start()
  } else if (sharedTone.start) {
    await sharedTone.start()
  }
}

export interface ToneControls {
  /** Whether the tone is currently playing. */
  isPlaying: boolean
  /** Start the tone. Idempotent if already playing. */
  start: (frequency?: number, gain?: number) => Promise<void>
  /** Stop the tone. */
  stop: () => Promise<void>
  /** Update the frequency in Hz while playing. */
  setFrequency: (hz: number) => void
  /** Update the gain (0-1) while playing. */
  setGain: (gain: number) => void
}

export function useTone(): ToneControls {
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    return () => {
      // Stop if this component unmounts while playing
      if (isPlayingRef.current && sharedOscillator) {
        try { sharedOscillator.stop() } catch {}
        isPlayingRef.current = false
      }
    }
  }, [])

  const start = async (frequency: number = 440, gain: number = 0.3): Promise<void> => {
    try {
      await ensureOscillator()
      if (!sharedOscillator) return
      await unlockContext()
      sharedOscillator.frequency.value = frequency
      sharedGain.gain.value = gain
      if (sharedOscillator.state !== 'started') {
        sharedOscillator.start()
      }
      isPlayingRef.current = true
      setIsPlaying(true)
    } catch {}
  }

  const stop = async (): Promise<void> => {
    try {
      if (sharedOscillator && sharedOscillator.state === 'started') {
        sharedOscillator.stop()
      }
      isPlayingRef.current = false
      setIsPlaying(false)
    } catch {}
  }

  const setFrequency = (hz: number): void => {
    if (sharedOscillator) {
      try { sharedOscillator.frequency.value = hz } catch {}
    }
  }

  const setGain = (gain: number): void => {
    if (sharedGain) {
      try { sharedGain.gain.value = gain } catch {}
    }
  }

  return { isPlaying, start, stop, setFrequency, setGain }
}
