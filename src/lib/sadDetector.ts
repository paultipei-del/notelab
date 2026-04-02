// ── SAD Pitch Detector — Note Rush architecture port ─────────────────────
// Implements the exact two-buffer, two-pass, sliding-window-vote system
// confirmed from Note Rush Assembly-CSharp + PitchDetector.dll source.
//
// Architecture:
//   1. Two circular buffers: bufA (100ms) and bufB (105ms)
//   2. Each frame: run SAD on both buffers independently
//   3. Two-pass agreement: if both agree within 0.25 semitones → use result
//   4. Sliding window vote: 15 out of 30 frames must agree → stable
//   5. Peak amplitude gate: any sample >= 0.01 triggers detection
//   6. Two IIR bands: lo (HP45→LP280Hz) and hi (HP45→LP1500Hz)
//      Both bands detected; result chosen by band energy
// ─────────────────────────────────────────────────────────────────────────

// ── IIR Filter (Butterworth 2-pole) ──────────────────────────────────────
class IIRFilter {
  private b0: number; private b1: number; private b2: number
  private a1: number; private a2: number
  private x1 = 0; private x2 = 0; private y1 = 0; private y2 = 0

  constructor(b0: number, b1: number, b2: number, a1: number, a2: number) {
    this.b0 = b0; this.b1 = b1; this.b2 = b2
    this.a1 = a1; this.a2 = a2
  }

  process(x: number): number {
    const y = this.b0*x + this.b1*this.x1 + this.b2*this.x2
              - this.a1*this.y1 - this.a2*this.y2
    this.x2 = this.x1; this.x1 = x
    this.y2 = this.y1; this.y1 = y
    return y
  }

  reset() { this.x1 = this.x2 = this.y1 = this.y2 = 0 }

  clone(): IIRFilter {
    return new IIRFilter(this.b0, this.b1, this.b2, this.a1, this.a2)
  }
}

function butterworthLP(cutoff: number, sr: number): IIRFilter {
  const w = Math.tan(Math.PI * cutoff / sr), w2 = w * w
  const n = 1 / (1 + Math.SQRT2 * w + w2)
  return new IIRFilter(w2*n, 2*w2*n, w2*n, 2*(w2-1)*n, (1-Math.SQRT2*w+w2)*n)
}

function butterworthHP(cutoff: number, sr: number): IIRFilter {
  const w = Math.tan(Math.PI * cutoff / sr), w2 = w * w
  const n = 1 / (1 + Math.SQRT2 * w + w2)
  return new IIRFilter(n, -2*n, n, 2*(w2-1)*n, (1-Math.SQRT2*w+w2)*n)
}

// ── SAD pitch detection on a linear buffer ────────────────────────────────
function detectSAD(buf: Float32Array, sr: number, minHz: number, maxHz: number): number {
  const minPeriod = Math.floor(sr / maxHz)
  const maxPeriod = Math.ceil(sr / minHz)
  const n = buf.length
  if (maxPeriod >= n / 2) return -1

  let bestPeriod = -1, bestSAD = Infinity

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let sad = 0
    const limit = n - period
    for (let i = 0; i < limit; i++) sad += Math.abs(buf[i] - buf[i + period])
    sad /= limit
    if (sad < bestSAD) { bestSAD = sad; bestPeriod = period }
  }

  if (bestPeriod < 1) return -1

  // Parabolic interpolation for sub-sample accuracy
  function sadAt(p: number): number {
    let s = 0; const lim = n - p
    for (let i = 0; i < lim; i++) s += Math.abs(buf[i] - buf[i + p])
    return s / lim
  }
  const p0 = Math.max(minPeriod, bestPeriod - 1)
  const p2 = Math.min(maxPeriod, bestPeriod + 1)
  const s0 = sadAt(p0), s1 = bestSAD, s2 = sadAt(p2)
  const denom = s0 - 2*s1 + s2
  const frac = Math.abs(denom) > 1e-10
    ? bestPeriod - 0.5*(s2 - s0) / denom
    : bestPeriod

  return sr / frac
}

// ── Circular buffer → linear buffer ──────────────────────────────────────
function circToLinear(circ: Float32Array, pos: number, size: number): Float32Array {
  const out = new Float32Array(size)
  for (let i = 0; i < size; i++) out[i] = circ[(pos + i) % size]
  return out
}

// ── Hz → MIDI (precise, float) ────────────────────────────────────────────
function hzToMidiPrecise(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440)
}

// ── Peak amplitude gate ───────────────────────────────────────────────────
function peakAmplitude(buf: Float32Array): number {
  let peak = 0
  for (let i = 0; i < buf.length; i++) {
    const a = Math.abs(buf[i])
    if (a > peak) peak = a
  }
  return peak
}

// ── RMS ───────────────────────────────────────────────────────────────────
function rms(buf: Float32Array): number {
  let s = 0
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
  return Math.sqrt(s / buf.length)
}

