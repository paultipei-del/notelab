'use client'

import { useState } from 'react'
import { signIn, signUp } from '@/lib/auth'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')

    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        onSuccess()
        onClose()
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setConfirmed(true)
        setLoading(false)
      }
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#FDFAF3',
    border: '1px solid #DDD8CA',
    borderRadius: '8px',
    padding: '12px 14px',
    fontFamily: 'var(--font-jost), sans-serif',
    fontSize: '14px',
    fontWeight: 300,
    color: '#2A2318',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  if (confirmed) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ background: '#F2EDDF', borderRadius: '16px', padding: '48px 40px', maxWidth: '420px', width: '90%', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>✉️</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '28px', marginBottom: '12px', color: '#2A2318' }}>
            Check your email
          </h2>
          <p style={{ fontSize: '14px', fontWeight: 300, color: '#7A7060', lineHeight: 1.7, marginBottom: '28px' }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <button
            onClick={() => { setConfirmed(false); setMode('signin') }}
            style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 32px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, letterSpacing: '0.06em', cursor: 'pointer' }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#F2EDDF', borderRadius: '16px', padding: '40px', maxWidth: '420px', width: '90%', boxShadow: '0 8px 48px rgba(26,26,24,0.2)' }}>

        {/* Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: '#EDE8DF', borderRadius: '10px', padding: '4px', marginBottom: '32px' }}>
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? '#1A1A18' : '#7A7060',
                fontFamily: 'var(--font-jost), sans-serif',
                fontSize: '13px', fontWeight: mode === m ? 400 : 300,
                letterSpacing: '0.04em', cursor: 'pointer',
                boxShadow: mode === m ? '0 1px 4px rgba(26,26,24,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '28px', color: '#2A2318', marginBottom: '24px' }}>
          {mode === 'signin' ? 'Welcome back' : 'Join NoteLab Studio'}
        </h2>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7060', display: 'block', marginBottom: '6px' }}>
            Email
          </label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A7060', display: 'block', marginBottom: '6px' }}>
            Password
          </label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#A32D2D', marginBottom: '16px', fontWeight: 300 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email.trim() || !password.trim()}
          style={{
            width: '100%', background: '#1A1A18', color: 'white', border: 'none',
            borderRadius: '8px', padding: '14px',
            fontFamily: 'var(--font-jost), sans-serif', fontSize: '14px',
            fontWeight: 300, letterSpacing: '0.06em', cursor: 'pointer',
            opacity: loading || !email.trim() || !password.trim() ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 300, color: '#7A7060', marginTop: '20px' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#2A2318', cursor: 'pointer', fontSize: '12px', fontWeight: 400, textDecoration: 'underline' }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
