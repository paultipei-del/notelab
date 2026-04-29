'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface PulseTimelineProps {
  /** Total tick marks. Default 16. */
  tickCount?: number
  /** Every Nth tick is accented (i.e. a downbeat). Default 4. */
  accentEvery?: number
  /** BPM for playback. Default 80. */
  tempo?: number
  /** Show a play/stop button. Default true. */
  showAudio?: boolean
  size?: LearnSize
  caption?: string
}

/**
 * PulseTimeline — horizontal click-train with accents at every Nth tick.
 * Accented ticks are taller, thicker, coral; standard ticks are short and ink.
 * Click play to hear the metronomic clicks at the given tempo.
 */
export function PulseTimeline({
  tickCount = 16,
  accentEvery = 4,
  tempo = 80,
  showAudio = true,
  size = 'inline',
  caption,
}: PulseTimelineProps) {
  const T = tokensFor(size)
  const [playing, setPlaying] = React.useState(false)
  const [activeTick, setActiveTick] = React.useState<number | null>(null)
  const stopRef = React.useRef<(() => void) | null>(null)

  const margin = Math.round(20 * T.scale + 8)
  const width = Math.max(420, Math.round(tickCount * 36 * T.scale))
  const tickGap = (width - 2 * margin) / (tickCount - 1)
  const axisY = Math.round(80 * T.scale)
  const tickShort = Math.round(10 * T.scale)
  const tickTall = Math.round(20 * T.scale)
  const labelY = axisY - tickTall - Math.round(10 * T.scale)
  const totalH = axisY + Math.round(40 * T.scale) + (caption ? 0 : 0) + margin
  const totalW = width

  const tickX = (i: number) => margin + i * tickGap

  const handleToggle = async () => {
    if (playing) {
      stopRef.current?.()
      stopRef.current = null
      setPlaying(false)
      setActiveTick(null)
      return
    }
    try {
      const Tone = await import('tone')
      // Lazy-create per-play synth so multiple components don't collide
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      }).toDestination()
      if (Tone.getContext().state !== 'running') await Tone.start()
      const intervalSec = 60 / tempo
      const startTime = Tone.now() + 0.05
      let tickIdx = 0
      const timeouts: ReturnType<typeof setTimeout>[] = []
      for (let i = 0; i < tickCount; i++) {
        const accent = i % accentEvery === 0
        const t = startTime + i * intervalSec
        const freq = accent ? 1500 : 1000
        synth.triggerAttackRelease(freq, 0.05, t)
        const ms = (t - Tone.now()) * 1000
        timeouts.push(setTimeout(() => setActiveTick(i), Math.max(0, ms)))
        tickIdx = i
      }
      const totalMs = (tickCount * intervalSec + 0.1) * 1000
      timeouts.push(setTimeout(() => {
        synth.dispose()
        setPlaying(false)
        setActiveTick(null)
      }, totalMs))
      stopRef.current = () => {
        timeouts.forEach(clearTimeout)
        try { synth.dispose() } catch {}
      }
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  React.useEffect(() => {
    return () => {
      stopRef.current?.()
    }
  }, [])

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Pulse timeline with accent ticks'}
      >
        {/* Axis */}
        <line
          x1={margin}
          y1={axisY}
          x2={width - margin}
          y2={axisY}
          stroke={T.ink}
          strokeWidth={T.staffLineStroke}
        />
        {/* Ticks */}
        {Array.from({ length: tickCount }, (_, i) => {
          const x = tickX(i)
          const accent = i % accentEvery === 0
          const isActive = activeTick === i
          const stroke = isActive
            ? T.highlightAccent
            : (accent ? T.highlightAccent : T.ink)
          const len = accent ? tickTall : tickShort
          const w = accent ? Math.max(2, Math.round(2 * T.scale)) : Math.max(1, T.staffLineStroke)
          return (
            <g key={`tick-${i}`}>
              <line
                x1={x}
                y1={axisY - len / 2}
                x2={x}
                y2={axisY + len / 2}
                stroke={stroke}
                strokeWidth={w}
              />
              {accent && (
                <text
                  x={x}
                  y={labelY}
                  fontSize={T.labelFontSize}
                  fontFamily={T.fontLabel}
                  fill={isActive ? T.highlightAccent : T.inkMuted}
                  textAnchor="middle"
                  fontWeight={600}
                >
                  {Math.floor(i / accentEvery) + 1}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {showAudio && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button
            type="button"
            onClick={handleToggle}
            style={{
              fontFamily: T.fontLabel,
              fontSize: 13,
              padding: '8px 18px',
              background: 'transparent',
              border: `0.5px solid ${T.ink}`,
              borderRadius: 8,
              cursor: 'pointer',
              color: T.ink,
            }}
          >
            {playing ? 'Stop' : `Play (${tempo} BPM)`}
          </button>
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
