'use client'

import React from 'react'
import { Keyboard, Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

interface PitchDirectionKeyboardProps {
  size?: LearnSize
  /** Lowest MIDI on the keyboard. Default 48 (C3). */
  startMidi?: number
  /** Highest MIDI on the keyboard. Default 72 (C5). */
  endMidi?: number
  caption?: string
}

export function PitchDirectionKeyboard({
  size = 'inline',
  startMidi = 48,
  endMidi = 72,
  caption,
}: PitchDirectionKeyboardProps) {
  const T = tokensFor(size)

  // Compute keyboard layout
  // Keyboard primitive renders white keys at startMidi..endMidi inclusive
  // Width is white-key-count * keyboardWhiteKeyWidth
  const whiteKeysInRange = (lo: number, hi: number) => {
    let count = 0
    for (let m = lo; m <= hi; m++) {
      const pc = ((m % 12) + 12) % 12
      // 0,2,4,5,7,9,11 are white keys (C D E F G A B)
      if ([0, 2, 4, 5, 7, 9, 11].includes(pc)) count++
    }
    return count
  }
  const whiteCount = whiteKeysInRange(startMidi, endMidi)
  const keyboardWidth = whiteCount * T.keyboardWhiteKeyWidth

  const arrowReach = Math.round(80 * T.scale)
  const labelGap = Math.round(24 * T.scale)
  const margin = Math.round(20 * T.scale + 8)

  const totalW = keyboardWidth + 2 * arrowReach + 2 * margin
  const totalH = T.keyboardWhiteKeyHeight + 2 * margin + Math.round(40 * T.scale)

  const keyboardX = margin + arrowReach
  const keyboardY = margin + Math.round(20 * T.scale)
  const axisY = keyboardY + T.keyboardWhiteKeyHeight / 2

  // Arrow geometry
  const leftArrowEndX = margin + 8
  const leftArrowStartX = keyboardX - 8
  const rightArrowStartX = keyboardX + keyboardWidth + 8
  const rightArrowEndX = totalW - margin - 8

  const arrowColor = T.highlightAccent
  const labelColor = T.highlightAccent

  return (
    <figure style={{ margin: '24px auto', maxWidth: totalW }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
        role="img"
        aria-label={caption ?? 'Keyboard showing pitch direction: lower pitch on the left, higher pitch on the right'}
      >
        {/* Keyboard */}
        <Keyboard
          startMidi={startMidi}
          endMidi={endMidi}
          x={keyboardX}
          y={keyboardY}
          T={T}
          showLabels="c-only"
        />

        {/* Left arrow (lower pitch) */}
        <line
          x1={leftArrowStartX} y1={axisY}
          x2={leftArrowEndX} y2={axisY}
          stroke={arrowColor} strokeWidth={1.4}
        />
        <path
          d={`M ${leftArrowEndX} ${axisY} L ${leftArrowEndX + 8} ${axisY - 5} M ${leftArrowEndX} ${axisY} L ${leftArrowEndX + 8} ${axisY + 5}`}
          stroke={arrowColor} strokeWidth={1.4} fill="none"
        />
        <text
          x={(leftArrowStartX + leftArrowEndX) / 2}
          y={axisY - labelGap}
          fontSize={T.labelFontSize} fontFamily={T.fontLabel}
          fill={labelColor} textAnchor="middle" fontWeight={500}
        >
          lower pitch
        </text>

        {/* Right arrow (higher pitch) */}
        <line
          x1={rightArrowStartX} y1={axisY}
          x2={rightArrowEndX} y2={axisY}
          stroke={arrowColor} strokeWidth={1.4}
        />
        <path
          d={`M ${rightArrowEndX} ${axisY} L ${rightArrowEndX - 8} ${axisY - 5} M ${rightArrowEndX} ${axisY} L ${rightArrowEndX - 8} ${axisY + 5}`}
          stroke={arrowColor} strokeWidth={1.4} fill="none"
        />
        <text
          x={(rightArrowStartX + rightArrowEndX) / 2}
          y={axisY - labelGap}
          fontSize={T.labelFontSize} fontFamily={T.fontLabel}
          fill={labelColor} textAnchor="middle" fontWeight={500}
        >
          higher pitch
        </text>
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
