'use client'

import { useState, useRef, useEffect } from 'react'

interface InfoTipProps {
  /** Body text shown inside the tooltip. */
  text: string
  /** Size of the trigger circle in px. Defaults to 16. */
  size?: number
}

/**
 * Small "i" trigger that toggles an inline tooltip on click. Designed
 * for inline use beside a section title — e.g. "Currently reading ⓘ"
 * where tapping the icon explains the section's rules.
 *
 * Click-outside dismisses; Escape dismisses. Pointer-events on the
 * tooltip itself stay enabled so users can select copy inside it.
 */
export default function InfoTip({ text, size = 16 }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const [popTop, setPopTop] = useState<number | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span
      ref={ref}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: 8,
        verticalAlign: 'middle',
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="More information"
        aria-expanded={open}
        onClick={() => {
          if (!open && buttonRef.current) {
            const r = buttonRef.current.getBoundingClientRect()
            setPopTop(r.bottom + 8)
          }
          setOpen(v => !v)
        }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '1px solid rgba(139, 105, 20, 0.35)',
          background: open ? '#1a1208' : 'rgba(255, 250, 238, 0.85)',
          color: open ? '#f0e7d0' : '#5a4028',
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic',
          fontSize: Math.round(size * 0.65),
          fontWeight: 500,
          lineHeight: 1,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: 'background 0.12s, color 0.12s',
        }}
      >
        i
      </button>
      {open && (
        <div
          role="tooltip"
          className="nl-infotip-popover"
          style={{
            // --nl-infotip-top is consumed by the mobile media query
            // in globals.css when the popover switches to fixed
            // positioning. Falls back to 80px if popTop hasn't been
            // measured yet (first paint).
            ['--nl-infotip-top' as string]: popTop != null ? `${popTop}px` : '80px',
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 50,
            /* Cap width to viewport minus a 32px breathing margin so
               the popover never overflows the right edge on phones. */
            width: 'max-content',
            minWidth: 220,
            maxWidth: 'min(320px, calc(100vw - 32px))',
            padding: '12px 14px',
            background: 'rgba(255, 250, 238, 0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(139, 105, 20, 0.2)',
            borderRadius: 8,
            boxShadow: '0 6px 20px rgba(40, 20, 8, 0.12)',
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 13,
            lineHeight: 1.5,
            color: '#2a1f12',
            fontStyle: 'normal',
            letterSpacing: '0.005em',
            textTransform: 'none',
          }}
        >
          {text}
        </div>
      )}
    </span>
  )
}
