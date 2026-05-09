'use client'

import s from '@/components/flashcards/library/library.module.css'
import type { HomepageContext } from './useHomepageState'
import { dayPartLabel } from './dayPartLabel'
import ProgramCard from './ProgramCard'
import MiniShelf from './MiniShelf'
import TonightsReviewDivider from './TonightsReviewDivider'

export interface TwoPaneHeroProps {
  ctx: HomepageContext
  displayName: string
}

/**
 * State 4 hero (both program enrolled and active flashcards). Single-
 * column greeting on top, then a two-pane grid: ProgramCard (mini, 3
 * modules) on the left, MiniShelf on the right. Mobile stacks the
 * panes vertically with the editorial divider between them.
 */
export default function TwoPaneHero({ ctx, displayName }: TwoPaneHeroProps) {
  const { program, activeDecks, totalDue } = ctx
  if (!program || activeDecks.length === 0) return null

  const eyebrow = dayPartLabel()
  const programLabel = program.title
  const dueClause =
    totalDue === 1 ? '1 card due tonight' : `${totalDue} cards due tonight`
  const contextLine =
    totalDue > 0
      ? `${programLabel} in progress · ${dueClause}`
      : `${programLabel} in progress · you’re caught up tonight`

  return (
    <>
      {/* Desktop — inline greeting + two-pane grid */}
      <section className={s.desktopOnly}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '56px 36px 32px',
          }}
        >
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontFamily: 'var(--font-jost), system-ui, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#a0381c',
                marginBottom: 12,
              }}
            >
              {eyebrow}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 18,
                flexWrap: 'wrap',
              }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-cormorant), serif',
                  fontSize: 38,
                  fontWeight: 500,
                  lineHeight: 1,
                  color: '#1a1208',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Welcome back,{' '}
                <em
                  style={{
                    color: '#a0381c',
                    fontStyle: 'italic',
                    fontWeight: 500,
                  }}
                >
                  {displayName}.
                </em>
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-cormorant), serif',
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: '#5a4028',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {contextLine}
              </p>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              alignItems: 'stretch',
            }}
          >
            <ProgramCard program={program} density="mini" showCta />
            <MiniShelf
              activeDecks={activeDecks}
              totalDue={totalDue}
              density="default"
            />
          </div>
        </div>
      </section>

      {/* Mobile — vertical stack: greeting → ProgramCard → divider → MiniShelf */}
      <section className={s.mobileOnly} style={{ padding: '28px 0 24px' }}>
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div
            style={{
              fontFamily: 'var(--font-jost), system-ui, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#a0381c',
              marginBottom: 10,
            }}
          >
            {eyebrow}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 36,
              fontWeight: 500,
              lineHeight: 1,
              color: '#1a1208',
              letterSpacing: '-0.02em',
              margin: '0 0 12px 0',
            }}
          >
            Welcome back,{' '}
            <em
              style={{ color: '#a0381c', fontStyle: 'italic', fontWeight: 500 }}
            >
              {displayName}.
            </em>
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontStyle: 'italic',
              fontSize: 15,
              color: '#5a4028',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {contextLine}
          </p>
        </div>
        <div style={{ margin: '0 20px' }}>
          <ProgramCard
            program={program}
            density="compact"
            rowLimit={2}
            showCta
          />
        </div>
        <div style={{ margin: '0 20px' }}>
          <TonightsReviewDivider />
        </div>
        <div style={{ margin: '0 20px' }}>
          <MiniShelf
            activeDecks={activeDecks}
            totalDue={totalDue}
            density="compact"
          />
        </div>
      </section>
    </>
  )
}
