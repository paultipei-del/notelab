'use client'

import Link from 'next/link'
import { DECKS, CM_BUNDLE_PRICE_ID } from '@/lib/decks'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const cmDecks = DECKS.filter(d => d.tag === 'cm')

function getLevelLabel(id: string): string {
  if (id === 'cm-prep') return 'Preparatory'
  if (id === 'cm-advanced') return 'Advanced'
  const m = id.match(/cm-level(\d+)/)
  return m ? `Level ${m[1]}` : id
}

export default function CMProgramPage() {
  const { user } = useAuth()
  const { hasPurchased, hasSubscription } = usePurchases(user?.id ?? null)

  const unlocked = hasSubscription() || hasPurchased(CM_BUNDLE_PRICE_ID)

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/programs" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.04em' }}>
              ← Programs
            </span>
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '12px' }}>
            Certificate of Merit · California
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>
            CM Theory Prep
          </h1>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#7A7060', maxWidth: '520px', lineHeight: 1.7, marginBottom: '0' }}>
            Complete flashcard collections for every CM level — Preparatory through Advanced. Covers signs & terms, scales, intervals, chords, history, and ear training.
          </p>
        </div>

        {/* Unlock banner */}
        {!unlocked && (
          <div style={{
            background: '#1A1A18', borderRadius: '16px', padding: '24px 28px',
            marginBottom: '36px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' as const,
          }}>
            <div>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: 'white', marginBottom: '4px' }}>
                Unlock all {cmDecks.length} levels
              </p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                One-time purchase — study every level without limits
              </p>
            </div>
            <Link href="/account" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span style={{
                display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400,
                color: '#2A2318', background: '#B5402A', borderRadius: '20px',
                padding: '10px 24px', letterSpacing: '0.02em',
              }}>
                Purchase program →
              </span>
            </Link>
          </div>
        )}

        {/* Level grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {cmDecks.map((deck) => {
            const label = getLevelLabel(deck.id)
            const isPrep = deck.id === 'cm-prep'
            const locked = !unlocked && !isPrep

            if (locked) {
              return (
                <div
                  key={deck.id}
                  style={{
                    background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px',
                    padding: '20px', opacity: 0.6, cursor: 'default',
                    display: 'flex', flexDirection: 'column' as const,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#C8C4BA' }}>{deck.cards.length} cards</span>
                    <span style={{ fontSize: 'var(--nl-text-compact)', color: '#C8C4BA' }}>🔒</span>
                  </div>
                  <p style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '17px', color: '#B0ACA4', marginBottom: '0', lineHeight: 1.2 }}>{label}</p>
                </div>
              )
            }

            return (
              <Link key={deck.id} href={`/study/${deck.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px',
                    padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column' as const, height: '100%',
                    boxSizing: 'border-box' as const,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#B5402A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD8CA'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060' }}>{deck.cards.length} cards</span>
                  </div>
                  <p style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '17px', color: '#2A2318', marginBottom: '0', lineHeight: 1.2 }}>{label}</p>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}
