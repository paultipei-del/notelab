'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const MAX_TAPS = 16
const RESET_MS = 30000

function getTempoName(bpm: number): string {
  if (bpm < 40) return 'Grave'
  if (bpm < 60) return 'Largo'
  if (bpm < 66) return 'Larghetto'
  if (bpm < 76) return 'Adagio'
  if (bpm < 108) return 'Andante'
  if (bpm < 120) return 'Moderato'
  if (bpm < 156) return 'Allegro'
  if (bpm < 176) return 'Vivace'
  if (bpm < 200) return 'Presto'
  return 'Prestissimo'
}

export default function TapTempoPage() {
  const [taps, setTaps] = useState<number[]>([])
  const [tapCount, setTapCount] = useState(0)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tap = useCallback(() => {
    const now = Date.now()
    setTaps(prev => {
      const next = prev.length >= MAX_TAPS ? prev.slice(1) : prev.slice()
      next.push(now)
      return next
    })
    setTapCount(c => c + 1)
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      setTaps([])
    }, RESET_MS)
  }, [])

  const reset = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
    setTaps([])
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === ' ') e.preventDefault()
      if (e.key !== 'Tab') tap()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [tap])

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  let bpm: number | null = null
  if (taps.length >= 2) {
    let total = 0
    for (let i = 1; i < taps.length; i++) total += taps[i] - taps[i - 1]
    const avg = total / (taps.length - 1)
    bpm = Math.round(60000 / avg)
  }
  const tempoName = bpm !== null ? getTempoName(bpm) : ''
  const showInstruction = taps.length < 2

  const handleRootClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement
    if (el.closest('[data-reset-btn]')) return
    tap()
  }

  return (
    <div
      onClick={handleRootClick}
      style={{
        background: '#F2EDDF',
        height: 'calc(var(--nl-viewport-h) - var(--nl-site-header-h))',
        minHeight: 'calc(var(--nl-viewport-h) - var(--nl-site-header-h))',
        maxHeight: 'calc(var(--nl-viewport-h) - var(--nl-site-header-h))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 1.25rem 16px',
        cursor: 'pointer',
        color: '#2A2318',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {tapCount > 0 && (
        <div
          key={`bg-${tapCount}`}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            animation: 'pvt-bg-flash 0.5s ease-out forwards',
          }}
        />
      )}

      <div style={{ position: 'relative', textAlign: 'center', width: '100%' }}>
        {tapCount > 0 && (
          <div
            key={`ring-${tapCount}`}
            aria-hidden
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: '1px solid rgba(42, 35, 24, 0.12)',
              top: 0,
              left: '50%',
              pointerEvents: 'none',
              animation: 'pvt-ring 0.6s ease-out forwards',
            }}
          />
        )}
        <span
          key={`bpm-${tapCount}`}
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 'clamp(100px, 18vw, 160px)',
            lineHeight: 1,
            color: '#2A2318',
            letterSpacing: '-0.03em',
            display: 'block',
            textAlign: 'center',
            position: 'relative',
            top: -34,
            animation: tapCount > 0 ? 'pvt-flash 0.12s ease' : 'none',
          }}
        >
          {bpm !== null ? bpm : '—'}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 12,
        }}
      >
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: 14,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#7A7060',
            display: 'block',
            textAlign: 'center',
          }}
        >
          BPM
        </span>
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 13,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#9F968A',
            marginTop: 8,
            minHeight: 18,
            textAlign: 'center',
            display: 'block',
          }}
        >
          {tempoName}
        </span>
        <span
          style={{
            fontFamily: F,
            fontWeight: 300,
            fontSize: 13,
            letterSpacing: '0.08em',
            color: '#9F968A',
            marginTop: '2rem',
            transition: 'opacity 0.4s ease',
            opacity: showInstruction ? 1 : 0,
            display: 'block',
            textAlign: 'center',
          }}
        >
          tap anywhere — or press any key
        </span>
        <button
          data-reset-btn
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            reset()
          }}
          style={{
            marginTop: '1.75rem',
            background: 'transparent',
            border: '0.5px solid rgba(42, 35, 24, 0.2)',
            color: '#9F968A',
            fontFamily: F,
            fontWeight: 300,
            fontSize: 11,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            padding: '8px 24px',
            cursor: 'pointer',
            outline: 'none',
            display: 'block',
            transition: 'border-color 0.3s, color 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(42, 35, 24, 0.45)'
            e.currentTarget.style.color = '#5A5246'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(42, 35, 24, 0.2)'
            e.currentTarget.style.color = '#9F968A'
          }}
        >
          reset
        </button>
      </div>

      <style>{`
        @keyframes pvt-bg-flash {
          0% { background-color: #E8E4DC; }
          100% { background-color: transparent; }
        }
        @keyframes pvt-ring {
          0% {
            transform: translateX(-50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) scale(4);
            opacity: 0;
          }
        }
        @keyframes pvt-flash {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  )
}
