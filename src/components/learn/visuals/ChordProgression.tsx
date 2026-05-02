'use client'

import React from 'react'
import { Staff, NoteHead, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, lineY, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, type Clef } from '@/lib/learn/visuals/pitch'
import { engraveChord } from '@/lib/learn/visuals/chord-engraving'

const SHARP_ORDER: Array<'F' | 'C' | 'G' | 'D' | 'A' | 'E' | 'B'> = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER:  Array<'B' | 'E' | 'A' | 'D' | 'G' | 'C' | 'F'> = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const SUBSCRIPT_DIGITS = '₀₁₂₃₄₅₆₇₈₉'
const ASCII_DIGITS = '0123456789'

/**
 * Parse a Roman-numeral string with optional inline figured-bass digits
 * encoded as Unicode super/subscripts (e.g. "I⁶₄" → base "I", top "6",
 * bottom "4"). The trailing run of super/subscripts is split off so the
 * caller can render the digits as a stacked column instead of a side-by-side
 * line — without this the ⁶ and ₄ render at different baselines but in
 * sequence, which doesn't read as a 6/4 figure.
 */
function parseRomanNumeralFigure(rn: string): {
  base: string
  top: string
  bottom: string
} {
  let base = rn
  let top = ''
  let bottom = ''
  for (let i = rn.length - 1; i >= 0; i--) {
    const ch = rn[i]
    const supIdx = SUPERSCRIPT_DIGITS.indexOf(ch)
    const subIdx = SUBSCRIPT_DIGITS.indexOf(ch)
    if (supIdx >= 0) {
      top = ASCII_DIGITS[supIdx] + top
      base = rn.slice(0, i)
    } else if (subIdx >= 0) {
      bottom = ASCII_DIGITS[subIdx] + bottom
      base = rn.slice(0, i)
    } else {
      break
    }
  }
  return { base, top, bottom }
}

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
  /** Roman numeral rendered below the chord. Top of the label stack. */
  romanNumeral?: string
  /** Plain label rendered below the Roman numeral (or the only label if no romanNumeral). */
  label?: string
  /** Figured-bass numbers stacked vertically right under the chord (above romanNumeral). */
  figuredBass?: string[]
  /** Highlight this chord with coral noteheads. */
  highlighted?: boolean
}

interface ChordProgressionProps {
  /** Number of sharps (positive) or flats (negative). Alias for keySignature. */
  accidentals?: number
  /** Number of sharps (positive) or flats (negative). Preferred name. */
  keySignature?: number
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
  /** Render small "→" connectors between adjacent chords. Default false. */
  showConnectors?: boolean
  /** If false, hide the Play button. Default true. */
  audio?: boolean
  caption?: string
}

