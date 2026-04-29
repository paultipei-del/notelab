'use client'

import React from 'react'
import { Staff, NoteHead, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { midiToPitch, aggregateBounds, type Clef } from '@/lib/learn/visuals/pitch'

/**
 * Per-partial semitone offset AND conventional letter-name spelling, indexed by
 * partial number minus 1. We can't rely on `midiToPitch` here because it defaults
 * to sharp spellings (A♯), but conventional overtone notation uses flats for
 * the 7th, 14th partials etc. (B♭) and the sharp spelling F♯ for the 11th.
 *
 * Letter strings use ASCII (`b`, `#`) since that's what `parsePitch` in pitch.ts
 * accepts: regex /^([A-G])(##|bb|#|b|n)?(-?\d+)$/.
 *
 * The letter map below assumes a C fundamental. For other fundamentals, the
 * letter map would need adjusting — for now this component only supports
 * C-rooted fundamentals, which matches the lesson's pedagogy.
 */
const PARTIAL_SPELLINGS: Array<{ offset: number; letter: string }> = [
  { offset: 0,  letter: 'C' },   //  1: fundamental
  { offset: 12, letter: 'C' },   //  2: octave
  { offset: 19, letter: 'G' },   //  3: octave + P5
  { offset: 24, letter: 'C' },   //  4: 2 octaves
  { offset: 28, letter: 'E' },   //  5: 2 octaves + M3
  { offset: 31, letter: 'G' },   //  6: 2 octaves + P5
  { offset: 34, letter: 'Bb' },  //  7: minor 7th — conventional B♭ spelling
  { offset: 36, letter: 'C' },   //  8: 3 octaves
  { offset: 38, letter: 'D' },   //  9: 3 octaves + M2
  { offset: 40, letter: 'E' },   // 10: 3 octaves + M3
  { offset: 42, letter: 'F#' },  // 11: tritone — conventional F♯ spelling
  { offset: 43, letter: 'G' },   // 12: 3 octaves + P5
  { offset: 45, letter: 'A' },   // 13: 3 octaves + M6
  { offset: 46, letter: 'Bb' },  // 14: minor 7th — conventional B♭ spelling
  { offset: 47, letter: 'B' },   // 15: 3 octaves + M7
  { offset: 48, letter: 'C' },   // 16: 4 octaves
]

interface OvertoneSeriesProps {
  /** MIDI of the fundamental. Default 36 (C2). */
  fundamental?: number
  /** Number of partials to display, 1-16. Default 8. */
  partialCount?: number
  /** Show audio interaction (click notes to play). Default true. */
  showAudio?: boolean
  size?: LearnSize
  caption?: string
}

export function OvertoneSeries({
  fundamental = 36,
  partialCount = 8,
  showAudio = true,
  size = 'inline',
  caption,
}: OvertoneSeriesProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  // Compute partial MIDIs and conventional pitch spellings.
  // Standard MIDI octave convention: MIDI 60 = C4, so octave = floor(midi / 12) - 1.
  // This works for every spelling in PARTIAL_SPELLINGS over a C fundamental:
  // Bb4 (MIDI 70): floor(70/12) - 1 = 5 - 1 = 4 ✓
  // F#5 (MIDI 78): floor(78/12) - 1 = 6 - 1 = 5 ✓
  // Bb5 (MIDI 82): floor(82/12) - 1 = 6 - 1 = 5 ✓
  const clamped = Math.max(1, Math.min(16, partialCount))
  const partials = PARTIAL_SPELLINGS.slice(0, clamped)
  const partialMidis = partials.map(p => fundamental + p.offset)
  const partialPitches = partials.map((p, i) => {
    const octave = Math.floor(partialMidis[i] / 12) - 1
    return `${p.letter}${octave}`
  })

  // Layout
  const margin = Math.round(20 * T.scale + 8)
  // Each partial needs generous horizontal room. At inline scale (0.6), 16 partials
  // should occupy ~600 px of staff. So 600/16 ≈ 38 px per partial at scale=0.6,
  // which means 38 / 0.6 ≈ 63 unscaled px per partial. Plus ~100 unscaled px for
  // clef and trailing margin.
  const innerWidth = Math.round((100 + 63 * clamped) * T.scale)
  const staffX = margin
  const staffWidth = innerWidth
  const noteAreaX = staffX + T.clefReserve
  const noteAreaWidth = staffWidth - T.clefReserve - margin
  const noteSpacing = noteAreaWidth / clamped
  const noteXs = partialMidis.map((_, i) => noteAreaX + (i + 0.5) * noteSpacing)

  // Grand staff: treble above, bass below.
  // Compute bounds for both clefs to determine vertical layout.
  // Notes ≥ MIDI 60 go on treble, else bass.
  const treblePitches = partialPitches.filter((_, i) => partialMidis[i] >= 60)
  const bassPitches = partialPitches.filter((_, i) => partialMidis[i] < 60)

  // Provisional bounds with staffY=0 to find headroom
  const trebleProvisional = treblePitches.length > 0
    ? aggregateBounds(treblePitches, 0, 'treble', T)
    : { top: 0, bottom: 0 }
  const bassProvisional = bassPitches.length > 0
    ? aggregateBounds(bassPitches, 0, 'bass', T)
    : { top: 0, bottom: 0 }

  // Reserve top headroom for treble notes that go above the staff (ledger lines)
  // PLUS additional room for the partial-number labels which sit above all noteheads.
  const trebleHeadroom = Math.max(0, -trebleProvisional.top)
  // Labels need room above the topmost notehead, not just above the staff.
  const partialLabelSpace = T.labelFontSize + 12
  // Extra buffer between label baseline and topmost notehead so they don't touch.
  const labelToNoteBuffer = Math.round(8 * T.scale)

  const trebleStaffY = margin + trebleHeadroom + partialLabelSpace + labelToNoteBuffer
  const trebleStaffHeight = T.step * 8 // 5 lines = 4 spaces × 2 step
  const grandStaffGap = Math.round(40 * T.scale)
  const bassStaffY = trebleStaffY + trebleStaffHeight + grandStaffGap

  // Final bounds
  const trebleBounds = treblePitches.length > 0
    ? aggregateBounds(treblePitches, trebleStaffY, 'treble', T)
    : { top: trebleStaffY, bottom: trebleStaffY + trebleStaffHeight }
  const bassBounds = bassPitches.length > 0
    ? aggregateBounds(bassPitches, bassStaffY, 'bass', T)
    : { top: bassStaffY, bottom: bassStaffY + trebleStaffHeight }

  const totalH = Math.max(bassBounds.bottom, bassStaffY + trebleStaffHeight) + margin
  const totalW = staffX + staffWidth + margin

  const handleNotePlay = async (midi: number) => {
    setInteracted(true)
    flash(midi)
    await play(midiToPitch(midi))
  }

  // Render each partial: choose clef based on midi, place at noteXs[i]
  const renderedNotes = partialMidis.map((midi, i) => {
    const clef: Clef = midi >= 60 ? 'treble' : 'bass'
    const staffTop = clef === 'treble' ? trebleStaffY : bassStaffY
    const x = noteXs[i]
    const pitch = partialPitches[i]
    return { midi, pitch, clef, staffTop, x, index: i }
  })

  // Partial number labels — sit at a y that's above the topmost notehead.
  // trebleBounds.top already accounts for ledger lines above the staff
  // (it's the highest extent of any treble notehead, fed through noteBounds).
  const topNoteY = treblePitches.length > 0 ? trebleBounds.top : trebleStaffY
  const labelY = topNoteY - labelToNoteBuffer

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `The first ${clamped} partials above ${midiToPitch(fundamental)}`}
      >
        {/* Treble staff */}
        <Staff clef="treble" x={staffX} y={trebleStaffY} width={staffWidth} T={T} />
        {/* Bass staff */}
        <Staff clef="bass" x={staffX} y={bassStaffY} width={staffWidth} T={T} />

        {/* Render each partial's notehead */}
        {renderedNotes.map(({ midi, pitch, clef, staffTop, x, index }) => (
          <NoteHead
            key={midi}
            pitch={pitch}
            staffTop={staffTop}
            x={x}
            clef={clef}
            T={T}
            highlight={highlightedMidis.includes(midi)}
            onMouseEnter={() => highlight(midi)}
            onMouseLeave={() => highlight(null)}
            onClick={() => handleNotePlay(midi)}
            ariaLabel={`Partial ${index + 1}, ${pitch}`}
          />
        ))}

        {/* Partial number labels */}
        {renderedNotes.map(({ midi, x, index }) => (
          <text
            key={`label-${midi}`}
            x={x} y={labelY}
            fontSize={T.smallLabelFontSize}
            fontFamily={T.fontLabel}
            fill={T.inkSubtle}
            textAnchor="middle"
            fontWeight={500}
          >
            {index + 1}
          </text>
        ))}
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
