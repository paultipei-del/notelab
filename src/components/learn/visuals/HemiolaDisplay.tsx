'use client'

import React from 'react'
import { Staff, RhythmicNote, TimeSignature, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { useLoopingPlayback, type PlaybackEvent } from '@/lib/learn/audio/useLoopingPlayback'
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

// Each note in the visual has a unique key so we can highlight one at a
// time during playback. (Within a voice, every note has the same pitch,
// so MIDI-based highlighting would light all top notes — or all bottom
// notes — together.)
type NoteKey = `top-${number}` | `bot-${number}`

export function HemiolaDisplay({
  tempo = 160,
  size = 'inline',
  caption,
}: HemiolaDisplayProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const [activeKeys, setActiveKeys] = React.useState<ReadonlySet<NoteKey>>(new Set())
  const { isPlaying, start, stop } = useLoopingPlayback()
  const [mode, setMode] = React.useState<'top' | 'bottom' | 'both' | null>(null)

  const topParsed = parsePitch(TOP_PITCH)
  const bottomParsed = parsePitch(BOTTOM_PITCH)
  if (!topParsed || !bottomParsed) return null
  const topPos = staffPosition(topParsed, 'treble')
  const bottomPos = staffPosition(bottomParsed, 'treble')

  const margin = Math.round(20 * T.scale + 8)
  const staffWidth = Math.round(480 * T.scale)
  const staffX = margin
  const staffY = margin + Math.round(40 * T.scale)
  const totalW = staffX + staffWidth + margin
  const totalH = staffY + 8 * T.step + Math.round(48 * T.scale) + margin

  // Time signature sits clear of the treble clef (clef takes ~70*scale).
  const clefReserve = Math.round(70 * T.scale)
  const tsX = staffX + clefReserve + Math.round(20 * T.scale)
  const noteAreaStart = tsX + Math.round(40 * T.scale)
  const noteAreaEnd = staffX + staffWidth - Math.round(20 * T.scale)
  const slotWidth = (noteAreaEnd - noteAreaStart) / 6

  const xForSlot = (slot: number) => noteAreaStart + (slot + 0.4) * slotWidth

  const topY = lineY(staffY, 0, T) + topPos * T.step
  const bottomY = lineY(staffY, 0, T) + bottomPos * T.step

  const flashKey = (key: NoteKey, durMs: number) => {
    setActiveKeys(prev => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
    setTimeout(() => {
      setActiveKeys(prev => {
        if (!prev.has(key)) return prev
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }, durMs)
  }

  const playVoice = (voice: 'top' | 'bottom' | 'both') => {
    // Click the same button while it's playing → stop. Click a different
    // button → switch to that voice. The looping hook handles the
    // teardown of the previous schedule when start() is called again.
    if (mode === voice && isPlaying) {
      stop()
      return
    }
    setInteracted(true)
    setMode(voice)

    const eighthSec = 60 / tempo  // 1 eighth-note duration
    const events: PlaybackEvent[] = []

    if (voice === 'top' || voice === 'both') {
      TOP_NOTES.forEach((n, i) => {
        events.push({
          offset: n.slot * eighthSec,
          fire: () => {
            // Each top note (dotted quarter) lasts 3 eighth-note slots.
            flashKey(`top-${i}` as NoteKey, 3 * eighthSec * 1000)
            void play(TOP_PITCH)
          },
        })
      })
    }
    if (voice === 'bottom' || voice === 'both') {
      BOTTOM_NOTES.forEach((n, i) => {
        events.push({
          offset: n.slot * eighthSec,
          fire: () => {
            // Each bottom note (quarter) lasts 2 eighth-note slots.
            flashKey(`bot-${i}` as NoteKey, 2 * eighthSec * 1000)
            void play(BOTTOM_PITCH)
          },
        })
      })
    }

    start(events, {
      iterationMs: 6 * eighthSec * 1000,
      onStop: () => {
        setActiveKeys(new Set())
        setMode(null)
      },
    })
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

        {/* Final barline */}
        <line
          x1={noteAreaEnd + Math.round(8 * T.scale)}
          y1={staffY}
          x2={noteAreaEnd + Math.round(8 * T.scale)}
          y2={staffY + 8 * T.step}
          stroke={T.ink}
          strokeWidth={Math.max(1, Math.round(1.4 * T.scale))}
        />

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
        {TOP_NOTES.map((n, i) => {
          const key = `top-${i}` as NoteKey
          return (
            <RhythmicNote
              key={key}
              value="quarter"
              dotted
              x={xForSlot(n.slot)}
              y={topY}
              T={T}
              stemDirection="up"
              highlight={activeKeys.has(key)}
              highlightColor={T.highlightAccent}
              onClick={() => {
                setInteracted(true)
                flashKey(key, 320)
                void play(TOP_PITCH)
              }}
              ariaLabel={`${TOP_PITCH} dotted quarter`}
            />
          )
        })}

        {/* Bottom voice — 3 quarters, stems down */}
        {BOTTOM_NOTES.map((n, i) => {
          const key = `bot-${i}` as NoteKey
          return (
            <RhythmicNote
              key={key}
              value="quarter"
              x={xForSlot(n.slot)}
              y={bottomY}
              T={T}
              stemDirection="down"
              highlight={activeKeys.has(key)}
              onClick={() => {
                setInteracted(true)
                flashKey(key, 320)
                void play(BOTTOM_PITCH)
              }}
              ariaLabel={`${BOTTOM_PITCH} quarter`}
            />
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => playVoice('top')}
          disabled={interacted && !ready && !isPlaying}
          style={btnStyle(T, interacted && !ready && !isPlaying)}
        >
          {mode === 'top' && isPlaying ? 'Stop' : 'Top voice (2)'}
        </button>
        <button
          type="button"
          onClick={() => playVoice('bottom')}
          disabled={interacted && !ready && !isPlaying}
          style={btnStyle(T, interacted && !ready && !isPlaying)}
        >
          {mode === 'bottom' && isPlaying ? 'Stop' : 'Bottom voice (3)'}
        </button>
        <button
          type="button"
          onClick={() => playVoice('both')}
          disabled={interacted && !ready && !isPlaying}
          style={btnStyle(T, interacted && !ready && !isPlaying)}
        >
          {mode === 'both' && isPlaying ? 'Stop' : 'Both'}
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
    // Fixed width so the row doesn't shift when labels swap to "Stop".
    minWidth: 130,
    textAlign: 'center',
  }
}
