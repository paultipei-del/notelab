'use client'

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DECKS } from '@/lib/decks'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import {
  getLevelBySlug,
  bundleForTier,
  TIER_LABEL,
  type CMLevel,
} from '@/lib/cmProgram'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

interface Props {
  params: Promise<{ levelSlug: string }>
}

function featureKeyFor(level: CMLevel): 'program:cm:level_1' | 'program:cm:level_2' | 'program:cm:level_3_plus' {
  if (level.slug === 'preparatory' || level.slug === 'level-1') return 'program:cm:level_1'
  if (level.slug === 'level-2') return 'program:cm:level_2'
  return 'program:cm:level_3_plus'
}

export default function CMLevelPage({ params }: Props) {
  const { levelSlug } = use(params)
  const level = getLevelBySlug(levelSlug)
  if (!level) notFound()

  const access = useFeatureAccess(featureKeyFor(level))
  const deck = DECKS.find(d => d.id === level.deckId)
  const cardCount = deck?.cards.length ?? 0
  const estimatedHours = Math.max(1, Math.round(cardCount / 20))
  const sampleCard = deck?.cards[0]

  // "Free tier" here is the same shape as on the index: Preparatory, L1,
  // L2 are always free. Anything else requires Plus or a per-level/bundle
  // purchase.
  const freeTier = level.slug === 'preparatory' || level.slug === 'level-1' || level.slug === 'level-2'
  const canStudy = freeTier || access.hasAccess
  const bundle = bundleForTier(level.tier)

  const checkoutLevelHref = `/checkout?item=${encodeURIComponent(`CM ${level.label}`)}&price=${level.price}`
  const checkoutBundleHref = bundle
    ? `/checkout?item=${encodeURIComponent(bundle.title)}&price=${bundle.price}`
    : '/pricing'
  const startHref = level.slug === 'level-1' ? '/programs/cm/l1' : `/study/${level.deckId}`

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 32px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/programs/cm" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#7A7060', letterSpacing: '0.04em' }}>
              ← CM Program
            </span>
          </Link>
        </div>

        {/* Header row: title on the left, commerce/start panel on the right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '40px',
            alignItems: 'start',
            marginBottom: '48px',
          }}
        >
          <div>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 10px 0' }}>
              {TIER_LABEL[level.tier]}
            </p>
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(36px, 5vw, 56px)', color: '#2A2318', letterSpacing: '-0.015em', margin: '0 0 14px 0' }}>
              {level.label}
            </h1>
            <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 400, color: '#4A4540', lineHeight: 1.7, margin: 0, maxWidth: '540px' }}>
              {level.whoFor}
            </p>
          </div>

          {/* Commerce / Start panel */}
          <div
            style={{
              background: '#FDFAF3',
              border: '1px solid #DDD8CA',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            {canStudy ? (
              <>
                <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: freeTier ? '#7A7060' : '#3B6D11', margin: '0 0 10px 0' }}>
                  {freeTier ? 'Included free' : '✓ Included in your plan'}
                </p>
                <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#4A4540', lineHeight: 1.6, margin: '0 0 18px 0' }}>
                  {cardCount} cards ready to study.
                </p>
                <Link
                  href={startHref}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#1A1A18',
                    color: 'white',
                    textDecoration: 'none',
                    fontFamily: F,
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Start studying →
                </Link>
              </>
            ) : (
              <>
                <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A7060', margin: '0 0 10px 0' }}>
                  Buy this level
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '40px', color: '#2A2318', letterSpacing: '-0.015em' }}>
                    ${level.price}
                  </span>
                  <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#7A7060' }}>lifetime access</span>
                </div>
                <Link
                  href={checkoutLevelHref}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#1A1A18',
                    color: 'white',
                    textDecoration: 'none',
                    fontFamily: F,
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '12px',
                  }}
                >
                  Buy this level
                </Link>
                {bundle && (
                  <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#4A4540', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                    Or get it in the{' '}
                    <Link href={checkoutBundleHref} style={{ color: ACCENT, textDecoration: 'none', fontWeight: 400 }}>
                      {bundle.title} for ${bundle.price} →
                    </Link>
                  </p>
                )}
                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#7A7060', margin: 0, lineHeight: 1.5 }}>
                  Or free with{' '}
                  <Link href="/pricing" style={{ color: ACCENT, textDecoration: 'none', fontWeight: 400 }}>
                    NoteLab Plus →
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Scope strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            padding: '14px 20px',
            background: '#FDFAF3',
            border: '1px solid #DDD8CA',
            borderRadius: '12px',
            marginBottom: '48px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#2A2318' }}>
            <strong style={{ fontWeight: 500 }}>{cardCount}</strong> cards
          </span>
          <span style={{ color: '#DDD8CA' }}>·</span>
          <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#2A2318' }}>
            Estimated <strong style={{ fontWeight: 500 }}>{estimatedHours} {estimatedHours === 1 ? 'hour' : 'hours'}</strong> to complete
          </span>
          <span style={{ color: '#DDD8CA' }}>·</span>
          <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, fontStyle: 'italic', color: '#7A7060' }}>
            Study at your own pace — spaced repetition remembers where you left off.
          </span>
        </div>

        {/* What's covered */}
        <section style={{ marginBottom: '56px' }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(24px, 3vw, 32px)', color: '#2A2318', margin: '0 0 20px 0', letterSpacing: '0.01em' }}>
            What’s covered
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
            }}
          >
            {level.topics.map(topic => (
              <div
                key={topic.name}
                className="nl-tile-hover"
                style={{
                  background: '#FDFAF3',
                  border: '1px solid #DDD8CA',
                  borderRadius: '14px',
                  padding: '20px',
                }}
              >
                <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '18px', color: '#1A1A18', margin: '0 0 6px 0', letterSpacing: '0.01em' }}>
                  {topic.name}
                </h3>
                <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#4A4540', lineHeight: 1.6, margin: 0 }}>
                  {topic.blurb}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sample card */}
        {sampleCard && (
          <section style={{ marginBottom: '56px' }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(24px, 3vw, 32px)', color: '#2A2318', margin: '0 0 20px 0', letterSpacing: '0.01em' }}>
              Example question
            </h2>
            <div
              style={{
                maxWidth: '560px',
                margin: '0 auto',
                background: '#FDFAF3',
                border: '1px solid #DDD8CA',
                borderRadius: '16px',
                padding: '40px 36px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(26,26,24,0.05), 0 10px 28px rgba(26,26,24,0.07)',
              }}
            >
              <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A7060', margin: '0 0 14px 0' }}>
                Example question
              </p>
              <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: '22px', color: '#2A2318', lineHeight: 1.5, margin: 0, letterSpacing: '0.01em' }}>
                {sampleCard.front}
              </p>
            </div>
          </section>
        )}

        {/* Bottom CTA — mirrors top */}
        <section
          style={{
            marginTop: '64px',
            padding: '28px',
            background: canStudy ? '#1A1A18' : '#FDFAF3',
            border: canStudy ? 'none' : '1px solid #DDD8CA',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          {canStudy ? (
            <>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.7)', margin: '0 0 14px 0' }}>
                Ready to study {level.label}?
              </p>
              <Link
                href={startHref}
                style={{
                  display: 'inline-block',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  background: ACCENT,
                  color: 'white',
                  textDecoration: 'none',
                  fontFamily: F,
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Start studying →
              </Link>
            </>
          ) : (
            <>
              <p style={{ fontFamily: F, fontSize: '15px', fontWeight: 300, color: '#4A4540', margin: '0 0 12px 0' }}>
                Three ways to unlock {level.label}:
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href={checkoutLevelHref}
                  style={{ fontFamily: F, fontSize: '13px', fontWeight: 500, color: '#2A2318', padding: '10px 18px', borderRadius: '10px', border: '1px solid #1A1A18', textDecoration: 'none' }}
                >
                  Buy this level · ${level.price}
                </Link>
                {bundle && (
                  <Link
                    href={checkoutBundleHref}
                    style={{ fontFamily: F, fontSize: '13px', fontWeight: 500, color: '#2A2318', padding: '10px 18px', borderRadius: '10px', border: '1px solid #1A1A18', textDecoration: 'none' }}
                  >
                    {bundle.title} · ${bundle.price}
                  </Link>
                )}
                <Link
                  href="/pricing"
                  style={{ fontFamily: F, fontSize: '13px', fontWeight: 500, color: 'white', padding: '10px 18px', borderRadius: '10px', background: '#1A1A18', textDecoration: 'none' }}
                >
                  Try Plus free →
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
