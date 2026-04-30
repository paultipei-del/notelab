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
 *
 * Safari unlock:
 *   - The previous version awaited a dynamic `import('tone')` *before*
 *     resuming the audio context. Safari treats every `await` as a chance
 *     to drop the user-gesture context, so resume() ran outside the
 *     gesture and silently failed. Fix: eagerly load Tone on mount,
 *     install a document-level pointer/touch/key listener that calls
 *     Tone.start() synchronously on the first interaction anywhere on the
 *     page, and call `unlockSync()` as the first line of `start()` so the
 *     resume happens inside the click stack frame even if Tone hasn't
 *     finished loading yet.
 */

import { useEffect, useRef, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedOscillator: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedGain: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 * Synchronous AudioContext resume. Must be called from a user-gesture
 * stack frame. If Tone hasn't finished importing yet, this is a no-op —
 * the document-level unlocker will catch a later gesture.
 */
function unlockSync(): void {
  if (!sharedTone) return
  try {
    const ctx = sharedTone.getContext?.()
    if (ctx && ctx.state !== 'running') {
      // Tone.start() resolves a promise but the underlying resume is
      // synchronous-enough for Safari to honor it as part of the gesture.
      void sharedTone.start()
    }
  } catch {
    /* swallow — audio is best-effort */
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

let documentUnlockerInstalled = false
function installDocumentUnlocker(): void {
  if (documentUnlockerInstalled) return
  if (typeof document === 'undefined') return
  documentUnlockerInstalled = true
  const onFirstInteract = () => {
    unlockSync()
    document.removeEventListener('pointerdown', onFirstInteract)
    document.removeEventListener('touchstart', onFirstInteract)
    document.removeEventListener('keydown', onFirstInteract)
  }
  document.addEventListener('pointerdown', onFirstInteract, { once: true })
  document.addEventListener('touchstart', onFirstInteract, { once: true })
  document.addEventListener('keydown', onFirstInteract, { once: true })
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
    // Eagerly start the Tone import so by the time the user clicks Play
    // the module is already in memory and `start()` doesn't have to await
    // a dynamic import.
    void ensureOscillator()
    // Document-level unlocker: any first user interaction anywhere on
    // the page resumes the audio context. Safari requires this because
    // it won't honor a resume that happens after an await.
    installDocumentUnlocker()
    return () => {
      if (isPlayingRef.current && sharedOscillator) {
        try { sharedOscillator.stop() } catch {}
        isPlayingRef.current = false
      }
    }
  }, [])

  const start = async (frequency: number = 440, gain: number = 0.3): Promise<void> => {
    try {
      // FIRST line in the click handler path: synchronous resume so the
      // user-gesture chain is honored. Anything async after this is fine.
      unlockSync()
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
