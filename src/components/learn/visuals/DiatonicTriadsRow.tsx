'use client'

import React from 'react'
import { Staff, NoteHead, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, staffPosition } from '@/lib/learn/visuals/pitch'
import { engraveChord } from '@/lib/learn/visuals/chord-engraving'

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12]
const NATURAL_MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10, 12]

const MAJOR_TRIAD_QUALITIES: Array<'M' | 'm' | 'd' | 'A'> = ['M', 'm', 'm', 'M', 'M', 'm', 'd']
const NATURAL_MINOR_TRIAD_QUALITIES: Array<'M' | 'm' | 'd' | 'A'> = ['m', 'd', 'M', 'm', 'm', 'M', 'M']

const MAJOR_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
const NATURAL_MINOR_NUMERALS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']

interface DiatonicTriadsRowProps {
  /** Tonic pitch. Default 'C4'. */
  tonic?: string
  /** Mode. Default 'major'. */
  mode?: 'major' | 'natural-minor'
  /** Highlight specific scale degrees in coral (1-7). */
  highlightedDegrees?: number[]
  /** Show Roman numerals below each triad. Default true. */
  showRomanNumerals?: boolean
  /** Show pitch names below each triad. Default false. */
  showPitchNames?: boolean
  audio?: boolean
  size?: LearnSize
  caption?: string
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

function midiToPitch(midi: number, preferFlats = false): string {
  const oct = Math.floor(midi / 12) - 1
  const idx = midi % 12
  const name = preferFlats ? FLAT_NAMES[idx] : NAMES[idx]
  return `${name}${oct}`
}

/** Build a triad on the given scale degree (1-indexed). */
function buildTriad(tonicMidi: number, degree: number, intervals: number[]): number[] {
  const i = degree - 1
  return [
    tonicMidi + intervals[i],
    tonicMidi + intervals[(i + 2) % 7] + (i + 2 >= 7 ? 12 : 0),
    tonicMidi + intervals[(i + 4) % 7] + (i + 4 >= 7 ? 12 : 0),
  ]
}

export function DiatonicTriadsRow({
  tonic = 'C4',
  mode = 'major',
  highlightedDegrees,
  showRomanNumerals = true,
  showPitchNames = false,
  audio = true,
  size = 'inline',
  caption,
}: DiatonicTriadsRowProps) {
  const T = tokensFor(size)
  const { playChord } = useSampler()
  // Transient highlight on the last-clicked triad. Auto-clears after a short
  // hold so the visual matches the audible chord.
  const [flashIdx, setFlashIdx] = React.useState<number | null>(null)
  const flashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashTriad = React.useCallback((i: number, holdMs = 700) => {
    setFlashIdx(i)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashIdx(null), holdMs)
  }, [])
  React.useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [])

  const tonicParsed = parsePitch(tonic)
  if (!tonicParsed) return null
  const tonicMidi = tonicParsed.midi

  const intervals = mode === 'major' ? MAJOR_INTERVALS : NATURAL_MINOR_INTERVALS
  const numerals = mode === 'major' ? MAJOR_NUMERALS : NATURAL_MINOR_NUMERALS
  const preferFlats = mode === 'natural-minor' && tonicParsed.letter === 'A'
    ? false
    : (tonic.includes('b') || (mode === 'natural-minor' && !tonic.includes('#')))

  const triads = Array.from({ length: 7 }, (_, i) => {
    const midis = buildTriad(tonicMidi, i + 1, intervals)
    return midis.map(m => midiToPitch(m, preferFlats))
  })

  const highlightSet = new Set(highlightedDegrees ?? [])

  const margin = Math.round(20 * T.scale + 10)
  const clefReserve = T.clefReserve
  const clefGap = Math.round(18 * T.scale)
  const slotW = Math.round(96 * T.scale)
  const trailingPad = Math.round(20 * T.scale)
  const staffWidth = clefReserve + clefGap + 7 * slotW + trailingPad

  const labelFont = T.size === 'small' ? 13 : T.size === 'hero' ? 17 : 15
  const pitchFont = T.size === 'small' ? 11 : T.size === 'hero' ? 13 : 12

  const staffY = Math.round(40 * T.scale + 12)

  // Find lowest extent to position labels
  let lowestY = staffY + 8 * T.step
  triads.forEach(triad => {
    triad.forEach(p => {
      const parsed = parsePitch(p)
      if (!parsed) return
      const pos = staffPosition(parsed, 'treble')
      const noteBottom = staffY + pos * T.step + T.noteheadHalfHeight
      if (noteBottom > lowestY) lowestY = noteBottom
    })
  })

  const numeralY = lowestY + Math.round(20 * T.scale + 6)
  const pitchNamesY = numeralY + (showRomanNumerals ? labelFont + 6 : 0)
  const labelsBottom = pitchNamesY + (showPitchNames ? 3 * (pitchFont + 2) : 0)
  const totalH = labelsBottom + Math.round(18 * T.scale)
  const totalW = margin + staffWidth + margin

  const slotStart = margin + clefReserve + clefGap
  const chordX = (i: number) => slotStart + (i + 0.5) * slotW

  const handlePlayChord = (i: number) => {
    flashTriad(i)
    void playChord(triads[i], '2n')
  }

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', height: 'auto', maxWidth: totalW, margin: '0 auto' }}
        role="img"
        aria-label={caption ?? `Diatonic triads of ${tonic} ${mode}`}
      >
        <Staff clef="treble" x={margin} y={staffY} width={staffWidth} T={T} />

        {triads.map((triad, i) => {
          const parsed = triad
            .map(p => parsePitch(p))
            .filter((p): p is NonNullable<typeof p> => p !== null)
          const engraved = parsed.length > 0
            ? engraveChord(parsed, 'treble', staffY, chordX(i), T)
            : null
          if (!engraved) return null
          const isHl = highlightSet.has(i + 1) || flashIdx === i
          // Invisible hit rect spanning the slot. Notehead glyphs render with
          // pointerEvents="none", so without this the diatonic triads
          // (which mostly have no accidentals) would have no clickable surface.
          const hitTop = Math.min(engraved.topExtent, staffY) - T.step
          const hitBottom = Math.max(engraved.bottomExtent, staffY + 8 * T.step) + T.step
          const hitX = slotStart + i * slotW
          return (
            <g
              key={`triad-${i}`}
              onClick={() => handlePlayChord(i)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`${numerals[i]}: ${triad.join(', ')}`}
            >
              <rect
                x={hitX}
                y={hitTop}
                width={slotW}
                height={hitBottom - hitTop}
                fill="transparent"
                pointerEvents="all"
              />
              {engraved.parsed.map((_p, j) => (
                <NoteHead
                  key={j}
                  pitch={triad[j]}
                  staffTop={staffY}
                  x={engraved.noteXs[j]}
                  clef="treble"
                  T={T}
                  duration="whole"
                  highlight={isHl}
                />
              ))}
            </g>
          )
        })}

        {showRomanNumerals && triads.map((_t, i) => {
          const isHl = highlightSet.has(i + 1) || flashIdx === i
          return (
            <text
              key={`num-${i}`}
              x={chordX(i)}
              y={numeralY + labelFont / 2}
              fontSize={labelFont}
              fontFamily={T.fontLabel}
              fill={isHl ? T.highlightAccent : T.ink}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {numerals[i]}
            </text>
          )
        })}

        {showPitchNames && triads.map((triad, i) => (
          <g key={`names-${i}`}>
            {[...triad].reverse().map((p, j) => {
              const display = p
                .replace(/^([A-G])b(\d)/, '$1♭$2')
                .replace(/^([A-G])#(\d)/, '$1♯$2')
                .replace(/(\d)$/, '')
              return (
                <text
                  key={`pn-${i}-${j}`}
                  x={chordX(i)}
                  y={pitchNamesY + j * (pitchFont + 2) + pitchFont / 2}
                  fontSize={pitchFont}
                  fontFamily={T.fontLabel}
                  fill={T.inkMuted}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {display}
                </text>
              )
            })}
          </g>
        ))}
      </svg>
      {audio && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={async () => {
              for (let i = 0; i < triads.length; i++) {
                flashTriad(i, 600)
                void playChord(triads[i], '4n')
                if (i < triads.length - 1) {
                  await new Promise(r => setTimeout(r, 600))
                }
              }
            }}
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
            Play all
          </button>
        </div>
      )}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
