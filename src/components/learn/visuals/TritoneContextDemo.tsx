'use client'

import React from 'react'
import { Staff, NoteHead, Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { aggregateBounds, type Clef } from '@/lib/learn/visuals/pitch'

interface TritoneContextDemoProps {
  size?: LearnSize
  caption?: string
}

const SIDES = [
  {
    pitch: 'F#4',
    direction: 'up' as const,
    text: 'F♯ resolves UP — leading tone in G major.',
  },
  {
    pitch: 'Gb4',
    direction: 'down' as const,
    text: 'G♭ resolves DOWN — chromatic neighbor toward F.',
  },
]

/**
 * Two short staves side-by-side. Each shows a single notehead with a
 * directional coral arrow indicating where the note "wants" to resolve.
 *
 * No audio (the two notes sound identical anyway). Read it for what
 * spelling tells the player about function.
 *
 * Layout: each side is its own column — SVG (staff + notehead + arrow)
 * stacked above an HTML div with the text label. The HTML label wraps
 * naturally and is bounded by the column container, so it never clips
 * against the SVG viewBox.
 */
export function TritoneContextDemo({
  size = 'inline',
  caption,
}: TritoneContextDemoProps) {
  const T = tokensFor(size)

  const renderColumn = (
    pitch: string,
    direction: 'up' | 'down',
    text: string,
    keyId: string,
  ) => {
    const margin = Math.round(16 * T.scale + 4)
    const clef: Clef = 'treble'
    const innerWidth = Math.round(180 * T.scale)
    const staffX = margin
    const staffWidth = innerWidth
    const noteAreaX = staffX + T.clefReserve
    const noteAreaWidth = staffWidth - T.clefReserve - margin
    const noteX = noteAreaX + noteAreaWidth * 0.55

    const provisional = aggregateBounds([pitch], 0, clef, T)
    const arrowReserve = Math.round(40 * T.scale)
    const headroom = Math.max(0, -provisional.top) + arrowReserve
    const staffY = margin + headroom

    const bounds = aggregateBounds([pitch], staffY, clef, T)

    const arrowShaftBottom = bounds.top - Math.round(6 * T.scale)
    const arrowShaftTop = arrowShaftBottom - Math.round(28 * T.scale)
    const arrowHeadHalf = Math.round(5 * T.scale)
    const isUp = direction === 'up'
    const tipY = isUp ? arrowShaftTop : arrowShaftBottom
    const baseY = isUp
      ? arrowShaftTop + Math.round(8 * T.scale)
      : arrowShaftBottom - Math.round(8 * T.scale)
    const arrowX = noteX

    // totalH must reach below the staff bottom — the treble clef glyph
    // hangs ~4 staff-positions past the lowest line, and clipping it
    // mid-curl looks broken (and was visually merging with the HTML
    // text below the SVG).
    const staffBottom = staffY + 8 * T.step
    const clefTailReserve = Math.round(4 * T.step)
    const totalH = Math.max(bounds.bottom, staffBottom + clefTailReserve) + margin
    const totalW = staffX + staffWidth + margin

    return (
      <div
        key={keyId}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: '1 1 240px',
          maxWidth: 320,
          minWidth: 180,
        }}
      >
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          width="100%"
          style={{ display: 'block', maxWidth: totalW, height: 'auto' }}
          role="img"
          aria-label={`${pitch} — ${text}`}
        >
          <Staff clef={clef} x={staffX} y={staffY} width={staffWidth} T={T} />
          <NoteHead
            pitch={pitch}
            staffTop={staffY}
            x={noteX}
            clef={clef}
            T={T}
            duration="whole"
            ariaLabel={pitch}
          />
          <line
            x1={arrowX}
            y1={isUp ? arrowShaftBottom : arrowShaftTop}
            x2={arrowX}
            y2={isUp ? arrowShaftTop : arrowShaftBottom}
            stroke={T.highlightAccent}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <path
            d={`M ${arrowX - arrowHeadHalf} ${baseY} L ${arrowX + arrowHeadHalf} ${baseY} L ${arrowX} ${tipY} Z`}
            fill={T.highlightAccent}
          />
        </svg>
        <div
          style={{
            fontFamily: T.fontLabel,
            fontSize: 14,
            color: T.ink,
            fontWeight: 500,
            textAlign: 'center',
            marginTop: 14,
            lineHeight: 1.5,
            maxWidth: 280,
          }}
        >
          {text}
        </div>
      </div>
    )
  }

  return (
    <figure
      style={{
        margin: '24px auto',
        width: 'fit-content',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 32,
          justifyContent: 'center',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {SIDES.map((s, i) =>
          renderColumn(s.pitch, s.direction, s.text, `side-${i}`),
        )}
      </div>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
