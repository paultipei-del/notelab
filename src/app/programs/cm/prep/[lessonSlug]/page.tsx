'use client'

import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { getCMPrepLesson, nextCMPrepLesson, prevCMPrepLesson, CM_PREP_LESSONS } from '@/lib/programs/cm-prep/lessons'
import { Breadcrumb } from '@/components/programs/cm-prep/nav/Breadcrumb'
import { LessonPager } from '@/components/programs/cm-prep/nav/LessonPager'
import {
  loadCMPrepProgress, loadCMPrepProgressRemote,
  isCMPrepLessonUnlocked, recordCMPrepSession, recordCMPrepSessionRemote,
  markCMPrepCelebrated,
  type CMPrepProgressStore,
} from '@/lib/programs/cm-prep/progress'
import LessonCompletionMarquee from '@/components/programs/cm-prep/LessonCompletionMarquee'
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
import TimeSignaturesLesson from '@/components/programs/cm-prep/TimeSignaturesLesson'
import SignsTermsLesson from '@/components/programs/cm-prep/SignsTermsLesson'
import ReviewLessons10to13Lesson from '@/components/programs/cm-prep/ReviewLessons10to13Lesson'
import ReviewTestLesson from '@/components/programs/cm-prep/ReviewTestLesson'
import LessonVisual from '@/components/programs/cm-prep/LessonVisual'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const ACCENT = '#BA7517'
const ACCENT_BG = 'rgba(186,117,23,0.12)'
const ACCENT_BORDER = 'rgba(186,117,23,0.25)'

// Signs & Terms cards only (ids 101–119)
const SIGNS_TERMS_CARDS = CM_PREP_CARDS.filter(c => c.id >= 101 && c.id <= 119)

// Exercise totals per multi-exercise lesson tool. Used by the completion
// marquee's stats row. Tools not listed (mc-quiz, staff-note-quiz, etc.)
// omit the exercises stat.
const EXERCISES_BY_SLUG: Record<string, number> = {
  'grand-staff': 8,
  'line-space-notes': 5,
  'treble-clef-notes': 6,
  'bass-clef-notes': 6,
  'sharps-flats-naturals': 4,
  'half-whole-steps': 4,
  'intervals': 4,
  'major-patterns': 5,
  'minor-patterns': 6,
  'review-patterns': 2,
  'key-signatures': 4,
  'major-scales': 2,
  'time-signatures': 4,
  'signs-terms': 4,
}

// Per-lesson celebration lead copy. Each line names what the student just
// internalized so the moment lands on the thing they actually built, not a
// generic congratulation. New lessons fall back to DEFAULT_LEAD until they
// earn their own voice.
const LESSON_LEAD_COPY: Record<string, string> = {
  'grand-staff': 'Both clefs, lines and spaces, every symbol to its name. The foundation is set.',
  'line-space-notes': 'Line or space — two ways a note can sit on the staff. You can spot them at a glance now.',
  'treble-clef-notes': 'Every line and space from C4 up through F5. The treble clef reads itself.',
  'bass-clef-notes': 'Lower staff named. The full grand staff is within reach.',
  'sharps-flats-naturals': 'Sharps raise, flats lower, naturals cancel. The half-step language is yours.',
  'half-whole-steps': 'Half steps and whole steps — the two distances that build every scale and pattern.',
  'intervals': 'Counting up the staff from one note to the next. Seconds through fifths, line and space.',
  'major-patterns': 'Whole-Whole-Half-Whole. Four major patterns, four bright triads.',
  'minor-patterns': 'Whole-Half-Whole-Whole. One half-step shift turns major into minor.',
  'key-signatures': 'C, F, and G major — the three signatures every Preparatory piece is written in.',
  'major-scales': 'W W H W W W H — the formula that builds every major scale.',
  'time-signatures': 'Top number for beats per measure, bottom for which note gets the beat.',
  'signs-terms': 'Tempo, dynamics, articulation, structure. The vocabulary of expression is in place.',
}
const DEFAULT_LEAD = "You've completed this lesson. On to the next one."

// Total ordered lessons (type === 'lesson') in the Preparatory level — used
// for the "1/18 lessons in Preparatory" stat. Recomputed once at module load.
const PREP_LESSONS_ORDERED = CM_PREP_LESSONS.filter(l => l.type === 'lesson')

interface Props { params: Promise<{ lessonSlug: string }> }

