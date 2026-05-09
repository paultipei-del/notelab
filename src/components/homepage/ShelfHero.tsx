'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Book from '@/components/flashcards/library/Book'
import WoodPlank from '@/components/flashcards/library/WoodPlank'
import type { HomepageContext } from './useHomepageState'
import { dayPartLabel } from './dayPartLabel'

const HERO_BOOK_LIMIT = 7

export interface ShelfHeroProps {
  ctx: HomepageContext
  displayName: string
}

/**
 * Desktop State 3 hero: greeting on the left, bookshelf with a museum
 * placard on the right pinned to the featured (most-recently-touched)
 * book. Book + WoodPlank reused from /flashcards so the visual reads as
 * a continuation of the library aesthetic.
 *
 * The placard is inlined rather than reusing /flashcards' MuseumPlacard
 * because the hero placard has different content (Currently-reading
 * eyebrow, "% through" meta) and static positioning — the bookshelf
 * placard's anchor-tracking and "Volume · " prefix don't apply here.
 */
export default function ShelfHero({ ctx, displayName }: ShelfHeroProps) {
  const { featured, activeDecks, totalDue, estMinutes } = ctx
  const eyebrow = dayPartLabel()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const firstBookRef = useRef<HTMLDivElement | null>(null)
  const [placardLeft, setPlacardLeft] = useState<number>(110)

  // Anchor placard horizontally based on the first book's center so the
  // placard tracks any spacing/padding changes (don't hardcode 110).
  useEffect(() => {
    const update = () => {
      const c = containerRef.current
      const b = firstBookRef.current
      if (!c || !b) return
      const cr = c.getBoundingClientRect()
      const br = b.getBoundingClientRect()
      setPlacardLeft(br.left - cr.left + br.width + 24)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [activeDecks.length])

  const heroBooks = activeDecks.slice(0, HERO_BOOK_LIMIT)
  if (!featured) return null

  const featuredHref = `/study/${featured.deck.id}`
  const pct = Math.round(featured.summary.pctMastered * 100)
  const dueCount = featured.summary.dueCount
  const totalDueLabel =
    totalDue === 1 ? '1 card is due' : `${totalDue} cards are due`
  const minutesLabel = estMinutes === 1 ? '1 minute' : `${estMinutes} minutes`

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr minmax(420px, 1fr)',
        gap: 56,
        alignItems: 'flex-start',
        padding: '56px 36px 32px',
        maxWidth: 1240,
        margin: '0 auto',
      }}
    >
      {/* Left — greeting & CTAs */}
      <div style={{ minWidth: 0, paddingTop: 24 }}>
        <div
          style={{
            fontFamily: 'var(--font-jost), system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#a0381c',
            marginBottom: 14,
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 48,
            fontWeight: 500,
            lineHeight: 1,
            color: '#1a1208',
            letterSpacing: '-0.02em',
            margin: '0 0 18px 0',
          }}
        >
          Welcome back,<br />
          <em
            style={{ color: '#a0381c', fontStyle: 'italic', fontWeight: 500 }}
          >
            {displayName}.
          </em>
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 17,
            lineHeight: 1.5,
            color: '#5a4028',
            maxWidth: 460,
            margin: '0 0 24px 0',
          }}
        >
          You&rsquo;re partway through{' '}
          <strong style={{ fontWeight: 600, color: '#1a1208' }}>
            {featured.deck.title}
          </strong>
          .{' '}
          {totalDue > 0 ? (
            <>
              {totalDueLabel} &mdash; about {minutesLabel} if you keep your
              pace.
            </>
          ) : (
            <>You&rsquo;re caught up &mdash; come back when more cards are ready.</>
          )}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Link
            href={featuredHref}
            style={{
              display: 'inline-block',
              padding: '12px 22px',
              borderRadius: 6,
              background: '#1a1208',
              color: '#f0e7d0',
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            Continue reading →
          </Link>
          <Link
            href="/flashcards"
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontStyle: 'italic',
              fontSize: 15,
              color: '#a0381c',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(160, 56, 28, 0.3)',
              paddingBottom: 1,
            }}
          >
            Browse the library
          </Link>
        </div>
      </div>

      {/* Right — bookshelf with placard */}
      <div
        ref={containerRef}
        style={{ position: 'relative', paddingTop: 100, minWidth: 0 }}
      >
        <HeroPlacard
          left={placardLeft}
          eyebrow={`Currently reading · ${featured.deck.category ?? 'Library'}`}
          title={featured.deck.title}
          dueCount={dueCount}
          pct={pct}
        />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'flex-end',
            gap: 1,
            paddingLeft: 8,
          }}
        >
          {heroBooks.map((d, i) => (
            <Book
              key={d.deck.id}
              ref={i === 0 ? firstBookRef : undefined}
              {...d.book}
              isHovered={false}
              onHoverStart={() => {}}
              onHoverEnd={() => {}}
            />
          ))}
        </div>
        <div style={{ width: '100%' }}>
          <WoodPlank />
        </div>
      </div>
    </section>
  )
}

interface HeroPlacardProps {
  left: number
  eyebrow: string
  title: string
  dueCount: number
  pct: number
}

function HeroPlacard({
  left,
  eyebrow,
  title,
  dueCount,
  pct,
}: HeroPlacardProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: 0,
        width: 280,
        background: 'rgba(251, 246, 230, 0.98)',
        color: '#1a1208',
        padding: '12px 16px 14px',
        borderRadius: 3,
        border: '1px solid rgba(160, 56, 28, 0.25)',
        boxShadow:
          '0 12px 32px rgba(40, 20, 8, 0.18), 0 2px 8px rgba(40, 20, 8, 0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 5,
          border: '1px solid rgba(160, 56, 28, 0.15)',
          borderRadius: 2,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          fontFamily: 'var(--font-jost), system-ui, sans-serif',
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#a0381c',
          marginBottom: 6,
          fontWeight: 700,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
          fontSize: 19,
          fontWeight: 400,
          lineHeight: 1.25,
          letterSpacing: '-0.005em',
          color: '#1a1208',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif',
          fontStyle: 'italic',
          fontSize: 14,
          color: '#5a4028',
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#c83a2a',
            display: 'inline-block',
          }}
        />
        {dueCount > 0 ? `${dueCount} cards due · ${pct}% through` : `${pct}% through`}
      </div>
    </div>
  )
}
