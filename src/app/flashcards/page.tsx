'use client'

import { useEffect } from 'react'
import { DECKS } from '@/lib/decks'
import { useAuth } from '@/hooks/useAuth'
import FlashcardsHub from '@/components/FlashcardsHub'

export default function FlashcardsPage() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('nl-access=granted'))
    if (!cookie) window.location.href = '/unlock'
  }, [])

  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) window.location.href = '/landing'
  }, [loading, user])

  const freeDecks = DECKS.filter(d => d.tag === 'free' && !d.id.startsWith('sight-read') && d.id !== 'notes-treble' && d.id !== 'dynamics')
  const symbolDecks = DECKS.filter(d => d.id.startsWith('symbols-'))

  return (
    <div style={{ minHeight: '100vh', background: '#2C2A27' }}>
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
