// Consolidated level data for the unified /sight-reading hub.
// Single source of truth — replaces the inline LEVELS constants
// that previously lived in /note-id/page.tsx and /sight-read/page.tsx
// (both deleted as part of the unification patch).
//
// Deck IDs map to entries in src/lib/sightReadDecks.ts. The Starter
// level routes through `-free` (not `-starter`) — that's the
// established suffix for the entry-tier deck in each clef.

export type Clef = 'treble' | 'bass' | 'grand'

export type LevelPhase =
  | 'range-expansion'
  | 'with-accidentals'
  | 'full-chromatic'

export interface SightReadingLevel {
  /** Level slug — stable identifier for the level itself (independent
   *  of clef). Used for keying React lists and URL params. */
  id: string
  /** Display label shown in the level card (e.g. "Starter", "L1"). */
  num: string
  /** Pedagogical title shown below the label (e.g. "Anchors"). */
  title: string
  /** Range string shown in italic Cormorant under the title. */
  range: string
  /** Maps to the actual deckId in src/lib/sightReadDecks.ts —
   *  templated per-clef via levelDeckId(). */
  deckSuffix: string
  phase: LevelPhase
}

/** Pedagogical level set — same shape for all three clefs. Ranges
 *  vary by clef; deck data lives in src/lib/sightReadDecks.ts and
 *  the ranges below are display-only labels. */
export const SIGHT_READING_LEVELS: Record<Clef, SightReadingLevel[]> = {
  treble: [
    { id: 'starter', num: 'Starter', title: 'Full Staff',  range: 'C4–F5',         deckSuffix: 'free', phase: 'range-expansion' },
    { id: 'l1',      num: 'L1',      title: 'Anchors',     range: 'C4 + G4',       deckSuffix: '1',    phase: 'range-expansion' },
    { id: 'l2',      num: 'L2',      title: 'Five Notes',  range: 'C4–G4',         deckSuffix: '2',    phase: 'range-expansion' },
    { id: 'l3',      num: 'L3',      title: 'Octave',      range: 'C4–C5',         deckSuffix: '3',    phase: 'range-expansion' },
    { id: 'l4',      num: 'L4',      title: 'Extended',    range: 'C4–A5',         deckSuffix: '4',    phase: 'range-expansion' },
    { id: 'l5',      num: 'L5',      title: 'Full Range',  range: 'A3–C6',         deckSuffix: '5',    phase: 'range-expansion' },
    { id: 'l6',      num: 'L6',      title: '5 Notes ♯♭',  range: 'C4–G4',         deckSuffix: '6',    phase: 'with-accidentals' },
    { id: 'l7',      num: 'L7',      title: 'Octave ♯♭',   range: 'C4–C5',         deckSuffix: '7',    phase: 'with-accidentals' },
    { id: 'l8',      num: 'L8',      title: 'Extended ♯♭', range: 'C4–A5',         deckSuffix: '8',    phase: 'with-accidentals' },
    { id: 'l9',      num: 'L9',      title: 'Full Range ♯♭', range: 'A3–C6',       deckSuffix: '9',    phase: 'with-accidentals' },
    { id: 'l10',     num: 'L10',     title: 'Mastery',     range: 'F3–E6 · every note', deckSuffix: '10', phase: 'full-chromatic' },
  ],
  bass: [
    { id: 'starter', num: 'Starter', title: 'Full Staff',  range: 'G2–C4',         deckSuffix: 'free', phase: 'range-expansion' },
    { id: 'l1',      num: 'L1',      title: 'Anchors',     range: 'F3 + C4',       deckSuffix: '1',    phase: 'range-expansion' },
    { id: 'l2',      num: 'L2',      title: 'Five Notes',  range: 'F3–C4',         deckSuffix: '2',    phase: 'range-expansion' },
    { id: 'l3',      num: 'L3',      title: 'Octave',      range: 'C3–C4',         deckSuffix: '3',    phase: 'range-expansion' },
    { id: 'l4',      num: 'L4',      title: 'Extended',    range: 'E2–C4',         deckSuffix: '4',    phase: 'range-expansion' },
    { id: 'l5',      num: 'L5',      title: 'Full Range',  range: 'C2–E4',         deckSuffix: '5',    phase: 'range-expansion' },
    { id: 'l6',      num: 'L6',      title: '5 Notes ♯♭',  range: 'F3–C4',         deckSuffix: '6',    phase: 'with-accidentals' },
    { id: 'l7',      num: 'L7',      title: 'Octave ♯♭',   range: 'C3–C4',         deckSuffix: '7',    phase: 'with-accidentals' },
    { id: 'l8',      num: 'L8',      title: 'Extended ♯♭', range: 'E2–C4',         deckSuffix: '8',    phase: 'with-accidentals' },
    { id: 'l9',      num: 'L9',      title: 'Full Range ♯♭', range: 'C2–E4',       deckSuffix: '9',    phase: 'with-accidentals' },
    { id: 'l10',     num: 'L10',     title: 'Mastery',     range: 'A1–G4 · every note', deckSuffix: '10', phase: 'full-chromatic' },
  ],
  grand: [
    { id: 'starter', num: 'Starter', title: 'Landmarks',   range: 'F3 · C4 · G4',  deckSuffix: 'free', phase: 'range-expansion' },
    { id: 'l1',      num: 'L1',      title: 'Anchors',     range: 'Both staves',   deckSuffix: '1',    phase: 'range-expansion' },
    { id: 'l2',      num: 'L2',      title: 'One Octave',  range: 'C3–C5',         deckSuffix: '2',    phase: 'range-expansion' },
    { id: 'l3',      num: 'L3',      title: 'Extended',    range: 'F2–G5',         deckSuffix: '3',    phase: 'range-expansion' },
    { id: 'l4',      num: 'L4',      title: 'Full Range',  range: 'C2–C6',         deckSuffix: '4',    phase: 'range-expansion' },
    { id: 'l5',      num: 'L5',      title: 'All Naturals', range: 'C2–C6',        deckSuffix: '5',    phase: 'range-expansion' },
    { id: 'l6',      num: 'L6',      title: 'Octave ♯♭',   range: 'C3–C5',         deckSuffix: '6',    phase: 'with-accidentals' },
    { id: 'l7',      num: 'L7',      title: 'Extended ♯♭', range: 'F2–G5',         deckSuffix: '7',    phase: 'with-accidentals' },
    { id: 'l8',      num: 'L8',      title: 'Full Range ♯♭', range: 'C2–C6',       deckSuffix: '8',    phase: 'with-accidentals' },
    { id: 'l9',      num: 'L9',      title: 'Extended Chromatic', range: 'C2–C6',  deckSuffix: '9',    phase: 'with-accidentals' },
    { id: 'l10',     num: 'L10',     title: 'Mastery',     range: 'Grand · every note', deckSuffix: '10', phase: 'full-chromatic' },
  ],
}

