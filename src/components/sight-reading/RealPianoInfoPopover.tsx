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

  useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function onPointer(e: MouseEvent) {
      const target = e.target as Element | null
      if (!target) return
      // Belt-and-braces exemption: ref-contains for the trigger
      // button + a CSS-class closest() walk that also covers any
      // ⓘ icon if more get added later. Real-user click-throughs
      // were closing the popover via bubbled pointerdown — the
      // closest() check makes this immune to event timing and
      // text-node retargeting.
      if (target.closest && target.closest('.nl-sr-info-icon')) return
      if (popRef.current?.contains(target as Node)) return
      if (triggerRef.current?.contains(target as Node)) return
      onClose()
    }

    // Defer to the next macrotask so the click that opened the
    // popover has fully finished propagating before we attach.
    // Without this, the same pointerdown that triggered the open
    // can still be in flight when React commits, attaches the
    // listener, and the listener fires on the trailing edge —
    // closing the popover immediately.
    const id = window.setTimeout(() => {
      window.addEventListener('keydown', onKey)
      window.addEventListener('pointerdown', onPointer)
    }, 0)

    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
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
