'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Deck, StudyMode, RatingValue, SessionStats, ProgressStore, QueueCard } from '@/lib/types'
import { sm2, formatInterval, buildQueue, shuffle } from '@/lib/sm2'
import { loadProgress, saveCardProgress } from '@/lib/progressSync'

export function useStudySession(deck: Deck | null, userId: string | null = null) {
  const [progress, setProgress] = useState<ProgressStore>({})
  const [progressLoaded, setProgressLoaded] = useState(false)
  const [queue, setQueue] = useState<QueueCard[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [mode, setMode] = useState<StudyMode>('flip')
  const [revealed, setRevealed] = useState(false)
  const [stats, setStats] = useState<SessionStats>({
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    streakHistory: [],
    startTime: Date.now(),
  })
  const [isComplete, setIsComplete] = useState(false)

  // Load progress when deck or user changes
  useEffect(() => {
    if (!deck) return
    setProgressLoaded(false)

    loadProgress(userId).then(stored => {
      setProgress(stored)
      setProgressLoaded(true)

      const q = buildQueue(deck.cards, stored, deck.id) as QueueCard[]
      setQueue(q)
      setCardIndex(0)
      setRevealed(false)
      setIsComplete(false)
      setStats({
        correct: 0,
        total: 0,
        streak: 0,
        bestStreak: 0,
        streakHistory: [],
        startTime: Date.now(),
      })
    })
  }, [deck, userId])

  const currentCard = queue[cardIndex] ?? null
  const isSessionDone = cardIndex >= queue.length && queue.length > 0 && progressLoaded

  const reveal = useCallback(() => {
    setRevealed(true)
  }, [])

  const recordAnswer = useCallback((correct: boolean) => {
    setStats(prev => {
      const newStreak = correct ? prev.streak + 1 : 0
      return {
        ...prev,
        correct: correct ? prev.correct + 1 : prev.correct,
        total: prev.total + 1,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        streakHistory: [...prev.streakHistory, correct ? 'hit' : 'miss'],
      }
    })
  }, [])

  const rate = useCallback(async (rating: RatingValue) => {
    if (!deck || !currentCard) return

    const key = `${deck.id}-${currentCard.id}`
    const existing = progress[key] ?? {}
    const updated = sm2(existing, rating)

    const newProgress = { ...progress, [key]: updated }
    setProgress(newProgress)

    // Save to Supabase (or localStorage fallback)
    await saveCardProgress(userId, deck.id, currentCard.id, updated)

    if (rating === 1) {
      setQueue(prev => [...prev, { ...currentCard, ...updated }])
    }

    setCardIndex(prev => prev + 1)
    setRevealed(false)
  }, [deck, currentCard, progress, userId])

  const intervals = currentCard ? {
    again: formatInterval(progress[`${deck?.id}-${currentCard.id}`] ?? {}, 1),
    hard: formatInterval(progress[`${deck?.id}-${currentCard.id}`] ?? {}, 2),
    easy: formatInterval(progress[`${deck?.id}-${currentCard.id}`] ?? {}, 3),
  } : { again: '< 1 min', hard: '6 min', easy: '1 day' }

  const progressPct = queue.length > 0 ? (cardIndex / queue.length) * 100 : 0

  const getMCOptions = useCallback((allCards: Card[]): string[] => {
    if (!currentCard) return []
    const getAnswer = (c: Card) => {
      if (c.type === 'staff') return c.front
      if (c.type === 'symbol') return c.symbolName ?? c.back
      return c.back
    }
    const correct = getAnswer(currentCard)
    const pool = allCards
      .filter(c => c.id !== currentCard.id)
      .map(c => getAnswer(c))
    shuffle(pool)
    const distractors = pool.slice(0, 3)
    return shuffle([correct, ...distractors])
  }, [currentCard])

  return {
    currentCard,
    queue,
    cardIndex,
    mode,
    revealed,
    stats,
    isComplete: isSessionDone,
    progress,
    progressLoaded,
    progressPct,
    intervals,
    progressLabel: `${cardIndex} / ${queue.length}`,
    reveal,
    rate,
    recordAnswer,
    setMode,
    getMCOptions,
  }
}
