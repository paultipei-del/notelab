/**
 * Shared chord-engraving algorithm. Used by ChordExplorer and IntervalSet so
 * a 2nd-apart dyad displaces identically across both components.
 *
 * The rules implemented here:
 *   - Stem direction: stems point up when the lowest note sits below the
 *     middle line (staffPos 4); else they point down.
 *   - 2nd-displacement: notes one staff-position apart cannot share an x.
 *     They must straddle the stem. Walk from the anchor (lowest note for
 *     stem-up, highest for stem-down) toward the tip; the first note is
 *     on the "normal" side; each subsequent note that is exactly a 2nd
 *     from its walk-neighbor and whose neighbor is on the normal side
 *     gets displaced. Alternation handles clusters like C-D-E.
 *   - Accidentals: rendered in their own column to the LEFT of the
 *     leftmost notehead — never tucked next to a displaced note.
 *
 * See Gould "Behind Bars" (chord engraving) and Ross "The Art of Music
 * Engraving" for the canonical conventions.
 */

import type { LearnTokens } from './tokens'
import { staffPosition, type Clef, type ParsedPitch } from './pitch'

export interface EngravedAccidental {
  glyph: string
  y: number
  midi: number
}

export interface EngravedChord {
  parsed: ParsedPitch[]
  positions: number[]
  noteXs: number[]
  isDisplaced: boolean[]
  accidentals: Array<EngravedAccidental | null>
  stemX: number
  stemAnchorY: number
  stemTipY: number
  /** Lowest pixel the chord occupies on this stave (notes / stems / ledgers). */
  bottomExtent: number
  /** Topmost pixel for headroom calculations. */
  topExtent: number
}

/**
 * Compute the engraving data for a chord on a single stave. `chordX` is the
 * notional center column where the chord renders; the helper returns a
 * `noteXs` array that may displace some notes by ±noteheadWidth from `chordX`
 * to satisfy the 2nd-apart rule.
 *
 * The caller is responsible for picking `chordX` (e.g. center of a slot) and
 * `staffY` (top line of the stave). All Y values returned are in the same
 * pixel space as `staffY`.
 */
export function engraveChord(
  parsed: ParsedPitch[],
  clef: Clef,
  staffY: number,
  chordX: number,
  T: LearnTokens,
): EngravedChord | null {
  if (parsed.length === 0) return null

  const positions = parsed.map(p => staffPosition(p, clef))
  const minPos = Math.min(...positions)
  const maxPos = Math.max(...positions)

  // Stem direction: up when lowest note is below middle line.
  const stemUp = maxPos > 4
  const stemX = stemUp ? chordX + T.stemXOffset : chordX - T.stemXOffset
  const chordSpan = (maxPos - minPos) * T.step
  const stemAnchorPos = stemUp ? maxPos : minPos
  const stemAnchorY = staffY + stemAnchorPos * T.step
  const stemExtension = T.stemLength + chordSpan * 0.5
  const stemTipY = stemUp
    ? stemAnchorY - stemExtension
    : stemAnchorY + stemExtension

  // 2nd-displacement walked from anchor → tip.
  const noteheadWidth = Math.round(22 * T.scale)
  const displacementOffset = stemUp ? noteheadWidth : -noteheadWidth
  const noteXs: number[] = parsed.map(() => chordX)
  const isDisplaced: boolean[] = parsed.map(() => false)

  const indices = parsed.map((_, i) => i)
  const walkOrder = stemUp
    ? indices.slice().sort((a, b) => positions[b] - positions[a])
    : indices.slice().sort((a, b) => positions[a] - positions[b])

  for (let w = 1; w < walkOrder.length; w++) {
    const currentIdx = walkOrder[w]
    const prevIdx = walkOrder[w - 1]
    const positionDiff = Math.abs(positions[currentIdx] - positions[prevIdx])
    if (positionDiff === 1 && !isDisplaced[prevIdx]) {
      isDisplaced[currentIdx] = true
      noteXs[currentIdx] = chordX + displacementOffset
    }
  }

  const accidentals: Array<EngravedAccidental | null> = parsed.map((p, i) => {
    const acc = p.accidental
    if (!acc || acc === 'n') return null
    const glyph = acc === '#' ? T.sharpGlyph
      : acc === 'b' ? T.flatGlyph
      : acc === '##' ? T.doubleSharpGlyph
      : acc === 'bb' ? T.doubleFlatGlyph
      : null
    if (!glyph) return null
    return { glyph, y: staffY + positions[i] * T.step, midi: p.midi }
  })

  // Layout extents — caller uses these for headroom + footroom.
  const staffTop = staffY
  const staffBottom = staffY + 8 * T.step
  const highestNoteY = staffY + minPos * T.step - T.noteheadHalfHeight
  const lowestNoteY = staffY + maxPos * T.step + T.noteheadHalfHeight
  const stemTopY = stemUp ? stemTipY : stemAnchorY
  const stemBottomY = stemUp ? stemAnchorY : stemTipY
  const ledgerTopY = minPos < 0 ? staffY + minPos * T.step : staffTop
  const ledgerBottomY = maxPos > 8 ? staffY + maxPos * T.step : staffBottom
  const topExtent = Math.min(staffTop, highestNoteY, stemTopY, ledgerTopY)
  const bottomExtent = Math.max(staffBottom, lowestNoteY, stemBottomY, ledgerBottomY)

  return {
    parsed,
    positions,
    noteXs,
    isDisplaced,
    accidentals,
    stemX,
    stemAnchorY,
    stemTipY,
    bottomExtent,
    topExtent,
  }
}

/**
 * x-position of the accidental column for a chord — left of the leftmost
 * notehead, with breathing room. Caller renders each accidental at this x
 * and at its own y from `accidentals[i].y`. The 22*scale gap is wide
 * enough that the right edge of the accidental glyph clearly clears the
 * notehead at every size; the previous 14*scale buffer crowded notes
 * with sharps/flats.
 */
export function accidentalColumnX(noteXs: number[], T: LearnTokens): number {
  if (noteXs.length === 0) return 0
  return Math.min(...noteXs) - Math.round(22 * T.scale) - 6
}
