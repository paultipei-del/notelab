'use client'

import s from '@/components/flashcards/library/library.module.css'
import { dayPartLabel } from './dayPartLabel'
import ProgramTile from './ProgramTile'
import { getCMPrepTileMeta } from './programAdapters/cmPrep'
import { getNoteReadingTileMeta } from './programAdapters/noteReading'
import { getRhythmTileMeta } from './programAdapters/rhythm'

/**
 * State 1 (new user) hero. Single-column full-width hero with a
 * 3-tile program grid below. Tile order is hardcoded here (CM, Note
 * Reading, Rhythm) — not driven by adapter list order — so it stays
 * stable as adapters come and go.
 */
export default function NewUserHero({ displayName }: { displayName: string }) {
  const eyebrow = dayPartLabel()
  const tiles = [
    getCMPrepTileMeta(),
    getNoteReadingTileMeta(),
    getRhythmTileMeta(),
  ]

  return (
    <>
      {/* Desktop */}
      <section className={s.desktopOnly}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '64px 36px 32px',
          }}
        >
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
            Welcome to NoteLab · {eyebrow}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 48,
              fontWeight: 500,
              lineHeight: 1,
              color: '#1a1208',
              letterSpacing: '-0.02em',
              margin: '0 0 18px 0',
            }}
          >
            Where would you like to{' '}
            <em
              style={{ color: '#a0381c', fontStyle: 'italic', fontWeight: 500 }}
            >
              begin
            </em>
            ,{' '}
            <em
              style={{ color: '#a0381c', fontStyle: 'italic', fontWeight: 500 }}
            >
              {displayName}
            </em>
            ?
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 17,
              lineHeight: 1.5,
              color: '#5a4028',
              maxWidth: 640,
              margin: '0 0 32px 0',
            }}
          >
            Choose a program for a structured path, or jump straight into
            flashcards or ear training. You can mix all three later.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              alignItems: 'stretch',
            }}
          >
            {tiles.map(t => (
              <ProgramTile key={t.programId} tile={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Mobile */}
      <section className={s.mobileOnly} style={{ padding: '32px 0 24px' }}>
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
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
            Welcome to NoteLab
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 36,
              fontWeight: 500,
              lineHeight: 1.05,
              color: '#1a1208',
              letterSpacing: '-0.02em',
              margin: '0 0 14px 0',
            }}
          >
            Where would you like to{' '}
            <em
              style={{ color: '#a0381c', fontStyle: 'italic', fontWeight: 500 }}
            >
              begin
            </em>
            ?
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 15,
              lineHeight: 1.45,
              color: '#5a4028',
              margin: 0,
            }}
          >
            Pick a program, or jump straight into flashcards or ear training.
            You can mix all three later.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '0 20px',
          }}
        >
          {tiles.map(t => (
            <ProgramTile key={t.programId} tile={t} />
          ))}
        </div>
      </section>
    </>
  )
}