// ── Exports ───────────────────────────────────────────────────────────────
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

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
export function midiToName(midi: number): string {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1)
}

// ── Two-band filter state ─────────────────────────────────────────────────
interface BandFilters {
  loLP: IIRFilter; loHP: IIRFilter
  hiLP: IIRFilter; hiHP: IIRFilter
}

function makeBandFilters(sr: number): BandFilters {
  return {
    loLP: butterworthLP(280, sr),  // lo band: HP45 → LP280
    loHP: butterworthHP(45, sr),
    hiLP: butterworthLP(1500, sr), // hi band: HP45 → LP1500
    hiHP: butterworthHP(45, sr),
  }
}

// ── Main detector ─────────────────────────────────────────────────────────
export class SADPitchDetector {
  private sr: number

  // Confirmed buffer sizes: 100ms and 105ms
  private readonly sizeA: number  // floor(sr * 0.100)
  private readonly sizeB: number  // floor(sr * 0.105)

  // Two circular buffers per band (lo + hi), per window (A + B)
  private loA: Float32Array; private hiA: Float32Array
  private loB: Float32Array; private hiB: Float32Array
  private posA = 0; private posB = 0

  // Separate filter chains for A and B buffers (state must be independent)
  private filtersA: BandFilters
  private filtersB: BandFilters

  // Sliding window vote: 15/30 confirmed from Note Rush source
  private windowSize: number      // max frames in sliding window
  private stableThreshold: number  // points needed to confirm (not frames)
  private detectionWindow: number[] = []
  private detectionPointsWindow: number[] = []

  // Level gate: peak amplitude >= 0.01 (confirmed)
  private levelThreshold: number

  // State
  private freshReset = true
  private fillCountdown = 0  // chunks remaining before buffers are fresh
  private warmupFrames = 0
  private lastMidi = -1
  private lastMidiTime = 0
  private readonly maxOctaveRate = 10

  constructor(sampleRate: number, config?: SADConfig) {
    this.sr = sampleRate
    this.sizeA = Math.floor(sampleRate * 0.100)  // 4410 @ 44100
    this.sizeB = Math.floor(sampleRate * 0.105)  // 4630 @ 44100
    this.windowSize = config?.windowSize ?? 10
    this.stableThreshold = config?.stableThreshold ?? 15
    this.levelThreshold = config?.levelThreshold ?? 0.01

    this.loA = new Float32Array(this.sizeA); this.hiA = new Float32Array(this.sizeA)
    this.loB = new Float32Array(this.sizeB); this.hiB = new Float32Array(this.sizeB)
    this.filtersA = makeBandFilters(sampleRate)
    this.filtersB = makeBandFilters(sampleRate)
  }

