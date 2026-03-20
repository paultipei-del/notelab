'use client'

import { use } from 'react'
import { getDeckById } from '@/lib/decks'
import { getUserDecks } from '@/lib/userDecks'
import { notFound } from 'next/navigation'
import StudyEngine from '@/components/StudyEngine'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  params: Promise<{ deckId: string }>
}

export default function StudyPage({ params }: Props) {
  const { deckId } = use(params)
  const { user } = useAuth()

  // Check built-in decks first, then user decks
  const deck = getDeckById(deckId) ?? getUserDecks().find(d => d.id === deckId)
  if (!deck) notFound()

  return <StudyEngine deck={deck!} userId={user?.id ?? null} />
}
