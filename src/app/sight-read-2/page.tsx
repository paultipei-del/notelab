'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function SightRead2() {
  const router = useRouter()
  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 24px', display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', padding: 0, marginBottom: '16px', display: 'block', alignSelf: 'flex-start' }}>← Back</button>
        {[
          { href: '/sight-read-2/treble', label: 'Treble Clef', desc: 'C4 – C6' },
          { href: '/sight-read-2/bass', label: 'Bass Clef', desc: 'C2 – C4' },
          { href: '/sight-read-2/grand', label: 'Grand Staff', desc: 'Full range' },
        ].map(({ href, label, desc }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '16px', padding: '24px 28px', cursor: 'pointer' }}>
              <h2 style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 300, color: '#2A2318', marginBottom: '4px' }}>{label}</h2>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
