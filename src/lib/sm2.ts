import { CardProgress, RatingValue } from './types'

export function sm2(card: Partial<CardProgress>, rating: RatingValue): CardProgress {
  let easeFactor = card.easeFactor ?? 2.5
  let interval = card.interval ?? 0
  let repetitions = card.repetitions ?? 0

  if (rating === 1) {
    repetitions = 0
    interval = 1
    easeFactor = Math.max(1.3, easeFactor - 0.2)
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)

    if (rating === 2) {
      easeFactor = Math.max(1.3, easeFactor - 0.15)
      interval = Math.max(1, Math.round(interval * 0.8))
    } else {
      easeFactor = Math.min(3.0, easeFactor + 0.1)
    }
    repetitions++
  }

  return {
    easeFactor,
    interval,
    repetitions,
    dueDate: Date.now() + interval * 86400000,
  }
}

export function formatInterval(card: Partial<CardProgress>, rating: RatingValue): string {
  const result = sm2({ ...card }, rating)
  const mins = result.interval * 1440
  if (mins < 60) return `${Math.round(mins)} min`
  if (mins < 1440) return `${Math.round(mins / 60)}h`
  return `${result.interval}d`
}

export function isDue(progress: Partial<CardProgress> | undefined): boolean {
  if (!progress?.dueDate) return true
  return progress.dueDate <= Date.now()
}

export function buildQueue(
  cards: Card[],
  progress: Record<string, Partial<CardProgress>>,
  deckId: string
): Card[] {
  const due: Card[] = []
  const fresh: Card[] = []

  cards.forEach(card => {
    const p = progress[`${deckId}-${card.id}`]
    const bucket = p?.repetitions ? due : fresh
    if (isDue(p)) bucket.push(card)
  })

  shuffle(due)
  shuffle(fresh)
  return [...due, ...fresh]
}

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Fix missing import
import { Card } from './types'