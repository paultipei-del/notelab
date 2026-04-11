'use client'

import { useRouter } from 'next/navigation'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#2C2A27' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px) 80px' }}>

        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8',
          padding: 0, marginBottom: '24px', display: 'block',
        }}>← Back</button>

        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '36px', color: '#F7F4EF', marginBottom: '6px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', margin: '0 0 40px', lineHeight: 1.6 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div style={{ background: '#353330', borderRadius: '16px', border: '1px solid #484542', padding: '32px' }}>
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', lineHeight: 1.8, margin: 0 }}>
            Privacy policy coming soon. NoteLab Studio collects only the information needed to provide the service — account email and usage data. We do not sell personal data. For questions, contact us via the{' '}
            <a href="/feedback" style={{ color: '#F7F4EF', textDecoration: 'underline' }}>feedback form</a>.
          </p>
        </div>

      </div>
    </div>
  )
}
