/**
 * Per-output-device timing offset captured by the rhythm trainer's calibration
 * step. The stored number is a single round-trip in milliseconds — covers
 * audio output latency (DAC, OS mixer, Bluetooth codec), input latency
 * (pointer/touch dispatch), display latency to the visual feedback, and the
 * user's own negative mean asynchrony all in one. We don't try to disentangle
 * components because we can't measure them independently without mic loopback.
 *
 * The trainer's tap-scoring path subtracts `effectiveTapTime = rawTime -
 * offsetSeconds`. A positive offset means the user systematically taps late
 * relative to the click (typical of Bluetooth audio). A negative offset means
 * they tap early (uncommon, usually only when the audio pipeline is
 * over-corrected by `ctx.outputLatency`).
 */

const STORAGE_KEY = 'rhythm-calibration-v1'

interface DeviceCalibration {
  offsetMs: number
  rmseMs: number
  measuredAt: string
  /** Visual lead in ms — how much earlier the JS state change should fire so the rendered pixel arrives with the heard click.
   * Undefined falls back to {@link DEFAULT_VISUAL_LEAD_MS} on read. Tuned per device via VisualCalibrationModal. */
  visualLeadMs?: number
  visualMeasuredAt?: string
}

/** Default countdown / playhead visual lead for devices that haven't been visually calibrated yet. */
export const DEFAULT_VISUAL_LEAD_MS = 50

/** Soft bounds on the slider — wide enough to cover slow panels, TV-as-monitor setups, and other compositor lag. */
export const VISUAL_LEAD_LIMITS = {
  minMs: 0,
  maxMs: 400,
}

interface CalibrationStore {
  [deviceKey: string]: DeviceCalibration
}

/**
 * Build a stable key for the current audio output device. We don't have direct
 * access to the device label without mic permission, so we fingerprint the
 * AudioContext's sample rate plus baseLatency — these typically shift when
 * the user switches between Bluetooth and wired output, between built-in
 * speakers and headphones, etc.
 */
export function getDeviceKey(ctx: AudioContext): string {
  const ex = ctx as AudioContext & { baseLatency?: number }
  const baseLatencyMs = typeof ex.baseLatency === 'number' && Number.isFinite(ex.baseLatency)
    ? Math.round(ex.baseLatency * 1000)
    : 0
  return `sr-${ctx.sampleRate}-bl-${baseLatencyMs}`
}

function readStore(): CalibrationStore {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed as CalibrationStore : {}
  } catch {
    return {}
  }
}

function writeStore(store: CalibrationStore): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // localStorage may be full or disabled; calibration is best-effort.
  }
}

/**
 * Returns the stored offset for a device key in milliseconds, or 0 if no
 * calibration has been run for this device. The trainer treats 0 as "no
 * compensation" — the original behaviour.
 */
export function getStoredOffsetMs(deviceKey: string): number {
  const store = readStore()
  const entry = store[deviceKey]
  return entry ? entry.offsetMs : 0
}

/** Convenience: same as `getStoredOffsetMs` but in seconds (for ctx.currentTime math). */
export function getStoredOffsetSec(deviceKey: string): number {
  return getStoredOffsetMs(deviceKey) / 1000
}

/** True iff calibration has been recorded for this device. */
export function hasCalibration(deviceKey: string): boolean {
  return !!readStore()[deviceKey]
}

export function setCalibration(deviceKey: string, offsetMs: number, rmseMs: number): void {
  const store = readStore()
  const prev = store[deviceKey]
  store[deviceKey] = {
    offsetMs: Math.round(offsetMs * 10) / 10,
    rmseMs: Math.round(rmseMs * 10) / 10,
    measuredAt: new Date().toISOString(),
    // Preserve visual calibration if it was set previously — audio and visual
    // calibrations are independent measurements per device.
    visualLeadMs: prev?.visualLeadMs,
    visualMeasuredAt: prev?.visualMeasuredAt,
  }
  writeStore(store)
}

/** Visual lead in ms for the given device, with sensible default. */
export function getVisualLeadMs(deviceKey: string): number {
  const entry = readStore()[deviceKey]
  return entry?.visualLeadMs ?? DEFAULT_VISUAL_LEAD_MS
}

/** Convenience: visual lead in seconds (for ctx.currentTime math). */
export function getVisualLeadSec(deviceKey: string): number {
  return getVisualLeadMs(deviceKey) / 1000
}

/**
 * Persist a manually-tuned visual lead. The audio calibration record (offsetMs / rmseMs)
 * is preserved if it exists; otherwise a fresh record is created with offsetMs = 0
 * (i.e. no audio calibration assumed) so the visual setting alone is durable.
 */
export function setVisualLead(deviceKey: string, leadMs: number): void {
  const clamped = Math.max(VISUAL_LEAD_LIMITS.minMs, Math.min(VISUAL_LEAD_LIMITS.maxMs, leadMs))
  const store = readStore()
  const prev = store[deviceKey]
  store[deviceKey] = {
    offsetMs: prev?.offsetMs ?? 0,
    rmseMs: prev?.rmseMs ?? 0,
    measuredAt: prev?.measuredAt ?? new Date().toISOString(),
    visualLeadMs: Math.round(clamped),
    visualMeasuredAt: new Date().toISOString(),
  }
  writeStore(store)
}

export function clearCalibration(deviceKey: string): void {
  const store = readStore()
  delete store[deviceKey]
  writeStore(store)
}

/** Trimmed median: drop the lowest and highest `trim` values, return the median of the rest. */
export function trimmedMedian(values: number[], trim: number): number {
  if (values.length === 0) return 0
  if (values.length <= trim * 2) {
    // Not enough samples to trim — fall back to plain median.
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
  }
  const sorted = [...values].sort((a, b) => a - b)
  const trimmed = sorted.slice(trim, sorted.length - trim)
  return trimmed[Math.floor(trimmed.length / 2)]
}

export function rootMeanSquare(values: number[]): number {
  if (values.length === 0) return 0
  const sumSq = values.reduce((s, v) => s + v * v, 0)
  return Math.sqrt(sumSq / values.length)
}

/**
 * Tunable bounds. Anything beyond these is almost certainly user error
 * (started tapping late, dropped a tap, etc.) rather than a real measurement.
 */
export const CALIBRATION_LIMITS = {
  /** Reject results outside this range — likely a botched session. */
  maxAbsOffsetMs: 400,
  /** RMSE above this means the user wasn't consistently tapping; flag for retry. */
  maxRmseMs: 50,
}
