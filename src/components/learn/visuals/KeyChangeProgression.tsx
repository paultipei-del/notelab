'use client'

import React from 'react'
import { Staff, NoteHead, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, type Clef } from '@/lib/learn/visuals/pitch'
import { engraveChord, type EngravedChord } from '@/lib/learn/visuals/chord-engraving'

interface KeyChangeProgressionProps {
  /** Starting key. Negative = flats, positive = sharps. */
  startKey: number
  startChord: string[]
  pivotChord: string[]
  pivotKey?: number
  endKey: number
  endChord: string[]
  /** Extra pitches played alongside each chord (e.g. bass roots) but not
   *  rendered on the staff. Useful when you want a fuller harmonic sound
   *  than the visible voicing implies. */
  startAudioExtras?: string[]
  pivotAudioExtras?: string[]
  endAudioExtras?: string[]
  labels?: { start?: string; pivot?: string; end?: string }
  type?: 'pivot' | 'direct'
  size?: LearnSize
  /**
   * Force every staff in this progression to reserve at least this many
   * key-signature slots. Useful for matching staff widths across paired
   * KeyChangeProgression visuals on the same lesson page.
   */
  reserveAccidentalSlots?: number
  caption?: string
}

const SHARP_ORDER: Array<'F' | 'C' | 'G' | 'D' | 'A' | 'E' | 'B'> = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER:  Array<'B' | 'E' | 'A' | 'D' | 'G' | 'C' | 'F'> = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

const TREBLE_SHARP_POS: Record<string, number> = { F: 0, C: 3, G: -1, D: 2, A: 5, E: 1, B: 4 }
const TREBLE_FLAT_POS:  Record<string, number> = { B: 4, E: 1, A: 5, D: 2, G: 6, C: 3, F: 7 }

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
 * Map an audio pitch to the pitch we should render on the staff:
 *   - Pitch matches the active key signature → drop the redundant accidental.
 *   - Pitch is natural but the key signature would alter the letter → add explicit natural.
 *   - Otherwise → unchanged.
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

interface ZoneProps {
  accidentals: number
  chord: string[]
  label: string
  highlightChord: boolean
  size: LearnSize
  onPlay: () => void
  /** Reserve horizontal space for this many key-signature slots so sibling
   *  zones can share an identical staff width regardless of how many
   *  accidentals each one actually draws. */
  reserveAccidentalSlots?: number
}

function Zone({ accidentals, chord, label, highlightChord, size, onPlay, reserveAccidentalSlots }: ZoneProps) {
  const T = tokensFor(size)
  const clef: Clef = 'treble'

  const margin = Math.round(20 * T.scale + 8)
  const clefReserve = T.clefReserve
  const clefGap = Math.round(18 * T.scale)

  const isSharp = accidentals > 0
  const count = Math.abs(accidentals)
  const reserveCount = Math.max(count, reserveAccidentalSlots ?? 0)
  const order = isSharp ? SHARP_ORDER : FLAT_ORDER
  const posMap = isSharp ? TREBLE_SHARP_POS : TREBLE_FLAT_POS
  const slotW = Math.round(T.accidentalKerning * 0.95)
  const ksActualWidth = count > 0 ? count * slotW + Math.round(8 * T.scale) : 0
  const ksReservedWidth = reserveCount > 0 ? reserveCount * slotW + Math.round(8 * T.scale) : 0
  const ksGap = ksActualWidth > 0 ? Math.round(16 * T.scale) : Math.round(20 * T.scale)
  const trailingPad = ksReservedWidth - ksActualWidth

  const chordSlot = Math.round(86 * T.scale)
  const innerWidth = clefReserve + clefGap + ksActualWidth + ksGap + chordSlot + trailingPad
  const staffWidth = innerWidth

  const staffY = Math.round(40 * T.scale + 12)
  const totalH = staffY + 8 * T.step + Math.round(36 * T.scale + 16)
  const totalW = margin + staffWidth + margin

  const ksStartX = margin + clefReserve + clefGap + Math.round(T.accidentalKerning * 0.5)
  const chordX = margin + clefReserve + clefGap + ksActualWidth + ksGap + chordSlot / 2

  // Apply key-signature-aware accidental suppression / natural injection.
  const altered = alteredLettersForKey(accidentals)
  const renderPitches = chord.map(p => displayPitch(p, altered))
  const parsed = renderPitches
    .map(p => parsePitch(p))
    .filter((p): p is NonNullable<typeof p> => p !== null)
  const engraved: EngravedChord | null = parsed.length > 0
    ? engraveChord(parsed, clef, staffY, chordX, T)
    : null

  const labelFont = T.size === 'small' ? 12 : T.size === 'hero' ? 15 : 13

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '1 1 0', minWidth: 0 }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', cursor: 'pointer' }}
        onClick={onPlay}
        role="button"
        aria-label={`Play ${label} chord`}
      >
        <Staff clef={clef} x={margin} y={staffY} width={staffWidth} T={T} />

        {count > 0 && order.slice(0, count).map((letter, i) => (
          <text
            key={i}
            x={ksStartX + i * slotW}
            y={staffY + posMap[letter] * T.step}
            fontSize={T.accidentalFontSize}
            fontFamily={T.fontMusic}
            fill={T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {isSharp ? T.sharpGlyph : T.flatGlyph}
          </text>
        ))}

        {engraved && engraved.parsed.map((_p, i) => (
          <NoteHead
            key={i}
            pitch={renderPitches[i]}
            staffTop={staffY}
            x={engraved.noteXs[i]}
            clef={clef}
            T={T}
            duration="whole"
            highlight={highlightChord}
          />
        ))}
      </svg>
      <div
        style={{
          fontFamily: T.fontLabel,
          fontSize: labelFont,
          color: T.inkMuted,
          fontStyle: 'italic',
          textAlign: 'center',
          maxWidth: 220,
          lineHeight: 1.35,
        }}
      >
        {label}
      </div>
    </div>
  )
}

