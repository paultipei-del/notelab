'use client'

import React from 'react'
import {
  Staff, NoteHead, Keyboard, Caption, useNoteHighlight,
} from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import {
  parsePitch, staffPosition, midiToPitch, type Clef, type ParsedPitch,
} from '@/lib/learn/visuals/pitch'
import {
  engraveChord, accidentalColumnX, type EngravedChord,
} from '@/lib/learn/visuals/chord-engraving'

type ChordClef = Clef | 'grand'

interface ChordExplorerProps {
  /** Pitches of the chord, ordered low to high (e.g. ['C4', 'E4', 'G4']). */
  pitches: string[]
  /**
   * Clef. 'grand' renders BOTH treble + bass staves and routes each pitch by
   * MIDI (>= 60 -> treble, else bass). Default auto-picked from the lowest pitch.
   */
  clef?: ChordClef
  size?: LearnSize
  showStaff?: boolean
  showKeyboard?: boolean
  showAudio?: boolean
  /**
   * For 2-note dyads only. When true, swaps the default
   * "Play interval" + "Arpeggiate" pair for three buttons that
   * demonstrate melodic vs harmonic playback of the same interval:
   * Ascending ↑, Descending ↓, Harmonic. Useful on the Melodic and
   * Harmonic Intervals lesson where the same notes are heard three
   * ways. Ignored for chords (3+ notes).
   */
  showMelodicControls?: boolean
  caption?: string
}

interface StaveLayout extends EngravedChord {
  clef: Clef
  pitches: string[]
}

/**
 * Build per-stave layout — wraps the shared engraveChord helper so the
 * caller still gets the clef + pitches alongside the engraving data.
 */
function buildStave(
  parsed: ParsedPitch[],
  pitches: string[],
  clef: Clef,
  staffY: number,
  chordX: number,
  T: ReturnType<typeof tokensFor>,
): StaveLayout | null {
  const e = engraveChord(parsed, clef, staffY, chordX, T)
  if (!e) return null
  return { ...e, clef, pitches }
}


