'use client'

import React from 'react'
import { Keyboard, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { midiToPitch } from '@/lib/learn/visuals/pitch'

type StepMode = 'half' | 'whole'

interface HalfStepsKeyboardProps {
  /** Start MIDI of the visible range. Default 60 (C4). */
  startMidi?: number
  /** End MIDI (inclusive) of the visible range. Default 72 (C5). */
  endMidi?: number
  size?: LearnSize
  caption?: string
}

const PC_DISPLAY_NAMES = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B',
]

function midiName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${PC_DISPLAY_NAMES[pc]}${octave}`
}

function midiNameNoOctave(midi: number): string {
  const pc = ((midi % 12) + 12) % 12
  return PC_DISPLAY_NAMES[pc]
}

/**
 * Click-to-play piano for the Half Steps and Whole Steps lesson with a
 * Half Steps / Whole Steps mode toggle. In each mode, clicking any key
 * highlights that key plus its step-partner one (HS) or two (WS)
 * semitones above, and plays both in sequence so you hear the interval.
 *
 * Hover any key to see its name.
 */
export function HalfStepsKeyboard({
  startMidi = 60,
  endMidi = 72,
  size = 'inline',
  caption,
}: HalfStepsKeyboardProps) {
  const T = tokensFor(size)
  const { ready, play } = useSampler()
  const [interacted, setInteracted] = React.useState(false)
  const [hoveredMidi, setHoveredMidi] = React.useState<number | null>(null)
  const [mode, setMode] = React.useState<StepMode>('half')
  const [selected, setSelected] = React.useState<{ from: number; to: number } | null>(null)

  // Reset selection when mode flips so a stale "C → C♯" doesn't linger
  // in WS mode where the partner would be a whole step away instead.
  React.useEffect(() => { setSelected(null) }, [mode])

  // Layout
  const margin = Math.round(20 * T.scale + 8)
  let whiteKeyCount = 0
  for (let m = startMidi; m <= endMidi; m++) {
    const pc = ((m % 12) + 12) % 12
    if ([0, 2, 4, 5, 7, 9, 11].includes(pc)) whiteKeyCount++
  }
  const whiteKeyWidth = T.keyboardWhiteKeyWidth
  const keyboardWidth = whiteKeyWidth * whiteKeyCount

  const labelHeight = T.labelFontSize + 6
  const keyboardX = margin
  const keyboardY = margin + labelHeight

  const totalW = keyboardX + keyboardWidth + margin
  const totalH = keyboardY + T.keyboardWhiteKeyHeight + margin

  const handleKeyClick = async (midi: number) => {
    setInteracted(true)
    const offset = mode === 'half' ? 1 : 2
    const partner = midi + offset
    // If the partner falls outside the visible range, still highlight
    // the clicked key and play it; just no partner to highlight/play.
    if (partner > endMidi) {
      setSelected({ from: midi, to: midi })
      await play(midiToPitch(midi))
      return
    }
    setSelected({ from: midi, to: partner })
    // Sequence both keys so the interval is audible.
    await play(midiToPitch(midi))
    await new Promise(r => setTimeout(r, 320))
    await play(midiToPitch(partner))
  }

  const highlightedMidis = selected
    ? selected.from === selected.to
      ? [selected.from]
      : [selected.from, selected.to]
    : []

  const hoverPitch = hoveredMidi !== null ? midiName(hoveredMidi) : null
  const readout = (() => {
    if (selected && selected.from !== selected.to) {
      return `${midiNameNoOctave(selected.from)} → ${midiNameNoOctave(selected.to)}  ·  ${mode === 'half' ? 'half step' : 'whole step'}`
    }
    if (hoverPitch) return hoverPitch
    return mode === 'half'
      ? 'Click any key — the next key up is a half step away.'
      : 'Click any key — skip one key, the next is a whole step away.'
  })()

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW, width: 'fit-content' }}>
      {/* Mode toggle ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        fontFamily: T.fontLabel,
        fontSize: 13,
      }}>
        {(['half', 'whole'] as const).map(m => {
          const active = mode === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '7px 18px',
                background: active ? T.ink : 'transparent',
                color: active ? '#FFFEF8' : T.ink,
                border: `0.5px solid ${T.ink}`,
                borderRadius: 8,
                fontFamily: T.fontLabel,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                letterSpacing: '0.01em',
                minWidth: 116,
                transition: 'background 150ms ease, color 150ms ease',
              }}
            >
              {m === 'half' ? 'Half steps' : 'Whole steps'}
            </button>
          )
        })}
      </div>

      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Half steps and whole steps on a piano keyboard.'}
      >
        <text
          x={totalW / 2}
          y={margin + T.labelFontSize - 2}
          fontSize={T.labelFontSize}
          fontFamily={T.fontLabel}
          fill={selected ? T.highlightAccent : T.inkSubtle}
          textAnchor="middle"
          fontWeight={selected ? 600 : 500}
        >
          {readout}
        </text>

        <Keyboard
          startMidi={startMidi}
          endMidi={endMidi}
          x={keyboardX}
          y={keyboardY}
          T={T}
          highlightedMidis={highlightedMidis}
          onKeyEnter={(midi) => setHoveredMidi(midi)}
          onKeyLeave={() => setHoveredMidi(null)}
          onKeyClick={(midi) => handleKeyClick(midi)}
          showLabels="c-only"
        />
      </svg>

      {interacted && !ready && (
        <p style={{
          fontFamily: T.fontLabel,
          fontSize: T.smallLabelFontSize,
          color: T.inkSubtle,
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: 6,
          marginBottom: 0,
        }}>
          Loading piano samples…
        </p>
      )}

      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
