'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setTimeout(() => setReady(true), 2000)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '64px 56px', maxWidth: '480px', width: '90%', textAlign: 'center', boxShadow: '0 4px 32px rgba(26,26,24,0.10)' }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🎹</div>
        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '36px', letterSpacing: '0.02em', marginBottom: '12px', color: '#2A2318' }}>
          You're all set
        </h2>
        <p style={{ fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#7A7060', marginBottom: '36px', lineHeight: 1.7 }}>
          Your purchase is confirmed. Your new collections are ready to study.
        </p>
        {ready ? (
          <Link href="/" style={{ display: 'inline-block', background: '#1A1A18', color: 'white', borderRadius: '8px', padding: '16px 40px', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, letterSpacing: '0.08em', textDecoration: 'none' }}>
            Start Studying
          </Link>
        ) : (
          <p style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>Activating your collections…</p>
        )}
      </div>
    </div>
  )
}
