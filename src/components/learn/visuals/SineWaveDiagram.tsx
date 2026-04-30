'use client'

import React from 'react'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { useTone } from '@/lib/learn/audio/useTone'
import { Caption } from './primitives/Caption'

interface SineWaveDiagramProps {
  size?: LearnSize
  /** Initial frequency in Hz. Default 220 (low A). */
  initialFrequency?: number
  /** Initial amplitude (0-1). Default 0.6. */
  initialAmplitude?: number
  /** Show interactive sliders + play button. Default true. */
  interactive?: boolean
  caption?: string
}

export function SineWaveDiagram({
  size = 'inline',
  initialFrequency = 150,
  initialAmplitude = 0.6,
  interactive = true,
  caption,
}: SineWaveDiagramProps) {
  const T = tokensFor(size)
  const { isPlaying, start, stop, setFrequency, setGain } = useTone()

  const [frequency, setFrequencyState] = React.useState(initialFrequency)
  const [amplitude, setAmplitudeState] = React.useState(initialAmplitude)

  // SVG geometry
  const margin = Math.round(40 * T.scale + 16)
  // Right side needs extra room for the amplitude bracket + label, which extends
  // beyond the wave's right edge. Without this, "amplitude" and "time →" clip.
  const rightMargin = margin + Math.round(80 * T.scale)
  const innerWidth = Math.max(420, T.keyboardWhiteKeyWidth * 7 + 80)
  const innerHeight = Math.round(180 * T.scale + 40)
  const totalW = innerWidth + margin + rightMargin
  const totalH = innerHeight + 2 * margin

  const axisY = margin + innerHeight / 2
  const axisStartX = margin
  const axisEndX = margin + innerWidth

  // The wavelength is inversely proportional to frequency for visualization.
  // Map: at 100 Hz, ~1 cycle visible across the diagram. At 800 Hz, ~8 cycles.
  // The wavelength in pixels is inversely proportional to displayed frequency.
  const baseWavelength = 200  // pixels at 100 Hz
  const wavelengthPx = baseWavelength * (100 / frequency)
  const cyclesVisible = innerWidth / wavelengthPx

  // Amplitude in pixels: at amplitude=1, the wave reaches the top/bottom of the inner area.
  const amplitudePx = (innerHeight / 2 - 20) * amplitude

  // Build SVG path for the sine wave
  const segments = 200
  const pathPoints: string[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = axisStartX + t * innerWidth
    const phase = (t * cyclesVisible) * 2 * Math.PI
    const y = axisY - Math.sin(phase) * amplitudePx
    pathPoints.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  const wavePath = pathPoints.join(' ')

  // Wavelength bracket: spans one complete cycle near the start of the wave
  // (peak-to-peak — but we'll use zero-crossing-to-zero-crossing for visual clarity)
  // First peak is at phase = π/2, which is t = 1/(4 cyclesVisible) of the way across
  const firstPeakT = 1 / (4 * cyclesVisible)
  const secondPeakT = firstPeakT + 1 / cyclesVisible
  const wavelengthBracketX1 = axisStartX + firstPeakT * innerWidth
  const wavelengthBracketX2 = axisStartX + secondPeakT * innerWidth
  const wavelengthBracketY = axisY - amplitudePx - 18 - Math.round(8 * T.scale)

  // Show the wavelength bracket only if at least one full cycle fits
  const showWavelengthBracket = secondPeakT <= 1

  // Amplitude bracket: vertical, on the right side, from axis to peak
  const amplitudeBracketX = axisEndX + 16
  const amplitudeBracketYTop = axisY - amplitudePx
  const amplitudeBracketYBottom = axisY

  // Play/pause handler
  const handleTogglePlay = async () => {
    if (isPlaying) {
      await stop()
    } else {
      await start(frequency, amplitude * 0.3)  // cap gain at 0.3 to avoid being painful
    }
  }

  // When sliders change, update the audio if playing
  const handleFrequencyChange = (hz: number) => {
    setFrequencyState(hz)
    if (isPlaying) setFrequency(hz)
  }

  const handleAmplitudeChange = (a: number) => {
    setAmplitudeState(a)
    if (isPlaying) setGain(a * 0.3)
  }

  const tickColor = T.inkSubtle
  const waveColor = T.ink
  const annotationColor = T.highlightAccent

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Sine wave with labeled amplitude and wavelength'}
      >
        {/* x-axis (rest line) */}
        <line
          x1={axisStartX} y1={axisY}
          x2={axisEndX + 24} y2={axisY}
          stroke={tickColor} strokeWidth={1} strokeDasharray="3 3"
        />
        <text
          x={axisEndX + 28} y={axisY + 4}
          fontSize={T.smallLabelFontSize} fontFamily={T.fontLabel}
          fill={T.inkSubtle} textAnchor="start"
        >
          time →
        </text>

        {/* the sine wave */}
        <path d={wavePath} fill="none" stroke={waveColor} strokeWidth={2} strokeLinejoin="round" />

        {/* amplitude bracket: vertical on the right */}
        <path
          d={`M ${amplitudeBracketX - 4} ${amplitudeBracketYTop} L ${amplitudeBracketX} ${amplitudeBracketYTop} L ${amplitudeBracketX} ${amplitudeBracketYBottom} L ${amplitudeBracketX - 4} ${amplitudeBracketYBottom}`}
          fill="none" stroke={annotationColor} strokeWidth={1.2}
        />
        <text
          x={amplitudeBracketX + 8} y={(amplitudeBracketYTop + amplitudeBracketYBottom) / 2 + 4}
          fontSize={T.labelFontSize} fontFamily={T.fontLabel}
          fill={annotationColor} fontWeight={500}
        >
          amplitude
        </text>

        {/* wavelength bracket: horizontal above */}
        {showWavelengthBracket && (
          <>
            <path
              d={`M ${wavelengthBracketX1} ${wavelengthBracketY + 4} L ${wavelengthBracketX1} ${wavelengthBracketY} L ${wavelengthBracketX2} ${wavelengthBracketY} L ${wavelengthBracketX2} ${wavelengthBracketY + 4}`}
              fill="none" stroke={annotationColor} strokeWidth={1.2}
            />
            <text
              x={(wavelengthBracketX1 + wavelengthBracketX2) / 2}
              y={wavelengthBracketY - 4}
              fontSize={T.labelFontSize} fontFamily={T.fontLabel}
              fill={annotationColor} fontWeight={500} textAnchor="middle"
            >
              wavelength
            </text>
          </>
        )}
      </svg>

      {interactive && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          maxWidth: 480, margin: '16px auto 0',
          fontFamily: T.fontLabel, fontSize: 13, color: T.inkMuted,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ minWidth: 100 }}>
              Frequency: <strong style={{ color: T.ink }}>{frequency} Hz</strong>
            </label>
            <input
              type="range" min={100} max={800} step={5}
              value={frequency}
              onChange={(e) => handleFrequencyChange(Number(e.target.value))}
              style={{ flex: 1, accentColor: T.highlightAccent }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ minWidth: 100 }}>
              Amplitude: <strong style={{ color: T.ink }}>{amplitude.toFixed(2)}</strong>
            </label>
            <input
              type="range" min={0.1} max={1} step={0.05}
              value={amplitude}
              onChange={(e) => handleAmplitudeChange(Number(e.target.value))}
              style={{ flex: 1, accentColor: T.highlightAccent }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <button
              onClick={handleTogglePlay}
              style={{
                fontFamily: T.fontLabel,
                fontSize: 13,
                padding: '8px 18px',
                background: isPlaying ? T.ink : 'transparent',
                color: isPlaying ? T.bgPaper : T.ink,
                border: `0.5px solid ${T.ink}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 150ms ease, color 150ms ease',
              }}
            >
              {isPlaying ? 'Stop tone' : 'Play tone'}
            </button>
          </div>
        </div>
      )}

      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
