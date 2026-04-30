'use client'

import Link from 'next/link'
import { useState } from 'react'
import ScrollReveal from '@/components/marketing/ScrollReveal'
import GlyphBackdrop from '@/components/marketing/GlyphBackdrop'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

type PlanCard = {
  name: string
  price: string
  priceSuffix?: string
  sub?: string
  features: string[]
  cta: { label: string; href: string }
  highlighted?: boolean
  smallPrint?: string
}

const FREE_PLAN: PlanCard = {
  name: 'Free',
  price: '$0',
  priceSuffix: 'forever',
  features: [
    'Full reference library',
    'All interactive tools',
    'Foundations flashcards (15 decks)',
    'First 2 levels of each program',
    'Interval ear training',
    'No credit card required',
  ],
  cta: { label: 'Start free', href: '/landing' },
}

const PLUS_PLAN: PlanCard = {
  name: 'NoteLab Plus',
  price: '$9.99',
  priceSuffix: '/month',
  sub: '$79/year (save 34%)',
  features: [
    'Everything in Free',
    'All flashcard tiers (37+ decks)',
    'All programs included',
    'Full ear training library',
    'Application & Review challenges',
    'Progress tracking across all decks',
    'Cancel anytime',
  ],
  cta: { label: 'Start 14-day free trial', href: '/landing' },
  highlighted: true,
  smallPrint: 'Cancel anytime. No commitment.',
}

const PROGRAMS_PLAN: PlanCard = {
  name: 'Programs',
  price: 'à la carte',
  sub: 'Lifetime access. Own your level forever.',
  features: [
    'CM single level — $29',
    'CM Levels 1–5 — $99',
    'Full CM Program — $149',
    'Note Reading — $29',
    'Rhythm Reading — $29',
    'Lifetime access, no subscription',
  ],
  cta: { label: 'Browse programs', href: '/programs' },
}

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Can I try Plus before paying?',
    a: 'Yes — 14-day free trial, no credit card required.',
  },
  {
    q: 'What’s the difference between Plus and buying a program individually?',
    a: 'Plus is a rolling subscription that includes every program (current and future), plus all flashcards, plus the full ear training library. Individual programs are one-time purchases that give you lifetime access to that specific program, but not to other programs or the Advanced flashcard tiers.',
  },
  {
    q: 'Can I cancel Plus?',
    a: 'Anytime, instantly. Your access continues until the end of the current billing period.',
  },
  {
    q: 'What does “Lifetime access” mean for programs?',
    a: 'You own that program forever, including future content updates to that program. It doesn’t expire.',
  },
  {
    q: 'Do you offer teacher or studio plans?',
    a: 'A group plan is in development. Join the waitlist at the bottom of the page.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit cards and Apple Pay via Stripe.',
  },
]

