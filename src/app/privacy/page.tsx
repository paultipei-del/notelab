'use client'

import { useRouter } from 'next/navigation'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px) 80px' }}>

        <button onClick={() => router.back()} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780',
          padding: 0, marginBottom: '24px', display: 'block',
        }}>← Back</button>

        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '36px', color: '#1A1A18', marginBottom: '6px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', margin: '0 0 40px', lineHeight: 1.6 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '32px' }}>
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', lineHeight: 1.8, margin: 0 }}>
            Privacy policy coming soon. NoteLab collects only the information needed to provide the service — account email and usage data. We do not sell personal data. For questions, contact us via the{' '}
            <a href="/feedback" style={{ color: '#1A1A18', textDecoration: 'underline' }}>feedback form</a>.
          </p>
        </div>

      </div>
    </div>
  )
}
