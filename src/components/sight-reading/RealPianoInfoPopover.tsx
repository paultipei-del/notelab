'use client'

import { useEffect, useRef } from 'react'

interface RealPianoInfoPopoverProps {
  open: boolean
  onClose: () => void
  /** Element the popover should anchor to — used for outside-click
   *  exemption so clicking the trigger doesn't immediately re-close. */
  triggerRef: React.RefObject<HTMLElement | null>
}

/**
 * Small cream-tinted info popover anchored under the ⓘ icon next to
 * "Real Piano" in the answer-mode segmented control. Explains what
 * Real Piano mode does and that mic permission is required.
 */
export default function RealPianoInfoPopover({
  open,
  onClose,
  triggerRef,
}: RealPianoInfoPopoverProps) {
  const popRef = useRef<HTMLDivElement | null>(null)

  // Close on Escape or outside click. Trigger element is exempt so
  // clicking it again toggles via the parent's handler instead of
  // closing here and then immediately re-opening.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Node
      if (popRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    // pointerdown beats click: closes before the trigger's onClick
    // fires, which is what we want when the user clicks elsewhere.
    window.addEventListener('pointerdown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onClick)
    }
  }, [open, onClose, triggerRef])

  if (!open) return null

  return (
    <div className="nl-sr-info-pop" ref={popRef} role="dialog">
      <span className="nl-sr-info-pop__eyebrow">REAL PIANO</span>
      <p className="nl-sr-info-pop__para">
        You&rsquo;ll be asked to play each note on your physical piano.
        The mic detects pitch and advances automatically.
      </p>
      <p className="nl-sr-info-pop__para">
        <b className="nl-sr-info-pop__bold">Microphone permission is required.</b>
        {' '}Works best in a quiet room with a real piano nearby.
      </p>
    </div>
  )
}
