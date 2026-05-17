'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { markCMPrepCelebrated } from '@/lib/programs/cm-prep/progress'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const MONO = 'var(--font-jetbrains-mono), JetBrains Mono, ui-monospace, monospace'

interface Props {
  lessonSlug: string
  lessonNumber: number
  lessonTitle: string
  lessonTitleEmphasis?: string
  lessonLead: string
  bestScore: number              // 0–1
  exerciseCount?: { completed: number; total: number }
  lessonPosition: { current: number; total: number; levelName: string }
  nextLessonNumber?: number
  nextLessonTitle?: string
  nextLessonHref?: string
}

export default function LessonCompletionMarquee({
  lessonSlug, lessonNumber, lessonTitle, lessonTitleEmphasis,
  lessonLead, bestScore, exerciseCount, lessonPosition,
  nextLessonNumber, nextLessonTitle, nextLessonHref,
}: Props) {
  const [visible, setVisible] = useState(true)
  const [entered, setEntered] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  // Mount-time: record celebration so the marquee never re-renders, and
  // schedule the entry fade after a small breath (~150ms).
  useEffect(() => {
    markCMPrepCelebrated(lessonSlug)
    const id = window.setTimeout(() => setEntered(true), 150)
    return () => window.clearTimeout(id)
  }, [lessonSlug])

  if (!visible) return null

  function dismiss() {
    setFadingOut(true)
    window.setTimeout(() => setVisible(false), 300)
  }

  const emphasis = lessonTitleEmphasis ?? lessonTitle

  const opacity = fadingOut ? 0 : entered ? 1 : 0
  const transform = entered && !fadingOut ? 'translateY(0)' : 'translateY(8px)'
  const transition = fadingOut
    ? 'opacity 0.3s ease-out, transform 0.3s ease-out'
    : 'opacity 0.4s ease-out, transform 0.4s ease-out'

  const hasNext = nextLessonNumber !== undefined && nextLessonTitle && nextLessonHref

  return (
    <div className="nl-lesson-marquee" style={{
      position: 'relative',
      background: 'var(--cream-key)',
      border: '1px solid var(--brown-faint)',
      borderRadius: 16,
      padding: '32px 36px',
      marginBottom: 18,
      overflow: 'hidden',
      opacity, transform, transition,
    }}>
      {/* Forest top accent bar */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 4, background: 'var(--forest)',
      }} />

      <div className="nl-lesson-marquee__grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 32,
        alignItems: 'center',
      }}>
        {/* LEFT — message + stats */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 10,
            fontFamily: F, fontSize: 11, fontWeight: 600,
            color: 'var(--oxblood)',
            textTransform: 'uppercase', letterSpacing: '1.8px',
          }}>
            <span aria-hidden="true" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--oxblood)', color: 'var(--cream-key)',
              fontSize: 11, fontWeight: 700, lineHeight: 1,
            }}>✓</span>
            <span>Lesson {lessonNumber} complete</span>
          </div>

          <h2 style={{
            margin: '0 0 10px',
            fontFamily: SERIF, fontSize: 36, fontWeight: 300,
            lineHeight: 1.05, letterSpacing: '0.72px',
            color: '#2a2318',
          }}>
            <em style={{ fontStyle: 'italic', color: 'var(--oxblood)' }}>
              {emphasis},
            </em>{' '}done.
          </h2>

          <p style={{
            margin: '0 0 22px',
            fontFamily: F, fontSize: 13, lineHeight: 1.5,
            color: 'var(--brown)',
          }}>
            {lessonLead}
          </p>

          <div style={{
            fontFamily: F, fontSize: 12, color: 'var(--brown)',
            display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          }}>
            <Stat value={`${Math.round(bestScore * 100)}%`} label="score" />
            {exerciseCount && (
              <>
                <Sep />
                <Stat value={`${exerciseCount.completed}/${exerciseCount.total}`} label="exercises" />
              </>
            )}
            <Sep />
            <Stat
              value={`${lessonPosition.current}/${lessonPosition.total}`}
              label={`lessons in ${lessonPosition.levelName}`}
            />
          </div>
        </div>

        {/* RIGHT — actions */}
        <div className="nl-lesson-marquee__actions" style={{
          display: 'flex', flexDirection: 'column',
          gap: 10, alignItems: 'flex-end',
        }}>
          {hasNext ? (
            <Link href={nextLessonHref!} style={{
              display: 'inline-block',
              background: 'var(--oxblood)', color: 'var(--cream-key)',
              border: '1px solid var(--oxblood)', borderRadius: 10,
              padding: '14px 24px',
              fontFamily: F, fontSize: 14,
              whiteSpace: 'nowrap', cursor: 'pointer',
              textDecoration: 'none',
            }}>
              Continue to Lesson {nextLessonNumber} →
            </Link>
          ) : (
            <Link href="/programs/cm/prep" style={{
              display: 'inline-block',
              background: 'var(--oxblood)', color: 'var(--cream-key)',
              border: '1px solid var(--oxblood)', borderRadius: 10,
              padding: '14px 24px',
              fontFamily: F, fontSize: 14,
              whiteSpace: 'nowrap', cursor: 'pointer',
              textDecoration: 'none',
            }}>
              Back to Preparatory →
            </Link>
          )}
          <button onClick={dismiss} style={{
            background: 'transparent', border: 'none', padding: 0,
            color: 'var(--brown)', cursor: 'pointer',
            fontFamily: F, fontSize: 12,
            textDecoration: 'underline',
            textDecorationColor: 'var(--brown-faint)',
            textUnderlineOffset: 4,
          }}>
            Review this lesson
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .nl-lesson-marquee {
            padding: 24px 22px !important;
          }
          .nl-lesson-marquee__grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .nl-lesson-marquee__actions {
            align-items: stretch !important;
          }
          .nl-lesson-marquee__actions :global(a) {
            text-align: center;
          }
          .nl-lesson-marquee__actions :global(button) {
            align-self: center;
          }
        }
      `}</style>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{
        fontFamily: MONO, fontSize: 13, fontWeight: 500,
        color: 'var(--ink)',
      }}>{value}</span>
      <span>{label}</span>
    </span>
  )
}

function Sep() {
  return (
    <span aria-hidden="true" style={{
      color: 'var(--brown-faint)', margin: '0 8px',
    }}>·</span>
  )
}
