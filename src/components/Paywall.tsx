'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import type { FeatureKey } from '@/lib/entitlements'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

/**
 * Wraps content behind a feature gate.
 *
 * Currently a no-op — `useFeatureAccess` returns `hasAccess: true` for
 * every feature during the free beta. When gating flips on, this
 * component will render the blocked-UI card below instead of its
 * children whenever the check fails.
 *
 * Usage:
 *   <Paywall featureKey="flashcards:intermediate">
 *     <IntermediateDeckGrid />
 *   </Paywall>
 */
export default function Paywall({
  featureKey,
  children,
  /** Optional custom message to show on the blocked card. */
  message,
}: {
  featureKey: FeatureKey
  children: ReactNode
  message?: string
}) {
  const { hasAccess, requiredPlan, reason } = useFeatureAccess(featureKey)

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <PaywallCard
      requiredPlan={requiredPlan}
      message={message ?? reason}
    />
  )
}

/**
 * The blocked-content UI. Exposed separately so pages can render it
 * manually (e.g., as a preview row) even when a user has access.
 */
export function PaywallCard({
  requiredPlan,
  message,
}: {
  requiredPlan: 'free' | 'plus' | `program:${string}`
  message: string
}) {
  const isProgram = requiredPlan.startsWith('program:')
  const headline = isProgram
    ? 'Available in this program'
    : requiredPlan === 'plus'
      ? 'This is a Plus feature'
      : 'Locked'

  const cta = isProgram
    ? { href: '/pricing', label: 'Browse programs →' }
    : requiredPlan === 'plus'
      ? { href: '/pricing', label: 'Start 14-day free trial →' }
      : { href: '/pricing', label: 'See plans →' }

  return (
    <div
      role="region"
      aria-label="Feature locked"
      style={{
        background: '#ECE3CC',
        border: '1px solid #D9CFAE',
        borderRadius: '16px',
        padding: '40px 32px',
        textAlign: 'center',
        maxWidth: '520px',
        margin: '24px auto',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          fontFamily: F,
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#B5402A',
          marginBottom: '12px',
        }}
      >
        {headline}
      </span>
      <p
        style={{
          fontFamily: SERIF,
          fontSize: '22px',
          fontWeight: 400,
          color: '#2A2318',
          lineHeight: 1.4,
          margin: '0 0 12px 0',
          letterSpacing: '0.01em',
        }}
      >
        Unlock this with NoteLab Plus.
      </p>
      <p
        style={{
          fontFamily: F,
          fontSize: '14px',
          fontWeight: 300,
          color: '#7A7060',
          lineHeight: 1.65,
          margin: '0 0 24px 0',
        }}
      >
        {message}
      </p>
      <Link
        href={cta.href}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          borderRadius: '10px',
          background: '#1A1A18',
          color: 'white',
          textDecoration: 'none',
          fontFamily: F,
          fontSize: '14px',
          fontWeight: 400,
        }}
      >
        {cta.label}
      </Link>
    </div>
  )
}
