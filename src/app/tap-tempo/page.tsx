'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { STORAGE_KEYS } from '@/lib/toolsCatalog'
import TapTempoStage from '@/components/tap-tempo/TapTempoStage'
import TapTempoRefStrip from '@/components/tap-tempo/TapTempoRefStrip'
import type { TapState } from '@/components/tap-tempo/tapState'

const MAX_TAPS = 16
const RESET_MS = 30_000
const MIN_BPM = 20
const MAX_BPM = 400

/** Solid brick-red disc that fades + scales up on each tap — drum
 *  hit, not pond ripple. Imperative DOM creation keeps each disc's
 *  lifetime independent of React's render cycle; rapid taps stack
 *  their own discs and each self-cleans on its timeout. */
const DISC_DURATION_MS = 400

function spawnDisc(x: number, y: number) {
  if (typeof document === 'undefined') return
  const disc = document.createElement('span')
  disc.className = 'nl-tap-disc'
  disc.setAttribute('aria-hidden', 'true')
  disc.style.left = `${x}px`
  disc.style.top = `${y}px`
  document.body.appendChild(disc)
  window.setTimeout(() => {
    disc.remove()
  }, DISC_DURATION_MS + 50)
}

export default function TapTempoPage() {
  const [taps, setTaps] = useState<number[]>([])
  // Monotonic counter that keys the pulse-dot animation so each tap
  // retriggers it. The tap disc is spawned imperatively (see spawnDisc).
  const [tapCount, setTapCount] = useState(0)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bpmRef = useRef<HTMLSpanElement | null>(null)
  const router = useRouter()

  const recordTap = useCallback(
    (pos: { x: number; y: number } | null) => {
      const now = Date.now()
      setTaps(prev => {
        const next = prev.length >= MAX_TAPS ? prev.slice(1) : prev.slice()
        next.push(now)
        return next
      })
      setTapCount(c => c + 1)
      if (pos) spawnDisc(pos.x, pos.y)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(() => {
        setTaps([])
      }, RESET_MS)
    },
    [],
  )

  const reset = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
    setTaps([])
  }, [])

  // Derived BPM + state machine.
  const state = useMemo<TapState>(() => {
    if (taps.length < 2) return { kind: 'empty' }
    let total = 0
    for (let i = 1; i < taps.length; i++) total += taps[i] - taps[i - 1]
    const avg = total / (taps.length - 1)
    const bpm = Math.round(60_000 / avg)
    if (bpm < MIN_BPM || bpm > MAX_BPM) return { kind: 'empty' }
    const intervals = Math.min(6, taps.length - 1)
    if (intervals >= 6) return { kind: 'stable', bpm, intervals: 6 }
    return { kind: 'partial', bpm, intervals }
  }, [taps])

  const sendToMetronome = useCallback(() => {
    if (state.kind !== 'stable') return
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.metronomeBpm,
        String(state.bpm),
      )
    } catch {
      // ignore privacy / quota errors
    }
    router.push('/metronome')
  }, [router, state])

  // Compute the ring position for keyboard-driven taps — centered on
  // the BPM number element.
  const bpmCenter = useCallback((): { x: number; y: number } | null => {
    const el = bpmRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }, [])

  // Keyboard handler: any non-Tab key fires a tap. Skipped when the
  // user is typing into an INPUT/TEXTAREA (there are none on this
  // page today, but defensive).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Tab') return
      if (e.key === ' ') e.preventDefault()
      recordTap(bpmCenter())
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [recordTap, bpmCenter])

  // Cleanup the idle timer on unmount.
  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    },
    [],
  )

  // Stage-level click: register the tap with the click's viewport
  // coords as the ring center. Clicks on interactive descendants
  // (Reset / Use) stopPropagation, so they never arrive here.
  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    recordTap({ x: e.clientX, y: e.clientY })
  }

  return (
    <div className="nl-tap-page">
      <TapTempoStage
        ref={bpmRef}
        state={state}
        tapCount={tapCount}
        onStageClick={onStageClick}
        onReset={reset}
        onSendToMetronome={sendToMetronome}
      />
      <TapTempoRefStrip state={state} />
    </div>
  )
}
