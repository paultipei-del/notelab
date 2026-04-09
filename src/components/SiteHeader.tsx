'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import AuthModal from '@/components/AuthModal'

const F = 'var(--font-jost), sans-serif'

const NAV = [
  { label: 'Tools',        href: '/',                    match: (p: string) => p === '/' },
  { label: 'Ear Training', href: '/collection?tag=ear',  match: (p: string) => p === '/collection' },
  { label: 'Flashcards',   href: '/collection?tag=cm',   match: (p: string) => false }, // highlighted via collection
  { label: 'Rhythm',       href: '/rhythm',              match: (p: string) => p.startsWith('/rhythm') },
]

function initials(email: string) {
  const parts = email.split('@')[0].split(/[._-]/)
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || email[0].toUpperCase()
}

export default function SiteHeader() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('nl-access=granted'))
    if (!cookie) window.location.href = '/unlock'
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (pathname === '/unlock') return null
  if (pathname === '/landing') return null

  async function handleSignOut() {
    setShowUserMenu(false)
    await signOut()
  }

  return (
    <>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: '56px',
        borderBottom: '1px solid #D3D1C7',
        background: '#F5F2EC',
        position: 'sticky' as const, top: 0, zIndex: 50,
        userSelect: 'none' as const, WebkitUserSelect: 'none' as const,
      }}>

        {/* Left: wordmark */}
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: F, fontSize: '18px', fontWeight: 300, letterSpacing: '0.08em', color: '#1A1A18' }}>
            Note<span style={{ fontWeight: 500 }}>Lab</span>
          </span>
        </Link>

        {/* Center: nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {NAV.map(item => {
            const active = item.match(pathname)
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-block',
                  fontFamily: F, fontSize: '13px', fontWeight: 300,
                  color: active ? '#1A1A18' : '#888780',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: active ? 'white' : 'transparent',
                  border: active ? '1px solid #D3D1C7' : '1px solid transparent',
                  boxShadow: active ? '0 1px 4px rgba(26,26,24,0.07)' : 'none',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Right: auth */}
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {user ? (
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
                  {initials(user.email ?? '')}
                </button>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'white', border: '1px solid #D3D1C7',
                    borderRadius: '12px', padding: '8px',
                    boxShadow: '0 4px 24px rgba(26,26,24,0.12)',
                    minWidth: '180px', zIndex: 100,
                  }}>
                    <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', padding: '8px 12px 10px', margin: 0, borderBottom: '1px solid #EDE8DF', wordBreak: 'break-all' as const }}>
                      {user.email}
                    </p>
                    <Link href="/account" onClick={() => setShowUserMenu(false)} style={{ textDecoration: 'none', display: 'block' }}>
                      <div style={{
                        borderRadius: '8px', padding: '9px 12px', marginTop: '4px',
                        fontFamily: F, fontSize: '13px', fontWeight: 300,
                        color: '#1A1A18', cursor: 'pointer',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F5F2EC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        Account settings
                      </div>
                    </Link>
                    <button onClick={handleSignOut} style={{
                      display: 'block', width: '100%', textAlign: 'left' as const,
                      background: 'none', border: 'none', borderRadius: '8px',
                      padding: '9px 12px',
                      fontFamily: F, fontSize: '13px', fontWeight: 300,
                      color: '#888780', cursor: 'pointer', borderTop: '1px solid #EDE8DF', marginTop: '4px',
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
            )}
          </div>
        )}
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  )
}
