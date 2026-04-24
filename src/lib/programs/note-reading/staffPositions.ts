/**
 * Shared pitch → staff-position maps. Extracted so the Locate drill can
 * reverse the lookup (Y coordinate → pitch) without duplicating StaffCard
 * / GrandStaffCard internals.
 *
 * Position convention matches the display cards:
 *   pos  0 = top staff line of that clef
 *   pos  1 = top space
 *   pos  2 = 2nd line (from top)
 *   …
 *   pos  8 = bottom staff line
 *   pos 10 = first ledger line below the staff
 *   pos -2 = first ledger line above the staff
 *
 * For the grand staff, the two clefs are rendered with a vertical gap
 * (eight steps of staff + ~48px gutter). `GRAND_STAFF_LAYOUT` re-exposes
 * those constants so the interactive overlay lines up exactly with the
 * static GrandStaffCard visuals.
 */

export const TREBLE_POSITIONS: Record<string, number> = {
  'E6': -6, 'D6': -5, 'C6': -4, 'B5': -3, 'A5': -2, 'G5': -1,
  'F5': 0, 'E5': 1, 'D5': 2, 'C5': 3, 'B4': 4,
  'A4': 5, 'G4': 6, 'F4': 7, 'E4': 8,
  'D4': 9, 'C4': 10, 'B3': 11, 'A3': 12,
}

export const BASS_POSITIONS: Record<string, number> = {
  'G4': -6, 'F4': -5, 'E4': -4, 'D4': -3, 'C4': -2, 'B3': -1,
  'A3': 0, 'G3': 1, 'F3': 2, 'E3': 3, 'D3': 4,
  'C3': 5, 'B2': 6, 'A2': 7, 'G2': 8,
  'F2': 9, 'E2': 10, 'D2': 11, 'C2': 12, 'B1': 13, 'A1': 14,
}

// The treble-range side of the grand staff covers everything treble can
// render. The bass side covers its own range. For the overlap zone (C4,
// D4, B3, A3…) we prefer the treble side when the natural pitch sits at
// ledger positions below treble but above the bass clef — matches
// GrandStaffCard's `isOnTreble` logic.
const TREBLE_NOTES = new Set(Object.keys(TREBLE_POSITIONS))

export function isOnTrebleStaff(pitch: string): boolean {
  const natural = pitch.replace(/[#b]/, '')
  return TREBLE_NOTES.has(natural)
}

// Shared layout constants — must stay in sync with GrandStaffCard.tsx so
// the interactive overlay lands on the same pixels as the rendered staff.
export const GRAND_STAFF_LAYOUT = {
  W: 300,
  step: 6,
  staffLeft: 60,
  staffWidth: 200,
  trebleTop: 55,
  // bassTop = trebleTop + 8*step + 48 — eight staff steps plus a ~48px gutter.
  bassTop: 55 + 8 * 6 + 48,
} as const

// Same vertical constants at a larger scale, used by the interactive
// Locate-drill overlay where tap targets need to be finger-friendly.
export const GRAND_STAFF_LAYOUT_LARGE = {
  W: 480,
  step: 12,
  staffLeft: 90,
  staffWidth: 340,
  trebleTop: 80,
  bassTop: 80 + 8 * 12 + 72,
} as const

export type GrandLayout = typeof GRAND_STAFF_LAYOUT | typeof GRAND_STAFF_LAYOUT_LARGE

// Vertical pixel Y for a given natural pitch on the grand staff.
export function pitchToYGrand(pitch: string, layout: GrandLayout): number | null {
  const onTreble = isOnTrebleStaff(pitch)
  const positions = onTreble ? TREBLE_POSITIONS : BASS_POSITIONS
  const natural = pitch.replace(/[#b]/, '')
  const pos = positions[natural]
  if (pos === undefined) return null
  const top = onTreble ? layout.trebleTop : layout.bassTop
  return top + pos * layout.step
}

// Reverse lookup: for a tap Y, find the closest pitch in the given pool.
// "Closest" = minimum absolute Y distance to pitchToYGrand for each pool
// member. Returns { pitch, deltaPx } or null if the pool is empty / no
// positions resolve.
export function closestPitchForY(
  y: number,
  pool: string[],
  layout: GrandLayout,
): { pitch: string; deltaPx: number } | null {
  let best: { pitch: string; deltaPx: number } | null = null
  for (const p of pool) {
    const targetY = pitchToYGrand(p, layout)
    if (targetY === null) continue
    const d = Math.abs(y - targetY)
    if (best === null || d < best.deltaPx) best = { pitch: p, deltaPx: d }
  }
  return best
}

// Build a snap-grid of every possible line/space position on the grand
// staff (ledger lines included up to 2 above treble and 2 below bass),
// returning { y, label } pairs so an overlay can render invisible tap
// zones for each. Label is a pitch-name approximation ("F5", "E4", etc.)
// derived from TREBLE_POSITIONS / BASS_POSITIONS. Ambiguous ledger-zone
// pitches (C4 / D4 exist in both maps) prefer the treble entry.
export function buildGrandSnapGrid(layout: GrandLayout): Array<{ y: number; pitch: string }> {
  const seen = new Map<number, string>()
  // Treble side first — covers overlap zone preferentially.
  for (const [pitch, pos] of Object.entries(TREBLE_POSITIONS)) {
    const y = layout.trebleTop + pos * layout.step
    if (!seen.has(y)) seen.set(y, pitch)
  }
  for (const [pitch, pos] of Object.entries(BASS_POSITIONS)) {
    const y = layout.bassTop + pos * layout.step
    if (!seen.has(y)) seen.set(y, pitch)
  }
  return Array.from(seen.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([y, pitch]) => ({ y, pitch }))
}
