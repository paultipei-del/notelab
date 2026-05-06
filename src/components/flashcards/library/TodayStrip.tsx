'use client'

import Link from 'next/link'
import s from './library.module.css'
import { StreakLevel } from './MiniStreak'

export interface TodayStripProps {
  dueCount: number
  setCount: number
  overdueCount: number
  estMinutes: number
  streakCurrent: number
  streakDays: StreakLevel[]
  streakTodayIndex: number
  resumeName?: string
  resumeAgo?: string
  startHref: string
}

function levelClass(l: StreakLevel): string | null {
  if (l === 1) return s.l1
  if (l === 2) return s.l2
  if (l === 3) return s.l3
  return null
}

export default function TodayStrip(props: TodayStripProps) {
  const {
    dueCount, setCount, overdueCount, estMinutes,
    streakCurrent, streakDays, streakTodayIndex,
    resumeName, resumeAgo, startHref,
  } = props

  return (
    <section className={s.today}>
      <div className={s.todaySeal}>{dueCount}</div>
      <div className={s.todayInfo}>
        <div className={s.todayLbl}>Due today</div>
        <div className={s.todayH}>
          {dueCount} cards · {setCount} sets
          {overdueCount > 0 && <> · <b>{overdueCount} overdue</b></>}
        </div>
        <div className={s.todayMeta}>est. {estMinutes} minutes</div>
      </div>

      <div className={s.streakInline} aria-label="7-day streak">
        <div className={s.streakInlineNum}>
          {streakCurrent}<em>d streak</em>
        </div>
        <div className={s.streakInlineStrip}>
          {streakDays.map((l, i) => {
            const cls = [
              s.streakInlineDay,
              levelClass(l),
              i === streakTodayIndex ? s.now : null,
            ].filter(Boolean).join(' ')
            return <div key={i} className={cls} />
          })}
        </div>
      </div>

      {resumeName && (
        <div className={s.resume}>
          <span className={s.resumeLbl}>Last session</span>
          <span className={s.resumeName}>
            {resumeName}{resumeAgo && ` · ${resumeAgo}`}
          </span>
        </div>
      )}

      <Link className={s.startBtn} href={startHref}>Start review →</Link>
    </section>
  )
}
