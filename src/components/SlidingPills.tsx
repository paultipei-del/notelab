'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

const F = 'var(--font-jost), sans-serif'

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  fontSize?: string
}

export default function SlidingPills<T extends string>({ options, value, onChange, fontSize = '13px' }: Props<T>) {
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

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-flex', padding: '3px' }}
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
          background: '#2A2318',
          borderRadius: '9999px',
          boxShadow: '0 1px 4px rgba(26,26,24,0.1)',
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
          style={{
            position: 'relative', zIndex: 1,
            background: 'transparent', border: 'none',
            borderRadius: '9999px',
            padding: '6px 16px',
            fontFamily: F, fontSize, fontWeight: 300,
            color: value === opt.value ? '#ECE3CC' : '#7A7060',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap' as const,
            cursor: 'pointer',
            transition: 'color 200ms',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
