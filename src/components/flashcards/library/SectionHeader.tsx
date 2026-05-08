'use client'

export interface SectionHeaderProps {
  label: string
  count: number
  /** Italic descriptor shown in place of the volume count when provided. */
  subtitle?: string
  /** Right-side "See all →" link target. Defaults to '#'. */
  seeAllHref?: string
}

export default function SectionHeader({
  label,
  count,
  subtitle,
  seeAllHref = '#',
}: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        paddingBottom: 8,
        marginBottom: 14,
        borderBottom: '1px solid rgba(139, 105, 20, 0.2)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0 }}>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22,
            fontWeight: 500,
            margin: 0,
            color: '#1a1208',
            letterSpacing: '-0.015em',
          }}
        >
          {label}
        </h2>
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 13,
            color: '#8a7560',
          }}
        >
          {subtitle ?? `${count} ${count === 1 ? 'volume' : 'volumes'}`}
        </span>
      </div>
      <a
        href={seeAllHref}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: 13,
          color: '#a0381c',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        See all →
      </a>
      <div
        style={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          width: 60,
          height: 1,
          background: 'linear-gradient(90deg, #d4af37 0%, transparent 100%)',
        }}
      />
    </div>
  )
}
