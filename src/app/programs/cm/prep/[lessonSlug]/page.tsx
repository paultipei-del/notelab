'use client'

import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { getCMPrepLesson, nextCMPrepLesson } from '@/lib/programs/cm-prep/lessons'
import {
  loadCMPrepProgress, loadCMPrepProgressRemote,
  isCMPrepLessonUnlocked, recordCMPrepSession, recordCMPrepSessionRemote,
  type CMPrepProgressStore,
} from '@/lib/programs/cm-prep/progress'
import { useAuth } from '@/hooks/useAuth'
import {
  getQuestionsForLesson, getNotePoolForLesson,
  LINE_SPACE_POOL, shuffle,
} from '@/lib/programs/cm-prep/questions'
import { CM_PREP_CARDS } from '@/lib/cm-content/preparatory'
import GrandStaffLesson from '@/components/programs/cm-prep/GrandStaffLesson'
import LineSpaceLesson from '@/components/programs/cm-prep/LineSpaceLesson'
import MCQuiz from '@/components/programs/cm-prep/MCQuiz'
import StaffNoteQuiz from '@/components/programs/cm-prep/StaffNoteQuiz'
import LineSpaceQuiz from '@/components/programs/cm-prep/LineSpaceQuiz'
import FlashSession from '@/components/programs/cm-prep/FlashSession'
import TrebleClefLesson from '@/components/programs/cm-prep/TrebleClefLesson'
import BassClefLesson from '@/components/programs/cm-prep/BassClefLesson'
import SharpsFlatsLesson from '@/components/programs/cm-prep/SharpsFlatsLesson'
import HalfWholeStepsLesson from '@/components/programs/cm-prep/HalfWholeStepsLesson'
import IntervalsLesson from '@/components/programs/cm-prep/IntervalsLesson'
import MajorPatternsLesson from '@/components/programs/cm-prep/MajorPatternsLesson'
import MinorPatternsLesson from '@/components/programs/cm-prep/MinorPatternsLesson'
import ReviewPatternsLesson from '@/components/programs/cm-prep/ReviewPatternsLesson'
import ReviewLessons1to9Lesson from '@/components/programs/cm-prep/ReviewLessons1to9Lesson'
import KeySignaturesLesson from '@/components/programs/cm-prep/KeySignaturesLesson'
import MajorScalesLesson from '@/components/programs/cm-prep/MajorScalesLesson'
import LessonVisual from '@/components/programs/cm-prep/LessonVisual'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#BA7517'
const ACCENT_BG = 'rgba(186,117,23,0.12)'
const ACCENT_BORDER = 'rgba(186,117,23,0.25)'

// Signs & Terms cards only (ids 101–119)
const SIGNS_TERMS_CARDS = CM_PREP_CARDS.filter(c => c.id >= 101 && c.id <= 119)

interface Props { params: Promise<{ lessonSlug: string }> }

