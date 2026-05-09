'use client'

import Link from 'next/link'
import s from '@/components/flashcards/library/library.module.css'
import type { HomepageContext } from './useHomepageState'
import { dayPartLabel } from './dayPartLabel'
import ProgramCard from './ProgramCard'

export interface ProgramHeroProps {
  ctx: HomepageContext
  displayName: string
}

export default function ProgramHero({ ctx, displayName }: ProgramHeroProps) {
  const { program } = ctx
  if (!program) return null
  const eyebrow = dayPartLabel()
  const next = program.next
  const nextHref = next?.href ?? '/programs'
  const nextLabel = next ? shortNextLabel(next.title) : null

  const contextLine = next ? (
    <>
      You&rsquo;re{' '}
      <strong style={{ fontWeight: 600, color: '#1a1208' }}>
        {program.doneCount} of {program.totalModules} modules
      </strong>{' '}
      into {program.title}.
      {nextLabel && (
        <>
          {' '}
          <em style={{ fontStyle: 'italic' }}>{nextLabel}</em> is up next.
        </>
      )}
    </>
  ) : (
    <>
      You&rsquo;ve completed every module of {program.title}. Browse the{' '}
      curriculum for what&rsquo;s next.
    </>
  )

  return (
    <>
      {/* Desktop — two-column hero */}
      <section className={s.desktopOnly}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr minmax(420px, 1fr)',
            gap: 56,
            alignItems: 'flex-start',
            padding: '56px 36px 32px',
            maxWidth: 1240,
            margin: '0 auto',
          }}
        >
          <div style={{ minWidth: 0, paddingTop: 24 }}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Greeting displayName={displayName} size="desktop" />
            <Context size="desktop">{contextLine}</Context>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <Link
                href={nextHref}
                style={{
                  display: 'inline-block',
                  padding: '12px 22px',
                  borderRadius: 6,
                  background: '#1a1208',
                  color: '#f0e7d0',
                  fontFamily: 'var(--font-cormorant), serif',
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                {next ? `Continue ${nextLabel} →` : 'Browse programs →'}
              </Link>
              <Link
                href="/programs"
                style={{
                  fontFamily: 'var(--font-cormorant), serif',
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: '#a0381c',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(160, 56, 28, 0.3)',
                  paddingBottom: 1,
                }}
              >
                View full level
              </Link>
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <ProgramCard program={program} density="default" />
          </div>
        </div>
      </section>

      {/* Mobile — stacked. CTA lives inside the card, not in hero text. */}
      <section className={s.mobileOnly} style={{ padding: '28px 0 24px' }}>
        <div style={{ padding: '0 20px' }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Greeting displayName={displayName} size="mobile" />
          <Context size="mobile">{contextLine}</Context>
        </div>
        <div style={{ margin: '0 20px' }}>
          <ProgramCard program={program} density="compact" showCta />
        </div>
      </section>
    </>
  )
}

function shortNextLabel(title: string): string {
  return title
    .replace(/^Lesson\s+[^—]+—\s+/, '')
    .replace(/^Module\s+\d+\s*—\s*/, '')
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-jost), system-ui, sans-serif',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: '#a0381c',
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  )
}

function Greeting({
  displayName,
  size,
}: {
  displayName: string
  size: 'desktop' | 'mobile'
}) {
  const isDesktop = size === 'desktop'
  return (
    <h1
      style={{
        fontFamily: 'var(--font-cormorant), serif',
        fontSize: isDesktop ? 48 : 36,
        fontWeight: 500,
        lineHeight: 1,
        color: '#1a1208',
        letterSpacing: '-0.02em',
        margin: isDesktop ? '0 0 18px 0' : '0 0 14px 0',
      }}
    >
      Welcome back,{isDesktop ? <br /> : ' '}
      <em style={{ color: '#a0381c', fontStyle: 'italic', fontWeight: 500 }}>
        {displayName}.
      </em>
    </h1>
  )
}

function Context({
  size,
  children,
}: {
  size: 'desktop' | 'mobile'
  children: React.ReactNode
}) {
  const isDesktop = size === 'desktop'
  return (
    <p
      style={{
        fontFamily: 'var(--font-cormorant), serif',
        fontSize: isDesktop ? 17 : 15,
        lineHeight: isDesktop ? 1.5 : 1.45,
        color: '#5a4028',
        maxWidth: isDesktop ? 460 : undefined,
        margin: isDesktop ? '0 0 24px 0' : '0 0 20px 0',
      }}
    >
      {children}
    </p>
  )
}
