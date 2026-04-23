'use client'

import Link from 'next/link'
import { DECKS } from '@/lib/decks'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function EarTrainingPage() {
  const decks = DECKS.filter(d => d.id.startsWith('ear-'))

  // Group decks by their `group` label (Intervals, Chords & Harmony, Scales).
  const groups: { label: string; decks: typeof decks }[] = []
  decks.forEach(deck => {
    const label = deck.group ?? 'Other'
    const existing = groups.find(g => g.label === label)
    if (existing) existing.decks.push(deck)
    else groups.push({ label, decks: [deck] })
  })

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ padding: '24px 32px 32px', maxWidth: '960px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 'clamp(28px, 4vw, 44px)',
            color: '#2A2318',
            marginBottom: '12px',
            letterSpacing: '0.02em',
          }}
        >
          Ear Training
        </h1>
        <p
          style={{
            fontFamily: F,
            fontSize: 'var(--nl-text-body)',
            fontWeight: 400,
            color: '#7A7060',
            maxWidth: '560px',
            lineHeight: 1.7,
            marginBottom: '32px',
          }}
        >
          Train your ear with real piano audio. Listen to intervals, triads, cadences, and scales — then identify what you heard. Go back and forth freely to compare examples.
        </p>
      </div>

      <div style={{ padding: '0 32px 64px', maxWidth: '960px', margin: '0 auto' }}>
        {groups.map(({ label, decks: groupDecks }) => (
          <div key={label} style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontFamily: F,
                fontSize: 'var(--nl-text-compact)',
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#7A7060',
                marginBottom: '16px',
              }}
            >
              {label}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px',
                alignItems: 'stretch',
              }}
            >
              {groupDecks.map(deck => (
                <Link
                  key={deck.id}
                  href={`/study/${deck.id}`}
                  style={{ textDecoration: 'none', display: 'flex', height: '100%' }}
                >
                  <div
                    className="nl-card-surface"
                    style={{
                      padding: '24px',
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        width: '100%',
                        marginBottom: '10px',
                      }}
                    >
                      <span style={{ fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060' }}>
                        {deck.cards.length} cards
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 500,
                        fontSize: '24px',
                        color: '#1A1A18',
                        marginBottom: '8px',
                        width: '100%',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {deck.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 'var(--nl-text-meta)',
                        fontWeight: 400,
                        color: '#7A7060',
                        lineHeight: 1.55,
                        margin: '0 0 14px',
                        flex: 1,
                        width: '100%',
                      }}
                    >
                      {deck.description}
                    </p>
                    <span
                      style={{
                        fontSize: 'var(--nl-text-compact)',
                        fontWeight: 500,
                        color: '#B5402A',
                        alignSelf: 'flex-end',
                      }}
                    >
                      Start →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
