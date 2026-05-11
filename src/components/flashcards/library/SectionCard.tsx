'use client'

import type { ReactNode } from 'react'
import InfoTip from './InfoTip'

/**
 * Editorial sidebar card. Used by both the bookshelf sections and the
 * examination-hall section. Sits on the left at a fixed 200px and aligns
 * (via the parent's `align-items: flex-end`) to the bottom of its sibling.
 * The padding-bottom + absolutely-positioned brass rule combine to put a
 * thin gold line at the level of the wood plank/desk on the right,
 * visually tying the card to its sibling.
 *
 * The default eyebrow text is "Section" and the link text is "See all →";
 * pass `eyebrow` / `linkText` to override (e.g. "Practice" / "About the exams →").
 */
interface SectionCardProps {
  label: ReactNode
  sublabel: string
  seeAllHref?: string
  eyebrow?: string
  linkText?: string
  floorOffset?: number
  /** Optional explanatory body rendered behind an "i" info button
   *  inline next to the section label. */
  info?: string
}

export function SectionCard({
  label,
  sublabel,
  seeAllHref = '#',
  eyebrow = 'Section',
  linkText = 'See all →',
  floorOffset = 0,
  info,
}: SectionCardProps) {
  return (
    <div
      style={{
        flex: '0 0 200px',
        paddingBottom: 30,
        position: 'relative',
        marginBottom: floorOffset,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jost), system-ui, -apple-system, sans-serif',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#a0381c',
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-cormorant), "Cormorant Garamond", "Garamond", serif',
          fontSize: 32,
          fontWeight: 500,
          color: '#1a1208',
          letterSpacing: '-0.015em',
          lineHeight: 1,
          margin: '0 0 8px 0',
        }}
      >
        {label}
        {info && <InfoTip text={info} size={18} />}
      </h2>
      <div
        style={{
          fontFamily: 'var(--font-cormorant), "Cormorant Garamond", "Garamond", serif',
          fontStyle: 'italic',
          fontSize: 15,
          color: '#5a4028',
          lineHeight: 1.4,
          marginBottom: 12,
        }}
      >
        {sublabel}
      </div>
      <a
        href={seeAllHref}
        style={{
          fontFamily: 'var(--font-cormorant), "Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontSize: 14,
          color: '#a0381c',
          borderBottom: '1px solid rgba(160, 56, 28, 0.3)',
          paddingBottom: 1,
          textDecoration: 'none',
        }}
      >
        {linkText}
      </a>
      <div
        style={{
          position: 'absolute',
          bottom: -2,
          left: 0,
          right: 0,
          height: 2,
          background:
            'linear-gradient(90deg, #8b6914 0%, #d4af37 30%, #d4af37 70%, transparent 100%)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
        }}
      />
    </div>
  )
}
