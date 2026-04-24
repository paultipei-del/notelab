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
    priceLine: '11 levels · From $29 per level · Full program $199',
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
  {
    id: 'rhythm',
    href: '/programs/rhythm',
    title: 'Rhythm Reading',
    subtitle: 'Three structured programs',
    description: 'Fundamentals, Personal Practice, and Conservatory Prep — 356 progressive exercises from basic note values through mixed meter and polyrhythm. Tap along with the metronome.',
    levels: '356 exercises',
    priceId: null,
    free: true,
    glyph: '𝄩',
    accent: { bg: 'rgba(59,97,181,0.22)', text: '#7DA8E8', border: 'rgba(59,97,181,0.35)', ctaBg: 'rgba(59,97,181,0.15)', gradientGlyphColor: 'rgba(59,97,181,0.14)', gradient: 'linear-gradient(145deg, #040610 0%, #080E1E 50%, #101828 100%)' },
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
            const isFree = !!(prog as { free?: boolean }).free
            const unlocked = isFree ? true : prog.priceId ? isUnlocked(prog.priceId) : hasSubscription()
            // Uppercase tag label: CM always shows "PROGRAM" (commerce
            // surface); free programs show "FREE"; unlocked subscribed ones
            // show "INCLUDED"; otherwise "LOCKED". Mirrors the tag styling
            // used on flashcards tier headings.
            const tagLabel = prog.id === 'cm'
              ? 'Program'
              : isFree ? 'Free'
              : unlocked ? 'Included'
              : 'Locked'
            // Right-side decorative glyph.
            const glyph = prog.id === 'cm' ? '♫♪'
              : prog.id === 'note-reading' ? '𝄞'
              : '♩♪♩♬'
            const cta = prog.id === 'cm' ? 'View program →' : unlocked ? 'Browse levels →' : 'View program →'

            return (
              <Link key={prog.id} href={prog.href} style={{ textDecoration: 'none', borderRadius: '16px', display: 'block' }}>
                <div
                  className="nl-tile-hover"
                  style={{
                    background: '#FDFAF3',
                    border: '1px solid #DDD8CA',
                    borderRadius: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 320px)',
                    minHeight: '240px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.65) inset, 0 2px 6px rgba(26,26,24,0.05), 0 10px 28px rgba(26,26,24,0.07)',
                  }}
                >
                  {/* Text side */}
                  <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontFamily: F,
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase' as const,
                        color: tagLabel === 'Locked' ? '#B5402A' : '#7A7060',
                        marginBottom: '10px',
                        width: 'fit-content',
                      }}
                    >
                      {tagLabel}
                    </span>
                    <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(26px, 3vw, 34px)', color: '#1A1A18', marginBottom: '10px', letterSpacing: '0.01em', lineHeight: 1.1 }}>
                      {prog.title}
                    </h2>
                    <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 400, color: '#4A4540', lineHeight: 1.65, marginBottom: (prog as { priceLine?: string }).priceLine ? '8px' : '18px', maxWidth: '420px' }}>
                      {prog.description}
                    </p>
                    {(prog as { priceLine?: string }).priceLine && (
                      <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#7A7060', letterSpacing: '0.02em', marginBottom: '18px' }}>
                        {(prog as { priceLine?: string }).priceLine}
                      </p>
                    )}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontFamily: F,
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'white',
                        background: '#1A1A18',
                        padding: '9px 18px',
                        borderRadius: '10px',
                        width: 'fit-content',
                      }}
                    >
                      {cta}
                    </span>
                  </div>

                  {/* Decorative side — same cream background, single faint glyph */}
                  <div
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        fontFamily: prog.id === 'note-reading' ? SERIF : 'Bravura, serif',
                        fontSize: prog.id === 'note-reading' ? '180px' : '120px',
                        fontWeight: 300,
                        color: '#2A2318',
                        opacity: 0.08,
                        lineHeight: 1,
                        userSelect: 'none' as const,
                        pointerEvents: 'none' as const,
                        letterSpacing: '-0.04em',
                      }}
                    >
                      {glyph}
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
