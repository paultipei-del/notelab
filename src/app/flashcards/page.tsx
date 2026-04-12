'use client'

import { useEffect } from 'react'
import { DECKS } from '@/lib/decks'
import { useAuth } from '@/hooks/useAuth'
import FlashcardsHub from '@/components/FlashcardsHub'

export default function FlashcardsPage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) window.location.href = '/landing'
  }, [loading, user])

  const freeDecks = DECKS.filter(d => d.tag === 'free' && !d.id.startsWith('sight-read') && d.id !== 'notes-treble' && d.id !== 'dynamics')
  const symbolDecks = DECKS.filter(d => d.id.startsWith('symbols-'))

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 32px 64px' }}>
        <FlashcardsHub
          showPrograms={false}
          flashcardsHeadingVariant="page"
          notationDecks={freeDecks.filter(d => ['tempo', 'intervals'].includes(d.id))}
          symbolDecks={symbolDecks}
        />
      </div>
    </div>
  )
}
