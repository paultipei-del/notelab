'use client'

import { useRef, useState } from 'react'
import { rangeFor } from '@/lib/metronomeData'
import TempoRangeInfoPopover from './TempoRangeInfoPopover'

interface TempoRangeCellProps {
  bpm: number
}

/**
 * Left cell of the reference strip. Eyebrow + info icon → italian
 * word + range label → progress bar with dot.
 */
export default function TempoRangeCell({ bpm }: TempoRangeCellProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [anchorTop, setAnchorTop] = useState<number | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { range, position } = rangeFor(bpm)
  const pct = Math.round(position * 100)

  const onToggle = () => {
    if (!popoverOpen && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect()
      setAnchorTop(r.top)
    }
    setPopoverOpen(v => !v)
  }

  return (
    <div className="nl-met-range">
      <div className="nl-met-range__eyebrow-row">
        <span className="nl-met-section__eyebrow">Tempo range</span>
        <div className="nl-met-range__info-wrap">
          <button
            ref={buttonRef}
            type="button"
            aria-label="About these ranges"
            aria-expanded={popoverOpen}
            onClick={onToggle}
            className={
              'nl-met-range__info' + (popoverOpen ? ' is-open' : '')
            }
          >
            ⓘ
          </button>
          {popoverOpen && (
            <TempoRangeInfoPopover
              anchorTop={anchorTop}
              onClose={() => setPopoverOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="nl-met-range__head">
        <span className="nl-met-range__word">{range.name}</span>
        <span className="nl-met-range__bounds">
          {range.min} – {range.max} BPM
        </span>
      </div>

      <div className="nl-met-range__bar">
        <div
          className="nl-met-range__fill"
          style={{ width: `${pct}%` }}
        />
        <div
          className="nl-met-range__dot"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>
      <div className="nl-met-range__labels">
        <span>{range.min}</span>
        <span>{range.max}</span>
      </div>
    </div>
  )
}
