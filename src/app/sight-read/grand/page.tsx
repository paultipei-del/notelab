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
    <div className="nl-sight-read-clef-page">
      <div className="nl-sight-read-clef-page__inner">
        <button type="button" className="nl-sight-read-clef-page__back" onClick={() => router.back()}>
          ← Back
        </button>
        <p className="nl-sight-read-clef-page__blurb">
          Ten progressive levels — treble and bass together through full chromatic range.
        </p>
        <div className="nl-sight-read-clef-page__scroll">
          <div className="nl-sight-read-clef-page__list">
            {GRAND_LEVELS.map(deck => {
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
                    <span style={{ fontSize: 'var(--nl-text-ui)', color: '#D9CFAE', flexShrink: 0 }} aria-hidden>
                      🔒
                    </span>
                  ) : (
                    <span style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#D9CFAE', flexShrink: 0 }} aria-hidden>
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
