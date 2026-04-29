'use client'

import React from 'react'
import { Staff, RhythmicNote, Beam, TupletBracket, TimeSignature, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { useLoopingPlayback } from '@/lib/learn/audio/useLoopingPlayback'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface QuintupletInMeasureProps {
  pitch?: string
  /** Quarter-note BPM. Default 80. */
  tempo?: number
  size?: LearnSize
  caption?: string
  ariaLabel?: string
}

// Note indices in the play sequence — needed because every note shares
// the same pitch, so highlighting by MIDI would light all of them at once.
//   0..4   = first quintuplet
//   5      = beat-2 quarter
//   6..10  = second quintuplet
//   11     = beat-4 quarter
const IDX_QUINT_1 = [0, 1, 2, 3, 4] as const
const IDX_BEAT_2 = 5
const IDX_QUINT_2 = [6, 7, 8, 9, 10] as const
const IDX_BEAT_4 = 11

/**
 * 4/4 measure: quintuplet (5 sixteenths in 1 beat), quarter, quintuplet,
 * quarter. Click play to hear the rhythm with sequential note highlighting,
 * or click any notehead to play it alone.
 */
export function QuintupletInMeasure({
  pitch = 'A4',
  tempo = 80,
  size = 'inline',
  caption,
  ariaLabel,
}: QuintupletInMeasureProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const { isPlaying, toggle } = useLoopingPlayback()

  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffX = margin
  const staffY = margin + Math.round(80 * T.scale)

  const clefReserve = Math.round(70 * T.scale)
  const tsReserve = Math.round(48 * T.scale)
  const beatWidth = Math.round(150 * T.scale)
  const trailingPad = Math.round(14 * T.scale)

  const totalBeats = 4
  const noteAreaWidth = totalBeats * beatWidth
  const staffWidth = clefReserve + tsReserve + noteAreaWidth + trailingPad + Math.round(8 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(40 * T.scale) + margin

  const noteY = lineY(staffY, 0, T) + pos * T.step
  const beamY = noteY - T.stemLength
  const tsX = staffX + clefReserve + Math.round(20 * T.scale)
  const noteAreaStart = staffX + clefReserve + tsReserve

  const quintXsForBeat = (beatStartX: number) =>
    Array.from({ length: 5 }, (_, i) =>
      beatStartX + (i + 0.5) * (beatWidth / 5)
    )

  const beat1Start = noteAreaStart
  const quint1Xs = quintXsForBeat(beat1Start)
  const beat2X = noteAreaStart + 1.5 * beatWidth

  const beat3Start = noteAreaStart + 2 * beatWidth
  const quint2Xs = quintXsForBeat(beat3Start)
  const beat4X = noteAreaStart + 3.5 * beatWidth

  const measureEnd = noteAreaStart + totalBeats * beatWidth + trailingPad
  const bracketY = beamY - Math.round(28 * T.scale)

  const flashAt = (idx: number, durMs: number) => {
    setActiveIndex(idx)
    setTimeout(() => {
      setActiveIndex(curr => (curr === idx ? null : curr))
    }, durMs)
  }

  const handleNotePlay = (idx: number) => {
    setInteracted(true)
    flashAt(idx, 280)
    void play(pitch)
  }

  const handlePlayAll = () => {
    setInteracted(true)
    const beatSec = 60 / tempo
    const quintStep = beatSec / 5

    const stepEvents: { idx: number; offset: number; durMs: number }[] = []
    IDX_QUINT_1.forEach((idx, i) => {
      stepEvents.push({ idx, offset: i * quintStep, durMs: quintStep * 1000 })
    })
    stepEvents.push({ idx: IDX_BEAT_2, offset: beatSec, durMs: beatSec * 1000 })
    IDX_QUINT_2.forEach((idx, i) => {
      stepEvents.push({ idx, offset: 2 * beatSec + i * quintStep, durMs: quintStep * 1000 })
    })
    stepEvents.push({ idx: IDX_BEAT_4, offset: 3 * beatSec, durMs: beatSec * 1000 })

    toggle(
      stepEvents.map(e => ({
        offset: e.offset,
        fire: () => {
          flashAt(e.idx, e.durMs)
          void play(pitch)
        },
      })),
      {
        iterationMs: 4 * beatSec * 1000,
        onStop: () => setActiveIndex(null),
      }
    )
  }

  const renderQuintuplet = (
    xs: number[],
    indices: ReadonlyArray<number>,
    keyPrefix: string
  ) => (
    <g key={keyPrefix}>
      <TupletBracket
        x1={xs[0] + T.stemXOffset}
        x2={xs[xs.length - 1] + T.stemXOffset}
        y={bracketY}
        number={5}
        T={T}
      />
      <Beam noteXs={xs} beamY={beamY} beamCount={2} stemDirection="up" T={T} />
      {xs.map((x, i) => (
        <RhythmicNote
          key={`${keyPrefix}-n${i}`}
          value="sixteenth"
          x={x}
          y={noteY}
          T={T}
          stemDirection="up"
          noFlag
          highlight={activeIndex === indices[i]}
          onClick={() => handleNotePlay(indices[i])}
          ariaLabel={`${pitch} quintuplet ${i + 1} of 5`}
        />
      ))}
    </g>
  )

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={ariaLabel ?? caption ?? '4/4 measure with two quintuplets and two quarter notes'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={4} denominator={4} x={tsX} staffTop={staffY} T={T} />

        <line
          x1={measureEnd}
          y1={staffY}
          x2={measureEnd}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
        />

        {renderQuintuplet(quint1Xs, IDX_QUINT_1, 'q1')}
        <RhythmicNote
          value="quarter"
          x={beat2X}
          y={noteY}
          T={T}
          stemDirection="up"
          highlight={activeIndex === IDX_BEAT_2}
          onClick={() => handleNotePlay(IDX_BEAT_2)}
          ariaLabel={`${pitch} quarter (beat 2)`}
        />
        {renderQuintuplet(quint2Xs, IDX_QUINT_2, 'q2')}
        <RhythmicNote
          value="quarter"
          x={beat4X}
          y={noteY}
          T={T}
          stemDirection="up"
          highlight={activeIndex === IDX_BEAT_4}
          onClick={() => handleNotePlay(IDX_BEAT_4)}
          ariaLabel={`${pitch} quarter (beat 4)`}
        />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button
          type="button"
          onClick={handlePlayAll}
          disabled={interacted && !ready && !isPlaying}
          style={btnStyle(T, interacted && !ready && !isPlaying)}
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

function btnStyle(T: ReturnType<typeof tokensFor>, loading: boolean): React.CSSProperties {
  return {
    fontFamily: T.fontLabel,
    fontSize: 13,
    padding: '8px 18px',
    background: 'transparent',
    border: `0.5px solid ${T.ink}`,
    borderRadius: 8,
    cursor: loading ? 'wait' : 'pointer',
    color: T.ink,
    opacity: loading ? 0.5 : 1,
  }
}
