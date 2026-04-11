'use client'

import { useRouter } from 'next/navigation'
import { SIGHT_READ_DECKS, SIGHT_READ_PRO_IDS } from '@/lib/sightReadDecks'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const BASS_LEVELS = SIGHT_READ_DECKS.filter(d => d.id.startsWith('sight-read-bass-') && d.id !== 'sight-read-bass-free')

export default function BassPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasSubscription } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()

  return (
    <div style={{ minHeight: '100vh', background: '#2C2A27' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 32px 80px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: '#9E9A92', padding: 0, marginBottom: '32px', display: 'block' }}>← Back</button>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, fontSize: '13px', color: '#9E9A92', marginBottom: '24px' }}>
          10 progressive levels — start with anchor notes and build down to the full chromatic range.
        </p>
        <div style={{ background: '#353330', border: '1px solid #484542', borderRadius: '16px', overflow: 'hidden' }}>
          {BASS_LEVELS.map((deck, i) => {
            const locked = !isPro
            return (
              <button key={deck.id} onClick={() => !locked && router.push('/study/' + deck.id)}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: i < BASS_LEVELS.length - 1 ? '1px solid #EDE8DF' : 'none', padding: '18px 24px', textAlign: 'left', cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '18px', color: '#F0EDE6', marginBottom: '2px' }}>{deck.title}</p>
                  <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, fontSize: '12px', color: '#9E9A92' }}>{deck.description}</p>
                </div>
                {locked
                  ? <span style={{ fontSize: '14px', color: '#484542' }}>🔒</span>
                  : <span style={{ fontSize: '13px', fontWeight: 300, color: '#484542' }}>→</span>
                }
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
