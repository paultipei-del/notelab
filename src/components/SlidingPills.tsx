'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface Option<T extends string> {
  value: T
  label: string
  shortLabel?: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  fontSize?: string
  /** When true, container fills available width and tabs share it via flex:1. */
  fullWidth?: boolean
  /** Optional className on the outer container (lets pages add page-specific tweaks). */
  className?: string
}

export default function SlidingPills<T extends string>({ options, value, onChange, fontSize = '13px', fullWidth = false, className }: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  const activeIdx = options.findIndex(o => o.value === value)

  const moveTo = useCallback((idx: number) => {
    const btn = btnRefs.current[idx]
    if (!btn) return
    setPill({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [])

  useEffect(() => {
    if (activeIdx >= 0) moveTo(activeIdx)
  }, [value, activeIdx, moveTo])

  // Recalc on resize so the pill width stays glued to the active tab when
  // breakpoint-driven label/padding changes the active button's width.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => { if (activeIdx >= 0) moveTo(activeIdx) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [activeIdx, moveTo])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        display: fullWidth ? 'flex' : 'inline-flex',
        padding: '3px',
        width: fullWidth ? '100%' : undefined,
        border: '1px solid var(--brown-faint, rgba(154, 124, 80, 0.32))',
        borderRadius: '100px',
        background: 'var(--cream-card, rgba(248, 240, 216, 0.55))',
        boxSizing: 'border-box',
      }}
      onMouseLeave={() => { if (activeIdx >= 0) moveTo(activeIdx) }}
    >
      {/* Sliding pill */}
      {pill && (
        <div style={{
          position: 'absolute',
          left: pill.left,
          width: pill.width,
          top: '3px',
          bottom: '3px',
          background: 'var(--oxblood, #a0381c)',
          borderRadius: '9999px',
          transition: 'left 300ms ease-out, width 300ms ease-out',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}
      {options.map((opt, idx) => (
        <button
          key={opt.value}
          ref={el => { btnRefs.current[idx] = el }}
          onClick={() => onChange(opt.value)}
          onMouseEnter={() => moveTo(idx)}
          className="nl-sliding-pill-btn"
          data-active={value === opt.value ? 'true' : 'false'}
          style={{
            position: 'relative', zIndex: 1,
            background: 'transparent', border: 'none',
            borderRadius: '9999px',
            padding: '8px 18px',
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize,
            fontWeight: 400,
            color: value === opt.value ? '#fff' : 'var(--brown, #5a4028)',
            letterSpacing: '0.015em',
            whiteSpace: 'nowrap' as const,
            cursor: 'pointer',
            transition: 'color 200ms',
            flex: fullWidth ? 1 : undefined,
          }}
        >
          <span className="nl-sliding-pill-btn__full">{opt.label}</span>
          {opt.shortLabel && <span className="nl-sliding-pill-btn__short">{opt.shortLabel}</span>}
        </button>
      ))}
    </div>
  )
}
