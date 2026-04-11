'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { DECKS, deckRequiresPurchase, CM_BUNDLE_PRICE_ID, PRO_PRICE_ID } from '@/lib/decks'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import AuthModal from '@/components/AuthModal'
import { useState } from 'react'

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  free: { bg: '#E1F5EE', color: '#0F6E56' },
  cm: { bg: '#FAEEDA', color: '#B5402A' },
  theory: { bg: '#EEEDFE', color: '#534AB7' },
  repertoire: { bg: '#FAECE7', color: '#993C1D' },
}

function CollectionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tag = searchParams.get('tag') ?? 'cm'
  const { user } = useAuth()
  const { hasPurchased, hasSubscription } = usePurchases(user?.id ?? null)
  const [showAuth, setShowAuth] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

  const decks = tag === 'ear' ? DECKS.filter(d => d.id.startsWith('ear-')) : tag === 'symbols' ? DECKS.filter(d => d.id.startsWith('symbols-')) : DECKS.filter(d => d.tag === tag)

  const titles: Record<string, string> = {
    cm: 'CM Collection',
    free: 'Free Collections',
    theory: 'Theory Collections',
    repertoire: 'Repertoire Collections',
    ear: 'Ear Training',
    symbols: 'Music Symbols',
  }

  const descriptions: Record<string, string> = {
    cm: 'Certificate of Merit exam preparation — Preparatory through Advanced. Each deck covers the cumulative theory requirements for that level.',
    free: 'Free collections covering fundamental music concepts.',
    theory: 'College-level music theory collections.',
    repertoire: 'Composer and repertoire study collections.',
    ear: 'Train your ear with real piano audio. Listen to intervals, triads, cadences, and scales — then identify what you heard. Go back and forth freely to compare examples.',
    symbols: 'Learn to read music notation symbols — dynamics, articulations, accidentals, and note values. Each card shows the actual engraved symbol.',
  }

  function canAccessDeck(deckId: string): boolean {
    if (deckId.startsWith('ear-')) return true
    if (deckId.startsWith('symbols-')) return true
    if (!deckRequiresPurchase(deckId)) return true
    if (hasSubscription()) return true
    if (hasPurchased(CM_BUNDLE_PRICE_ID)) return true
    return false
  }

  async function handleBuy(priceId: string, productType: string) {
    if (!user) { setShowAuth(true); return }
    setCheckingOut(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, userEmail: user.email, productType }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error(err)
      setCheckingOut(false)
    }
  }

  const allUnlocked = decks.every(d => canAccessDeck(d.id))

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      {/* Hero */}
      <div style={{ padding: '24px 32px 32px', maxWidth: '960px', margin: '0 auto' }}>
        {tag !== 'ear' && <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#7A7060', padding: 0, marginBottom: '24px', display: 'block' }}>← Back</button>}
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>
          {titles[tag] ?? tag}
        </h1>
        <p style={{ fontSize: '15px', fontWeight: 300, color: '#7A7060', maxWidth: '560px', lineHeight: 1.7, marginBottom: '32px' }}>
          {descriptions[tag] ?? ''}
        </p>

        {/* Buy all banner for locked collections */}
        {tag !== 'ear' && tag !== 'symbols' && !allUnlocked && (
          <div style={{ background: '#1A1A18', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 300, color: 'white', marginBottom: '2px' }}>
                Unlock the full {titles[tag]}
              </p>
              <p style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.6)' }}>
                All {decks.length} levels in one purchase
              </p>
            </div>
            <button
              onClick={() => handleBuy(CM_BUNDLE_PRICE_ID, 'cm_bundle')}
              disabled={checkingOut}
              style={{ background: '#B5402A', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: 300, letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {checkingOut ? 'Loading…' : 'Unlock Bundle'}
            </button>
          </div>
        )}
      </div>

      {/* Deck grid */}
      {tag === 'ear' ? (
        // Grouped layout for ear training
        <div style={{ padding: '0 32px 64px', maxWidth: '960px', margin: '0 auto' }}>
          {(() => {
            const groups: { label: string; decks: typeof decks }[] = []
            decks.forEach(deck => {
              const label = deck.group ?? 'Other'
              const existing = groups.find(g => g.label === label)
              if (existing) existing.decks.push(deck)
              else groups.push({ label, decks: [deck] })
            })
            return groups.map(({ label, decks: groupDecks }) => (
              <div key={label} style={{ marginBottom: '40px' }}>
                <h2 style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7060', marginBottom: '16px' }}>{label}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', alignItems: 'stretch' }}>
                  {groupDecks.map(deck => (
                    <Link key={deck.id} href={`/study/${deck.id}`} style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
                      <div
                        style={{
                          background: '#FDFAF3',
                          border: '1px solid #DDD8CA',
                          borderRadius: '16px',
                          padding: '24px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 12px rgba(26,26,24,0.06)',
                          transition: 'all 0.2s',
                          width: '100%',
                          height: '100%',
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#B5402A'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 32px rgba(26,26,24,0.10)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD8CA'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,26,24,0.06)' }}
                      >
                        <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '20px', marginBottom: '12px', background: TAG_COLORS.free.bg, color: TAG_COLORS.free.color, fontFamily: 'var(--font-jost), sans-serif', width: 'fit-content' }}>Free</span>
                        <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '20px', color: '#2A2318', marginBottom: '8px', width: '100%' }}>{deck.title}</h3>
                        <p style={{ fontSize: '13px', fontWeight: 300, color: '#7A7060', lineHeight: 1.55, margin: 0, flex: 1, width: '100%' }}>{deck.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '16px', gap: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 300, color: '#7A7060' }}>{deck.cards.length} cards</span>
                          <span style={{ fontSize: '12px', fontWeight: 300, color: '#B5402A', flexShrink: 0 }}>Start →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          })()}
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', padding: '0 32px 64px', maxWidth: '960px', margin: '0 auto' }}>
        {decks.map((deck, i) => {
          const locked = !canAccessDeck(deck.id)
          return (
            <div key={deck.id} style={{ position: 'relative' }}>
              {locked ? (
                <div style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '16px', padding: '24px', opacity: 0.75 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 300, color: '#DDD8CA' }}>🔒</span>
                    <span style={{ fontSize: '11px', fontWeight: 300, color: '#DDD8CA', letterSpacing: '0.05em' }}>Locked</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '20px', color: '#7A7060', marginBottom: '6px' }}>
                    {tag === 'ear' ? deck.title.replace('Ear Training — ', '') : tag === 'symbols' ? deck.title : deck.title}
                  </h3>
                  <p style={{ fontSize: '12px', fontWeight: 300, color: '#DDD8CA', lineHeight: 1.6 }}>
                    {deck.cards.length} cards
                  </p>
                </div>
              ) : (
                <Link href={`/study/${deck.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
                    style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '16px', padding: '24px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(26,26,24,0.06)', transition: 'all 0.2s' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#B5402A'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 32px rgba(26,26,24,0.10)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#DDD8CA'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,26,24,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 300, color: '#B5402A', letterSpacing: '0.05em' }}>
                        {tag === 'ear' || tag === 'symbols' ? '' : `Level ${i + 1 === decks.length ? 'Advanced' : i + 1}`}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 300, color: '#7A7060' }}>{deck.cards.length} cards</span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '20px', color: '#2A2318', marginBottom: '6px' }}>
                      {tag === 'ear' ? deck.title.replace('Ear Training — ', '') : tag === 'symbols' ? deck.title : deck.title}
                    </h3>
                    <p style={{ fontSize: '12px', fontWeight: 300, color: '#7A7060', lineHeight: 1.6, marginBottom: '16px' }}>
                      {deck.description}
                    </p>
                    <span style={{ fontSize: '12px', fontWeight: 300, color: '#B5402A' }}>Start →</span>
                  </div>
                </Link>
              )}
            </div>
          )
        })}
      </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  )
}

export default function CollectionPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      </div>
    }>
      <CollectionContent />
    </Suspense>
  )
}