export function ChordProgression({
  accidentals,
  keySignature,
  chords,
  clef = 'treble',
  size = 'inline',
  title,
  reserveAccidentalSlots,
  showConnectors = false,
  audio = true,
  caption,
}: ChordProgressionProps) {
  // Either prop is accepted; keySignature wins if both are provided.
  const accidentalsResolved = keySignature ?? accidentals ?? 0
  const T = tokensFor(size)
  const { playChord } = useSampler()
  // Transient highlight: which chord index was last clicked. The flash
  // auto-clears after a short hold so the visual matches the audible chord.
  const [flashIdx, setFlashIdx] = React.useState<number | null>(null)
  const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashChord = React.useCallback((i: number, holdMs = 700) => {
    setFlashIdx(i)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashIdx(null), holdMs)
  }, [])
  React.useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [])

  const margin = Math.round(20 * T.scale + 10)
  const clefReserve = T.clefReserve
  const clefGap = Math.round(18 * T.scale)

  const isSharp = accidentalsResolved > 0
  const ksCount = Math.abs(accidentalsResolved)
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
  // SVG <text> doesn't wrap, so adjacent per-chord labels collide once they
  // grow past the slot width. Estimate the longest label across all chords
  // and widen the slot just enough to keep neighbours from overlapping.
  const labelFont = T.size === 'small' ? 13 : T.size === 'hero' ? 17 : 15
  const labelGutter = Math.round(16 * T.scale)
  const labelSlotMin = chords.reduce((max, c) => {
    const rnLen = c.romanNumeral?.length ?? 0
    const lblLen = c.label?.length ?? 0
    const fbLen = c.figuredBass?.reduce((m, s) => Math.max(m, s.length), 0) ?? 0
    const longest = Math.max(rnLen, lblLen, fbLen)
    // Roman numeral / figured bass render at labelFont; secondary label at
    // labelFont * 0.85. Use the larger of the two to estimate width.
    const charWidth = Math.max(labelFont, labelFont * 0.85) * 0.55
    return Math.max(max, Math.ceil(longest * charWidth) + labelGutter)
  }, 0)
  const chordSlotPx = Math.max(baselineChordSlot, labelSlotMin)
  const trailingInnerPad = Math.round(20 * T.scale)
  const innerWidth = clefReserve + clefGap + ksReservedWidth + ksGap + chords.length * chordSlotPx + trailingInnerPad
  const staffWidth = innerWidth

  const bodyAvailable = staffWidth - clefReserve - clefGap - ksActualWidth - ksGap - trailingInnerPad
  const chordSlot = bodyAvailable / chords.length

  const titleFont = T.size === 'small' ? 13 : T.size === 'hero' ? 17 : 15

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
  // Account for the full per-chord label stack (figured bass → roman numeral
  // → secondary label) when computing SVG height. Without this, labels render
  // below `totalH` and the next grid row (audio button / caption) overlaps
  // them — visually "cutting" labels like tone / dyad / chord.
  const maxFbCount = chords.reduce(
    (m, c) => Math.max(m, c.figuredBass?.length ?? 0),
    0,
  )
  const hasRoman = chords.some(c => !!c.romanNumeral)
  const hasSubLabel = chords.some(c => !!c.label)
  const fbBlockH = maxFbCount * labelFont * 1.05 + (maxFbCount > 0 ? 4 : 0)
  const rnBlockH = hasRoman ? labelFont + 2 : 0
  const subLabelBlockH = hasSubLabel ? labelFont * 0.85 + 4 : 0
  const labelStackH = fbBlockH + rnBlockH + subLabelBlockH
  const totalH = labelY + labelStackH + Math.round(10 * T.scale)
  const totalW = margin + staffWidth + margin

  const ksStartX = margin + clefReserve + clefGap
  const bodyStartX = ksStartX + ksActualWidth + ksGap
  const chordX = (i: number) => bodyStartX + (i + 0.5) * chordSlot

  const handlePlayAll = async () => {
    for (let i = 0; i < chords.length; i++) {
      flashChord(i)
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
      <div style={{ gridRow: 1, gridColumn: title ? 2 : 1, width: totalW, maxWidth: '100%', justifySelf: 'center' }}>
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
          const altered = alteredLettersForKey(accidentalsResolved)
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
            const isFlashing = flashIdx === i
            const isLit = chord.highlighted || isFlashing
            const accentColor = isLit ? T.highlightAccent : T.ink
            // Invisible hit rect spanning the chord's slot. Without this,
            // chords with no accidentals (e.g. C-E-G) have no clickable
            // surface at all — noteheads are SVG text glyphs that render
            // with pointerEvents="none", so clicks would otherwise pass
            // through to the staff lines.
            const hitTop = Math.min(engraved.topExtent, staffY) - T.step
            const hitBottom = Math.max(engraved.bottomExtent, staffY + 8 * T.step) + T.step
            const hitX = bodyStartX + i * chordSlot
            return (
              <g
                key={`chord-${i}`}
                onClick={() => {
                  flashChord(i)
                  void playChord(chord.pitches, '2n')
                }}
                style={{ cursor: 'pointer' }}
                role="button"
                aria-label={`Play ${chord.label ?? `chord ${i + 1}`}`}
              >
                <rect
                  x={hitX}
                  y={hitTop}
                  width={chordSlot}
                  height={hitBottom - hitTop}
                  fill="transparent"
                  pointerEvents="all"
                />
                {/* Render accidentals from the engraving data so multi-flat /
                    multi-sharp chords (e.g. C-E♭-G♭) get Gould-style staggered
                    columns instead of stacking on top of each other. */}
                {engraved.accidentals.map((a, j) => a && (
                  <text
                    key={`acc-${j}-${a.midi}`}
                    x={a.x}
                    y={a.y}
                    fontSize={T.accidentalFontSize}
                    fontFamily={T.fontMusic}
                    fill={accentColor}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {a.glyph}
                  </text>
                ))}
                {engraved.parsed.map((_p, j) => (
                  <NoteHead
                    key={j}
                    pitch={displayPitches[j]}
                    staffTop={staffY}
                    x={engraved.noteXs[j]}
                    clef={clef}
                    T={T}
                    duration="whole"
                    noAccidental
                    highlight={isLit}
                  />
                ))}
              </g>
            )
          })
        })()}

        {/* Connectors: small "→" between adjacent chords. */}
        {showConnectors && chords.slice(0, -1).map((_c, i) => (
          <text
            key={`conn-${i}`}
            x={(chordX(i) + chordX(i + 1)) / 2}
            y={staffY + 4 * T.step}
            fontSize={Math.round(20 * T.scale + 6)}
            fontFamily={T.fontDisplay}
            fill={T.highlightAccent}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ pointerEvents: 'none' }}
          >
            →
          </text>
        ))}

        {/* Per-chord label stack: figuredBass (top) → romanNumeral → label (bottom).
            Roman numerals + secondary labels share a baseline across the row so
            that varying figured-bass counts (e.g. I, I⁶, I⁶₄) don't shift the
            numeral up or down between chords. The figured-bass block sits above
            the shared numeral baseline and is bottom-anchored so taller stacks
            grow upward, leaving the numeral row visually flat. */}
        {chords.map((chord, i) => {
          const fbCount = chord.figuredBass?.length ?? 0
          const fbLineH = labelFont * 1.05
          const fbStartY = labelY
          const maxFbStackH = maxFbCount * fbLineH + (maxFbCount > 0 ? 4 : 0)
          const rnY = fbStartY + maxFbStackH
          const lblY = rnY + (chord.romanNumeral ? labelFont + 2 : 0)
          // Bottom-anchor each chord's figured-bass column so that a single
          // figure ("6") sits just above the numeral and a two-figure stack
          // ("6","4") spans both rows above it.
          const fbColumnTop = rnY - fbCount * fbLineH - (fbCount > 0 ? 4 : 0)
          return (
            <g key={`labels-${i}`}>
              {chord.figuredBass?.map((fig, fi) => (
                <text
                  key={`fb-${i}-${fi}`}
                  x={chordX(i)}
                  y={fbColumnTop + (fi + 0.5) * fbLineH}
                  fontSize={labelFont}
                  fontFamily={T.fontLabel}
                  fill={T.ink}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {fig}
                </text>
              ))}
              {chord.romanNumeral && (() => {
                const { base, top, bottom } = parseRomanNumeralFigure(chord.romanNumeral)
                const figFont = labelFont * 0.65
                // Approximate widths from char count × per-char width factor.
                const baseW = (base.length || 1) * labelFont * 0.6
                const figDigits = Math.max(top.length, bottom.length)
                const figW = figDigits > 0
                  ? figDigits * figFont * 0.6 + 2
                  : 0
                const totalW = baseW + figW
                const startX = chordX(i) - totalW / 2
                const baseCenterX = startX + baseW / 2
                const figX = startX + baseW + 1
                const baseY = rnY + labelFont / 2
                // Top digit sits centered just above the base's vertical center;
                // bottom digit sits centered just below — together they read as
                // a stacked figured-bass cell instead of a "⁶₄" sequence.
                const topY = top && bottom
                  ? baseY - figFont * 0.45
                  : baseY - figFont * 0.25
                const bottomY = top && bottom
                  ? baseY + figFont * 0.55
                  : baseY + figFont * 0.4
                return (
                  <>
                    <text
                      x={baseCenterX}
                      y={baseY}
                      fontSize={labelFont}
                      fontFamily={T.fontLabel}
                      fill={T.ink}
                      fontWeight={600}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {base}
                    </text>
                    {top && (
                      <text
                        x={figX}
                        y={topY}
                        fontSize={figFont}
                        fontFamily={T.fontLabel}
                        fill={T.ink}
                        fontWeight={500}
                        textAnchor="start"
                        dominantBaseline="central"
                      >
                        {top}
                      </text>
                    )}
                    {bottom && (
                      <text
                        x={figX}
                        y={bottomY}
                        fontSize={figFont}
                        fontFamily={T.fontLabel}
                        fill={T.ink}
                        fontWeight={500}
                        textAnchor="start"
                        dominantBaseline="central"
                      >
                        {bottom}
                      </text>
                    )}
                  </>
                )
              })()}
              {chord.label && (
                <text
                  x={chordX(i)}
                  y={lblY + labelFont / 2}
                  fontSize={labelFont * 0.85}
                  fontFamily={T.fontLabel}
                  fill={T.inkMuted}
                  fontStyle="italic"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {chord.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      </div>

      {audio && (
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
      )}

      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
