'use client'

import Link from 'next/link'
import { DECKS, CM_BUNDLE_PRICE_ID } from '@/lib/decks'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const cmDecks = DECKS.filter(d => d.tag === 'cm')

const PROGRAMS = [
  {
    id: 'cm',
    href: '/programs/cm',
    title: 'Certificate of Merit',
    subtitle: 'CM — California',
    description: 'Complete theory exam preparation from Preparatory through Advanced. Covers signs & terms, scales, intervals, chords, history, and ear training.',
    levels: `${cmDecks.length} levels`,
    priceId: CM_BUNDLE_PRICE_ID,
    glyph: 'CM',
    accent: { bg: 'rgba(186,117,23,0.2)', text: '#E8A84A', border: 'rgba(186,117,23,0.3)', ctaBg: 'rgba(186,117,23,0.15)', gradientGlyphColor: 'rgba(186,117,23,0.14)', gradient: 'linear-gradient(145deg, #0A0A08 0%, #1E1A10 50%, #2E2618 100%)' },
  },
  {
    id: 'note-reading',
    href: '/programs/note-reading',
    title: 'Note Reading',
    subtitle: 'Staff & Sight-Reading',
    description: 'Eight modules — treble, bass, and grand staff — built for college music students and serious adult learners. Pairs note identification with pitch detection.',
    levels: '8 modules',
    priceId: null,
    glyph: '𝄞',
    accent: { bg: 'rgba(59,109,17,0.22)', text: '#7DC44E', border: 'rgba(59,109,17,0.35)', ctaBg: 'rgba(59,109,17,0.15)', gradientGlyphColor: 'rgba(59,109,17,0.14)', gradient: 'linear-gradient(145deg, #060A04 0%, #101A08 50%, #182510 100%)' },
  },
]

export default function ProgramsPage() {
  const { user } = useAuth()
  const { hasPurchased, hasSubscription } = usePurchases(user?.id ?? null)

  function isUnlocked(priceId: string) {
    return hasSubscription() || hasPurchased(priceId)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 80px' }}>

        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '12px' }}>Programs</p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#2A2318', marginBottom: '10px', letterSpacing: '0.02em' }}>
            Curriculum-aligned programs
          </h1>
          <p style={{ fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#7A7060', maxWidth: '480px', lineHeight: 1.7 }}>
            Complete flashcard programs built around real curricula — Certificate of Merit and college first-year music theory, each self-contained with everything you need.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
          {PROGRAMS.map(prog => {
            const unlocked = prog.priceId ? isUnlocked(prog.priceId) : hasSubscription()
            const a = prog.accent
            return (
              <Link key={prog.id} href={prog.href} style={{ textDecoration: 'none', borderRadius: '20px', display: 'block' }}>
                <div
                  className="nl-cat-tile-inner"
                  style={{
                    background: '#1A1A18',
                    border: '1px solid #2E2E2C',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 14px 40px rgba(0,0,0,0.22)',
                    transition: 'transform 0.24s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.24s cubic-bezier(0.33, 1, 0.68, 1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)'
                    e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.45), 0 28px 72px rgba(0,0,0,0.28)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35), 0 14px 40px rgba(0,0,0,0.22)'
                  }}
                >
                  {/* Text side */}
                  <div style={{ flex: 1, padding: '36px 40px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
                    <span style={{ display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-badge)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '4px 10px', borderRadius: '20px', background: a.bg, color: a.text, marginBottom: '14px', width: 'fit-content' }}>
                      {unlocked ? 'Unlocked' : prog.levels}
                    </span>
                    <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(30px, 3.2vw, 42px)', color: 'white', marginBottom: '12px', letterSpacing: '0.01em', lineHeight: 1.05 }}>
                      {prog.title}
                    </h2>
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: '24px', maxWidth: '380px' }}>
                      {prog.description}
                    </p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.05em', color: a.text, padding: '7px 16px', borderRadius: '20px', background: a.ctaBg, border: `1px solid ${a.border}`, width: 'fit-content' }}>
                      {unlocked ? 'Browse levels →' : 'View program →'}
                    </span>
                  </div>

                  {/* Gradient side */}
                  <div
                    className="nl-cat-tile-gradient"
                    style={{
                      background: a.gradient,
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span aria-hidden="true" style={{ fontFamily: SERIF, fontSize: prog.id === 'note-reading' ? '180px' : '140px', fontWeight: 300, color: a.gradientGlyphColor, lineHeight: 1, userSelect: 'none' as const, pointerEvents: 'none' as const, letterSpacing: '-0.04em' }}>
                      {prog.glyph}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  )
}
