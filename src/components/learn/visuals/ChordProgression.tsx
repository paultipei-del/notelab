'use client'

import React from 'react'
import { Staff, NoteHead, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, lineY, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, type Clef } from '@/lib/learn/visuals/pitch'
import { engraveChord } from '@/lib/learn/visuals/chord-engraving'

const SHARP_ORDER: Array<'F' | 'C' | 'G' | 'D' | 'A' | 'E' | 'B'> = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER:  Array<'B' | 'E' | 'A' | 'D' | 'G' | 'C' | 'F'> = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

const TREBLE_SHARP_POS: Record<string, number> = { F: 0, C: 3, G: -1, D: 2, A: 5, E: 1, B: 4 }
const TREBLE_FLAT_POS:  Record<string, number> = { B: 4, E: 1, A: 5, D: 2, G: 6, C: 3, F: 7 }
const BASS_SHARP_POS:   Record<string, number> = { F: 2, C: 5, G: 1, D: 4, A: 7, E: 3, B: 6 }
const BASS_FLAT_POS:    Record<string, number> = { B: 6, E: 3, A: 7, D: 4, G: 1, C: 5, F: 2 }

/** Letters altered by the active key signature, mapped to '#' or 'b'. */
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

/**
 * Map an audio pitch to the pitch string we should render on the staff,
 * accounting for the active key signature:
 *   - If the pitch's accidental matches the key signature, drop it from display.
 *   - If the pitch is natural but the key signature would alter the letter,
 *     add an explicit natural sign.
 *   - Otherwise, keep as-is.
 */
