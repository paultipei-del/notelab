/**
 * useSampler — React hook over a shared Tone.Sampler instance for /learn.
 *
 * Design contract:
 *   - Fire-and-forget. Errors are swallowed internally so audio failures
 *     never break drill or lesson flow.
 *   - Eagerly loaded on first hook mount. By the time the user clicks a
 *     play button, samples have been downloading in the background.
 *   - Module-global singleton. One sampler per browser tab.
 *
 * Sample strategy:
 *   - 5 sparse Salamander samples (every other octave from A1 → A5).
 *     Tone.Sampler pitch-shifts to fill in the rest. Total payload is
 *     ~1 MB instead of the full Salamander set's ~5 MB, so the page is
 *     usable on slow connections and inside Vercel previews.
 *   - Release time kept short (0.4) so consecutive notes in a rhythm
 *     don't ring into each other and produce muddy overlap.
 *
 * Safari unlock:
 *   - Modern browsers (and Safari especially) require an AudioContext to
 *     be resumed inside a user gesture. We attach a one-time
 *     pointer/touch/key listener to `document` on first mount that calls
 *     `Tone.start()` synchronously, so by the time the first Play button
 *     is clicked the context is already running.
 */

import { useEffect, useState } from 'react'

// Tone's published types don't expose Sampler in a stable place across
// versions, so keep the singletons at `any` — the call sites are tiny
// and well-isolated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedSampler: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedTone: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let metronomeSynth: any = null
let samplerLoaded = false
let samplerLoading = false
const loadCallbacks: Array<() => void> = []
const readyListeners = new Set<(ready: boolean) => void>()

// Sparse sample set: every other octave, A natural. Tone.Sampler pitch
// shifts to fill the gaps — the result is a recognisably piano-like
// timbre at 1/5 the bandwidth of the full 29-sample set.
const SALAMANDER_URLS: Record<string, string> = {
  A1: 'A1.mp3',
  A2: 'A2.mp3',
  A3: 'A3.mp3',
  A4: 'A4.mp3',
  A5: 'A5.mp3',
  A6: 'A6.mp3',
}

function notifyReady(ready: boolean): void {
  readyListeners.forEach(cb => cb(ready))
}

async function ensureSampler(): Promise<void> {
  if (samplerLoaded) return
  if (samplerLoading) return new Promise(resolve => loadCallbacks.push(resolve))
  samplerLoading = true
  const Tone = await import('tone')
  sharedTone = Tone
  return new Promise(resolve => {
    sharedSampler = new Tone.Sampler({
      urls: SALAMANDER_URLS,
      // Short release so successive notes in a rhythm visual don't
      // overlap into a muddy ring.
      release: 0.4,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => {
        samplerLoaded = true
        samplerLoading = false
        loadCallbacks.forEach(cb => cb())
        loadCallbacks.length = 0
        notifyReady(true)
        resolve()
      },
    }).toDestination()
  })
}

