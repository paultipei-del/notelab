'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const F = 'var(--font-jost), sans-serif'

const HIDDEN_ON = ['/unlock', '/landing']

export default function SiteFooter() {
  const pathname = usePathname()
  if (HIDDEN_ON.includes(pathname)) return null
  if (pathname.startsWith('/study')) return null

  return (
    <footer style={{
      borderTop: '1px solid #DDD8CA',
      background: '#F2EDDF',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      gap: '12px',
    }}>
      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>
        © {new Date().getFullYear()} NoteLab
      </span>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link href="/pricing" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2A2318')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7A7060')}
          >
            Pricing
          </span>
        </Link>
        <Link href="/feedback" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2A2318')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7A7060')}
          >
            Feedback
          </span>
        </Link>
        <Link href="/privacy" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2A2318')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7A7060')}
          >
            Privacy Policy
          </span>
        </Link>
      </div>
    </footer>
  )
}
