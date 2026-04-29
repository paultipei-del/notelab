'use client'

import React from 'react'
import {
  Staff, NoteHead, Keyboard, Caption, useNoteHighlight,
} from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import {
  parsePitch, staffPosition, midiToPitch, type Clef,
} from '@/lib/learn/visuals/pitch'

interface ChordExplorerProps {
  /** Pitches of the chord, ordered low to high (e.g. ['C4', 'E4', 'G4']). */
  pitches: string[]
  /** Clef. Default auto-picked from the lowest pitch. */
  clef?: Clef
  size?: LearnSize
  showStaff?: boolean
  showKeyboard?: boolean
  showAudio?: boolean
  caption?: string
}

export function ChordExplorer({
  pitches,
  clef,
  size = 'inline',
  showStaff = true,
  showKeyboard = true,
  showAudio = true,
  caption,
}: ChordExplorerProps) {
  const T = tokensFor(size)
  const { ready, play, playChord } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  // Parse pitches; bail early if any fail
  const parsed = pitches.map(p => parsePitch(p)).filter((p): p is NonNullable<typeof p> => p !== null)
  if (parsed.length === 0) return null

  const midis = parsed.map(p => p.midi)
  const lowestMidi = Math.min(...midis)
  const highestMidi = Math.max(...midis)

  const resolvedClef: Clef = clef ?? (lowestMidi >= 60 ? 'treble' : 'bass')

  // Layout — chord renders at a single x position with all noteheads stacked
  const margin = Math.round(20 * T.scale + 8)
  // When the keyboard is shown, the staff matches keyboard width so visual elements align.
  // When not, the staff shrinks to clef + chord + breathing room — important for compact
  // layouts like side-by-side comparison rows.
  const compactStaffWidth = T.clefReserve + Math.round(140 * T.scale)
  const innerWidth = showKeyboard
    ? Math.max(420, T.keyboardWhiteKeyWidth * 7 + 80)
    : compactStaffWidth
  const staffX = margin
  const staffWidth = innerWidth

  // Chord x-position: just past the clef, centered in the remaining staff area for visual weight
  const chordX = staffX + T.clefReserve + (staffWidth - T.clefReserve - margin) * 0.35

  // Compute headroom from highest note's vertical position
  const positions = parsed.map(p => staffPosition(p, resolvedClef))
  const minPos = Math.min(...positions)   // smallest pos = highest note (since pos increases downward)
  const maxPos = Math.max(...positions)
  // Headroom from highest notehead + ledger reach + half-notehead height
  const provisionalHigh = (minPos < 0 ? minPos * T.step : 0) - T.noteheadHalfHeight
  const headroom = Math.max(0, -provisionalHigh)
  const staffY = margin + headroom

  // Stem logic for the chord: position relative to outermost note vs middle line.
  // Convention: stems go up if the lowest note is below middle (maxPos > 4), else down.
  const stemUp = maxPos > 4
  // Stem x-offset attaches to side opposite the noteheads.
  const stemX = stemUp ? chordX + T.stemXOffset : chordX - T.stemXOffset
  // Stem anchors at the outermost note in the stem direction. Extends past it by
  // the standard single-note stem length, plus HALF the chord span — strict
  // engraving would use the full span (keeping visible stem above the topmost note
  // constant), but in isolated pedagogical figures that reads as top-heavy.
  // Half-span is a compromise: single notes get the full standard stem; wider
  // chords gain proportionally less, keeping the figure visually balanced.
  const chordSpan = (maxPos - minPos) * T.step
  const stemAnchorPos = stemUp ? maxPos : minPos
  const stemAnchorY = staffY + stemAnchorPos * T.step
  const stemExtension = T.stemLength + chordSpan * 0.5
  const stemTipY = stemUp
    ? stemAnchorY - stemExtension
    : stemAnchorY + stemExtension

    // Engraving rule for chord noteheads a 2nd apart:
    // Notes one staff position apart cannot share an x-coordinate. They must
    // straddle the stem.
    //
    // Convention (Gould "Behind Bars", Ross "Art of Music Engraving"):
    //   stem-up:   normal side = LEFT of stem.  displaced side = RIGHT of stem.
    //   stem-down: normal side = RIGHT of stem. displaced side = LEFT of stem.
    //
    // Walk order: ANCHOR -> TIP. For stem-up the anchor is the lowest note
    // (largest staffPos), so walk from largest pos to smallest. For stem-down
    // the anchor is the highest note (smallest pos), so walk from smallest to
    // largest. The first (anchor) note is always on normal. As we walk, every
    // note that's a 2nd from its neighbor in walk-order alternates sides.
    //
    // staffPos convention here: smaller pos = higher pitch on the staff.
    // (This matches the existing `positions` array used elsewhere in this file.)
    const noteheadWidth = Math.round(11 * T.scale)
    const displacementOffset = stemUp ? noteheadWidth : -noteheadWidth
    const noteXs: number[] = parsed.map(() => chordX)
    const isDisplaced: boolean[] = parsed.map(() => false)

    // Build walk order from ANCHOR side toward TIP side.
    const indices = parsed.map((_, i) => i)
    const walkOrder = stemUp
      ? indices.slice().sort((a, b) => positions[b] - positions[a])  // bottom-to-top: largest pos first
      : indices.slice().sort((a, b) => positions[a] - positions[b])  // top-to-bottom: smallest pos first

    for (let w = 1; w < walkOrder.length; w++) {
      const currentIdx = walkOrder[w]
      const prevIdx = walkOrder[w - 1]
      const positionDiff = Math.abs(positions[currentIdx] - positions[prevIdx])
      // Only displace if a 2nd AND the previous note is on the normal side.
      // If the previous one was displaced, the current goes back to normal —
      // alternation handles clusters like C-D-E correctly.
      if (positionDiff === 1 && !isDisplaced[prevIdx]) {
        isDisplaced[currentIdx] = true
        noteXs[currentIdx] = chordX + displacementOffset
      }
    }

  // Vertical extent for layout: track lowest visible pixel below staff
  const staffBottom = staffY + 8 * T.step
  const lowestNoteY = staffY + maxPos * T.step + T.noteheadHalfHeight
  const stemBottomY = stemUp ? stemAnchorY : stemTipY
  const ledgerBottomY = maxPos > 8 ? staffY + maxPos * T.step : staffBottom
  let cursorY = Math.max(staffBottom, lowestNoteY, stemBottomY, ledgerBottomY) + T.annotationBuffer

  const keyboardGap = Math.max(20, T.step * 2.5)
  const keyboardWidth = T.keyboardWhiteKeyWidth * 8
  const keyboardX = staffX + (staffWidth - keyboardWidth) / 2

  // Keyboard range: one octave starting at lowest C below the lowest chord note
  const keyboardStart = Math.floor(lowestMidi / 12) * 12
  const keyboardEnd = keyboardStart + 12

  const keyboardY = showKeyboard
    ? (showStaff ? cursorY + keyboardGap : margin)
    : cursorY

  const totalH = showKeyboard
    ? keyboardY + T.keyboardWhiteKeyHeight + margin
    : cursorY + margin
  const totalW = staffX + staffWidth + margin

  const handleNoteClick = async (midi: number) => {
    setInteracted(true)
    flash(midi)
    await play(midiToPitch(midi))
  }

  const handlePlayChord = async () => {
    setInteracted(true)
    midis.forEach(m => flash(m, 1200))
    await playChord(pitches)
  }

  const handleArpeggiate = async () => {
    setInteracted(true)
    midis.forEach((m, i) => setTimeout(() => flash(m, 600), i * 200))
    // Sequence ascending
    for (let i = 0; i < pitches.length; i++) {
      setTimeout(() => { void play(pitches[i]) }, i * 200)
    }
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? `Chord: ${pitches.join(', ')}`}
      >
        {showStaff && (
          <>
            <Staff clef={resolvedClef} x={staffX} y={staffY} width={staffWidth} T={T} />
            {/* Render noteheads with stems suppressed */}
            {parsed.map((p, i) => (
              <NoteHead
                key={p.midi}
                pitch={pitches[i]}
                staffTop={staffY}
                x={noteXs[i]}
                clef={resolvedClef}
                T={T}
                noStem
                highlight={highlightedMidis.includes(p.midi)}
                onMouseEnter={() => highlight(p.midi)}
                onMouseLeave={() => highlight(null)}
                onClick={() => handleNoteClick(p.midi)}
                ariaLabel={pitches[i]}
              />
            ))}
            {/* Single shared stem for the whole chord */}
            <line
              x1={stemX} y1={stemAnchorY}
              x2={stemX} y2={stemTipY}
              stroke={T.ink}
              strokeWidth={T.stemStroke}
            />
          </>
        )}
        {showKeyboard && (
          <Keyboard
            startMidi={keyboardStart}
            endMidi={keyboardEnd}
            x={keyboardX}
            y={keyboardY}
            T={T}
            highlightedMidis={Array.from(new Set([...midis, ...highlightedMidis]))}
            onKeyEnter={(midi) => highlight(midi)}
            onKeyLeave={() => highlight(null)}
            onKeyClick={(midi) => handleNoteClick(midi)}
            showLabels="c-only"
          />
        )}
      </svg>
      {showAudio && (
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center',
          marginTop: 16, flexWrap: 'wrap',
        }}>
          <button
            onClick={handlePlayChord}
            disabled={interacted && !ready}
            style={btnStyle(T, interacted && !ready)}
          >
            Play chord
          </button>
          <button
            onClick={handleArpeggiate}
            disabled={interacted && !ready}
            style={btnStyle(T, interacted && !ready)}
          >
            Arpeggiate
          </button>
          {interacted && !ready && (
            <span style={{
              fontFamily: T.fontLabel,
              fontSize: T.smallLabelFontSize,
              color: T.inkSubtle,
              fontStyle: 'italic',
            }}>
              Loading piano samples…
            </span>
          )}
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}

const btnStyle = (
  T: ReturnType<typeof tokensFor>,
  loading: boolean = false,
): React.CSSProperties => ({
  fontFamily: T.fontLabel,
  fontSize: 13,
  padding: '8px 18px',
  background: 'transparent',
  border: `0.5px solid ${T.ink}`,
  borderRadius: 8,
  cursor: loading ? 'wait' : 'pointer',
  color: T.ink,
  opacity: loading ? 0.5 : 1,
  transition: 'background 150ms ease, opacity 150ms ease',
})
