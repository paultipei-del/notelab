'use client'

import React from 'react'
import { Staff, RhythmicNote, Beam, TupletBracket, TimeSignature, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface TupletDemoProps {
  /** Number of notes in the tuplet. Default 5. */
  count?: number
  /** Pitch all notes are rendered at. Default 'A4'. */
  pitch?: string
  /** Tempo for playback. Default 80. */
  tempo?: number
  size?: LearnSize
  caption?: string
}

export function TupletDemo({
  count = 5,
  pitch = 'A4',
  tempo = 80,
  size = 'inline',
  caption,
}: TupletDemoProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const midi = parsed.midi
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(360 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(48 * T.scale) + margin

  const tsX = staffX + Math.round(70 * T.scale)
  const noteAreaStart = tsX + Math.round(40 * T.scale)
  const noteAreaEnd = staffX + staffWidth - Math.round(20 * T.scale)
  const noteAreaWidth = noteAreaEnd - noteAreaStart
  const noteSpacing = noteAreaWidth / count
  const noteXs = Array.from({ length: count }, (_, i) => noteAreaStart + (i + 0.5) * noteSpacing)
  const noteY = lineY(staffY, 0, T) + pos * T.step

  // Stems extend up. Beam y sits above the noteheads.
  const stemTopY = noteY - T.stemLength
  const beamY = stemTopY
  const bracketY = beamY - Math.round(18 * T.scale)

  const handleNotePlay = async (i: number) => {
    setInteracted(true)
    flash(midi)
    await play(pitch)
  }

  const handlePlayAll = async () => {
    setInteracted(true)
    try {
      const Tone = await import('tone')
      if (Tone.getContext().state !== 'running') await Tone.start()
      // 1 beat = 60/tempo seconds. The tuplet fills 1 beat with `count` notes.
      const beatSec = 60 / tempo
      const stepSec = beatSec / count
      const startMs = performance.now() + 100
      noteXs.forEach((_, i) => {
        const tMs = startMs + i * stepSec * 1000
        setTimeout(() => {
          flash(midi, 250)
          void play(pitch)
        }, tMs - performance.now())
      })
    } catch {}
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `${count}-note tuplet`}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={4} denominator={4} x={tsX} staffTop={staffY} T={T} />

        {/* Tuplet bracket above the group */}
        <TupletBracket
          x1={noteXs[0]}
          x2={noteXs[noteXs.length - 1]}
          y={bracketY}
          number={count}
          T={T}
        />

        {/* Beam */}
        <Beam noteXs={noteXs} beamY={beamY} beamCount={2} stemDirection="up" T={T} />

        {/* Notes */}
        {noteXs.map((x, i) => (
          <RhythmicNote
            key={i}
            value="sixteenth"
            x={x}
            y={noteY}
            T={T}
            stemDirection="up"
            noFlag
            highlight={highlightedMidis.includes(midi)}
            onClick={() => handleNotePlay(i)}
            ariaLabel={`${pitch} (note ${i + 1} of ${count})`}
          />
        ))}
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
          Play tuplet
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
