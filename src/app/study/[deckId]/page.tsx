'use client'

import { use } from 'react'
import { getDeckById } from '@/lib/decks'
import { notFound } from 'next/navigation'
import StudyEngine from '@/components/StudyEngine'

interface Props {
  params: Promise<{ deckId: string }>
}

export default function StudyPage({ params }: Props) {
  const { deckId } = use(params)
  const deck = getDeckById(deckId)
  if (!deck) notFound()
  return <StudyEngine deck={deck!} />
}