function PlanCardView({ plan, delayMs = 0 }: { plan: PlanCard; delayMs?: number }) {
  const isHi = plan.highlighted
  return (
    <ScrollReveal
      delayMs={delayMs}
      className="nl-tile-hover"
      style={{
        background: isHi ? '#FDFAF3' : '#F2EDDF',
        border: `${isHi ? 2 : 1}px solid ${isHi ? ACCENT : '#DDD8CA'}`,
        borderRadius: '20px',
        padding: '36px 32px',
        boxShadow: isHi ? '0 8px 32px rgba(186,117,23,0.12)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '560px',
      }}
    >
      <p
        style={{
          fontFamily: F,
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: isHi ? ACCENT : '#7A7060',
          margin: 0,
        }}
      >
        {plan.name}
      </p>
      <div>
        <span
          style={{
            fontFamily: SERIF,
            fontSize: '44px',
            fontWeight: 300,
            color: '#2A2318',
            letterSpacing: '-0.02em',
          }}
        >
          {plan.price}
        </span>
        {plan.priceSuffix && (
          <span
            style={{
              fontFamily: F,
              fontSize: '14px',
              fontWeight: 400,
              color: '#7A7060',
              marginLeft: '8px',
            }}
          >
            {plan.priceSuffix}
          </span>
        )}
      </div>
      {plan.sub && (
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060', margin: 0 }}>
          {plan.sub}
        </p>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0', flex: 1 }}>
        {plan.features.map(f => (
          <li
            key={f}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '10px',
              fontFamily: F,
              fontSize: '14px',
              fontWeight: 400,
              color: '#2A2318',
              lineHeight: 1.55,
            }}
          >
            <span style={{ color: ACCENT, marginTop: '1px', flexShrink: 0 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={plan.cta.href}
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '14px',
          borderRadius: '10px',
          background: isHi ? '#1A1A18' : 'transparent',
          border: isHi ? 'none' : '1px solid #1A1A18',
          color: isHi ? 'white' : '#2A2318',
          textDecoration: 'none',
          fontFamily: F,
          fontSize: '14px',
          fontWeight: 500,
          marginTop: '12px',
        }}
      >
        {plan.cta.label}
      </Link>
      {plan.smallPrint && (
        <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#9A9081', margin: '4px 0 0 0', textAlign: 'center' }}>
          {plan.smallPrint}
        </p>
      )}
    </ScrollReveal>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        borderBottom: '1px solid #DDD8CA',
        padding: '16px 0',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: SERIF,
          fontSize: '18px',
          fontWeight: 500,
          color: '#2A2318',
          letterSpacing: '0.01em',
        }}
      >
        <span>{q}</span>
        <span
          aria-hidden
          style={{
            fontFamily: F,
            fontSize: '20px',
            fontWeight: 300,
            color: '#7A7060',
            transform: open ? 'rotate(45deg)' : 'none',
            transition: 'transform 180ms ease',
            lineHeight: 1,
          }}
        >
          +
        </span>
      </button>
      {open && (
        <p
          style={{
            fontFamily: F,
            fontSize: '14px',
            fontWeight: 300,
            color: '#4A4540',
            lineHeight: 1.7,
            margin: '12px 0 0 0',
            maxWidth: '640px',
          }}
        >
          {a}
        </p>
      )}
    </div>
  )
}

export default function PricingPage() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    // Stripe / waitlist backend wiring lands in a future pass. Capturing
    // locally for now so the UI has a success state to show.
    if (!email.trim()) return
    setSubscribed(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      <GlyphBackdrop density={9} seed={51} />
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '48px 32px 96px', position: 'relative' }}>
        {/* Hero */}
        <div style={{ marginBottom: '56px', maxWidth: '680px' }}>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: 'clamp(36px, 5vw, 56px)',
              color: '#2A2318',
              letterSpacing: '-0.01em',
              margin: '0 0 16px 0',
            }}
          >
            Pick what fits.
          </h1>
          <p
            style={{
              fontFamily: F,
              fontSize: '18px',
              fontWeight: 300,
              color: '#7A7060',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Study for free. Upgrade when you need more.
          </p>
        </div>

        {/* Plan grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '80px',
          }}
        >
          <PlanCardView plan={FREE_PLAN} delayMs={0} />
          <PlanCardView plan={PLUS_PLAN} delayMs={100} />
          <PlanCardView plan={PROGRAMS_PLAN} delayMs={200} />
        </div>

        {/* FAQ */}
        <section style={{ maxWidth: '720px', margin: '0 auto 80px', padding: '0 8px' }}>
          <h2
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: 'clamp(28px, 3.5vw, 36px)',
              color: '#2A2318',
              letterSpacing: '0.01em',
              margin: '0 0 24px 0',
            }}
          >
            Questions
          </h2>
          <div>
            {FAQ.map((f, i) => (
              <ScrollReveal key={f.q} delayMs={i * 50}>
                <FAQItem q={f.q} a={f.a} />
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Teacher waitlist */}
        <section
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '32px 28px',
            background: '#FDFAF3',
            border: '1px solid #DDD8CA',
            borderRadius: '16px',
          }}
        >
          <p
            style={{
              fontFamily: F,
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: ACCENT,
              margin: '0 0 6px 0',
            }}
          >
            Teachers
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontSize: '20px',
              fontWeight: 400,
              color: '#2A2318',
              lineHeight: 1.4,
              margin: '0 0 16px 0',
              letterSpacing: '0.01em',
            }}
          >
            Get notified when our studio plan launches.
          </p>
          {subscribed ? (
            <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 400, color: '#4A4540', margin: 0 }}>
              Thanks — we’ll be in touch when the studio plan is ready.
            </p>
          ) : (
            <form onSubmit={handleWaitlist} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@school.edu"
                style={{
                  flex: '1 1 240px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid #DDD8CA',
                  background: '#F2EDDF',
                  fontFamily: F,
                  fontSize: '14px',
                  color: '#2A2318',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '11px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#1A1A18',
                  color: 'white',
                  fontFamily: F,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Subscribe
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
