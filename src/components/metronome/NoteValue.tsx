'use client'

import type { NoteValueDef } from '@/lib/metronomeData'

interface NoteValueProps {
  def: NoteValueDef
  bpm: number
  /** True when this subdivision is the active audio subdivision. */
  active: boolean
  /** True when the active subdivision differs from the default
   *  'quarter' (drives the oxblood treatment — 'quarter' is "neutral
   *  active" and stays muted). */
  oxblood: boolean
  onClick: () => void
}

/**
 * Composite triplet figure rendered for the eighth-triplet card.
 * Same three-quarter-glyph base as the quarter-triplet (no manual
 * stem-drawing — the U+E1D5 glyph carries its own stem), with a
 * single horizontal beam line connecting the stem tops. The only
 * visual difference from the quarter-triplet is the absence of
 * end-ticks: bracket = with ticks, beam = without.
 */
function EighthTripletGlyph() {
  return (
    <div className="nl-met-note__triplet is-eighth">
      <span className="nl-met-note__triplet-3">3</span>
      <span className="nl-met-note__triplet-beam" aria-hidden />
      <span className="nl-met-note__triplet-quarters" aria-hidden>
        <span>{''}</span>
        <span>{''}</span>
        <span>{''}</span>
      </span>
    </div>
  )
}

/**
 * Composite triplet figure rendered for the quarter-triplet card.
 * Three quarter-note glyphs (U+E1D5) with a CSS bracket above and
 * Cormorant italic "3" centered. Quarters never beam, so the
 * full-glyph rendering is correct.
 */
function QuarterTripletGlyph() {
  return (
    <div className="nl-met-note__triplet is-quarter">
      <span className="nl-met-note__triplet-3">3</span>
      <span className="nl-met-note__triplet-bracket" aria-hidden />
      <span className="nl-met-note__triplet-quarters" aria-hidden>
        <span>{''}</span>
        <span>{''}</span>
        <span>{''}</span>
      </span>
    </div>
  )
}

/**
 * Single note-value card. Clicking sets the audio subdivision; the
 * active card gets the oxblood treatment (unless the active
 * subdivision is the default 'quarter', which stays neutral).
 *
 * Triplet entries render composite figures (notes + beam/bracket +
 * "3") instead of the single parent glyph.
 */
export default function NoteValue({
  def,
  bpm,
  active,
  oxblood,
  onClick,
}: NoteValueProps) {
  const derived = Math.round(bpm * def.multiplier)

  const cls = [
    'nl-met-note',
    def.isDotted ? 'is-dotted' : '',
    active && oxblood ? 'is-active' : '',
    active && !oxblood ? 'is-neutral-active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  let glyphContent
  if (def.id === 'eighth-triplet') {
    glyphContent = <EighthTripletGlyph />
  } else if (def.id === 'quarter-triplet') {
    glyphContent = <QuarterTripletGlyph />
  } else {
    glyphContent = <span className="nl-met-note__glyph-char">{def.glyph}</span>
  }

  return (
    <button type="button" className={cls} onClick={onClick}>
      <div className="nl-met-note__glyph">{glyphContent}</div>
      <div className="nl-met-note__bpm">{derived}</div>
      <div className="nl-met-note__label nl-met-note__label--desktop">
        {def.label}
      </div>
      <div className="nl-met-note__label nl-met-note__label--mobile">
        {def.mobileLabel}
      </div>
    </button>
  )
}
