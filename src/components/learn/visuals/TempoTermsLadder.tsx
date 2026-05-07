import React from 'react'
import { Caption } from './primitives/Caption'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

export interface TempoTermEntry {
  /** The Italian term (e.g. 'Allegro'). */
  term: string
  /** Display BPM range, with an en-dash. E.g. '120–168'. */
  bpmRange: string
  /** Used to vertically position the term within the ladder. */
  approximateMidBpm: number
}

interface TempoTermsLadderProps {
  entries?: TempoTermEntry[]
  /** If set, the matching term is rendered in coral and weighted bolder. */
  highlight?: string
  size?: LearnSize
  caption?: string
}

const DEFAULT_ENTRIES: TempoTermEntry[] = [
  { term: 'Grave',        bpmRange: '25–45',  approximateMidBpm: 35 },
  // Largo and Lento occupy nearly the same BPM band in print (Largo
  // 40–60 = "broad / dignified", Lento 45–60 = "slow"). For the visual
  // ladder we place Largo at the lower half of its range and Lento at
  // the upper half so the labels separate cleanly.
  { term: 'Largo',        bpmRange: '40–60',  approximateMidBpm: 45 },
  { term: 'Lento',        bpmRange: '45–60',  approximateMidBpm: 55 },
  { term: 'Adagio',       bpmRange: '66–76',  approximateMidBpm: 71 },
  { term: 'Andante',      bpmRange: '76–108', approximateMidBpm: 92 },
  { term: 'Moderato',     bpmRange: '108–120', approximateMidBpm: 114 },
  { term: 'Allegro',      bpmRange: '120–168', approximateMidBpm: 144 },
  { term: 'Presto',       bpmRange: '168–200', approximateMidBpm: 184 },
  { term: 'Prestissimo',  bpmRange: '200+',    approximateMidBpm: 210 },
]

/**
 * Vertical bar showing common Italian tempo terms ordered slow → fast,
 * with approximate BPM ranges on the right. Pure SVG/CSS, silent.
 *
 * The bar is drawn cool-cream at the bottom (slow) graduating into a
 * warmer coral wash at the top (fast). Each term sits at a y position
 * proportional to its `approximateMidBpm` within the 25–220 range.
 */