function normalisePitch(p: string): string {
  const m = p.match(/^([A-G])(##|bb|#|b|n)?(\d+)$/)
  if (!m) return p
  const [, letter, accidental, octaveStr] = m
  const octave = parseInt(octaveStr, 10)
  if (!accidental || accidental === 'n') return `${letter}${octave}`
  if (accidental === '#') return p
  if (accidental === 'b') {
    const flatMap: Record<string, [string, number]> = {
      C: ['B', -1], D: ['C#', 0], E: ['D#', 0], F: ['E', 0],
      G: ['F#', 0], A: ['G#', 0], B: ['A#', 0],
    }
    const [nl, od] = flatMap[letter] ?? [letter, 0]
    return `${nl}${octave + od}`
  }
  if (accidental === '##') {
    const dblSharpMap: Record<string, [string, number]> = {
      C: ['D', 0], D: ['E', 0], E: ['F#', 0], F: ['G', 0],
      G: ['A', 0], A: ['B', 0], B: ['C#', 1],
    }
    const [nl, od] = dblSharpMap[letter] ?? [letter, 0]
    return `${nl}${octave + od}`
  }
  if (accidental === 'bb') {
    const dblFlatMap: Record<string, [string, number]> = {
      C: ['A#', -1], D: ['C', 0], E: ['D', 0], F: ['D#', 0],
      G: ['F', 0], A: ['G', 0], B: ['A', 0],
    }
    const [nl, od] = dblFlatMap[letter] ?? [letter, 0]
    return `${nl}${octave + od}`
  }
  return p
}

/**
 * Synchronous AudioContext resume — must be called from a user gesture.
 * If Tone hasn't been imported yet, this is a no-op (the gesture will
 * have already started the import via `play()` etc).
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

function ensureMetronome(): void {
  if (metronomeSynth || !sharedTone) return
  try {
    metronomeSynth = new sharedTone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.04 },
    }).toDestination()
    // Quieter than the sampler so it sits under the melodic notes.
    if (metronomeSynth.volume) metronomeSynth.volume.value = -14
  } catch {
    metronomeSynth = null
  }
}

export interface SamplerControls {
  ready: boolean
  play: (pitch: string, duration?: string) => Promise<void>
  playSequence: (pitches: string[], stagger?: number, duration?: string) => Promise<void>
  playChord: (pitches: string[], duration?: string) => Promise<void>
  /** Brief click sound for metronome. `accent: true` for the downbeat. */
  tick: (accent?: boolean) => Promise<void>
  /**
   * Sample-accurate scheduling: schedule a single note at a specific
   * audio-context `time`. Synchronous — call inside a Tone.Part callback
   * so the time argument lines up with the transport.
   * Duration accepts seconds (number) or note-value strings ('4n', '8n').
   */
  playAt: (pitch: string, duration: number | string, time: number) => void
  /** Sample-accurate metronome click at audio-context `time`. */
  tickAt: (accent: boolean, time: number) => void
  /**
   * Resolves once the sampler has finished downloading and is ready to
   * play. Use this in click handlers that *must* have audio before they
   * start a loop, so the user doesn't see/hear a silent first iteration.
   */
  ensureReady: () => Promise<void>
}

export function useSampler(): SamplerControls {
  const [ready, setReady] = useState<boolean>(samplerLoaded)

  useEffect(() => {
    readyListeners.add(setReady)
    // Eagerly start the download so audio is ready before the user
    // clicks Play. Errors are silent — the play handler will retry.
    void ensureSampler()
    // Attach a once-only document-level audio unlocker for Safari /
    // strict autoplay policies. Any first user interaction unlocks.
    installDocumentUnlocker()
    return () => { readyListeners.delete(setReady) }
  }, [])

  const play = async (pitch: string, duration: string = '1n'): Promise<void> => {
    try {
      // Best-effort synchronous unlock first so a real user gesture
      // (this stack frame) unlocks the context even if samples are
      // still loading.
      unlockSync()
      await ensureSampler()
      if (!sharedSampler) return
      await unlockContext()
      sharedSampler.triggerAttackRelease(normalisePitch(pitch), duration)
    } catch {}
  }

  const playSequence = async (
    pitches: string[],
    stagger: number = 380,
    duration: string = '4n',
  ): Promise<void> => {
    try {
      unlockSync()
      await ensureSampler()
      if (!sharedSampler) return
      await unlockContext()
      const now = sharedTone.now()
      pitches.forEach((p, i) => {
        sharedSampler.triggerAttackRelease(
          normalisePitch(p),
          duration,
          now + (i * stagger) / 1000,
        )
      })
    } catch {}
  }

  const playChord = async (
    pitches: string[],
    duration: string = '2n',
  ): Promise<void> => {
    try {
      unlockSync()
      await ensureSampler()
      if (!sharedSampler) return
      await unlockContext()
      sharedSampler.triggerAttackRelease(pitches.map(normalisePitch), duration)
    } catch {}
  }

  const tick = async (accent: boolean = false): Promise<void> => {
    try {
      unlockSync()
      await ensureSampler()
      ensureMetronome()
      if (!metronomeSynth) return
      // Higher pitch + slight louder volume on the accented downbeat.
      const pitch = accent ? 'A5' : 'E5'
      metronomeSynth.triggerAttackRelease(pitch, '32n')
    } catch {}
  }

  /**
   * Synchronous, sample-accurate playback. Caller MUST ensure the sampler
   * is loaded (e.g. by checking `ready`) before calling.
   */
  const playAt = (pitch: string, duration: number | string, time: number): void => {
    try {
      if (!sharedSampler) return
      sharedSampler.triggerAttackRelease(normalisePitch(pitch), duration, time)
    } catch {}
  }

  const tickAt = (accent: boolean, time: number): void => {
    try {
      ensureMetronome()
      if (!metronomeSynth) return
      metronomeSynth.triggerAttackRelease(accent ? 'A5' : 'E5', '32n', time)
    } catch {}
  }

  const ensureReady = async (): Promise<void> => {
    try {
      unlockSync()
      await ensureSampler()
      // Audio context start can be a no-op if already running. Awaiting
      // it guarantees we don't return before the sampler is callable.
      await unlockContext()
    } catch {}
  }

  return { ready, play, playSequence, playChord, tick, playAt, tickAt, ensureReady }
}
