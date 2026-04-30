'use client'

import React from 'react'
import { Staff, RhythmicNote, Rest, Tie, TimeSignature, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { useLoopingPlayback } from '@/lib/learn/audio/useLoopingPlayback'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

type RhythmValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'

export interface RhythmElement {
  kind: 'note' | 'rest'
  value: RhythmValue
  dotted?: boolean
  /** True if this note is tied to the next element (must also be a note at same pitch). */
  tieToNext?: boolean
}

interface RhythmMeasureExampleProps {
  /** Sequence of notes/rests filling a 4/4 measure. */
  elements: RhythmElement[]
  /** Pitch each note is rendered at. Default 'G4'. */
  pitch?: string
  /** Quarter-note BPM for the play button. Default 80. */
  tempo?: number
  size?: LearnSize
  caption?: string
}

const DURATION: Record<RhythmValue, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
}

/**
 * Renders a single 4/4 measure of mixed notes/rests with optional dots and
 * ties. Click "Play" to loop the rhythm with a metronome ticking each
 * beat — every notehead lights up one at a time as it sounds.
 */
export function RhythmMeasureExample({
  elements,
  pitch = 'G4',
  tempo = 80,
  size = 'inline',
  caption,
}: RhythmMeasureExampleProps) {
  const T = tokensFor(size)
  const { ready, play, playAt, tickAt, ensureReady } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  // Index-based highlight: every note shares the same pitch, so a single
  // active-element index walks through them sequentially during playback.
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const { isPlaying, start, stop } = useLoopingPlayback()

  const flashAt = (idx: number, durMs: number) => {
    setActiveIndex(idx)
    setTimeout(() => {
      setActiveIndex(curr => (curr === idx ? null : curr))
    }, durMs)
  }

  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(480 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)
  const totalH = staffY + 8 * T.step + Math.round(40 * T.scale) + 4
  const totalW = staffX + staffWidth + margin

  const tsX = staffX + Math.round(86 * T.scale) + 6
  const noteAreaStart = tsX + Math.round(40 * T.scale)
  const noteAreaEnd = staffX + staffWidth - Math.round(20 * T.scale)
  const noteAreaWidth = noteAreaEnd - noteAreaStart

  const totalBeats = 4
  const beatX = (b: number) => noteAreaStart + ((b + 0.5) / totalBeats) * noteAreaWidth

  const beatStarts = elements.reduce<number[]>((acc, el) => {
    const dur = DURATION[el.value] * (el.dotted ? 1.5 : 1)
    return [...acc, acc[acc.length - 1] + dur]
  }, [0])
  const placed = elements.map((el, i) => {
    const beatStart = beatStarts[i]
    const dur = DURATION[el.value] * (el.dotted ? 1.5 : 1)
    const nudge = el.kind === 'note' && el.value === 'eighth' ? -4 : 0
    return { el, beatStart, dur, x: beatX(beatStart) + nudge }
  })

  const noteY = lineY(staffY, 0, T) + pos * T.step
  const restY = lineY(staffY, 2, T)

  const handleNoteClick = (idx: number, durBeats: number) => {
    setInteracted(true)
    flashAt(idx, Math.max(280, durBeats * (60 / tempo) * 1000))
    void play(pitch)
  }

  const handlePlayAll = async () => {
    if (isPlaying) {
      stop()
      return
    }
    setInteracted(true)
    // Wait for samples to finish loading before starting the loop —
    // otherwise the Tone.Part would fire silently for the first second
    // or two until the sampler caught up.
    await ensureReady()
    const beatSec = 60 / tempo
    type Event = {
      offset: number
      audio?: (time: number) => void
      visual?: () => void
    }
    const events: Event[] = []

    // Metronome ticks on every beat. Accent the downbeat (beat 1) so the
    // listener can hear the start of each measure.
    for (let beat = 0; beat < totalBeats; beat++) {
      const accent = beat === 0
      events.push({
        offset: beat * beatSec,
        audio: (time) => tickAt(accent, time),
      })
    }

    // Notes / rests with sequential highlight. A note that's the
    // continuation of a tied pair flashes (so the eye sees the second
    // notehead come alive) but does NOT re-trigger a new attack — the
    // tie's whole point is to sound as one sustained note. For audio
    // duration we sum the tied notes so the held note sustains across
    // the whole tied span at one stroke.
    placed.forEach((p, i) => {
      const isContinuation =
        p.el.kind === 'note' && i > 0 && placed[i - 1].el.tieToNext === true
      // For an attack at index i, find how long the resulting sound
      // should sustain by walking the tie chain forward.
      let soundingBeats = p.dur
      let j = i
      while (j < placed.length - 1 && placed[j].el.tieToNext && placed[j + 1].el.kind === 'note') {
        soundingBeats += placed[j + 1].dur
        j++
      }
      const audioDurSec = Math.max(0.05, soundingBeats * beatSec * 0.95)
      events.push({
        offset: p.beatStart * beatSec,
        audio: (time) => {
          if (p.el.kind === 'note' && !isContinuation) {
            playAt(pitch, audioDurSec, time)
          }
        },
        visual: () => {
          flashAt(i, p.dur * beatSec * 1000)
        },
      })
    })

    void start(events, {
      iterationMs: totalBeats * beatSec * 1000,
      onStop: () => setActiveIndex(null),
    })
  }

  return (
    <figure style={{ margin: '12px auto 8px', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? '4/4 rhythm example'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={4} denominator={4} x={tsX} staffTop={staffY} T={T} />

        {/* Final barline */}
        <line
          x1={staffX + staffWidth}
          y1={staffY}
          x2={staffX + staffWidth}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
        />

        {/* Ties — render BEFORE noteheads so they sit below stems visually */}
        {placed.map((p, i) => {
          if (p.el.kind !== 'note' || !p.el.tieToNext) return null
          const next = placed[i + 1]
          if (!next || next.el.kind !== 'note') return null
          return (
            <Tie
              key={`tie-${i}`}
              x1={p.x}
              x2={next.x}
              y={noteY + T.noteheadHalfHeight}
              direction="under"
              T={T}
            />
          )
        })}

        {/* Elements */}
        {placed.map((p, i) => {
          const x = p.x
          const isActive = activeIndex === i
          if (p.el.kind === 'note') {
            return (
              <RhythmicNote
                key={`el-${i}`}
                value={p.el.value}
                x={x}
                y={noteY}
                T={T}
                stemDirection="up"
                dotted={p.el.dotted}
                highlight={isActive}
                onClick={() => handleNoteClick(i, p.dur)}
                ariaLabel={`${pitch} ${p.el.dotted ? 'dotted ' : ''}${p.el.value}`}
              />
            )
          }
          return (
            <Rest
              key={`el-${i}`}
              value={p.el.value}
              x={x}
              y={restY}
              T={T}
            />
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button
          type="button"
          onClick={handlePlayAll}
          disabled={interacted && !ready && !isPlaying}
          style={{
            fontFamily: T.fontLabel,
            fontSize: 13,
            padding: '8px 18px',
            background: 'transparent',
            border: `0.5px solid ${T.ink}`,
            borderRadius: 8,
            cursor: interacted && !ready && !isPlaying ? 'wait' : 'pointer',
            color: T.ink,
            opacity: interacted && !ready && !isPlaying ? 0.5 : 1,
            minWidth: 130,
            textAlign: 'center',
          }}
        >
          {isPlaying ? 'Stop' : 'Play with metronome'}
        </button>
      </div>
      {interacted && !ready && (
        <div style={{ fontFamily: T.fontLabel, fontSize: T.smallLabelFontSize, color: T.inkSubtle, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
          Loading piano samples…
        </div>
      )}
      {caption && (
        <div style={{ marginTop: -2 }}>
          <Caption T={T}>{caption}</Caption>
        </div>
      )}
    </figure>
  )
}
