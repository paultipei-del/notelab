'use client'

import React from 'react'
import { Staff, RhythmicNote, Beam, TupletBracket, TimeSignature, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { useLoopingPlayback } from '@/lib/learn/audio/useLoopingPlayback'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface TripletInMeasureProps {
  pitch?: string
  /** Quarter-note BPM for the play button. Default 80. */
  tempo?: number
  size?: LearnSize
  caption?: string
  ariaLabel?: string
}

// Note indices in the play sequence — used to highlight one note at a time
// during playback (cannot use MIDI-based highlighting because every note is
// the same pitch).
const IDX_BEAT_1 = 0
const IDX_TRIPLET = [1, 2, 3] as const
const IDX_BEAT_3 = 4
const IDX_BEAT_4 = 5

/**
 * 4/4 measure: quarter, eighth-triplet (3 beamed eighths with a `3` bracket
 * above), quarter, quarter. Click the play button to hear the rhythm; click
 * any notehead to play that pitch alone. Notes light up one at a time
 * during playback.
 */
export function TripletInMeasure({
  pitch = 'B4',
  tempo = 80,
  size = 'inline',
  caption,
  ariaLabel,
}: TripletInMeasureProps) {
  const T = tokensFor(size)
  const { ready, play, playAt, ensureReady } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const { isPlaying, start, stop } = useLoopingPlayback()

  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const pos = staffPosition(parsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffX = margin
  const staffY = margin + Math.round(80 * T.scale)

  const clefReserve = Math.round(70 * T.scale)
  const tsReserve = Math.round(48 * T.scale)
  const beatWidth = Math.round(110 * T.scale)
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

  const beat1X = noteAreaStart + 0.5 * beatWidth
  const beat2Start = noteAreaStart + 1 * beatWidth
  const tripletXs = Array.from({ length: 3 }, (_, i) =>
    beat2Start + (i + 0.5) * (beatWidth / 3)
  )
  const beat3X = noteAreaStart + 2.5 * beatWidth
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
    flashAt(idx, 320)
    void play(pitch)
  }

  const handlePlayAll = async () => {
    if (isPlaying) {
      stop()
      return
    }
    setInteracted(true)
    await ensureReady()
    const beatSec = 60 / tempo
    const tripletStep = beatSec / 3
    const stepEvents: { idx: number; offset: number; durMs: number }[] = [
      { idx: IDX_BEAT_1,     offset: 0,                         durMs: beatSec * 1000 },
      { idx: IDX_TRIPLET[0], offset: beatSec,                   durMs: tripletStep * 1000 },
      { idx: IDX_TRIPLET[1], offset: beatSec + tripletStep,     durMs: tripletStep * 1000 },
      { idx: IDX_TRIPLET[2], offset: beatSec + tripletStep * 2, durMs: tripletStep * 1000 },
      { idx: IDX_BEAT_3,     offset: beatSec * 2,               durMs: beatSec * 1000 },
      { idx: IDX_BEAT_4,     offset: beatSec * 3,               durMs: beatSec * 1000 },
    ]
    void start(
      stepEvents.map(e => ({
        offset: e.offset,
        audio: (time) => playAt(pitch, e.durMs / 1000 * 0.95, time),
        visual: () => flashAt(e.idx, e.durMs),
      })),
      {
        iterationMs: 4 * beatSec * 1000,
        onStop: () => setActiveIndex(null),
      }
    )
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={ariaLabel ?? caption ?? '4/4 measure containing an eighth-note triplet on beat 2'}
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

        <RhythmicNote
          value="quarter"
          x={beat1X}
          y={noteY}
          T={T}
          stemDirection="up"
          highlight={activeIndex === IDX_BEAT_1}
          onClick={() => handleNotePlay(IDX_BEAT_1)}
          ariaLabel={`${pitch} quarter (beat 1)`}
        />

        <TupletBracket
          x1={tripletXs[0] + T.stemXOffset}
          x2={tripletXs[2] + T.stemXOffset}
          y={bracketY}
          number={3}
          T={T}
        />
        <Beam noteXs={tripletXs} beamY={beamY} beamCount={1} stemDirection="up" T={T} />
        {tripletXs.map((x, i) => (
          <RhythmicNote
            key={`tr-${i}`}
            value="eighth"
            x={x}
            y={noteY}
            T={T}
            stemDirection="up"
            noFlag
            highlight={activeIndex === IDX_TRIPLET[i]}
            onClick={() => handleNotePlay(IDX_TRIPLET[i])}
            ariaLabel={`${pitch} triplet eighth ${i + 1}`}
          />
        ))}

        <RhythmicNote
          value="quarter"
          x={beat3X}
          y={noteY}
          T={T}
          stemDirection="up"
          highlight={activeIndex === IDX_BEAT_3}
          onClick={() => handleNotePlay(IDX_BEAT_3)}
          ariaLabel={`${pitch} quarter (beat 3)`}
        />
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