/** Map a clef + level to the canonical deck ID in sightReadDecks.ts. */
export function levelDeckId(clef: Clef, level: SightReadingLevel): string {
  return `sight-read-${clef}-${level.deckSuffix}`
}

/** Group a clef's levels by phase, preserving the registry order. */
export function groupedByPhase(clef: Clef): {
  phase: LevelPhase
  levels: SightReadingLevel[]
}[] {
  const out: { phase: LevelPhase; levels: SightReadingLevel[] }[] = []
  for (const level of SIGHT_READING_LEVELS[clef]) {
    const existing = out.find(g => g.phase === level.phase)
    if (existing) existing.levels.push(level)
    else out.push({ phase: level.phase, levels: [level] })
  }
  return out
}

export const PHASE_META: Record<LevelPhase, { label: string; hint: string }> = {
  'range-expansion':   { label: 'Range expansion',  hint: 'naturals only · expanding range' },
  'with-accidentals':  { label: 'With accidentals', hint: 'same ranges + sharps & flats' },
  'full-chromatic':    { label: 'Full chromatic',   hint: 'every note in range' },
}

export type AnswerMode = 'letters' | 'full-piano' | 'real-piano'

export const ANSWER_MODE_META: Record<
  AnswerMode,
  { label: string; sublabel?: string }
> = {
  letters:      { label: 'Letters' },
  'full-piano': { label: 'Full Piano' },
  'real-piano': { label: 'Real Piano' },
}
