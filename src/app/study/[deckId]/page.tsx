'use client'
import { use, useEffect, useState } from 'react'
import { getDeckById } from '@/lib/decks'
import { loadUserDecks } from '@/lib/userDecks'
import StudyEngine from '@/components/StudyEngine'
import QuizEngine from '@/components/QuizEngine'
import { useAuth } from '@/hooks/useAuth'
import { Deck } from '@/lib/types'

interface Props {
  params: Promise<{ deckId: string }>
}

export default function StudyPage({ params }: Props) {
  const { deckId } = use(params)
  const { user, loading } = useAuth()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [deckLoading, setDeckLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [quizMode, setQuizMode] = useState(false)

  useEffect(() => {
    if (loading) return
    const builtIn = getDeckById(deckId)
    if (builtIn) {
      setDeck(builtIn)
      setDeckLoading(false)
      return
    }
    loadUserDecks(user?.id ?? null).then(userDecks => {
      const found = userDecks.find(d => d.id === deckId)
      if (found) {
        setDeck(found)
      } else {
        setNotFound(true)
      }
      setDeckLoading(false)
    })
  }, [deckId, user, loading])

  if (loading || deckLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#2C2A27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#C4C0B8', letterSpacing: '0.05em' }}>Loading…</p>
      </div>
    )
  }

  if (notFound || !deck) {
    return (
      <div style={{ minHeight: '100vh', background: '#2C2A27', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '28px', color: '#F7F4EF' }}>Deck not found</p>
        <a href="/" style={{ fontSize: '13px', fontWeight: 300, color: '#C4C0B8', letterSpacing: '0.05em' }}>← Back to decks</a>
      </div>
    )
  }

  return (
    <>
      <div key="quiz" style={{ display: quizMode ? 'contents' : 'none' }}>
        <QuizEngine deck={deck} onExit={() => setQuizMode(false)} />
      </div>
      <div key="study" style={{ display: quizMode ? 'none' : 'contents' }}>
        <StudyEngine deck={deck} userId={user?.id ?? null} onQuiz={() => setQuizMode(true)} />
      </div>
    </>
  )
}
