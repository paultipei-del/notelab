'use client'

import Link from 'next/link'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export type HomeCategoryHubProps = {
  earTopicCount: number
  cmLevelCount: number
}

export default function HomeCategoryHub({ earTopicCount, cmLevelCount }: HomeCategoryHubProps) {
  const tiles = [
    {
      href: '/flashcards',
      title: 'Flashcards',
      subtitle: 'Spaced repetition collections — terms, symbols, and paths into ear training.',
      chips: ['Notation & terms', 'Music symbols', 'Ear library'],
      dark: false as const,
    },
    {
      href: '/collection?tag=ear',
      title: 'Ear Training',
      subtitle: `${earTopicCount} piano-audio topics — listen, then name what you heard.`,
      chips: ['Intervals', 'Triads & sevenths', 'Cadences', 'Scales'],
      dark: false as const,
    },
    {
      href: '/tools',
      title: 'Tools',
      subtitle: 'Interactive drills — staff, keys, scales, glossary, and repertoire lists.',
      chips: ['Sight-reading', 'Note ID', 'Key signatures', 'Glossary'],
      dark: false as const,
    },
    {
      href: '/programs',
      title: 'Programs',
      subtitle: `${cmLevelCount} CM levels — structured theory, history, and ear prep through Advanced.`,
      chips: ['Prep → Advanced', 'Signs & terms', 'Scales & chords', 'History & listening'],
      dark: true as const,
    },
  ] as const

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: '14px',
        marginBottom: '48px',
      }}
    >
      {tiles.map(tile => (
        <Link
          key={tile.href}
          href={tile.href}
          className="nl-home-category-tile"
          style={{ textDecoration: 'none', display: 'block', borderRadius: '20px', minHeight: '200px' }}
        >
          <div
            style={{
              height: '100%',
              boxSizing: 'border-box' as const,
              borderRadius: '20px',
              padding: '28px 24px 24px',
              border: tile.dark ? '1px solid #1A1A18' : '1px solid #D3D1C7',
              background: tile.dark ? '#1A1A18' : 'white',
              boxShadow: tile.dark ? '0 8px 32px rgba(26,26,24,0.18)' : '0 2px 16px rgba(26,26,24,0.06)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'flex-start' as const,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = tile.dark
                ? '0 12px 40px rgba(26,26,24,0.28)'
                : '0 8px 28px rgba(26,26,24,0.12)'
              if (!tile.dark) e.currentTarget.style.borderColor = '#BA7517'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = tile.dark
                ? '0 8px 32px rgba(26,26,24,0.18)'
                : '0 2px 16px rgba(26,26,24,0.06)'
              if (!tile.dark) e.currentTarget.style.borderColor = '#D3D1C7'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontFamily: F,
                fontSize: '10px',
                fontWeight: 400,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                padding: '4px 10px',
                borderRadius: '20px',
                marginBottom: '14px',
                background: tile.dark ? '#BA7517' : '#EDE8DF',
                color: tile.dark ? 'white' : '#888780',
              }}
            >
              Open
            </span>
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: 'clamp(22px, 2.5vw, 26px)',
                color: tile.dark ? 'white' : '#1A1A18',
                margin: '0 0 10px',
                letterSpacing: '0.02em',
              }}
            >
              {tile.title}
            </h2>
            <p
              style={{
                fontFamily: F,
                fontSize: '14px',
                fontWeight: 300,
                lineHeight: 1.55,
                color: tile.dark ? 'rgba(255,255,255,0.65)' : '#888780',
                margin: '0 0 16px',
                flex: 1,
              }}
            >
              {tile.subtitle}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px', width: '100%' }}>
              {tile.chips.map(chip => (
                <span
                  key={chip}
                  style={{
                    fontFamily: F,
                    fontSize: '11px',
                    fontWeight: 400,
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: tile.dark ? 'rgba(255,255,255,0.08)' : '#F5F2EC',
                    color: tile.dark ? 'rgba(255,255,255,0.85)' : '#666860',
                    border: tile.dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #EDE8DF',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
            <span
              style={{
                fontFamily: F,
                fontSize: '13px',
                fontWeight: 300,
                color: '#BA7517',
                marginTop: '18px',
              }}
            >
              Continue →
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
