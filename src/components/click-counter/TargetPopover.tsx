'use client'

import { useEffect, useRef } from 'react'
import {
  REP_PRESETS,
  SET_PRESETS,
  MIN_TARGET,
  MAX_REP_TARGET,
  MAX_SET_TARGET,
} from './clickCounterState'

export type TargetKind = 'rep' | 'set'

interface TargetPopoverProps {
  kind: TargetKind
  value: number
  onChange: (v: number) => void
  onClose: () => void
  /** Desktop anchor (mobile always uses a bottom-sheet pattern via
   *  CSS media query). 'above' drops up from the trigger; 'below'
   *  available for future use. */
  align?: 'above' | 'below'
}

const HEAD = {
  rep: 'Reps per set',
  set: 'Sets per session',
} as const

/**
 * Picker for the rep / set target. Two visual modes share the same
 * markup, swapped via CSS media query in globals.css:
 *
 * - **Desktop (≥768px):** an anchored popover above the trigger, with
 *   a segmented control + ± stepper. Closes on outside-click or
 *   Escape; backdrop and Done button are hidden.
 *
 * - **Mobile (<768px):** a bottom sheet pinned to the viewport. The
 *   backdrop is interactive (tap to close), the grabber pill is
 *   visible, and the Done button sits at the bottom — anchored
 *   popover positioning is dropped so the sheet never clips at the
 *   bottom of the screen.
 *
 * The segmented control + stepper share a single source of truth
 * (the `value` prop). Active segment is derived per render via
 * `presetValue === value`, so stepping away from a preset clears the
 * highlight automatically; stepping back onto one lights it up.
 */
export default function TargetPopover({
  kind,
  value,
  onChange,
  onClose,
  align = 'above',
}: TargetPopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const presets = kind === 'rep' ? REP_PRESETS : SET_PRESETS
  const max = kind === 'rep' ? MAX_REP_TARGET : MAX_SET_TARGET

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const clamp = (n: number) => Math.max(MIN_TARGET, Math.min(max, Math.round(n)))

  return (
    <>
      {/* Backdrop — mobile only (hidden on desktop via CSS). Clicking
          it falls through to the document-level outside-click handler
          since it's outside `ref`. */}
      <div className="nl-cc-popover-backdrop" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-label={HEAD[kind]}
        className={'nl-cc-popover is-align-' + align}
        onClick={e => e.stopPropagation()}
      >
        <span className="nl-cc-popover__grabber" aria-hidden />
        <div className="nl-cc-popover__head">{HEAD[kind]}</div>

        <div className="nl-cc-popover__segmented" role="group" aria-label={HEAD[kind]}>
          {presets.map(n => (
            <button
              key={n}
              type="button"
              className={
                'nl-cc-popover__segment' + (n === value ? ' is-active' : '')
              }
              aria-pressed={n === value}
              onClick={e => {
                e.stopPropagation()
                onChange(clamp(n))
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="nl-cc-popover__stepper">
          <span className="nl-cc-popover__stepper-label">
            <span className="nl-cc-popover__stepper-label--desktop">or set custom</span>
            <span className="nl-cc-popover__stepper-label--mobile">custom</span>
          </span>
          <button
            type="button"
            aria-label="Decrease"
            className="nl-cc-popover__step"
            onClick={e => {
              e.stopPropagation()
              onChange(clamp(value - 1))
            }}
          >
            −
          </button>
          <span className="nl-cc-popover__stepper-value">{value}</span>
          <button
            type="button"
            aria-label="Increase"
            className="nl-cc-popover__step"
            onClick={e => {
              e.stopPropagation()
              onChange(clamp(value + 1))
            }}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="nl-cc-popover__done"
          onClick={e => {
            e.stopPropagation()
            onClose()
          }}
        >
          Done
        </button>
      </div>
    </>
  )
}
