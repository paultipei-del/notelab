'use client'

import Link from 'next/link'

const F = 'var(--font-jost), sans-serif'

export interface Crumb {
  label: string
  href?: string           // omit href for the current page (non-clickable)
}

interface BreadcrumbProps {
  crumbs: Crumb[]
  style?: React.CSSProperties
}

export function Breadcrumb({ crumbs, style }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: '6px', fontFamily: F, fontSize: 'var(--nl-text-compact)',
      color: '#7A7060',
      ...style,
    }}>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {c.href && !isLast ? (
              <Link href={c.href} style={{
                color: '#7A7060', textDecoration: 'none',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#1A1A18' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7A7060' }}
              >
                {c.label}
              </Link>
            ) : (
              <span style={{
                color: isLast ? '#2A2318' : '#7A7060',
                fontWeight: isLast ? 500 : 400,
              }}>
                {c.label}
              </span>
            )}
            {!isLast && (
              <span aria-hidden="true" style={{ color: '#C8C4BA', fontSize: 13 }}>›</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
