'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DECKS, deckRequiresPurchase, CM_BUNDLE_PRICE_ID, PRO_PRICE_ID } from '@/lib/decks'
import { Deck, DeckTag } from '@/lib/types'
import { loadUserDecks, createDeck } from '@/lib/userDecks'
import DeckEditor from '@/components/DeckEditor'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import { signOut } from '@/lib/auth'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const TOOLS = [
  {
    href: '/sight-read',
    title: 'Staff Recognition',
    desc: 'Play notes on your piano as they appear on the staff. Treble, bass, and grand staff.',
    badge: 'Free + Pro',
    cta: 'Practice →',
  },
  {
    href: '/note-id',
    title: 'Note Identification',
    desc: 'Identify notes by name using letter buttons or a piano keyboard.',
    badge: 'Free + Pro',
    cta: 'Practice →',
  },
  {
    href: '/key-signatures',
    title: 'Key Signatures',
    desc: 'Circle of fifths explorer, staff drill, historical Affekt, and key ID quiz.',
    badge: 'Free',
    cta: 'Explore →',
  },
  {
    href: '/scale-builder',
    title: 'Scale Builder',
    desc: 'Build major and minor scales from any root using whole and half steps.',
    badge: 'Free',
    cta: 'Build →',
  },
  {
    href: '/glossary',
    title: 'Glossary',
    desc: 'Searchable reference of musical terms — French, German, Italian, abbreviations.',
    badge: 'Free',
    cta: 'Browse →',
  },
]

