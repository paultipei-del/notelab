'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { PULSE_COPY } from '@/lib/metronomeData'

interface TempoRangeInfoPopoverProps {
  /** Viewport-y of the info button's top edge, captured at open time.
   *  Consumed by the mobile media query in globals.css (via the
   *  --nl-met-info-anchor-top CSS variable) to switch the popover to
   *  fixed positioning that fits within the viewport. */
  anchorTop: number | null
  onClose: () => void
}

/**
 * Dark ink popover anchored above the info icon. Closes on outside
 * click, Escape key, or the × button. Body copy uses `<em>` for the
 * highlighted phrases — see PULSE_COPY in metronomeData.ts.
 *
 * On mobile (≤767px) we switch to fixed positioning with viewport
 * insets so the popover can't run off the left edge — the info
 * button sits near the left of the strip and the popover is wider
 * than the available space to the right. The anchor-top variable is
 * set inline so the mobile CSS can place it just above the button.
 */
export default function TempoRangeInfoPopover({
  anchorTop,
  onClose,
}: TempoRangeInfoPopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null)

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

  const style: CSSProperties = {
    ['--nl-met-info-anchor-top' as string]:
      anchorTop != null ? `${anchorTop}px` : '120px',
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={PULSE_COPY.heading}
      className="nl-met-info-popover"
      style={style}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="nl-met-info-popover__close"
      >
        ×
      </button>
      <div className="nl-met-info-popover__heading">{PULSE_COPY.heading}</div>
      <p
        className="nl-met-info-popover__body"
        dangerouslySetInnerHTML={{ __html: PULSE_COPY.body }}
      />
    </div>
  )
}
