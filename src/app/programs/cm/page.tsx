'use client'

import Link from 'next/link'
import { DECKS } from '@/lib/decks'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import {
  CM_LEVELS,
  CM_BUNDLES,
  TIER_ORDER,
  TIER_LABEL,
  TIER_DESCRIPTION,
  type CMLevel,
  type CMTier,
} from '@/lib/cmProgram'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

// Each tier gets its own subtle background shade and glyph decoration.
// All colours live inside the existing cream/charcoal palette.
const TIER_STYLE: Record<CMTier, { bg: string; glyph: string; glyphSize: string }> = {
  elementary: { bg: '#ECE3CC', glyph: '𝄞', glyphSize: '72px' },
  intermediate: { bg: '#F8F1E2', glyph: '𝄞 𝄢', glyphSize: '56px' },
  advanced: { bg: '#EFE6D2', glyph: '♩♬♩', glyphSize: '56px' },
}

function cardCount(deckId: string): number {
  return DECKS.find(d => d.id === deckId)?.cards.length ?? 0
}

function LevelCard({ level }: { level: CMLevel }) {
  // Only the Preparatory level is free. Every numbered level is gated
  // behind Plus or the CM program purchase. The master FREE_NOW switch
  // currently opens all gates during beta, but the structural truth
  // (free vs gated) is what we surface in the chip and price label.
  const access = useFeatureAccess(
    level.slug === 'preparatory' ? 'program:cm:preparatory'
      : level.slug === 'level-1' ? 'program:cm:level_1'
      : level.slug === 'level-2' ? 'program:cm:level_2'
      : 'program:cm:level_3_plus',
  )
  const tierStyle = TIER_STYLE[level.tier]
  const freeTier = level.slug === 'preparatory'

  // Ownership chip. Three states:
  //  • Owned — user has the right (Plus, bundle, or individual purchase)
  //    AND would otherwise have been gated (requiredPlan !== 'free').
  //  • Free — this level is part of the free tier.
  //  • Price — everyone else.
  const ownedButWouldBeGated = access.hasAccess && access.requiredPlan !== 'free'
  const chip = freeTier ? (
    <span
      style={{
        fontFamily: F,
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#7A7060',
        background: '#EDE8DF',
        borderRadius: '20px',
        padding: '3px 10px',
      }}
    >
      Free
    </span>
  ) : ownedButWouldBeGated ? (
    <span
      style={{
        fontFamily: F,
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#3B6D11',
        background: '#E6F0D6',
        borderRadius: '20px',
        padding: '3px 10px',
      }}
    >
      ✓ Owned
    </span>
  ) : (
    <span
      style={{
        fontFamily: F,
        fontSize: '11px',
        fontWeight: 600,
        color: ACCENT,
        background: '#FAEEDA',
        borderRadius: '20px',
        padding: '3px 10px',
      }}
    >
      ${level.price}
    </span>
  )

  // Preparatory and Level 1 have dedicated lessons hubs.
  // The rest route through the generic level overview at /programs/cm/[levelSlug].
  const href = level.slug === 'preparatory'
    ? '/programs/cm/prep'
    : level.slug === 'level-1'
      ? '/programs/cm/l1'
      : `/programs/cm/${level.slug}`

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        className="nl-card-surface nl-tile-hover"
        style={{
          background: tierStyle.bg,
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Tier decoration glyph. Elementary uses a slightly higher
            opacity because its single clef reads thinner than the
            Intermediate double-clef and Advanced rhythm cluster. */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: '-8px',
            bottom: '-14px',
            fontFamily: SERIF,
            fontSize: tierStyle.glyphSize,
            color: '#2A2318',
            opacity: level.tier === 'elementary' ? 0.09 : 0.06,
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {tierStyle.glyph}
        </span>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              fontFamily: F,
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#7A7060',
            }}
          >
            {cardCount(level.deckId)} cards
          </span>
          {chip}
        </div>
        <h3
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: '22px',
            color: '#1A1A18',
            margin: '0 0 8px 0',
            letterSpacing: '0.01em',
          }}
        >
          {level.label}
        </h3>
        <p
          style={{
            fontFamily: F,
            fontSize: '12px',
            fontWeight: 300,
            color: '#7A7060',
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {level.topicKeywords}
        </p>
      </div>
    </Link>
  )
}

