'use client'

import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import {
  getCMLevel1Lesson,
  nextCMLevel1Lesson,
  prevCMLevel1Lesson,
} from '@/lib/programs/cm-level1/lessons'
import { Breadcrumb } from '@/components/programs/cm-level1/nav/Breadcrumb'
import { LessonPager } from '@/components/programs/cm-level1/nav/LessonPager'
import {
  isCMLevel1LessonUnlocked,
  loadCMLevel1Progress,
  recordCMLevel1Session,
  type CMLevel1ProgressStore,
} from '@/lib/programs/cm-level1/progress'
import PlaceholderLesson from '@/components/programs/cm-level1/PlaceholderLesson'
import LetterNamesLesson from '@/components/programs/cm-level1/LetterNamesLesson'
import LetterNamesVisuals from '@/components/programs/cm-level1/LetterNamesVisuals'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

interface Props {
  params: Promise<{ lessonSlug: string }>
}

export default function CMLevel1LessonPage({ params }: Props) {
  const { lessonSlug } = use(params)
  const lesson = getCMLevel1Lesson(lessonSlug)
  const next = nextCMLevel1Lesson(lessonSlug)
  const prev = prevCMLevel1Lesson(lessonSlug)

  const [store, setStore] = useState<CMLevel1ProgressStore>({})
  const [practicing, setPracticing] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)

  useEffect(() => {
    setStore(loadCMLevel1Progress())
  }, [])

  if (!lesson) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, color: '#7A7060' }}>Lesson not found.</p>
      </div>
    )
  }

  const unlocked = isCMLevel1LessonUnlocked(lessonSlug, store)
  const progress = store[lessonSlug]
  const completed = progress?.completed ?? false

  function handleComplete(score: number, total: number) {
    setSessionScore(score)
    setSessionTotal(total)
    setSessionDone(true)
    recordCMLevel1Session(lessonSlug, score, total)
    setStore(loadCMLevel1Progress())
    setPracticing(false)
  }

  const nowCompleted = sessionDone && sessionScore >= lesson.passingScore
  const isLetterNamesLesson = lessonSlug === 'letter-names-of-notes'

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 32px 80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <Breadcrumb
            crumbs={[
              { label: 'Certificate of Merit', href: '/programs/cm' },
              { label: 'Level 1', href: '/programs/cm/l1' },
              { label: lesson.title },
            ]}
          />

          <div style={{ marginTop: '28px', marginBottom: '28px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7060', marginBottom: '8px' }}>
              {lesson.type === 'review' ? (lesson.number === 'T' ? 'Review Test' : 'Review') : `Lesson ${lesson.number}`}
            </p>
            <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(24px, 3.5vw, 36px)', color: '#2A2318', marginBottom: '10px', letterSpacing: '0.02em' }}>
              {lesson.title}
            </h1>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>{lesson.subtitle}</p>
          </div>

          {!practicing && (
            <>
              <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: '14px', padding: '20px 24px', marginBottom: '16px' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', lineHeight: 1.75, marginBottom: 0 }}>
                  {lesson.description}
                </p>
              </div>
              {isLetterNamesLesson && (
                <div style={{ marginBottom: 16 }}>
                  <LetterNamesVisuals />
                </div>
              )}
            </>
          )}

          {sessionDone && (
            <div style={{ background: nowCompleted ? '#EAF3DE' : '#FDFAF3', border: `1px solid ${nowCompleted ? '#C0DD97' : '#DDD8CA'}`, borderRadius: '14px', padding: '20px 24px', marginBottom: '24px' }}>
              <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: nowCompleted ? '#2A5C0A' : '#2A2318', marginBottom: '6px' }}>
                {nowCompleted ? 'Lesson complete' : 'Session finished'}
              </p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', marginBottom: nowCompleted && next ? '16px' : 0 }}>
                Score: <strong style={{ color: '#2A2318' }}>{Math.round(sessionScore * 100)}%</strong> — {Math.round(sessionScore * sessionTotal)} / {sessionTotal} correct
              </p>
              {nowCompleted && next && (
                <Link href={`/programs/cm/l1/${next.slug}`} style={{ textDecoration: 'none' }}>
                  <span style={{ display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-compact)', background: '#1A1A18', color: 'white', borderRadius: '10px', padding: '10px 20px' }}>
                    Next: {next.title} →
                  </span>
                </Link>
              )}
            </div>
          )}

          {unlocked && (
            <div style={{ background: 'white', border: '1px solid #E8E4DC', borderRadius: '16px', padding: '28px' }}>
              {!practicing ? (
                <>
                  <p style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: 400, color: '#2A2318', marginBottom: '8px' }}>
                    Practice
                  </p>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', marginBottom: '20px', lineHeight: 1.6 }}>
                    {isLetterNamesLesson
                      ? <>Four exercises: identify note letters (mixed clefs), place letters on the staff, review common ledger-line notes, then spell short words from the notes shown on each clef. Pass {Math.round(lesson.passingScore * 100)}% to complete this module.</>
                      : <>Placeholder interaction only for now. Pass {Math.round(lesson.passingScore * 100)}% to complete this module.</>
                    }
                  </p>
                  <button
                    onClick={() => {
                      setPracticing(true)
                      setSessionDone(false)
                    }}
                    style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
                  >
                    {completed ? 'Practice again →' : (progress?.sessions.length ?? 0) > 0 ? 'Continue →' : 'Begin →'}
                  </button>
                </>
              ) : (
                isLetterNamesLesson ? (
                  <LetterNamesLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => handleComplete(s, t)}
                  />
                ) : (
                  <PlaceholderLesson
                    title={lesson.title}
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={handleComplete}
                  />
                )
              )}
            </div>
          )}

          {!unlocked && (
            <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: '14px', padding: '24px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0ACA4', margin: 0 }}>
                🔒 Complete the previous lesson to unlock this one.
              </p>
            </div>
          )}

          {!practicing && <LessonPager prev={prev} next={next} />}
        </div>
      </div>
    </div>
  )
}
