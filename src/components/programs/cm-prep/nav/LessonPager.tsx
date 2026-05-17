'use client'

import { useState } from 'react'
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
      gap: 14,
      marginTop: 36,
    }}>
      {prev ? (
        <Link href={`/programs/cm/prep/${prev.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <PagerCard direction="prev" badge={lessonBadge(prev)} title={prev.title} />
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={`/programs/cm/prep/${next.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <PagerCard direction="next" badge={lessonBadge(next)} title={next.title} />
        </Link>
      ) : (
        <span />
      )}
    </div>
  )
}

/**
 * Raised paper-toned pager card. Three-state motion mirrors the in-lesson
 * Back/Forward NavButton and the Ex1 AnswerPill: idle sits flat with a
 * 2px under-rule, hover lifts -1px and grows the shadow, mouse-down sinks
 * 2px and collapses to a pressed-in inset.
 */
function PagerCard({
  direction, badge, title,
}: { direction: 'prev' | 'next'; badge: string; title: string }) {
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)

  const bg = hover
    ? 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)'
    : 'linear-gradient(to bottom, #F9F6F0, #EFEBDE)'
  const shadow = pressed
    ? '0 1px 0 #CAC3B0, 0 1px 1px rgba(0,0,0,0.04), inset 0 1px 1px rgba(0,0,0,0.04)'
    : hover
      ? '0 3px 0 #CAC3B0, 0 4px 8px rgba(0,0,0,0.06)'
      : '0 2px 0 #CAC3B0, 0 2px 4px rgba(0,0,0,0.04)'
  const transform = pressed ? 'translateY(2px)' : hover ? 'translateY(-1px)' : 'translateY(0)'

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
        color: '#2A2318',
      }}>
        {title}
      </span>
    </div>
  )

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 20px',
        border: '1px solid #D7D1C0',
        borderRadius: 14,
        background: bg,
        cursor: 'pointer',
        boxShadow: shadow,
        transform,
        transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.12s ease',
      }}
    >
      {direction === 'prev' ? <>{arrow}{content}</> : <>{content}{arrow}</>}
    </div>
  )
}
