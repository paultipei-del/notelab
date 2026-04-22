'use client'

import Link from 'next/link'
import { Deck } from '@/lib/types'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const BRAVURA = 'Bravura, serif'
const ACCENT = '#B5402A'

// Per-deck Bravura glyph — tiny score-font icon that signals the deck's
// topic at a glance while staying consistent with the rest of the app's
// score-rendering aesthetic.
function deckGlyph(id: string): string {
  if (id === 'dynamics' || id === 'symbols-dynamics')  return '' // f
  if (id === 'tempo')                                  return '' // quarter note
  if (id === 'intervals')                              return '' // treble clef
  if (id === 'symbols-articulations')                  return '' // accent
  if (id === 'symbols-clefs')                          return '' // treble clef
  if (id === 'symbols-repeats')                        return '' // segno
  if (id === 'symbols-ornaments')                      return '' // turn
  if (id === 'symbols-accidentals')                    return '' // sharp
  if (id === 'symbols-note-values')                    return '' // half note
  return ''                                                      // whole notehead fallback
}

export type FlashcardsHubProps =
  | {
      /** Only flashcard groups — used on `/flashcards`. */
      showPrograms: false
      notationDecks: Deck[]
      /** Each `symbols-*` deck as its own card (not the symbols collection hub). */
      symbolDecks: Deck[]
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
      /** When set, each symbols deck is listed; otherwise omit or pass `[]`. */
      symbolDecks?: Deck[]
      cmCount: number
      cmUnlocked: boolean
      checkingOut: boolean
      onUnlockCm: () => void
      flashcardsHeadingVariant?: 'section' | 'page'
    }

/** Programs (CM) + Flashcards sections — same content as the lower half of the home page. */
export default function FlashcardsHub(props: FlashcardsHubProps) {
  const { notationDecks } = props
  const symbolDecks = 'symbolDecks' in props && props.symbolDecks ? props.symbolDecks : []
  const cm =
    props.showPrograms === false
      ? null
      : (props as Extract<FlashcardsHubProps, { cmCount: number }>)
  const flashcardsHeadingVariant = props.flashcardsHeadingVariant ?? 'section'
  const flashcardsPageHero = flashcardsHeadingVariant === 'page'
  const groupLabelStyle = {
    fontFamily: F,
    fontSize: 'var(--nl-text-compact)' as const,
    fontWeight: 400 as const,
    letterSpacing: flashcardsPageHero ? ('0.12em' as const) : ('0.1em' as const),
    textTransform: 'uppercase' as const,
    color: '#7A7060',
    marginBottom: flashcardsPageHero ? '16px' : '10px',
  }

  return (
    <>
      {cm && (
      <div style={{ marginBottom: '64px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#2A2318', marginBottom: '4px' }}>Programs</h2>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>Structured exam prep collections</p>
        </div>
        <div
          className="nl-program-banner"
          style={{ background: '#1A1A18', border: '1px solid #1A1A18', borderRadius: '16px', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Link href="/programs" style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0, marginRight: '24px' }}>
            <span style={{ display: 'inline-block', fontSize: 'var(--nl-text-badge)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '20px', marginBottom: '12px', background: '#B5402A', color: 'white', fontFamily: F }}>
              {cm.cmUnlocked ? 'Unlocked' : 'CM Collection'}
            </span>
            <h3 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '24px', color: 'white', marginBottom: '6px' }}>
              Certificate of Merit — Prep through Advanced
            </h3>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '480px', margin: 0 }}>
              {cm.cmCount} levels of complete exam prep — signs & terms, scales, intervals, chords, history, and ear training.
            </p>
          </Link>
          <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
            {cm.cmUnlocked ? (
              <Link href="/programs" style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#B5402A', textDecoration: 'none' }}>Browse →</Link>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => cm.onUnlockCm()}
                  disabled={cm.checkingOut}
                  style={{ display: 'block', background: '#B5402A', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer', marginBottom: '8px', whiteSpace: 'nowrap' as const }}>
                  {cm.checkingOut ? 'Loading…' : 'Unlock Bundle'}
                </button>
                <Link href="/programs" style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>or browse locked levels →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <div style={{ marginBottom: '64px' }}>
        <div style={{ marginBottom: flashcardsPageHero ? '32px' : '24px' }}>
          {flashcardsPageHero ? (
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#2A2318', marginBottom: '12px', letterSpacing: '0.02em' }}>Flashcards</h1>
          ) : (
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#2A2318', marginBottom: '4px' }}>Flashcards</h2>
          )}
          <p
            style={{
              fontFamily: F,
              fontSize: flashcardsPageHero ? '15px' : '13px',
              fontWeight: 300,
              color: '#7A7060',
              lineHeight: flashcardsPageHero ? 1.7 : undefined,
              maxWidth: flashcardsPageHero ? '560px' : undefined,
              margin: 0,
            }}
          >
            Spaced repetition collections for terms, symbols, and notation
          </p>
        </div>

        <p style={groupLabelStyle}>Notation &amp; Terms</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginBottom: '28px', alignItems: 'stretch' }}>
          {notationDecks.map(deck => (
            <Link key={deck.id} href={`/study/${deck.id}`} style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
              <div
                className="nl-card-surface"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'flex-start' as const,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', marginBottom: '10px' }}>
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060' }}>{deck.cards.length} cards</span>
                </div>
                <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '24px', color: '#1A1A18', marginBottom: '8px', width: '100%', letterSpacing: '0.01em' }}>{deck.title}</h3>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', lineHeight: 1.55, flex: 1, margin: 0, width: '100%', marginBottom: '14px' }}>{deck.description}</p>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 500, color: ACCENT, alignSelf: 'flex-end' }}>Start →</span>
              </div>
            </Link>
          ))}
        </div>

        {symbolDecks.length > 0 && (
          <>
            <p style={groupLabelStyle}>Music symbols</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginBottom: '28px', alignItems: 'stretch' }}>
              {symbolDecks.map(deck => (
                <Link key={deck.id} href={`/study/${deck.id}`} style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
                  <div
                    className="nl-card-surface"
                    style={{
                      padding: '24px',
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column' as const,
                      alignItems: 'flex-start' as const,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', marginBottom: '10px' }}>
                      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060' }}>{deck.cards.length} cards</span>
                    </div>
                    <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: '24px', color: '#1A1A18', marginBottom: '8px', width: '100%', letterSpacing: '0.01em' }}>{deck.title}</h3>
                    <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', lineHeight: 1.55, flex: 1, margin: 0, width: '100%', marginBottom: '14px' }}>{deck.description}</p>
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 500, color: ACCENT, alignSelf: 'flex-end' }}>Start →</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
