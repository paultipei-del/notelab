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
    <div className="nl-sight-read-clef-page">
      <div className="nl-sight-read-clef-page__inner">
        <button type="button" className="nl-sight-read-clef-page__back" onClick={() => router.back()}>
          ← Back
        </button>
        <p className="nl-sight-read-clef-page__blurb">
          Ten progressive levels — anchor notes through full chromatic range.
        </p>
        <div className="nl-sight-read-clef-page__scroll">
          <div className="nl-sight-read-clef-page__list">
            {BASS_LEVELS.map(deck => {
              const locked = !isPro
              return (
                <button
                  key={deck.id}
                  type="button"
                  className="nl-sight-read-clef-page__row"
                  disabled={locked}
                  onClick={() => router.push('/study/' + deck.id)}
                >
                  <div>
                    <p className="nl-sight-read-clef-page__rowTitle">{deck.title}</p>
                    <p className="nl-sight-read-clef-page__rowDesc">{deck.description}</p>
                  </div>
                  {locked ? (
                    <span style={{ fontSize: 'var(--nl-text-ui)', color: '#DDD8CA', flexShrink: 0 }} aria-hidden>
                      🔒
                    </span>
                  ) : (
                    <span style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#DDD8CA', flexShrink: 0 }} aria-hidden>
                      →
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
