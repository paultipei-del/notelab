'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const DEMO_PATTERN_2 = {
  label: 'Simple syncopation',
  bpm: 80,
  beats: 4,
  subdivisions: 2,
  taps: [1,0, 0,1, 1,0, 0,0],
}

export default function RhythmTest() {
  const [pattern] = useState(DEMO_PATTERN_2)
  const [playing, setPlaying] = useState(false)
  const [currentSlot, setCurrentSlot] = useState(-1)
  const [taps, setTaps] = useState<number[]>([])
  const [scores, setScores] = useState<string[]>([])
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef(0)
  const startTimeRef = useRef(0)

  const totalSlots = pattern.beats * pattern.subdivisions
  const slotDuration = 60 / pattern.bpm / pattern.subdivisions

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    return ctxRef.current
  }

  const playClick = (time: number, accent: boolean) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = accent ? 1000 : 800
    gain.gain.setValueAtTime(accent ? 0.3 : 0.15, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.start(time); osc.stop(time + 0.05)
  }

  const start = useCallback(() => {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    setTaps([])
    setScores([])
    setPlaying(true)
    setCurrentSlot(0)
    const now = ctx.currentTime + 0.1
    startTimeRef.current = now
    for (let i = 0; i < totalSlots; i++) {
      const t = now + i * slotDuration
      playClick(t, i % pattern.subdivisions === 0)
    }
    const tick = () => {
      const elapsed = ctx.currentTime - startTimeRef.current
      const slot = Math.floor(elapsed / slotDuration)
      if (slot >= totalSlots) {
        setCurrentSlot(-1)
        setPlaying(false)
        return
      }
      setCurrentSlot(slot)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [pattern, slotDuration, totalSlots])

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    setPlaying(false)
    setCurrentSlot(-1)
  }

  useEffect(() => {
    if (!playing) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      const ctx = ctxRef.current
      if (!ctx) return
      const elapsed = ctx.currentTime - startTimeRef.current
      const slot = Math.round(elapsed / slotDuration)
      setTaps(prev => [...prev, Math.max(0, Math.min(slot, totalSlots - 1))])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, slotDuration, totalSlots])

  useEffect(() => {
    if (playing || taps.length === 0) return
    setScores(pattern.taps.map((expected, i) => {
      const wasTapped = taps.includes(i)
      if (expected === 1 && wasTapped) return 'hit'
      if (expected === 1 && !wasTapped) return 'miss'
      if (expected === 0 && wasTapped) return 'extra'
      return 'ok'
    }))
  }, [playing])

  const hits = scores.filter(s => s === 'hit').length
  const expected = pattern.taps.filter(t => t === 1).length

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#1A1A18', marginBottom: '8px' }}>Rhythm Trainer</h1>
      <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', marginBottom: '48px' }}>{pattern.label} · {pattern.bpm} BPM · tap Space</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '48px' }}>
        {pattern.taps.map((expected, i) => {
          const isDownbeat = i % pattern.subdivisions === 0
          const isCurrent = i === currentSlot
          const score = scores[i]
          const wasTapped = taps.includes(i)
          let bg = expected === 1 ? '#1A1A18' : 'white'
          let border = '2px solid #D3D1C7'
          if (score === 'hit') { bg = '#7EC86E'; border = '2px solid #7EC86E' }
          else if (score === 'miss') { bg = '#F09595'; border = '2px solid #F09595' }
          else if (score === 'extra') { bg = '#FCEBEB'; border = '2px solid #F09595' }
          if (isCurrent) border = '2px solid #BA7517'
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: F, fontSize: '10px', color: isDownbeat ? '#1A1A18' : 'transparent' }}>
                {isDownbeat ? Math.floor(i / pattern.subdivisions) + 1 : '·'}
              </span>
              <div style={{ width: isDownbeat ? '52px' : '40px', height: isDownbeat ? '52px' : '40px', borderRadius: '10px', background: bg, border, transition: 'all 0.1s', boxShadow: isCurrent ? '0 0 0 3px rgba(186,117,23,0.3)' : 'none' }} />
              <span style={{ fontFamily: F, fontSize: '10px', color: score === 'extra' ? '#F09595' : 'transparent' }}>✗</span>
            </div>
          )
        })}
      </div>

      {!playing ? (
        <button onClick={start} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 40px', fontFamily: F, fontSize: '14px', fontWeight: 300, cursor: 'pointer' }}>
          {scores.length > 0 ? 'Try Again' : 'Start'}
        </button>
      ) : (
        <button onClick={stop} style={{ background: 'none', color: '#888780', border: '1px solid #D3D1C7', borderRadius: '12px', padding: '14px 40px', fontFamily: F, fontSize: '14px', fontWeight: 300, cursor: 'pointer' }}>
          Stop
        </button>
      )}

      {scores.length > 0 && !playing && (
        <p style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 300, color: '#1A1A18', marginTop: '32px' }}>
          {hits}/{expected} · {Math.round(hits/expected*100)}%
        </p>
      )}
    </div>
  )
}