export function TempoTermsLadder({
  entries = DEFAULT_ENTRIES,
  highlight,
  size = 'inline',
  caption,
}: TempoTermsLadderProps) {
  const T = tokensFor(size)

  const minBpm = 25
  const maxBpm = 220
  // Tall bar so each tempo band gets its own breathing room — at this
  // height even Largo (45) and Lento (55) sit ~22px apart, well above
  // the labelFontSize+5 minimum.
  const ladderH = Math.round(540 * T.scale + 120)
  const ladderW = Math.round(48 * T.scale + 12)
  const labelGapX = Math.round(18 * T.scale + 8)
  const padTop = 28
  const padBottom = 28
  const totalH = ladderH + padTop + padBottom
  const labelMaxLen = entries.reduce((m, e) => Math.max(m, e.term.length + e.bpmRange.length + 3), 0)
  const totalW = ladderW + labelGapX + Math.round(labelMaxLen * T.labelFontSize * 0.55) + 24

  const yForBpm = (bpm: number): number => {
    const t = (bpm - minBpm) / (maxBpm - minBpm)
    const clamped = Math.max(0, Math.min(1, t))
    // Higher BPM → smaller y (top); lower BPM → larger y (bottom).
    return padTop + ladderH * (1 - clamped)
  }

  // Auto-spread label rows that would otherwise sit too close together
  // (Largo and Lento have nearly identical BPM ranges). Walk slow→fast
  // (high y → low y) and shift each row up if it's within minSpacing of
  // the previous one. The bar's tick line still points to the true bpm,
  // but the label sits at the spread y.
  const minSpacing = T.labelFontSize + 5
  const sortedByBpm = [...entries].sort((a, b) => a.approximateMidBpm - b.approximateMidBpm)
  const labelYByTerm = new Map<string, number>()
  let prevY: number | null = null
  for (const e of sortedByBpm) {
    let y = yForBpm(e.approximateMidBpm)
    if (prevY !== null && prevY - y < minSpacing) {
      y = prevY - minSpacing
    }
    labelYByTerm.set(e.term, y)
    prevY = y
  }

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Italian tempo terms from slowest to fastest'}
      >
        <defs>
          <linearGradient id="tempo-ladder-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#F2EDDF" />
            <stop offset="55%" stopColor="#F5DCC8" />
            <stop offset="100%" stopColor="#EFC0A6" />
          </linearGradient>
        </defs>

        {/* The ladder bar itself. */}
        <rect
          x={0} y={padTop}
          width={ladderW} height={ladderH}
          fill="url(#tempo-ladder-grad)"
          stroke={T.border} strokeWidth={1}
          rx={3}
        />

        {/* Tick marks every 25 bpm on the bar's right edge. */}
        {[50, 75, 100, 125, 150, 175, 200].map(b => (
          <line
            key={`tick-${b}`}
            x1={ladderW - 6} y1={yForBpm(b)}
            x2={ladderW + 2} y2={yForBpm(b)}
            stroke={T.inkSubtle} strokeWidth={0.8}
          />
        ))}

        {/* Per-term label rows. Each row: a short connector line + term + range.
            The connector starts at the bar's true tick y (yForBpm) and bends
            to the spread label y when needed, so visually-spread labels still
            point to the correct BPM band. */}
        {entries.map(e => {
          const tickY = yForBpm(e.approximateMidBpm)
          const y = labelYByTerm.get(e.term) ?? tickY
          const isHighlight = highlight && e.term === highlight
          const fill = isHighlight ? T.highlightAccent : T.ink
          const weight = isHighlight ? 600 : 500
          return (
            <g key={e.term}>
              {/* Connector: starts at the true tick y on the bar; bends
                  diagonally to the (possibly spread) label y. */}
              <line
                x1={ladderW + 2} y1={tickY}
                x2={ladderW + labelGapX - 4} y2={y}
                stroke={isHighlight ? T.highlightAccent : T.inkSubtle}
                strokeWidth={isHighlight ? 1.2 : 0.8}
              />
              <text
                x={ladderW + labelGapX}
                y={y - 1}
                fontSize={T.labelFontSize + 1}
                fontFamily={T.fontDisplay}
                fontStyle="italic"
                fontWeight={weight}
                fill={fill}
                dominantBaseline="central"
              >
                {e.term}
              </text>
              <text
                x={ladderW + labelGapX
                  + Math.round((e.term.length + 1) * (T.labelFontSize + 1) * 0.55)}
                y={y - 1}
                fontSize={T.smallLabelFontSize}
                fontFamily={T.fontLabel}
                fill={isHighlight ? T.highlightAccent : T.inkMuted}
                dominantBaseline="central"
              >
                {e.bpmRange} bpm
              </text>
            </g>
          )
        })}

        {/* Vertical-axis cues: FASTER ↑ at top, ↓ SLOWER at bottom.
            Anchored at start (x = 0) so the letter-spaced text extends
            rightward beyond the narrow bar without clipping the leading F. */}
        <text
          x={0} y={padTop - 8}
          fontSize={T.smallLabelFontSize}
          fontFamily={T.fontLabel}
          fill={T.inkSubtle}
          textAnchor="start"
          letterSpacing="0.16em"
        >FASTER ↑</text>
        <text
          x={0} y={padTop + ladderH + 14}
          fontSize={T.smallLabelFontSize}
          fontFamily={T.fontLabel}
          fill={T.inkSubtle}
          textAnchor="start"
          letterSpacing="0.16em"
        >↓ SLOWER</text>
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
