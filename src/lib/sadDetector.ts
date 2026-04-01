// ── SAD Pitch Detector (Note Rush algorithm port) ────────────────────────
// Based on "Realtime C# Pitch Tracker" by javiernieto (Ms-PL)
// Two-band IIR split + Sum of Absolute Differences + Hermite interpolation
// + octave rate limiter + level gate

// ── IIR Filter (Butterworth 2-pole) ──────────────────────────────────────
class IIRFilter {
  private b0: number; private b1: number; private b2: number
  private a1: number; private a2: number
  private x1 = 0; private x2 = 0
  private y1 = 0; private y2 = 0

  constructor(b0: number, b1: number, b2: number, a1: number, a2: number) {
    this.b0 = b0; this.b1 = b1; this.b2 = b2
    this.a1 = a1; this.a2 = a2
  }

  process(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2
              - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1; this.x1 = x
    this.y2 = this.y1; this.y1 = y
    return y
  }

  reset() { this.x1 = this.x2 = this.y1 = this.y2 = 0 }
}

// Build Butterworth lowpass coefficients
function butterworthLowpass(cutoff: number, sampleRate: number): IIRFilter {
  const w = Math.tan(Math.PI * cutoff / sampleRate)
  const w2 = w * w
  const n = 1 / (1 + Math.SQRT2 * w + w2)
  return new IIRFilter(w2 * n, 2 * w2 * n, w2 * n, 2 * (w2 - 1) * n, (1 - Math.SQRT2 * w + w2) * n)
}

// Build Butterworth highpass coefficients
function butterworthHighpass(cutoff: number, sampleRate: number): IIRFilter {
  const w = Math.tan(Math.PI * cutoff / sampleRate)
  const w2 = w * w
  const n = 1 / (1 + Math.SQRT2 * w + w2)
  return new IIRFilter(n, -2 * n, n, 2 * (w2 - 1) * n, (1 - Math.SQRT2 * w + w2) * n)
}

// ── Hermite interpolation ─────────────────────────────────────────────────
function hermiteInterp(x: number, y0: number, y1: number, y2: number, y3: number): number {
  const c0 = y1
  const c1 = 0.5 * (y2 - y0)
  const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3
  const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2)
  return ((c3 * x + c2) * x + c1) * x + c0
}

// ── SAD pitch detection on a buffer ──────────────────────────────────────
function detectSAD(buf: Float32Array, sampleRate: number, minHz: number, maxHz: number): number {
  const minPeriod = Math.floor(sampleRate / maxHz)
  const maxPeriod = Math.ceil(sampleRate / minHz)
  const n = buf.length

  if (maxPeriod > n / 2) return -1

  let bestPeriod = -1
  let bestSAD = Infinity

  // Coarse scan
  for (let period = minPeriod; period <= maxPeriod; period++) {
    let sad = 0
    const limit = n - period
    for (let i = 0; i < limit; i++) {
      sad += Math.abs(buf[i] - buf[i + period])
    }
    sad /= limit
    if (sad < bestSAD) {
      bestSAD = sad
      bestPeriod = period
    }
  }

  if (bestPeriod < 1) return -1

  // Fine scan with Hermite interpolation around best period
  const p0 = Math.max(minPeriod, bestPeriod - 1)
  const p1 = bestPeriod
  const p2 = Math.min(maxPeriod, bestPeriod + 1)

  function sadAt(period: number): number {
    let s = 0
    const limit = n - period
    for (let i = 0; i < limit; i++) s += Math.abs(buf[i] - buf[i + period])
    return s / limit
  }

  const s0 = sadAt(p0), s1 = sadAt(p1), s2 = sadAt(p2)
  // Parabolic interpolation for sub-sample accuracy
  const denom = s0 - 2 * s1 + s2
  let fracPeriod = bestPeriod
  if (Math.abs(denom) > 1e-10) {
    fracPeriod = bestPeriod - 0.5 * (s2 - s0) / denom
  }

  return sampleRate / fracPeriod
}

// ── Level gate ────────────────────────────────────────────────────────────
function rmsLevel(buf: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  return Math.sqrt(sum / buf.length)
}

// ── Main SAD Pitch Detector ───────────────────────────────────────────────
export interface SADConfig {
  windowSize?: number
  stableThreshold?: number
  levelThreshold?: number
  crossover?: number
}

export interface SADResult {
  freq: number
  midi: number
  stable: boolean
  name: string
}

export class SADPitchDetector {
  private sampleRate: number
  private lpFilter: IIRFilter   // lowpass for bass band
  private hpFilter: IIRFilter   // highpass for treble band
  private loBuf: Float32Array
  private hiBuf: Float32Array
  private bufPos = 0
  private readonly bufSize: number
  private crossover = 400  // Hz split point (~G4)

