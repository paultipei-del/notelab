import React from 'react'
import { Caption } from './primitives/Caption'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

export type EarTrainingFamily = 'pitch' | 'rhythm' | 'harmonic' | 'reproduction' | 'internal'

export interface EarTrainingBranch {
  label: string
  family: EarTrainingFamily
  children: string[]
}

interface EarTrainingMapProps {
  branches?: EarTrainingBranch[]
  caption?: string
  size?: LearnSize
}

interface FamilyTheme {
  fill: string
  border: string
  accent: string
}

const FAMILY_THEME: Record<EarTrainingFamily, FamilyTheme> = {
  pitch:        { fill: '#FAECE7', border: '#D85A30', accent: '#B5402A' },
  rhythm:       { fill: '#FDFAF3', border: '#C7A86A', accent: '#8A6D2C' },
  harmonic:     { fill: '#F5E8D5', border: '#B89657', accent: '#7A5C24' },
  reproduction: { fill: '#FCEEEA', border: '#CC6E48', accent: '#9C3E1A' },
  internal:     { fill: '#F0EDE8', border: '#A39884', accent: '#5F5648' },
}

const DEFAULT_BRANCHES: EarTrainingBranch[] = [
  { label: 'Pitch recognition', family: 'pitch',
    children: ['Single notes in key', 'Intervals', 'Chord qualities', 'Scale identification'] },
  { label: 'Rhythm recognition', family: 'rhythm',
    children: ['Pulse and meter', 'Rhythmic patterns', 'Polyrhythms'] },
  { label: 'Harmonic recognition', family: 'harmonic',
    children: ['Chord progressions', 'Cadences', 'Modulations'] },
  { label: 'Reproduction skills', family: 'reproduction',
    children: ['Sight-singing', 'Melodic dictation', 'Rhythmic dictation'] },
  { label: 'Internal hearing', family: 'internal',
    children: ['Silent reading', 'Mental playback', 'Audiation'] },
]

/**
 * Tree diagram of the main areas of ear training. Pure SVG.
 * Root nodes (families) sit on the left with a coloured left-edge stripe;
 * children extend to the right with thin connector curves.
 */
export function EarTrainingMap({
  branches = DEFAULT_BRANCHES,
  caption,
  size = 'inline',
}: EarTrainingMapProps) {
  const T = tokensFor(size)

  const rootFontSize = Math.round(T.labelFontSize + 3)
  const childFontSize = Math.round(T.labelFontSize + 1)

  const padX = 18
  const padY = 20
  const rootW = Math.round(200 * T.scale + 48)
  const rootH = Math.round(50 * T.scale + 18)
  const childW = Math.round(200 * T.scale + 30)
  const childH = Math.round(32 * T.scale + 14)
  const childGap = Math.round(6 * T.scale + 3)
  const familyGap = Math.round(22 * T.scale + 11)
  const colGap = Math.round(54 * T.scale + 16)
  const stripeW = Math.round(5 * T.scale + 2)

  // Per-family layout: y range from top.
  let cursorY = padY
  const familyLayouts = branches.map(b => {
    const childrenH = b.children.length * childH + (b.children.length - 1) * childGap
    const familyH = Math.max(rootH, childrenH)
    const layout = { branch: b, top: cursorY, height: familyH }
    cursorY += familyH + familyGap
    return layout
  })
  cursorY -= familyGap

  const totalW = padX * 2 + rootW + colGap + childW
  const totalH = padY + cursorY + padY

  const rootX = padX
  const childX = padX + rootW + colGap

  return (
    <figure style={{ margin: '32px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Ear training skill map'}
      >
        <defs>
          <filter id="et-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.2" floodColor="#1A1A18" floodOpacity="0.10" />
          </filter>
        </defs>

        {familyLayouts.map((fl, fi) => {
          const rootY = fl.top + fl.height / 2 - rootH / 2
          const childrenH = fl.branch.children.length * childH + (fl.branch.children.length - 1) * childGap
          const childrenStartY = fl.top + fl.height / 2 - childrenH / 2
          const rootRightX = rootX + rootW
          const rootCenter = { x: rootRightX, y: rootY + rootH / 2 }
          const theme = FAMILY_THEME[fl.branch.family]
          return (
            <g key={`fam-${fi}`}>
              {/* Connector curves: root → each child. */}
              {fl.branch.children.map((_, ci) => {
                const cy = childrenStartY + ci * (childH + childGap) + childH / 2
                return (
                  <path
                    key={`line-${fi}-${ci}`}
                    d={`M ${rootCenter.x} ${rootCenter.y}
                        C ${rootCenter.x + colGap * 0.5} ${rootCenter.y},
                          ${childX - colGap * 0.5} ${cy},
                          ${childX} ${cy}`}
                    fill="none"
                    stroke={theme.border}
                    strokeOpacity={0.55}
                    strokeWidth={1.4}
                  />
                )
              })}

              {/* Root node — coloured stripe + softly-shadowed body. */}
              <g filter="url(#et-soft-shadow)">
                <rect
                  x={rootX} y={rootY}
                  width={rootW} height={rootH}
                  rx={10}
                  fill={theme.fill}
                  stroke={theme.border}
                  strokeWidth={1.4}
                />
              </g>
              <rect
                x={rootX} y={rootY}
                width={stripeW} height={rootH}
                fill={theme.accent}
                rx={2}
              />
              <text
                x={rootX + stripeW + Math.round(14 * T.scale + 6)}
                y={rootY + rootH / 2}
                fontSize={rootFontSize}
                fontFamily={T.fontDisplay}
                fontWeight={500}
                fill={T.ink}
                textAnchor="start"
                dominantBaseline="central"
              >{fl.branch.label}</text>

              {/* Child nodes. */}
              {fl.branch.children.map((c, ci) => {
                const cy = childrenStartY + ci * (childH + childGap)
                return (
                  <g key={`child-${fi}-${ci}`}>
                    <rect
                      x={childX} y={cy}
                      width={childW} height={childH}
                      rx={6}
                      fill="rgba(253,250,245,0.9)"
                      stroke={theme.border}
                      strokeOpacity={0.45}
                      strokeWidth={1}
                    />
                    <text
                      x={childX + childW / 2}
                      y={cy + childH / 2}
                      fontSize={childFontSize}
                      fontFamily={T.fontLabel}
                      fontWeight={400}
                      fill={T.ink}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >{c}</text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
