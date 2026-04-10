'use client'

import Link from 'next/link'
import { Deck } from '@/lib/types'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export type FlashcardsHubProps =
  | {
      /** Only flashcard groups — used on `/flashcards`. */
      showPrograms: false
      notationDecks: Deck[]
      earDecks: Deck[]
      /**
       * `page` — same title + intro sizes as `/collection?tag=ear` hero.
       * `section` (default) — smaller heading for the home page under Tools / Programs.
       */
      flashcardsHeadingVariant?: 'section' | 'page'
    }
  | {
      /** Home: Programs (CM) + Flashcards. */
      showPrograms?: true
      notationDecks: Deck[]
      earDecks: Deck[]
      cmCount: number
      cmUnlocked: boolean
      checkingOut: boolean
      onUnlockCm: () => void
      flashcardsHeadingVariant?: 'section' | 'page'
    }

/** Programs (CM) + Flashcards sections — same content as the lower half of the home page. */
export default function FlashcardsHub(props: FlashcardsHubProps) {
  const { notationDecks, earDecks } = props
  const cm =
    props.showPrograms === false
      ? null
      : (props as Extract<FlashcardsHubProps, { cmCount: number }>)
  const flashcardsHeadingVariant = props.flashcardsHeadingVariant ?? 'section'
  const flashcardsPageHero = flashcardsHeadingVariant === 'page'
  const groupLabelStyle = {
    fontFamily: F,
    fontSize: '11px' as const,
    fontWeight: 400 as const,
    letterSpacing: flashcardsPageHero ? ('0.12em' as const) : ('0.1em' as const),
    textTransform: 'uppercase' as const,
    color: '#888780',
    marginBottom: flashcardsPageHero ? '16px' : '10px',
  }

  return (
    <>
      {cm && (
      <div style={{ marginBottom: '64px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#1A1A18', marginBottom: '4px' }}>Programs</h2>
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>Structured exam prep collections</p>
        </div>
        <div
          style={{ background: '#1A1A18', border: '1px solid #1A1A18', borderRadius: '16px', padding: '28px 32px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.92' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <Link href="/programs" style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0, marginRight: '24px' }}>
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '20px', marginBottom: '12px', background: '#BA7517', color: 'white', fontFamily: F }}>
              {cm.cmUnlocked ? 'Unlocked' : 'CM Collection'}
            </span>
            <h3 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '24px', color: 'white', marginBottom: '6px' }}>
              Certificate of Merit — Prep through Advanced
            </h3>
            <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '480px', margin: 0 }}>
              {cm.cmCount} levels of complete exam prep — signs & terms, scales, intervals, chords, history, and ear training.
            </p>
          </Link>
          <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
            {cm.cmUnlocked ? (
              <Link href="/programs" style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#BA7517', textDecoration: 'none' }}>Browse →</Link>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => cm.onUnlockCm()}
                  disabled={cm.checkingOut}
                  style={{ display: 'block', background: '#BA7517', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer', marginBottom: '8px', whiteSpace: 'nowrap' as const }}>
                  {cm.checkingOut ? 'Loading…' : 'Unlock Bundle'}
                </button>
                <Link href="/programs" style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>or browse locked levels →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <div style={{ marginBottom: '64px' }}>
        <div style={{ marginBottom: flashcardsPageHero ? '32px' : '24px' }}>
          {flashcardsPageHero ? (
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#1A1A18', marginBottom: '12px', letterSpacing: '0.02em' }}>Flashcards</h1>
          ) : (
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#1A1A18', marginBottom: '4px' }}>Flashcards</h2>
          )}
          <p
            style={{
              fontFamily: F,
              fontSize: flashcardsPageHero ? '15px' : '13px',
              fontWeight: 300,
              color: '#888780',
              lineHeight: flashcardsPageHero ? 1.7 : undefined,
              maxWidth: flashcardsPageHero ? '560px' : undefined,
              margin: 0,
            }}
          >
            Spaced repetition collections for terms, symbols, and ear training
          </p>
        </div>

        <p style={groupLabelStyle}>Notation &amp; Terms</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginBottom: '28px', alignItems: 'stretch' }}>
          {notationDecks.map(deck => (
            <Link key={deck.id} href={`/study/${deck.id}`} style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
              <div
                style={{
                  background: 'white',
                  border: '1px solid #D3D1C7',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box' as const,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'flex-start' as const,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7' }}
              >
                <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '20px', marginBottom: '12px', background: '#E1F5EE', color: '#0F6E56', fontFamily: F, width: 'fit-content' }}>Free</span>
                <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '8px', width: '100%' }}>{deck.title}</h3>
                <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', lineHeight: 1.55, flex: 1, margin: 0, width: '100%' }}>{deck.description}</p>
              </div>
            </Link>
          ))}
          <Link href="/collection?tag=symbols" style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
            <div
              style={{
                background: 'white',
                border: '1px solid #D3D1C7',
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box' as const,
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'flex-start' as const,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7' }}
            >
              <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '20px', marginBottom: '12px', background: '#E1F5EE', color: '#0F6E56', fontFamily: F, width: 'fit-content' }}>Free</span>
              <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '8px', width: '100%' }}>Music Symbols</h3>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', lineHeight: 1.55, flex: 1, margin: 0, width: '100%' }}>Dynamics, articulation, accidentals, note values</p>
            </div>
          </Link>
        </div>

        <p style={groupLabelStyle}>Ear Training</p>
        <Link href="/collection?tag=ear" style={{ textDecoration: 'none', display: 'block', marginBottom: '28px' }}>
          <div
            style={{
              background: 'white',
              border: '1px solid #D3D1C7',
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxSizing: 'border-box' as const,
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'flex-start' as const,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7' }}
          >
            <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '20px', marginBottom: '12px', background: '#E1F5EE', color: '#0F6E56', fontFamily: F, width: 'fit-content' }}>Free</span>
            <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '8px', width: '100%' }}>Ear Training Library</h3>
            <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', lineHeight: 1.55, margin: 0, maxWidth: '560px' }}>
              {earDecks.length} piano-audio topics — intervals, triads, seventh chords, cadences, scales, and more — organized by topic on the next page.
            </p>
            <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#BA7517', margin: '14px 0 0', lineHeight: 1.55 }}>Open Ear Training →</p>
          </div>
        </Link>
      </div>
    </>
  )
}
