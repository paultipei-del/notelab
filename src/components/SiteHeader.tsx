'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import AuthModal from '@/components/AuthModal'

const F = 'var(--font-jost), sans-serif'

const NAV = [
  { label: 'Flashcards',   href: '/flashcards',         match: (p: string) => p === '/flashcards' },
  { label: 'Ear Training', href: '/collection?tag=ear', match: (p: string) => p === '/collection' },
  { label: 'Tools',        href: '/tools',              match: (p: string) => p === '/tools' },
  { label: 'Programs',     href: '/programs',           match: (p: string) => p === '/programs' },
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

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('nl-access=granted'))
    if (!cookie) window.location.href = '/unlock'
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false)
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) setShowMobileMenu(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
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
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px',
        borderBottom: '1px solid #D3D1C7',
        background: '#F5F2EC',
        position: 'sticky' as const, top: 0, zIndex: 50,
        userSelect: 'none' as const, WebkitUserSelect: 'none' as const,
      }}>

        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: F, fontSize: '18px', fontWeight: 300, letterSpacing: '0.08em', color: '#1A1A18' }}>
            Note<span style={{ fontWeight: 500 }}>Lab</span>
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile via inline media-query workaround */}
        <nav className="nl-desktop-nav">
          {NAV.map(item => {
            const active = item.match(pathname)
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-block',
                  fontFamily: F, fontSize: '13px', fontWeight: 300,
                  color: active ? '#1A1A18' : '#888780',
                  padding: '6px 14px', borderRadius: '20px',
                  background: active ? 'white' : 'transparent',
                  border: active ? '1px solid #D3D1C7' : '1px solid transparent',
                  boxShadow: active ? '0 1px 4px rgba(26,26,24,0.07)' : 'none',
                  transition: 'all 0.15s', cursor: 'pointer', letterSpacing: '0.01em',
                }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

          {/* Mobile hamburger */}
          <div ref={mobileRef} className="nl-mobile-nav">
            <button
              onClick={() => setShowMobileMenu(v => !v)}
              aria-label="Menu"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: showMobileMenu ? '#1A1A18' : 'transparent',
                border: '1px solid ' + (showMobileMenu ? '#1A1A18' : '#D3D1C7'),
                cursor: 'pointer', display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', justifyContent: 'center', gap: '5px',
              }}
            >
              {[0,1,2].map(i => (
                <span key={i} style={{
                  display: 'block', width: '14px', height: '1.5px',
                  background: showMobileMenu ? 'white' : '#1A1A18',
                  borderRadius: '1px',
                  transition: 'all 0.15s',
                  transform: showMobileMenu
                    ? i === 0 ? 'translateY(6.5px) rotate(45deg)' : i === 2 ? 'translateY(-6.5px) rotate(-45deg)' : 'scaleX(0)'
                    : 'none',
                }} />
              ))}
            </button>

            {showMobileMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'white', border: '1px solid #D3D1C7',
                borderRadius: '14px', padding: '8px',
                boxShadow: '0 4px 24px rgba(26,26,24,0.12)',
                minWidth: '200px', zIndex: 100,
              }}>
                {NAV.map(item => {
                  const active = item.match(pathname)
                  return (
                    <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{
                        padding: '11px 14px', borderRadius: '8px',
                        fontFamily: F, fontSize: '14px', fontWeight: 300,
                        color: active ? '#1A1A18' : '#888780',
                        background: active ? '#F5F2EC' : 'none',
                        cursor: 'pointer',
                      }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F5F2EC' }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none' }}
                      >
                        {item.label}
                        {active && <span style={{ fontSize: '11px', color: '#BA7517', marginLeft: '8px' }}>●</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Auth */}
          {!loading && (
            user ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: '#1A1A18', border: 'none',
                    fontFamily: F, fontSize: '12px', fontWeight: 400,
                    color: 'white', cursor: 'pointer', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {initials}
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'white', border: '1px solid #D3D1C7',
                    borderRadius: '12px', padding: '8px',
                    boxShadow: '0 4px 24px rgba(26,26,24,0.12)',
                    minWidth: '200px', zIndex: 100,
                  }}>
                    {/* Identity header */}
                    <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid #EDE8DF', marginBottom: '4px' }}>
                      {displayName && (
                        <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 400, color: '#1A1A18', margin: '0 0 2px' }}>
                          {displayName}
                        </p>
                      )}
                      <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780', margin: 0, wordBreak: 'break-all' as const }}>
                        {email}
                      </p>
                    </div>

                    <Link href="/account" onClick={() => setShowUserMenu(false)} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{ borderRadius: '8px', padding: '9px 12px', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#1A1A18', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F5F2EC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        Account settings
                      </div>
                    </Link>
                    <button onClick={handleSignOut} style={{
                      display: 'block', width: '100%', textAlign: 'left' as const,
                      background: 'none', border: 'none', borderRadius: '8px',
                      padding: '9px 12px', borderTop: '1px solid #EDE8DF', marginTop: '4px',
                      fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', cursor: 'pointer',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F5F2EC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{
                border: '1px solid #1A1A18', borderRadius: '20px',
                padding: '7px 18px', fontFamily: F, fontSize: '13px',
                fontWeight: 300, color: '#1A1A18', background: 'none', cursor: 'pointer',
              }}>
                Sign in
              </button>
            )
          )}
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  )
}
