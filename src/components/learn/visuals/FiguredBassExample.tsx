'use client'

import React from 'react'
import { Staff, NoteHead, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition, type Clef } from '@/lib/learn/visuals/pitch'
import { engraveChord } from '@/lib/learn/visuals/chord-engraving'

const SHARP_ORDER: Array<'F' | 'C' | 'G' | 'D' | 'A' | 'E' | 'B'> = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER: Array<'B' | 'E' | 'A' | 'D' | 'G' | 'C' | 'F'> = ['B', 'E', 'A', 'D', 'G', 'C', 'F']
const TREBLE_SHARP_POS: Record<string, number> = { F: 0, C: 3, G: -1, D: 2, A: 5, E: 1, B: 4 }
const TREBLE_FLAT_POS: Record<string, number> = { B: 4, E: 1, A: 5, D: 2, G: 6, C: 3, F: 7 }
const BASS_SHARP_POS: Record<string, number> = { F: 2, C: 5, G: 1, D: 4, A: 7, E: 3, B: 6 }
const BASS_FLAT_POS: Record<string, number> = { B: 6, E: 3, A: 7, D: 4, G: 1, C: 5, F: 2 }

export interface FiguredBassNote {
  pitch: string
  figures?: string[]
  romanNumeral?: string
  realization?: string[]
}

interface FiguredBassExampleProps {
  notes: FiguredBassNote[]
  showRealization?: boolean
  showRomanNumerals?: boolean
  keySignature?: number
  audio?: boolean
  size?: LearnSize
  caption?: string
}

