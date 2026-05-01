'use client'

import React from 'react'
import { Caption } from './primitives'
import { KeySignatureStaff } from './KeySignatureStaff'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize, type LearnTokens } from '@/lib/learn/visuals/tokens'

/**
 * Render a key-signature label string like "F♯" or "B♭ minor" so the
 * accidental characters render with the same Bravura glyphs used on the
 * staves elsewhere on the page, while the letter portions stay in the
 * text font. Returns SVG-friendly tspan nodes; HTML callers wrap the
 * result in a <text> SVG element. For non-SVG (regular DOM) callers,
 * use `renderMusicLabelHTML` instead.
 */
function renderMusicLabelSvg(label: string, T: LearnTokens, baseFontSize: number): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let textBuffer = ''
  let key = 0
  const flushBuffer = () => {
    if (textBuffer) {
      out.push(<tspan key={key++}>{textBuffer}</tspan>)
      textBuffer = ''
    }
  }
  for (const ch of label) {
    if (ch === '♯' || ch === '♭') {
      flushBuffer()
      out.push(
        <tspan
          key={key++}
          fontFamily={T.fontMusic}
          fontSize={baseFontSize * 1.15}
          dy={baseFontSize * 0.07}
        >
          {ch === '♯' ? T.sharpGlyph : T.flatGlyph}
        </tspan>,
        <tspan key={key++} dy={-baseFontSize * 0.07}>{''}</tspan>
      )
    } else if (ch === '/') {
      flushBuffer()
      // Slash separating enharmonic spellings — not bold and slightly muted
      // so the two key names remain the visual focus. Surrounding spaces
      // come from the source label string, so we render just the slash here.
      out.push(
        <tspan key={key++} fontWeight={400} fill={T.inkSubtle}>
          {'/'}
        </tspan>
      )
    } else {
      textBuffer += ch
    }
  }
  flushBuffer()
  return out
}

function renderMusicLabelHTML(label: string, T: LearnTokens): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let textBuffer = ''
  let key = 0
  for (const ch of label) {
    if (ch === '♯' || ch === '♭') {
      if (textBuffer) {
        out.push(<span key={key++}>{textBuffer}</span>)
        textBuffer = ''
      }
      out.push(
        <span
          key={key++}
          style={{ fontFamily: T.fontMusic, fontSize: '1.15em' }}
        >
          {ch === '♯' ? T.sharpGlyph : T.flatGlyph}
        </span>
      )
    } else {
      textBuffer += ch
    }
  }
  if (textBuffer) out.push(<span key={key++}>{textBuffer}</span>)
  return out
}

interface CirclePosition {
  /** Sector index 0..11. Position 0 is at the top (12 o'clock), increasing clockwise. */
  index: number
  /** Number of accidentals; positive = sharps, negative = flats. */
  accidentals: number
  major: string
  /** Lowercase abbreviated minor (e.g. "a" for A minor). */
  minor: string
  /** Full minor for tooltips/audio. */
  minorFull: string
  /** MIDI tonic for major chord playback. */
  majorMidi: number
  /** MIDI tonic for minor chord playback. */
  minorMidi: number
  /** Optional enharmonic spelling rendered alongside this position
   *  (e.g. G♭ shown next to F♯ at the bottom of the circle). */
  altMajor?: string
  altMinor?: string
  altAccidentals?: number
}

