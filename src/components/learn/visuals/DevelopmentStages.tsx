'use client'

import React from 'react'

export interface DevelopmentStage {
  /** Stage label, e.g. "Year 1", "Months 1-6". */
  period: string
  /** One-line headline summarizing this stage. */
  headline: string
  /** Bulleted skills/topics covered in this stage. */
  skills: string[]
  /** Optional visual variant. 'tonic' = stable cream; 'unstable' = warmer cream;
   *  'expert' = coral-tinted to mark advanced territory. */
  variant?: 'tonic' | 'unstable' | 'expert'
}

interface DevelopmentStagesProps {
  stages: DevelopmentStage[]
  caption?: string
}

const VARIANT_BG: Record<NonNullable<DevelopmentStage['variant']>, string> = {
  tonic:    '#FDFAF3',
  unstable: '#FBF1EC',
  expert:   '#FAECE7',
}

const VARIANT_BORDER: Record<NonNullable<DevelopmentStage['variant']>, string> = {
  tonic:    '#E5DFD0',
  unstable: '#E8D4C4',
  expert:   '#E8C8B5',
}

const VARIANT_ACCENT: Record<NonNullable<DevelopmentStage['variant']>, string> = {
  tonic:    '#7A6650',
  unstable: '#A06C4A',
  expert:   '#B5402A',
}

/**
 * Vertical progression of development stages along a timeline rail.
 * Each stage gets full row width — period label and headline at the top,
 * skills as a 2-column bullet list below. A left-side rail with milestone
 * dots ties the stages together as a single arc. Symmetric: every stage
 * receives equal real estate.
 */
export function DevelopmentStages({ stages, caption }: DevelopmentStagesProps) {
  return (
    <figure
      style={{
        margin: '32px auto',
        width: '100%',
        maxWidth: 820,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Timeline rail — sits behind the dots, runs from first to last stage. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 13,
            top: 18,
            bottom: 18,
            width: 1,
            background: 'linear-gradient(to bottom, #E5DFD0 0%, #E8D4C4 50%, #E8C8B5 100%)',
          }}
        />

        {stages.map((s, i) => {
          const variant = s.variant ?? 'tonic'
          return (
            <div
              key={`stage-${i}`}
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '28px 1fr',
                gap: 18,
                alignItems: 'stretch',
              }}
            >
              {/* Milestone dot. */}
              <div style={{ position: 'relative', minHeight: 28 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: 18,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#FDFAF3',
                    border: `2px solid ${VARIANT_ACCENT[variant]}`,
                  }}
                />
              </div>

              {/* Stage card. */}
              <div
                style={{
                  background: VARIANT_BG[variant],
                  border: `1px solid ${VARIANT_BORDER[variant]}`,
                  borderRadius: 10,
                  padding: '20px 24px 22px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 14,
                    flexWrap: 'wrap',
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-jost), sans-serif',
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: VARIANT_ACCENT[variant],
                    }}
                  >{s.period}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-cormorant), serif',
                      fontStyle: 'italic',
                      fontSize: 18,
                      lineHeight: 1.4,
                      color: '#2A2318',
                    }}
                  >{s.headline}</span>
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    columnGap: 24,
                    rowGap: 6,
                  }}
                >
                  {s.skills.map((sk, j) => (
                    <li
                      key={`sk-${i}-${j}`}
                      style={{
                        fontFamily: 'var(--font-jost), sans-serif',
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: '#3A322A',
                        paddingLeft: 14,
                        position: 'relative',
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '0.6em',
                          width: 6,
                          height: 1,
                          background: VARIANT_ACCENT[variant],
                          opacity: 0.55,
                        }}
                      />{sk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      {caption && (
        <figcaption
          style={{
            fontFamily: 'var(--font-jost), sans-serif',
            fontWeight: 300,
            textAlign: 'center',
            marginTop: 18,
            color: '#5F5E5A',
            fontSize: 15,
            lineHeight: 1.55,
            maxWidth: 720,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >{caption}</figcaption>
      )}
    </figure>
  )
}
