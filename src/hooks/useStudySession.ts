'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Deck, StudyMode, RatingValue, SessionStats, ProgressStore, QueueCard } from '@/lib/types'
import { sm2, formatInterval, buildQueue, shuffle } from '@/lib/sm2'

const STORAGE_KEY = 'notelab-progress'

function loadProgress(): ProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveProgress(progress: ProgressStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function useStudySession(deck: Deck | null) {
  const [progress, setProgress] = useState<ProgressStore>({})
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

  // Load progress from localStorage on mount
  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  // Build queue when deck changes
  useEffect(() => {
    if (!deck) return
    const stored = loadProgress()
    setProgress(stored)
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
  }, [deck])

  const currentCard = queue[cardIndex] ?? null
  const isSessionDone = cardIndex >= queue.length && queue.length > 0

  // Reveal the current card
  const reveal = useCallback(() => {
    setRevealed(true)
  }, [])

  // Record whether the answer was correct (for MC and type modes)
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

  // Rate the current card and advance
  const rate = useCallback((rating: RatingValue) => {
    if (!deck || !currentCard) return

    const key = `${deck.id}-${currentCard.id}`
    const existing = progress[key] ?? {}
    const updated = sm2(existing, rating)

    const newProgress = { ...progress, [key]: updated }
    setProgress(newProgress)
    saveProgress(newProgress)

    // If Again, re-queue the card at the end
    if (rating === 1) {
      setQueue(prev => [...prev, { ...currentCard, ...updated }])
    }

    setCardIndex(prev => prev + 1)
    setRevealed(false)
  }, [deck, currentCard, progress])

  // Get formatted intervals for rating buttons
  const intervals = currentCard ? {
    again: formatInterval(progress[`${deck?.id}-${currentCard.id}`] ?? {}, 1),
    hard: formatInterval(progress[`${deck?.id}-${currentCard.id}`] ?? {}, 2),
    easy: formatInterval(progress[`${deck?.id}-${currentCard.id}`] ?? {}, 3),
  } : { again: '< 1 min', hard: '6 min', easy: '1 day' }

  // Progress percentage for the progress bar
  const progressPct = queue.length > 0 ? (cardIndex / queue.length) * 100 : 0

  // Deck-level learned percentage (for deck grid)
  function getDeckProgress(d: Deck): number {
    const stored = loadProgress()
    const learned = d.cards.filter(c => {
      const p = stored[`${d.id}-${c.id}`]
      return p && p.repetitions > 0
    }).length
    return d.cards.length > 0 ? Math.round((learned / d.cards.length) * 100) : 0
  }

  // Generate multiple choice options for current card
  const getMCOptions = useCallback((allCards: Card[]): string[] => {
    if (!currentCard) return []
    const correct = currentCard.type === 'staff' ? currentCard.front : currentCard.back
    const pool = allCards
      .filter(c => c.id !== currentCard.id)
      .map(c => c.type === 'staff' ? c.front : c.back)
    shuffle(pool)
    const distractors = pool.slice(0, 3)
    return shuffle([correct, ...distractors])
  }, [currentCard])

  return {
    // State
    currentCard,
    queue,
    cardIndex,
    mode,
    revealed,
    stats,
    isComplete: isSessionDone,
    progress,
    // Derived
    progressPct,
    intervals,
    progressLabel: `${cardIndex} / ${queue.length}`,
    // Actions
    reveal,
    rate,
    recordAnswer,
    setMode,
    getMCOptions,
    getDeckProgress,
  }
}