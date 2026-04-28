'use client'

import Link from 'next/link'

const F = 'var(--font-jost), sans-serif'

export interface Crumb {
  label: string
  href?: string
}

interface BreadcrumbProps {
  crumbs: Crumb[]
  style?: React.CSSProperties
}

export function Breadcrumb({ crumbs, style }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '6px',
        fontFamily: F,
        fontSize: 'var(--nl-text-compact)',
        color: '#7A7060',
        ...style,
      }}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <span key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                style={{ color: '#7A7060', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#1A1A18'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#7A7060'
                }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: isLast ? '#2A2318' : '#7A7060', fontWeight: isLast ? 500 : 400 }}>
                {crumb.label}
              </span>
            )}
            {!isLast && (
              <span aria-hidden="true" style={{ color: '#C8C4BA', fontSize: 13 }}>
                ›
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