const POSITIONS: CirclePosition[] = [
  { index: 0,  accidentals: 0,  major: 'C',  minor: 'a',  minorFull: 'A minor',  majorMidi: 60, minorMidi: 57 },
  { index: 1,  accidentals: 1,  major: 'G',  minor: 'e',  minorFull: 'E minor',  majorMidi: 67, minorMidi: 64 },
  { index: 2,  accidentals: 2,  major: 'D',  minor: 'b',  minorFull: 'B minor',  majorMidi: 62, minorMidi: 59 },
  { index: 3,  accidentals: 3,  major: 'A',  minor: 'f♯', minorFull: 'F♯ minor', majorMidi: 69, minorMidi: 66 },
  { index: 4,  accidentals: 4,  major: 'E',  minor: 'c♯', minorFull: 'C♯ minor', majorMidi: 64, minorMidi: 61 },
  { index: 5,  accidentals: 5,  major: 'B',  minor: 'g♯', minorFull: 'G♯ minor', majorMidi: 71, minorMidi: 68 },
  { index: 6,  accidentals: 6,  major: 'F♯', minor: 'd♯', minorFull: 'D♯ minor', majorMidi: 66, minorMidi: 63, altMajor: 'G♭', altMinor: 'e♭', altAccidentals: -6 },
  { index: 7,  accidentals: -5, major: 'D♭', minor: 'b♭', minorFull: 'B♭ minor', majorMidi: 61, minorMidi: 58 },
  { index: 8,  accidentals: -4, major: 'A♭', minor: 'f',  minorFull: 'F minor',  majorMidi: 68, minorMidi: 65 },
  { index: 9,  accidentals: -3, major: 'E♭', minor: 'c',  minorFull: 'C minor',  majorMidi: 63, minorMidi: 60 },
  { index: 10, accidentals: -2, major: 'B♭', minor: 'g',  minorFull: 'G minor',  majorMidi: 70, minorMidi: 67 },
  { index: 11, accidentals: -1, major: 'F',  minor: 'd',  minorFull: 'D minor',  majorMidi: 65, minorMidi: 62 },
]

const ENHARMONIC_PAIRS: Array<{
  sharp: { major: string; accidentals: number }
  flat:  { major: string; accidentals: number }
}> = [
  { sharp: { major: 'B major',  accidentals: 5 },  flat: { major: 'C♭ major', accidentals: -7 } },
  { sharp: { major: 'F♯ major', accidentals: 6 },  flat: { major: 'G♭ major', accidentals: -6 } },
  { sharp: { major: 'C♯ major', accidentals: 7 },  flat: { major: 'D♭ major', accidentals: -5 } },
]

function midiToPitch(midi: number): string {
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const oct = Math.floor(midi / 12) - 1
  return `${NAMES[midi % 12]}${oct}`
}

function majorChordMidis(tonic: number): number[] {
  return [tonic, tonic + 4, tonic + 7]
}

function minorChordMidis(tonic: number): number[] {
  return [tonic, tonic + 3, tonic + 7]
}

function accidentalsLabel(n: number): string {
  if (n === 0) return ''
  return `${Math.abs(n)}${n > 0 ? '♯' : '♭'}`
}

interface CircleOfFifthsProps {
  mode?: 'full' | 'majors-only' | 'enharmonic-pairs' | 'directional-table'
  /** Highlight specific keys by major-letter name (e.g., ['G', 'D']). */
  highlightedKeys?: string[]
  size?: LearnSize
  caption?: string
}

const CLOCKWISE_ROWS: Array<{ accidentals: number; major: string; minor: string }> = [
  { accidentals: 0, major: 'C major',  minor: 'A minor' },
  { accidentals: 1, major: 'G major',  minor: 'E minor' },
  { accidentals: 2, major: 'D major',  minor: 'B minor' },
  { accidentals: 3, major: 'A major',  minor: 'F♯ minor' },
  { accidentals: 4, major: 'E major',  minor: 'C♯ minor' },
  { accidentals: 5, major: 'B major',  minor: 'G♯ minor' },
  { accidentals: 6, major: 'F♯ major', minor: 'D♯ minor' },
  { accidentals: 7, major: 'C♯ major', minor: 'A♯ minor' },
]

const COUNTERCLOCKWISE_ROWS: Array<{ accidentals: number; major: string; minor: string }> = [
  { accidentals: 0,  major: 'C major',  minor: 'A minor' },
  { accidentals: -1, major: 'F major',  minor: 'D minor' },
  { accidentals: -2, major: 'B♭ major', minor: 'G minor' },
  { accidentals: -3, major: 'E♭ major', minor: 'C minor' },
  { accidentals: -4, major: 'A♭ major', minor: 'F minor' },
  { accidentals: -5, major: 'D♭ major', minor: 'B♭ minor' },
  { accidentals: -6, major: 'G♭ major', minor: 'E♭ minor' },
  { accidentals: -7, major: 'C♭ major', minor: 'A♭ minor' },
]

