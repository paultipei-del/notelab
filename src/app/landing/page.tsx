'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import HeroStaffAnimation from '@/components/marketing/HeroStaffAnimation'
import GlyphBackdrop from '@/components/marketing/GlyphBackdrop'
import ScrollReveal from '@/components/marketing/ScrollReveal'
import { MicroFlashcard, MicroPianoDetect, MicroProgress } from '@/components/marketing/MicroDemos'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, loading } = useAuth()

  // Note: landing is viewable by signed-in users too (per spec §2E), so no auto-redirect.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Hide auth buttons for signed-in users and swap them for a "Go to app" link.
  const isSignedIn = !loading && !!user

  function scrollToPricing() {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF', overflowX: 'hidden' }}>
      {/* Top bar */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px clamp(16px,4vw,48px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(245,242,236,0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(211,209,199,0.6)',
        }}
      >
        <Link href="/landing" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo-dark.png" alt="NoteLab" style={{ height: '28px', width: 'auto', display: 'block' }} />
          <span
            style={{
              fontFamily: F,
              fontSize: '20px',
              fontWeight: 300,
              letterSpacing: '0.08em',
              color: '#2A2318',
            }}
          >
            Note<span style={{ fontWeight: 500 }}>Lab</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontFamily: F, fontSize: '14px', fontWeight: 400, color: '#7A7060', textDecoration: 'none' }}>
            Pricing
          </Link>
          {isSignedIn ? (
            <Link
              href="/"
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                fontFamily: F,
                fontSize: '14px',
                fontWeight: 400,
                color: 'white',
                background: '#1A1A18',
                textDecoration: 'none',
              }}
            >
              Open app →
            </Link>
          ) : (
            <>
              <button
                onClick={() => setShowAuth(true)}
                style={{
                  border: '1px solid #1A1A18',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontFamily: F,
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#2A2318',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
              <button
                onClick={() => setShowAuth(true)}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontFamily: F,
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'white',
                  background: '#1A1A18',
                  cursor: 'pointer',
                }}
              >
                Start free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: 'clamp(48px,8vw,100px) clamp(24px,4vw,48px) 64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(40px,6vw,80px)',
          alignItems: 'center',
        }}
      >
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: 'clamp(40px, 5.5vw, 68px)',
              lineHeight: 1.05,
              color: '#2A2318',
              marginBottom: '20px',
              letterSpacing: '-0.015em',
            }}
          >
            Music theory that <em>actually</em> sticks.
          </h1>
          <p
            style={{
              fontFamily: F,
              fontWeight: 300,
              fontSize: '17px',
              color: '#4A4540',
              lineHeight: 1.75,
              marginBottom: '32px',
              maxWidth: '480px',
            }}
          >
            A comprehensive reference library, curriculum-aligned programs, spaced-repetition flashcards, and real-time ear training — built for Certificate of Merit students, college music majors, and anyone who wants to understand music deeply.
          </p>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => (isSignedIn ? (window.location.href = '/') : setShowAuth(true))}
              style={{
                border: 'none',
                borderRadius: '10px',
                padding: '14px 30px',
                fontFamily: F,
                fontSize: '15px',
                fontWeight: 500,
                color: 'white',
                background: '#1A1A18',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(26,26,24,0.2)',
              }}
            >
              Start free →
            </button>
            <button
              onClick={scrollToPricing}
              style={{
                background: 'none',
                border: 'none',
                padding: '14px 6px',
                fontFamily: F,
                fontSize: '15px',
                fontWeight: 400,
                color: ACCENT,
                cursor: 'pointer',
              }}
            >
              See what’s included
            </button>
          </div>
        </div>

        {/* Hero preview — animated staff with cycling note */}
        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.7s ease 0.3s', display: 'flex', justifyContent: 'center' }}>
          <HeroStaffAnimation />
        </div>
      </section>

      {/* What's inside */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px clamp(24px,4vw,48px) 80px', position: 'relative' }}>
        <GlyphBackdrop density={6} seed={7} />
        <p
          style={{
            fontFamily: F,
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: ACCENT,
            margin: '0 0 10px 0',
          }}
        >
          What’s inside
        </p>
        <h2
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 'clamp(32px, 4vw, 44px)',
            color: '#2A2318',
            letterSpacing: '-0.01em',
            margin: '0 0 40px 0',
          }}
        >
          Everything you need to learn music deeply.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Card 1: Reference Library (wider, spans 2 cols on wide screens) */}
          <ScrollReveal
            delayMs={0}
            className="nl-tile-hover"
            style={{
              background: '#FDFAF3',
              borderRadius: '20px',
              border: '1px solid #DDD8CA',
              padding: '36px',
              gridColumn: 'span 2',
            }}
          >
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 10px 0' }}>The reference library</p>
            <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '26px', color: '#2A2318', margin: '0 0 14px 0' }}>
              110+ pages. 11 parts. Zero fluff.
            </h3>
            <p style={{ fontFamily: F, fontWeight: 300, fontSize: '15px', color: '#4A4540', lineHeight: 1.7, margin: '0 0 18px 0' }}>
              From what sound actually is to the architecture of sonata form. Written like a well-designed reference book, not a textbook. Read straight through, or look up exactly what you need.
            </p>
            <Link href="/learn" style={{ fontFamily: F, fontSize: '14px', fontWeight: 500, color: ACCENT, textDecoration: 'none' }}>
              Explore the library →
            </Link>
          </ScrollReveal>

          {/* Card 2: Programs — level progression demo */}
          <ScrollReveal delayMs={80} className="nl-tile-hover" style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 10px 0' }}>Programs</p>
            <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '22px', color: '#2A2318', margin: '0 0 12px 0' }}>
              Curriculum-aligned, level by level.
            </h3>
            <p style={{ fontFamily: F, fontWeight: 300, fontSize: '14px', color: '#4A4540', lineHeight: 1.65, margin: '0 0 18px 0' }}>
              Certificate of Merit from Preparatory through Level 10. Note Reading across treble, bass, and grand staff. Rhythm Reading from whole notes through polyrhythm. Each program is self-contained.
            </p>
            <div style={{ marginTop: 'auto' }}>
              <MicroProgress />
            </div>
          </ScrollReveal>

          {/* Card 3: Flashcards — flip demo */}
          <ScrollReveal delayMs={160} className="nl-tile-hover" style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 10px 0' }}>Flashcards</p>
            <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '22px', color: '#2A2318', margin: '0 0 12px 0' }}>
              400+ cards across three tiers.
            </h3>
            <p style={{ fontFamily: F, fontWeight: 300, fontSize: '14px', color: '#4A4540', lineHeight: 1.65, margin: '0 0 18px 0' }}>
              Spaced repetition for every music-theory concept: notation, terms, keys, intervals, chords, form. Drill what you don’t know. Skip what you do.
            </p>
            <div style={{ marginTop: 'auto' }}>
              <MicroFlashcard />
            </div>
          </ScrollReveal>

          {/* Card 4: Ear Training */}
          <ScrollReveal delayMs={240} className="nl-tile-hover" style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '32px' }}>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 10px 0' }}>Ear training</p>
            <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '22px', color: '#2A2318', margin: '0 0 12px 0' }}>
              Real piano audio.
            </h3>
            <p style={{ fontFamily: F, fontWeight: 300, fontSize: '14px', color: '#4A4540', lineHeight: 1.65, margin: 0 }}>
              Listen, identify, move on. Intervals, triads, cadences, scales. Train the part of musicianship a textbook can’t teach.
            </p>
          </ScrollReveal>

          {/* Card 5: Piano detection — live staff demo */}
          <ScrollReveal delayMs={320} className="nl-tile-hover" style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '32px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 10px 0' }}>Piano detection</p>
            <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '22px', color: '#2A2318', margin: '0 0 12px 0' }}>
              It hears what you play.
            </h3>
            <p style={{ fontFamily: F, fontWeight: 300, fontSize: '14px', color: '#4A4540', lineHeight: 1.65, margin: '0 0 18px 0' }}>
              Plug in any MIDI keyboard. Real-time pitch detection checks your work in practice drills — no mouse-clicking correct answers you didn’t actually play.
            </p>
            <div style={{ marginTop: 'auto' }}>
              <MicroPianoDetect />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Who it's for */}
      <section
        style={{
          background: '#FDFAF3',
          borderTop: '1px solid #EDE8DF',
          borderBottom: '1px solid #EDE8DF',
          padding: 'clamp(48px,6vw,80px) clamp(24px,4vw,48px)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 10px 0' }}>Who it’s for</p>
          <h2
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: 'clamp(28px, 3.5vw, 40px)',
              color: '#2A2318',
              letterSpacing: '-0.01em',
              margin: '0 0 40px 0',
            }}
          >
            Built for serious learners.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <ScrollReveal delayMs={0} className="nl-tile-hover" style={{ padding: '28px', border: '1px solid #DDD8CA', borderRadius: '16px', background: '#F2EDDF' }}>
              <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '20px', color: '#2A2318', margin: '0 0 10px 0' }}>Certificate of Merit students</h3>
              <p style={{ fontFamily: F, fontWeight: 300, fontSize: '14px', color: '#4A4540', lineHeight: 1.65, margin: 0 }}>
                Every level, every topic on the syllabus. Theory, terms, rhythm, aural skills — aligned to MTAC’s Level 1 through 10 requirements.
              </p>
            </ScrollReveal>
            <ScrollReveal delayMs={80} className="nl-tile-hover" style={{ padding: '28px', border: '1px solid #DDD8CA', borderRadius: '16px', background: '#F2EDDF' }}>
              <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '20px', color: '#2A2318', margin: '0 0 10px 0' }}>College music students</h3>
              <p style={{ fontFamily: F, fontWeight: 300, fontSize: '14px', color: '#4A4540', lineHeight: 1.65, margin: 0 }}>
                Fundamentals through first-year theory. A reference you can actually use mid-homework.
              </p>
            </ScrollReveal>
            <ScrollReveal delayMs={160} className="nl-tile-hover" style={{ padding: '28px', border: '1px solid #DDD8CA', borderRadius: '16px', background: '#F2EDDF' }}>
              <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '20px', color: '#2A2318', margin: '0 0 10px 0' }}>Serious adult learners</h3>
              <p style={{ fontFamily: F, fontWeight: 300, fontSize: '14px', color: '#4A4540', lineHeight: 1.65, margin: 0 }}>
                If you play an instrument and wish you understood the theory, this was built for you.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" style={{ padding: 'clamp(60px,8vw,100px) clamp(24px,4vw,48px)', position: 'relative' }}>
        <GlyphBackdrop density={6} seed={23} />
        <div style={{ maxWidth: '1040px', margin: '0 auto', position: 'relative' }}>
          <div style={{ marginBottom: '48px' }}>
            <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 10px 0' }}>Simple pricing</p>
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: 'clamp(32px, 4vw, 44px)',
                color: '#2A2318',
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              Start free. Upgrade when you need more.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Free */}
            <ScrollReveal delayMs={0} className="nl-tile-hover" style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '20px', padding: '32px' }}>
              <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A7060', margin: '0 0 12px 0' }}>Free</p>
              <div style={{ fontFamily: SERIF, fontSize: '40px', fontWeight: 300, color: '#2A2318', lineHeight: 1, marginBottom: '20px' }}>$0</div>
              {[
                'Full reference library',
                'All interactive tools',
                'Foundations flashcards (15 decks)',
                'First 2 levels of each program',
                'Interval ear training',
                'No credit card required',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: ACCENT, marginTop: '1px' }}>✓</span>
                  <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#2A2318' }}>{item}</span>
                </div>
              ))}
              <button
                onClick={() => (isSignedIn ? (window.location.href = '/') : setShowAuth(true))}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #1A1A18',
                  background: 'none',
                  fontFamily: F,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#2A2318',
                  cursor: 'pointer',
                }}
              >
                Start free
              </button>
            </ScrollReveal>

            {/* Plus (highlighted) */}
            <ScrollReveal
              delayMs={80}
              className="nl-tile-hover"
              style={{
                background: '#FDFAF3',
                border: `2px solid ${ACCENT}`,
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(186,117,23,0.12)',
              }}
            >
              <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 12px 0' }}>NoteLab Plus</p>
              <div style={{ fontFamily: SERIF, fontSize: '40px', fontWeight: 300, color: '#2A2318', lineHeight: 1 }}>
                $9.99<span style={{ fontFamily: F, fontSize: '14px', fontWeight: 400, color: '#7A7060', marginLeft: '6px' }}>/mo</span>
              </div>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#7A7060', margin: '4px 0 20px 0' }}>
                or $79/year (save 34%)
              </p>
              {[
                'Everything free, plus:',
                'All flashcard tiers (37+ decks)',
                'All programs included',
                'Full ear training library',
                'Application & Review challenges',
                'Progress tracking across all decks',
                'Cancel anytime',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: ACCENT, marginTop: '1px' }}>✓</span>
                  <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#2A2318' }}>{item}</span>
                </div>
              ))}
              <button
                onClick={() => (isSignedIn ? (window.location.href = '/pricing') : setShowAuth(true))}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#1A1A18',
                  fontFamily: F,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Start 14-day trial
              </button>
            </ScrollReveal>

            {/* Programs */}
            <ScrollReveal delayMs={160} className="nl-tile-hover" style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '20px', padding: '32px' }}>
              <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7A7060', margin: '0 0 12px 0' }}>Programs à la carte</p>
              <div style={{ fontFamily: SERIF, fontSize: '40px', fontWeight: 300, color: '#2A2318', lineHeight: 1, marginBottom: '20px' }}>$29+</div>
              {[
                'CM single level — $29',
                'CM Levels 1–5 — $99',
                'Full CM Program — $149',
                'Note Reading — $29',
                'Rhythm Reading — $29',
                'Lifetime access, no subscription',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: ACCENT, marginTop: '1px' }}>✓</span>
                  <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#2A2318' }}>{item}</span>
                </div>
              ))}
              <Link
                href="/programs"
                style={{
                  display: 'block',
                  marginTop: '20px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #1A1A18',
                  background: 'none',
                  fontFamily: F,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#2A2318',
                  textAlign: 'center',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                Browse programs
              </Link>
            </ScrollReveal>
          </div>

          <p
            style={{
              textAlign: 'center',
              fontFamily: F,
              fontSize: '13px',
              fontWeight: 300,
              color: '#7A7060',
              margin: '28px 0 0 0',
              fontStyle: 'italic',
            }}
          >
            Teachers and studios — a group plan is coming.{' '}
            <Link href="/pricing" style={{ color: ACCENT, textDecoration: 'none', fontStyle: 'normal' }}>
              Get notified →
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: 'clamp(24px,4vw,48px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo-dark.png" alt="NoteLab" style={{ height: '24px', width: 'auto', display: 'block' }} />
          <span style={{ fontFamily: F, fontSize: '15px', fontWeight: 400, letterSpacing: '0.08em', color: '#2A2318' }}>
            Note<span style={{ fontWeight: 500 }}>Lab</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/pricing" style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#7A7060', textDecoration: 'none' }}>
            Pricing
          </Link>
          <Link href="/feedback" style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#7A7060', textDecoration: 'none' }}>
            Feedback
          </Link>
          <Link href="/privacy" style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#7A7060', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 400, color: '#B8B5AD' }}>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); window.location.href = '/' }} />}
    </div>
  )
}
