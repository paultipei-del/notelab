'use client'

import React from 'react'
import { Caption } from './primitives/Caption'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { useSampler } from '@/lib/learn/audio/useSampler'
import type { Duration, TimeSignature } from '@/lib/learn/visuals/notation-types'
import { durationToBeats, durationToSeconds } from '@/lib/learn/visuals/notation-helpers'

export interface TabNote {
  /** 1 = high E (top line), 6 = low E (bottom line). Standard guitar convention. */
  string: number
  /** 0 = open, 1-24 typical. */
  fret: number
  duration?: Duration
}

export interface TabChord {
  frets: TabNote[]
  duration?: Duration
}

export interface TabRest {
  type: 'rest'
  duration: Duration
}

export type TabElement = TabNote | TabChord | TabRest

interface TabExampleProps {
  elements: TabElement[]
  /** Tuning low → high. Default standard EADGBE: ['E2','A2','D3','G3','B3','E4']. */
  tuning?: [string, string, string, string, string, string]
  timeSignature?: TimeSignature
  showTuning?: boolean
  /** Show "TAB" label on the left edge. Default true. */
  showLabel?: boolean
  bpm?: number
  audio?: boolean
  size?: LearnSize
  caption?: string
}

const STANDARD_TUNING: [string, string, string, string, string, string] =
  ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

