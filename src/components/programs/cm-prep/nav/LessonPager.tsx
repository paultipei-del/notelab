'use client'

import Link from 'next/link'
import type { CMPrepLesson } from '@/lib/programs/cm-prep/lessons'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface LessonPagerProps {
  prev?: CMPrepLesson
  next?: CMPrepLesson
}

function lessonBadge(lesson: CMPrepLesson): string {
  if (lesson.type === 'review') return lesson.number === 'T' ? 'Review Test' : 'Review'
  return `Lesson ${lesson.number}`
}

export function LessonPager({ prev, next }: LessonPagerProps) {
  if (!prev && !next) return null
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginTop: 36,
    }}>
      {prev ? (
        <Link href={`/programs/cm/prep/${prev.slug}`} style={{ textDecoration: 'none' }}>
          <PagerCard
            direction="prev"
            badge={lessonBadge(prev)}
            title={prev.title}
          />
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/programs/cm/prep/${next.slug}`} style={{ textDecoration: 'none' }}>
          <PagerCard
            direction="next"
            badge={lessonBadge(next)}
            title={next.title}
          />
        </Link>
      ) : (
        <span />
      )}
    </div>
  )
}

function PagerCard({
  direction, badge, title,
}: { direction: 'prev' | 'next'; badge: string; title: string }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        padding: '16px 20px',
        border: '1px solid #E8E4DC',
        borderRadius: 14,
        background: '#FDFBF5',
        textAlign: direction === 'prev' ? 'left' : 'right',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#1A1A18' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E4DC' }}
    >
      <span style={{
        fontFamily: F,
        fontSize: 'var(--nl-text-badge)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#7A7060',
        marginBottom: 4,
      }}>
        {direction === 'prev' ? `← ${badge}` : `${badge} →`}
      </span>
      <span style={{
        fontFamily: SERIF,
        fontSize: 17,
        fontWeight: 400,
        color: '#2A2318',
      }}>
        {title}
      </span>
    </div>
  )
}
