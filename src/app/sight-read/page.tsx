'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SIGHT_READ_DECKS, SIGHT_READ_PRO_IDS } from '@/lib/sightReadDecks'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const FREE_IDS = ['sight-read-treble-free', 'sight-read-bass-free']
const TREBLE_LEVELS = SIGHT_READ_DECKS.filter(d => d.id.startsWith('sight-read-treble-') && d.id !== 'sight-read-treble-free')
const FREE_DECKS = SIGHT_READ_DECKS.filter(d => FREE_IDS.includes(d.id))

export default function SightReadPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasSubscription } = usePurchases(user?.id ?? null)

  function go(deckId: string) {
    router.push('/study/' + deckId)
  }

  const btnStyle = (locked: boolean) => ({
    width: '100%',
    background: locked ? '#F5F2EC' : 'white',
    border: '1px solid #D3D1C7',
    borderRadius: '12px',
    padding: '20px 24px',
    textAlign: 'left' as const,
    cursor: locked ? 'default' : 'pointer',
    transition: 'all 0.15s',
    opacity: locked ? 0.6 : 1,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #D3D1C7' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '22px', color: '#1A1A18', letterSpacing: '0.02em' }}>Sight Read</h1>
        <div style={{ width: '60px' }} />
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* Free decks */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888780', marginBottom: '16px' }}>Free</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FREE_DECKS.map(deck => (
              <button key={deck.id} onClick={() => go(deck.id)} style={btnStyle(false)}>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '4px' }}>{deck.title}</p>
                <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, fontSize: '13px', color: '#888780' }}>{deck.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Pro — Treble Levels */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888780' }}>Treble Clef — Levels</p>
            {!hasSubscription() && (
              <button onClick={() => router.push('/#pro')} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.06em', cursor: 'pointer' }}>
                Unlock Pro
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TREBLE_LEVELS.map(deck => {
              const locked = !hasSubscription()
              return (
                <button key={deck.id} onClick={() => !locked && go(deck.id)} style={btnStyle(locked)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '4px' }}>{deck.title}</p>
                      <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, fontSize: '13px', color: '#888780' }}>{deck.description}</p>
                    </div>
                    {locked && <span style={{ fontSize: '16px', color: '#D3D1C7' }}>🔒</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
