// Ported from https://github.com/apankrat/note-detector (BSD-2-Clause)

const OnePi  = 1 * Math.PI
const TwoPi  = 2 * Math.PI
const FourPi = 4 * Math.PI

function sinc(x: number) { return x ? Math.sin(OnePi * x) / (OnePi * x) : 1 }

type TaperFn = ((x: number) => number) | null

const tapers: Record<string, TaperFn> = {
  raw:      null,
  hann:     (x) => 1/2   - 1/2   * Math.cos(TwoPi * x),
  hamming:  (x) => 25/46 - 21/46 * Math.cos(TwoPi * x),
  blackman: (x) => 0.42  - 0.50  * Math.cos(TwoPi * x) + 0.08 * Math.cos(FourPi * x),
  lanczos:  (x) => sinc(2 * x - 1),
}

function applyWindow(arr: Float32Array, out: Float32Array, func: TaperFn) {
  if (arr.length !== out.length) throw new Error('Wrong in/out lengths')
  if (!func) { for (let i = 0; i < arr.length; i++) out[i] = arr[i] }
  else        { for (let i = 0; i < arr.length; i++) out[i] = arr[i] * func(i / (arr.length - 1)) }
}

function getVolume(buf: Float32Array) {
  let sum = 0
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  return Math.sqrt(sum / buf.length)
}

function getQuadraticPeak(data: Float32Array, pos: number) {
  if (pos === 0 || pos === data.length - 1 || data.length < 3) return { x: pos, y: data[pos] }
  const A = data[pos - 1], B = data[pos], C = data[pos + 1], D = A - 2 * B + C
  return { x: pos - (C - A) / (2 * D), y: B - (C - A) * (C - A) / (8 * D) }
}

function findPeaks(data: Float32Array, threshold: number) {
  const peaks: number[] = []
  let pos = 0
  while (pos < data.length && data[pos] > 0) pos++
  while (pos < data.length && data[pos] <= 0) pos++
  while (pos < data.length) {
    let pos_max = -1
    while (pos < data.length && data[pos] > 0) {
      if (pos_max < 0 || data[pos] > data[pos_max]) pos_max = pos
      pos++
    }
    if (pos_max !== -1 && data[pos_max] >= threshold) peaks.push(pos_max)
    while (pos < data.length && data[pos] <= 0) pos++
  }
  return peaks
}

function findMcLeodPeak(data: Float32Array, threshold: number, cutoff: number) {
  const peaks_x = findPeaks(data, threshold)
  if (!peaks_x.length) return -1
  const peaks_q = peaks_x.map(p => getQuadraticPeak(data, p))
  const peak_max = Math.max(...peaks_q.map(p => p.y))
  const cutoff_val = peak_max * cutoff
  const i = peaks_q.findIndex(p => p.y >= cutoff_val)
  return i >= 0 ? peaks_q[i].x : -1
}

class Detector_yin {
  threshold = 0.20
  sampleRate: number
  tmp: Float32Array
  constructor(dataSize: number, sampleRate: number) {
    this.sampleRate = sampleRate
    this.tmp = new Float32Array(dataSize / 2)
  }
  process(buf: Float32Array) {
    const yin = this.tmp
    let sum = 0, peak_pos = -1, min_pos = 0
    yin[0] = 1.0
    for (let tau = 1; tau < yin.length; tau++) {
      yin[tau] = 0
      for (let j = 0; j < yin.length; j++) {
        const diff = buf[j] - buf[j + tau]
        yin[tau] += diff * diff
      }
      sum += yin[tau]
      yin[tau] = sum ? yin[tau] * tau / sum : 1
      if (yin[tau] < yin[min_pos]) min_pos = tau
      const period = tau - 3
      if (tau > 4 && yin[period] < this.threshold && yin[period] < yin[period + 1]) {
        peak_pos = period; break
      }
    }
    if (peak_pos === -1) {
      peak_pos = min_pos
      if (yin[peak_pos] >= this.threshold) return -1
    }
    const t0 = getQuadraticPeak(yin, peak_pos).x
    return t0 ? this.sampleRate / t0 : -1
  }
}

class Detector_mpm {
  peak_ignore = 0.25
  peak_cutoff = 0.93
  pitch_min = 150
  sampleRate: number
  tmp: Float32Array
  constructor(dataSize: number, sampleRate: number) {
    this.sampleRate = sampleRate
    this.tmp = new Float32Array(dataSize)
  }
  process(buf: Float32Array) {
    const nsdf = this.tmp
    nsdf.fill(0)
    for (let tau = 0; tau < buf.length / 2; tau++) {
      let acf = 0, div = 0
      for (let i = 0; i + tau < buf.length; i++) {
        acf += buf[i] * buf[i + tau]
        div += buf[i] * buf[i] + buf[i + tau] * buf[i + tau]
      }
      nsdf[tau] = div ? 2 * acf / div : 0
    }
    const peak = findMcLeodPeak(nsdf, this.peak_ignore, this.peak_cutoff)
    const hz = peak > 0 ? this.sampleRate / peak : -1
    return hz < this.pitch_min ? -1 : hz
  }
}

