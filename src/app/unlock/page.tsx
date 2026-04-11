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
    <div style={{ minHeight: '100vh', background: '#2C2A27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' as const, padding: '48px 32px', maxWidth: '360px', width: '100%' }}>
        <div style={{ fontFamily: F, fontSize: '22px', fontWeight: 300, letterSpacing: '0.08em', color: '#F0EDE6', marginBottom: '48px' }}>
          Note<span style={{ fontWeight: 400 }}>Lab</span>
        </div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#F0EDE6', marginBottom: '8px' }}>Early access</h1>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#9E9A92', marginBottom: '32px' }}>Enter your access code to continue</p>
        <input
          value={password}
          onChange={e => { setPassword(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          type="password"
          placeholder="Access code"
          autoFocus
          style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid ' + (error ? '#F09595' : '#484542'), background: '#353330', fontFamily: F, fontSize: '15px', fontWeight: 300, color: '#F0EDE6', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '12px', textAlign: 'center' as const }}
        />
        {error && <p style={{ fontFamily: F, fontSize: '12px', color: '#E53935', marginBottom: '12px' }}>Incorrect code — try again</p>}
        <button onClick={handleSubmit}
          style={{ width: '100%', background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
          Enter
        </button>
      </div>
    </div>
  )
}
