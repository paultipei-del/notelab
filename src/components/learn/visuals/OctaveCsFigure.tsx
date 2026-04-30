'use client'

import React from 'react'
import { Staff, NoteHead, Keyboard, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, aggregateBounds, midiToPitch, type Clef } from '@/lib/learn/visuals/pitch'

interface OctaveCsFigureProps {
  /** Pitches to plot on the grand staff. */
  pitches: string[]
  /** Optional per-note labels (e.g. "C2", "C4"). */
  labels?: string[]
  /** Lowest piano key to render (default A0 = 21). */
  startMidi?: number
  /** Highest piano key to render (default C8 = 108). */
  endMidi?: number
  /** Wider keys read better; default 18 (vs. 14 before). */
  whiteKeyWidth?: number
  /** Label mode for the keyboard. */
  showKeyboardLabels?: 'none' | 'c-only' | 'all' | 'all-c-with-octave'
  size?: LearnSize
  caption?: string
}

/**
 * Grand-staff notation + full piano keyboard with SHARED highlight state.
 * Click any notehead OR any key — both flash, the sample plays, and the
 * link between staff position and physical key is visible at a glance.
 *
 * Built specifically for the Octave Designations lesson; the keyboard is
 * rendered wider than KeyboardFigure's default so the labelled Cs read
 * clearly across the full piano range.
 */
export function OctaveCsFigure({
  pitches,
  labels,
  startMidi = 21,
  endMidi = 108,
  whiteKeyWidth = 18,
  showKeyboardLabels = 'all-c-with-octave',
  size = 'inline',
  caption,
}: OctaveCsFigureProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const [activeMidi, setActiveMidi] = React.useState<number | null>(null)

  const flashAt = (midi: number) => {
    setActiveMidi(midi)
    setTimeout(() => {
      setActiveMidi(curr => (curr === midi ? null : curr))
    }, 600)
  }

  const handlePlay = (midi: number, pitch: string) => {
    setInteracted(true)
    flashAt(midi)
    void play(pitch)
  }

  // ---- Staff layout ----
  const parsed = pitches.map(p => parsePitch(p))
  const validIndices = parsed.map((p, i) => (p ? i : -1)).filter(i => i >= 0)
  const validPitches = validIndices.map(i => pitches[i])
  const midis = validIndices.map(i => parsed[i]!.midi)

  const margin = Math.round(20 * T.scale + 8)
  const braceReserve = Math.round(34 * T.scale)

  const isWhite = (m: number) => [0, 2, 4, 5, 7, 9, 11].includes(((m % 12) + 12) % 12)
  let whiteCount = 0
  for (let m = startMidi; m <= endMidi; m++) {
    if (isWhite(m)) whiteCount++
  }
  const keyboardW = whiteKeyWidth * whiteCount
  const keyboardX = margin + braceReserve

  // Map each pitch's notehead to the EXACT x of its corresponding key on
  // the keyboard below — the whole point of this figure is the alignment.
  const keyXForMidi = (midi: number): number => {
    let whiteIdx = 0
    for (let m = startMidi; m < midi; m++) {
      if (isWhite(m)) whiteIdx++
    }
    if (isWhite(midi)) {
      return keyboardX + whiteIdx * whiteKeyWidth + whiteKeyWidth / 2
    }
    return keyboardX + whiteIdx * whiteKeyWidth
  }
  const noteXs = pitches.map((_, i) => {
    const m = parsed[i]?.midi
    return m !== undefined ? keyXForMidi(m) : margin
  })

  // Trim the staff to fit only the noteheads + clef + small trailing pad.
  // The staff sits at its own x range; the keyboard remains at its full
  // width. Notehead x's stay anchored to the keyboard positions, so
  // vertical alignment is preserved.
  const noteHeadroomLeft = Math.round(80 * T.scale)
  const noteTailroomRight = Math.round(140 * T.scale)
  const validNoteXs = noteXs.filter(x => x !== margin)
  const leftmostNoteX = validNoteXs.length > 0 ? Math.min(...validNoteXs) : keyboardX
  const rightmostNoteX = validNoteXs.length > 0 ? Math.max(...validNoteXs) : keyboardX + keyboardW
  const staffX = Math.max(margin + braceReserve, leftmostNoteX - T.clefReserve - noteHeadroomLeft)
  const staffWidth = (rightmostNoteX + noteTailroomRight) - staffX

  const noteClefs: Clef[] = midis.map(m => (m >= 60 ? 'treble' : 'bass'))
  const treblePitches = validPitches.filter((_, i) => noteClefs[i] === 'treble')
  const bassPitches = validPitches.filter((_, i) => noteClefs[i] === 'bass')

  const trebleProvisional = treblePitches.length > 0
    ? aggregateBounds(treblePitches, 0, 'treble', T)
    : { top: 0, bottom: 0 }
  const trebleHeadroom = Math.max(0, -trebleProvisional.top)
  const trebleStaffY = margin + trebleHeadroom
  const trebleStaffHeight = T.step * 8
  const grandStaffGap = Math.round(96 * T.scale)
  const bassStaffY = trebleStaffY + trebleStaffHeight + grandStaffGap

  const bassBounds = bassPitches.length > 0
    ? aggregateBounds(bassPitches, bassStaffY, 'bass', T)
    : { top: bassStaffY, bottom: bassStaffY + trebleStaffHeight }

  const lowestStaffY = Math.max(bassBounds.bottom, bassStaffY + trebleStaffHeight)
  const labelFontSize = Math.round(T.labelFontSize * 1.0)
  const labelRowSpace = labels && labels.length > 0
    ? labelFontSize + Math.round(12 * T.scale)
    : 0
  const staffLabelY = lowestStaffY + Math.round(12 * T.scale) + labelFontSize * 0.5

  // ---- Keyboard layout (below the staff) ----
  const keyboardGap = Math.round(36 * T.scale)
  const keyboardY = lowestStaffY + labelRowSpace + keyboardGap
  const keyboardH = T.keyboardWhiteKeyHeight
  // keyboardX is already declared above (= staffX)

  const totalH = keyboardY + keyboardH + margin
  // Width is dominated by the keyboard now that the staff is trimmed.
  const totalW = Math.max(staffX + staffWidth, keyboardX + keyboardW) + margin

  const activeMidisArr = activeMidi !== null ? [activeMidi] : []

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Octave designations on a staff and piano keyboard'}
      >
        {/* Grand-staff brace + left barline */}
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
        <Staff clef="treble" x={staffX} y={trebleStaffY} width={staffWidth} T={T} />
        <Staff clef="bass" x={staffX} y={bassStaffY} width={staffWidth} T={T} />

        {validIndices.map((origIdx, i) => {
          const noteClef = noteClefs[i]
          const staffTop = noteClef === 'treble' ? trebleStaffY : bassStaffY
          const midi = midis[i]
          return (
            <NoteHead
              key={`${midi}-${i}`}
              pitch={validPitches[i]}
              staffTop={staffTop}
              x={noteXs[origIdx]}
              clef={noteClef}
              T={T}
              duration="whole"
              highlight={activeMidi === midi}
              onClick={() => handlePlay(midi, validPitches[i])}
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
              y={staffLabelY}
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

        <Keyboard
          startMidi={startMidi}
          endMidi={endMidi}
          x={keyboardX}
          y={keyboardY}
          T={T}
          whiteKeyWidthOverride={whiteKeyWidth}
          showLabels={showKeyboardLabels}
          highlightedMidis={activeMidisArr}
          onKeyClick={(midi, pitch) => handlePlay(midi, pitch)}
        />
      </svg>
      {interacted && !ready && (
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
