'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function Unlock() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    const res = await fetch('/api/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/')
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' as const, padding: '48px 32px', maxWidth: '360px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '48px' }}>
          <img src="/logo-dark.png" alt="NoteLab" style={{ height: '28px', width: 'auto', display: 'block' }} />
          <span style={{ fontFamily: F, fontSize: '22px', fontWeight: 300, letterSpacing: '0.08em', color: '#2A2318' }}>
            Note<span style={{ fontWeight: 400 }}>Lab</span>
          </span>
        </div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '8px' }}>Early access</h1>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', marginBottom: '32px' }}>Enter your access code to continue</p>
        <input
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          type="password"
          placeholder="Access code"
          autoFocus
          style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid ' + (error ? '#F09595' : '#DDD8CA'), background: '#FDFAF3', fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#2A2318', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '12px', textAlign: 'center' as const }}
        />
        {error && <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#E53935', marginBottom: '12px' }}>Incorrect code — try again</p>}
        <button onClick={handleSubmit}
          style={{ width: '100%', background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>
          Enter
        </button>
      </div>
    </div>
  )
}
