'use client'

import React from 'react'
import { Staff, Caption, NoteHead, Rest, TimeSignature } from './primitives'
import { tokensFor, lineY, type LearnSize, type LearnTokens } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, type Clef } from '@/lib/learn/visuals/pitch'

interface KeySignatureStaffProps {
  /** Number of accidentals. Positive = sharps, negative = flats, 0 = none. */
  accidentals: number
  clef?: Clef
  size?: LearnSize
  /** Optional labels rendered next to or below the staff (e.g. ["G major", "E minor"]). */
  labels?: string[]
  labelPosition?: 'right' | 'below'
  /** When provided, render this melodic phrase on the staff instead of empty space. */
  melodyPitches?: string[]
  /** Force explicit accidentals on every altered note, ignoring the active key signature. */
  forceExplicitAccidentals?: boolean
  /** Optional [numerator, denominator] time signature, rendered after the key signature. */
  timeSignature?: [number, number]
  /** Render a half-rest in the body when no melody is provided. Default false (empty staff). */
  showRest?: boolean
  /** Per-staff caption rendered below. */
  caption?: string
  /** Tighten the staff length to just clef + key signature (no body). Used by reference tables. */
  compact?: boolean
}

const SHARP_ORDER: Array<'F' | 'C' | 'G' | 'D' | 'A' | 'E' | 'B'> = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER:  Array<'B' | 'E' | 'A' | 'D' | 'G' | 'C' | 'F'> = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

// Treble-clef staff positions (half-line steps from top line, increasing downward)
// F5=0 (top line), E5=1, D5=2, C5=3, B4=4, A4=5, G4=6, F4=7, E4=8 (bottom line)
// Sharps on treble clef: F♯5(0), C♯5(3), G♯5(-1), D♯5(2), A♯4(5), E♯5(1), B♯4(4)
const TREBLE_SHARP_POS: Record<string, number> = {
  F: 0,  // F♯5 on top line
  C: 3,  // C♯5 in 3rd space
  G: -1, // G♯5 above top line
  D: 2,  // D♯5 on 2nd line from top
  A: 5,  // A♯4 in 2nd space from bottom
  E: 1,  // E♯5 in top space
  B: 4,  // B♯4 on middle line
}
// Flats on treble clef — strict alternating up-3 / down-4 pattern starting from B♭4 middle line.
// B♭4(4), E♭5(1), A♭4(5), D♭5(2), G♭4(6), C♭5(3), F♭4(7)
const TREBLE_FLAT_POS: Record<string, number> = {
  B: 4,  // B♭4 on middle line
  E: 1,  // E♭5 in top space
  A: 5,  // A♭4 in space 2 from bottom
  D: 2,  // D♭5 on line 4 from bottom
  G: 6,  // G♭4 on line 2 from bottom
  C: 3,  // C♭5 in space 3
  F: 7,  // F♭4 in space 1 (bottom space)
}

// Bass clef positions: A3=0, G3=1, F3=2, E3=3, D3=4, C3=5, B2=6, A2=7, G2=8
const BASS_SHARP_POS: Record<string, number> = {
  F: 2, C: 5, G: 1, D: 4, A: 7, E: 3, B: 6,
}
// Flats on bass clef — same alternation, cluster sits in upper portion of bass staff.
// B♭2(6), E♭3(3), A♭2(7), D♭3(4), G♭3(1), C♭3(5), F♭3(2)
const BASS_FLAT_POS: Record<string, number> = {
  B: 6, E: 3, A: 7, D: 4, G: 1, C: 5, F: 2,
}

/** Build the array of accidentals to render with their staff positions. */
function buildKeySignature(
  accidentals: number,
  clef: Clef,
): Array<{ glyph: 'sharp' | 'flat'; pos: number }> {
  if (accidentals === 0) return []
  const isSharp = accidentals > 0
  const count = Math.abs(accidentals)
  const order = isSharp ? SHARP_ORDER : FLAT_ORDER
  const posMap = isSharp
    ? (clef === 'treble' ? TREBLE_SHARP_POS : BASS_SHARP_POS)
    : (clef === 'treble' ? TREBLE_FLAT_POS : BASS_FLAT_POS)
  return order.slice(0, count).map(letter => ({
    glyph: isSharp ? 'sharp' : 'flat',
    pos: posMap[letter],
  }))
}

/** Compute MIDI offsets implied by a key signature. Returns the set of letter names that are altered. */
function alteredLettersForKey(accidentals: number): Map<string, '#' | 'b'> {
  const result = new Map<string, '#' | 'b'>()
  if (accidentals === 0) return result
  const isSharp = accidentals > 0
  const count = Math.abs(accidentals)
  const order = isSharp ? SHARP_ORDER : FLAT_ORDER
  for (let i = 0; i < count; i++) {
    result.set(order[i], isSharp ? '#' : 'b')
  }
  return result
}

