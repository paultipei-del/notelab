'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/toolsCatalog'
import {
  isSubdivisionId,
  SUBDIVISION_RATE,
  SUBDIVISIONS_PER_DOWNBEAT,
  type SubdivisionId,
} from '@/lib/metronomeData'
import MetronomeStage from '@/components/metronome/MetronomeStage'
import ReferenceStrip from '@/components/metronome/ReferenceStrip'

const MIN_BPM = 20
const MAX_BPM = 400
const SUBDIVISION_STORAGE_KEY = 'notelab-metronome-subdivision'
const clampBpm = (n: number) => Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(n)))

export default function MetronomePage() {
  const [bpm, setBpmState] = useState(120)
  const [playing, setPlaying] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [tapFlash, setTapFlash] = useState(false)
  const [subdivision, setSubdivisionState] = useState<SubdivisionId>('quarter')

  const audioCtxRef = useRef<AudioContext | null>(null)
  const nextNoteRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm

  // Live refs so the audio scheduler (created in a stable closure)
  // always reads the most recent values without a re-render restarting
  // setInterval.
  const subdivisionRef = useRef(subdivision)
  subdivisionRef.current = subdivision
  // Counts clicks since the last downbeat. Reset to 0 whenever the
  // subdivision changes so the next click is an accented downbeat.
  const subdivisionTickRef = useRef(0)

  const tapTimesRef = useRef<number[]>([])
  const tapResetRef = useRef<number | null>(null)

  const setBpm = useCallback((n: number) => {
    setBpmState(clampBpm(n))
  }, [])

  // ── audio ──
  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctor =
        (window.AudioContext as typeof AudioContext) ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      audioCtxRef.current = new Ctor()
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
  }, [])

  const click = useCallback((time: number, accent: boolean) => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    // Downbeats fire at 0.4; subdivision ticks at 0.2 so the listener
    // can hear the beat structure within a subdivided pattern.
    const peak = accent ? 0.4 : 0.2
    osc.frequency.setValueAtTime(1000, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
    osc.connect(gain).connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.06)

    // Beat-synced pulse — fires from the audio scheduler clock so it
    // never drifts relative to the audible click. Fires on every
    // click (including subdivision ticks).
    const delay = Math.max(0, (time - ctx.currentTime) * 1000)
    window.setTimeout(() => {
      setPulse(true)
      window.setTimeout(() => setPulse(false), 90)
    }, delay)
  }, [])

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const sub = subdivisionRef.current
    const rate = SUBDIVISION_RATE[sub] || 1
    const perDownbeat = SUBDIVISIONS_PER_DOWNBEAT[sub] || 1
    const interval = 60.0 / bpmRef.current / rate
    while (nextNoteRef.current < ctx.currentTime + 0.1) {
      const accent = subdivisionTickRef.current === 0
      click(nextNoteRef.current, accent)
      subdivisionTickRef.current =
        (subdivisionTickRef.current + 1) % perDownbeat
      nextNoteRef.current += interval
    }
  }, [click])

  const start = useCallback(() => {
    ensureAudio()
    const ctx = audioCtxRef.current!
    nextNoteRef.current = ctx.currentTime + 0.05
    // Each start fires a downbeat first.
    subdivisionTickRef.current = 0
    timerRef.current = window.setInterval(scheduler, 25)
    setPlaying(true)
  }, [ensureAudio, scheduler])

  /** Updates subdivision + resets the tick counter so the next
   *  audible click is an accented downbeat, then writes to
   *  localStorage. */
  const setSubdivision = useCallback((id: SubdivisionId) => {
    subdivisionTickRef.current = 0
    setSubdivisionState(id)
    try {
      window.localStorage.setItem(SUBDIVISION_STORAGE_KEY, id)
    } catch {
      // ignore quota / privacy errors
    }
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setPlaying(false)
    setPulse(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (playing) stop()
    else start()
  }, [playing, start, stop])

  useEffect(() => {
    if (!playing) return
    if (audioCtxRef.current) {
      nextNoteRef.current = audioCtxRef.current.currentTime + 0.05
    }
  }, [bpm, playing])

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
    },
    [],
  )

  // ──────────────────────────────────────────────────────────────────
  // localStorage persistence — feeds the /tools dashboard gauge.
  // Reads the last-known BPM on mount; writes (debounced 300ms) on
  // every change. Do not remove without also removing the gauge
  // readout in DashboardStrip.tsx.
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEYS.metronomeBpm)
      if (!saved) return
      const n = parseInt(saved, 10)
      if (!Number.isNaN(n)) setBpmState(clampBpm(n))
    } catch {
      // localStorage unavailable — ignore.
    }
  }, [])

  // Subdivision persistence. Validated on read — anything that isn't
  // a known SubdivisionId falls back to 'quarter' rather than crashing.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SUBDIVISION_STORAGE_KEY)
      if (saved && isSubdivisionId(saved)) setSubdivisionState(saved)
    } catch {
      // ignore
    }
  }, [])
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEYS.metronomeBpm, String(bpm))
      } catch {
        // ignore quota / privacy errors
      }
    }, 300)
    return () => window.clearTimeout(t)
  }, [bpm])

  // ── tap tempo ──
  const tap = useCallback(() => {
    const now = performance.now()
    let times = [...tapTimesRef.current, now].filter(t => now - t < 3000)
    if (times.length > 6) times = times.slice(-6)
    tapTimesRef.current = times

    if (tapResetRef.current) window.clearTimeout(tapResetRef.current)
    tapResetRef.current = window.setTimeout(() => {
      tapTimesRef.current = []
    }, 2000)

    if (times.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < times.length; i++) intervals.push(times[i] - times[i - 1])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const newBpm = Math.round(60000 / avg)
      if (newBpm >= MIN_BPM && newBpm <= MAX_BPM) setBpm(newBpm)
    }

    setTapFlash(true)
    window.setTimeout(() => setTapFlash(false), 100)
  }, [setBpm])

  // ── keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target?.tagName === 'INPUT' || target?.isContentEditable) return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault()
        tap()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault()
        setBpm(bpmRef.current + 1)
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault()
        setBpm(bpmRef.current - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, tap, setBpm])

  return (
    <div className="nl-met-page">
      <MetronomeStage
        bpm={bpm}
        playing={playing}
        pulse={pulse}
        tapFlash={tapFlash}
        minBpm={MIN_BPM}
        maxBpm={MAX_BPM}
        onSetBpm={setBpm}
        onTogglePlay={togglePlay}
        onTap={tap}
      />
      <ReferenceStrip
        bpm={bpm}
        subdivision={subdivision}
        onSubdivisionChange={setSubdivision}
      />
    </div>
  )
}
