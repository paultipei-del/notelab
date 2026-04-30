'use client'

import React from 'react'
import { Staff, RhythmicNote, Beam, TupletBracket, TimeSignature, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { useLoopingPlayback } from '@/lib/learn/audio/useLoopingPlayback'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface DupletInSixEightProps {
  pitch?: string
  /** Eighth-note BPM. Default 220 (≈ a moderate 6/8 jig). */
  tempo?: number
  size?: LearnSize
  caption?: string
  ariaLabel?: string
}

// Note indices in the play sequence — needed because every note shares the
// same pitch, so MIDI-based highlighting would light all of them at once.
//   0 = m1 dotted quarter, 1 = m1 duplet 1, 2 = m1 duplet 2,
//   3 = m2 dotted quarter, 4 = m2 duplet 1, 5 = m2 duplet 2
const M1_DOTTED = 0
const M1_DUPLET = [1, 2] as const
const M2_DOTTED = 3
const M2_DUPLET = [4, 5] as const

/**
 * Two 6/8 measures, each with a dotted-quarter on beat 1 and a duplet
 * (two beamed eighths in the time of three) on beat 2. Click play or any
 * notehead to hear it; notes light up sequentially during playback.
 */
export function DupletInSixEight({
  pitch = 'B4',
  tempo = 220,
  size = 'inline',
  caption,
  ariaLabel,
}: DupletInSixEightProps) {
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
  const tsReserve = Math.round(46 * T.scale)
  const beatWidth = Math.round(120 * T.scale) // a 6/8 "beat" = dotted quarter
  const trailingPad = Math.round(14 * T.scale)
  const tsXOffset = Math.round(20 * T.scale)

  const beatsPerMeasure = 2
  const numMeasures = 2

  const measure1Width = tsReserve + beatsPerMeasure * beatWidth + trailingPad
  const measure2Width = beatsPerMeasure * beatWidth + trailingPad
  const noteAreaWidth = measure1Width + measure2Width
  const staffWidth = clefReserve + noteAreaWidth + Math.round(8 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(40 * T.scale) + margin

  const noteY = lineY(staffY, 0, T) + pos * T.step
  const beamY = noteY - T.stemLength
  const tsX = staffX + clefReserve + tsXOffset

  const measure1Start = staffX + clefReserve
  const measure1NoteStart = measure1Start + tsReserve
  const measure1End = measure1NoteStart + beatsPerMeasure * beatWidth + trailingPad
  const measure2NoteStart = measure1End
  const measure2End = measure2NoteStart + beatsPerMeasure * beatWidth + trailingPad

  const buildMeasure = (noteAreaStart: number) => {
    const beat1X = noteAreaStart + 0.5 * beatWidth
    const beat2Start = noteAreaStart + 1 * beatWidth
    const dupletXs = [
      beat2Start + 0.25 * beatWidth,
      beat2Start + 0.75 * beatWidth,
    ]
    return { beat1X, dupletXs }
  }
  const m1 = buildMeasure(measure1NoteStart)
  const m2 = buildMeasure(measure2NoteStart)

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
    const eighthSec = 60 / tempo
    const dottedQuarterSec = eighthSec * 3
    const dupletNoteSec = (eighthSec * 3) / 2
    const measureSec = eighthSec * 6

    const indicesByMeasure: { dotted: number; duplet: ReadonlyArray<number> }[] = [
      { dotted: M1_DOTTED, duplet: M1_DUPLET },
      { dotted: M2_DOTTED, duplet: M2_DUPLET },
    ]
    const stepEvents: { idx: number; offset: number; durMs: number }[] = []
    for (let m = 0; m < numMeasures; m++) {
      const base = m * measureSec
      const { dotted, duplet } = indicesByMeasure[m]
      stepEvents.push({ idx: dotted,    offset: base, durMs: dottedQuarterSec * 1000 })
      stepEvents.push({ idx: duplet[0], offset: base + dottedQuarterSec, durMs: dupletNoteSec * 1000 })
      stepEvents.push({ idx: duplet[1], offset: base + dottedQuarterSec + dupletNoteSec, durMs: dupletNoteSec * 1000 })
    }

    void start(
      stepEvents.map(e => ({
        offset: e.offset,
        audio: (time) => playAt(pitch, e.durMs / 1000 * 0.95, time),
        visual: () => flashAt(e.idx, e.durMs),
      })),
      {
        iterationMs: numMeasures * measureSec * 1000,
        onStop: () => setActiveIndex(null),
      }
    )
  }

  const renderMeasure = (
    keyPrefix: string,
    layout: { beat1X: number; dupletXs: number[] },
    indices: { dotted: number; duplet: ReadonlyArray<number> }
  ) => (
    <g key={keyPrefix}>
      <RhythmicNote
        value="quarter"
        dotted
        x={layout.beat1X}
        y={noteY}
        T={T}
        stemDirection="up"
        highlight={activeIndex === indices.dotted}
        onClick={() => handleNotePlay(indices.dotted)}
        ariaLabel={`${pitch} dotted quarter`}
      />
      <TupletBracket
        x1={layout.dupletXs[0] + T.stemXOffset}
        x2={layout.dupletXs[1] + T.stemXOffset}
        y={bracketY}
        number={2}
        T={T}
      />
      <Beam noteXs={layout.dupletXs} beamY={beamY} beamCount={1} stemDirection="up" T={T} />
      {layout.dupletXs.map((x, i) => (
        <RhythmicNote
          key={`${keyPrefix}-dup-${i}`}
          value="eighth"
          x={x}
          y={noteY}
          T={T}
          stemDirection="up"
          noFlag
          highlight={activeIndex === indices.duplet[i]}
          onClick={() => handleNotePlay(indices.duplet[i])}
          ariaLabel={`${pitch} duplet eighth ${i + 1}`}
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
        aria-label={ariaLabel ?? caption ?? 'Two 6/8 measures, each with a dotted quarter on beat 1 and a duplet on beat 2'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={6} denominator={8} x={tsX} staffTop={staffY} T={T} />

        <line
          x1={measure1End}
          y1={staffY}
          x2={measure1End}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
        />
        <line
          x1={measure2End}
          y1={staffY}
          x2={measure2End}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
        />

        {renderMeasure('m1', m1, { dotted: M1_DOTTED, duplet: M1_DUPLET })}
        {renderMeasure('m2', m2, { dotted: M2_DOTTED, duplet: M2_DUPLET })}
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
