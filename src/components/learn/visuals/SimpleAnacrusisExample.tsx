'use client'

import React from 'react'
import { Staff, RhythmicNote, TimeSignature, Caption } from './primitives'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, ledgerLinePositions } from '@/lib/learn/visuals/pitch'

interface SimpleAnacrusisExampleProps {
  size?: LearnSize
  caption?: string
  ariaLabel?: string
}

interface NoteSpec {
  pitch: string
  value: 'eighth' | 'quarter'
}

const PICKUP: NoteSpec = { pitch: 'G4', value: 'eighth' }
const FULL_MEASURE: NoteSpec[] = [
  { pitch: 'C5', value: 'quarter' },
  { pitch: 'B4', value: 'quarter' },
  { pitch: 'A4', value: 'quarter' },
  { pitch: 'G4', value: 'quarter' },
]

/**
 * The minimal anacrusis example from the lesson — one eighth-note pickup
 * (G4), a barline, then a full 4/4 measure of descending quarters
 * (C5-B4-A4-G4). Sits alongside the richer AnacrusisExample (Happy
 * Birthday) on the page; this one keeps the focus on the structural
 * pickup-then-downbeat shape without melodic distraction.
 */
export function SimpleAnacrusisExample({
  size = 'inline',
  caption,
  ariaLabel,
}: SimpleAnacrusisExampleProps) {
  const T = tokensFor(size)

  const margin = Math.round(20 * T.scale + 8)
  const staffX = margin
  const staffY = margin + Math.round(56 * T.scale)
  const labelY = staffY + 8 * T.step + Math.round(34 * T.scale)

  const clefReserve = Math.round(70 * T.scale)
  const tsReserve = Math.round(48 * T.scale)
  const pickupAreaWidth = Math.round(96 * T.scale)
  const measureBeatWidth = Math.round(64 * T.scale)
  const trailingPad = Math.round(12 * T.scale)

  const noteAreaWidth = pickupAreaWidth + measureBeatWidth * 4
  const staffWidth =
    clefReserve + tsReserve + noteAreaWidth + trailingPad + Math.round(8 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = labelY + Math.round(20 * T.scale) + margin

  const tsX = staffX + clefReserve + Math.round(22 * T.scale)
  const pickupAreaStart = staffX + clefReserve + tsReserve
  // Pickup eighth sits well left of the barline so the gap between the
  // pickup note and the start of measure 1 reads clearly.
  const pickupX = pickupAreaStart + Math.round(pickupAreaWidth * 0.32)
  const pickupBarlineX = pickupAreaStart + pickupAreaWidth
  const measureAreaStart = pickupBarlineX
  const noteXs = FULL_MEASURE.map((_, i) => measureAreaStart + (i + 0.5) * measureBeatWidth)
  const finalBarlineX = measureAreaStart + 4 * measureBeatWidth + trailingPad

  const stemUp = (pos: number) => pos > 4

  const renderNote = (n: NoteSpec, x: number, key: string) => {
    const parsed = parsePitch(n.pitch)
    if (!parsed) return null
    const pos = staffPosition(parsed, 'treble')
    const noteY = lineY(staffY, 0, T) + pos * T.step
    const ledgers = ledgerLinePositions(pos)
    return (
      <g key={key}>
        {ledgers.map((lp) => (
          <line
            key={`led-${key}-${lp}`}
            x1={x - T.ledgerHalfWidth}
            y1={staffY + lp * T.step}
            x2={x + T.ledgerHalfWidth}
            y2={staffY + lp * T.step}
            stroke={T.ink}
            strokeWidth={T.ledgerLineStroke}
          />
        ))}
        <RhythmicNote
          value={n.value}
          x={x}
          y={noteY}
          T={T}
          stemDirection={stemUp(pos) ? 'up' : 'down'}
          ariaLabel={`${n.pitch} ${n.value}`}
        />
      </g>
    )
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={
          ariaLabel ??
          caption ??
          'Pickup eighth note followed by a full measure in 4/4 of descending quarters'
        }
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={4} denominator={4} x={tsX} staffTop={staffY} T={T} />

        {/* Anacrusis label below the pickup */}
        <text
          x={(pickupAreaStart + pickupBarlineX) / 2}
          y={labelY}
          fontSize={T.labelFontSize}
          fontFamily={T.fontLabel}
          fill={T.highlightAccent}
          textAnchor="middle"
          fontWeight={600}
        >
          anacrusis
        </text>

        {/* Bracket under the pickup */}
        <line
          x1={pickupAreaStart + Math.round(8 * T.scale)}
          y1={labelY - Math.round(14 * T.scale)}
          x2={pickupBarlineX - Math.round(4 * T.scale)}
          y2={labelY - Math.round(14 * T.scale)}
          stroke={T.highlightAccent}
          strokeWidth={1.4}
        />

        {/* Pickup eighth */}
        {renderNote(PICKUP, pickupX, 'pickup')}

        {/* Pickup-to-measure barline */}
        <line
          x1={pickupBarlineX}
          y1={staffY}
          x2={pickupBarlineX}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
        />

        {/* Full measure */}
        {FULL_MEASURE.map((n, i) => renderNote(n, noteXs[i], `m-${i}`))}

        {/* Final barline */}
        <line
          x1={finalBarlineX}
          y1={staffY}
          x2={finalBarlineX}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
        />
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
