'use client'

import { useEffect, useRef, useState } from 'react'
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
 * Single note-value card, clickable to set the audio subdivision.
 * Dotted variants are reference-only — clicking them flashes a
 * transient tooltip for 1.5s with a brief brown border, but does not
 * change subdivision state.
 */
export default function NoteValue({
  def,
  bpm,
  active,
  oxblood,
  onClick,
}: NoteValueProps) {
  const [refFlash, setRefFlash] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const handleClick = () => {
    if (def.isReferenceOnly) {
      setRefFlash(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setRefFlash(false), 1500)
      return
    }
    onClick()
  }

  const derived = Math.round(bpm * def.multiplier)

  const cls = [
    'nl-met-note',
    def.isTriplet ? 'is-triplet' : '',
    def.isDotted ? 'is-dotted' : '',
    active && oxblood ? 'is-active' : '',
    active && !oxblood ? 'is-neutral-active' : '',
    refFlash ? 'is-ref-flash' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={cls} onClick={handleClick}>
      <div className="nl-met-note__glyph">
        <span className="nl-met-note__glyph-char">{def.glyph}</span>
      </div>
      <div className="nl-met-note__bpm">{derived}</div>
      <div className="nl-met-note__label nl-met-note__label--desktop">
        {def.label}
      </div>
      <div className="nl-met-note__label nl-met-note__label--mobile">
        {def.mobileLabel}
      </div>
      {refFlash && (
        <span className="nl-met-note__tooltip" role="status">
          reference value
        </span>
      )}
    </button>
  )
}