function displayPitch(pitch: string, altered: Map<string, '#' | 'b'>): string {
  const m = pitch.match(/^([A-G])(##|bb|#|b|n)?(-?\d+)$/)
  if (!m) return pitch
  const letter = m[1]
  const acc = m[2] ?? null
  const oct = m[3]
  const keyAcc = altered.get(letter)
  if (!keyAcc) return pitch
  if ((keyAcc === '#' && acc === '#') || (keyAcc === 'b' && acc === 'b')) {
    return `${letter}${oct}`
  }
  if (acc === null) {
    return `${letter}n${oct}`
  }
  return pitch
}

export interface ChordProgressionEntry {
  pitches: string[]
  /** Roman numeral or short label rendered under the chord. */
  label?: string
}

interface ChordProgressionProps {
  accidentals?: number
  chords: ChordProgressionEntry[]
  clef?: Clef
  size?: LearnSize
  /** Title shown above the staff (e.g. "C major"). */
  title?: string
  /**
   * Reserve horizontal space for this many key-signature accidentals,
   * even if the actual key has fewer. Use to match staff widths across
   * sibling progressions (e.g. C major vs C minor side-by-side).
   */
  reserveAccidentalSlots?: number
  caption?: string
}

export function ChordProgression({
  accidentals = 0,
  chords,
  clef = 'treble',
  size = 'inline',
  title,
  reserveAccidentalSlots,
  caption,
}: ChordProgressionProps) {
  const T = tokensFor(size)
  const { playChord } = useSampler()

  const margin = Math.round(20 * T.scale + 10)
  const clefReserve = T.clefReserve
  const clefGap = Math.round(18 * T.scale)

  const isSharp = accidentals > 0
  const ksCount = Math.abs(accidentals)
  const ksReserveCount = Math.max(ksCount, reserveAccidentalSlots ?? 0)
  const ksOrder = isSharp ? SHARP_ORDER : FLAT_ORDER
  const ksPosMap = isSharp
    ? (clef === 'treble' ? TREBLE_SHARP_POS : BASS_SHARP_POS)
    : (clef === 'treble' ? TREBLE_FLAT_POS : BASS_FLAT_POS)
  const ksSlot = Math.round(T.accidentalKerning * 0.95)
  const ksActualWidth = ksCount > 0
    ? ksCount * ksSlot + Math.round(8 * T.scale)
    : 0
  const ksReservedWidth = ksReserveCount > 0
    ? ksReserveCount * ksSlot + Math.round(8 * T.scale)
    : 0
  const ksGap = ksActualWidth > 0 ? Math.round(12 * T.scale) : Math.round(6 * T.scale)

  // Total staff width is anchored to the WIDER sibling's reserved key signature,
  // so paired examples align. Within this fixed total, the body area is whatever
  // remains — chords distribute evenly across it.
  const baselineChordSlot = Math.round(96 * T.scale)
  const trailingInnerPad = Math.round(20 * T.scale)
  const innerWidth = clefReserve + clefGap + ksReservedWidth + ksGap + chords.length * baselineChordSlot + trailingInnerPad
  const staffWidth = innerWidth

  const bodyAvailable = staffWidth - clefReserve - clefGap - ksActualWidth - ksGap - trailingInnerPad
  const chordSlot = bodyAvailable / chords.length

  const titleFont = T.size === 'small' ? 13 : T.size === 'hero' ? 17 : 15
  const labelFont = T.size === 'small' ? 13 : T.size === 'hero' ? 17 : 15

  const staffY = Math.round(40 * T.scale + 12)

  // Compute lowest extent (max y) across all chord noteheads so the Roman numeral
  // labels never overlap with low chord tones (e.g. C4 below the staff).
  let lowestY = staffY + 8 * T.step
  for (const chord of chords) {
    for (const p of chord.pitches) {
      const parsed = parsePitch(p)
      if (!parsed) continue
      const pos = staffPosition(parsed, clef)
      const noteBottom = staffY + pos * T.step + T.noteheadHalfHeight
      if (noteBottom > lowestY) lowestY = noteBottom
    }
  }
  const labelY = lowestY + Math.round(20 * T.scale + 6)
  const totalH = labelY + Math.round(18 * T.scale)
  const totalW = margin + staffWidth + margin

  const ksStartX = margin + clefReserve + clefGap
  const bodyStartX = ksStartX + ksActualWidth + ksGap
  const chordX = (i: number) => bodyStartX + (i + 0.5) * chordSlot

  const handlePlayAll = async () => {
    for (let i = 0; i < chords.length; i++) {
      void playChord(chords[i].pitches, '2n')
      if (i < chords.length - 1) {
        await new Promise(r => setTimeout(r, 700))
      }
    }
  }

  return (
    <figure
      style={{
        margin: '0 auto',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: title ? 'auto auto' : 'auto',
        gridTemplateRows: 'auto auto',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 16,
        rowGap: 8,
      }}
    >
      {title && (
        <div
          style={{
            gridRow: 1,
            gridColumn: 1,
            fontFamily: T.fontLabel,
            fontSize: titleFont,
            color: T.ink,
            fontWeight: 600,
            minWidth: 80,
            textAlign: 'right',
            paddingRight: 4,
            alignSelf: 'center',
          }}
        >
          {title}
        </div>
      )}
      <div style={{ gridRow: 1, gridColumn: title ? 2 : 1, width: totalW, maxWidth: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', height: 'auto' }}
        role="img"
        aria-label={caption ?? title ?? 'Chord progression'}
      >
        <Staff clef={clef} x={margin} y={staffY} width={staffWidth} T={T} />

        {/* Key signature glyphs */}
        {ksCount > 0 && ksOrder.slice(0, ksCount).map((letter, i) => (
          <text
            key={`ks-${i}`}
            x={ksStartX + i * ksSlot + Math.round(T.accidentalKerning * 0.5)}
            y={lineY(staffY, 0, T) + ksPosMap[letter] * T.step}
            fontSize={T.accidentalFontSize}
            fontFamily={T.fontMusic}
            fill={T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {isSharp ? T.sharpGlyph : T.flatGlyph}
          </text>
        ))}

        {/* Chords */}
        {(() => {
          const altered = alteredLettersForKey(accidentals)
          return chords.map((chord, i) => {
            // Audio uses the original pitches; display uses key-signature-aware versions.
            const displayPitches = chord.pitches.map(p => displayPitch(p, altered))
            const parsed = displayPitches
              .map(p => parsePitch(p))
              .filter((p): p is NonNullable<typeof p> => p !== null)
            const engraved = parsed.length > 0
              ? engraveChord(parsed, clef, staffY, chordX(i), T)
              : null
            if (!engraved) return null
            return (
              <g
                key={`chord-${i}`}
                onClick={() => { void playChord(chord.pitches, '2n') }}
                style={{ cursor: 'pointer' }}
                role="button"
                aria-label={`Play ${chord.label ?? `chord ${i + 1}`}`}
              >
                {engraved.parsed.map((_p, j) => (
                  <NoteHead
                    key={j}
                    pitch={displayPitches[j]}
                    staffTop={staffY}
                    x={engraved.noteXs[j]}
                    clef={clef}
                    T={T}
                    duration="whole"
                  />
                ))}
              </g>
            )
          })
        })()}

        {/* Roman numeral labels */}
        {chords.map((chord, i) => chord.label && (
          <text
            key={`label-${i}`}
            x={chordX(i)}
            y={labelY}
            fontSize={labelFont}
            fontFamily={T.fontLabel}
            fill={T.ink}
            fontWeight={600}
            textAnchor="middle"
          >
            {chord.label}
          </text>
        ))}
      </svg>

      </div>

      <div
        style={{
          gridRow: 2,
          gridColumn: title ? 2 : 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={handlePlayAll}
          style={{
            fontFamily: T.fontLabel,
            fontSize: 12,
            color: T.bgPaper,
            background: T.ink,
            border: 'none',
            padding: '6px 14px',
            borderRadius: 4,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Play
        </button>
      </div>

      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
