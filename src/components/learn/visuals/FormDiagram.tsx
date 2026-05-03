'use client'

import React from 'react'
import { Caption } from './primitives'
import { tokensFor, type LearnSize } from '@/lib/learn/visuals/tokens'

export interface FormSection {
  /** Bold display label inside the box (e.g. "A", "Exposition"). */
  label: string
  /** Optional small italic text below the main label inside the box. */
  sublabel?: string
  /** Coral-wash highlight for emphasis (e.g. recurring rondo refrain). */
  highlighted?: boolean
}

export interface FormDiagramRow {
  sections: FormSection[]
  /** Sub-row caption rendered between this row and the next (or before the
   *  figure caption if this is the last row). Small italic text. */
  caption?: string
}

interface FormDiagramProps {
  rows: FormDiagramRow[]
  /** Figure-level caption rendered below the whole diagram. */
  caption?: string
  size?: LearnSize
}

/**
 * Schematic form diagram: rows of equal-width labeled boxes. Used for any
 * sectional layout where the relationship between sections matters more
 * than absolute timing — e.g. ABA, AABA, ABACABA, fugue arc.
 *
 * Each row is its own CSS grid with `grid-template-columns: repeat(N, 1fr)`,
 * so when two rows share the same section count their column boundaries line
 * up vertically. That's the contract: pair a "sections" row with a "key
 * areas" row of the same length and the keys read directly under their
 * sections.
 *
 * The component is silent (no audio).
 */
export function FormDiagram({ rows, caption, size = 'inline' }: FormDiagramProps) {
  const T = tokensFor(size)

  const labelFont = T.size === 'small' ? 16 : T.size === 'hero' ? 22 : 19
  const sublabelFont = T.size === 'small' ? 10 : T.size === 'hero' ? 13 : 12
  const rowCaptionFont = T.size === 'small' ? 11 : T.size === 'hero' ? 14 : 13
  const boxHeight = T.size === 'small' ? 52 : T.size === 'hero' ? 84 : 68

  return (
    <figure
      style={{
        margin: '24px auto',
        width: '100%',
        maxWidth: 720,
      }}
    >
      {rows.map((row, rowIdx) => {
        const n = row.sections.length
        return (
          <React.Fragment key={`row-${rowIdx}`}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${n}, 1fr)`,
                gap: 0,
                marginTop: rowIdx === 0 ? 0 : 8,
              }}
            >
              {row.sections.map((section, i) => {
                const bg = section.highlighted ? '#FAECE7' : '#FDFAF3'
                const borderColor = section.highlighted ? '#D85A30' : '#1A1A18'
                const labelColor = section.highlighted ? '#B5402A' : '#1A1A18'
                return (
                  <div
                    key={`section-${rowIdx}-${i}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: boxHeight,
                      padding: '8px 6px',
                      background: bg,
                      border: `1px solid ${borderColor}`,
                      // Collapse adjacent borders so the row reads as a
                      // continuous strip with shared internal walls.
                      marginLeft: i === 0 ? 0 : -1,
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: T.fontDisplay,
                        fontSize: labelFont,
                        fontWeight: 500,
                        color: labelColor,
                        lineHeight: 1.2,
                      }}
                    >
                      {section.label}
                    </div>
                    {section.sublabel && (
                      <div
                        style={{
                          fontFamily: T.fontLabel,
                          fontSize: sublabelFont,
                          fontStyle: 'italic',
                          color: T.inkMuted,
                          marginTop: 4,
                          lineHeight: 1.3,
                        }}
                      >
                        {section.sublabel}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {row.caption && (
              <div
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: rowCaptionFont,
                  fontStyle: 'italic',
                  color: T.inkSubtle,
                  textAlign: 'center',
                  margin: '6px auto 0',
                  maxWidth: '64ch',
                  lineHeight: 1.5,
                }}
              >
                {row.caption}
              </div>
            )}
          </React.Fragment>
        )
      })}
      {caption && <Caption T={T}>{caption}</Caption>}
    </figure>
  )
}
