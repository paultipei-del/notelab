'use client'

import React from 'react'
import {
  Staff, NoteHead, Keyboard, StepBracket, ScaleDegreeLabel,
  Caption, useNoteHighlight,
} from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { midiToPitch, aggregateBounds, type Clef } from '@/lib/learn/visuals/pitch'

/** Named scale presets. Use `intervals` prop to override with a custom shape. */
export type ScalePreset =
  | 'major'
  | 'natural-minor'
  | 'harmonic-minor'
  | 'melodic-minor'
  | 'pentatonic-major'
  | 'pentatonic-minor'
  | 'blues'
  | 'chromatic'
  | 'whole-tone'

/**
 * Semitone offsets from tonic. All presets end on the octave (12) so the
 * scale visually closes the loop. Melodic minor here is the ascending form
 * (the descending form is just natural minor).
 */
const SCALE_PRESETS: Record<ScalePreset, number[]> = {
  major:               [0, 2, 4, 5, 7, 9, 11, 12],
  'natural-minor':     [0, 2, 3, 5, 7, 8, 10, 12],
  'harmonic-minor':    [0, 2, 3, 5, 7, 8, 11, 12],
  'melodic-minor':     [0, 2, 3, 5, 7, 9, 11, 12],
  'pentatonic-major':  [0, 2, 4, 7, 9, 12],
  'pentatonic-minor':  [0, 3, 5, 7, 10, 12],
  blues:               [0, 3, 5, 6, 7, 10, 12],
  chromatic:           [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  'whole-tone':        [0, 2, 4, 6, 8, 10, 12],
}

const PRESET_NAMES: Record<ScalePreset, string> = {
  major: 'major',
  'natural-minor': 'natural minor',
  'harmonic-minor': 'harmonic minor',
  'melodic-minor': 'melodic minor',
  'pentatonic-major': 'major pentatonic',
  'pentatonic-minor': 'minor pentatonic',
  blues: 'blues',
  chromatic: 'chromatic',
  'whole-tone': 'whole-tone',
}

/**
 * Single-spelling pitch class names. Doesn't account for key context
 * (e.g. always shows D♯ rather than E♭). Good enough for default captions;
 * users who want enharmonic accuracy should pass an explicit caption.
 */
const PITCH_CLASS_NAMES = [
  'C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B',
]

interface ScaleExplorerProps {
  /** MIDI of tonic. Default 60 (C4). */
  tonic?: number
  /** Named scale preset. Default 'major'. Ignored if `intervals` is provided. */
  scale?: ScalePreset
  /**
   * Custom semitone offsets from tonic. Overrides `scale` if provided.
   * Should typically end on 12 (the octave) for visual closure.
   */
  intervals?: number[]
  /**
   * Explicit pitch spellings (e.g. ['C4','Db4','D4',...]). When provided,
   * overrides the auto-derived names from MIDI. Length must match the resolved
   * scale length; if mismatched, a console.warn is emitted and the override
   * is ignored. Use this to spell descending chromatic with flats, or any
   * key-context-sensitive spelling the default sharps-biased namer can't infer.
   */
  pitches?: string[]
  /**
   * Custom labels rendered above each scale degree, e.g. interval names from
   * the tonic (`['unison','M2','M3',...]`). When provided, replaces the
   * default scale-degree row (1, 2, 3...) — they would crowd otherwise.
   * Length must match the resolved scale length; mismatches are ignored
   * (with a console.warn) and the default degree row is used.
   */
  intervalLabels?: string[]
  /**
   * MIDI numbers within the scale to render in muted gray.
   * Used for showing "scale minus omitted notes" pedagogy
   * (e.g. C major pentatonic = C major with F and B dimmed).
   */
  dimmedMidis?: number[]
  /** Clef. Default auto-picked from tonic (treble for >=C4, bass for <C4). */
  clef?: Clef
  size?: LearnSize
  showStaff?: boolean
  showKeyboard?: boolean
  showBrackets?: boolean
  showDegrees?: boolean
  /**
   * How to render scale-degree labels.
   * 'caret' = 1̂ 2̂ 3̂ ... (default, music-theory style)
   * 'roman' = I ii iii ... (chord-function style)
   * 'plain' = 1 2 3 ... (introductory / numeric style)
   */
  degreeVariant?: 'caret' | 'roman' | 'plain'
  showAudio?: boolean
  caption?: string
}

export function ScaleExplorer({
  tonic = 60,
  scale = 'major',
  intervals,
  pitches,
  intervalLabels,
  dimmedMidis = [],
  clef,
  size = 'inline',
  showStaff = true,
  showKeyboard = true,
  showBrackets = true,
  showDegrees = true,
  degreeVariant = 'caret',
  showAudio = true,
  caption,
}: ScaleExplorerProps) {
  const T = tokensFor(size)
  const { ready, play, playSequence } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash, flashSequence } = useNoteHighlight()

  const resolvedIntervals = intervals ?? SCALE_PRESETS[scale]
  const resolvedClef: Clef = clef ?? (tonic >= 60 ? 'treble' : 'bass')

  // When pitches are provided, derive MIDIs from the actual pitch
  // sequence (which preserves caller's order — including descending).
  // Otherwise fall back to the preset's intervals applied to tonic.
  const presetMidis = resolvedIntervals.map(i => tonic + i)
  const pitchesValid = pitches && pitches.length > 0
  const pitchMidis = pitchesValid
    ? pitches.map(p => {
        const m = p.match(/^([A-G])(##|bb|#|b|n)?(-?\d+)$/)
        if (!m) return tonic
        const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 } as const
        const acc = m[2]
        const adj = acc === '#' ? 1 : acc === 'b' ? -1 : acc === '##' ? 2 : acc === 'bb' ? -2 : 0
        return (parseInt(m[3], 10) + 1) * 12 + LETTER[m[1] as keyof typeof LETTER] + adj
      })
    : null
  const scaleMidis = pitchMidis ?? presetMidis
  if (pitches && !pitchMidis) {
    console.warn(
      `ScaleExplorer: pitches array invalid; falling back to auto-derived spellings.`
    )
  }
  const scalePitches = pitchesValid && pitches ? pitches : scaleMidis.map(midiToPitch)
  const dimmedSet = new Set(dimmedMidis)

  // Resolve intervalLabels: must match scale length or we ignore (warn) and
  // fall through to the default degree row.
  const resolvedIntervalLabels = intervalLabels && intervalLabels.length === scaleMidis.length
    ? intervalLabels
    : null
  if (intervalLabels && intervalLabels.length !== scaleMidis.length) {
    console.warn(
      `ScaleExplorer: intervalLabels length ${intervalLabels.length} doesn't match scale length ${scaleMidis.length}; falling back to default degree labels.`
    )
  }
  const useIntervalLabels = resolvedIntervalLabels !== null

  // Auto-caption when none provided
  const tonicName = PITCH_CLASS_NAMES[((tonic % 12) + 12) % 12]
  const scaleName = intervals ? 'scale' : PRESET_NAMES[scale]
  const resolvedCaption = caption ?? `${tonicName} ${scaleName}`

  const margin = Math.round(20 * T.scale + 8)
  // When the keyboard is shown, the staff matches keyboard width so the two visual
  // elements align under each other. When not, the staff shrinks to fit clef +
  // notes + breathing room — important for compact side-by-side layouts where
  // multiple ScaleExplorers need to fit in a single row.
  const noteCount = (intervals ?? SCALE_PRESETS[scale]).length
  const compactStaffWidth = T.clefReserve + Math.round(28 * T.scale * noteCount) + Math.round(16 * T.scale)
  // Long scales (chromatic, octatonic) crowd noteheads at the keyboard-derived width.
  // Floor the staff at a comfortable per-note minimum so notes don't collide.
  const minPerNoteWidth = Math.round(70 * T.scale)
  const minStaffForNotes = T.clefReserve + minPerNoteWidth * noteCount + Math.round(16 * T.scale)
  const innerWidth = showKeyboard
    ? Math.max(420, T.keyboardWhiteKeyWidth * 7 + 80, minStaffForNotes)
    : compactStaffWidth
  const staffX = margin
  const staffWidth = innerWidth
  const noteAreaX = staffX + T.clefReserve
  const noteAreaWidth = staffWidth - T.clefReserve - margin
  const noteSpacing = noteAreaWidth / scaleMidis.length
  const noteXs = scaleMidis.map((_, i) => noteAreaX + (i + 0.5) * noteSpacing)

  const provisional = aggregateBounds(scalePitches, 0, resolvedClef, T)
  const headroom = Math.max(0, -provisional.top)
  const staffY = margin + headroom

  const bounds = aggregateBounds(scalePitches, staffY, resolvedClef, T)

  let cursorY = bounds.bottom + T.annotationBuffer
  let degreeY: number | null = null
  // The label row is shown when either showDegrees is on (default) OR
  // intervalLabels is provided. intervalLabels takes precedence over the
  // default 1̂ 2̂ 3̂ caret row (combining both would crowd the staff).
  if ((showDegrees || useIntervalLabels) && showStaff) {
    degreeY = cursorY + T.labelFontSize
    cursorY = degreeY + T.annotationBuffer
  }
  let bracketBarY: number | null = null
  if (showBrackets && showStaff) {
    bracketBarY = cursorY + T.bracketTick
    cursorY = bracketBarY + T.labelFontSize + T.annotationBuffer
  }
  const keyboardGap = Math.max(20, T.step * 2.5)
  const keyboardY = showKeyboard
    ? (showStaff ? cursorY + keyboardGap : margin)
    : cursorY
  const keyboardWidth = T.keyboardWhiteKeyWidth * 8
  const keyboardX = staffX + (staffWidth - keyboardWidth) / 2

  const totalH = showKeyboard
    ? keyboardY + T.keyboardWhiteKeyHeight + margin
    : cursorY + margin
  const totalW = staffX + staffWidth + margin

  const handleNotePlay = async (midi: number) => {
    setInteracted(true)
    flash(midi)
    await play(midiToPitch(midi))
  }

  const handlePlayScale = async () => {
    setInteracted(true)
    flashSequence(scaleMidis, 380, 350)
    await playSequence(scalePitches, 380, '4n')
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={resolvedCaption}
      >
        {showStaff && (
          <>
            <Staff clef={resolvedClef} x={staffX} y={staffY} width={staffWidth} T={T} />
            {scaleMidis.map((midi, i) => (
              <NoteHead
                key={`${midi}-${i}`}
                pitch={scalePitches[i]}
                staffTop={staffY}
                x={noteXs[i]}
                clef={resolvedClef}
                T={T}
                dimmed={dimmedSet.has(midi)}
                highlight={highlightedMidis.includes(midi)}
                onMouseEnter={() => highlight(midi)}
                onMouseLeave={() => highlight(null)}
                onClick={() => handleNotePlay(midi)}
                ariaLabel={`Scale degree ${i + 1}, ${scalePitches[i]}`}
              />
            ))}
            {/* Custom interval labels take precedence over default degree row. */}
            {useIntervalLabels && degreeY !== null && resolvedIntervalLabels && scaleMidis.map((midi, i) => (
              <text
                key={`int-${midi}-${i}`}
                x={noteXs[i]}
                y={degreeY!}
                fontSize={T.labelFontSize}
                fontFamily={T.fontLabel}
                fill={dimmedSet.has(midi) ? T.inkSubtle : (highlightedMidis.includes(midi) ? T.highlightAccent : T.ink)}
                fontWeight={500}
                textAnchor="middle"
              >
                {resolvedIntervalLabels[i]}
              </text>
            ))}
            {!useIntervalLabels && showDegrees && degreeY !== null && scaleMidis.map((midi, i) => {
              const degree = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
              // Only render degree labels for scales with <= 8 notes (skip chromatic)
              if (i + 1 > 8) return null
              return (
                <ScaleDegreeLabel
                  key={`deg-${midi}`}
                  x={noteXs[i]}
                  y={degreeY!}
                  degree={degree}
                  T={T}
                  variant={degreeVariant}
                  dimmed={dimmedSet.has(midi)}
                  highlight={highlightedMidis.includes(midi)}
                />
              )
            })}
            {showBrackets && bracketBarY !== null && noteXs.slice(0, -1).map((x, i) => {
              const semitones = resolvedIntervals[i + 1] - resolvedIntervals[i]
              const bracketDimmed = dimmedSet.has(scaleMidis[i]) || dimmedSet.has(scaleMidis[i + 1])
              return (
                <StepBracket
                  key={`br-${i}`}
                  x1={x}
                  x2={noteXs[i + 1]}
                  y={bracketBarY!}
                  semitones={semitones}
                  T={T}
                  dimmed={bracketDimmed}
                />
              )
            })}
          </>
        )}
        {showKeyboard && (
          <Keyboard
            startMidi={tonic}
            endMidi={tonic + 12}
            x={keyboardX}
            y={keyboardY}
            T={T}
            highlightedMidis={Array.from(new Set([...scaleMidis, ...highlightedMidis]))}
            dimmedMidis={dimmedMidis}
            onKeyEnter={(midi) => highlight(midi)}
            onKeyLeave={() => highlight(null)}
            onKeyClick={(midi) => handleNotePlay(midi)}
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
            onClick={handlePlayScale}
            disabled={interacted && !ready}
            style={btnStyle(T, interacted && !ready)}
          >
            Play scale
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
      {caption !== undefined ? (caption && <Caption T={T}>{caption}</Caption>) : null}
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