function BundleCard({ bundle }: { bundle: (typeof CM_BUNDLES)[number] }) {
  const checkoutHref = `/checkout?item=${encodeURIComponent(bundle.title)}&price=${bundle.price}`
  const isWide = !!bundle.wide

  return (
    <div
      className={`nl-tile-hover nl-cm-bundle${isWide ? ' is-wide' : ''}`}
      style={{
        position: 'relative',
        background: '#ECE3CC',
        border: `2px solid ${ACCENT}`,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(186,117,23,0.08)',
      }}
    >
      {isWide && (
        // Anchor at top-right so the eye lands on the value signal
        // before the price. Same red-on-tint pill style used by
        // FEATURED / NEW elsewhere on /programs.
        <span
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            fontFamily: F,
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#a0381c',
            background: 'rgba(160, 56, 28, 0.1)',
            padding: '4px 8px',
            borderRadius: '3px',
          }}
        >
          Best Value
        </span>
      )}

      <div className="nl-cm-bundle__content">
        <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '22px', color: '#1A1A18', margin: 0, letterSpacing: '0.01em' }}>
          {bundle.title}
        </h3>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#4A4540', lineHeight: 1.6, margin: '8px 0 0 0' }}>
          {bundle.subtitle} · {bundle.contentsSummary}
        </p>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, fontStyle: 'italic', color: '#7A7060', margin: '8px 0 0 0' }}>
          {bundle.tagline}
        </p>
      </div>

      <div className="nl-cm-bundle__cta">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#2A2318', letterSpacing: '-0.01em' }}>
            ${bundle.price}
          </span>
          <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: ACCENT }}>
            save ${bundle.savings}
          </span>
        </div>
        <Link
          href={checkoutHref}
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '10px',
            borderRadius: '10px',
            background: '#1A1A18',
            color: 'white',
            textDecoration: 'none',
            fontFamily: F,
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {bundle.ctaLabel}
        </Link>
        <Link
          href="/pricing"
          style={{
            fontFamily: F,
            fontSize: '12px',
            fontWeight: 400,
            color: '#7A7060',
            textDecoration: 'none',
            textAlign: 'center',
            display: 'block',
          }}
        >
          Or get it free with NoteLab Plus →
        </Link>
      </div>
    </div>
  )
}

export default function CMProgramPage() {
  // We look at a representative gated feature to decide whether to show
  // the Plus callout at the bottom. While FREE_NOW is active, everyone
  // registers as requiring Plus — that's correct (no one has Plus yet).
  const plusCheck = useFeatureAccess('program:cm:level_3_plus')
  const hasPlus = plusCheck.hasAccess && plusCheck.requiredPlan === 'plus' && plusCheck.reason === 'Included in Plus'

  const levelsByTier = TIER_ORDER.reduce<Record<CMTier, CMLevel[]>>((acc, tier) => {
    acc[tier] = CM_LEVELS.filter(l => l.tier === tier)
    return acc
  }, { elementary: [], intermediate: [], advanced: [] })

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 32px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/programs" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#7A7060', letterSpacing: '0.04em' }}>
              ← Programs
            </span>
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7060', marginBottom: '12px' }}>
            Certificate of Merit<sup className="r-mark">®</sup> · California
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(32px, 4.5vw, 48px)', color: '#2A2318', marginBottom: '14px', letterSpacing: '-0.01em' }}>
            CM Theory Prep
          </h1>
          <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 400, color: '#4A4540', maxWidth: '620px', lineHeight: 1.7, margin: 0 }}>
            Complete flashcard collections for every CM level, Preparatory through Advanced. Covers signs and terms, scales, intervals, chords, history, and ear training.
          </p>
        </div>

        {/* Tier sections */}
        {TIER_ORDER.map(tier => (
          <section key={tier} style={{ marginBottom: '48px' }}>
            <p
              style={{
                fontFamily: F,
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#2A2318',
                margin: '0 0 6px 0',
              }}
            >
              {TIER_LABEL[tier]}
            </p>
            <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060', lineHeight: 1.65, margin: '0 0 18px 0', maxWidth: '640px' }}>
              {TIER_DESCRIPTION[tier]}
            </p>
            <div
              className={`nl-cm-tier-grid is-${levelsByTier[tier].length}`}
            >
              {levelsByTier[tier].map(level => (
                <LevelCard key={level.slug} level={level} />
              ))}
            </div>
          </section>
        ))}

        {/* Bundle section */}
        <section style={{ marginTop: '64px', marginBottom: '40px' }}>
          <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2A2318', margin: '0 0 6px 0' }}>
            Save with a bundle
          </p>
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060', lineHeight: 1.65, margin: '0 0 20px 0', maxWidth: '640px' }}>
            Buy a tier-wide bundle or the full program and save vs. purchasing levels individually.
          </p>
          <div className="nl-cm-bundle-grid">
            {CM_BUNDLES.map(b => (
              <BundleCard key={b.id} bundle={b} />
            ))}
          </div>
        </section>

        {/* Plus callout */}
        {!hasPlus && (
          <section
            style={{
              marginTop: '48px',
              padding: '20px 24px',
              background: '#ECE3CC',
              border: '1px solid #D9CFAE',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#2A2318', lineHeight: 1.6, margin: 0, maxWidth: '520px' }}>
              Already have NoteLab Plus? All CM levels are included in your subscription — open any level to start studying.
            </p>
            <Link
              href="/pricing"
              style={{
                fontFamily: F,
                fontSize: '13px',
                fontWeight: 500,
                color: ACCENT,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              See Plus →
            </Link>
          </section>
        )}
      </div>
    </div>
  )
}
