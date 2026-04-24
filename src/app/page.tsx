'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#B5402A'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

type ResumeTarget = {
  label: string
  href: string
  line: string
}

/**
 * Stub resume logic. In a future pass we'll wire this to actual
 * session telemetry (last deck studied / last learn page read / last
 * program level). For now we return a generic "ready to pick up"
 * invitation — which also covers brand-new users.
 */
function useResumeTarget(): ResumeTarget {
  return {
    label: 'Continue',
    href: '/learn',
    line: 'Ready to pick up where you left off?',
  }
}

type TileProps = {
  label: string
  title: string
  body: string
  href: string
}

function DayTile({ label, title, body, href }: TileProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        className="nl-card-surface nl-card-surface--tight"
        style={{
          padding: '20px 22px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontFamily: F,
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#7A7060',
          }}
        >
          {label}
        </span>
        <p style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '20px', color: '#1A1A18', margin: '4px 0 2px 0', letterSpacing: '0.01em' }}>
          {title}
        </p>
        <p style={{ fontFamily: F, fontWeight: 300, fontSize: '13px', color: '#7A7060', lineHeight: 1.6, margin: 0 }}>
          {body}
        </p>
        <span
          style={{
            fontFamily: F,
            fontSize: '13px',
            fontWeight: 500,
            color: ACCENT,
            marginTop: 'auto',
            paddingTop: '10px',
          }}
        >
          →
        </span>
      </div>
    </Link>
  )
}

function ExploreTile({ label, title, body, href }: TileProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        className="nl-card-surface"
        style={{
          padding: '28px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: F,
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: ACCENT,
          }}
        >
          {label}
        </span>
        <h3
          style={{
            fontFamily: SERIF,
            fontWeight: 400,
            fontSize: '22px',
            color: '#2A2318',
            margin: '4px 0 4px 0',
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </h3>
        <p style={{ fontFamily: F, fontWeight: 300, fontSize: '14px', color: '#4A4540', lineHeight: 1.65, margin: 0 }}>
          {body}
        </p>
        <span
          style={{
            fontFamily: F,
            fontSize: '14px',
            fontWeight: 500,
            color: ACCENT,
            marginTop: 'auto',
            paddingTop: '12px',
          }}
        >
          Open →
        </span>
      </div>
    </Link>
  )
}

export default function Home() {
  const { user, loading } = useAuth()
  const [g, setG] = useState('')

  // Redirect logged-out users to landing page.
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/landing'
    }
  }, [loading, user])

  // Avoid SSR hydration mismatch on the time-of-day greeting.
  useEffect(() => {
    setG(greeting())
  }, [])

  const resume = useResumeTarget()

  // Plus-plan check. While FREE_NOW is active `useFeatureAccess` always
  // returns hasAccess, so we use the `requiredPlan` to determine whether
  // to show the upgrade strip. Once gating activates, this will map to
  // the user's actual plan.
  const plusCheck = useFeatureAccess('flashcards:intermediate')
  // If requiredPlan === 'free', user wouldn't need Plus. If it's 'plus',
  // upgrade strip shows. Logic below.
  const showUpgradeStrip = plusCheck.requiredPlan === 'plus'

  const displayName: string = (user?.user_metadata?.display_name as string | undefined)?.split(' ')[0]
    ?? (user?.email ? user.email.split('@')[0] : 'there')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      </div>
    )
  }
  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 80px' }}>
        {/* Greeting */}
        <header style={{ marginBottom: '28px' }}>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: 'clamp(32px, 4.5vw, 48px)',
              color: '#2A2318',
              letterSpacing: '-0.01em',
              margin: '0 0 8px 0',
            }}
          >
            {g || 'Welcome'}, {displayName}.
          </h1>
          <p
            style={{
              fontFamily: F,
              fontWeight: 300,
              fontSize: '16px',
              color: '#7A7060',
              lineHeight: 1.6,
              margin: '0 0 20px 0',
            }}
          >
            {resume.line}
          </p>
          <Link
            href={resume.href}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: '10px',
              background: '#1A1A18',
              color: 'white',
              textDecoration: 'none',
              fontFamily: F,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {resume.label} →
          </Link>
        </header>

        {/* Your day */}
        <section style={{ marginTop: '48px', marginBottom: '48px' }}>
          <p
            style={{
              fontFamily: F,
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#7A7060',
              margin: '0 0 14px 0',
            }}
          >
            Your day
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            <DayTile
              label="Due for review"
              title="Start a session"
              body="Work through SRS cards across your active decks."
              href="/flashcards"
            />
            <DayTile
              label="Current program"
              title="Pick a program"
              body="Certificate of Merit, Note Reading, or Rhythm tracks."
              href="/programs"
            />
            <DayTile
              label="Latest reading"
              title="Open the library"
              body="110+ pages across 11 parts — dip in anywhere."
              href="/learn"
            />
            <DayTile
              label="Ear training"
              title="Try a session"
              body="Listen and identify intervals, triads, cadences, scales."
              href="/ear-training"
            />
          </div>
        </section>

        {/* Explore */}
        <section>
          <p
            style={{
              fontFamily: F,
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#7A7060',
              margin: '0 0 14px 0',
            }}
          >
            Explore
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            <ExploreTile
              label="Reference"
              title="Learn"
              body="The 11-part library — sound, notation, rhythm, harmony, form, and more."
              href="/learn"
            />
            <ExploreTile
              label="Curriculum"
              title="Programs"
              body="Curriculum tracks: Certificate of Merit, Note Reading, Rhythm."
              href="/programs"
            />
            <ExploreTile
              label="Practice"
              title="Flashcards"
              body="37+ spaced-repetition decks for every theory topic."
              href="/flashcards"
            />
            <ExploreTile
              label="Listening"
              title="Ear Training"
              body="Train your ear with real piano audio — listen and identify."
              href="/ear-training"
            />
          </div>
        </section>

        {/* Upgrade prompt (only on Free) */}
        {showUpgradeStrip && (
          <section
            style={{
              marginTop: '56px',
              padding: '24px 28px',
              background: '#FDFAF3',
              border: '1px solid #DDD8CA',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 260px', minWidth: '260px' }}>
              <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 4px 0' }}>
                You’re on the Free plan
              </p>
              <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 400, color: '#2A2318', lineHeight: 1.6, margin: 0 }}>
                NoteLab Plus unlocks all programs, all flashcards, and the full ear training library.
              </p>
            </div>
            <Link
              href="/pricing"
              style={{
                fontFamily: F,
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                background: '#1A1A18',
                padding: '10px 20px',
                borderRadius: '10px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Try Plus free for 14 days →
            </Link>
          </section>
        )}
      </div>
    </div>
  )
}
