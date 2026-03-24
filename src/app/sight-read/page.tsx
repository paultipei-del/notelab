'use client'

import { useRouter } from 'next/navigation'
import { SIGHT_READ_DECKS, SIGHT_READ_PRO_IDS } from '@/lib/sightReadDecks'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const FREE_DECKS = SIGHT_READ_DECKS.filter(d => !SIGHT_READ_PRO_IDS.includes(d.id))
const TREBLE_LEVELS = SIGHT_READ_DECKS.filter(d => SIGHT_READ_PRO_IDS.includes(d.id))

const PRO_COLLECTIONS = [
  { id: 'treble', label: 'Treble Clef', description: '10 progressive levels — C4 through full chromatic range', available: true },
  { id: 'bass', label: 'Bass Clef', description: 'Progressive bass staff training', available: true },
  { id: 'grand', label: 'Grand Staff', description: 'Combined treble and bass reading', available: false },
  { id: 'custom', label: 'Build Your Own', description: 'Create custom note sets', available: false },
]

export default function SightReadPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasSubscription } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #D3D1C7' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '22px', color: '#1A1A18', letterSpacing: '0.02em' }}>Sight Read</h1>
        <div style={{ width: '60px' }} />
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 32px 80px' }}>

        {/* Free */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888780', marginBottom: '16px' }}>Free</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FREE_DECKS.map(deck => (
              <button key={deck.id} onClick={() => router.push('/study/' + deck.id)}
                style={{ width: '100%', background: 'white', border: '1px solid #D3D1C7', borderRadius: '12px', padding: '20px 24px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '4px' }}>{deck.title}</p>
                  <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, fontSize: '13px', color: '#888780' }}>{deck.description}</p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 300, color: '#D3D1C7' }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pro */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888780' }}>Pro</p>
            {!isPro && (
              <button onClick={() => router.push('/#pro')}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.06em', cursor: 'pointer' }}>
                Unlock Pro
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PRO_COLLECTIONS.map(col => {
              const locked = !isPro
              const comingSoon = !col.available
              return (
                <button key={col.id}
                  onClick={() => {
                    if (locked || comingSoon) return
                    if (col.id === 'treble') router.push('/sight-read/treble')
                    if (col.id === 'bass') router.push('/sight-read/bass')
                  }}
                  style={{ width: '100%', background: 'white', border: '1px solid #D3D1C7', borderRadius: '12px', padding: '20px 24px', textAlign: 'left', cursor: locked || comingSoon ? 'default' : 'pointer', opacity: locked ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '4px' }}>{col.label}</p>
                    <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, fontSize: '13px', color: '#888780' }}>{col.description}</p>
                  </div>
                  {comingSoon
                    ? <span style={{ fontSize: '11px', fontWeight: 300, color: '#D3D1C7', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Soon</span>
                    : locked
                    ? <span style={{ fontSize: '14px', color: '#D3D1C7' }}>🔒</span>
                    : <span style={{ fontSize: '13px', fontWeight: 300, color: '#D3D1C7' }}>→</span>
                  }
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
