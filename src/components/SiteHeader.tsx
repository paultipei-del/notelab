'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AuthModal from '@/components/AuthModal'

const F = 'var(--font-jost), sans-serif'
/** Site header controls: rounded rectangle, not full pill */
const HDR_BTN_R = '10px'
const NAV_TEXT_ACTIVE = '#2A2318'
const NAV_TEXT_ACTIVE_HOVER = '#1A1712'
const NAV_TEXT_IDLE = '#7A7060'
const NAV_TEXT_IDLE_HOVER = '#5E574A'

// Two groups: content/curricula (Learn, Programs) and practice/utilities
// (Flashcards, Ear Training, Tools). `groupBreakBefore` signals the renderer
// to insert extra horizontal breathing room before that item — no divider,
// just a wider gap than the default item-to-item spacing.
const NAV: Array<{
  label: string
  href: string
  match: (p: string) => boolean
  groupBreakBefore?: boolean
}> = [
  { label: 'Learn',        href: '/learn',        match: (p: string) => p === '/learn' || p.startsWith('/learn/') },
  { label: 'Programs',     href: '/programs',     match: (p: string) => p === '/programs' || p.startsWith('/programs/') },
  { label: 'Flashcards',   href: '/flashcards',   match: (p: string) => p === '/flashcards', groupBreakBefore: true },
  { label: 'Ear Training', href: '/ear-training', match: (p: string) => p === '/ear-training' || (p === '/collection' /* legacy fallback */) },
  { label: 'Tools',        href: '/tools',        match: (p: string) => p === '/tools' },
]

function getInitials(name: string | null | undefined, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
  }
  const parts = email.split('@')[0].split(/[._-]/)
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || email[0].toUpperCase()
}

