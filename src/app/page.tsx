'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DECKS } from '@/lib/decks'
import { Deck, DeckTag } from '@/lib/types'
import { getUserDecks, createDeck, saveUserDecks } from '@/lib/userDecks'
import DeckEditor from '@/components/DeckEditor'

const TAG_COLORS: Record<DeckTag, { bg: string; color: string }> = {
  free: { bg: '#E1F5EE', color: '#0F6E56' },
  cm: { bg: '#FAEEDA', color: '#BA7517' },
  theory: { bg: '#EEEDFE', color: '#534AB7' },
  repertoire: { bg: '#FAECE7', color: '#993C1D' },
}

export default function Home() {
  const [userDecks, setUserDecks] = useState<Deck[]>([])
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTag, setNewTag] = useState<DeckTag>('free')

  useEffect(() => {
    setUserDecks(getUserDecks())
  }, [])

  function handleCreateDeck() {
    if (!newTitle.trim()) return
    const deck = createDeck(newTitle.trim(), newDesc.trim(), newTag)
    setUserDecks(prev => [...prev, deck])
    setNewTitle('')
    setNewDesc('')
    setNewTag('free')
    setShowNewDeck(false)
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

  const allDecks = [...DECKS, ...userDecks]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #D3D1C7', background: '#F5F2EC' }}>
        <div style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '22px', fontWeight: 300, letterSpacing: '0.08em', color: '#1A1A18' }}>
          Note<span style={{ fontWeight: 400 }}>Lab</span>
        </div>
        <button
          onClick={() => setShowNewDeck(true)}
          style={{ border: '1px solid #1A1A18', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 300, letterSpacing: '0.05em', color: '#1A1A18', background: 'none', cursor: 'pointer' }}
        >
          + New Deck
        </button>
      </header>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '64px 32px 40px' }}>
        <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: 'clamp(28px, 5vw, 52px)', letterSpacing: '0.02em', color: '#1A1A18', marginBottom: '12px' }}>
          What are you studying today?
        </h1>
        <p style={{ fontSize: '15px', fontWeight: 300, color: '#888780', letterSpacing: '0.03em' }}>
          Select a collection to begin your session
        </p>
      </div>

      {/* Deck grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '0 32px 64px', maxWidth: '960px', margin: '0 auto' }}>
        {allDecks.map(deck => {
          const isUser = deck.id.startsWith('user-')
          const tagStyle = TAG_COLORS[deck.tag] || TAG_COLORS.free

          return (
            <div key={deck.id} style={{ position: 'relative' }}>
              <Link href={`/study/${deck.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  style={{ background: 'white', border: '1px solid #D3D1C7', borderRadius: '16px', padding: '28px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(26,26,24,0.06)', transition: 'all 0.2s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#BA7517'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 32px rgba(26,26,24,0.10)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#D3D1C7'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,26,24,0.06)'
                  }}
                >
                  <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '20px', marginBottom: '14px', background: tagStyle.bg, color: tagStyle.color }}>
                    {deck.tag}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '22px', marginBottom: '6px', letterSpacing: '0.01em', color: '#1A1A18' }}>
                    {deck.title}
                  </h3>
                  <p style={{ fontSize: '13px', fontWeight: 300, color: '#888780', lineHeight: 1.6, marginBottom: '20px', letterSpacing: '0.02em' }}>
                    {deck.description || 'No description'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 300, color: '#888780' }}>
                    <span>{deck.cards.length} cards</span>
                    <span>Start →</span>
                  </div>
                  <div style={{ height: '3px', background: '#D3D1C7', borderRadius: '2px', marginTop: '12px' }}>
                    <div style={{ height: '100%', width: '0%', background: '#BA7517', borderRadius: '2px' }} />
                  </div>
                </div>
              </Link>

              {/* Edit button for user decks */}
              {isUser && (
                <button
                  onClick={e => { e.preventDefault(); setEditingDeck(deck) }}
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'white', border: '1px solid #D3D1C7', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 300, color: '#888780', cursor: 'pointer', letterSpacing: '0.05em' }}
                >
                  Edit
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* New deck modal */}
      {showNewDeck && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setShowNewDeck(false)}>
          <div style={{ background: '#F5F2EC', borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '480px', boxShadow: '0 8px 48px rgba(26,26,24,0.2)' }}>
            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '28px', marginBottom: '24px', color: '#1A1A18' }}>
              New Collection
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888780', display: 'block', marginBottom: '6px' }}>Title</label>
              <input
                style={{ width: '100%', background: 'white', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '10px 14px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '15px', fontWeight: 300, color: '#1A1A18', outline: 'none' }}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. CM Level 2 — Theory"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateDeck()}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888780', display: 'block', marginBottom: '6px' }}>Description</label>
              <input
                style={{ width: '100%', background: 'white', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '10px 14px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '14px', fontWeight: 300, color: '#1A1A18', outline: 'none' }}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Brief description…"
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888780', display: 'block', marginBottom: '6px' }}>Category</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['free', 'cm', 'theory', 'repertoire'] as DeckTag[]).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setNewTag(tag)}
                    style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${newTag === tag ? '#1A1A18' : '#D3D1C7'}`, background: newTag === tag ? '#1A1A18' : 'transparent', color: newTag === tag ? 'white' : '#888780', fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, cursor: 'pointer', textTransform: 'capitalize' }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreateDeck}
                disabled={!newTitle.trim()}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 28px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, letterSpacing: '0.06em', cursor: newTitle.trim() ? 'pointer' : 'default', opacity: newTitle.trim() ? 1 : 0.4 }}
              >
                Create & Add Cards
              </button>
              <button
                onClick={() => setShowNewDeck(false)}
                style={{ background: 'transparent', color: '#888780', border: '1px solid #D3D1C7', borderRadius: '8px', padding: '12px 20px', fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deck editor drawer */}
      {editingDeck && (
        <DeckEditor
          deck={editingDeck}
          onUpdate={handleDeckUpdate}
          onDelete={handleDeckDelete}
          onClose={() => setEditingDeck(null)}
        />
      )}
    </div>
  )
}
