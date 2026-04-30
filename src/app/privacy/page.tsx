'use client'

import { useRouter } from 'next/navigation'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px) 80px' }}>

        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060',
          padding: 0, marginBottom: '24px', display: 'block',
        }}>← Back</button>

        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '36px', color: '#2A2318', marginBottom: '6px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', margin: '0 0 40px', lineHeight: 1.6 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div style={{ background: '#ECE3CC', borderRadius: '16px', border: '1px solid #D9CFAE', padding: '32px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', lineHeight: 1.8, margin: 0 }}>
            Privacy policy coming soon. NoteLab collects only the information needed to provide the service — account email and usage data. We do not sell personal data. For questions, contact us via the{' '}
            <a href="/feedback" style={{ color: '#2A2318', textDecoration: 'underline' }}>feedback form</a>.
          </p>
        </div>

      </div>
    </div>
  )
}