interface KeySignatureGroupProps {
  accidentals: number
  clef: Clef
  startX: number
  staffY: number
  T: LearnTokens
}

/** Renders the cluster of sharps/flats. Returns the right-edge x for layout chaining. */
function KeySignatureGroup({ accidentals, clef, startX, staffY, T }: KeySignatureGroupProps) {
  const items = buildKeySignature(accidentals, clef)
  // Inter-glyph spacing in standard engraving sits a touch under one notehead width
  // — tight clusters but with enough breathing room to read each accidental.
  const slotW = Math.round(T.accidentalKerning * 0.95)
  return (
    <g>
      {items.map((it, i) => (
        <text
          key={i}
          x={startX + i * slotW}
          y={lineY(staffY, 0, T) + it.pos * T.step}
          fontSize={T.accidentalFontSize}
          fontFamily={T.fontMusic}
          fill={T.ink}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {it.glyph === 'sharp' ? T.sharpGlyph : T.flatGlyph}
        </text>
      ))}
    </g>
  )
}

export function keySignatureWidth(accidentals: number, T: LearnTokens): number {
  const count = Math.abs(accidentals)
  if (count === 0) return 0
  const slotW = Math.round(T.accidentalKerning * 0.95)
  return count * slotW + Math.round(8 * T.scale)
}

