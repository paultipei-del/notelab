'use client'
import { use, useEffect, useState } from 'react'
import { getDeckById } from '@/lib/decks'
import { loadUserDecks } from '@/lib/userDecks'
import StudyEngine from '@/components/StudyEngine'
import QuizEngine from '@/components/QuizEngine'
import { useAuth } from '@/hooks/useAuth'
import { Deck, StudyMode } from '@/lib/types'

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
  const [pendingStudyMode, setPendingStudyMode] = useState<StudyMode | 'browse' | null>(null)

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
      <div className="nl-study-page-shell">
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontWeight: 300, color: '#7A7060', letterSpacing: '0.05em' }}>Loading…</p>
      </div>
    )
  }

  if (notFound || !deck) {
    return (
      <div className="nl-study-page-shell nl-study-page-shell--stack">
        <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '28px', color: '#2A2318' }}>Deck not found</p>
        <a href="/" style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.05em' }}>← Back to decks</a>
      </div>
    )
  }

  return (
    <>
      <div key="quiz" style={{ display: quizMode ? 'contents' : 'none' }}>
        <QuizEngine
          deck={deck}
          onExit={target => {
            // Mobile tab clicks from inside Quiz pass a target mode/view;
            // forward it to StudyEngine via pendingStudyMode so the user
            // lands on the tab they actually picked, not the previous
            // study mode.
            if (target) setPendingStudyMode(target)
            setQuizMode(false)
          }}
        />
      </div>
      <div key="study" style={{ display: quizMode ? 'none' : 'contents' }}>
        <StudyEngine
          deck={deck}
          userId={user?.id ?? null}
          onQuiz={() => setQuizMode(true)}
          pendingMode={pendingStudyMode}
          onPendingHandled={() => setPendingStudyMode(null)}
        />
      </div>
    </>
  )
}