export default function Home() {
  // Early access gate
  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('nl-access='))
    if (!cookie) window.location.href = '/unlock'
  }, [])

  const { user, loading } = useAuth()
  const { hasPurchased, hasSubscription } = usePurchases(user?.id ?? null)
  const [userDecks, setUserDecks] = useState<Deck[]>([])
  const [decksLoading, setDecksLoading] = useState(true)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTag, setNewTag] = useState<DeckTag>('free')

  useEffect(() => {
    if (loading) return
    setDecksLoading(true)
    if (user) localStorage.removeItem('notelab-user-decks')
    loadUserDecks(user?.id ?? null).then(decks => {
      setUserDecks(decks)
      setDecksLoading(false)
    })
  }, [user, loading])

  async function handleBuy(priceId: string, productType: string) {
    if (!user) { setShowAuth(true); return }
    setCheckingOut(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, userEmail: user.email, productType }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error(err)
      setCheckingOut(false)
    }
  }

  async function handleCreateDeck() {
    if (!newTitle.trim()) return
    const deck = await createDeck(newTitle.trim(), newDesc.trim(), newTag, user?.id ?? null)
    setUserDecks(prev => [...prev, deck])
    setNewTitle(''); setNewDesc(''); setNewTag('free'); setShowNewDeck(false)
    setEditingDeck(deck)
  }

  function handleDeckUpdate(updated: Deck) {
    setUserDecks(prev => prev.map(d => d.id === updated.id ? updated : d))
    if (editingDeck?.id === updated.id) setEditingDeck(updated)
  }

  function handleDeckDelete(deckId: string) {
    setUserDecks(prev => prev.filter(d => d.id !== deckId))
    setEditingDeck(null)
  }

  async function handleSignOut() {
    await signOut()
    setUserDecks([])
  }

  const freeDecks = DECKS.filter(d => d.tag === 'free' && !d.id.startsWith('sight-read'))
  const cmCount = DECKS.filter(d => d.tag === 'cm').length
  const cmUnlocked = hasPurchased(CM_BUNDLE_PRICE_ID) || hasSubscription()

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #D3D1C7', background: '#F5F2EC' }}>
        <div style={{ fontFamily: F, fontSize: '22px', fontWeight: 300, letterSpacing: '0.08em', color: '#1A1A18' }}>
          Note<span style={{ fontWeight: 400 }}>Lab</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!loading && (
            user ? (
              <>
                <span style={{ fontSize: '13px', fontWeight: 300, color: '#888780' }}>{user.email}</span>
                <button onClick={() => setShowNewDeck(true)} style={{ border: '1px solid #1A1A18', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 300, color: '#1A1A18', background: 'none', cursor: 'pointer', fontFamily: F }}>+ New Deck</button>
                <button onClick={handleSignOut} style={{ border: '1px solid #D3D1C7', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 300, color: '#888780', background: 'none', cursor: 'pointer', fontFamily: F }}>Sign Out</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowNewDeck(true)} style={{ border: '1px solid #D3D1C7', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 300, color: '#888780', background: 'none', cursor: 'pointer', fontFamily: F }}>+ New Deck</button>
                <button onClick={() => setShowAuth(true)} style={{ border: '1px solid #1A1A18', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 300, color: '#1A1A18', background: 'none', cursor: 'pointer', fontFamily: F }}>Sign In</button>
              </>
            )
          )}
        </div>
      </header>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '56px 32px 48px' }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(28px, 5vw, 48px)', letterSpacing: '0.02em', color: '#1A1A18', marginBottom: '12px' }}>
          Music theory, practiced.
        </h1>
        <p style={{ fontSize: '15px', fontWeight: 300, color: '#888780', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          Interactive tools and flashcard collections for students at every level.
        </p>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 32px 80px' }}>

        {/* ── Tools ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#1A1A18', marginBottom: '4px' }}>Tools</h2>
            <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>Interactive exercises — no account needed</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {TOOLS.map(tool => (
              <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '16px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', height: '100%', boxSizing: 'border-box' as const, display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div>
                    <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: '20px', marginBottom: '12px', background: '#EDE8DF', color: '#888780', fontFamily: F }}>{tool.badge}</span>
                    <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '20px', color: '#1A1A18', marginBottom: '6px' }}>{tool.title}</h3>
                    <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', lineHeight: 1.6 }}>{tool.desc}</p>
                  </div>
                  <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#BA7517', marginTop: '16px' }}>{tool.cta}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Flashcards ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#1A1A18', marginBottom: '4px' }}>Flashcards</h2>
            <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>Spaced repetition collections for terms, symbols, and ear training</p>
          </div>

          {/* CM — featured */}
          <Link href="/collection?tag=cm" style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
            <div
              style={{ background: '#1A1A18', border: '1px solid #1A1A18', borderRadius: '16px', padding: '28px 32px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.92' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              <div>
                <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '3px 10px', borderRadius: '20px', marginBottom: '12px', background: '#BA7517', color: 'white', fontFamily: F }}>
                  {cmUnlocked ? 'Unlocked' : 'CM Collection'}
                </span>
                <h3 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '24px', color: 'white', marginBottom: '6px' }}>
                  Certificate of Merit — Prep through Advanced
                </h3>
                <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '480px' }}>
                  {cmCount} levels of complete exam prep — signs & terms, scales, intervals, chords, history, and ear training.
                </p>
              </div>
              <div style={{ marginLeft: '24px', flexShrink: 0, textAlign: 'right' as const }}>
                {cmUnlocked ? (
                  <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#BA7517' }}>Browse →</span>
                ) : (
                  <div>
                    <button
                      onClick={e => { e.preventDefault(); handleBuy(CM_BUNDLE_PRICE_ID, 'cm_bundle') }}
                      disabled={checkingOut}
                      style={{ display: 'block', background: '#BA7517', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer', marginBottom: '8px', whiteSpace: 'nowrap' as const }}>
                      {checkingOut ? 'Loading…' : 'Unlock Bundle'}
                    </button>
                    <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.4)' }}>or browse locked levels →</span>
                  </div>
                )}
              </div>
            </div>
          </Link>

          {/* Free decks grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {freeDecks.filter(d => !d.id.startsWith('ear-') && !d.id.startsWith('symbols-')).map(deck => (
              <Link key={deck.id} href={`/study/${deck.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: '20px', marginBottom: '10px', background: '#E1F5EE', color: '#0F6E56', fontFamily: F }}>Free</span>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '18px', color: '#1A1A18', marginBottom: '4px' }}>{deck.title}</h3>
                  <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>{deck.cards.length} cards</p>
                </div>
              </Link>
            ))}

            <Link href="/collection?tag=symbols" style={{ textDecoration: 'none' }}>
              <div
                style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: '20px', marginBottom: '10px', background: '#E1F5EE', color: '#0F6E56', fontFamily: F }}>Free</span>
                <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '18px', color: '#1A1A18', marginBottom: '4px' }}>Music Symbols</h3>
                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>Dynamics, articulations, accidentals →</p>
              </div>
            </Link>

            <Link href="/collection?tag=ear" style={{ textDecoration: 'none' }}>
              <div
                style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '2px 8px', borderRadius: '20px', marginBottom: '10px', background: '#E1F5EE', color: '#0F6E56', fontFamily: F }}>Free</span>
                <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '18px', color: '#1A1A18', marginBottom: '4px' }}>Ear Training</h3>
                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>Intervals, triads, cadences, scales →</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Pro banner ───────────────────────────────────────────────── */}
        {!hasSubscription() && user && (
          <div style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px', flexWrap: 'wrap' as const, gap: '12px' }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 300, color: '#1A1A18', marginBottom: '2px' }}>NoteLab Pro</p>
              <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>Unlock all sight reading levels and Note ID ranges</p>
            </div>
            <button onClick={() => handleBuy(PRO_PRICE_ID, 'subscription')} disabled={checkingOut}
              style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
              {checkingOut ? 'Loading…' : 'Subscribe — $7.99/mo'}
            </button>
          </div>
        )}

        {/* ── My Decks ─────────────────────────────────────────────────── */}
        {userDecks.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#1A1A18', marginBottom: '4px' }}>My Decks</h2>
              <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>{userDecks.length} custom collection{userDecks.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {userDecks.map(deck => (
                <div key={deck.id} style={{ position: 'relative' }}>
                  <Link href={`/study/${deck.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                      style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#BA7517'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#D3D1C7'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '18px', color: '#1A1A18', marginBottom: '4px' }}>{deck.title}</h3>
                      <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780' }}>{deck.cards.length} cards</p>
                    </div>
                  </Link>
                  <button onClick={() => setEditingDeck(deck)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', border: '1px solid #D3D1C7', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: 300, color: '#888780', cursor: 'pointer', fontFamily: F }}>
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* New deck modal */}
      {showNewDeck && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowNewDeck(false)}>
          <div style={{ background: '#F5F2EC', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 48px rgba(26,26,24,0.2)' }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', marginBottom: '24px', color: '#1A1A18' }}>New Collection</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888780', display: 'block', marginBottom: '6px' }}>Title</label>
              <input style={{ width: '100%', background: 'white', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '10px 14px', fontFamily: F, fontSize: '15px', fontWeight: 300, color: '#1A1A18', outline: 'none', boxSizing: 'border-box' as const }}
                value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. My Practice Deck" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateDeck()} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888780', display: 'block', marginBottom: '6px' }}>Description</label>
              <input style={{ width: '100%', background: 'white', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '10px 14px', fontFamily: F, fontSize: '14px', fontWeight: 300, color: '#1A1A18', outline: 'none', boxSizing: 'border-box' as const }}
                value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description…" />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888780', display: 'block', marginBottom: '6px' }}>Category</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {(['free', 'cm', 'theory', 'repertoire'] as DeckTag[]).map(tag => (
                  <button key={tag} onClick={() => setNewTag(tag)}
                    style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${newTag === tag ? '#1A1A18' : '#D3D1C7'}`, background: newTag === tag ? '#1A1A18' : 'transparent', color: newTag === tag ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer', textTransform: 'capitalize' as const }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCreateDeck} disabled={!newTitle.trim()}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 28px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: newTitle.trim() ? 'pointer' : 'default', opacity: newTitle.trim() ? 1 : 0.4 }}>
                Create & Add Cards
              </button>
              <button onClick={() => setShowNewDeck(false)}
                style={{ background: 'transparent', color: '#888780', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '12px 20px', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
      {editingDeck && <DeckEditor deck={editingDeck} onUpdate={handleDeckUpdate} onDelete={handleDeckDelete} onClose={() => setEditingDeck(null)} userId={user?.id ?? null} />}
    </div>
  )
}
