'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const F = 'var(--font-jost), sans-serif'

const HIDDEN_ON = ['/unlock', '/landing']

export default function SiteFooter() {
  const pathname = usePathname()
  if (HIDDEN_ON.includes(pathname)) return null

  return (
    <footer style={{
      borderTop: '1px solid #D3D1C7',
      background: '#F5F2EC',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      gap: '12px',
    }}>
      <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>
        © {new Date().getFullYear()} NoteLab Studio
      </span>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link href="/feedback" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1A1A18')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888780')}
          >
            Feedback
          </span>
        </Link>
        <Link href="/privacy" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1A1A18')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888780')}
          >
            Privacy Policy
          </span>
        </Link>
      </div>
    </footer>
  )
}