export function CircleOfFifths({
  mode = 'full',
  highlightedKeys,
  size = 'inline',
  caption,
}: CircleOfFifthsProps) {
  const T = tokensFor(size)
  const { playChord } = useSampler()

  if (mode === 'directional-table') {
    const cellPad = '8px 12px'
    const headerStyle: React.CSSProperties = {
      padding: cellPad,
      fontFamily: T.fontLabel,
      fontSize: 12,
      color: T.inkSubtle,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      borderBottom: `1px solid ${T.border}`,
      textAlign: 'left',
    }
    const cellStyle: React.CSSProperties = {
      padding: cellPad,
      fontFamily: T.fontLabel,
      fontSize: 14,
      color: T.ink,
    }
    const accidentalCellStyle: React.CSSProperties = {
      ...cellStyle,
      color: T.inkMuted,
      width: 64,
    }
    const directionStyle: React.CSSProperties = {
      fontFamily: T.fontLabel,
      fontSize: 13,
      color: T.inkMuted,
      fontStyle: 'italic',
      textAlign: 'center',
      padding: '4px 0 8px',
    }
    const wrapperStyle: React.CSSProperties = {
      flex: '1 1 0',
      minWidth: 280,
      background: 'rgba(255, 255, 255, 0.25)',
      border: `1px solid ${T.border}`,
      borderRadius: 4,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      overflow: 'hidden',
    }

    return (
      <figure style={{ margin: '24px auto', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <div style={wrapperStyle}>
            <div style={directionStyle}>↻ clockwise (add sharps)</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr 1fr',
                alignItems: 'stretch',
              }}
            >
              <div style={headerStyle}>Acc.</div>
              <div style={headerStyle}>Major</div>
              <div style={headerStyle}>Minor</div>
              {CLOCKWISE_ROWS.map((row, i) => {
                const isLast = i === CLOCKWISE_ROWS.length - 1
                const border = isLast ? 'none' : `1px solid ${T.border}`
                return (
                  <React.Fragment key={`cw-${i}`}>
                    <div style={{ ...accidentalCellStyle, borderBottom: border }}>
                      {renderMusicLabelHTML(row.accidentals === 0 ? '0' : `${Math.abs(row.accidentals)}♯`, T)}
                    </div>
                    <div style={{ ...cellStyle, borderBottom: border }}>
                      {renderMusicLabelHTML(row.major, T)}
                    </div>
                    <div style={{ ...cellStyle, borderBottom: border, color: T.inkMuted }}>
                      {renderMusicLabelHTML(row.minor, T)}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
          <div style={wrapperStyle}>
            <div style={directionStyle}>↺ counter-clockwise (add flats)</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr 1fr',
                alignItems: 'stretch',
              }}
            >
              <div style={headerStyle}>Acc.</div>
              <div style={headerStyle}>Major</div>
              <div style={headerStyle}>Minor</div>
              {COUNTERCLOCKWISE_ROWS.map((row, i) => {
                const isLast = i === COUNTERCLOCKWISE_ROWS.length - 1
                const border = isLast ? 'none' : `1px solid ${T.border}`
                return (
                  <React.Fragment key={`ccw-${i}`}>
                    <div style={{ ...accidentalCellStyle, borderBottom: border }}>
                      {renderMusicLabelHTML(row.accidentals === 0 ? '0' : `${Math.abs(row.accidentals)}♭`, T)}
                    </div>
                    <div style={{ ...cellStyle, borderBottom: border }}>
                      {renderMusicLabelHTML(row.major, T)}
                    </div>
                    <div style={{ ...cellStyle, borderBottom: border, color: T.inkMuted }}>
                      {renderMusicLabelHTML(row.minor, T)}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>
        {caption && <Caption T={T}>{caption}</Caption>}
      </figure>
    )
  }

  if (mode === 'enharmonic-pairs') {
    return (
      <figure style={{ margin: '24px auto', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            alignItems: 'center',
          }}
        >
          {ENHARMONIC_PAIRS.map((pair, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 24,
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: T.fontLabel, fontSize: 14, color: T.ink }}>
                  {renderMusicLabelHTML(pair.sharp.major, T)} ({renderMusicLabelHTML(accidentalsLabel(pair.sharp.accidentals), T)})
                </div>
                <KeySignatureStaff accidentals={pair.sharp.accidentals} size="small" />
              </div>
              <div
                style={{
                  fontFamily: T.fontMusic,
                  fontSize: 28,
                  color: T.highlightAccent,
                  margin: '0 4px',
                }}
                aria-label="enharmonic equivalent"
              >
                ↔
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: T.fontLabel, fontSize: 14, color: T.ink }}>
                  {renderMusicLabelHTML(pair.flat.major, T)} ({renderMusicLabelHTML(accidentalsLabel(pair.flat.accidentals), T)})
                </div>
                <KeySignatureStaff accidentals={pair.flat.accidentals} size="small" />
              </div>
            </div>
          ))}
        </div>
        {caption && <Caption T={T}>{caption}</Caption>}
      </figure>
    )
  }

  // Geometry for the circle
  const showInner = mode === 'full'
  const baseRadius = T.size === 'hero' ? 200 : T.size === 'jumbo' ? 240 : 170
  const outerR = baseRadius
  const middleR = baseRadius - 50
  const innerR = showInner ? baseRadius - 100 : 0
  const padding = 50
  const cx = outerR + padding
  const cy = outerR + padding
  const totalW = (outerR + padding) * 2
  const totalH = (outerR + padding) * 2

  const sectorCount = 12
  const sectorAngle = (2 * Math.PI) / sectorCount

  /** Compute angle for sector index. Index 0 at top (12 o'clock), increasing clockwise. */
  const angleAt = (index: number, offset: number = 0): number => {
    return -Math.PI / 2 + (index + offset) * sectorAngle
  }

  /** Annular wedge path for sector index. */
  const sectorPath = (index: number, rOuter: number, rInner: number): string => {
    const a1 = angleAt(index, -0.5)
    const a2 = angleAt(index, 0.5)
    const x1o = cx + rOuter * Math.cos(a1)
    const y1o = cy + rOuter * Math.sin(a1)
    const x2o = cx + rOuter * Math.cos(a2)
    const y2o = cy + rOuter * Math.sin(a2)
    const x1i = cx + rInner * Math.cos(a1)
    const y1i = cy + rInner * Math.sin(a1)
    const x2i = cx + rInner * Math.cos(a2)
    const y2i = cy + rInner * Math.sin(a2)
    return [
      `M ${x1o} ${y1o}`,
      `A ${rOuter} ${rOuter} 0 0 1 ${x2o} ${y2o}`,
      `L ${x2i} ${y2i}`,
      rInner > 0 ? `A ${rInner} ${rInner} 0 0 0 ${x1i} ${y1i}` : `L ${x1i} ${y1i}`,
      'Z',
    ].join(' ')
  }

  const [hoveredIdx, setHoveredIdx] = React.useState<{ index: number; ring: 'outer' | 'inner' } | null>(null)

  const handleMajorClick = (pos: CirclePosition) => {
    const midis = majorChordMidis(pos.majorMidi)
    playChord(midis.map(midiToPitch), '2n')
  }

  const handleMinorClick = (pos: CirclePosition) => {
    const midis = minorChordMidis(pos.minorMidi)
    playChord(midis.map(midiToPitch), '2n')
  }

  const isHighlighted = (major: string) => highlightedKeys?.includes(major) ?? false

  // Label radii
  const outerLabelR = (outerR + middleR) / 2
  const innerLabelR = (middleR + innerR) / 2
  const accidentalLabelR = outerR + 22

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Circle of fifths showing all twelve major keys and their relative minors.'}
      >
        {/* Outer ring (majors) sectors */}
        {POSITIONS.map(pos => {
          const hovered = hoveredIdx?.index === pos.index && hoveredIdx?.ring === 'outer'
          const highlighted = isHighlighted(pos.major)
          const fill = hovered
            ? T.highlightAccentSoft
            : highlighted
              ? T.highlightFill
              : T.bgPaper
          return (
            <path
              key={`outer-${pos.index}`}
              d={sectorPath(pos.index, outerR, middleR)}
              fill={fill}
              stroke={T.ink}
              strokeWidth={1.2}
              onMouseEnter={() => setHoveredIdx({ index: pos.index, ring: 'outer' })}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => handleMajorClick(pos)}
              style={{ cursor: 'pointer', transition: T.hoverTransition }}
            />
          )
        })}

        {/* Inner ring (minors) sectors */}
        {showInner && POSITIONS.map(pos => {
          const hovered = hoveredIdx?.index === pos.index && hoveredIdx?.ring === 'inner'
          const highlighted = isHighlighted(pos.minorFull)
          const fill = hovered
            ? T.highlightAccentSoft
            : highlighted
              ? T.highlightFill
              : T.bgCream
          return (
            <path
              key={`inner-${pos.index}`}
              d={sectorPath(pos.index, middleR, innerR)}
              fill={fill}
              stroke={T.ink}
              strokeWidth={1.0}
              onMouseEnter={() => setHoveredIdx({ index: pos.index, ring: 'inner' })}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => handleMinorClick(pos)}
              style={{ cursor: 'pointer', transition: T.hoverTransition }}
            />
          )
        })}

        {/* Major labels (outer ring) — when an enharmonic alt exists,
            both spellings render side-by-side with the flat spelling on
            the left and the sharp spelling on the right (e.g. "G♭ / F♯"). */}
        {POSITIONS.map(pos => {
          const a = angleAt(pos.index)
          const x = cx + outerLabelR * Math.cos(a)
          const y = cy + outerLabelR * Math.sin(a)
          const labelText = pos.altMajor ? `${pos.altMajor} / ${pos.major}` : pos.major
          return (
            <text
              key={`maj-label-${pos.index}`}
              x={x}
              y={y}
              fontSize={20}
              fontFamily={T.fontDisplay}
              fill={T.ink}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ pointerEvents: 'none' }}
            >
              {renderMusicLabelSvg(labelText, T, 20)}
            </text>
          )
        })}

        {/* Minor labels (inner ring) */}
        {showInner && POSITIONS.map(pos => {
          const a = angleAt(pos.index)
          const x = cx + innerLabelR * Math.cos(a)
          const y = cy + innerLabelR * Math.sin(a)
          const labelText = pos.altMinor ? `${pos.altMinor} / ${pos.minor}` : pos.minor
          return (
            <text
              key={`min-label-${pos.index}`}
              x={x}
              y={y}
              fontSize={17}
              fontFamily={T.fontDisplay}
              fill={T.ink}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ pointerEvents: 'none' }}
            >
              {renderMusicLabelSvg(labelText, T, 17)}
            </text>
          )
        })}

        {/* Accidentals labels outside the outer ring */}
        {POSITIONS.map(pos => {
          const a = angleAt(pos.index)
          const x = cx + accidentalLabelR * Math.cos(a)
          const y = cy + accidentalLabelR * Math.sin(a)
          const label = accidentalsLabel(pos.accidentals)
          if (!label) return null
          const altLabel = pos.altAccidentals !== undefined
            ? accidentalsLabel(pos.altAccidentals)
            : null
          const finalLabel = altLabel ? `${altLabel} / ${label}` : label
          return (
            <text
              key={`acc-label-${pos.index}`}
              x={x}
              y={y}
              fontSize={13}
              fontFamily={T.fontLabel}
              fill={T.inkSubtle}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ pointerEvents: 'none' }}
            >
              {renderMusicLabelSvg(finalLabel, T, 13)}
            </text>
          )
        })}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
