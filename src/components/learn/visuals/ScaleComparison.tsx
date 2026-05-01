'use client'

import React from 'react'
import { Staff, NoteHead, Caption } from './primitives'
import { useSampler } from '@/lib/learn/audio/useSampler'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'
import { parsePitch, aggregateBounds, type Clef } from '@/lib/learn/visuals/pitch'

export interface ScaleComparisonRow {
  /** Display name for this scale, shown at the left of the row. */
  name: string
  /** Explicit pitch sequence (ASCII), e.g. ['C4','D4','Eb4',...]. */
  pitches: string[]
  /** Pitches highlighted in coral — the characteristic notes. */
  highlightedPitches?: string[]
}

interface ScaleComparisonProps {
  rows: ScaleComparisonRow[]
  /**
   * 'staves' — each scale gets its own short staff. Best for ≤3 rows.
   * 'degree-rows' — table of pitch-name cells, no staff. Best for 4+ rows.
   * Defaults to 'staves' when rows.length ≤ 3, else 'degree-rows'.
   */
  mode?: 'staves' | 'degree-rows'
  /** Show degree numbers across the top. Default true. */
  showDegreeNumbers?: boolean
  /** Audio. Default true. */
  audio?: boolean
  size?: LearnSize
  caption?: string
}

/**
 * Stacked comparison of N scales, aligned so the same x-coordinate
 * represents the same scale degree across rows. Two layout modes
 * (staves / degree-rows). Click any pitch (notehead or cell) to play
 * it. Per-row Play button arpeggiates that scale.
 */
