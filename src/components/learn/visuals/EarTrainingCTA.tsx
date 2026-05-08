'use client'

import React from 'react'
import Link from 'next/link'

export interface EarTrainingDeckLink {
  name: string
  /** URL slug (resolves to /study/{slug}). */
  slug: string
  cards?: string
  description?: string
}

interface EarTrainingCTAProps {
  decks: EarTrainingDeckLink[]
  intro?: string
}

/**
 * Cross-link card from a /learn lesson to the Ear Training feature.
 * Emphasis: "important next step" — bordered in coral, eye-catching but
 * not loud. Renders gracefully when `decks` is empty (Coming Soon).
 */
export function EarTrainingCTA({
  decks,
  intro = 'Practice this in Ear Training:',
}: EarTrainingCTAProps) {
  return (
    <aside
      style={{
        margin: '32px auto',
        maxWidth: 720,
        border: '1px solid #D85A30',
        borderRadius: 8,
        padding: '24px',
        background: '#FDFAF5',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jost), sans-serif',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.16em',
          color: '#7A7060',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >Practice</div>
      <p
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic',
          fontSize: 16,
          color: '#5F5E5A',
          margin: '0 0 16px 0',
          lineHeight: 1.5,
        }}
      >{intro}</p>

      {decks.length === 0 ? (
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            fontSize: 15,
            color: '#7A7060',
            padding: '12px 0',
          }}
        >Decks coming soon — we&rsquo;re building dedicated practice material for this skill.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {decks.map((d, i) => (
            <div
              key={d.slug}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 16,
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : '1px solid rgba(216,90,48,0.15)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-cormorant), serif',
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#2A2318',
                    }}
                  >{d.name}</span>
                  {d.cards && (
                    <span
                      style={{
                        fontFamily: 'var(--font-jost), sans-serif',
                        fontSize: 11,
                        color: '#7A7060',
                        letterSpacing: '0.04em',
                      }}
                    >{d.cards}</span>
                  )}
                </div>
                {d.description && (
                  <div
                    style={{
                      fontFamily: 'var(--font-cormorant), serif',
                      fontStyle: 'italic',
                      fontSize: 14,
                      color: '#5F5E5A',
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}
                  >{d.description}</div>
                )}
              </div>
              <Link
                href={`/study/${d.slug}`}
                style={{
                  fontFamily: 'var(--font-jost), sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#D85A30',
                  textDecoration: 'none',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: '1px solid rgba(216,90,48,0.4)',
                  transition: 'background 150ms ease',
                }}
              >Start →</Link>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
