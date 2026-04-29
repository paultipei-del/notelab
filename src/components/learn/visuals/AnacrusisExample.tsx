'use client'

import React from 'react'
import { Staff, RhythmicNote, Beam, TimeSignature, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { useLoopingPlayback } from '@/lib/learn/audio/useLoopingPlayback'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, ledgerLinePositions } from '@/lib/learn/visuals/pitch'

interface AnacrusisExampleProps {
  /** Tempo for playback (quarter-note BPM). Default 100. */
  tempo?: number
  size?: LearnSize
  caption?: string
}

interface NoteSpec {
  pitch: string
  value: 'eighth' | 'quarter' | 'half' | 'dotted-half'
  /** Cumulative beat offset from the first played note (the pickup). */
  beatOffset: number
  /** Syllable label rendered below the staff. */
  syllable: string
  /** True if this note is part of the pickup (anacrusis). */
  pickup?: boolean
}

const HAPPY_BIRTHDAY: NoteSpec[] = [
  { pitch: 'G4', value: 'eighth',   beatOffset: 0,   syllable: 'Hap-',   pickup: true },
  { pitch: 'G4', value: 'eighth',   beatOffset: 0.5, syllable: 'py',     pickup: true },
  { pitch: 'A4', value: 'quarter',  beatOffset: 1,   syllable: 'Birth-' },
  { pitch: 'G4', value: 'quarter',  beatOffset: 2,   syllable: 'day' },
  { pitch: 'C5', value: 'quarter',  beatOffset: 3,   syllable: 'to' },
  { pitch: 'B4', value: 'half',     beatOffset: 4,   syllable: 'you' },
]