export function ScaleComparison({
  rows,
  mode,
  showDegreeNumbers = true,
  audio = true,
  size = 'inline',
  caption,
}: ScaleComparisonProps) {
  const T = tokensFor(size)
  const resolvedMode: 'staves' | 'degree-rows' = mode ?? (rows.length <= 3 ? 'staves' : 'degree-rows')
  const { ready, play, playSequence } = useSampler()
  const [interacted, setInteracted] = React.useState(false)

  // Position-based highlight (row index + note index) so hover/flash on
  // one row never bleeds into another row that happens to share the
  // same MIDI pitch (e.g. C major and A minor sharing C5/B4/A4).
  const [hoveredKey, setHoveredKey] = React.useState<string | null>(null)
  const [flashedKeys, setFlashedKeys] = React.useState<Set<string>>(new Set())
  const flashKey = React.useCallback((key: string, durationMs: number = 600) => {
    setFlashedKeys(prev => new Set(prev).add(key))
    setTimeout(() => {
      setFlashedKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }, durationMs)
  }, [])

  // Parse all rows
  const parsedRows = rows.map(r => ({
    ...r,
    parsed: r.pitches.map(p => parsePitch(p)),
    highlightedSet: new Set(r.highlightedPitches ?? []),
  }))
  const validRows = parsedRows.filter(r => r.parsed.every(p => p !== null))
  if (validRows.length === 0) return null

  const maxLen = Math.max(...validRows.map(r => r.pitches.length))
  const noteKey = (rowIdx: number, noteIdx: number) => `${rowIdx}-${noteIdx}`
  const isHot = (rowIdx: number, noteIdx: number) => {
    const k = noteKey(rowIdx, noteIdx)
    return hoveredKey === k || flashedKeys.has(k)
  }

  const handlePitchClick = async (rowIdx: number, noteIdx: number, pitch: string) => {
    setInteracted(true)
    flashKey(noteKey(rowIdx, noteIdx), 700)
    await play(pitch)
  }
  const handleRowPlay = async (rowIdx: number) => {
    setInteracted(true)
    const r = validRows[rowIdx]
    r.parsed.forEach((_p, i) => {
      setTimeout(() => flashKey(noteKey(rowIdx, i), 500), i * 280)
    })
    await playSequence(r.pitches, 280, '4n')
  }

  if (resolvedMode === 'staves') {
    return renderStaves()
  }
  return renderDegreeRows()

  function renderStaves(): React.ReactElement {
    const margin = Math.round(20 * T.scale + 8)
    // Row-name font is tied to the staff size so it reads at a
    // comparable visual weight to the noteheads next to it.
    const rowNameFont = T.size === 'small' ? 14 : T.size === 'hero' ? 22 : T.size === 'jumbo' ? 28 : 17
    // Trimmer side gutter so more of the SVG width goes to the staff itself.
    const nameColumnWidth = Math.round(130 * T.scale)
    const playColumnWidth = audio ? Math.round(60 * T.scale) : 0
    // Horizontal slot per scale degree — bumped further so noteheads
    // sit prominently apart and the whole staff reads larger.
    const slotWidth = Math.round(112 * T.scale)
    // Reserve extra horizontal padding after the clef so the first
    // notehead doesn't crash into the clef's curl.
    const clefPad = Math.round(20 * T.scale)
    const noteAreaWidth = slotWidth * maxLen
    const staffWidth = T.clefReserve + clefPad + noteAreaWidth + Math.round(16 * T.scale)
    const noteAreaX = T.clefReserve + clefPad

    // Per-row staff height. Top headroom needs to fit highest note across all rows.
    const allPitches = validRows.flatMap(r => r.pitches)
    const provisional = aggregateBounds(allPitches, 0, 'treble', T)
    const headroom = Math.max(0, -provisional.top)
    const staffHeightPerRow = 8 * T.step
    const degreeNumberH = showDegreeNumbers ? T.labelFontSize + 8 : 0

    // Row height = headroom (for high notes hanging above the staff) +
    // 8 step lines + extra inter-row breathing room so noteheads of the
    // row below never crash into the staff lines above.
    const rowHeight = headroom + staffHeightPerRow + Math.round(64 * T.scale)
    const totalH = margin + degreeNumberH + rowHeight * validRows.length + margin
    const totalW = margin + nameColumnWidth + staffWidth + playColumnWidth + margin

    const slotX = (i: number) => margin + nameColumnWidth + noteAreaX + (i + 0.5) * slotWidth
    const rowStaffY = (rowIdx: number) =>
      margin + degreeNumberH + headroom + rowHeight * rowIdx
    const rowStaffX = margin + nameColumnWidth

    return (
      <figure style={{ margin: '24px auto', width: 'fit-content', maxWidth: '100%' }}>
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          width="100%"
          style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
          role="img"
          aria-label={caption ?? `Comparison: ${rows.map(r => r.name).join(', ')}`}
        >
          {/* Degree numbers row at the top */}
          {showDegreeNumbers && Array.from({ length: maxLen }, (_, i) => (
            <text
              key={`deg-${i}`}
              x={slotX(i)}
              y={margin + T.labelFontSize}
              fontSize={T.labelFontSize}
              fontFamily={T.fontLabel}
              fill={T.inkSubtle}
              fontWeight={600}
              textAnchor="middle"
            >
              {i + 1}
            </text>
          ))}

          {validRows.map((row, rowIdx) => {
            const sy = rowStaffY(rowIdx)
            return (
              <g key={`row-${rowIdx}`}>
                {/* Name label, left */}
                <text
                  x={margin + nameColumnWidth - Math.round(14 * T.scale)}
                  y={sy + 4 * T.step + 4}
                  fontSize={rowNameFont}
                  fontFamily={T.fontDisplay}
                  fontStyle="italic"
                  fill={T.ink}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {row.name}
                </text>

                {/* Staff */}
                <Staff clef="treble" x={rowStaffX} y={sy} width={staffWidth} T={T} />

                {/* Noteheads */}
                {row.parsed.map((p, i) => {
                  if (!p) return null
                  const isHl = row.highlightedSet.has(row.pitches[i])
                  const k = noteKey(rowIdx, i)
                  const showHot = isHot(rowIdx, i)
                  return (
                    <NoteHead
                      key={`n-${rowIdx}-${i}-${p.midi}`}
                      pitch={row.pitches[i]}
                      staffTop={sy}
                      x={slotX(i)}
                      clef={'treble' as Clef}
                      T={T}
                      duration="whole"
                      highlight={isHl || showHot}
                      highlightColor={showHot ? T.highlightAccent : T.highlightAccentSoft}
                      onMouseEnter={() => setHoveredKey(k)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={() => handlePitchClick(rowIdx, i, row.pitches[i])}
                      ariaLabel={`${row.name} degree ${i + 1}, ${row.pitches[i]}`}
                    />
                  )
                })}
              </g>
            )
          })}
        </svg>

        {audio && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
            marginTop: 14,
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {validRows.map((r, i) => (
                <button
                  key={`play-${i}`}
                  onClick={() => handleRowPlay(i)}
                  disabled={interacted && !ready}
                  style={btnStyle(T, interacted && !ready)}
                >
                  Play {r.name}
                </button>
              ))}
            </div>
            {interacted && !ready && (
              <span style={{
                fontFamily: T.fontLabel, fontSize: T.smallLabelFontSize,
                color: T.inkSubtle, fontStyle: 'italic',
              }}>
                Loading piano samples…
              </span>
            )}
          </div>
        )}

        {caption && <Caption T={T}>{caption}</Caption>}
      </figure>
    )
  }

  function renderDegreeRows(): React.ReactElement {
    // Table-style layout. No staff. Each row: name + N pitch cells.
    const margin = Math.round(20 * T.scale + 8)
    const nameColumnWidth = Math.round(190 * T.scale)
    const cellWidth = Math.round(58 * T.scale)
    const cellHeight = Math.round(28 * T.scale)
    const rowGap = Math.round(6 * T.scale)
    const degreeHeaderH = showDegreeNumbers ? T.labelFontSize + 12 : 0

    const totalW = margin + nameColumnWidth + cellWidth * maxLen + margin
    const totalH = margin + degreeHeaderH + (cellHeight + rowGap) * validRows.length + margin

    const cellX = (i: number) => margin + nameColumnWidth + (i + 0.5) * cellWidth
    const rowY = (rowIdx: number) => margin + degreeHeaderH + (cellHeight + rowGap) * rowIdx + cellHeight / 2

    return (
      <figure style={{ margin: '24px auto', width: 'fit-content', maxWidth: '100%' }}>
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          width="100%"
          style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
          role="img"
          aria-label={caption ?? `Comparison: ${rows.map(r => r.name).join(', ')}`}
        >
          {showDegreeNumbers && Array.from({ length: maxLen }, (_, i) => (
            <text
              key={`deg-${i}`}
              x={cellX(i)}
              y={margin + T.labelFontSize}
              fontSize={T.labelFontSize}
              fontFamily={T.fontLabel}
              fill={T.inkSubtle}
              fontWeight={600}
              textAnchor="middle"
            >
              {i + 1}
            </text>
          ))}

          {validRows.map((row, rowIdx) => {
            const ry = rowY(rowIdx)
            return (
              <g key={`row-${rowIdx}`}>
                <text
                  x={margin + nameColumnWidth - Math.round(14 * T.scale)}
                  y={ry}
                  fontSize={T.labelFontSize + 1}
                  fontFamily={T.fontDisplay}
                  fontStyle="italic"
                  fill={T.ink}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {row.name}
                </text>

                {row.parsed.map((p, i) => {
                  if (!p) return null
                  const isHl = row.highlightedSet.has(row.pitches[i])
                  const k = noteKey(rowIdx, i)
                  const isHotCell = isHl || isHot(rowIdx, i)
                  // Pretty pitch with unicode accidentals
                  const display = row.pitches[i]
                    .replace(/^([A-G])b(\d)/, '$1♭$2')
                    .replace(/^([A-G])#(\d)/, '$1♯$2')
                    .replace(/^([A-G])bb(\d)/, '$1♭♭$2')
                    .replace(/^([A-G])##(\d)/, '$1𝄪$2')
                    .replace(/(\d)$/, '')
                  return (
                    <g
                      key={`cell-${rowIdx}-${i}-${p.midi}`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredKey(k)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={() => handlePitchClick(rowIdx, i, row.pitches[i])}
                    >
                      <rect
                        x={cellX(i) - cellWidth / 2 + 2}
                        y={ry - cellHeight / 2 + 2}
                        width={cellWidth - 4}
                        height={cellHeight - 4}
                        fill="transparent"
                        pointerEvents="all"
                      />
                      <text
                        x={cellX(i)}
                        y={ry}
                        fontSize={T.labelFontSize + 2}
                        fontFamily={T.fontLabel}
                        fill={isHotCell ? T.highlightAccent : T.ink}
                        fontWeight={isHl ? 600 : 500}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ pointerEvents: 'none' }}
                      >
                        {display}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>

        {audio && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center',
            marginTop: 14,
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {validRows.map((r, i) => (
                <button
                  key={`play-${i}`}
                  onClick={() => handleRowPlay(i)}
                  disabled={interacted && !ready}
                  style={btnStyle(T, interacted && !ready)}
                >
                  Play {r.name}
                </button>
              ))}
            </div>
            {interacted && !ready && (
              <span style={{
                fontFamily: T.fontLabel, fontSize: T.smallLabelFontSize,
                color: T.inkSubtle, fontStyle: 'italic',
              }}>
                Loading piano samples…
              </span>
            )}
          </div>
        )}

        {caption && <Caption T={T}>{caption}</Caption>}
      </figure>
    )
  }
}

const btnStyle = (
  T: ReturnType<typeof tokensFor>,
  loading: boolean = false,
): React.CSSProperties => ({
  fontFamily: T.fontLabel,
  fontSize: 12,
  padding: '6px 14px',
  background: 'transparent',
  border: `0.5px solid ${T.ink}`,
  borderRadius: 7,
  cursor: loading ? 'wait' : 'pointer',
  color: T.ink,
  opacity: loading ? 0.5 : 1,
})