export default function CMPrepLessonPage({ params }: Props) {
  const { lessonSlug } = use(params)
  const lesson = getCMPrepLesson(lessonSlug)
  const next = nextCMPrepLesson(lessonSlug)

  const [store, setStore] = useState<CMPrepProgressStore>({})
  const [practicing, setPracticing] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const { user } = useAuth()

  // Local cache first (instant), then overlay remote data when signed in.
  useEffect(() => { setStore(loadCMPrepProgress()) }, [])
  useEffect(() => {
    if (!user) return
    let cancelled = false
    loadCMPrepProgressRemote(user.id).then(remote => {
      if (!cancelled) setStore(remote)
    })
    return () => { cancelled = true }
  }, [user])

  if (!lesson) {
    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, color: '#7A7060' }}>Lesson not found.</p>
      </div>
    )
  }

  const unlocked = isCMPrepLessonUnlocked(lessonSlug, store)
  const progress = store[lessonSlug]
  const completed = progress?.completed ?? false

  async function handleComplete(score: number, total: number) {
    setSessionScore(score)
    setSessionTotal(total)
    setSessionDone(true)
    if (user) {
      await recordCMPrepSessionRemote(user.id, lessonSlug, score, total)
    } else {
      recordCMPrepSession(lessonSlug, score, total)
    }
    setStore(loadCMPrepProgress())
  }

  const nowCompleted = sessionDone && sessionScore >= lesson.passingScore

  return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Breadcrumb */}
        <Link href="/programs/cm/prep" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            ← Preparatory Level
          </span>
        </Link>

        {/* Header */}
        <div style={{ marginTop: '28px', marginBottom: '28px' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '8px' }}>
            {lesson.type === 'review' ? (lesson.number === 'T' ? 'Review Test' : 'Review') : `Lesson ${lesson.number}`}
          </p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 'clamp(24px, 3.5vw, 36px)', color: '#2A2318', marginBottom: '10px', letterSpacing: '0.02em' }}>
            {lesson.title}
          </h1>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            {lesson.subtitle}
          </p>
        </div>

        {/* Previous session summary */}
        {!practicing && (completed || (progress?.sessions.length ?? 0) > 0) && !sessionDone && (
          <div style={{
            background: completed ? '#F0F7E8' : '#FDFAF3',
            border: `1px solid ${completed ? '#C0DD97' : '#DDD8CA'}`,
            borderRadius: '14px', padding: '16px 20px', marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {completed && <span style={{ color: ACCENT, fontSize: '13px' }}>✓</span>}
              <p style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: 400, color: completed ? ACCENT : '#2A2318', margin: 0 }}>
                {completed ? 'Completed' : 'In progress'}
              </p>
            </div>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0 }}>
              Best score: <strong style={{ color: '#2A2318' }}>{Math.round((progress?.bestScore ?? 0) * 100)}%</strong>
              {' · '}
              {progress?.sessions.length ?? 0} session{(progress?.sessions.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Session result */}
        {sessionDone && (
          <div style={{
            background: nowCompleted ? '#EAF3DE' : '#FDFAF3',
            border: `1px solid ${nowCompleted ? '#C0DD97' : '#DDD8CA'}`,
            borderRadius: '14px', padding: '20px 24px', marginBottom: '24px',
          }}>
            <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: nowCompleted ? '#2A5C0A' : '#2A2318', marginBottom: '6px' }}>
              {nowCompleted ? 'Lesson complete' : 'Session finished'}
            </p>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', marginBottom: nowCompleted && next ? '16px' : 0 }}>
              Score: <strong style={{ color: '#2A2318' }}>{Math.round(sessionScore * 100)}%</strong>
              {' — '}
              {Math.round(sessionScore * sessionTotal)} / {sessionTotal} correct
            </p>
            {nowCompleted && next && (
              <Link href={`/programs/cm/prep/${next.slug}`} style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-compact)',
                  background: '#1A1A18', color: 'white', borderRadius: '10px', padding: '10px 20px',
                }}>
                  Next: {next.title} →
                </span>
              </Link>
            )}
            {nowCompleted && !next && (
              <Link href="/programs/cm/prep" style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-compact)',
                  background: '#1A1A18', color: 'white', borderRadius: '10px', padding: '10px 20px',
                }}>
                  Back to program →
                </span>
              </Link>
            )}
          </div>
        )}

        {/* Visual teaching section */}
        {!practicing && <LessonVisual lessonSlug={lessonSlug} />}

        {/* Concept section */}
        {!practicing && (
          <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: '14px', padding: '20px 24px', marginBottom: '16px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', lineHeight: 1.75, marginBottom: 0 }}>
              {lesson.description}
            </p>
          </div>
        )}

        {/* Per-key summary cards for the Major Scales lesson */}
        {!practicing && lessonSlug === 'major-scales' && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540',
              lineHeight: 1.75, margin: '0 0 12px' }}>
              Because the step sequence has to stay the same, starting on a pitch other than C
              forces a sharp or flat to appear. That&apos;s exactly why each key has its own
              signature:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{
                background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 10,
                padding: '10px 12px',
              }}>
                <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#7A7060', margin: '0 0 4px' }}>C major</p>
                <p style={{ fontFamily: SERIF, fontSize: 15, color: '#1A1A18', margin: 0 }}>
                  No sharps or flats
                </p>
              </div>
              <div style={{
                background: 'rgba(59,109,181,0.06)', border: '1px solid rgba(59,109,181,0.22)',
                borderRadius: 10, padding: '10px 12px',
              }}>
                <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#3B6DB5', margin: '0 0 4px' }}>F major</p>
                <p style={{ fontFamily: SERIF, fontSize: 15, color: '#1A1A18', margin: 0 }}>
                  One flat — B♭
                </p>
              </div>
              <div style={{
                background: 'rgba(42,92,10,0.07)', border: '1px solid rgba(42,92,10,0.22)',
                borderRadius: 10, padding: '10px 12px',
              }}>
                <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#2A5C0A', margin: '0 0 4px' }}>G major</p>
                <p style={{ fontFamily: SERIF, fontSize: 15, color: '#1A1A18', margin: 0 }}>
                  One sharp — F♯
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Concept mnemonics for note-reading lessons */}
        {!practicing && (lessonSlug === 'treble-clef-notes' || lessonSlug === 'review-letter-names') && (
          <div style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '14px', padding: '20px 24px', marginBottom: '20px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: ACCENT, marginBottom: '12px' }}>
              Treble Staff
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' as const }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', margin: '0 0 4px', lineHeight: 1.6 }}>
                  <strong>Lines</strong> (5 staff lines): E G B D F
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 14px', fontStyle: 'italic' }}>
                  "Every Good Boy Does Fine"
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', margin: '0 0 4px', lineHeight: 1.6 }}>
                  <strong>Spaces</strong> (4 inner spaces): F A C E
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0, fontStyle: 'italic' }}>
                  "FACE"
                </p>
              </div>
              <div style={{ flex: 1, minWidth: 160, borderLeft: `1px solid ${ACCENT_BORDER}`, paddingLeft: '24px' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', margin: '0 0 4px', lineHeight: 1.6 }}>
                  <strong>Lines</strong> (incl. ledger lines): C E G B D F A
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 14px', fontStyle: 'italic' }}>
                  "Can Every Good Boy Do Fine Always"
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', margin: '0 0 4px', lineHeight: 1.6 }}>
                  <strong>Spaces</strong> (incl. boundary spaces): D F A C E G
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0, fontStyle: 'italic' }}>
                  "Do Funny Animals Come Every Game"
                </p>
              </div>
            </div>
          </div>
        )}

        {!practicing && (lessonSlug === 'bass-clef-notes' || lessonSlug === 'review-letter-names') && (
          <div style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '14px', padding: '20px 24px', marginBottom: '20px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: ACCENT, marginBottom: '12px' }}>
              Bass Staff
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' as const }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', margin: '0 0 4px', lineHeight: 1.6 }}>
                  <strong>Lines</strong> (5 staff lines): G B D F A
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 14px', fontStyle: 'italic' }}>
                  "Good Boys Do Fine Always"
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', margin: '0 0 4px', lineHeight: 1.6 }}>
                  <strong>Spaces</strong> (4 inner spaces): A C E G
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0, fontStyle: 'italic' }}>
                  "All Cows Eat Grass"
                </p>
              </div>
              <div style={{ flex: 1, minWidth: 160, borderLeft: `1px solid ${ACCENT_BORDER}`, paddingLeft: '24px' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', margin: '0 0 4px', lineHeight: 1.6 }}>
                  <strong>Lines</strong> (incl. ledger lines): E G B D F A C
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 14px', fontStyle: 'italic' }}>
                  "Every Good Boy Deserves Fudge And Candy"
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#4A4540', margin: '0 0 4px', lineHeight: 1.6 }}>
                  <strong>Spaces</strong> (incl. boundary spaces): F A C E G B
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0, fontStyle: 'italic' }}>
                  "Fat Alligators Can Eat Giant Bugs"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Practice section */}
        {unlocked && (
          <div style={{ background: 'white', border: '1px solid #E8E4DC', borderRadius: '16px', padding: '28px' }}>
            {!practicing ? (
              <>
                <p style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: 400, color: '#2A2318', marginBottom: '8px' }}>
                  Practice
                </p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', marginBottom: '20px', lineHeight: 1.6 }}>
                  {lesson.tool === 'treble-clef-lesson' && 'Six exercises: name and place space notes, name and place line notes, then read notes that spell words.'}
                  {lesson.tool === 'bass-clef-lesson' && 'Six exercises: name and place space notes, name and place line notes, then read notes that spell words.'}
                  {lesson.tool === 'line-space-lesson' && 'Five exercises: identify line and space notes, classify notes, and draw notes on the staff.'}
                  {lesson.tool === 'grand-staff-lesson' && 'Three exercises: identify missing parts, build the grand staff, and match symbols to names.'}
                  {lesson.tool === 'staff-note-quiz' && 'Identify notes on the staff. A new set of notes will be shown each session.'}
                  {lesson.tool === 'line-space-quiz' && 'Look at each note on the treble staff and decide whether it sits on a line or in a space.'}
                  {lesson.tool === 'mc-quiz' && 'Answer multiple-choice questions about the concepts in this lesson.'}
                  {lesson.tool === 'mixed-quiz' && 'A mixed set of questions drawing from all topics covered so far.'}
                  {lesson.tool === 'half-whole-lesson' && 'Four exercises: find half and whole steps on the keyboard, identify step types from letter names, and read steps on the staff.'}
                  {lesson.tool === 'intervals-lesson' && 'Four exercises: name intervals on the staff, build intervals by placing a second note, and identify intervals in short musical phrases.'}
                  {lesson.tool === 'major-patterns-lesson' && 'Five exercises: identify five-finger patterns on the staff, match pattern and triad shapes to their letter names, and build both on the keyboard and staff.'}
                  {lesson.tool === 'minor-patterns-lesson' && 'Six exercises: build minor patterns and triads on the keyboard, match patterns and triads to their letter names, and convert between major and minor by adding the right accidental.'}
                  {lesson.tool === 'review-patterns-lesson' && 'Two exercises: name each pattern on the staff as major or minor, then write patterns and triads in both clefs.'}
                  {lesson.tool === 'review-1to9-lesson' && 'Five exercises drawn from Lessons 1–9: complete the grand staff, name notes in both clefs, identify whole and half steps, name intervals, and name five-finger patterns.'}
                  {lesson.tool === 'key-signatures-lesson' && 'Four exercises: match each key signature to its name, identify the accidental and the key, write the key signature on an empty staff, and name the key of a short musical example.'}
                  {lesson.tool === 'major-scales-lesson' && 'Two exercises: mark the whole and half steps in each major scale, then write C, F, and G major scales in both clefs.'}
                  {lesson.tool === 'flash-session' && 'Flip through each term and rate whether you knew it — review the ones you missed.'}
                  {' '}Pass {Math.round(lesson.passingScore * 100)}% to complete the lesson.
                </p>
                <button
                  onClick={() => { setPracticing(true); setSessionDone(false) }}
                  style={{
                    background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px',
                    padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
                  }}
                >
                  {completed ? 'Practice again →' : sessionDone ? 'Try again →' : (progress?.sessions.length ?? 0) > 0 ? 'Continue →' : 'Begin →'}
                </button>
              </>
            ) : (
              <>
                {/* Active quiz */}
                {lesson.tool === 'bass-clef-lesson' ? (
                  <BassClefLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'treble-clef-lesson' ? (
                  <TrebleClefLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'line-space-lesson' ? (
                  <LineSpaceLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'grand-staff-lesson' ? (
                  <GrandStaffLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'mc-quiz' || lesson.tool === 'mixed-quiz' ? (
                  <MCQuiz
                    questions={getQuestionsForLesson(lessonSlug)}
                    passingScore={lesson.passingScore}
                    accentColor={ACCENT}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'staff-note-quiz' ? (
                  <StaffNoteQuiz
                    pool={getNotePoolForLesson(lessonSlug)}
                    passingScore={lesson.passingScore}
                    accentColor={ACCENT}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'line-space-quiz' ? (
                  <LineSpaceQuiz
                    pool={LINE_SPACE_POOL}
                    passingScore={lesson.passingScore}
                    accentColor={ACCENT}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'sharps-flats-lesson' ? (
                  <SharpsFlatsLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'half-whole-lesson' ? (
                  <HalfWholeStepsLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'intervals-lesson' ? (
                  <IntervalsLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'major-patterns-lesson' ? (
                  <MajorPatternsLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'minor-patterns-lesson' ? (
                  <MinorPatternsLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'review-patterns-lesson' ? (
                  <ReviewPatternsLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'review-1to9-lesson' ? (
                  <ReviewLessons1to9Lesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'key-signatures-lesson' ? (
                  <KeySignaturesLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'major-scales-lesson' ? (
                  <MajorScalesLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'flash-session' ? (
                  <FlashSession
                    cards={SIGNS_TERMS_CARDS}
                    passingScore={lesson.passingScore}
                    accentColor={ACCENT}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : null}
              </>
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

      </div>
    </div>
  )
}