export function KeyChangeProgression({
  startKey,
  startChord,
  pivotChord,
  pivotKey,
  endKey,
  endChord,
  startAudioExtras,
  pivotAudioExtras,
  endAudioExtras,
  labels,
  type = 'pivot',
  size = 'inline',
  reserveAccidentalSlots,
  caption,
}: KeyChangeProgressionProps) {
  const T = tokensFor(size)
  const { playChord } = useSampler()

  // Combine the visible chord notes with any audio-only extras (e.g. bass
  // roots that should sound but not render).
  const audioStart = [...startChord, ...(startAudioExtras ?? [])]
  const audioPivot = [...pivotChord, ...(pivotAudioExtras ?? [])]
  const audioEnd = [...endChord, ...(endAudioExtras ?? [])]

  // Slowed-down playback: hold each chord longer and leave more space
  // between them so listeners can hear the modulation breathe.
  const chordDuration = '1n'
  const sequenceGapMs = 1100

  const playStart = () => playChord(audioStart, chordDuration)
  const playPivot = () => playChord(audioPivot, chordDuration)
  const playEnd = () => playChord(audioEnd, chordDuration)

  const playSequence = async () => {
    await playChord(audioStart, chordDuration)
    await new Promise(r => setTimeout(r, sequenceGapMs))
    await playChord(audioPivot, chordDuration)
    await new Promise(r => setTimeout(r, sequenceGapMs))
    await playChord(audioEnd, chordDuration)
  }

  const startLabel = labels?.start ?? 'Start'
  const pivotLabel = labels?.pivot ?? (type === 'pivot' ? 'Pivot' : 'Shift')
  const endLabel = labels?.end ?? 'Arrive'

  const connector = type === 'pivot' ? '→' : '⇒'
  const connectorColor = type === 'pivot' ? T.inkMuted : T.highlightAccent

  // Reserve enough horizontal slots for the widest sibling's key signature
  // so all three staves render at the same total width. The optional
  // `reserveAccidentalSlots` prop lets a sibling progression force a
  // larger reservation (e.g. so two paired examples on the same page
  // share staff dimensions even when their key signatures differ).
  const maxAccidentalSlots = Math.max(
    Math.abs(startKey),
    Math.abs(pivotKey ?? 0),
    Math.abs(endKey),
    reserveAccidentalSlots ?? 0,
  )

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Zone
          accidentals={startKey}
          chord={startChord}
          label={startLabel}
          highlightChord={false}
          size={size}
          onPlay={playStart}
          reserveAccidentalSlots={maxAccidentalSlots}
        />
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 24,
            color: connectorColor,
            alignSelf: 'center',
            margin: '40px 0 0 0',
            flex: '0 0 auto',
          }}
          aria-hidden
        >
          {connector}
        </div>
        <Zone
          accidentals={pivotKey ?? 0}
          chord={pivotChord}
          label={pivotLabel}
          highlightChord
          size={size}
          onPlay={playPivot}
          reserveAccidentalSlots={maxAccidentalSlots}
        />
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 24,
            color: connectorColor,
            alignSelf: 'center',
            margin: '40px 0 0 0',
            flex: '0 0 auto',
          }}
          aria-hidden
        >
          {connector}
        </div>
        <Zone
          accidentals={endKey}
          chord={endChord}
          label={endLabel}
          highlightChord={false}
          size={size}
          onPlay={playEnd}
          reserveAccidentalSlots={maxAccidentalSlots}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <button
          onClick={playSequence}
          style={{
            fontFamily: T.fontLabel,
            fontSize: 13,
            color: T.bgPaper,
            background: T.ink,
            border: 'none',
            padding: '8px 18px',
            borderRadius: 4,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Play sequence
        </button>
      </div>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
