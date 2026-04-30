import { useEffect, useRef, useState } from 'react'

export interface PlaybackEvent {
  /** Time offset from the start of one iteration, in seconds. */
  offset: number
  /**
   * Audio scheduling callback — invoked inside the Tone.Part callback with
   * the SAMPLE-ACCURATE audio-context time at which this event should
   * sound. Use sampler.playAt(...) / sampler.tickAt(...) so the note is
   * scheduled at exactly `time`, not at the wall-clock time of the
   * setTimeout.
   */
  audio?: (time: number) => void
  /**
   * Visual update callback — fired through Tone.Draw so it lands on the
   * correct frame for the audio. Use this for highlight state.
   */
  visual?: () => void
  /**
   * Legacy fire-and-forget callback. New code should prefer `audio` +
   * `visual`. If only `fire` is provided it runs through Tone.Draw at
   * the scheduled audio time, which gives correct VISUAL timing but the
   * audio inside it (e.g. sampler.play that uses Tone.now()) will drift
   * by a few ms.
   */
  fire?: () => void
}

export interface PlaybackOptions {
  /** Total duration of one iteration, in milliseconds. */
  iterationMs: number
  /** Called when playback stops — use this to clear any highlight state. */
  onStop?: () => void
}

/**
 * Looping playback controller for rhythm visuals. Uses Tone.Part on
 * Tone.Transport for sample-accurate audio scheduling, and Tone.Draw for
 * visual updates synced to the audio. Way more reliable than setTimeout,
 * which drifts measurably right after a click while the JS thread is
 * busy with other work.
 *
 * Each component instance owns its own Part. Multiple instances can run
 * in parallel — they all share the global Tone.Transport, so once one
 * starts the transport, others reuse it.
 */
export function useLoopingPlayback() {
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partRef = useRef<any>(null)
  const onStopRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    return () => {
      isPlayingRef.current = false
      if (partRef.current) {
        try {
          partRef.current.stop()
          partRef.current.dispose()
        } catch { /* swallow — best-effort cleanup */ }
        partRef.current = null
      }
    }
  }, [])

  const disposePart = () => {
    if (partRef.current) {
      try {
        partRef.current.stop()
        partRef.current.dispose()
      } catch { /* swallow */ }
      partRef.current = null
    }
  }

  const stop = () => {
    if (!isPlayingRef.current) return
    isPlayingRef.current = false
    disposePart()
    setIsPlaying(false)
    onStopRef.current?.()
    // Best-effort: stop the global transport too, so the next click
    // starts from a clean slate even if other components were affected.
    void (async () => {
      try {
        const Tone = await import('tone')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ToneAny = Tone as any
        ToneAny.Transport.stop()
        ToneAny.Transport.cancel(0)
      } catch { /* swallow */ }
    })()
  }

  const start = async (events: PlaybackEvent[], options: PlaybackOptions) => {
    // Tear down any prior Part for this instance.
    if (isPlayingRef.current) {
      isPlayingRef.current = false
      disposePart()
      onStopRef.current?.()
    }

    isPlayingRef.current = true
    setIsPlaying(true)
    onStopRef.current = options.onStop

    try {
      const Tone = await import('tone')
      // Make sure the audio context is running. Modern browsers tend to
      // require this from a user gesture; the calling button click is
      // that gesture.
      const ctx = (Tone.getContext as () => { state: string })()
      if (ctx.state !== 'running') {
        await Tone.start()
      }

      const iterationSec = options.iterationMs / 1000

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ToneAny = Tone as any

      // Reset Transport state on every start. Without this, a second
      // click after a stop scheduled the part at position 0 while the
      // transport's clock had advanced past 0 — the very first event
      // missed because it was "in the past". Stopping + cancelling +
      // resetting position guarantees the new part fires from the start.
      try {
        ToneAny.Transport.stop()
        ToneAny.Transport.cancel(0)
        ToneAny.Transport.position = 0
      } catch { /* swallow */ }

      // Tone.Part takes [time, value] tuples. We index into our events
      // array so the callback can pull both audio and visual handlers.
      const partEntries: [number, number][] = events.map((e, idx) => [e.offset, idx])

      const part = new ToneAny.Part((time: number, idx: number) => {
        if (!isPlayingRef.current) return
        const e = events[idx]
        if (!e) return
        // Audio: fires INSIDE the Tone callback at sample-accurate time.
        if (e.audio) {
          try { e.audio(time) } catch { /* swallow */ }
        }
        // Visual: scheduled via Tone.Draw so it lands on the right frame.
        if (e.visual) {
          ToneAny.getDraw().schedule(() => {
            if (isPlayingRef.current) {
              try { e.visual!() } catch { /* swallow */ }
            }
          }, time)
        }
        // Legacy `fire`: use the same Draw queue so visual timing is OK.
        if (e.fire) {
          ToneAny.getDraw().schedule(() => {
            if (isPlayingRef.current) {
              try { e.fire!() } catch { /* swallow */ }
            }
          }, time)
        }
      }, partEntries)

      part.loop = true
      part.loopEnd = iterationSec
      part.start(0)
      partRef.current = part

      // Always start the transport fresh — position is already 0 from
      // the reset above. Brief preroll (+0.05s) lets the first audio
      // events schedule before the transport reaches them.
      ToneAny.Transport.start('+0.05', 0)
    } catch {
      // If Tone failed to load or start, just unwind state so the UI
      // doesn't get stuck thinking it's playing.
      isPlayingRef.current = false
      setIsPlaying(false)
      onStopRef.current?.()
    }
  }

  const toggle = (events: PlaybackEvent[], options: PlaybackOptions) => {
    if (isPlayingRef.current) {
      stop()
    } else {
      void start(events, options)
    }
  }

  return { isPlaying, start, stop, toggle }
}
