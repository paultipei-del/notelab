'use client'

import React from 'react'
import { Staff, NoteHead, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, aggregateBounds, type Clef } from '@/lib/learn/visuals/pitch'

interface NoteSequenceProps {
  /** Array of pitch strings, e.g. ['C2','C3','C4','C5']. ASCII notation. */
  pitches: string[]
  /** Optional per-note label rendered below each notehead (e.g. frequency strings). */
  labels?: string[]
  /**
   * Force a clef. 'grand' uses both staves and routes by MIDI. Default: auto —
   * grand staff if any pitch is below MIDI 60, otherwise treble.
   */
  clef?: Clef | 'grand'
  /**
   * Optional per-note clef override (only meaningful in grand mode). Lets you
   * place the same MIDI on either staff — e.g. middle C on the treble OR on
   * the bass staff. Length must match `pitches`; missing entries fall back
   * to the auto MIDI≥60 routing.
   */
  noteClefs?: Array<Clef | undefined>
  /** Note glyph: 'whole' (no stem), 'half' (open notehead + stem), 'quarter' (filled + stem). Default 'whole'. */
  duration?: 'whole' | 'half' | 'quarter'
  size?: LearnSize
  showAudio?: boolean
  caption?: string
}

export function NoteSequence({
  pitches,
  labels,
  clef,
  noteClefs: noteClefOverrides,
  duration = 'whole',
  size = 'inline',
  showAudio = true,
  caption,
}: NoteSequenceProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  const parsed = pitches.map(p => parsePitch(p))
  const validIndices = parsed
    .map((p, i) => (p ? i : -1))
    .filter(i => i >= 0)
  if (validIndices.length === 0) return null

  const midis = validIndices.map(i => parsed[i]!.midi)
  const validPitches = validIndices.map(i => pitches[i])

  // Decide layout
  const hasBassOverride = noteClefOverrides?.some(c => c === 'bass') ?? false
  const useGrand = clef === 'grand'
    || (clef === undefined && (midis.some(m => m < 60) || hasBassOverride))
  const fallbackClef: Clef = clef && clef !== 'grand'
    ? clef
    : (useGrand ? 'treble' : 'treble')

  // Per-note clef routing. In grand mode, an explicit override per pitch wins
  // over the MIDI≥60 auto-routing — lets the same pitch land on either staff.
  const noteClefs: Clef[] = midis.map((m, k) => {
    const origIdx = validIndices[k]
    if (clef && clef !== 'grand') return clef
    if (useGrand) {
      const override = noteClefOverrides?.[origIdx]
      if (override === 'treble' || override === 'bass') return override
      return m >= 60 ? 'treble' : 'bass'
    }
    return fallbackClef
  })

  // Layout
  const margin = Math.round(20 * T.scale + 8)
  // Reserve horizontal room left of the staff for the grand-staff brace and barline.
  const braceReserve = useGrand ? Math.round(34 * T.scale) : 0
  // Minimum width scales with note count so very short sequences (e.g. just two
  // notes for an enharmonic comparison) don't render absurdly wide.
  const minInnerWidth = pitches.length <= 2 ? 200 : pitches.length <= 4 ? 300 : 380
  // Per-note spacing: generous for short sequences, tighter for long ones so a
  // 29-note alphabet doesn't get squeezed visually small inside the article width.
  const perNote = pitches.length <= 8 ? 80 : pitches.length <= 16 ? 64 : 52
  const innerWidth = Math.max(minInnerWidth, Math.round((100 + perNote * pitches.length) * T.scale))
  const staffX = margin + braceReserve
  const staffWidth = innerWidth
  const noteAreaX = staffX + T.clefReserve
  const noteAreaWidth = staffWidth - T.clefReserve - margin
  const noteSpacing = noteAreaWidth / pitches.length
  const noteXs = pitches.map((_, i) => noteAreaX + (i + 0.5) * noteSpacing)

  // Bounds for each staff
  const treblePitches = validPitches.filter((_, i) => noteClefs[i] === 'treble')
  const bassPitches = validPitches.filter((_, i) => noteClefs[i] === 'bass')

  const trebleProvisional = treblePitches.length > 0
    ? aggregateBounds(treblePitches, 0, 'treble', T)
    : { top: 0, bottom: 0 }
  const bassProvisional = bassPitches.length > 0
    ? aggregateBounds(bassPitches, 0, 'bass', T)
    : { top: 0, bottom: 0 }

  const trebleHeadroom = Math.max(0, -trebleProvisional.top)
  const trebleStaffY = margin + trebleHeadroom
  const trebleStaffHeight = T.step * 8
  // Generous gap between the two staves so the brace reads cleanly and ledger
  // lines (e.g. middle C below the treble staff) have breathing room.
  const grandStaffGap = Math.round(96 * T.scale)
  const bassStaffY = useGrand ? trebleStaffY + trebleStaffHeight + grandStaffGap : trebleStaffY

  const trebleBounds = treblePitches.length > 0
    ? aggregateBounds(treblePitches, trebleStaffY, 'treble', T)
    : { top: trebleStaffY, bottom: trebleStaffY + trebleStaffHeight }
  const bassBounds = bassPitches.length > 0
    ? aggregateBounds(bassPitches, bassStaffY, 'bass', T)
    : { top: bassStaffY, bottom: bassStaffY + trebleStaffHeight }

  const lowestY = Math.max(
    bassBounds.bottom,
    bassStaffY + trebleStaffHeight,
    trebleBounds.bottom,
  )
  // Labels: smaller than before so longer Hz strings (e.g. "1046.5 Hz") have
  // breathing room between adjacent notes without overlapping.
  const labelFontSize = Math.round(T.labelFontSize * 1.0)
  const labelRowSpace = labels && labels.length > 0
    ? labelFontSize + Math.round(12 * T.scale)
    : 0
  const totalH = lowestY + labelRowSpace + margin
  const totalW = staffX + staffWidth + margin
  const labelY = lowestY + Math.round(12 * T.scale) + labelFontSize * 0.5

  const handleNotePlay = async (idx: number) => {
    setInteracted(true)
    flash(midis[idx])
    await play(validPitches[idx])
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `Sequence: ${validPitches.join(', ')}`}
      >
        {useGrand && (
          <>
            <line
              x1={staffX}
              y1={trebleStaffY}
              x2={staffX}
              y2={bassStaffY + 8 * T.step}
              stroke={T.ink}
              strokeWidth={T.graceLineStroke}
            />
            <text
              x={staffX - 8}
              y={bassStaffY + 8 * T.step}
              fontSize={(bassStaffY + 8 * T.step) - trebleStaffY}
              fontFamily={T.fontMusic}
              fill={T.ink}
              textAnchor="middle"
              dominantBaseline="auto"
            >
              {T.braceGlyph}
            </text>
          </>
        )}
        <Staff clef="treble" x={staffX} y={trebleStaffY} width={staffWidth} T={T} />
        {useGrand && (
          <Staff clef="bass" x={staffX} y={bassStaffY} width={staffWidth} T={T} />
        )}

        {validIndices.map((origIdx, i) => {
          const noteClef = noteClefs[i]
          const staffTop = noteClef === 'treble' ? trebleStaffY : bassStaffY
          return (
            <NoteHead
              key={`${midis[i]}-${i}`}
              pitch={validPitches[i]}
              staffTop={staffTop}
              x={noteXs[origIdx]}
              clef={noteClef}
              T={T}
              duration={duration}
              highlight={highlightedMidis.includes(midis[i])}
              onMouseEnter={() => highlight(midis[i])}
              onMouseLeave={() => highlight(null)}
              onClick={() => handleNotePlay(i)}
              ariaLabel={validPitches[i]}
            />
          )
        })}

        {labels && labels.map((label, origIdx) => {
          if (!label) return null
          return (
            <text
              key={`label-${origIdx}`}
              x={noteXs[origIdx]}
              y={labelY}
              fontSize={labelFontSize}
              fontFamily={T.fontLabel}
              fill={T.ink}
              fontWeight={600}
              textAnchor="middle"
            >
              {label}
            </text>
          )
        })}
      </svg>
      {showAudio && interacted && !ready && (
        <div style={{
          fontFamily: T.fontLabel,
          fontSize: T.smallLabelFontSize,
          color: T.inkSubtle,
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: 8,
        }}>
          Loading piano samples…
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
