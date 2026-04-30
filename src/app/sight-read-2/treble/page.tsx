'use client'

import { useRouter } from 'next/navigation'
import { SIGHT_READ_DECKS, SIGHT_READ_PRO_IDS } from '@/lib/sightReadDecks'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const TREBLE_LEVELS = SIGHT_READ_DECKS.filter(d => SIGHT_READ_PRO_IDS.includes(d.id))

export default function TreblePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasSubscription } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 32px 80px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', padding: 0, marginBottom: '32px', display: 'block' }}>← Back</button>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 400, fontSize: 'var(--nl-text-meta)', color: '#7A7060', marginBottom: '24px' }}>
          10 progressive levels — start with anchor notes and build up to the full chromatic range.
        </p>
        <div style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '16px', overflow: 'hidden' }}>
          {TREBLE_LEVELS.map((deck, i) => {
            const locked = !isPro
            return (
              <button key={deck.id} onClick={() => !locked && router.push('/study/' + deck.id)}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: i < TREBLE_LEVELS.length - 1 ? '1px solid #EDE8DF' : 'none', padding: '18px 24px', textAlign: 'left', cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '18px', color: '#2A2318', marginBottom: '2px' }}>{deck.title}</p>
                  <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 400, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>{deck.description}</p>
                </div>
                {locked
                  ? <span style={{ fontSize: 'var(--nl-text-ui)', color: '#DDD8CA' }}>🔒</span>
                  : <span style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#DDD8CA' }}>→</span>
                }
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
