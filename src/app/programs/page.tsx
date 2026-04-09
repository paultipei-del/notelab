'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DECKS, deckRequiresPurchase, CM_BUNDLE_PRICE_ID } from '@/lib/decks'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import AuthModal from '@/components/AuthModal'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const cmDecks = DECKS.filter(d => d.tag === 'cm')

export default function ProgramsPage() {
  const { user } = useAuth()
  const { hasPurchased, hasSubscription } = usePurchases(user?.id ?? null)
  const [showAuth, setShowAuth] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

  const cmUnlocked = hasPurchased(CM_BUNDLE_PRICE_ID) || hasSubscription()

  function canAccess(deckId: string) {
    if (!deckRequiresPurchase(deckId)) return true
    if (hasSubscription()) return true
    if (hasPurchased(CM_BUNDLE_PRICE_ID)) return true
    return false
  }

  async function handleBuy() {
    if (!user) { setShowAuth(true); return }
    setCheckingOut(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: CM_BUNDLE_PRICE_ID, userId: user.id, userEmail: user.email, productType: 'cm_bundle' }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error(err)
      setCheckingOut(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px' }}>Programs</p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#1A1A18', marginBottom: '12px', letterSpacing: '0.02em' }}>
            Certificate of Merit
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 300, color: '#888780', maxWidth: '520px', lineHeight: 1.7, marginBottom: '28px' }}>
            Complete exam preparation — Preparatory through Advanced. Each level covers the cumulative theory requirements: signs &amp; terms, scales, intervals, chords, history, and ear training.
          </p>

          {/* Unlock banner */}
          {!cmUnlocked && (
            <div style={{ background: '#1A1A18', borderRadius: '14px', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '16px', marginBottom: '32px' }}>
              <div>
                <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: 'white', margin: '0 0 4px' }}>Unlock the full collection</p>
                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: 0 }}>All {cmDecks.length} levels — one purchase</p>
              </div>
              <button onClick={handleBuy} disabled={checkingOut} style={{
                background: '#BA7517', color: 'white', border: 'none',
                borderRadius: '8px', padding: '10px 24px',
                fontFamily: F, fontSize: '13px', fontWeight: 300,
                cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0,
              }}>
                {checkingOut ? 'Loading…' : 'Unlock Bundle'}
              </button>
            </div>
          )}
        </div>

        {/* Deck grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {cmDecks.map((deck, i) => {
            const locked = !canAccess(deck.id)
            const levelLabel = i + 1 === cmDecks.length ? 'Advanced' : i === 0 ? 'Preparatory' : `Level ${i}`
            return locked ? (
              <div key={deck.id} style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '16px', padding: '24px', opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#D3D1C7' }}>{levelLabel}</span>
                  <span style={{ fontSize: '12px', color: '#D3D1C7' }}>🔒</span>
                </div>
                <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '20px', color: '#888780', marginBottom: '6px' }}>{deck.title}</h3>
                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#D3D1C7', lineHeight: 1.6 }}>{deck.cards.length} cards</p>
              </div>
            ) : (
              <Link key={deck.id} href={`/study/${deck.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '16px', padding: '24px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(26,26,24,0.06)', transition: 'all 0.2s', height: '100%', boxSizing: 'border-box' as const }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#BA7517', letterSpacing: '0.04em' }}>{levelLabel}</span>
                    <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#888780' }}>{deck.cards.length} cards</span>
                  </div>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '6px' }}>{deck.title}</h3>
                  <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', lineHeight: 1.6, marginBottom: '16px' }}>{deck.description}</p>
                  <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#BA7517' }}>Study →</span>
                </div>
              </Link>
            )
          })}
        </div>

      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  )
}
