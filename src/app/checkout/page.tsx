'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

function CheckoutInner() {
  const params = useSearchParams()
  const item = params.get('item') ?? 'this product'
  const price = params.get('price')

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: '#FDFAF3',
          border: '1px solid #DDD8CA',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: F,
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#B5402A',
            margin: '0 0 10px 0',
          }}
        >
          Checkout
        </p>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 'clamp(28px, 3.5vw, 36px)',
            color: '#2A2318',
            margin: '0 0 12px 0',
            letterSpacing: '-0.01em',
          }}
        >
          Checkout coming soon.
        </h1>
        <p style={{ fontFamily: F, fontWeight: 300, fontSize: '15px', color: '#4A4540', lineHeight: 1.65, margin: '0 0 20px 0' }}>
          You’re trying to buy <strong style={{ color: '#2A2318', fontWeight: 500 }}>{item}</strong>
          {price && <> for <strong style={{ color: '#2A2318', fontWeight: 500 }}>${price}</strong></>}.
        </p>
        <p style={{ fontFamily: F, fontWeight: 300, fontSize: '14px', color: '#7A7060', lineHeight: 1.65, margin: '0 0 28px 0' }}>
          Payment isn’t wired up yet. In the meantime, try NoteLab Plus — which includes every program — for free during the beta.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/pricing"
            style={{
              fontFamily: F,
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              background: '#1A1A18',
              padding: '12px 22px',
              borderRadius: '10px',
              textDecoration: 'none',
            }}
          >
            See Plus →
          </Link>
          <Link
            href="/programs"
            style={{
              fontFamily: F,
              fontSize: '14px',
              fontWeight: 400,
              color: '#2A2318',
              border: '1px solid #DDD8CA',
              padding: '12px 22px',
              borderRadius: '10px',
              textDecoration: 'none',
              background: 'transparent',
            }}
          >
            Back to Programs
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutInner />
    </Suspense>
  )
}
