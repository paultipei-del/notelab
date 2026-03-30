'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import AuthModal from '@/components/AuthModal'

const F = 'var(--font-jost), sans-serif'

export default function SiteHeader() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  if (pathname === '/unlock') return null
  const [showAuth, setShowAuth] = useState(false)

  async function handleSignOut() {
    await signOut()
  }

  return (
    <>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', borderBottom: '1px solid #D3D1C7',
        background: '#F5F2EC', position: 'sticky' as const, top: 0, zIndex: 50,
        userSelect: 'none' as const, WebkitUserSelect: 'none' as const,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: F, fontSize: '20px', fontWeight: 300, letterSpacing: '0.08em', color: '#1A1A18', cursor: 'pointer' }}>
            Note<span style={{ fontWeight: 400 }}>Lab</span>
          </div>
        </Link>

        {!loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {user ? (
              <>
                <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', userSelect: 'none' as const, WebkitUserSelect: 'none' as const }}>{user.email}</span>
                <button onClick={handleSignOut}
                  style={{ border: '1px solid #D3D1C7', borderRadius: '8px', padding: '7px 16px', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', background: 'none', cursor: 'pointer' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)}
                style={{ border: '1px solid #1A1A18', borderRadius: '8px', padding: '7px 18px', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#1A1A18', background: 'none', cursor: 'pointer' }}>
                Sign In
              </button>
            )}
          </div>
        )}
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  )
}
