'use client'

import { useRef, useState } from 'react'
import {
  GRAND_STAFF_LAYOUT_LARGE,
  TREBLE_POSITIONS,
  BASS_POSITIONS,
  isOnTrebleStaff,
  buildGrandSnapGrid,
  pitchToYGrand,
} from '@/lib/programs/note-reading/staffPositions'

// Notehead + stem sizing tuned for the LARGE grand-staff layout
// (step=12). Roughly 2× the values used by GrandStaffCard (step=6).
// Bravura's em-square extends beyond the visible notehead, so fontSize
// that looks right here is a touch less than the 2× multiplier suggests.
const NOTEHEAD_FONT_SIZE = 84
const STEM_LENGTH = 72
const STEM_OFFSET = 11

// Stem up/down convention: notes below the middle staff line get
// stem-up, notes above get stem-down. Middle line defaults to stem-down.
// For grand staff, we use the pitch's own clef-side middle line.
function stemDirectionUpForPitch(pitch: string): boolean {
  const natural = pitch.replace(/[#b]/, '')
  const positions = isOnTrebleStaff(pitch) ? TREBLE_POSITIONS : BASS_POSITIONS
  const pos = positions[natural]
  return pos === undefined ? true : pos >= 4
}

/**
 * Interactive grand staff used by the Locate drill. Renders the same
 * visual language as GrandStaffCard (Bravura brace, clefs, 5-line
 * staves) but lets the user click/tap a line or space. The component
 * snaps the tap to the nearest grid position and returns the pitch
 * via `onTap(pitch, { tapY, snappedY })`.
 *
 * `markerPitch`  — optional: draws a dot at the user's current answer
 * `correctPitch` — optional: when set, renders a second dot on the
 *                  correct position (used in the wrong-answer reveal)
 * `feedback`     — 'correct' | 'wrong' | null. When non-null the tap
 *                  handler is disabled (parent is flashing feedback)
 *                  and the marker colour shifts to match the outcome.
 */

interface Props {
  pool: string[]                    // pool to snap to (module.notes)
  onTap: (pitch: string, meta: { tapY: number; snappedY: number }) => void
  markerPitch?: string | null       // user's picked answer
  correctPitch?: string | null      // correct answer (for wrong-reveal)
  anchorPitch?: string | null       // non-interactive reference note (e.g. "first note" in an intervallic prompt)
  anchorLabel?: string | null       // short label rendered next to the anchor
  feedback?: 'correct' | 'wrong' | null
  className?: string
}

export default function InteractiveGrandStaff({
  pool,
  onTap,
  markerPitch,
  correctPitch,
  anchorPitch,
  anchorLabel,
  feedback,
  className,
}: Props) {
  const L = GRAND_STAFF_LAYOUT_LARGE
  const svgRef = useRef<SVGSVGElement | null>(null)
  // Hover preview — shows a ghost notehead at the snapped pitch under
  // the pointer so the student can sight the placement before tapping.
  // Clears on pointer-leave and whenever the feedback window is open.
  const [hoverPitch, setHoverPitch] = useState<string | null>(null)

  // Pre-compute the snap grid once per render. Cheap — ~30 entries.
  const snapGrid = buildGrandSnapGrid(L)

  const H = L.bassTop + 8 * L.step + 80
  const staffRight = L.staffLeft + L.staffWidth
  // Tap-zone x-range. Slightly wider than the staff so ledger-line taps
  // at the edge still register.
  const tapLeft = L.staffLeft + 20
  const tapRight = staffRight - 10

  function staffLines(top: number, keyPrefix: string) {
    return [0, 2, 4, 6, 8].map(p => (
      <line
        key={keyPrefix + p}
        x1={L.staffLeft}
        y1={top + p * L.step}
        x2={staffRight}
        y2={top + p * L.step}
        stroke="#1A1A18"
        strokeWidth="1.2"
      />
    ))
  }

  // Resolve the pitch at a given pointer event by mapping screen coords
  // into SVG space then snapping to the nearest pitch in the pool.
  // Shared by handleTap (commit) and handleHover (preview).
  function snapPitchFromEvent(e: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>): { pitch: string; local: { x: number; y: number } } | null {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    if ('touches' in e) {
      const t = e.touches[0] ?? e.changedTouches[0]
      if (!t) return null
      pt.x = t.clientX
      pt.y = t.clientY
    } else {
      pt.x = e.clientX
      pt.y = e.clientY
    }
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const local = pt.matrixTransform(ctm.inverse())
    let best: { pitch: string; d: number } | null = null
    for (const p of pool) {
      const y = pitchToYGrand(p, L)
      if (y === null) continue
      const d = Math.abs(local.y - y)
      if (best === null || d < best.d) best = { pitch: p, d }
    }
    if (!best) return null
    return { pitch: best.pitch, local: { x: local.x, y: local.y } }
  }

  function handleHover(e: React.MouseEvent<SVGRectElement>) {
    if (feedback) return
    const snapped = snapPitchFromEvent(e)
    if (!snapped) return
    if (snapped.pitch !== hoverPitch) setHoverPitch(snapped.pitch)
  }

  function handleLeave() {
    if (hoverPitch !== null) setHoverPitch(null)
  }

  function handleTap(e: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) {
    if (feedback) return
    const svg = svgRef.current
    if (!svg) return
    const pt = svg.createSVGPoint()
    if ('touches' in e) {
      const t = e.touches[0] ?? e.changedTouches[0]
      if (!t) return
      pt.x = t.clientX
      pt.y = t.clientY
    } else {
      pt.x = e.clientX
      pt.y = e.clientY
    }
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const local = pt.matrixTransform(ctm.inverse())
    // Snap to nearest pool pitch so missing a line/space by a few pixels
    // still resolves to a guess instead of silently doing nothing.
    let best: { pitch: string; y: number; d: number } | null = null
    for (const p of pool) {
      const y = pitchToYGrand(p, L)
      if (y === null) continue
      const d = Math.abs(local.y - y)
      if (best === null || d < best.d) best = { pitch: p, y, d }
    }
    if (!best) return
    onTap(best.pitch, { tapY: local.y, snappedY: best.y })
  }

  // Marker colour reflects the feedback state.
  const markerColor =
    feedback === 'correct' ? '#3B6D11'
    : feedback === 'wrong' ? '#A32D2D'
    : '#1A1A18'

  const markerY = markerPitch ? pitchToYGrand(markerPitch, L) : null
  const correctY = correctPitch ? pitchToYGrand(correctPitch, L) : null
  const anchorY = anchorPitch ? pitchToYGrand(anchorPitch, L) : null
  const anchorX = L.staffLeft + L.staffWidth * 0.3    // left-of-center column for the anchor

  // Ledger lines for the marker / correct pitch so users can see where
  // the note sits even in the overlap / out-of-staff zone.
  function ledgerLinesFor(pitch: string, color: string, centerX?: number) {
    const y = pitchToYGrand(pitch, L)
    if (y === null) return null
    const onTreble = y < (L.trebleTop + L.bassTop) / 2
    const top = onTreble ? L.trebleTop : L.bassTop
    const pos = Math.round((y - top) / L.step)
    const lines: React.ReactElement[] = []
    const markerX = centerX ?? (L.staffLeft + staffRight) / 2
    if (pos >= 10) {
      for (let p = 10; p <= pos; p += 2) {
        const ly = top + p * L.step
        lines.push(<line key={`lb-${pitch}-${p}`} x1={markerX - 22} y1={ly} x2={markerX + 22} y2={ly} stroke={color} strokeWidth="1.2" />)
      }
    } else if (pos <= -2) {
      for (let p = -2; p >= pos; p -= 2) {
        const ly = top + p * L.step
        lines.push(<line key={`la-${pitch}-${p}`} x1={markerX - 22} y1={ly} x2={markerX + 22} y2={ly} stroke={color} strokeWidth="1.2" />)
      }
    }
    return lines
  }

  // Per-line snap visualisation — a faint row highlight under the user's
  // pointer? Expensive for every pointermove; skip. Static design is fine.

  const brace = (() => {
    const braceTop = L.trebleTop
    const braceBottom = L.bassTop + 8 * L.step
    const braceHeight = braceBottom - braceTop
    return (
      <text
        x={L.staffLeft - 14}
        y={braceTop + braceHeight}
        fontSize={braceHeight}
        fontFamily="Bravura, serif"
        fill="#1A1A18"
        textAnchor="middle"
        dominantBaseline="auto"
      >
        {String.fromCodePoint(0xE000)}
      </text>
    )
  })()

  const connectLine = (
    <line
      x1={L.staffLeft}
      y1={L.trebleTop}
      x2={L.staffLeft}
      y2={L.bassTop + 8 * L.step}
      stroke="#1A1A18"
      strokeWidth="1.5"
    />
  )

  const trebleClef = (
    <text
      x={L.staffLeft + 4}
      y={L.trebleTop + L.step * 6}
      fontSize={L.step * 8.5}
      fontFamily="Bravura, serif"
      fill="#1A1A18"
      dominantBaseline="auto"
    >
      𝄞
    </text>
  )

  const bassClef = (
    <text
      x={L.staffLeft + 4}
      y={L.bassTop + L.step * 2.2}
      fontSize={L.step * 8.5}
      fontFamily="Bravura, serif"
      fill="#1A1A18"
      dominantBaseline="auto"
    >
      𝄢
    </text>
  )

  const markerX = (L.staffLeft + staffRight) / 2 + 20

  return (
    <svg
      ref={svgRef}
      width={L.W}
      height={H}
      viewBox={`0 0 ${L.W} ${H}`}
      style={{ width: '100%', height: 'auto', maxWidth: `${L.W}px`, touchAction: 'manipulation' }}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="button"
      aria-label="Tap the line or space for the note"
    >
      {connectLine}
      {brace}
      {staffLines(L.trebleTop, 't')}
      {staffLines(L.bassTop, 'b')}
      {trebleClef}
      {bassClef}

      {/* Faint snap-grid guides — help orient beginners without dominating
          the visual. Only render the guides inside the staff band plus a
          ledger line above and below each clef. */}
      {snapGrid.map(({ y }) => (
        <line
          key={`g${y}`}
          x1={tapLeft}
          y1={y}
          x2={tapRight}
          y2={y}
          stroke="#1A1A18"
          strokeOpacity="0.04"
          strokeWidth="1"
        />
      ))}

      {/* Ledger lines for correct & marker (drawn before the tap zone so
          the pointer can still receive events above them). */}
      {correctPitch && feedback === 'wrong' && ledgerLinesFor(correctPitch, '#A32D2D')}
      {markerPitch && feedback && ledgerLinesFor(markerPitch, markerColor)}

      {/* Anchor notehead — used by Intervallic Locate to show the "first
          note" reference. Rendered non-interactively at the left column
          of the staff body with ledger lines as needed. Notehead fontSize
          and stem are scaled to the LARGE layout (step=12, ~2× the base
          GrandStaffCard scale). */}
      {anchorPitch && anchorY !== null && (() => {
        const stemUp = stemDirectionUpForPitch(anchorPitch)
        return (
          <g opacity={0.85}>
            {ledgerLinesFor(anchorPitch, '#1A1A18', anchorX)}
            <text
              x={anchorX}
              y={anchorY}
              fontSize={NOTEHEAD_FONT_SIZE}
              fontFamily="Bravura, serif"
              fill="#1A1A18"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {String.fromCodePoint(0xE0A4)}
            </text>
            <line
              x1={stemUp ? anchorX + STEM_OFFSET : anchorX - STEM_OFFSET}
              y1={anchorY}
              x2={stemUp ? anchorX + STEM_OFFSET : anchorX - STEM_OFFSET}
              y2={stemUp ? anchorY - STEM_LENGTH : anchorY + STEM_LENGTH}
              stroke="#1A1A18"
              strokeWidth="2.2"
            />
          </g>
        )
      })()}

      {anchorLabel && anchorY !== null && (
        <text
          x={anchorX}
          y={H - 24}
          textAnchor="middle"
          fontFamily="var(--font-cormorant), serif"
          fontSize="18"
          fill="#7A7060"
        >
          {anchorLabel}
        </text>
      )}

      {/* Ghost-notehead hover preview — renders under the tap zone so
          the pointer still lands on the rect. Muted grey, same fontSize
          as a real notehead so the preview is faithful to the result. */}
      {hoverPitch && !feedback && (() => {
        const gY = pitchToYGrand(hoverPitch, L)
        if (gY === null) return null
        const stemUp = stemDirectionUpForPitch(hoverPitch)
        return (
          <g opacity={0.3} pointerEvents="none">
            {ledgerLinesFor(hoverPitch, '#7A7060', markerX)}
            <text
              x={markerX}
              y={gY}
              fontSize={NOTEHEAD_FONT_SIZE}
              fontFamily="Bravura, serif"
              fill="#7A7060"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {String.fromCodePoint(0xE0A4)}
            </text>
            <line
              x1={stemUp ? markerX + STEM_OFFSET : markerX - STEM_OFFSET}
              y1={gY}
              x2={stemUp ? markerX + STEM_OFFSET : markerX - STEM_OFFSET}
              y2={stemUp ? gY - STEM_LENGTH : gY + STEM_LENGTH}
              stroke="#7A7060"
              strokeWidth="2.2"
            />
          </g>
        )
      })()}

      {/* Tap zone — large invisible rect covering the full tappable area.
          Captures both mouse and touch. */}
      <rect
        x={tapLeft}
        y={L.trebleTop - L.step * 6}
        width={tapRight - tapLeft}
        height={(L.bassTop + 8 * L.step + L.step * 6) - (L.trebleTop - L.step * 6)}
        fill="transparent"
        style={{ cursor: feedback ? 'default' : 'pointer' }}
        onClick={handleTap}
        onMouseMove={handleHover}
        onMouseLeave={handleLeave}
      />

      {/* Correct-answer marker (shown on wrong) — hollow half-note head
          (U+E0A3) at the target position in green, with stem. Distinct
          from the user's filled notehead so both read clearly. */}
      {feedback === 'wrong' && correctPitch && correctY !== null && (() => {
        const stemUp = stemDirectionUpForPitch(correctPitch)
        return (
          <g>
            <text
              x={markerX}
              y={correctY}
              fontSize={NOTEHEAD_FONT_SIZE}
              fontFamily="Bravura, serif"
              fill="#3B6D11"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {String.fromCodePoint(0xE0A3)}
            </text>
            <line
              x1={stemUp ? markerX + STEM_OFFSET : markerX - STEM_OFFSET}
              y1={correctY}
              x2={stemUp ? markerX + STEM_OFFSET : markerX - STEM_OFFSET}
              y2={stemUp ? correctY - STEM_LENGTH : correctY + STEM_LENGTH}
              stroke="#3B6D11"
              strokeWidth="2.2"
            />
          </g>
        )
      })()}

      {/* User's marker — filled Bravura notehead (U+E0A4) + stem,
          coloured by feedback state. */}
      {markerPitch && markerY !== null && (() => {
        const stemUp = stemDirectionUpForPitch(markerPitch)
        return (
          <g>
            <text
              x={markerX}
              y={markerY}
              fontSize={NOTEHEAD_FONT_SIZE}
              fontFamily="Bravura, serif"
              fill={markerColor}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {String.fromCodePoint(0xE0A4)}
            </text>
            <line
              x1={stemUp ? markerX + STEM_OFFSET : markerX - STEM_OFFSET}
              y1={markerY}
              x2={stemUp ? markerX + STEM_OFFSET : markerX - STEM_OFFSET}
              y2={stemUp ? markerY - STEM_LENGTH : markerY + STEM_LENGTH}
              stroke={markerColor}
              strokeWidth="2.2"
            />
          </g>
        )
      })()}
    </svg>
  )
}
