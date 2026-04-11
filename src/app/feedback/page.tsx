'use client'

import { useRouter } from 'next/navigation'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

// Replace this URL with your Tally embed link once the form is created
const TALLY_URL = 'https://tally.so/embed/PLACEHOLDER'

export default function FeedbackPage() {
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
          Feedback
        </h1>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#C4C0B8', margin: '0 0 32px', lineHeight: 1.6 }}>
          Found a bug or have a suggestion? Let us know — every report helps make NoteLab Studio better.
        </p>

        {/* Tally form embed — swap TALLY_URL with your form link */}
        <div style={{
          background: '#353330', borderRadius: '16px', border: '1px solid #484542',
          overflow: 'hidden', minHeight: '480px',
        }}>
          <iframe
            src={TALLY_URL}
            width="100%"
            height="600"
            frameBorder={0}
            style={{ display: 'block', border: 'none' }}
            title="Feedback form"
          />
        </div>

      </div>
    </div>
  )
}
