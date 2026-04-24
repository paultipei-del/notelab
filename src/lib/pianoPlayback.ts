/**
 * Lightweight single-pitch piano playback used by drill UIs outside
 * the ear-training AudioCard. Lazy-loads Tone.js + the Salamander
 * piano samples on first call, then reuses the sampler. Idempotent —
 * safe to call before the audio context is resumed (the call will
 * attempt `Tone.start()` each time, which is a no-op after the first
 * user gesture).
 */

// Module-local sampler state. We allow a second sampler alongside the
// one in AudioCard; they share sample URLs so the browser cache avoids
// double-downloading.
let sharedSampler: any = null
let sharedTone: any = null
let samplerLoaded = false
let samplerLoading = false
const loadCallbacks: Array<() => void> = []

async function ensureSampler(): Promise<void> {
  if (samplerLoaded) return
  if (samplerLoading) return new Promise(resolve => loadCallbacks.push(resolve))
  samplerLoading = true
  const Tone = await import('tone')
  sharedTone = Tone
  return new Promise(resolve => {
    sharedSampler = new Tone.Sampler({
      urls: {
        C4: 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        A4: 'A4.mp3',
        C5: 'C5.mp3',
        'D#5': 'Ds5.mp3',
        'F#5': 'Fs5.mp3',
        A5: 'A5.mp3',
        C3: 'C3.mp3',
        'D#3': 'Ds3.mp3',
        'F#3': 'Fs3.mp3',
        A3: 'A3.mp3',
      },
      release: 1,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => {
        samplerLoaded = true
        samplerLoading = false
        loadCallbacks.forEach(cb => cb())
        loadCallbacks.length = 0
        resolve()
      },
    }).toDestination()
  })
}

/**
 * Play a single pitch (e.g. "C4", "F#5", "Bb3") for ~1 second.
 * Resolves immediately; playback happens asynchronously.
 */
export async function playPitch(pitch: string): Promise<void> {
  try {
    await ensureSampler()
    if (!sharedSampler || !sharedTone) return
    const Tone = sharedTone
    // Resume the audio context if it's still suspended — modern
    // browsers need a user gesture; this is expected to run from one.
    if (Tone.getContext && Tone.getContext().state !== 'running') {
      await Tone.start()
    } else if (Tone.start) {
      await Tone.start()
    }
    // Normalise flats → sharps for the sampler's key names.
    const normalised = normalisePitch(pitch)
    sharedSampler.triggerAttackRelease(normalised, '1n')
  } catch {
    // Audio failures are non-fatal for the drill.
  }
}

/**
 * "Bb4" → "A#4", "Eb3" → "D#3" — Tone's Sampler keys are sharp-only.
 * Any pitch that's already sharp or natural is returned unchanged.
 */
function normalisePitch(p: string): string {
  const m = p.match(/^([A-G])(b|#|)(\d+)$/)
  if (!m) return p
  const [, letter, accidental, octave] = m
  if (accidental !== 'b') return p
  const flatMap: Record<string, [string, number]> = {
    C: ['B', -1],
    D: ['C#', 0],
    E: ['D#', 0],
    F: ['E', 0],
    G: ['F#', 0],
    A: ['G#', 0],
    B: ['A#', 0],
  }
  const [newLetter, octaveDelta] = flatMap[letter] ?? [letter, 0]
  return `${newLetter}${parseInt(octave, 10) + octaveDelta}`
}
