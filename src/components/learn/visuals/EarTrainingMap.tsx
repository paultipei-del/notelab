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

const FAMILY_FILL: Record<EarTrainingFamily, string> = {
  pitch:        '#FAECE7',
  rhythm:       '#FDFAF3',
  harmonic:     '#F5E8D5',
  reproduction: '#FCEEEA',
  internal:     '#F0EDE8',
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
 * Tree diagram of the main areas of ear training. Pure SVG, silent.
 * Root nodes (families) sit on the left; child skills extend right
 * with thin connector lines.
 */
export function EarTrainingMap({
  branches = DEFAULT_BRANCHES,
  caption,
  size = 'inline',
}: EarTrainingMapProps) {
  const T = tokensFor(size)

  const padX = 16
  const padY = 18
  const rootW = Math.round(180 * T.scale + 32)
  const rootH = Math.round(46 * T.scale + 14)
  const childW = Math.round(180 * T.scale + 32)
  const childH = Math.round(28 * T.scale + 8)
  const childGap = 6
  const familyGap = Math.round(20 * T.scale + 8)
  const colGap = Math.round(48 * T.scale + 12)

  // Per-family layout: y range from top.
  let cursorY = padY
  const familyLayouts = branches.map(b => {
    const childrenH = b.children.length * childH + (b.children.length - 1) * childGap
    const familyH = Math.max(rootH, childrenH)
    const layout = { branch: b, top: cursorY, height: familyH }
    cursorY += familyH + familyGap
    return layout
  })
  cursorY -= familyGap // remove trailing gap

  const totalW = padX * 2 + rootW + colGap + childW
  const totalH = padY + cursorY + padY

  const rootX = padX
  const childX = padX + rootW + colGap

  return (
    <figure style={{ margin: '24px auto', width: '100%' }}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        style={{ display: 'block', maxWidth: totalW, height: 'auto', margin: '0 auto' }}
        role="img"
        aria-label={caption ?? 'Ear training skill map'}
      >
        {familyLayouts.map((fl, fi) => {
          const rootY = fl.top + fl.height / 2 - rootH / 2
          const childrenH = fl.branch.children.length * childH + (fl.branch.children.length - 1) * childGap
          const childrenStartY = fl.top + fl.height / 2 - childrenH / 2
          const rootCenter = { x: rootX + rootW, y: rootY + rootH / 2 }
          const fill = FAMILY_FILL[fl.branch.family]
          return (
            <g key={`fam-${fi}`}>
              {/* Connector lines from root to each child. */}
              {fl.branch.children.map((_, ci) => {
                const cy = childrenStartY + ci * (childH + childGap) + childH / 2
                return (
                  <path
                    key={`line-${fi}-${ci}`}
                    d={`M ${rootCenter.x} ${rootCenter.y}
                        C ${rootCenter.x + colGap * 0.4} ${rootCenter.y},
                          ${childX - colGap * 0.4} ${cy},
                          ${childX} ${cy}`}
                    fill="none"
                    stroke={T.inkSubtle}
                    strokeWidth={0.9}
                  />
                )
              })}

              {/* Root node. */}
              <rect
                x={rootX} y={rootY}
                width={rootW} height={rootH}
                rx={6}
                fill={fill}
                stroke={T.ink}
                strokeWidth={1.2}
              />
              <text
                x={rootX + rootW / 2}
                y={rootY + rootH / 2}
                fontSize={Math.round(T.labelFontSize + 2)}
                fontFamily={T.fontDisplay}
                fontWeight={600}
                fill={T.ink}
                textAnchor="middle"
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
                      rx={4}
                      fill="rgba(253,250,245,0.9)"
                      stroke={T.border}
                      strokeWidth={1}
                    />
                    <text
                      x={childX + childW / 2}
                      y={cy + childH / 2}
                      fontSize={T.labelFontSize}
                      fontFamily={T.fontLabel}
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