export default function CMPrepLessonPage({ params }: Props) {
  const { lessonSlug } = use(params)
  const lesson = getCMPrepLesson(lessonSlug)
  const next = nextCMPrepLesson(lessonSlug)
  const prev = prevCMPrepLesson(lessonSlug)

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
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: F, color: '#7A7060' }}>Lesson not found.</p>
      </div>
    )
  }

  const unlocked = isCMPrepLessonUnlocked(lessonSlug, store)
  const progress = store[lessonSlug]
  const completed = progress?.completed ?? false
  const celebratedAt = progress?.celebratedAt

  // Suppress retroactive marquees for lessons that were completed before
  // celebratedAt existed. Silently mark them so subsequent loads stay quiet.
  useEffect(() => {
    if (completed && !celebratedAt && !sessionDone) {
      markCMPrepCelebrated(lessonSlug)
      setStore(loadCMPrepProgress())
    }
  }, [completed, celebratedAt, sessionDone, lessonSlug])

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
  // The new completion marquee owns the celebration moment for first-time
  // passes on lesson pages. When it renders, suppress the older inline
  // "Lesson complete / Session finished" card to avoid duplicate UI.
  const showMarquee =
    !practicing && lesson.type === 'lesson' && sessionDone && nowCompleted && !celebratedAt

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 32px 80px' }}>
       <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Breadcrumb trail with optional completed pill */}
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          rowGap: '8px', columnGap: '14px',
        }}>
          <Breadcrumb crumbs={[
            { label: 'Certificate of Merit', href: '/programs/cm' },
            { label: 'Preparatory Level', href: '/programs/cm/prep' },
            { label: lesson.title },
          ]} />
          {!practicing && (completed || (progress?.sessions.length ?? 0) > 0) && !sessionDone && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 12px 4px 10px',
              background: 'var(--forest-soft)',
              border: '1px solid rgba(45, 90, 62, 0.24)',
              borderRadius: '100px',
              fontFamily: F, fontSize: '11px', color: 'var(--forest)',
            }}>
              {completed && <span aria-hidden="true">✓</span>}
              <span>{completed ? 'Completed' : 'In progress'}</span>
              <span style={{ color: 'rgba(45, 90, 62, 0.5)' }}>·</span>
              <span>Best <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{Math.round((progress?.bestScore ?? 0) * 100)}%</span></span>
              <span style={{ color: 'rgba(45, 90, 62, 0.5)' }}>·</span>
              <span>{progress?.sessions.length ?? 0} session{(progress?.sessions.length ?? 0) !== 1 ? 's' : ''}</span>
            </span>
          )}
        </div>

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

        {/* Session result card. Shows only for outcomes the marquee does
            NOT handle:
            - failed attempts (sessionDone but not nowCompleted) — student
              needs the score + try-again feedback
            - review-page passes (lesson.type === 'review')
            For lesson-type re-passes (already celebrated), suppress entirely:
            the completed pill in the breadcrumb already conveys state and
            the student doesn't need a duplicate celebration card. */}
        {sessionDone && !showMarquee && (lesson.type === 'review' || !nowCompleted) && (
          <div style={{
            background: nowCompleted ? 'var(--forest-soft)' : '#ECE3CC',
            border: `1px solid ${nowCompleted ? 'rgba(45, 90, 62, 0.24)' : '#D9CFAE'}`,
            borderRadius: '14px', padding: '20px 24px', marginBottom: '24px',
          }}>
            <p style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 500, color: nowCompleted ? 'var(--forest)' : '#2A2318', marginBottom: '6px' }}>
              {nowCompleted ? 'Lesson complete' : 'Session finished'}
            </p>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: 'var(--brown)', marginBottom: nowCompleted && next ? '16px' : 0 }}>
              Score: <strong style={{ color: 'var(--ink)' }}>{Math.round(sessionScore * 100)}%</strong>
              {' · '}
              {Math.round(sessionScore * sessionTotal)} / {sessionTotal} correct
            </p>
            {nowCompleted && next && (
              <Link href={`/programs/cm/prep/${next.slug}`} style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-compact)',
                  background: 'var(--oxblood)', color: '#FDFBF5', borderRadius: '10px', padding: '10px 20px',
                }}>
                  Next: {next.title} →
                </span>
              </Link>
            )}
            {nowCompleted && !next && (
              <Link href="/programs/cm/prep" style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-block', fontFamily: F, fontSize: 'var(--nl-text-compact)',
                  background: 'var(--oxblood)', color: '#FDFBF5', borderRadius: '10px', padding: '10px 20px',
                }}>
                  Back to program →
                </span>
              </Link>
            )}
          </div>
        )}

        {/* First-time-pass celebration marquee. Only fires when the student
            just transitioned this lesson from incomplete → complete in the
            current page session, and only for lesson-type pages. */}
        {showMarquee && (
          <LessonCompletionMarquee
            lessonSlug={lessonSlug}
            lessonNumber={parseInt(lesson.number, 10) || 1}
            lessonTitle={lesson.title}
            lessonLead={LESSON_LEAD_COPY[lessonSlug] ?? DEFAULT_LEAD}
            bestScore={progress?.bestScore ?? sessionScore}
            exerciseCount={EXERCISES_BY_SLUG[lessonSlug] ? {
              completed: EXERCISES_BY_SLUG[lessonSlug],
              total: EXERCISES_BY_SLUG[lessonSlug],
            } : undefined}
            lessonPosition={{
              current: PREP_LESSONS_ORDERED.findIndex(l => l.slug === lessonSlug) + 1,
              total: PREP_LESSONS_ORDERED.length,
              levelName: 'Preparatory',
            }}
            nextLessonNumber={next && next.type === 'lesson' ? parseInt(next.number, 10) : undefined}
            nextLessonTitle={next && next.type === 'lesson' ? next.title : undefined}
            nextLessonHref={next && next.type === 'lesson' ? `/programs/cm/prep/${next.slug}` : undefined}
          />
        )}

        {/* Visual teaching section */}
        {!practicing && <LessonVisual lessonSlug={lessonSlug} />}

        {/* Concept section */}
        {!practicing && (
          <div style={{
            background: 'var(--cream-key)',
            border: '1px solid var(--brown-faint)',
            borderRadius: '14px', padding: '22px 28px', marginBottom: '16px',
          }}>
            <p style={{
              fontFamily: F, fontSize: '11px', fontWeight: 500,
              letterSpacing: '1.5px', textTransform: 'uppercase' as const,
              color: 'var(--oxblood)', marginBottom: '10px',
            }}>
              Lesson notes
            </p>
            <p style={{
              fontFamily: SERIF,
              fontSize: '16px', lineHeight: 1.55,
              color: 'var(--brown)', margin: 0,
            }}>
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
                background: 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)', border: '1px solid var(--brown-faint)', borderRadius: 10,
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
                  One flat · B♭
                </p>
              </div>
              <div style={{
                background: 'rgba(42,92,10,0.07)', border: '1px solid rgba(42,92,10,0.22)',
                borderRadius: 10, padding: '10px 12px',
              }}>
                <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#2A5C0A', margin: '0 0 4px' }}>G major</p>
                <p style={{ fontFamily: SERIF, fontSize: 15, color: '#1A1A18', margin: 0 }}>
                  One sharp · F♯
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Concept mnemonics for note-reading lessons */}
        {!practicing && (lessonSlug === 'treble-clef-notes' || lessonSlug === 'review-letter-names') && (
          <div style={{
            background: '#eadacf',
            border: '1px solid rgba(160, 56, 28, 0.22)',
            borderRadius: '14px', padding: '20px 24px', marginBottom: '20px',
          }}>
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
          <div style={{
            background: '#eadacf',
            border: '1px solid rgba(160, 56, 28, 0.22)',
            borderRadius: '14px', padding: '20px 24px', marginBottom: '20px',
          }}>
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
          <div style={{ background: 'var(--cream-key)', border: '1px solid var(--brown-faint)', borderRadius: '16px', padding: '28px' }}>
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
                  {lesson.tool === 'time-signatures-lesson' && 'Four exercises: answer questions about how time signatures work, identify the beat value of each note and rest, write the counts under a rhythm line in 2/4, 3/4, and 4/4, and write the counts for real rhythms from real music.'}
                  {lesson.tool === 'signs-terms-lesson' && 'Four exercises: match signs with definitions, identify the sign, play a memory-match pair game, and group each sign by category.'}
                  {lesson.tool === 'review-10-13-lesson' && 'Five exercises drawn from Lessons 10–13: write counts and place accents, match terms to definitions, complete scales with sharps or flats, identify keys from key signatures, and identify signs and terms.'}
                  {lesson.tool === 'review-test-lesson' && 'A comprehensive preparatory-level test modelled on the Certificate of Merit Practice Theory Test. Name notes on the grand staff, complete Major scales, identify key signatures, name notes and rests, recognize signs and terms, and label parts of the grand staff.'}
                  {lesson.tool === 'flash-session' && 'Flip through each term and rate whether you knew it. Review the ones you missed.'}
                  {' '}Pass {Math.round(lesson.passingScore * 100)}% to complete the lesson.
                </p>
                <button
                  onClick={() => { setPracticing(true); setSessionDone(false) }}
                  style={{
                    background: 'var(--oxblood)', color: '#FDFBF5', border: '1px solid var(--oxblood)', borderRadius: '10px',
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
                ) : lesson.tool === 'time-signatures-lesson' ? (
                  <TimeSignaturesLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'signs-terms-lesson' ? (
                  <SignsTermsLesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'review-10-13-lesson' ? (
                  <ReviewLessons10to13Lesson
                    passingScore={lesson.passingScore}
                    previouslyCompleted={completed}
                    onComplete={(s, t) => { handleComplete(s, t); setPracticing(false) }}
                  />
                ) : lesson.tool === 'review-test-lesson' ? (
                  <ReviewTestLesson
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
          <div style={{ background: 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)', border: '1px solid var(--brown-faint)', borderRadius: '14px', padding: '24px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B0ACA4', margin: 0 }}>
              🔒 Complete the previous lesson to unlock this one.
            </p>
          </div>
        )}

        {/* Adjacent-lesson pager */}
        {!practicing && <LessonPager prev={prev} next={next} />}

       </div>
      </div>
    </div>
  )
}