export function AnacrusisExample({
  tempo = 100,
  size = 'inline',
  caption,
}: AnacrusisExampleProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const { isPlaying, toggle } = useLoopingPlayback()

  const flashAt = (idx: number, durMs: number) => {
    setActiveIndex(idx)
    setTimeout(() => {
      setActiveIndex(curr => (curr === idx ? null : curr))
    }, durMs)
  }

  const noteData = HAPPY_BIRTHDAY.map(n => {
    const p = parsePitch(n.pitch)!
    return { spec: n, parsed: p, pos: staffPosition(p, 'treble') }
  })

  // ---------- Layout: explicit pixel widths so each barline has the same
  // padding on either side, and m1 (the 3-quarter measure) gets more
  // room while m2 (the 1-note ending) gets less.
  const margin = Math.round(20 * T.scale + 8)
  const staffX = margin
  const staffY = margin + Math.round(48 * T.scale)
  const syllableY = staffY + 8 * T.step + Math.round(42 * T.scale)
  const pickupLabelY = syllableY + Math.round(28 * T.scale)

  const clefReserve = Math.round(70 * T.scale)
  const tsReserve = Math.round(50 * T.scale)
  const tsXOffset = Math.round(20 * T.scale)
  const trailingPad = Math.round(18 * T.scale)

  // Single source of truth for the gap between any note and the barline
  // immediately next to it — applied symmetrically on both sides of every
  // barline so the rhythm reads evenly.
  const barlineGap = Math.round(46 * T.scale)
  // Spacing between consecutive quarters in measure 2.
  const m1NoteSpacing = Math.round(86 * T.scale)
  // The two pickup eighths together occupy 1 beat of music — they sit
  // close together (beamed pair convention) but with enough room for the
  // syllables underneath.
  const pickupSpread = Math.round(54 * T.scale)
  const pickupLeftPad = Math.round(20 * T.scale)
  // Trailing space after the half-note in measure 3 — no final barline.
  const m2TrailingRoom = Math.round(120 * T.scale)

  const pickupWidth = pickupLeftPad + pickupSpread + barlineGap
  const m1Width = barlineGap + 2 * m1NoteSpacing + barlineGap
  const m2Width = barlineGap + m2TrailingRoom

  const noteAreaStart = staffX + clefReserve + tsReserve
  const tsX = staffX + clefReserve + tsXOffset

  const pickupStart = noteAreaStart
  const pickupEnd = pickupStart + pickupWidth // barline 1
  const m1Start = pickupEnd
  const m1End = m1Start + m1Width // barline 2
  const m2Start = m1End

  const xPickup0 = pickupStart + pickupLeftPad // Hap
  const xPickup1 = xPickup0 + pickupSpread     // py
  const xM1_0 = m1Start + barlineGap           // Birth-
  const xM1_1 = xM1_0 + m1NoteSpacing          // day
  const xM1_2 = xM1_1 + m1NoteSpacing          // to
  const xM2 = m2Start + barlineGap             // you (half note)

  const noteXs: number[] = [xPickup0, xPickup1, xM1_0, xM1_1, xM1_2, xM2]

  const innerEnd = m2Start + m2Width
  const staffWidth = innerEnd - staffX + trailingPad
  const totalW = staffX + staffWidth + margin
  const totalH = pickupLabelY + Math.round(22 * T.scale) + margin

  // Anacrusis bracket: symmetric pad past each pickup syllable.
  const pickupBracketPad = Math.round(14 * T.scale)
  const pickupX1 = noteXs[0] - pickupBracketPad
  const pickupX2 = noteXs[1] + pickupBracketPad

  const pickupNotes = noteData.filter(n => n.spec.pickup)
  const pickupXs = [noteXs[0], noteXs[1]]
  const stemUp = (pos: number) => pos > 4

  const valueDurBeats = (v: NoteSpec['value']): number => {
    if (v === 'eighth') return 0.5
    if (v === 'quarter') return 1
    if (v === 'half') return 2
    return 3 // dotted-half (kept for type completeness)
  }

  const playAll = () => {
    setInteracted(true)
    const beatSec = 60 / tempo
    // Phrase length: last note starts at beat 4 and lasts 2 beats (half),
    // so the iteration spans 6 beats — plus a half-beat breath before the
    // pickup repeats.
    const totalBeats = 6 + 0.5
    toggle(
      HAPPY_BIRTHDAY.map((n, i) => ({
        offset: n.beatOffset * beatSec,
        fire: () => {
          flashAt(i, valueDurBeats(n.value) * beatSec * 1000)
          void play(n.pitch)
        },
      })),
      {
        iterationMs: totalBeats * beatSec * 1000,
        onStop: () => setActiveIndex(null),
      }
    )
  }

  const barlineStroke = Math.max(1, Math.round(1.4 * T.scale))

  // Syllable text. Larger now that the staff has been expanded — still
  // small enough that "Hap-py" and "Birth-day" fit cleanly between their
  // notes, with the dash sitting at the midpoint of the visible word gap.
  const syllableFontSize = Math.round(T.labelFontSize * 1.35)
  const anacrusisLabelFontSize = Math.round(T.labelFontSize * 1.15)
  // Rough character-width factor for the lyric font. Used to compute the
  // visual edge of each syllable so the connecting dash sits at the
  // midpoint of the visible word gap (not the midpoint of the noteheads,
  // which would put the dash too close to the longer word).
  const charHalfWidth = (text: string) => (text.length * syllableFontSize * 0.30)

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? "Happy Birthday opening with anacrusis labeled"}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={3} denominator={4} x={tsX} staffTop={staffY} T={T} />

        {/* Two interior barlines; no final barline at the end of measure 3. */}
        <line
          x1={pickupEnd}
          y1={staffY}
          x2={pickupEnd}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={barlineStroke}
        />
        <line
          x1={m1End}
          y1={staffY}
          x2={m1End}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={barlineStroke}
        />

        {/* Pickup highlight: subtle coral bracket below the pickup notes. */}
        <line
          x1={pickupX1}
          y1={syllableY + Math.round(10 * T.scale)}
          x2={pickupX2}
          y2={syllableY + Math.round(10 * T.scale)}
          stroke={T.highlightAccent}
          strokeWidth={1.4}
        />
        <line
          x1={pickupX1}
          y1={syllableY + Math.round(10 * T.scale)}
          x2={pickupX1}
          y2={syllableY + Math.round(4 * T.scale)}
          stroke={T.highlightAccent}
          strokeWidth={1.4}
        />
        <line
          x1={pickupX2}
          y1={syllableY + Math.round(10 * T.scale)}
          x2={pickupX2}
          y2={syllableY + Math.round(4 * T.scale)}
          stroke={T.highlightAccent}
          strokeWidth={1.4}
        />
        <text
          x={(pickupX1 + pickupX2) / 2}
          y={pickupLabelY}
          fontSize={anacrusisLabelFontSize}
          fontFamily={T.fontLabel}
          fill={T.highlightAccent}
          textAnchor="middle"
          fontWeight={600}
        >
          anacrusis
        </text>

        {/* Beam the pickup eighths */}
        {(() => {
          const eighthsPos = pickupNotes[0].pos
          const noteY = lineY(staffY, 0, T) + eighthsPos * T.step
          const beamY = noteY - T.stemLength
          return (
            <Beam noteXs={pickupXs} beamY={beamY} beamCount={1} stemDirection="up" T={T} />
          )
        })()}

        {/* Notes + ledger lines */}
        {noteData.map((n, i) => {
          const x = noteXs[i]
          const noteY = lineY(staffY, 0, T) + n.pos * T.step
          const ledgers = ledgerLinePositions(n.pos)
          const isPickupEighth = n.spec.pickup === true
          const isHighlighted = activeIndex === i
          const fill = isHighlighted ? T.highlightAccent : T.ink
          const value: 'eighth' | 'quarter' | 'half' = n.spec.value === 'dotted-half' ? 'half'
            : n.spec.value === 'eighth' ? 'eighth'
            : n.spec.value === 'quarter' ? 'quarter' : 'half'
          const dotted = n.spec.value === 'dotted-half'
          return (
            <g key={i}>
              {ledgers.map(lp => (
                <line
                  key={`led-${i}-${lp}`}
                  x1={x - T.ledgerHalfWidth}
                  y1={staffY + lp * T.step}
                  x2={x + T.ledgerHalfWidth}
                  y2={staffY + lp * T.step}
                  stroke={fill}
                  strokeWidth={T.ledgerLineStroke}
                />
              ))}
              <RhythmicNote
                value={value}
                x={x}
                y={noteY}
                T={T}
                stemDirection={stemUp(n.pos) ? 'up' : 'down'}
                noFlag={isPickupEighth}
                dotted={dotted}
                highlight={isHighlighted}
                onClick={() => { setInteracted(true); flashAt(i, 320); void play(n.spec.pitch) }}
                ariaLabel={`${n.spec.pitch} ${n.spec.value}`}
              />
              {(() => {
                // Split syllables that end with "-": the word renders
                // centered on the notehead; the dash sits at the midpoint
                // of the visible word GAP (right edge of this word ↔ left
                // edge of the next word), so longer words like "Hap" or
                // "Birth" don't push the dash up against their last letter.
                const raw = n.spec.syllable
                const hasDash = raw.endsWith('-')
                const word = hasDash ? raw.slice(0, -1) : raw
                const fillColor = n.spec.pickup ? T.highlightAccent : T.ink
                let dashX: number | null = null
                if (hasDash && i + 1 < noteXs.length) {
                  const nextRaw = noteData[i + 1].spec.syllable
                  const nextWord = nextRaw.endsWith('-') ? nextRaw.slice(0, -1) : nextRaw
                  const leftEdge = x + charHalfWidth(word)
                  const rightEdge = noteXs[i + 1] - charHalfWidth(nextWord)
                  dashX = (leftEdge + rightEdge) / 2
                }
                return (
                  <>
                    <text
                      x={x}
                      y={syllableY}
                      fontSize={syllableFontSize}
                      fontFamily={T.fontLabel}
                      fill={fillColor}
                      textAnchor="middle"
                      fontWeight={500}
                    >
                      {word}
                    </text>
                    {dashX !== null && (
                      <text
                        x={dashX}
                        y={syllableY}
                        fontSize={syllableFontSize}
                        fontFamily={T.fontLabel}
                        fill={fillColor}
                        textAnchor="middle"
                        fontWeight={500}
                      >
                        -
                      </text>
                    )}
                  </>
                )
              })()}
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <button
          type="button"
          onClick={playAll}
          disabled={interacted && !ready && !isPlaying}
          style={{
            fontFamily: T.fontLabel,
            fontSize: 13,
            padding: '8px 18px',
            background: 'transparent',
            border: `0.5px solid ${T.ink}`,
            borderRadius: 8,
            cursor: interacted && !ready && !isPlaying ? 'wait' : 'pointer',
            color: T.ink,
            opacity: interacted && !ready && !isPlaying ? 0.5 : 1,
            minWidth: 130,
            textAlign: 'center',
          }}
        >
          {isPlaying ? 'Stop' : 'Play melody'}
        </button>
      </div>
      {interacted && !ready && (
        <div style={{ fontFamily: T.fontLabel, fontSize: T.smallLabelFontSize, color: T.inkSubtle, fontStyle: 'italic', textAlign: 'center', marginTop: 6 }}>
          Loading piano samples…
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
