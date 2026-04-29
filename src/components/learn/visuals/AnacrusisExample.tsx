'use client'

import React from 'react'
import { Staff, RhythmicNote, Beam, TimeSignature, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, ledgerLinePositions } from '@/lib/learn/visuals/pitch'

interface AnacrusisExampleProps {
  /** Tempo for playback (quarter-note BPM). Default 100. */
  tempo?: number
  size?: LearnSize
  caption?: string
}

interface NoteSpec {
  pitch: string
  value: 'eighth' | 'quarter' | 'half' | 'dotted-half'
  /** Cumulative beat offset from the first played note (the pickup). */
  beatOffset: number
  /** Syllable label rendered below the staff. */
  syllable: string
  /** True if this note is part of the pickup (anacrusis). */
  pickup?: boolean
}

const HAPPY_BIRTHDAY: NoteSpec[] = [
  { pitch: 'G4', value: 'eighth',     beatOffset: 0,   syllable: 'Hap-',   pickup: true },
  { pitch: 'G4', value: 'eighth',     beatOffset: 0.5, syllable: 'py',     pickup: true },
  { pitch: 'A4', value: 'quarter',    beatOffset: 1,   syllable: 'Birth-' },
  { pitch: 'G4', value: 'quarter',    beatOffset: 2,   syllable: 'day' },
  { pitch: 'C5', value: 'quarter',    beatOffset: 3,   syllable: 'to' },
  { pitch: 'B4', value: 'dotted-half', beatOffset: 4,   syllable: 'you' },
]

export function AnacrusisExample({
  tempo = 100,
  size = 'inline',
  caption,
}: AnacrusisExampleProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  // Pre-parse all pitches for staff positions + MIDI
  const noteData = HAPPY_BIRTHDAY.map(n => {
    const p = parsePitch(n.pitch)!
    return { spec: n, parsed: p, pos: staffPosition(p, 'treble') }
  })

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(540 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(48 * T.scale)
  const syllableY = staffY + 8 * T.step + Math.round(36 * T.scale)
  const pickupLabelY = syllableY + Math.round(20 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = pickupLabelY + Math.round(20 * T.scale) + margin

  const tsX = staffX + Math.round(70 * T.scale)
  const noteAreaStart = tsX + Math.round(36 * T.scale)
  const noteAreaEnd = staffX + staffWidth - Math.round(20 * T.scale)
  // Total beats: 0..pickup(1 beat) + 3 quarters in m1 + 3 beats in m2 = pickup beats + 6 = ~7
  // Actually pickup is 1 beat (two eighths), m1 is 3 beats, m2 is 3 beats (dotted half). Total = 7.
  const TOTAL_BEATS = 7
  const beatWidth = (noteAreaEnd - noteAreaStart) / TOTAL_BEATS

  const xForBeat = (b: number) => noteAreaStart + b * beatWidth

  // Pickup span (for the highlight bracket below the staff)
  const pickupNotes = noteData.filter(n => n.spec.pickup)
  const pickupX1 = xForBeat(pickupNotes[0].spec.beatOffset)
  const pickupX2 = xForBeat(pickupNotes[pickupNotes.length - 1].spec.beatOffset) + Math.round(20 * T.scale)

  const playAll = async () => {
    setInteracted(true)
    const beatSec = 60 / tempo
    const startMs = performance.now() + 100
    HAPPY_BIRTHDAY.forEach(n => {
      const tMs = startMs + n.beatOffset * beatSec * 1000
      const parsedAgain = parsePitch(n.pitch)!
      setTimeout(() => {
        flash(parsedAgain.midi, beatSec * 1000)
        void play(n.pitch)
      }, tMs - performance.now())
    })
  }

  // Beam the two pickup eighths
  const pickupXs = pickupNotes.map(n => xForBeat(n.spec.beatOffset))
  const stemUp = (pos: number) => pos > 4

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? "Happy Birthday opening with anacrusis labeled"}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={3} denominator={4} x={tsX} staffTop={staffY} T={T} />

        {/* Pickup highlight: subtle coral bracket below the pickup notes */}
        <line
          x1={pickupX1 - Math.round(8 * T.scale)}
          y1={syllableY + Math.round(8 * T.scale)}
          x2={pickupX2}
          y2={syllableY + Math.round(8 * T.scale)}
          stroke={T.highlightAccent}
          strokeWidth={1.4}
        />
        <line
          x1={pickupX1 - Math.round(8 * T.scale)}
          y1={syllableY + Math.round(8 * T.scale)}
          x2={pickupX1 - Math.round(8 * T.scale)}
          y2={syllableY + Math.round(2 * T.scale)}
          stroke={T.highlightAccent}
          strokeWidth={1.4}
        />
        <line
          x1={pickupX2}
          y1={syllableY + Math.round(8 * T.scale)}
          x2={pickupX2}
          y2={syllableY + Math.round(2 * T.scale)}
          stroke={T.highlightAccent}
          strokeWidth={1.4}
        />
        <text
          x={(pickupX1 + pickupX2) / 2}
          y={pickupLabelY}
          fontSize={T.labelFontSize}
          fontFamily={T.fontLabel}
          fill={T.highlightAccent}
          textAnchor="middle"
          fontWeight={600}
        >
          anacrusis
        </text>

        {/* Beam the pickup eighths */}
        {(() => {
          const eighthsPos = pickupNotes[0].pos
          const noteY = lineY(staffY, 0, T) + eighthsPos * T.step
          const beamY = noteY - T.stemLength
          return (
            <Beam noteXs={pickupXs} beamY={beamY} beamCount={1} stemDirection="up" T={T} />
          )
        })()}

        {/* Notes + ledger lines */}
        {noteData.map((n, i) => {
          const x = xForBeat(n.spec.beatOffset)
          const noteY = lineY(staffY, 0, T) + n.pos * T.step
          const ledgers = ledgerLinePositions(n.pos)
          const isPickupEighth = n.spec.pickup === true
          const isHighlighted = highlightedMidis.includes(n.parsed.midi)
          const fill = isHighlighted ? T.highlightAccent : T.ink
          // Map dotted-half to half + dotted={true}
          const value: 'eighth' | 'quarter' | 'half' = n.spec.value === 'dotted-half' ? 'half'
            : n.spec.value === 'eighth' ? 'eighth'
            : n.spec.value === 'quarter' ? 'quarter' : 'half'
          const dotted = n.spec.value === 'dotted-half'
          return (
            <g key={i}>
              {ledgers.map(lp => (
                <line
                  key={`led-${i}-${lp}`}
                  x1={x - T.ledgerHalfWidth}
                  y1={staffY + lp * T.step}
                  x2={x + T.ledgerHalfWidth}
                  y2={staffY + lp * T.step}
                  stroke={fill}
                  strokeWidth={T.ledgerLineStroke}
                />
              ))}
              <RhythmicNote
                value={value}
                x={x}
                y={noteY}
                T={T}
                stemDirection={stemUp(n.pos) ? 'up' : 'down'}
                noFlag={isPickupEighth}
                dotted={dotted}
                highlight={isHighlighted}
                onClick={() => { setInteracted(true); flash(n.parsed.midi); void play(n.spec.pitch) }}
                ariaLabel={`${n.spec.pitch} ${n.spec.value}`}
              />
              <text
                x={x}
                y={syllableY}
                fontSize={T.labelFontSize}
                fontFamily={T.fontLabel}
                fill={n.spec.pickup ? T.highlightAccent : T.ink}
                textAnchor="middle"
                fontWeight={500}
              >
                {n.spec.syllable}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button
          type="button"
          onClick={playAll}
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
          Play melody
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