  private lastMidi = -1
  private lastMidiTime = 0
  private readonly maxOctaveRate = 10  // max octave jumps per second
  private stableCount = 0
  private stableThreshold = 6  // frames needed to confirm
  // Sliding window of recent detections
  private windowSize = 8
  private detectionWindow: number[] = []  // last N midi detections

  private levelThreshold = 0.008

  constructor(sampleRate: number, config?: SADConfig) {
    this.sampleRate = sampleRate
    if (config?.crossover != null) this.crossover = config.crossover
    if (config?.levelThreshold != null) this.levelThreshold = config.levelThreshold
    if (config?.windowSize != null) this.windowSize = config.windowSize
    if (config?.stableThreshold != null) this.stableThreshold = config.stableThreshold
    this.bufSize = Math.ceil(sampleRate / 27.5) * 3
    this.loBuf = new Float32Array(this.bufSize)
    this.hiBuf = new Float32Array(this.bufSize)
    this.lpFilter = butterworthLowpass(this.crossover, sampleRate)
    this.hpFilter = butterworthHighpass(this.crossover, sampleRate)
  }

  update(input: Float32Array): SADResult | null {
    // Check level gate
    if (rmsLevel(input) < this.levelThreshold) {
      this.stableCount = 0
      return null
    }

    // Fill circular buffers with filtered signals
    for (let i = 0; i < input.length; i++) {
      const s = input[i]
      this.loBuf[this.bufPos % this.bufSize] = this.lpFilter.process(s)
      this.hiBuf[this.bufPos % this.bufSize] = this.hpFilter.process(s)
      this.bufPos++
    }

    if (this.bufPos < this.bufSize) return null

    // Build linear buffers from circular
    const pos = this.bufPos % this.bufSize
    const lo = new Float32Array(this.bufSize)
    const hi = new Float32Array(this.bufSize)
    for (let i = 0; i < this.bufSize; i++) {
      lo[i] = this.loBuf[(pos + i) % this.bufSize]
      hi[i] = this.hiBuf[(pos + i) % this.bufSize]
    }

    // Detect in each band
    const loHz = detectSAD(lo, this.sampleRate, 27.5, this.crossover)
    const rawHiHz = detectSAD(hi, this.sampleRate, this.crossover, 4186)
    const hiHz = rawHiHz > 0 && rawHiHz <= 4186 ? rawHiHz : -1

    // Choose best result
    let hz = -1
    if (loHz > 0 && hiHz > 0) {
      // Both detected — prefer whichever has more energy in its band
      const loRms = rmsLevel(lo)
      const hiRms = rmsLevel(hi)
      hz = loRms > hiRms ? loHz : hiHz
    } else if (loHz > 0) {
      hz = loHz
    } else if (hiHz > 0) {
      hz = hiHz
    }

    if (hz < 0) { this.stableCount = 0; return null }

    // Convert to MIDI
    const midi = Math.round(69 + 12 * Math.log2(hz / 440))
    if (midi < 21 || midi > 108) { this.stableCount = 0; return null }

    // Octave rate limiter
    const now = performance.now()
    if (this.lastMidi >= 0) {
      const octaveJump = Math.abs(midi - this.lastMidi) / 12
      const elapsed = (now - this.lastMidiTime) / 1000
      if (octaveJump >= 1 && elapsed < 1 / this.maxOctaveRate) {
        // Too fast an octave jump — reject
        this.stableCount = 0
        return null
      }
    }

    // Sliding window stability check
    this.detectionWindow.push(midi)
    if (this.detectionWindow.length > this.windowSize) {
      this.detectionWindow.shift()
    }

    // Count how many of the last N frames agree on this midi note
    const agreementCount = this.detectionWindow.filter(m => m === midi).length
    const stable = agreementCount >= this.stableThreshold &&
                   this.detectionWindow.length >= this.windowSize

    this.lastMidi = midi
    this.lastMidiTime = now
    const name = midiToName(midi)

    return { freq: hz, midi, stable, name }
  }

  reset() {
    this.loBuf.fill(0)
    this.hiBuf.fill(0)
    this.bufPos = 0
    this.lastMidi = -1
    this.lastMidiTime = 0
    this.stableCount = 0
    this.detectionWindow = []
    this.lpFilter.reset()
    this.hpFilter.reset()
  }
}

// ── MIDI to note name ─────────────────────────────────────────────────────
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

export function midiToName(midi: number): string {
  const pc = midi % 12
  const octave = Math.floor(midi / 12) - 1
  return NOTE_NAMES[pc] + octave
}
