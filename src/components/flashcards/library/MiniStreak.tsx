'use client'

import s from './library.module.css'

export type StreakLevel = 0 | 1 | 2 | 3

export interface StreakProps {
  current: number
  days: StreakLevel[]   // 7 entries
  todayIndex: number    // 0-6
}

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function levelClass(l: StreakLevel): string | null {
  if (l === 1) return s.l1
  if (l === 2) return s.l2
  if (l === 3) return s.l3
  return null
}

export default function MiniStreak({ current, days, todayIndex }: StreakProps) {
  return (
    <div className={s.miniStreak} aria-label="Current streak">
      <span className={s.miniStreakLabel}>Current streak</span>
      <span className={s.miniStreakNum}>
        {current}<em> days</em>
      </span>
      <div className={s.miniStreakStrip}>
        {days.map((l, i) => {
          const cls = [s.miniStreakDay, levelClass(l), i === todayIndex ? s.now : null]
            .filter(Boolean)
            .join(' ')
          return <div key={i} className={cls}>{LETTERS[i]}</div>
        })}
      </div>
    </div>
  )
}