export function ChordExplorer({
  pitches,
  clef,
  size = 'inline',
  showStaff = true,
  showKeyboard = true,
  showAudio = true,
  showMelodicControls = false,
  caption,
}: ChordExplorerProps) {
  const T = tokensFor(size)
  const { ready, play, playChord, playSequence } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  // Parse pitches; bail early if any fail
  const parsedAll = pitches
    .map((p, i) => ({ p: parsePitch(p), pitch: p, origIdx: i }))
    .filter((x): x is { p: ParsedPitch; pitch: string; origIdx: number } => x.p !== null)
  if (parsedAll.length === 0) return null

  const midis = parsedAll.map(x => x.p.midi)
  const lowestMidi = Math.min(...midis)
  const highestMidi = Math.max(...midis)

  const useGrand = clef === 'grand'
  const resolvedClef: Clef = useGrand
    ? 'treble' // unused when useGrand is true; per-stave branches handle clef
    : (clef as Clef | undefined) ?? (lowestMidi >= 60 ? 'treble' : 'bass')

  // Layout
  const margin = Math.round(20 * T.scale + 8)
  const braceReserve = useGrand ? Math.round(34 * T.scale) : 0
  const compactStaffWidth = T.clefReserve + Math.round(140 * T.scale)
  const innerWidth = showKeyboard
    ? Math.max(420, T.keyboardWhiteKeyWidth * 7 + 80)
    : compactStaffWidth
  const staffX = margin + braceReserve
  const staffWidth = innerWidth

  const postClefStart = staffX + T.clefReserve
  const postClefEnd = staffX + staffWidth
  const chordX = (postClefStart + postClefEnd) / 2

  // ── Headroom (top of staff) ─────────────────────────────────────────
  // Treble headroom is driven by the highest treble note; bass stave's
  // top isn't extended by the bass notes (bass notes cause bottom extension).
  const trebleSubset = useGrand
    ? parsedAll.filter(x => x.p.midi >= 60)
    : (resolvedClef === 'treble' ? parsedAll : [])
  const bassSubset = useGrand
    ? parsedAll.filter(x => x.p.midi < 60)
    : (resolvedClef === 'bass' ? parsedAll : [])

  // For non-grand single-stave, fall back to the existing per-stave subset.
  const singleSubset = useGrand ? null : parsedAll

  // Headroom from highest notehead in the relevant top stave
  const topSubset = useGrand ? trebleSubset : (singleSubset ?? [])
  const topClef: Clef = useGrand ? 'treble' : resolvedClef
  const topPositions = topSubset.map(x => staffPosition(x.p, topClef))
  const topMinPos = topPositions.length > 0 ? Math.min(...topPositions) : 4
  const topMaxPos = topPositions.length > 0 ? Math.max(...topPositions) : 4
  const stemUpTop = topMaxPos > 4
  const stemExtensionTop =
    T.stemLength + ((topMaxPos - topMinPos) * T.step) * 0.5
  const provisionalTopY = topPositions.length > 0
    ? (topMinPos < 0 ? topMinPos * T.step : 0) - T.noteheadHalfHeight - (stemUpTop ? 0 : 0)
    : 0
  // Account for the stem when stem points up out of the staff
  const stemTipExtraTop = stemUpTop && topPositions.length > 0
    ? Math.min(0, topMinPos * T.step - stemExtensionTop)
    : 0
  const headroom = Math.max(0, -Math.min(provisionalTopY, stemTipExtraTop))

  const trebleStaffY = margin + headroom
  const trebleStaffHeight = T.step * 8
  const grandStaffGap = Math.round(96 * T.scale)
  const bassStaffY = useGrand
    ? trebleStaffY + trebleStaffHeight + grandStaffGap
    : trebleStaffY

  // Build the stave layouts.
  let trebleLayout: StaveLayout | null = null
  let bassLayout: StaveLayout | null = null
  let singleLayout: StaveLayout | null = null

  if (useGrand) {
    trebleLayout = buildStave(
      trebleSubset.map(x => x.p),
      trebleSubset.map(x => x.pitch),
      'treble',
      trebleStaffY,
      chordX,
      T,
    )
    bassLayout = buildStave(
      bassSubset.map(x => x.p),
      bassSubset.map(x => x.pitch),
      'bass',
      bassStaffY,
      chordX,
      T,
    )
  } else {
    singleLayout = buildStave(
      parsedAll.map(x => x.p),
      parsedAll.map(x => x.pitch),
      resolvedClef,
      trebleStaffY, // single staff sits at trebleStaffY
      chordX,
      T,
    )
  }

  const lowestStaveBottom = useGrand
    ? Math.max(
        bassLayout?.bottomExtent ?? (bassStaffY + 8 * T.step),
        trebleLayout?.bottomExtent ?? (trebleStaffY + 8 * T.step),
      )
    : (singleLayout?.bottomExtent ?? (trebleStaffY + 8 * T.step))

  let cursorY = lowestStaveBottom + T.annotationBuffer

  const keyboardGap = Math.max(20, T.step * 2.5)
  const keyboardWidth = T.keyboardWhiteKeyWidth * 8
  const keyboardX = staffX + (staffWidth - keyboardWidth) / 2

  const keyboardStart = Math.floor(lowestMidi / 12) * 12
  const keyboardEnd = keyboardStart + 12
  void highestMidi

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
    for (let i = 0; i < pitches.length; i++) {
      setTimeout(() => { void play(pitches[i]) }, i * 200)
    }
  }

  const handleAscending = async () => {
    setInteracted(true)
    const ordered = parsedAll
      .map(x => ({ pitch: x.pitch, midi: x.p.midi }))
      .sort((a, b) => a.midi - b.midi)
    ordered.forEach((n, i) => setTimeout(() => flash(n.midi, 700), i * 380))
    await playSequence(ordered.map(n => n.pitch), 380, '4n')
  }

  const handleDescending = async () => {
    setInteracted(true)
    const ordered = parsedAll
      .map(x => ({ pitch: x.pitch, midi: x.p.midi }))
      .sort((a, b) => b.midi - a.midi)
    ordered.forEach((n, i) => setTimeout(() => flash(n.midi, 700), i * 380))
    await playSequence(ordered.map(n => n.pitch), 380, '4n')
  }

  // Render helper — accidentals column for each stave sits left of leftmost notehead.
  const renderStave = (layout: StaveLayout) => {
    const accCol = accidentalColumnX(layout.noteXs, T)
    return (
      <g key={`stave-${layout.clef}`}>
        {layout.accidentals.map((a, i) => a && (
          <text
            key={`acc-${layout.clef}-${i}-${a.midi}`}
            x={accCol}
            y={a.y}
            fontSize={T.accidentalFontSize}
            fontFamily={T.fontMusic}
            fill={highlightedMidis.includes(a.midi) ? T.highlightAccent : T.ink}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {a.glyph}
          </text>
        ))}
        {layout.parsed.map((p, i) => (
          <NoteHead
            key={`nh-${layout.clef}-${p.midi}-${i}`}
            pitch={layout.pitches[i]}
            staffTop={layout.clef === 'treble' ? trebleStaffY : bassStaffY}
            x={layout.noteXs[i]}
            clef={layout.clef}
            T={T}
            noStem
            noAccidental
            highlight={highlightedMidis.includes(p.midi)}
            onMouseEnter={() => highlight(p.midi)}
            onMouseLeave={() => highlight(null)}
            onClick={() => handleNoteClick(p.midi)}
            ariaLabel={layout.pitches[i]}
          />
        ))}
        {/* Single shared stem only when there is more than one note on this stave;
            isolated noteheads (one per stave in compound intervals) get no stem,
            matching whole-note convention. */}
        {layout.parsed.length > 1 && (
          <line
            x1={layout.stemX} y1={layout.stemAnchorY}
            x2={layout.stemX} y2={layout.stemTipY}
            stroke={T.ink}
            strokeWidth={T.stemStroke}
          />
        )}
      </g>
    )
  }

  return (
    <figure style={{ margin: '24px auto', width: 'fit-content', maxWidth: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? `Chord: ${pitches.join(', ')}`}
      >
        {showStaff && (
          <>
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
            {useGrand ? (
              <>
                <Staff clef="treble" x={staffX} y={trebleStaffY} width={staffWidth} T={T} />
                <Staff clef="bass" x={staffX} y={bassStaffY} width={staffWidth} T={T} />
              </>
            ) : (
              <Staff clef={resolvedClef} x={staffX} y={trebleStaffY} width={staffWidth} T={T} />
            )}
            {useGrand
              ? (
                <>
                  {trebleLayout && renderStave(trebleLayout)}
                  {bassLayout && renderStave(bassLayout)}
                </>
              )
              : singleLayout && renderStave(singleLayout)
            }
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
          {showMelodicControls && pitches.length === 2 ? (
            <>
              <button
                onClick={handleAscending}
                disabled={interacted && !ready}
                style={btnStyle(T, interacted && !ready)}
              >
                Ascending ↑
              </button>
              <button
                onClick={handleDescending}
                disabled={interacted && !ready}
                style={btnStyle(T, interacted && !ready)}
              >
                Descending ↓
              </button>
              <button
                onClick={handlePlayChord}
                disabled={interacted && !ready}
                style={btnStyle(T, interacted && !ready)}
              >
                Harmonic
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePlayChord}
                disabled={interacted && !ready}
                style={btnStyle(T, interacted && !ready)}
              >
                {pitches.length === 2 ? 'Play interval' : 'Play chord'}
              </button>
              <button
                onClick={handleArpeggiate}
                disabled={interacted && !ready}
                style={btnStyle(T, interacted && !ready)}
              >
                Arpeggiate
              </button>
            </>
          )}
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
