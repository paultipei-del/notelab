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
      label: 'Notation & Terms',
      title: 'Flashcards',
      subtitle: 'Spaced repetition for music symbols, signs, and notation. Study at your own pace and build lasting recall.',
      cta: 'Start studying',
      flip: false,
      cardBg: 'white',
      textColor: '#1A1A18',
      subtitleColor: '#7A7060',
      labelBg: '#EDE8DF',
      labelColor: '#7A7060',
      ctaColor: '#B5402A',
      ctaBg: 'rgba(186,117,23,0.08)',
      ctaBorder: 'rgba(186,117,23,0.2)',
      gradient: 'linear-gradient(145deg, #F2E2B8 0%, #D4A850 45%, #A07428 100%)',
      symbol: '♩',
      symbolColor: 'rgba(255,255,255,0.18)',
    },
    {
      href: '/collection?tag=ear',
      label: `${earTopicCount} Topics`,
      title: 'Ear Training',
      subtitle: 'Listen to piano audio examples and identify intervals, triads, cadences, and scales by ear.',
      cta: 'Train your ear',
      flip: true,
      cardBg: '#FDFAF5',
      textColor: '#1A1A18',
      subtitleColor: '#7A7060',
      labelBg: '#EDE8DF',
      labelColor: '#7A7060',
      ctaColor: '#B5402A',
      ctaBg: 'rgba(186,117,23,0.08)',
      ctaBorder: 'rgba(186,117,23,0.2)',
      gradient: 'linear-gradient(145deg, #3A2210 0%, #7A4820 45%, #B87840 100%)',
      symbol: '♫',
      symbolColor: 'rgba(255,255,255,0.15)',
    },
    {
      href: '/tools',
      label: 'Interactive',
      title: 'Tools',
      subtitle: 'Staff reading drills, note identification, key signature charts, scale explorer, and repertoire lists.',
      cta: 'Open tools',
      flip: false,
      cardBg: 'white',
      textColor: '#1A1A18',
      subtitleColor: '#7A7060',
      labelBg: '#EDE8DF',
      labelColor: '#7A7060',
      ctaColor: '#B5402A',
      ctaBg: 'rgba(186,117,23,0.08)',
      ctaBorder: 'rgba(186,117,23,0.2)',
      gradient: 'linear-gradient(145deg, #D8D2C4 0%, #A8A090 45%, #787068 100%)',
      symbol: '♬',
      symbolColor: 'rgba(255,255,255,0.18)',
    },
    {
      href: '/programs',
      label: `${cmLevelCount} Levels`,
      title: 'Programs',
      subtitle: 'Curriculum-aligned theory prep — Certificate of Merit and college first-year coursework, structured level by level.',
      cta: 'View programs',
      flip: true,
      cardBg: '#1A1A18',
      textColor: 'white',
      subtitleColor: 'rgba(255,255,255,0.48)',
      labelBg: 'rgba(186,117,23,0.2)',
      labelColor: '#E8A84A',
      ctaColor: '#E8A84A',
      ctaBg: 'rgba(186,117,23,0.15)',
      ctaBorder: 'rgba(186,117,23,0.3)',
      gradient: 'linear-gradient(145deg, #0A0A08 0%, #1E1A10 50%, #2E2618 100%)',
      symbol: 'CM',
      symbolColor: 'rgba(186,117,23,0.14)',
    },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '48px' }}>
      {tiles.map(tile => (
        <Link
          key={tile.href}
          href={tile.href}
          className="nl-home-category-tile"
          style={{ textDecoration: 'none', display: 'block', borderRadius: '20px' }}
        >
          <div
            className={`nl-cat-tile-inner${tile.flip ? ' nl-cat-flip' : ''}`}
            style={{
              background: tile.cardBg,
              border: tile.cardBg === '#1A1A18' ? '1px solid #2E2E2C' : '1px solid #DDD8CA',
              boxShadow: tile.cardBg === '#1A1A18'
                ? '0 4px 20px rgba(0,0,0,0.35), 0 16px 44px rgba(0,0,0,0.22)'
                : '0 1px 0 rgba(255,255,255,0.65) inset, 0 2px 8px rgba(26,26,24,0.05), 0 12px 32px rgba(26,26,24,0.08)',
              transition: 'transform 0.24s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.24s cubic-bezier(0.33, 1, 0.68, 1), border-color 0.2s ease',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.transform = 'translateY(-7px) scale(1.01)'
              el.style.boxShadow = tile.cardBg === '#1A1A18'
                ? '0 12px 32px rgba(0,0,0,0.45), 0 32px 80px rgba(186,117,23,0.16)'
                : '0 1px 0 rgba(255,255,255,0.92) inset, 0 8px 18px rgba(26,26,24,0.08), 0 22px 52px rgba(26,26,24,0.14), 0 40px 80px rgba(186,117,23,0.1)'
              if (tile.cardBg !== '#1A1A18') el.style.borderColor = '#B5402A'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.transform = 'translateY(0) scale(1)'
              el.style.boxShadow = tile.cardBg === '#1A1A18'
                ? '0 4px 20px rgba(0,0,0,0.35), 0 16px 44px rgba(0,0,0,0.22)'
                : '0 1px 0 rgba(255,255,255,0.65) inset, 0 2px 8px rgba(26,26,24,0.05), 0 12px 32px rgba(26,26,24,0.08)'
              if (tile.cardBg !== '#1A1A18') el.style.borderColor = '#DDD8CA'
            }}
          >
            {/* Text side */}
            <div style={{
              flex: 1,
              padding: '36px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '0',
            }}>
              <span style={{
                display: 'inline-block',
                fontFamily: F,
                fontSize: 'var(--nl-text-badge)',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                padding: '4px 10px',
                borderRadius: '20px',
                marginBottom: '14px',
                background: tile.labelBg,
                color: tile.labelColor,
                width: 'fit-content',
              }}>
                {tile.label}
              </span>

              <h2 style={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: 'clamp(30px, 3.2vw, 42px)',
                color: tile.textColor,
                margin: '0 0 12px',
                letterSpacing: '0.01em',
                lineHeight: 1.05,
              }}>
                {tile.title}
              </h2>

              <p style={{
                fontFamily: F,
                fontSize: 'var(--nl-text-body)',
                fontWeight: 400,
                lineHeight: 1.65,
                color: tile.subtitleColor,
                margin: '0 0 24px',
                maxWidth: '380px',
              }}>
                {tile.subtitle}
              </p>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: F,
                fontSize: 'var(--nl-text-meta)',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: tile.ctaColor,
                padding: '7px 16px',
                borderRadius: '20px',
                background: tile.ctaBg,
                border: `1px solid ${tile.ctaBorder}`,
                width: 'fit-content',
              }}>
                {tile.cta} →
              </span>
            </div>

            {/* Gradient / image side */}
            <div
              className="nl-cat-tile-gradient"
              style={{
                background: tile.gradient,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Decorative watermark */}
              <span
                aria-hidden="true"
                style={{
                  fontFamily: tile.symbol === 'CM' ? SERIF : 'inherit',
                  fontSize: tile.symbol === 'CM' ? '140px' : '160px',
                  fontWeight: tile.symbol === 'CM' ? 300 : 400,
                  color: tile.symbolColor,
                  lineHeight: 1,
                  userSelect: 'none',
                  pointerEvents: 'none',
                  letterSpacing: tile.symbol === 'CM' ? '-0.04em' : '0',
                }}
              >
                {tile.symbol}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