export default function SiteHeader() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pillRect, setPillRect] = useState<{ left: number; width: number } | null>(null)
  const [hoveredNavIdx, setHoveredNavIdx] = useState<number | null>(null)

  const activeIdx = NAV.findIndex(item => item.match(pathname))

  const movePillTo = useCallback((idx: number) => {
    const item = itemRefs.current[idx]
    if (!item) return
    // Use offsetLeft/offsetWidth — relative to the nav container, same as the reference pattern
    setPillRect({ left: item.offsetLeft, width: item.offsetWidth })
  }, [])

  // Initialise pill on active item after mount and route changes
  useEffect(() => {
    if (activeIdx >= 0) movePillTo(activeIdx)
    else setPillRect(null)
  }, [pathname, activeIdx, movePillTo])

  // Dismiss menus on outside tap. Use capture + early return (do not stopPropagation on header buttons —
  // iOS Safari can fail to synthesize click when pointerdown propagation is stopped on those controls).
  useEffect(() => {
    function handle(e: PointerEvent) {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || mobileRef.current?.contains(t)) return
      setShowUserMenu(false)
      setShowMobileMenu(false)
    }
    document.addEventListener('pointerdown', handle, true)
    return () => document.removeEventListener('pointerdown', handle, true)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setShowMobileMenu(false) }, [pathname])

  if (pathname === '/unlock') return null
  if (pathname === '/landing') return null

  async function handleSignOut() {
    setShowUserMenu(false)
    await signOut()
  }

  const displayName: string | null = user?.user_metadata?.display_name ?? null
  const email = user?.email ?? ''
  const initials = user ? getInitials(displayName, email) : ''

  return (
    <>
      <header className="site-header">

        {/* Wordmark */}
        <div className="site-header__brand">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo-dark.png" alt="NoteLab" style={{ height: '28px', width: 'auto', display: 'block' }} />
            <span style={{ fontFamily: F, fontSize: '20px', fontWeight: 300, letterSpacing: '0.08em', color: '#2A2318' }}>
              Note<span style={{ fontWeight: 500 }}>Lab</span>
            </span>
          </Link>
        </div>

        {/* Desktop nav — centered in viewport; wrapper hidden on mobile */}
        <div className="site-header__nav-wrap">
        <nav
          ref={navRef}
          className="nl-desktop-nav"
          style={{
            position: 'relative',
            background: 'transparent',
            borderRadius: HDR_BTN_R,
            padding: '5px',
            gap: '0',
          }}
          onMouseLeave={() => {
            setHoveredNavIdx(null)
            if (activeIdx >= 0) movePillTo(activeIdx)
            else setPillRect(null)
          }}
        >
          {/* Sliding pill */}
          {pillRect && (
            <div style={{
              position: 'absolute',
              left: pillRect.left,
              width: pillRect.width,
              top: '5px',
              bottom: '5px',
              borderRadius: HDR_BTN_R,
              // Warmed-up pill so it harmonizes with the new page vignette
              // instead of popping like a spotlight against the cream.
              background: 'linear-gradient(180deg, rgb(248,243,230) 0%, rgb(243,237,222) 50%, rgb(232,224,204) 100%)',
              border: '1px solid rgb(217,210,189)',
              boxShadow: [
                'inset 0 1px 0 rgba(255,253,247,0.7)',
                'inset 0 -1px 0 rgba(42,35,24,0.06)',
                '0 1px 2px rgba(42,35,24,0.04)',
                '0 3px 8px rgba(42,35,24,0.07)',
              ].join(', '),
              transition: 'left 300ms ease-out, width 300ms ease-out',
              pointerEvents: 'none',
              zIndex: 0,
            }} />
          )}
          {NAV.map((item, idx) => {
            const active = item.match(pathname)
            const hover = hoveredNavIdx === idx
            const color = active
              ? (hover ? NAV_TEXT_ACTIVE_HOVER : NAV_TEXT_ACTIVE)
              : (hover ? NAV_TEXT_IDLE_HOVER : NAV_TEXT_IDLE)
            return (
              <button
                key={item.href}
                ref={el => { itemRefs.current[idx] = el }}
                onClick={() => router.push(item.href)}
                onMouseEnter={() => {
                  setHoveredNavIdx(idx)
                  movePillTo(idx)
                }}
                style={{
                  position: 'relative', zIndex: 10,
                  background: 'transparent', border: 'none',
                  borderRadius: HDR_BTN_R,
                  padding: '7px 18px',
                  // Extra left margin on the first item of group B (Flashcards)
                  // creates subtle visual grouping without a divider.
                  marginLeft: item.groupBreakBefore ? '14px' : undefined,
                  fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400,
                  color,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap' as const,
                  cursor: 'pointer',
                  transition: 'color 180ms ease',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
        </div>

        {/* Right side — auth before hamburger on small screens so the avatar isn’t the first thing clipped */}
        <div className="site-header__actions">

          {/* Auth (avatar / sign in) */}
          {loading ? (
            <div
              className="site-header__auth-placeholder"
              aria-hidden
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(26,26,24,0.08)',
                flexShrink: 0,
              }}
            />
          ) : (
            user ? (
              <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: '#1A1A18', border: 'none',
                    fontFamily: F, fontSize: '13px', fontWeight: 500,
                    color: 'white', cursor: 'pointer', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    touchAction: 'manipulation',
                  }}
                >
                  {initials}
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#FDFAF3', border: '1px solid #DDD8CA',
                    borderRadius: '12px', padding: '8px',
                    boxShadow: '0 4px 24px rgba(26,26,24,0.12)',
                    minWidth: '200px', zIndex: 100,
                  }}>
                    <div style={{ padding: '10px 14px 14px', borderBottom: '1px solid #EDE8DF', marginBottom: '4px' }}>
                      {displayName && (
                        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#2A2318', margin: '0 0 2px' }}>
                          {displayName}
                        </p>
                      )}
                      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', margin: 0, wordBreak: 'break-all' as const }}>
                        {email}
                      </p>
                    </div>

                    <Link href="/account" onClick={() => setShowUserMenu(false)} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{ borderRadius: '8px', padding: '10px 14px', fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#2A2318', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F2EDDF')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        Account settings
                      </div>
                    </Link>
                    <button type="button" onClick={handleSignOut} style={{
                      display: 'block', width: '100%', textAlign: 'left' as const,
                      background: 'none', border: 'none', borderRadius: '8px',
                      padding: '10px 14px', borderTop: '1px solid #EDE8DF', marginTop: '4px',
                      fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', cursor: 'pointer',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F2EDDF')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="site-header__sign-in"
                style={{
                  border: '1px solid #DDD8CA', borderRadius: HDR_BTN_R,
                  padding: '8px 20px', fontFamily: F, fontSize: 'var(--nl-text-body)',
                  fontWeight: 400, color: '#2A2318', background: 'none', cursor: 'pointer',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                }}
              >
                Sign in
              </button>
            )
          )}

          {/* Mobile hamburger */}
          <div ref={mobileRef} className={`nl-mobile-nav${showMobileMenu ? ' is-open' : ''}`}>
            <button
              type="button"
              onClick={() => setShowMobileMenu(v => !v)}
              aria-label="Menu"
              aria-expanded={showMobileMenu}
              className="nl-mobile-nav__toggle"
            >
              <span className="nl-mobile-nav__line nl-mobile-nav__line--top" />
              <span className="nl-mobile-nav__line nl-mobile-nav__line--bottom" />
            </button>

            {showMobileMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#FDFAF3', border: '1px solid #DDD8CA',
                borderRadius: '14px', padding: '8px',
                boxShadow: '0 4px 24px rgba(26,26,24,0.12)',
                minWidth: '220px', zIndex: 100,
              }}>
                {NAV.map(item => {
                  const active = item.match(pathname)
                  return (
                    <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{
                        padding: '12px 16px', borderRadius: '8px',
                        fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400,
                        color: active ? '#1A1A18' : '#7A7060',
                        background: active ? '#F2EDDF' : 'none',
                        cursor: 'pointer',
                      }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F2EDDF' }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none' }}
                      >
                        {item.label}
                        {active && <span style={{ fontSize: 'var(--nl-text-compact)', color: '#B5402A', marginLeft: '8px' }}>●</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  )
}