  update(input: Float32Array): SADResult | null {
    // Warmup after reset
    if (this.warmupFrames > 0) { this.warmupFrames--; return null }

    // After clearVotes: still fill buffers but don't detect until fresh
    if (this.fillCountdown > 0) {
      this.fillCountdown--
      // Still process audio through filters to keep filter state warm
      for (let i = 0; i < input.length; i++) {
        const s = input[i]
        this.loA[this.posA % this.sizeA] = this.filtersA.loLP.process(this.filtersA.loHP.process(s))
        this.hiA[this.posA % this.sizeA] = this.filtersA.hiLP.process(this.filtersA.hiHP.process(s))
        this.loB[this.posB % this.sizeB] = this.filtersB.loLP.process(this.filtersB.loHP.process(s))
        this.hiB[this.posB % this.sizeB] = this.filtersB.hiLP.process(this.filtersB.hiHP.process(s))
        this.posA++; this.posB++
      }
      return null
    }

    // Peak amplitude gate
    if (peakAmplitude(input) < this.levelThreshold) {
      return null
    }

    // Fill both circular buffers with filtered audio
    for (let i = 0; i < input.length; i++) {
      const s = input[i]
      const loA = this.filtersA.loLP.process(this.filtersA.loHP.process(s))
      const hiA = this.filtersA.hiLP.process(this.filtersA.hiHP.process(s))
      this.loA[this.posA % this.sizeA] = loA
      this.hiA[this.posA % this.sizeA] = hiA

      const loB = this.filtersB.loLP.process(this.filtersB.loHP.process(s))
      const hiB = this.filtersB.hiLP.process(this.filtersB.hiHP.process(s))
      this.loB[this.posB % this.sizeB] = loB
      this.hiB[this.posB % this.sizeB] = hiB

      this.posA++; this.posB++
    }

    // Wait until buffers are full
    if (this.posA < this.sizeA || this.posB < this.sizeB) return null

    // Build linear buffers
    const loLinA = circToLinear(this.loA, this.posA % this.sizeA, this.sizeA)
    const hiLinA = circToLinear(this.hiA, this.posA % this.sizeA, this.sizeA)
    const loLinB = circToLinear(this.loB, this.posB % this.sizeB, this.sizeB)
    const hiLinB = circToLinear(this.hiB, this.posB % this.sizeB, this.sizeB)

    // Detect pitch in each band for each buffer
    const loHzA = detectSAD(loLinA, this.sr, 50, 280)
    const hiHzA = detectSAD(hiLinA, this.sr, 50, 1600)
    const loHzB = detectSAD(loLinB, this.sr, 50, 280)
    const hiHzB = detectSAD(hiLinB, this.sr, 50, 1600)

    // Choose best per buffer using band energy
    const hzA = this._chooseBand(loHzA, hiHzA, loLinA, hiLinA)
    const hzB = this._chooseBand(loHzB, hiHzB, loLinB, hiLinB)

    // Two-pass agreement: both buffers must agree within 0.25 semitones
    // (confirmed: Mathf.Abs(num5 - num4) > 0.25f is the disagreement threshold)
    let hz = -1
    if (hzA > 0 && hzB > 0) {
      const midiA = hzToMidiPrecise(hzA)
      const midiB = hzToMidiPrecise(hzB)
      if (Math.abs(midiA - midiB) <= 0.25) {
        // Agreement — average both
        hz = (hzA + hzB) / 2
      } else {
        // Disagreement — apply Note Rush priority logic
        // If one is near zero, use the other
        if (hzA < 1 && hzB > 0) hz = hzB
        else if (hzB < 1 && hzA > 0) hz = hzA
        // Otherwise reject — confirmed: "else num8 = num9 (buffer A wins)"
        else hz = hzA
      }
    } else if (hzA > 0) {
      hz = hzA
    } else if (hzB > 0) {
      hz = hzB
    }

    if (hz < 0) return null

    // Convert to MIDI integer
    const midiPrecise = hzToMidiPrecise(hz)
    const midi = Math.round(midiPrecise)
    if (midi < 21 || midi > 108) return null

    // Octave rate limiter (bypass after reset)
    const now = performance.now()
    if (this.lastMidi >= 0 && !this.freshReset) {
      const octaveJump = Math.abs(midi - this.lastMidi) / 12
      const elapsed = (now - this.lastMidiTime) / 1000
      if (octaveJump >= 1 && elapsed < 1 / this.maxOctaveRate) return null
    }
    if (this.freshReset) this.freshReset = false
    this.lastMidi = midi
    this.lastMidiTime = now

      // Weighted vote system (confirmed from Note Rush repetitions() function)
    // Points based on cents deviation from integer MIDI:
    // < 3.6 cents = 10pts, < 6 cents = 7pts, < 12 cents = 5pts, < 24 cents = 2pts, else 1pt
    const midiPreciseLocal = hzToMidiPrecise(hz)
    const centsDev = Math.abs(midiPreciseLocal - midi)  // deviation in semitones
    const points = centsDev < 0.03 ? 10 : centsDev < 0.05 ? 7 : centsDev < 0.1 ? 5 : centsDev < 0.2 ? 2 : 1

    // Push to detection window as [midi, points] pairs
    this.detectionWindow.push(midi)
    this.detectionPointsWindow.push(points)
    if (this.detectionWindow.length > this.windowSize) {
      this.detectionWindow.shift()
      this.detectionPointsWindow.shift()
    }

    // Count weighted points for current midi in window
    let totalPoints = 0
    for (let i = 0; i < this.detectionWindow.length; i++) {
      if (this.detectionWindow[i] === midi) totalPoints += this.detectionPointsWindow[i]
    }
    const stable = totalPoints >= this.stableThreshold

    return { freq: hz, midi, stable, name: midiToName(midi) }
  }

  private _chooseBand(
    loHz: number, hiHz: number,
    loBuf: Float32Array, hiBuf: Float32Array
  ): number {
    if (loHz > 0 && hiHz > 0) {
      return rms(loBuf) >= rms(hiBuf) ? loHz : hiHz
    }
    return loHz > 0 ? loHz : hiHz > 0 ? hiHz : -1
  }
  // ClearDetectionBuffer: zero votes only, keep audio pipeline running
  clearVotes() {
    this.detectionWindow = []
    this.detectionPointsWindow = []
    // Block detections until circular buffers are fully overwritten with fresh audio
    // sizeA = ~4410 samples, chunk = ~4096 samples → need 2 chunks to fully overwrite
    this.fillCountdown = Math.ceil(this.sizeA / 4096) + 1
    this.detectionPointsWindow = []
  }

  reset() {
    this.loA.fill(0); this.hiA.fill(0)
    this.loB.fill(0); this.hiB.fill(0)
    this.posA = 0; this.posB = 0
    this.detectionWindow = []
    this.lastMidi = -1; this.lastMidiTime = 0
    this.freshReset = true
    this.warmupFrames = 20
    this.fillCountdown = 0
    this.filtersA = makeBandFilters(this.sr)
    this.filtersB = makeBandFilters(this.sr)
  }
}
