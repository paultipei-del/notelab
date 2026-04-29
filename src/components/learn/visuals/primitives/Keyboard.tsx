import React from 'react'
import type { LearnTokens } from '@/lib/learn/visuals/tokens'
import { midiToPitch } from '@/lib/learn/visuals/pitch'

interface KeyboardProps {
  startMidi?: number
  endMidi?: number
  x?: number
  y?: number
  T: LearnTokens
  highlightedMidis?: number[]
  dimmedMidis?: number[]
  highlightColor?: string
  onKeyEnter?: (midi: number, pitch: string) => void
  onKeyLeave?: (midi: number, pitch: string) => void
  onKeyClick?: (midi: number, pitch: string) => void
  /**
   * Label rendering:
   *  - 'none'                — no labels
   *  - 'c-only'              — single 'C' on each C key (default)
   *  - 'all'                 — letter on each white key (C, D, E, ...)
   *  - 'all-c-with-octave'   — octave-tagged label on each C ('C1', 'C2', ...)
   */
  showLabels?: 'none' | 'c-only' | 'all' | 'all-c-with-octave'
  /**
   * Override the per-white-key width. Used for wide ranges (e.g. full 88-key)
   * where the default would produce an unwieldy SVG. Falls back to T.keyboardWhiteKeyWidth.
   */
  whiteKeyWidthOverride?: number
}

const BLACK_KEY_AFTER = new Set([0, 1, 3, 4, 5])
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11]

function isWhiteKey(midi: number): boolean {
  return WHITE_PCS.includes(((midi % 12) + 12) % 12)
}

export function Keyboard({
  startMidi = 60, endMidi = 72,
  x = 0, y = 0, T,
  highlightedMidis = [], dimmedMidis = [], highlightColor,
  onKeyEnter, onKeyLeave, onKeyClick,
  showLabels = 'c-only',
  whiteKeyWidthOverride,
}: KeyboardProps) {
  const highlights = new Set(highlightedMidis)
  const dimmed = new Set(dimmedMidis)
  const whiteKeys: number[] = []
  for (let m = startMidi; m <= endMidi; m++) {
    if (isWhiteKey(m)) whiteKeys.push(m)
  }

  const ww = whiteKeyWidthOverride ?? T.keyboardWhiteKeyWidth
  const wh = T.keyboardWhiteKeyHeight
  // Black-key width and height are scaled proportionally to white-key width
  // so the keyboard remains visually balanced even when ww is overridden small.
  const widthRatio = ww / T.keyboardWhiteKeyWidth
  const bw = whiteKeyWidthOverride ? Math.max(4, T.keyboardBlackKeyWidth * widthRatio) : T.keyboardBlackKeyWidth
  const bh = T.keyboardBlackKeyHeight

  return (
    <g>
      {whiteKeys.map((midi, i) => {
        const pitch = midiToPitch(midi)
        const letter = pitch.replace(/[#\d]/g, '')
        const isHighlighted = highlights.has(midi)
        const isC = letter === 'C'
        const showLabel =
          showLabels === 'all'
          || (showLabels === 'c-only' && isC)
          || (showLabels === 'all-c-with-octave' && isC)
        const labelText = showLabels === 'all-c-with-octave' && isC
          ? `C${Math.floor(midi / 12) - 1}`
          : letter
        return (
          <g
            key={midi}
            onClick={() => onKeyClick?.(midi, pitch)}
            onMouseEnter={() => onKeyEnter?.(midi, pitch)}
            onMouseLeave={() => onKeyLeave?.(midi, pitch)}
            style={{ cursor: onKeyClick ? 'pointer' : 'default' }}
          >
            <rect
              x={x + i * ww} y={y}
              width={ww} height={wh}
              fill={
                isHighlighted
                  ? (dimmed.has(midi) ? T.bgCream : (highlightColor ?? T.highlightFill))
                  : T.keyboardWhiteKeyFill
              }
              stroke={T.ink} strokeWidth={T.keyboardKeyStroke}
              style={{ transition: T.hoverTransition }}
            />
            {showLabel && (
              <text
                x={x + i * ww + ww / 2}
                y={y + wh - Math.max(6, ww * 0.18)}
                fontSize={Math.max(8, Math.min(T.smallLabelFontSize, ww * 0.62))}
                fontFamily={T.fontLabel}
                fill={T.inkMuted}
                textAnchor="middle"
              >
                {labelText}
              </text>
            )}
          </g>
        )
      })}
      {whiteKeys.map((midi, i) => {
        if (i === whiteKeys.length - 1) return null
        const pc = ((midi % 12) + 12) % 12
        const pcIdx = WHITE_PCS.indexOf(pc)
        if (!BLACK_KEY_AFTER.has(pcIdx)) return null
        const blackMidi = midi + 1
        const blackPitch = midiToPitch(blackMidi)
        const isHighlighted = highlights.has(blackMidi)
        const blackX = x + (i + 1) * ww - bw / 2
        return (
          <g
            key={blackMidi}
            onClick={() => onKeyClick?.(blackMidi, blackPitch)}
            onMouseEnter={() => onKeyEnter?.(blackMidi, blackPitch)}
            onMouseLeave={() => onKeyLeave?.(blackMidi, blackPitch)}
            style={{ cursor: onKeyClick ? 'pointer' : 'default' }}
          >
            <rect
              x={blackX} y={y}
              width={bw} height={bh}
              fill={
                isHighlighted
                  ? (dimmed.has(blackMidi) ? T.inkSubtle : T.highlightAccent)
                  : T.keyboardBlackKeyFill
              }
              style={{ transition: T.hoverTransition }}
            />
          </g>
        )
      })}
    </g>
  )
}
