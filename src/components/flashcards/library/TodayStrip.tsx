'use client'

import Link from 'next/link'
import s from './library.module.css'

export interface TodayStripProps {
  dueCount: number
  setCount: number
  overdueCount: number
  estMinutes: number
  streakCurrent: number
  resumeName?: string
  resumeAgo?: string
  startHref: string
}

export default function TodayStrip(props: TodayStripProps) {
  const {
    dueCount, setCount, overdueCount, estMinutes,
    streakCurrent,
    resumeName, resumeAgo, startHref,
  } = props
  const dayWord = streakCurrent === 1 ? 'day' : 'days'
  const ariaLabel = `${streakCurrent} ${dayWord} streak`

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

      {/* Desktop streak — small typographic badge with left divider */}
      <div className={s.desktopOnly}>
        <div className={s.streakTypoDesktop} aria-label={ariaLabel}>
          <div className={s.streakTypoNum}>{streakCurrent}</div>
          <div className={s.streakTypoStack}>
            <div className={s.streakTypoDay}>{dayWord}</div>
            <div className={s.streakTypoLabel}>streak</div>
          </div>
        </div>
      </div>

      {/* Mobile streak — full-width labeled row */}
      <div className={s.mobileOnly}>
        <div className={s.streakTypoMobile} aria-label={ariaLabel}>
          <div className={s.streakTypoMobileLabel}>Streak</div>
          <div className={s.streakTypoMobileVal}>
            <div className={s.streakTypoNum}>{streakCurrent}</div>
            <div className={s.streakTypoDay}>{dayWord}</div>
          </div>
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
