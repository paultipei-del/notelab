'use client'

import React from 'react'
import { tokensFor } from '@/lib/learn/visuals/tokens'

interface MusicExampleCardProps {
  composer: string
  piece: string
  description: string
  /** Optional year or era for context (e.g. "1788"). */
  year?: string
}

/**
 * Named placeholder for a music-notation figure that's deferred to a future
 * build. Carries the specific composer + piece + brief description so the
 * pedagogical intent is visible even before the notation is rendered. Visual
 * style mirrors the existing diagram-coming card (cream background, ~6px
 * radius) but uses a coral border + small treble-clef glyph at the right
 * edge to mark it as the music-example variant rather than a generic stub.
 */
export function MusicExampleCard({
  composer,
  piece,
  description,
  year,
}: MusicExampleCardProps) {
  // Use the inline-size tokens for fonts; this card lives in MDX prose flow
  // and shouldn't dominate the page typographically.
  const T = tokensFor('inline')

  return (
    <figure
      role="figure"
      aria-label={`Music example coming: ${composer}, ${piece}`}
      style={{
        margin: '24px 0',
        padding: '20px 24px',
        border: '1px solid #D85A30',
        borderRadius: 6,
        background: '#FDFAF3',
        position: 'relative',
        display: 'flex',
        gap: 24,
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: T.fontLabel,
            fontSize: T.smallLabelFontSize,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: T.inkSubtle,
            marginBottom: 8,
          }}
        >
          Music example coming
        </div>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 18,
            fontWeight: 500,
            color: '#1A1A18',
            lineHeight: 1.25,
          }}
        >
          {composer}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 14,
            fontStyle: 'italic',
            color: '#1A1A18',
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {piece}
        </div>
        {year && (
          <div
            style={{
              fontFamily: T.fontLabel,
              fontSize: 12,
              color: T.inkSubtle,
              marginTop: 2,
            }}
          >
            {year}
          </div>
        )}
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 14,
            color: '#1A1A18',
            marginTop: 12,
            lineHeight: 1.55,
          }}
        >
          {description}
        </div>
      </div>
      <div
        aria-hidden
        style={{
          fontFamily: T.fontMusic,
          fontSize: 56,
          color: '#D85A30',
          lineHeight: 1,
          alignSelf: 'center',
          flexShrink: 0,
          opacity: 0.85,
        }}
      >
        {T.trebleClefGlyph}
      </div>
    </figure>
  )
}
