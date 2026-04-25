'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchExerciseFile } from '@/lib/rhythmLibrary'
import type { RhythmExercise } from '@/lib/parseMXL'

const F = 'var(--font-jost), sans-serif'

interface Props {
  exerciseId: string
  bpm: number
}

/**
 * Plays a rhythm exercise straight through at the given BPM — metronome clicks
 * plus a piano sample on each non-rest note. Used on Listen pages so students
 * can hear the rhythm before they tap it. Audio-only; no tap input, no scoring.
 *
 * Self-contained: owns its own AudioContext, schedules everything in one pass,
 * auto-stops when the exercise finishes. Click Play again to replay.
 */
export default function RhythmAudioDemo({ exerciseId, bpm }: Props) {
  const [exercise, setExercise] = useState<RhythmExercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)

  const ctxRef = useRef<AudioContext | null>(null)
  const pianoBufferRef = useRef<AudioBuffer | null>(null)
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load the MXL once
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchExerciseFile(exerciseId), import('@/lib/parseMXL')])
      .then(async ([buffer, { parseMXL }]) => {
        if (cancelled) return
        const ex = await parseMXL(buffer)
        setExercise(ex)
        setLoading(false)
      })
      .catch(e => {
        if (!cancelled) { setError(e instanceof Error ? e.message : String(e)); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [exerciseId])

  const getCtx = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state !== 'closed') return ctxRef.current
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    ctxRef.current = ctx
    return ctx
  }, [])

  const playClick = useCallback((ctx: AudioContext, t: number, accent: boolean) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = accent ? 1600 : 1000
    osc.type = 'square'
    gain.gain.setValueAtTime(accent ? 0.4 : 0.2, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
    osc.start(t); osc.stop(t + 0.06)
  }, [])

  const stop = useCallback(() => {
    setPlaying(false)
    if (stopTimeoutRef.current) { clearTimeout(stopTimeoutRef.current); stopTimeoutRef.current = null }
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(() => {})
      ctxRef.current = null
    }
  }, [])

  const play = useCallback(async () => {
    if (!exercise) return
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()

    // Lazy-load the piano sample on first play.
    if (!pianoBufferRef.current) {
      try {
        const resp = await fetch('/samples/piano-g4.wav')
        const ab = await resp.arrayBuffer()
        pianoBufferRef.current = await ctx.decodeAudioData(ab)
      } catch {
        // Piano sample failed to load — fall back to clicks-only playback.
      }
    }

    setPlaying(true)

    const isCompound = exercise.timeSignature.beats % 3 === 0 && exercise.timeSignature.beats > 3
    const feltBeats = isCompound ? exercise.timeSignature.beats / 3 : exercise.timeSignature.beats
    const beatDur = 60 / bpm
    const feltBeatDur = isCompound ? 60 / bpm : beatDur
    const compoundBeatDur = isCompound ? feltBeatDur / 3 : beatDur
    const effectiveBeatDur = isCompound ? compoundBeatDur * 2 : beatDur
    const beatsPerMeasure = exercise.timeSignature.beats
    const totalBeats = exercise.measures.length * exercise.timeSignature.beats * (4 / exercise.timeSignature.beatType)

    const startTime = ctx.currentTime + 0.3

    // Metronome clicks
    if (isCompound) {
      const feltCount = Math.round(totalBeats / 3)
      for (let i = 0; i < feltCount; i++) {
        playClick(ctx, startTime + i * feltBeatDur, i % feltBeats === 0)
        playClick(ctx, startTime + i * feltBeatDur + compoundBeatDur, false)
        playClick(ctx, startTime + i * feltBeatDur + compoundBeatDur * 2, false)
      }
    } else {
      for (let i = 0; i < totalBeats; i++) playClick(ctx, startTime + i * beatDur, i % beatsPerMeasure === 0)
    }

    // Piano notes (skip rests + tie-stops; tied notes ring through their full chain duration)
    if (pianoBufferRef.current) {
      let beatPos = 0
      for (const measure of exercise.measures) {
        for (let i = 0; i < measure.notes.length; i++) {
          const note = measure.notes[i]
          if (!note.rest && !note.tieStop) {
            const noteTime = startTime + beatPos * effectiveBeatDur
            // Compute duration including any tie chain.
            let durBeats = note.durationBeats
            if (note.tieStart) {
              // Walk forward through subsequent measures' notes to sum tied chain.
              let walkedBeats = beatPos + note.durationBeats
              let foundEnd = false
              for (let mi = exercise.measures.indexOf(measure); mi < exercise.measures.length && !foundEnd; mi++) {
                const startNi = mi === exercise.measures.indexOf(measure) ? i + 1 : 0
                for (let ni = startNi; ni < exercise.measures[mi].notes.length; ni++) {
                  const n = exercise.measures[mi].notes[ni]
                  if (!n.tieStop) { foundEnd = true; break }
                  durBeats += n.durationBeats
                  walkedBeats += n.durationBeats
                  if (!n.tieStart) { foundEnd = true; break }
                }
              }
            }
            const source = ctx.createBufferSource()
            const gain = ctx.createGain()
            source.buffer = pianoBufferRef.current
            source.playbackRate.value = 261.63 / 392 // C4 from G4 sample
            source.connect(gain); gain.connect(ctx.destination)
            const noteDur = Math.max(0.3, durBeats * effectiveBeatDur)
            gain.gain.setValueAtTime(0.7, noteTime)
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteDur * 1.5)
            source.start(noteTime)
            source.stop(noteTime + noteDur * 1.5 + 0.1)
          }
          beatPos += note.durationBeats
        }
      }
    }

    // Auto-stop when audio finishes (plus small tail).
    const totalSec = totalBeats * effectiveBeatDur + 0.6
    stopTimeoutRef.current = setTimeout(() => {
      stop()
    }, (0.3 + totalSec) * 1000)
  }, [exercise, bpm, getCtx, playClick, stop])

  // Cleanup on unmount.
  useEffect(() => () => stop(), [stop])

  return (
    <div style={{
      background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px',
      padding: '20px 22px', maxWidth: '600px',
      display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      <button
        onClick={playing ? stop : play}
        disabled={loading || !!error || !exercise}
        style={{
          width: '52px', height: '52px', borderRadius: '50%',
          border: 'none', background: playing ? '#B5402A' : '#1A1A18',
          color: 'white', fontSize: '20px', cursor: (loading || error) ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          opacity: (loading || error) ? 0.4 : 1,
        }}
        aria-label={playing ? 'Stop' : 'Play'}
      >
        {playing ? '■' : '▶'}
      </button>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 500, color: '#1A1A18', margin: '0 0 4px 0' }}>
          {playing ? 'Playing…' : loading ? 'Loading…' : error ? 'Audio unavailable' : 'Listen at goal tempo'}
        </p>
        <p style={{ fontFamily: F, fontSize: '12px', color: '#7A7060', margin: 0 }}>
          {bpm} BPM · metronome + sustained piano on each note
        </p>
      </div>
    </div>
  )
}