export function KeySignatureStaff({
  accidentals,
  clef = 'treble',
  size = 'inline',
  labels,
  labelPosition = 'right',
  melodyPitches,
  forceExplicitAccidentals = false,
  timeSignature,
  showRest = false,
  caption,
  compact = false,
}: KeySignatureStaffProps) {
  const T = tokensFor(size)

  const margin = Math.round(20 * T.scale + 10)
  const clefReserve = T.clefReserve
  // Standard engraving leaves roughly one notehead-width of breathing room
  // between the clef's right edge and the first accidental.
  const clefGap = Math.round(18 * T.scale)
  const ksWidth = keySignatureWidth(accidentals, T)
  const ksGap = ksWidth > 0 ? Math.round(12 * T.scale) : Math.round(6 * T.scale)

  const tsWidth = timeSignature ? Math.round(28 * T.scale + 8) : 0
  const tsTrailGap = timeSignature ? Math.round(16 * T.scale) : 0

  const noteCount = melodyPitches?.length ?? 0
  const noteSlotW = Math.round(64 * T.scale + 14)
  const measureLeadGap = Math.round(22 * T.scale)
  const beatsPerMeasure = timeSignature ? timeSignature[0] : 0
  const internalBarCount = beatsPerMeasure > 0 && noteCount > 0
    ? Math.max(0, Math.floor((noteCount - 1) / beatsPerMeasure))
    : 0
  const bodyWidth = compact
    ? Math.round(20 * T.scale)
    : (noteCount > 0
        ? noteCount * noteSlotW + internalBarCount * measureLeadGap + Math.round(20 * T.scale)
        : Math.round(80 * T.scale))

  const innerWidth = clefReserve + clefGap + ksWidth + ksGap + tsWidth + tsTrailGap + bodyWidth
  const staffWidth = innerWidth

  const staffY = Math.round(40 * T.scale + 12)
  const totalH = staffY + 8 * T.step + Math.round(40 * T.scale + 16)

  // Reserve right space for labels
  const labelGap = Math.round(14 * T.scale)
  const labelMaxWidth = labels && labelPosition === 'right'
    ? Math.round(110 * T.scale)
    : 0

  const totalW = margin + staffWidth + labelGap + labelMaxWidth + margin

  const ksStartX = margin + clefReserve + clefGap
  const tsX = ksStartX + ksWidth + ksGap + tsWidth / 2
  const bodyStartX = ksStartX + ksWidth + ksGap + tsWidth + tsTrailGap

  /** X position for a note at index i, accounting for accumulated measure lead gaps. */
  const noteXAt = (i: number): number => {
    const measureIdx = beatsPerMeasure > 0 ? Math.floor(i / beatsPerMeasure) : 0
    return bodyStartX + i * noteSlotW + measureIdx * measureLeadGap + 0.5 * noteSlotW
  }

  // Barlines: place at end of each complete measure.
  const barlineXs: number[] = []
  if (beatsPerMeasure > 0 && noteCount > 0) {
    for (let m = 1; m * beatsPerMeasure <= noteCount; m++) {
      // Barline goes after the m-th measure's last note. Each preceding measure (other than the
      // current) contributes a leading gap that has already been added to subsequent notes,
      // but the barline itself sits between this measure's last note and the next measure's lead gap.
      const x = bodyStartX + m * beatsPerMeasure * noteSlotW + (m - 1) * measureLeadGap
      barlineXs.push(x)
    }
  }

  // Engrave melody
  const altered = alteredLettersForKey(accidentals)
  const labelFont = T.size === 'small' ? 12 : T.size === 'hero' ? 16 : 13

  // When a melody is present we let the SVG fill the available column width
  // (no maxWidth cap, figure spans 100%) so the diagram reads at full size.
  // Reference figures with no melody stay sized to their natural width.
  const fillColumn = noteCount > 0
  const figureStyle: React.CSSProperties = fillColumn
    ? { margin: '0 auto', width: '100%' }
    : { margin: '0 auto', width: 'fit-content', maxWidth: '100%' }
  const svgStyle: React.CSSProperties = fillColumn
    ? { display: 'block', height: 'auto', margin: '0 auto' }
    : { display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }

  return (
    <figure style={figureStyle}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={svgStyle}
        role="img"
        aria-label={caption ?? `${clef} clef with ${Math.abs(accidentals)} ${accidentals > 0 ? 'sharps' : accidentals < 0 ? 'flats' : 'no accidentals'}`}
      >
        <Staff clef={clef} x={margin} y={staffY} width={staffWidth} T={T} />

        <KeySignatureGroup
          accidentals={accidentals}
          clef={clef}
          startX={ksStartX + Math.round(T.accidentalKerning * 0.5)}
          staffY={staffY}
          T={T}
        />

        {timeSignature && (
          <TimeSignature
            numerator={timeSignature[0]}
            denominator={timeSignature[1]}
            x={tsX}
            staffTop={staffY}
            T={T}
          />
        )}

        {barlineXs.map((bx, i) => (
          <line
            key={`barline-${i}`}
            x1={bx}
            y1={staffY}
            x2={bx}
            y2={staffY + 8 * T.step}
            stroke={T.staffLineColor}
            strokeWidth={T.staffLineStroke}
          />
        ))}

        {melodyPitches && melodyPitches.length > 0
          ? melodyPitches.map((pitch, i) => {
              const parsed = parsePitch(pitch)
              if (!parsed) return null
              const x = noteXAt(i)
              // Decide whether to render the explicit accidental.
              // If forceExplicitAccidentals, always show it.
              // Otherwise: show only if the pitch's accidental does NOT match
              // the key signature's altered-letter accidental.
              let renderPitch = pitch
              if (!forceExplicitAccidentals) {
                const keyAcc = altered.get(parsed.letter)
                const noteAcc = parsed.accidental
                // If the note's accidental matches what the key signature already provides, drop it.
                if (
                  (keyAcc === '#' && noteAcc === '#') ||
                  (keyAcc === 'b' && noteAcc === 'b')
                ) {
                  renderPitch = `${parsed.letter}${parsed.octave}`
                }
              }
              return (
                <NoteHead
                  key={i}
                  pitch={renderPitch}
                  staffTop={staffY}
                  x={x}
                  clef={clef}
                  T={T}
                  duration="quarter"
                />
              )
            })
          : showRest && !compact && (
              <Rest
                value="half"
                x={bodyStartX + bodyWidth / 2}
                y={staffY + 2 * T.step}
                T={T}
              />
            )}

        {labels && labelPosition === 'right' && (
          <g>
            {labels.map((label, i) => {
              const yOffset = labels.length === 1
                ? lineY(staffY, 2, T)
                : lineY(staffY, 1, T) + i * Math.round(22 * T.scale)
              return (
                <text
                  key={i}
                  x={margin + staffWidth + labelGap}
                  y={yOffset}
                  fontSize={labelFont}
                  fontFamily={T.fontLabel}
                  fill={i === 0 ? T.ink : T.inkMuted}
                  dominantBaseline="central"
                >
                  {label}
                </text>
              )
            })}
          </g>
        )}

        {labels && labelPosition === 'below' && (
          <g>
            {labels.map((label, i) => (
              <text
                key={i}
                x={margin + staffWidth / 2}
                y={staffY + 8 * T.step + Math.round(22 * T.scale) + i * Math.round(20 * T.scale)}
                fontSize={labelFont}
                fontFamily={T.fontLabel}
                fill={i === 0 ? T.ink : T.inkMuted}
                textAnchor="middle"
              >
                {label}
              </text>
            ))}
          </g>
        )}
      </svg>

      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
