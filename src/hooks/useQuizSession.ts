'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, Deck } from '@/lib/types'
import { shuffle } from '@/lib/sm2'

export interface QuizResult {
  card: Card
  correct: boolean
  chosen: string
}

export function useQuizSession(deck: Deck) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cards = useMemo(() => shuffle([...deck.cards]), [deck.id])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<QuizResult[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startTime = useMemo(() => Date.now(), [deck.id])
  const [endTime, setEndTime] = useState<number | null>(null)

  const currentCard = cards[index] ?? null

  function getMCOptions(card: Card): string[] {
    const correct = card.type === 'symbol' ? (card.symbolName ?? card.back) : card.back
    const pool = cards
      .filter(c => c.id !== card.id)
      .map(c => c.type === 'symbol' ? (c.symbolName ?? c.back) : c.back)
    const shuffled = shuffle([...pool])
    const distractors = shuffled.slice(0, 3)
    return shuffle([correct, ...distractors])
  }

  const answer = useCallback((chosen: string) => {
    if (!currentCard || isComplete) return
    const correct = currentCard.type === 'symbol'
      ? (currentCard.symbolName ?? currentCard.back)
      : currentCard.back
    const isCorrect = chosen.trim().toLowerCase() === correct.trim().toLowerCase()

    setChosen(chosen)
    setResults(prev => [...prev, { card: currentCard, correct: isCorrect, chosen }])

    setTimeout(() => {
      setChosen(null)
      if (index + 1 >= cards.length) {
        setIsComplete(true)
        setEndTime(Date.now())
      } else {
        setIndex(i => i + 1)
      }
    }, 800)
  }, [currentCard, index, cards.length, isComplete])

  const score = results.filter(r => r.correct).length
  const missed = results.filter(r => !r.correct)
  const elapsedMs = (endTime ?? Date.now()) - startTime

  return {
    currentCard,
    index,
    total: cards.length,
    results,
    isComplete,
    chosen,
    score,
    missed,
    elapsedMs,
    getMCOptions,
    answer,
  }
}
