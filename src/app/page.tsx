'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import GlyphBackdrop from '@/components/marketing/GlyphBackdrop'
import { computeRetentionSummary, type RetentionSummary } from '@/lib/programs/note-reading/progress'

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

function DayTile({
  label,
  title,
  body,
  href,
  viz,
}: TileProps & { viz?: React.ReactNode }) {
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
        {viz && <div style={{ marginTop: '10px' }}>{viz}</div>}
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

/** Horizontal progress bar (studied / total). */
function ReviewBar({ studied, total }: { studied: number; total: number }) {
  if (total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: F, fontSize: '12px', color: '#7A7060' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }} />
        You’re caught up
      </div>
    )
  }
  const pct = Math.min(100, Math.round((studied / total) * 100))
  return (
    <div>
      <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#4A4540', margin: '0 0 4px 0' }}>
        {studied} of {total} studied
      </p>
      <div className="nl-viz-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="nl-viz-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** 36px ring showing program level completion. */
function ProgramRing({ level, totalLevels, pct, label }: { level: number; totalLevels: number; pct: number; label: string }) {
  if (totalLevels === 0) {
    return <p style={{ fontFamily: F, fontSize: '12px', color: '#7A7060', margin: 0 }}>Not started</p>
  }
  const r = 14
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg className="nl-viz-ring" viewBox="0 0 36 36" aria-label={`${pct}% complete`}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="#EDE8DF" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="#B5402A"
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#4A4540' }}>
        {label} · {pct}%
      </span>
    </div>
  )
}

/** Small retention ring — mirrors ProgramRing but colours the stroke
 *  based on how well the student is holding onto earlier-module notes. */
function NoteReadingRetention({ summary }: { summary: RetentionSummary | null }) {
  if (!summary || summary.totalAnswered === 0) {
    return <p style={{ fontFamily: F, fontSize: '12px', color: '#7A7060', margin: 0 }}>No review data yet</p>
  }
  const pct = Math.round((summary.recent30Accuracy || summary.accuracy) * 100)
  const r = 14
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)
  const stroke = pct >= 90 ? '#3B6D11' : pct >= 70 ? '#B5402A' : '#A32D2D'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg className="nl-viz-ring" viewBox="0 0 36 36" aria-label={`${pct}% retention`}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="#EDE8DF" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none"
          stroke={stroke} strokeWidth="3"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#4A4540' }}>
        {pct}% retention
      </span>
    </div>
  )
}

/** 11 dots indicating visited parts of the reference library. */
function PartsDots({ visited, latestLabel }: { visited: boolean[]; latestLabel: string }) {
  return (
    <div>
      <div className="nl-viz-dots" aria-label={`${visited.filter(Boolean).length} of 11 parts visited`}>
        {visited.map((v, i) => (
          <span key={i} className={`nl-viz-dot${v ? ' nl-viz-dot--filled' : ''}`} />
        ))}
      </div>
      <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#4A4540', margin: '6px 0 0 0' }}>
        {latestLabel}
      </p>
    </div>
  )
}

/** Streak indicator for ear training. */
function StreakBadge({ days }: { days: number }) {
  if (days === 0) {
    return <p style={{ fontFamily: F, fontSize: '12px', color: '#7A7060', margin: 0 }}>Start a streak</p>
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span aria-hidden style={{ fontSize: '14px', color: '#B5402A', lineHeight: 1 }}>★</span>
      <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 500, color: '#4A4540' }}>
        {days}-day streak
      </span>
    </div>
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
  const [retention, setRetention] = useState<RetentionSummary | null>(null)

  // Redirect logged-out users to landing page.
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/landing'
    }
  }, [loading, user])

  // Avoid SSR hydration mismatch on the time-of-day greeting.
  useEffect(() => {
    setG(greeting())
    setRetention(computeRetentionSummary())
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
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, fontWeight: 300, color: '#7A7060' }}>Loading…</p>
      </div>
    )
  }
  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      <GlyphBackdrop density={3} seed={101} />
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 80px', position: 'relative' }}>
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
              viz={<ReviewBar studied={0} total={0} />}
            />
            <DayTile
              label="Current program"
              title="Pick a program"
              body="Certificate of Merit, Note Reading, or Rhythm tracks."
              href="/programs"
              viz={<ProgramRing level={0} totalLevels={0} pct={0} label="Not started" />}
            />
            <DayTile
              label="Latest reading"
              title="Open the library"
              body="110+ pages across 11 parts — dip in anywhere."
              href="/learn"
              viz={
                <PartsDots
                  visited={Array(11).fill(false)}
                  latestLabel="No sessions yet"
                />
              }
            />
            <DayTile
              label="Ear training"
              title="Try a session"
              body="Listen and identify intervals, triads, cadences, scales."
              href="/ear-training"
              viz={<StreakBadge days={0} />}
            />
            <DayTile
              label="Note reading retention"
              title={retention && retention.totalAnswered > 0 ? 'Refresh your skills' : 'Start note reading'}
              body={retention && retention.totalAnswered > 0
                ? 'Review questions from completed modules track how well your note knowledge is sticking.'
                : 'Build note-reading fluency — retention appears here once you complete a module.'}
              href="/programs/note-reading"
              viz={<NoteReadingRetention summary={retention} />}
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
