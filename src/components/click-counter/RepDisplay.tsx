'use client'

import type { MouseEvent as ReactMouseEvent } from 'react'

interface RepDisplayProps {
  count: number
  target: number
  /** True during the 600ms set-completion window — count pulses
   *  oxblood and the caption switches to "Set complete!". */
  celebrating: boolean
  /** True during the 400ms reset-streak dissolve animation. */
  dissolving: boolean
  /** Opens the rep-target TargetPopover when the target chip is
   *  clicked. */
  onTargetClick: (e: ReactMouseEvent<HTMLSpanElement>) => void
}

/**
 * The page's centrepiece: huge Cormorant `count / target` with the
 * target dashed-underlined and clickable. Celebration + dissolve
 * keyframes are CSS-driven via class hooks.
 */
export default function RepDisplay({
  count,
  target,
  celebrating,
  dissolving,
  onTargetClick,
}: RepDisplayProps) {
  // During the celebration window, freeze the displayed count at
  // target (e.g. 10/10). After the celebration the parent will snap
  // count to 0.
  const shown = celebrating ? target : count
  return (
    <>
      <div
        className={
          'nl-cc-rep' +
          (celebrating ? ' is-celebrating' : '') +
          (dissolving ? ' is-dissolving' : '')
        }
      >
        <span className="nl-cc-rep__count">{shown}</span>
        <span className="nl-cc-rep__sep">/</span>
        <span
          role="button"
          tabIndex={0}
          className="nl-cc-rep__target"
          onClick={onTargetClick}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              onTargetClick(e as unknown as ReactMouseEvent<HTMLSpanElement>)
            }
          }}
          aria-label={`Reps per set: ${target} — click to change`}
        >
          {target}
        </span>
      </div>
      <div className={'nl-cc-rep__caption' + (celebrating ? ' is-celebrating' : '')}>
        {celebrating ? 'Set complete!' : 'Consecutive Reps'}
      </div>
    </>
  )
}
