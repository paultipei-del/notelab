'use client'

import React from 'react'
import { Staff, RhythmicNote, TimeSignature, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
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
  /** Beat position (0..3.99). */
  beat: number
  /** Duration in beats. */
  durationBeats: number
  value: 'eighth' | 'quarter' | 'half' | 'dotted-quarter'
  /** True if this note is on an offbeat (e.g. "and" of a beat). */
  offbeat: boolean
  /** True if this note is tied to the next note. */
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
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  const parsed = parsePitch(PITCH)
  if (!parsed) return null
  const midi = parsed.midi
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(440 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(48 * T.scale) + margin

  const tsX = staffX + Math.round(70 * T.scale)
  const noteAreaStart = tsX + Math.round(36 * T.scale)
  const noteAreaEnd = staffX + staffWidth - Math.round(20 * T.scale)
  const beatWidth = (noteAreaEnd - noteAreaStart) / 4

  const noteY = lineY(staffY, 0, T) + pos * T.step

  const handleNotePlay = async () => {
    setInteracted(true)
    flash(midi)
    await play(PITCH)
  }

  const handlePlayAll = async () => {
    setInteracted(true)
    const beatSec = 60 / tempo
    const startMs = performance.now() + 100
    PATTERN.forEach(p => {
      const tMs = startMs + p.beat * beatSec * 1000
      setTimeout(() => {
        flash(midi, p.durationBeats * beatSec * 1000)
        void play(PITCH)
      }, tMs - performance.now())
    })
  }

  // Compute x for each note from its beat
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

        {PATTERN.map((p, i) => {
          const x = xForBeat(p.beat)
          const value: 'eighth' | 'quarter' | 'half' = p.value === 'dotted-quarter' ? 'quarter' : p.value
          const dotted = p.value === 'dotted-quarter'
          return (
            <RhythmicNote
              key={i}
              value={value}
              x={x}
              y={noteY}
              T={T}
              stemDirection="up"
              dotted={dotted}
              highlight={p.offbeat || highlightedMidis.includes(midi)}
              highlightColor={p.offbeat ? T.highlightAccent : undefined}
              onClick={handleNotePlay}
              ariaLabel={`${PITCH} ${p.value}`}
            />
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button
          type="button"
          onClick={handlePlayAll}
          disabled={interacted && !ready}
          style={{
            fontFamily: T.fontLabel,
            fontSize: 13,
            padding: '8px 18px',
            background: 'transparent',
            border: `0.5px solid ${T.ink}`,
            borderRadius: 8,
            cursor: interacted && !ready ? 'wait' : 'pointer',
            color: T.ink,
            opacity: interacted && !ready ? 0.5 : 1,
          }}
        >
          Play rhythm
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
