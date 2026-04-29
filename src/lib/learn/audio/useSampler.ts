/**
 * useSampler — React hook over a shared Tone.Sampler instance for /learn.
 *
 * Design contract (mirrors pianoPlayback.ts):
 *   - Fire-and-forget. Errors are swallowed internally so audio failures
 *     never break drill or lesson flow.
 *   - Lazy-loaded. First call triggers Tone import + sample fetch.
 *   - Module-global singleton. One sampler per browser tab.
 *
 * Differences from pianoPlayback's playPitch:
 *   - Full 29-note Salamander set (matches AudioCard) so /learn diagrams
 *     can render notes outside C3–A5 without warbly pitch-shifting.
 *   - Adds playSequence and playChord.
 *   - Exposes a `ready` boolean for optional UI loading states.
 *
 * Sample URLs match every existing sampler in the codebase, so the
 * browser cache hits across instances — no double-download cost.
 */

import { useEffect, useState } from 'react'

let sharedSampler: any = null
let sharedTone: any = null
let samplerLoaded = false
let samplerLoading = false
const loadCallbacks: Array<() => void> = []
const readyListeners = new Set<(ready: boolean) => void>()

const SALAMANDER_URLS: Record<string, string> = {
  A0: 'A0.mp3',
  C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3', A1: 'A1.mp3',
  C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', A2: 'A2.mp3',
  C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A3: 'A3.mp3',
  C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
  C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
  C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3', A6: 'A6.mp3',
  C7: 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3', A7: 'A7.mp3',
  C8: 'C8.mp3',
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
      release: 1,
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
  // Plain natural ('n') and no accidental are equivalent for playback.
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

async function unlockContext(): Promise<void> {
  if (!sharedTone) return
  if (sharedTone.getContext && sharedTone.getContext().state !== 'running') {
    await sharedTone.start()
  } else if (sharedTone.start) {
    await sharedTone.start()
  }
}

export interface SamplerControls {
  ready: boolean
  play: (pitch: string, duration?: string) => Promise<void>
  playSequence: (pitches: string[], stagger?: number, duration?: string) => Promise<void>
  playChord: (pitches: string[], duration?: string) => Promise<void>
}

export function useSampler(): SamplerControls {
  const [ready, setReady] = useState<boolean>(samplerLoaded)

  useEffect(() => {
    readyListeners.add(setReady)
    return () => { readyListeners.delete(setReady) }
  }, [])

  const play = async (pitch: string, duration: string = '1n'): Promise<void> => {
    try {
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
      await ensureSampler()
      if (!sharedSampler) return
      await unlockContext()
      sharedSampler.triggerAttackRelease(pitches.map(normalisePitch), duration)
    } catch {}
  }

  return { ready, play, playSequence, playChord }
}
