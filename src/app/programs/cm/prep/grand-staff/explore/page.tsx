'use client'

import Link from 'next/link'
import InteractiveGrandStaff from '@/components/programs/cm-prep/InteractiveGrandStaff'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#BA7517'

export default function GrandStaffExplorePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Breadcrumb */}
        <Link href="/programs/cm/prep/grand-staff" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Lesson 1: The Grand Staff
          </span>
        </Link>

        {/* Header */}
        <div style={{ marginTop: '28px', marginBottom: '32px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '8px' }}>
            Interactive Explorer
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(26px, 4vw, 40px)', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>
            The Grand Staff
          </h1>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', lineHeight: 1.7, maxWidth: '480px', margin: 0 }}>
            Tap any element on the staff to learn what it does. When you're ready, switch to Quiz mode and identify each part from memory.
          </p>
        </div>

        {/* Interactive component */}
        <div style={{ background: 'white', border: '1px solid #E8E4DC', borderRadius: '20px', padding: '28px' }}>
          <InteractiveGrandStaff showModeToggle={true} />
        </div>

        {/* Quick reference below */}
        <div style={{ marginTop: '24px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#B0ACA4', marginBottom: '12px' }}>
            Quick Reference
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { n: 1, label: 'Brace', desc: 'Joins treble + bass staves' },
              { n: 2, label: 'Treble clef', desc: 'G clef — anchors G, line 2' },
              { n: 3, label: 'Bass clef', desc: 'F clef — anchors F, line 4' },
              { n: 4, label: 'Bar line', desc: 'Divides into measures' },
              { n: 5, label: 'Measure', desc: 'Space between bar lines' },
            ].map(item => (
              <div key={item.n} style={{
                background: 'white', border: '1px solid #EDE8DF', borderRadius: '12px',
                padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start',
              }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                  background: ACCENT, color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: F, fontSize: 11, fontWeight: 600, marginTop: 1,
                }}>{item.n}</span>
                <div>
                  <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: '#2A2318', margin: '0 0 2px' }}>{item.label}</p>
                  <p style={{ fontFamily: F, fontSize: 12, color: '#7A7060', margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to lesson CTA */}
        <div style={{ marginTop: '32px', padding: '20px 24px', background: 'white', borderRadius: '14px', border: '1px solid #E8E4DC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', margin: 0 }}>
            Ready to test your knowledge on the full lesson?
          </p>
          <Link href="/programs/cm/prep/grand-staff" style={{ textDecoration: 'none' }}>
            <span style={{
              display: 'inline-block', fontFamily: F, fontSize: 13,
              background: '#1A1A18', color: 'white', borderRadius: '10px', padding: '10px 20px',
            }}>
              Back to lesson →
            </span>
          </Link>
        </div>

      </div>
    </div>
  )
}
