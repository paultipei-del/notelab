'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const F = 'var(--font-jost), sans-serif'

const HIDDEN_ON = ['/unlock', '/landing', '/metronome', '/tap-tempo', '/click-counter', '/sight-reading', '/glossary']

export default function SiteFooter() {
  const pathname = usePathname()
  if (HIDDEN_ON.includes(pathname)) return null
  if (pathname.startsWith('/study')) return null

  return (
    <footer style={{
      // Transparent footer over the page's bottom-shoulder warm cream.
      // No fill, no rule — the vignette in globals.css carries the
      // visual weight at the bottom of the viewport.
      background: 'transparent',
      borderTop: 'none',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap' as const,
      gap: '12px',
    }}>
      <span style={{ fontFamily: F, fontSize: 12, letterSpacing: '0.04em', fontWeight: 400, color: 'rgba(42,35,24,0.55)' }}>
        © {new Date().getFullYear()} NoteLab
      </span>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link href="/pricing" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 12, letterSpacing: '0.04em', fontWeight: 400, color: 'rgba(42,35,24,0.55)', cursor: 'pointer', transition: 'color 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(42,35,24,0.9)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(42,35,24,0.55)')}
          >
            Pricing
          </span>
        </Link>
        <Link href="/feedback" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 12, letterSpacing: '0.04em', fontWeight: 400, color: 'rgba(42,35,24,0.55)', cursor: 'pointer', transition: 'color 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(42,35,24,0.9)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(42,35,24,0.55)')}
          >
            Feedback
          </span>
        </Link>
        <Link href="/privacy" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 12, letterSpacing: '0.04em', fontWeight: 400, color: 'rgba(42,35,24,0.55)', cursor: 'pointer', transition: 'color 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(42,35,24,0.9)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(42,35,24,0.55)')}
          >
            Privacy Policy
          </span>
        </Link>
      </div>
    </footer>
  )
}
