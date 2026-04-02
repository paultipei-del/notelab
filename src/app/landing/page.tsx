'use client'

import { useState, useEffect } from 'react'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const FEATURES = [
  { icon: '𝄞', title: 'Staff Recognition', desc: 'Play notes on your piano as they appear. The microphone detects your playing in real time.', tag: 'Piano Detection' },
  { icon: '♩', title: 'Flashcard Decks', desc: 'Spaced repetition for dynamics, articulation, tempo markings, clefs, intervals, and more.', tag: 'Spaced Repetition' },
  { icon: '𝄢', title: 'CM Repertoire', desc: 'Browse the complete Certificate of Merit syllabus and Magrath Guide with IMSLP links.', tag: 'Reference Library' },
  { icon: '♭', title: 'Theory Tools', desc: 'Scale builder, key signatures, circle of fifths, and a searchable musical glossary.', tag: 'Interactive Tools' },
]

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeNote, setActiveNote] = useState(0)
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) window.location.href = '/'
  }, [loading, user])

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => setActiveNote(n => (n + 1) % 5), 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px clamp(16px,4vw,48px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(245,242,236,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(211,209,199,0.6)' }}>
        <div style={{ fontFamily: F, fontSize: '20px', fontWeight: 300, letterSpacing: '0.08em', color: '#1A1A18' }}>Note<span style={{ fontWeight: 500 }}>Lab</span></div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="#pricing" style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', textDecoration: 'none' }}>Pricing</a>
          <button onClick={() => setShowAuth(true)} style={{ border: '1px solid #1A1A18', borderRadius: '8px', padding: '8px 20px', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#1A1A18', background: 'none', cursor: 'pointer' }}>Sign In</button>
          <button onClick={() => setShowAuth(true)} style={{ border: 'none', borderRadius: '8px', padding: '8px 20px', fontFamily: F, fontSize: '13px', fontWeight: 400, color: 'white', background: '#1A1A18', cursor: 'pointer' }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(48px,8vw,100px) clamp(24px,4vw,48px) 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }}>
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #D3D1C7', borderRadius: '20px', padding: '5px 14px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
            <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888780' }}>Now in Beta</span>
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(36px,5vw,60px)', lineHeight: 1.05, color: '#1A1A18', marginBottom: '24px', letterSpacing: '-0.01em' }}>
            Music theory,<br /><em>deeply</em> learned.
          </h1>
          <p style={{ fontFamily: F, fontWeight: 300, fontSize: '16px', color: '#888780', lineHeight: 1.8, marginBottom: '40px', maxWidth: '440px' }}>
            NoteLab combines spaced repetition flashcards, real-time piano detection, and a complete reference library — built for Certificate of Merit students and serious musicians.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={() => setShowAuth(true)}
              style={{ border: 'none', borderRadius: '10px', padding: '14px 32px', fontFamily: F, fontSize: '14px', fontWeight: 400, color: 'white', background: '#1A1A18', cursor: 'pointer', boxShadow: '0 4px 20px rgba(26,26,24,0.2)' }}>
              Start for free →
            </button>
            <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#B8B5AD' }}>No credit card required</span>
          </div>
        </div>

        {/* Staff card */}
        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.7s ease 0.3s', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #D3D1C7', padding: '48px 56px', boxShadow: '0 8px 48px rgba(26,26,24,0.08)', position: 'relative' as const, width: 'min(320px, 100%)' }}>
            <div style={{ position: 'relative', height: '120px', marginBottom: '32px' }}>
              <svg width="100%" height="120" viewBox="0 0 240 120">
                {[20,36,52,68,84].map((y, i) => (
                  <line key={i} x1="0" y1={y} x2="240" y2={y} stroke="#D3D1C7" strokeWidth="1" />
                ))}
                <text x="8" y="72" fontSize="80" fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="middle">𝄞</text>
                {[{x:160,y:84},{x:160,y:68},{x:160,y:52},{x:160,y:36},{x:160,y:20}].map((pos, i) => (
                  <g key={i} style={{ opacity: activeNote === i ? 1 : 0, transition: 'opacity 0.3s' }}>
                    <text x={pos.x} y={pos.y} fontSize="32" fontFamily="Bravura, serif" fill="#1A1A18" textAnchor="middle" dominantBaseline="central">{String.fromCodePoint(0xE0A4)}</text>
                    <line x1={pos.x+6} y1={pos.y} x2={pos.x+6} y2={pos.y-32} stroke="#1A1A18" strokeWidth="1.5" />
                  </g>
                ))}
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#F5F2EC', borderRadius: '10px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50', display: 'inline-block', boxShadow: '0 0 0 3px rgba(76,175,80,0.2)' }} />
              <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>Listening for your piano…</span>
            </div>
            <div style={{ position: 'absolute' as const, top: '-16px', right: '-16px', background: '#BA7517', color: 'white', borderRadius: '10px', padding: '6px 14px', fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.08em', boxShadow: '0 4px 12px rgba(186,117,23,0.3)' }}>
              Real-time detection
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 clamp(24px,4vw,48px) 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#BA7517', marginBottom: '12px' }}>What's inside</p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '40px', color: '#1A1A18', letterSpacing: '-0.01em' }}>Everything you need to practice smarter</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '20px', border: '1px solid #D3D1C7', padding: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px', lineHeight: 1 }}>{f.icon}</span>
                <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#BA7517', background: '#FDF5E6', border: '1px solid #F0D99A', borderRadius: '6px', padding: '3px 10px' }}>{f.tag}</span>
              </div>
              <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '22px', color: '#1A1A18', marginBottom: '10px' }}>{f.title}</h3>
              <p style={{ fontFamily: F, fontWeight: 300, fontSize: '13px', color: '#888780', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: 'white', borderTop: '1px solid #EDE8DF', borderBottom: '1px solid #EDE8DF', padding: 'clamp(60px,8vw,100px) clamp(24px,4vw,48px)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#BA7517', marginBottom: '12px' }}>Simple pricing</p>
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '40px', color: '#1A1A18', letterSpacing: '-0.01em' }}>Start free, upgrade when ready</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#F5F2EC', borderRadius: '20px', border: '1px solid #D3D1C7', padding: '40px' }}>
              <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '16px' }}>Free</p>
              <div style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 300, color: '#1A1A18', lineHeight: 1, marginBottom: '8px' }}>$0</div>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', marginBottom: '32px' }}>Forever free</p>
              {['Note ID flashcards', 'Key signatures tool', 'Scale builder', 'Musical glossary', 'Basic decks'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ color: '#4CAF50' }}>✓</span>
                  <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#1A1A18' }}>{item}</span>
                </div>
              ))}
              <button onClick={() => setShowAuth(true)} style={{ marginTop: '32px', width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #1A1A18', background: 'none', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#1A1A18', cursor: 'pointer' }}>Get started free</button>
            </div>
            <div style={{ background: '#1A1A18', borderRadius: '20px', padding: '40px', position: 'relative' as const, overflow: 'hidden' }}>
              <div style={{ position: 'absolute' as const, top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(186,117,23,0.15)' }} />
              <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#BA7517', marginBottom: '16px' }}>Pro</p>
              <div style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 300, color: 'white', lineHeight: 1, marginBottom: '8px' }}>$8</div>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>per month</p>
              {['Everything in Free', 'Staff recognition + piano mic', 'CM Repertoire browser', 'Magrath Guide access', 'All flashcard decks'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ color: '#BA7517' }}>✓</span>
                  <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: item === 'Everything in Free' ? 'rgba(255,255,255,0.5)' : 'white' }}>{item}</span>
                </div>
              ))}
              <button onClick={() => setShowAuth(true)} style={{ marginTop: '32px', width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#BA7517', fontFamily: F, fontSize: '13px', fontWeight: 400, color: 'white', cursor: 'pointer', boxShadow: '0 4px 16px rgba(186,117,23,0.4)' }}>Start Pro →</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(24px,4vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: F, fontSize: '16px', fontWeight: 300, letterSpacing: '0.08em', color: '#1A1A18' }}>Note<span style={{ fontWeight: 500 }}>Lab</span></div>
        <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#B8B5AD' }}>Built for pianists and musicians. © {new Date().getFullYear()}</p>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); window.location.href = '/' }} />}
    </div>
  )
}
