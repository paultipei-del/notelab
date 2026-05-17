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
  const bothSides = !!prev && !!next
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: bothSides ? '1fr 1fr' : '1fr',
      gap: 14,
      marginTop: 36,
    }}>
      {prev && (
        <Link href={`/programs/cm/prep/${prev.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <PagerCard direction="prev" badge={lessonBadge(prev)} title={prev.title} />
        </Link>
      )}
      {next && (
        <Link href={`/programs/cm/prep/${next.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <PagerCard direction="next" badge={lessonBadge(next)} title={next.title} />
        </Link>
      )}
    </div>
  )
}

function PagerCard({
  direction, badge, title,
}: { direction: 'prev' | 'next'; badge: string; title: string }) {
  const arrow = (
    <span aria-hidden="true" style={{
      fontFamily: F, fontSize: 18, color: 'var(--brown)',
      lineHeight: 1, flexShrink: 0,
    }}>
      {direction === 'prev' ? '←' : '→'}
    </span>
  )
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, textAlign: direction === 'prev' ? 'left' : 'right' }}>
      <span style={{
        fontFamily: F, fontSize: 11, fontWeight: 500,
        letterSpacing: '1.5px', textTransform: 'uppercase',
        color: 'var(--brown-muted)', marginBottom: 4,
      }}>
        {badge}
      </span>
      <span style={{
        fontFamily: SERIF, fontSize: 18, fontWeight: 400,
        color: 'var(--ink)',
      }}>
        {title}
      </span>
    </div>
  )

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 20px',
      border: '1px solid var(--brown-faint)',
      borderRadius: 14,
      background: 'var(--cream-key)',
    }}>
      {direction === 'prev' ? <>{arrow}{content}</> : <>{content}{arrow}</>}
    </div>
  )
}
