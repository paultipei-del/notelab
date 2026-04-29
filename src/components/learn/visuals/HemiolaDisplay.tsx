'use client'

import React from 'react'
import { Staff, RhythmicNote, TimeSignature, Caption, useNoteHighlight } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize, lineY } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'

interface HemiolaDisplayProps {
  /** Tempo for playback (eighth-note BPM in 6/8). Default 100. */
  tempo?: number
  size?: LearnSize
  caption?: string
}

const TOP_PITCH = 'A4'
const BOTTOM_PITCH = 'F4'

// Eighth-note grid in 6/8 has 6 slots: 0..5.
// Top voice: 2 dotted-quarters at slots 0 and 3 (each spans 3 eighths).
// Bottom voice: 3 quarters at slots 0, 2, 4 (each spans 2 eighths).
const TOP_NOTES = [{ slot: 0 }, { slot: 3 }]
const BOTTOM_NOTES = [{ slot: 0 }, { slot: 2 }, { slot: 4 }]

export function HemiolaDisplay({
  tempo = 100,
  size = 'inline',
  caption,
}: HemiolaDisplayProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const { highlightedMidis, highlight, flash } = useNoteHighlight()

  const topParsed = parsePitch(TOP_PITCH)
  const bottomParsed = parsePitch(BOTTOM_PITCH)
  if (!topParsed || !bottomParsed) return null
  const topMidi = topParsed.midi
  const bottomMidi = bottomParsed.midi
  const topPos = staffPosition(topParsed, 'treble')
  const bottomPos = staffPosition(bottomParsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(440 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(48 * T.scale) + margin

  const tsX = staffX + Math.round(70 * T.scale)
  const noteAreaStart = tsX + Math.round(36 * T.scale)
  const noteAreaEnd = staffX + staffWidth - Math.round(20 * T.scale)
  const slotWidth = (noteAreaEnd - noteAreaStart) / 6

  const xForSlot = (slot: number) => noteAreaStart + (slot + 0.4) * slotWidth

  const topY = lineY(staffY, 0, T) + topPos * T.step
  const bottomY = lineY(staffY, 0, T) + bottomPos * T.step

  const playVoice = async (voice: 'top' | 'bottom' | 'both') => {
    setInteracted(true)
    const beatSec = 60 / tempo  // 1 eighth-note duration
    const startMs = performance.now() + 100
    const schedule = (slots: number[], pitch: string, midi: number) => {
      slots.forEach(s => {
        const tMs = startMs + s * beatSec * 1000
        setTimeout(() => {
          flash(midi, beatSec * 1000)
          void play(pitch)
        }, tMs - performance.now())
      })
    }
    if (voice === 'top' || voice === 'both') {
      schedule(TOP_NOTES.map(n => n.slot), TOP_PITCH, topMidi)
    }
    if (voice === 'bottom' || voice === 'both') {
      schedule(BOTTOM_NOTES.map(n => n.slot), BOTTOM_PITCH, bottomMidi)
    }
  }

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Hemiola: 2-against-3 cross-rhythm in 6/8'}
      >
        <Staff clef="treble" x={staffX} y={staffY} width={staffWidth} T={T} />
        <TimeSignature numerator={6} denominator={8} x={tsX} staffTop={staffY} T={T} />

        {/* Eighth-note guide ticks */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = xForSlot(i)
          return (
            <line
              key={`grid-${i}`}
              x1={x}
              y1={staffY - Math.round(8 * T.scale)}
              x2={x}
              y2={staffY + 8 * T.step + Math.round(8 * T.scale)}
              stroke={T.inkSubtle}
              strokeDasharray="2 4"
              strokeWidth={0.6}
              opacity={i === 0 || i === 3 ? 0.45 : 0.25}
            />
          )
        })}

        {/* Top voice — 2 dotted-quarters, stems up */}
        {TOP_NOTES.map((n, i) => (
          <RhythmicNote
            key={`top-${i}`}
            value="quarter"
            dotted
            x={xForSlot(n.slot)}
            y={topY}
            T={T}
            stemDirection="up"
            highlight={highlightedMidis.includes(topMidi)}
            highlightColor={T.highlightAccent}
            onClick={() => { setInteracted(true); flash(topMidi); void play(TOP_PITCH) }}
            ariaLabel={`${TOP_PITCH} dotted quarter`}
          />
        ))}

        {/* Bottom voice — 3 quarters, stems down */}
        {BOTTOM_NOTES.map((n, i) => (
          <RhythmicNote
            key={`bot-${i}`}
            value="quarter"
            x={xForSlot(n.slot)}
            y={bottomY}
            T={T}
            stemDirection="down"
            highlight={highlightedMidis.includes(bottomMidi)}
            onClick={() => { setInteracted(true); flash(bottomMidi); void play(BOTTOM_PITCH) }}
            ariaLabel={`${BOTTOM_PITCH} quarter`}
          />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => playVoice('top')}
          disabled={interacted && !ready}
          style={btnStyle(T, interacted && !ready)}
        >
          Top voice (2)
        </button>
        <button
          type="button"
          onClick={() => playVoice('bottom')}
          disabled={interacted && !ready}
          style={btnStyle(T, interacted && !ready)}
        >
          Bottom voice (3)
        </button>
        <button
          type="button"
          onClick={() => playVoice('both')}
          disabled={interacted && !ready}
          style={btnStyle(T, interacted && !ready)}
        >
          Both
        </button>
      </div>
      {interacted && !ready && (
        <div style={{ fontFamily: T.fontLabel, fontSize: T.smallLabelFontSize, color: T.inkSubtle, fontStyle: 'italic', textAlign: 'center', marginTop: 6 }}>
          Loading piano samples…
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}

function btnStyle(T: ReturnType<typeof tokensFor>, loading: boolean): React.CSSProperties {
  return {
    fontFamily: T.fontLabel,
    fontSize: 13,
    padding: '8px 16px',
    background: 'transparent',
    border: `0.5px solid ${T.ink}`,
    borderRadius: 8,
    cursor: loading ? 'wait' : 'pointer',
    color: T.ink,
    opacity: loading ? 0.5 : 1,
  }
}
