import { useEffect, useRef, useState } from 'react'

export interface PlaybackEvent {
  /** Time offset from the start of one iteration, in seconds. */
  offset: number
  /** Called when this event fires (play sound, flash highlight, etc.). */
  fire: () => void
}

export interface PlaybackOptions {
  /** Total duration of one iteration, in milliseconds. The next iteration
   *  fires this many ms after the start of the current one. */
  iterationMs: number
  /** Called when playback stops — use this to clear any highlight state. */
  onStop?: () => void
}

/**
 * Looping playback controller for rhythm visuals. Schedules an array of
 * `setTimeout` calls per iteration, then re-schedules itself after
 * `iterationMs` so the rhythm loops until the caller toggles it off.
 *
 * Safer than `setInterval` because each iteration's events are explicit
 * timeouts that can be cleared individually on stop or unmount.
 */
export function useLoopingPlayback() {
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  const timeoutsRef = useRef<number[]>([])
  const onStopRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    return () => {
      isPlayingRef.current = false
      timeoutsRef.current.forEach(t => clearTimeout(t))
      timeoutsRef.current = []
    }
  }, [])

  const stop = () => {
    if (!isPlayingRef.current) return
    isPlayingRef.current = false
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
    setIsPlaying(false)
    onStopRef.current?.()
  }

  const start = (events: PlaybackEvent[], options: PlaybackOptions) => {
    // If already playing, reset cleanly first (e.g. when switching modes).
    if (isPlayingRef.current) {
      isPlayingRef.current = false
      timeoutsRef.current.forEach(t => clearTimeout(t))
      timeoutsRef.current = []
      onStopRef.current?.()
    }
    isPlayingRef.current = true
    setIsPlaying(true)
    onStopRef.current = options.onStop

    const playOnce = () => {
      if (!isPlayingRef.current) return
      events.forEach(e => {
        const t = window.setTimeout(() => {
          if (!isPlayingRef.current) return
          e.fire()
        }, e.offset * 1000 + 50)
        timeoutsRef.current.push(t)
      })
      const next = window.setTimeout(playOnce, options.iterationMs)
      timeoutsRef.current.push(next)
    }
    playOnce()
  }

  const toggle = (events: PlaybackEvent[], options: PlaybackOptions) => {
    if (isPlayingRef.current) {
      stop()
    } else {
      start(events, options)
    }
  }

  return { isPlaying, start, stop, toggle }
}
