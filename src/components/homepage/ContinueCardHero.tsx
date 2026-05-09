'use client'

import Link from 'next/link'
import MiniSpine from '@/components/flashcards/library/MiniSpine'
import { useBookBinding } from '@/components/flashcards/library/bookBindings'
import type { HomepageContext } from './useHomepageState'
import { dayPartLabel } from './dayPartLabel'

export interface ContinueCardHeroProps {
  ctx: HomepageContext
  displayName: string
}

/**
 * Mobile State 3 hero (Option A): greeting block + single Continue card
 * containing the featured book's spine on the left and title/meta/
 * progress/CTA on the right. No CTAs in the hero text — the Continue
 * button lives inside the card.
 */
export default function ContinueCardHero({
  ctx,
  displayName,
}: ContinueCardHeroProps) {
  const { featured, totalDue, estMinutes } = ctx
  if (!featured) return null

  const eyebrow = dayPartLabel()
  const pct = Math.round(featured.summary.pctMastered * 100)
  const dueCount = featured.summary.dueCount
  const totalDueLabel =
    totalDue === 1 ? '1 card due' : `${totalDue} cards due`
  const minutesLabel = estMinutes === 1 ? '1 minute' : `${estMinutes} minutes`
  const featuredHref = `/study/${featured.deck.id}`

  return (
    <section style={{ padding: '28px 0 24px' }}>
      {/* Greeting block */}
      <div style={{ padding: '0 20px' }}>
        <div
          style={{
            fontFamily: 'var(--font-jost), system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#a0381c',
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 36,
            fontWeight: 500,
            lineHeight: 1,
            color: '#1a1208',
            letterSpacing: '-0.02em',
            margin: '0 0 14px 0',
          }}
        >
          Welcome back,{' '}
          <em
            style={{ color: '#a0381c', fontStyle: 'italic', fontWeight: 500 }}
          >
            {displayName}.
          </em>
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 15,
            lineHeight: 1.45,
            color: '#5a4028',
            margin: '0 0 20px 0',
          }}
        >
          You&rsquo;re partway through{' '}
          <strong style={{ fontWeight: 600, color: '#1a1208' }}>
            {featured.deck.title}
          </strong>
          .{' '}
          {totalDue > 0 ? (
            <>
              {totalDueLabel} &mdash; about {minutesLabel}.
            </>
          ) : (
            <>You&rsquo;re caught up &mdash; come back when more cards are ready.</>
          )}
        </p>
      </div>

      {/* Continue card */}
      <ContinueCard
        title={featured.deck.title}
        category={featured.deck.category ?? 'Library'}
        pct={pct}
        dueCount={dueCount}
        href={featuredHref}
      />
    </section>
  )
}

interface ContinueCardProps {
  title: string
  category: string
  pct: number
  dueCount: number
  href: string
}

function ContinueCard({
  title,
  category,
  pct,
  dueCount,
  href,
}: ContinueCardProps) {
  const binding = useBookBinding(title)

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        gap: 18,
        alignItems: 'stretch',
        margin: '0 20px',
        padding: 22,
        background: 'rgba(255, 250, 238, 0.7)',
        border: '1px solid rgba(139, 105, 20, 0.25)',
        borderLeft: `4px solid ${binding.stripe}`,
        borderRadius: 4,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', flexShrink: 0 }}>
        <MiniSpine title={title} width={32} height={130} />
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-jost), system-ui, sans-serif',
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#a0381c',
            fontWeight: 700,
          }}
        >
          Currently reading
        </div>
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 22,
            fontWeight: 500,
            color: '#1a1208',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontStyle: 'italic',
            fontSize: 13,
            color: '#5a4028',
          }}
        >
          {category} · {pct}% through
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 4,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              height: 3,
              background: 'rgba(139, 105, 20, 0.15)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, pct))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #c9a449 0%, #d4af37 100%)',
              }}
            />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontStyle: 'italic',
              fontSize: 12,
              color: '#a0381c',
              flex: '0 0 auto',
            }}
          >
            {dueCount > 0 ? `${dueCount} due` : 'caught up'}
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            padding: '11px 16px',
            marginTop: 6,
            borderRadius: 6,
            background: '#1a1208',
            color: '#f0e7d0',
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 13,
            minHeight: 44,
            alignItems: 'center',
          }}
        >
          Continue →
        </div>
      </div>
    </Link>
  )
}
