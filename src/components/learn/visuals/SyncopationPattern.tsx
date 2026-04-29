'use client'

import React from 'react'
import { Staff, RhythmicNote, TimeSignature, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { useLoopingPlayback } from '@/lib/learn/audio/useLoopingPlayback'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface SyncopationPatternProps {
  /** Tempo for playback. Default 80. */
  tempo?: number
  size?: LearnSize
  caption?: string
}

/**
 * Charleston-style syncopated rhythm in 4/4:
 *   beat 1.0: eighth (G4)
 *   beat 1.5: dotted-quarter (G4) — tied across beat 2.0 boundary, the syncopation
 *   beat 3.0: quarter (G4)
 *   beat 4.0: quarter (G4)
 *
 * Total = 0.5 + 1.5 + 1.0 + 1.0 = 4 beats.
 * The offbeat eighth (1.5) and the dotted-quarter sustaining through beat 2 are
 * what give it the syncopated feel.
 */
const PITCH = 'G4'

interface SyncopNote {
  beat: number
  durationBeats: number
  value: 'eighth' | 'quarter' | 'half' | 'dotted-quarter'
  offbeat: boolean
  tieToNext?: boolean
}

const PATTERN: SyncopNote[] = [
  { beat: 0,   durationBeats: 0.5, value: 'eighth',         offbeat: false },
  { beat: 0.5, durationBeats: 1.5, value: 'dotted-quarter', offbeat: true  },
  { beat: 2,   durationBeats: 1,   value: 'quarter',        offbeat: false },
  { beat: 3,   durationBeats: 1,   value: 'quarter',        offbeat: false },
]

export function SyncopationPattern({
  tempo = 80,
  size = 'inline',
  caption,
}: SyncopationPatternProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  // Index-based highlight: every note in the pattern shares the same pitch
  // (G4), so MIDI-based highlighting would light all notes at once. Track
  // which note's INDEX is currently active so playback walks through them
  // one at a time.
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const { isPlaying, toggle } = useLoopingPlayback()

  const parsed = parsePitch(PITCH)
  if (!parsed) return null
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(520 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(48 * T.scale) + margin

  const clefReserve = Math.round(70 * T.scale)
  const tsX = staffX + clefReserve + Math.round(20 * T.scale)
  const noteAreaStart = tsX + Math.round(56 * T.scale)
  const trailingPad = Math.round(16 * T.scale)
  const noteAreaEnd = staffX + staffWidth - trailingPad
  const beatWidth = (noteAreaEnd - noteAreaStart) / 4
  const finalBarlineX = noteAreaEnd + Math.round(8 * T.scale)

  const noteY = lineY(staffY, 0, T) + pos * T.step

  const flashAt = (idx: number, durMs: number) => {
    setActiveIndex(idx)
    setTimeout(() => {
      setActiveIndex(curr => (curr === idx ? null : curr))
    }, durMs)
  }

  const handleNotePlay = (idx: number) => {
    setInteracted(true)
    flashAt(idx, 320)
    void play(PITCH)
  }

  const handlePlayAll = () => {
    setInteracted(true)
    const beatSec = 60 / tempo
    toggle(
      PATTERN.map((p, i) => ({
        offset: p.beat * beatSec,
        fire: () => {
          flashAt(i, p.durationBeats * beatSec * 1000)
          void play(PITCH)
        },
      })),
      {
        iterationMs: 4 * beatSec * 1000,
        onStop: () => setActiveIndex(null),
      }
    )
  }

  const xForBeat = (b: number) => noteAreaStart + b * beatWidth

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Syncopated rhythm pattern'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={4} denominator={4} x={tsX} staffTop={staffY} T={T} />

        <line
          x1={finalBarlineX}
          y1={staffY}
          x2={finalBarlineX}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
        />

        {PATTERN.map((p, i) => {
          const x = xForBeat(p.beat)
          const value: 'eighth' | 'quarter' | 'half' = p.value === 'dotted-quarter' ? 'quarter' : p.value
          const dotted = p.value === 'dotted-quarter'
          const isActive = activeIndex === i
          // Static-coral marking on the offbeat note keeps that visual hint
          // even at rest; the active highlight overrides it during playback.
          return (
            <RhythmicNote
              key={i}
              value={value}
              x={x}
              y={noteY}
              T={T}
              stemDirection="up"
              dotted={dotted}
              highlight={isActive || p.offbeat}
              highlightColor={p.offbeat ? T.highlightAccent : undefined}
              onClick={() => handleNotePlay(i)}
              ariaLabel={`${PITCH} ${p.value}`}
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
          }}
        >
          {isPlaying ? 'Stop' : 'Play rhythm'}
        </button>
      </div>
      {interacted && !ready && (
        <div style={{ fontFamily: T.fontLabel, fontSize: T.smallLabelFontSize, color: T.inkSubtle, fontStyle: 'italic', textAlign: 'center', marginTop: 6 }}>
          Loading piano samples…
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