/** Convert (string, fret) → MIDI-style pitch using the tuning array. */
function fretToPitch(stringNum: number, fret: number, tuning: string[]): string {
  // string 1 = high (top of array's last entry); string 6 = low (first entry)
  // tuning[0] = low E (string 6), tuning[5] = high E (string 1)
  const tuningIdx = 6 - stringNum
  const open = tuning[tuningIdx]
  const m = open.match(/^([A-G])(##|bb|#|b)?(-?\d+)$/)
  if (!m) return open
  const letter = m[1]
  const acc = m[2] ?? ''
  const oct = parseInt(m[3], 10)
  // Convert open pitch to MIDI, add fret semitones, convert back.
  const LETTER_SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  let semi = LETTER_SEMI[letter] + (acc === '#' ? 1 : acc === 'b' ? -1 : acc === '##' ? 2 : acc === 'bb' ? -2 : 0)
  const midi = oct * 12 + semi + 12 + fret  // standard MIDI: C4 = 60 → octave*12 + 12
  const newOct = Math.floor((midi - 12) / 12)
  const newSemi = ((midi - 12) % 12 + 12) % 12
  // Use sharps for chromatic spelling.
  const SEMI_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  return `${SEMI_NAMES[newSemi]}${newOct}`
}

function isTabRest(el: TabElement): el is TabRest {
  return (el as TabRest).type === 'rest'
}
function isTabChord(el: TabElement): el is TabChord {
  return Array.isArray((el as TabChord).frets)
}

/**
 * Guitar tablature. Six horizontal lines = the six strings. Numbers
 * show fret positions. Audio derives pitches from string + fret using
 * the supplied tuning (default standard EADGBE).
 */
export function TabExample({
  elements,
  tuning = STANDARD_TUNING,
  timeSignature,
  showTuning = true,
  showLabel = true,
  bpm = 100,
  audio = true,
  size = 'inline',
  caption,
}: TabExampleProps) {
  const T = tokensFor(size)
  const sampler = useSampler()

  const lineGap = Math.round(11 * T.scale + 4)        // distance between strings
  const stringCount = 6
  const tabHeight = (stringCount - 1) * lineGap
  const padTop = 24
  const padBottom = 8
  const padLeft = showLabel
    ? Math.round(28 * T.scale + 6) + (showTuning ? Math.round(18 * T.scale + 6) : 0)
    : (showTuning ? Math.round(18 * T.scale + 6) : 0) + 8
  const slotW = Math.round(36 * T.scale + 14)
  const padRight = 16
  const totalW = padLeft + elements.length * slotW + padRight + 8
  const totalH = padTop + tabHeight + padBottom + 8

  const yOfString = (s: number): number => padTop + (s - 1) * lineGap

  // Bar-line x positions: when timeSignature is provided, walk durations.
  const barLineXs: number[] = []
  if (timeSignature) {
    let beats = 0
    elements.forEach((el, i) => {
      const dur = isTabRest(el) ? el.duration
        : isTabChord(el) ? (el.duration ?? 'q')
        : ((el as TabNote).duration ?? 'q')
      if (dur) beats += durationToBeats(dur, timeSignature)
      if (Math.abs(beats - timeSignature.numerator) < 1e-6 && i < elements.length - 1) {
        barLineXs.push(padLeft + (i + 1) * slotW - slotW / 2 + slotW * 0.45)
        beats = 0
      }
    })
  }

  const fontSize = Math.round(13 * T.scale + 4)
  const numberBg = '#FAFAFA'

  async function playElement(el: TabElement) {
    if (!audio) return
    if (isTabRest(el)) return
    await sampler.ensureReady()
    const Tone = await import('tone')
    const t = Tone.now()
    const ts: TimeSignature = timeSignature ?? { numerator: 4, denominator: 4 }
    const dur = isTabChord(el) ? (el.duration ?? 'q') : ((el as TabNote).duration ?? 'q')
    const seconds = durationToSeconds(dur, bpm, ts)
    const notes = isTabChord(el) ? el.frets : [el as TabNote]
    notes.forEach(n => {
      const p = fretToPitch(n.string, n.fret, tuning)
      sampler.playAt(p, seconds, t)
    })
  }

  async function playAll() {
    if (!audio) return
    await sampler.ensureReady()
    const Tone = await import('tone')
    const startTime = Tone.now() + 0.1
    const ts: TimeSignature = timeSignature ?? { numerator: 4, denominator: 4 }
    let cursor = 0
    for (const el of elements) {
      const dur = isTabRest(el) ? el.duration
        : isTabChord(el) ? (el.duration ?? 'q')
        : ((el as TabNote).duration ?? 'q')
      const seconds = durationToSeconds(dur ?? 'q', bpm, ts)
      if (!isTabRest(el)) {
        const notes = isTabChord(el) ? el.frets : [el as TabNote]
        notes.forEach(n => {
          const p = fretToPitch(n.string, n.fret, tuning)
          sampler.playAt(p, seconds, startTime + cursor)
        })
      }
      cursor += seconds
    }
  }

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Guitar tablature example'}
      >
        {/* TAB label (vertical). */}
        {showLabel && (
          <text
            x={Math.round(10 * T.scale + 4)}
            y={padTop + tabHeight / 2}
            fontSize={Math.round(T.labelFontSize + 4)}
            fontFamily={T.fontDisplay}
            fontWeight={600}
            fill={T.inkSubtle}
            textAnchor="middle"
            dominantBaseline="central"
            letterSpacing="0.16em"
          >TAB</text>
        )}

        {/* Tuning letters at left. tuning[0] = low E (string 6, bottom);
            tuning[5] = high E (string 1, top). Loop displays high → low. */}
        {showTuning && [1, 2, 3, 4, 5, 6].map(s => {
          const tuningIdx = 6 - s
          const pitchStr = tuning[tuningIdx]
          const letter = pitchStr.match(/^([A-G][#b]?)/)?.[1] ?? '?'
          const xLabel = padLeft - Math.round(10 * T.scale + 6)
          return (
            <text
              key={`tn-${s}`}
              x={xLabel}
              y={yOfString(s)}
              fontSize={Math.round(T.labelFontSize + 2)}
              fontFamily={T.fontDisplay}
              fontWeight={500}
              fill={T.ink}
              textAnchor="middle"
              dominantBaseline="central"
            >{letter}</text>
          )
        })}

        {/* Six string lines. */}
        {[1, 2, 3, 4, 5, 6].map(s => (
          <line
            key={`str-${s}`}
            x1={padLeft - 2}
            x2={padLeft + elements.length * slotW + 2}
            y1={yOfString(s)} y2={yOfString(s)}
            stroke={T.ink}
            strokeWidth={0.9}
          />
        ))}

        {/* Bar lines (when time signature given). */}
        {barLineXs.map((x, i) => (
          <line
            key={`bar-${i}`}
            x1={x} x2={x}
            y1={yOfString(1) - 2} y2={yOfString(6) + 2}
            stroke={T.ink} strokeWidth={1}
          />
        ))}

        {/* Final bar line. */}
        <line
          x1={padLeft + elements.length * slotW}
          x2={padLeft + elements.length * slotW}
          y1={yOfString(1) - 2} y2={yOfString(6) + 2}
          stroke={T.ink} strokeWidth={1}
        />

        {/* Fret numbers / rests. */}
        {elements.map((el, i) => {
          const slotCenterX = padLeft + i * slotW + slotW / 2
          if (isTabRest(el)) {
            return (
              <text
                key={`el-${i}`}
                x={slotCenterX}
                y={padTop + tabHeight / 2}
                fontSize={Math.round(T.labelFontSize + 2)}
                fontFamily={T.fontLabel}
                fontStyle="italic"
                fill={T.inkSubtle}
                textAnchor="middle"
                dominantBaseline="central"
              >—</text>
            )
          }
          const notes = isTabChord(el) ? el.frets : [el as TabNote]
          return (
            <g
              key={`el-${i}`}
              onClick={() => playElement(el)}
              style={{ cursor: audio ? 'pointer' : 'default' }}
            >
              {notes.map((n, ni) => {
                const y = yOfString(n.string)
                const fretText = String(n.fret)
                const numW = fontSize * (fretText.length === 2 ? 1.3 : 0.8)
                return (
                  <g key={`n-${i}-${ni}`}>
                    {/* Background patch to break the string line under the number. */}
                    <rect
                      x={slotCenterX - numW / 2 - 1}
                      y={y - fontSize * 0.55}
                      width={numW + 2}
                      height={fontSize * 1.05}
                      fill={numberBg}
                    />
                    <text
                      x={slotCenterX}
                      y={y}
                      fontSize={fontSize}
                      fontFamily={T.fontLabel}
                      fontWeight={600}
                      fill={T.ink}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >{fretText}</text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      {audio && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={playAll}
            style={{
              fontFamily: T.fontLabel,
              fontSize: T.labelFontSize,
              padding: '6px 14px',
              borderRadius: 100,
              border: '1px solid rgba(211,209,199,0.6)',
              background: 'rgba(253,250,245,0.55)',
              color: T.ink,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            ▶ Play
          </button>
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