class Detector_acx {
  volume_min = 0.12
  peak_ignore = 0.00
  peak_cutoff = 0.93
  sampleRate: number
  tmp: Float32Array
  constructor(dataSize: number, sampleRate: number) {
    this.sampleRate = sampleRate
    this.tmp = new Float32Array(dataSize)
  }
  process(buf: Float32Array) {
    const acfv = this.tmp
    acfv.fill(0)
    for (let tau = 0; tau < buf.length / 2; tau++) {
      let acf = 0
      const div = buf.length - tau
      for (let i = 0; i + tau < buf.length; i++) acf += buf[i] * buf[i + tau]
      acfv[tau] = acf / div
      if (tau === 0 && Math.sqrt(acfv[0]) < this.volume_min) return -1
    }
    const peak = findMcLeodPeak(acfv, this.peak_ignore, this.peak_cutoff)
    return peak > 0 ? this.sampleRate / peak : -1
  }
}

export interface DetectedNote {
  freq: number
  stable: boolean
  name: string
  pitchClass: string
}

export class NoteDetector {
  private conf = {
    close_threshold:     0.05,
    track_lone_ms:       120,
    track_cons_ms:       80,
    detrack_min_volume:  0.12,
    detrack_est_none_ms: 500,
    detrack_est_some_ms: 250,
    stable_note_ms:      120,
  }
  private taper: TaperFn
  private candidate: { freq: number; lone: boolean; start: number } | null = null
  private tracking: { freq: number; start: number; missed: number } | null = null
  private detectors: [Detector_acx, Detector_yin, Detector_mpm]
  private buf: Float32Array
  private est: Float32Array

  constructor(dataSize: number, sampleRate: number, windowType = 'hann') {
    this.taper = tapers[windowType]
    this.detectors = [
      new Detector_acx(dataSize, sampleRate),
      new Detector_yin(dataSize, sampleRate),
      new Detector_mpm(dataSize, sampleRate),
    ]
    this.buf = new Float32Array(dataSize)
    this.est = new Float32Array(this.detectors.length)
  }

  update(data: Float32Array) {
    applyWindow(data, this.buf, this.taper)
    const est = this.est
    for (let i = 0; i < this.detectors.length; i++) est[i] = this.detectors[i].process(this.buf)
    const res = this.getConsensus_(est)
    const freq = res.cons <= 0 ? res.lone : res.cons
    const lone = res.cons <= 0
    if (this.tracking) {
      if (this.isClose_(this.tracking.freq, freq)) return
      for (let i = 0; i < est.length; i++) {
        if (this.isClose_(est[i], this.tracking.freq)) { this.tracking.missed = 0; return }
      }
      const vol = getVolume(data)
      if (vol >= this.conf.detrack_min_volume) {
        if (!this.tracking.missed) { this.tracking.missed = performance.now(); return }
        const ms = performance.now() - this.tracking.missed
        if ((res.lone !== 0 && ms < this.conf.detrack_est_some_ms) ||
            (res.lone === 0 && ms < this.conf.detrack_est_none_ms)) return
      }
      this.stopTracking_()
    }
    if (!this.tracking) {
      if (res.cons <= 0 && res.lone <= 0) { this.candidate = null; return }
      if (!this.candidate || !this.isClose_(this.candidate.freq, freq)) {
        this.candidate = { freq, lone, start: performance.now() }; return
      }
      this.candidate.freq = (this.candidate.freq + freq) / 2
      this.candidate.lone = lone
      const ms = performance.now() - this.candidate.start
      if (ms > this.conf.track_cons_ms && !this.candidate.lone) {
        this.startTracking_(this.candidate.freq, this.candidate.start); return
      }
      if (ms > this.conf.track_lone_ms && this.candidate.lone) {
        this.startTracking_(this.candidate.freq, this.candidate.start); return
      }
    }
  }

  reset() {
    this.candidate = null
    this.tracking = null
  }

  getNote(): DetectedNote | null {
    if (!this.tracking) return null
    const ms = performance.now() - this.tracking.start
    const name = hzToNoteString(this.tracking.freq)
    const pitchClass = name.replace(/\d+$/, '').trim()
    return { freq: this.tracking.freq, stable: ms >= this.conf.stable_note_ms, name, pitchClass }
  }

  private isClose_(a: number, b: number) {
    return Math.abs(a - b) < Math.abs(a + b) * 0.5 * this.conf.close_threshold
  }

  private getConsensus_(est: Float32Array) {
    const res = { cons: 0, lone: 0 }
    let num = 0
    for (let i = 0; i + 1 < est.length; i++) {
      if (est[i] <= 0) continue
      if (res.lone === 0) res.lone = est[i]; else res.lone = -1
      for (let j = i + 1; i + j < est.length; j++) {
        if (est[j] <= 0) continue
        if (this.isClose_(est[i], est[j])) { res.cons += (est[i] + est[j]) / 2; num++ }
      }
    }
    if (num) res.cons /= num
    return res
  }

  private startTracking_(hz: number, start: number) {
    this.candidate = null
    this.tracking = { freq: hz, start, missed: 0 }
    this.detectors[1].threshold   *= 2
    this.detectors[2].peak_ignore /= 2
  }

  private stopTracking_() {
    this.tracking = null
    this.detectors[1].threshold   /= 2
    this.detectors[2].peak_ignore *= 2
  }
}

export function hzToNote(freq: number) {
  return Math.round(12 * (Math.log(freq / 440) / Math.log(2))) + 49
}

export function hzToNoteString(freq: number) {
  const note = hzToNote(freq)
  const names = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#']
  const letter = names[(note + 11) % names.length]
  const octave = Math.floor((note - 40) / names.length) + 4
  return letter + octave
}

export function noteToPitchClass(noteName: string) {
  return noteName.replace(/\d+$/, '').trim()
}
