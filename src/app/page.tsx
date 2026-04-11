'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DECKS } from '@/lib/decks'
import { Deck, DeckTag } from '@/lib/types'
import { loadUserDecks, createDeck } from '@/lib/userDecks'
import DeckEditor from '@/components/DeckEditor'
import HomeCategoryHub from '@/components/HomeCategoryHub'
import { useAuth } from '@/hooks/useAuth'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

export default function Home() {
  // Early access gate — production only
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('nl-access=granted'))
    if (!cookie) window.location.href = '/unlock'
  }, [])

  const { user, loading } = useAuth()

  // Redirect logged-out users to landing page
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/landing'
    }
  }, [loading, user])
  const [userDecks, setUserDecks] = useState<Deck[]>([])
  const [, setDecksLoading] = useState(true)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [showNewDeck, setShowNewDeck] = useState(false)
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

  const earTopicCount = DECKS.filter(d => d.id.startsWith('ear-')).length
  const cmLevelCount = DECKS.filter(d => d.tag === 'cm').length

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>

      {/* Header */}

      {/* Hero */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '52px 32px 44px' }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, margin: '0', lineHeight: 1, width: 'fit-content' }}>
          <span style={{ display: 'block', fontSize: 'clamp(38px, 5.5vw, 64px)', color: 'rgba(136,135,128,0.55)', letterSpacing: '-0.01em', fontWeight: 300, marginBottom: '-0.05em' }}>
            Music theory,
          </span>
          <span style={{ display: 'block', fontSize: 'clamp(64px, 9.5vw, 110px)', color: '#2A2318', letterSpacing: '-0.03em', lineHeight: 0.9, fontStyle: 'italic' }}>
            practiced.
          </span>
          <span style={{ display: 'block', width: '100%', textAlign: 'right' as const, fontSize: 'clamp(20px, 2.2vw, 28px)', color: '#B5402A', letterSpacing: '0.01em', fontStyle: 'italic', fontWeight: 300, marginTop: '0.5em' }}>
            reimagined.
          </span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '28px 0 0' }}>
          <div style={{ width: '40px', height: '1.5px', background: '#B5402A', flexShrink: 0 }} />
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#7A7060', margin: 0, lineHeight: 1.7 }}>
            Interactive tools and flashcard collections for students at every level.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 32px 80px' }}>

        <HomeCategoryHub earTopicCount={earTopicCount} cmLevelCount={cmLevelCount} />
          {/* ── My Decks ─────────────────────────────────────────────────── */}
        {userDecks.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', color: '#2A2318', marginBottom: '4px' }}>My Decks</h2>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>{userDecks.length} custom collection{userDecks.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {userDecks.map(deck => (
                <div key={deck.id} style={{ position: 'relative' }}>
                  <Link href={`/study/${deck.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                      style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#B5402A'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDD8CA'; e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '18px', color: '#2A2318', marginBottom: '4px' }}>{deck.title}</h3>
                      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060' }}>{deck.cards.length} cards</p>
                    </div>
                  </Link>
                  <button onClick={() => setEditingDeck(deck)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '6px', padding: '4px 9px', fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#7A7060', cursor: 'pointer', fontFamily: F }}>
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
          <div style={{ background: '#F2EDDF', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 48px rgba(26,26,24,0.2)' }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '28px', marginBottom: '24px', color: '#2A2318' }}>New Collection</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', display: 'block', marginBottom: '6px' }}>Title</label>
              <input style={{ width: '100%', background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '8px', padding: '10px 14px', fontFamily: F, fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#2A2318', outline: 'none', boxSizing: 'border-box' as const }}
                value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. My Practice Deck" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateDeck()} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', display: 'block', marginBottom: '6px' }}>Description</label>
              <input style={{ width: '100%', background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '8px', padding: '10px 14px', fontFamily: F, fontSize: 'var(--nl-text-ui)', fontWeight: 400, color: '#2A2318', outline: 'none', boxSizing: 'border-box' as const }}
                value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description…" />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7060', display: 'block', marginBottom: '6px' }}>Category</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {(['free', 'cm', 'theory', 'repertoire'] as DeckTag[]).map(tag => (
                  <button key={tag} onClick={() => setNewTag(tag)}
                    style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${newTag === tag ? '#1A1A18' : '#DDD8CA'}`, background: newTag === tag ? '#1A1A18' : 'transparent', color: newTag === tag ? 'white' : '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, cursor: 'pointer', textTransform: 'capitalize' as const }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCreateDeck} disabled={!newTitle.trim()}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: newTitle.trim() ? 'pointer' : 'default', opacity: newTitle.trim() ? 1 : 0.4 }}>
                Create & Add Cards
              </button>
              <button onClick={() => setShowNewDeck(false)}
                style={{ background: 'transparent', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '8px', padding: '12px 20px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingDeck && <DeckEditor deck={editingDeck} onUpdate={handleDeckUpdate} onDelete={handleDeckDelete} onClose={() => setEditingDeck(null)} userId={user?.id ?? null} />}
    </div>
  )
}