export function FiguredBassExample({
  notes,
  showRealization = false,
  showRomanNumerals = false,
  keySignature = 0,
  audio = true,
  size = 'inline',
  caption,
}: FiguredBassExampleProps) {
  const T = tokensFor(size)
  const { playChord, play } = useSampler()

  const margin = Math.round(20 * T.scale + 10)
  const clefReserve = T.clefReserve
  const clefGap = Math.round(18 * T.scale)
  const isSharp = keySignature > 0
  const ksCount = Math.abs(keySignature)
  const ksOrder = isSharp ? SHARP_ORDER : FLAT_ORDER
  const ksSlot = Math.round(T.accidentalKerning * 0.95)
  const ksWidth = ksCount > 0 ? ksCount * ksSlot + Math.round(8 * T.scale) : 0
  const ksGap = ksWidth > 0 ? Math.round(12 * T.scale) : Math.round(6 * T.scale)
  const noteSlot = Math.round(80 * T.scale)
  const trailingPad = Math.round(20 * T.scale)
  const staffWidth = clefReserve + clefGap + ksWidth + ksGap + notes.length * noteSlot + trailingPad

  const ksStartX = margin + clefReserve + clefGap + Math.round(T.accidentalKerning * 0.5)
  const bodyStartX = margin + clefReserve + clefGap + ksWidth + ksGap
  const noteX = (i: number) => bodyStartX + (i + 0.5) * noteSlot

  const labelFont = T.size === 'small' ? 12 : T.size === 'hero' ? 15 : 13
  const figureFont = T.size === 'small' ? 12 : T.size === 'hero' ? 16 : 14
  const figureLineH = figureFont * 1.05

  const trebleStaffY = Math.round(40 * T.scale + 12)
  const trebleHeight = 8 * T.step
  const grandGap = Math.round(72 * T.scale)
  const bassStaffY = showRealization ? trebleStaffY + trebleHeight + grandGap : trebleStaffY
  const bassClef: Clef = 'bass'

  const ksPosTreble = isSharp ? TREBLE_SHARP_POS : TREBLE_FLAT_POS
  const ksPosBass = isSharp ? BASS_SHARP_POS : BASS_FLAT_POS

  // Determine the lowest extent on the bass staff for figure positioning
  let bassLowestY = bassStaffY + 8 * T.step
  for (const n of notes) {
    const p = parsePitch(n.pitch)
    if (!p) continue
    const pos = staffPosition(p, bassClef)
    const noteBottom = bassStaffY + pos * T.step + T.noteheadHalfHeight
    if (noteBottom > bassLowestY) bassLowestY = noteBottom
  }

  const figuresY = bassLowestY + Math.round(14 * T.scale)
  const maxFigCount = Math.max(0, ...notes.map(n => n.figures?.length ?? 0))
  const figuresBlockH = maxFigCount * figureLineH

  const numeralsY = showRomanNumerals
    ? (showRealization ? trebleStaffY - Math.round(14 * T.scale) : figuresY + figuresBlockH + Math.round(20 * T.scale))
    : 0

  const totalH = (showRomanNumerals && !showRealization
      ? numeralsY + labelFont + Math.round(20 * T.scale)
      : Math.max(figuresY + figuresBlockH + Math.round(20 * T.scale),
                 (showRomanNumerals ? labelFont : 0)))
  const totalH2 = showRomanNumerals && showRealization
    ? totalH
    : Math.max(totalH, figuresY + figuresBlockH + Math.round(20 * T.scale))

  const totalW = margin + staffWidth + margin

  const handleNoteClick = (i: number) => {
    const n = notes[i]
    if (n.realization && n.realization.length > 0) {
      void playChord([n.pitch, ...n.realization], '2n')
    } else {
      void play(n.pitch, '2n')
    }
  }

  const handlePlaySequence = async () => {
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i]
      if (n.realization && n.realization.length > 0) {
        void playChord([n.pitch, ...n.realization], '4n')
      } else {
        void play(n.pitch, '4n')
      }
      if (i < notes.length - 1) {
        await new Promise(r => setTimeout(r, 700))
      }
    }
  }

  // Effective height: max of all element bottoms
  const effectiveTopForRomans = showRomanNumerals && showRealization
    ? trebleStaffY - Math.round(20 * T.scale + labelFont)
    : 0
  const yOffset = effectiveTopForRomans < 0 ? -effectiveTopForRomans : 0
  void yOffset

  const finalH = Math.max(
    totalH2,
    bassStaffY + 8 * T.step + Math.round(60 * T.scale),
  ) + (showRomanNumerals && !showRealization ? labelFont + 24 : 0)

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${finalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Figured bass example'}
      >
        {/* Grand-staff brace if showRealization */}
        {showRealization && (
          <>
            <line
              x1={margin}
              y1={trebleStaffY}
              x2={margin}
              y2={bassStaffY + 8 * T.step}
              stroke={T.ink}
              strokeWidth={T.graceLineStroke}
            />
            <text
              x={margin - 8}
              y={bassStaffY + 8 * T.step}
              fontSize={(bassStaffY + 8 * T.step) - trebleStaffY}
              fontFamily={T.fontMusic}
              fill={T.ink}
              textAnchor="middle"
              dominantBaseline="auto"
            >
              {T.braceGlyph}
            </text>
          </>
        )}

        {/* Treble staff (only when showing realization) */}
        {showRealization && (
          <Staff clef="treble" x={margin} y={trebleStaffY} width={staffWidth} T={T} />
        )}
        {/* Bass staff */}
        <Staff clef="bass" x={margin} y={bassStaffY} width={staffWidth} T={T} />

        {/* Key signature glyphs on both staves */}
        {ksCount > 0 && ksOrder.slice(0, ksCount).map((letter, i) => (
          <g key={`ks-${i}`}>
            {showRealization && (
              <text
                x={ksStartX + i * ksSlot}
                y={trebleStaffY + ksPosTreble[letter] * T.step}
                fontSize={T.accidentalFontSize}
                fontFamily={T.fontMusic}
                fill={T.ink}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {isSharp ? T.sharpGlyph : T.flatGlyph}
              </text>
            )}
            <text
              x={ksStartX + i * ksSlot}
              y={bassStaffY + ksPosBass[letter] * T.step}
              fontSize={T.accidentalFontSize}
              fontFamily={T.fontMusic}
              fill={T.ink}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {isSharp ? T.sharpGlyph : T.flatGlyph}
            </text>
          </g>
        ))}

        {/* Bass notes */}
        {notes.map((n, i) => (
          <g
            key={`bass-${i}`}
            onClick={() => handleNoteClick(i)}
            style={{ cursor: 'pointer' }}
            role="button"
          >
            <NoteHead
              pitch={n.pitch}
              staffTop={bassStaffY}
              x={noteX(i)}
              clef="bass"
              T={T}
              duration="whole"
            />
          </g>
        ))}

        {/* Realization chords on treble staff */}
        {showRealization && notes.map((n, i) => {
          if (!n.realization || n.realization.length === 0) return null
          const parsed = n.realization
            .map(p => parsePitch(p))
            .filter((p): p is NonNullable<typeof p> => p !== null)
          const engraved = parsed.length > 0
            ? engraveChord(parsed, 'treble', trebleStaffY, noteX(i), T)
            : null
          if (!engraved) return null
          return (
            <g key={`real-${i}`}>
              {engraved.parsed.map((_p, j) => (
                <NoteHead
                  key={j}
                  pitch={n.realization![j]}
                  staffTop={trebleStaffY}
                  x={engraved.noteXs[j]}
                  clef="treble"
                  T={T}
                  duration="whole"
                />
              ))}
            </g>
          )
        })}

        {/* Figured-bass numbers (vertical stack below each bass note) */}
        {notes.map((n, i) => (
          <g key={`fig-${i}`}>
            {n.figures?.map((fig, fi) => (
              <text
                key={`fig-${i}-${fi}`}
                x={noteX(i)}
                y={figuresY + fi * figureLineH + figureFont / 2}
                fontSize={figureFont}
                fontFamily={T.fontLabel}
                fill={T.ink}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {fig}
              </text>
            ))}
          </g>
        ))}

        {/* Roman numerals (above the figure when showRealization, above the figures when not) */}
        {showRomanNumerals && notes.map((n, i) => {
          if (!n.romanNumeral) return null
          const y = showRealization
            ? trebleStaffY - Math.round(8 * T.scale)
            : figuresY + figuresBlockH + Math.round(20 * T.scale) + labelFont / 2
          return (
            <text
              key={`rn-${i}`}
              x={noteX(i)}
              y={y}
              fontSize={labelFont}
              fontFamily={T.fontLabel}
              fill={T.ink}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {n.romanNumeral}
            </text>
          )
        })}
      </svg>
      {audio && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={handlePlaySequence}
            style={{
              fontFamily: T.fontLabel,
              fontSize: 12,
              color: T.bgPaper,
              background: T.ink,
              border: 'none',
              padding: '6px 14px',
              borderRadius: 4,
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Play sequence
          </button>
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
