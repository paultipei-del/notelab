'use client'

import { useRouter } from 'next/navigation'
import { GRAND_STAFF_DECKS, GRAND_STAFF_PRO_IDS } from '@/lib/grandStaffDecks'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const GRAND_LEVELS = GRAND_STAFF_DECKS.filter(d => GRAND_STAFF_PRO_IDS.includes(d.id))

export default function GrandPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasSubscription } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 32px 80px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#7A7060', padding: 0, marginBottom: '32px', display: 'block' }}>← Back</button>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, fontSize: '13px', color: '#7A7060', marginBottom: '24px' }}>
          10 progressive levels — read notes across both treble and bass staves simultaneously.
        </p>
        <div style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '16px', overflow: 'hidden' }}>
          {GRAND_LEVELS.map((deck, i) => {
            const locked = !isPro
            return (
              <button key={deck.id} onClick={() => !locked && router.push('/study/' + deck.id)}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: i < GRAND_LEVELS.length - 1 ? '1px solid #EDE8DF' : 'none', padding: '18px 24px', textAlign: 'left', cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '18px', color: '#2A2318', marginBottom: '2px' }}>{deck.title}</p>
                  <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, fontSize: '12px', color: '#7A7060' }}>{deck.description}</p>
                </div>
                {locked ? <span style={{ fontSize: '14px', color: '#DDD8CA' }}>🔒</span> : <span style={{ fontSize: '13px', color: '#DDD8CA' }}>→</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
