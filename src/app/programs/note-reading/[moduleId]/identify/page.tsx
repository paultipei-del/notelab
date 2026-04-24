'use client'

import { useState, useEffect, useCallback, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { getNRModule, buildWeightedPool, NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  recordNRIdentifySession,
  isNRModuleUnlocked,
  loadNRProgress,
  nrConsecutivePassing,
  getNoteStats,
  buildReviewPool,
  injectReviewQuestions,
  recordRetention,
  type QueueEntry,
} from '@/lib/programs/note-reading/progress'
import type { NoteResult } from '@/lib/programs/note-reading/types'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import { playPitch } from '@/lib/pianoPlayback'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const SESSION_LENGTH = 20
const RETRY_LENGTH = 5
const CORRECT_ADVANCE_MS = 600
const WRONG_ADVANCE_MS = 1500

const CORRECT_BG = '#EAF3DE'
const CORRECT_FG = '#3B6D11'
const CORRECT_BORDER = '#C0DD97'
const WRONG_BG = '#FCEBEB'
const WRONG_FG = '#A32D2D'
const WRONG_BORDER = '#F09595'

const NATURAL_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const ACCIDENTAL_NOTES = ['C#','Db','D#','Eb','F#','Gb','G#','Ab','A#','Bb']

// Landmark (key reference) notes taught on /learn. Shown on wrong answers
// to reinforce the reading anchors rather than a raw pitch label.
const LANDMARK_REFS: Record<string, string> = {
  C4: 'Middle C',
  G3: 'Bass 4th line',
  B3: 'Bass top line',
  D5: 'Treble 4th line',
  G4: 'Treble 2nd line',
  B4: 'Treble middle line',
  F5: 'Treble top line',
}

// Fallback line/space labels for non-landmark naturals on treble/bass staves.
const TREBLE_LINE: Record<string, string> = { E4: 'Treble 1st line', G4: 'Treble 2nd line', B4: 'Treble middle line', D5: 'Treble 4th line', F5: 'Treble top line' }
const TREBLE_SPACE: Record<string, string> = { F4: 'Treble 1st space', A4: 'Treble 2nd space', C5: 'Treble 3rd space', E5: 'Treble top space' }
const BASS_LINE: Record<string, string> = { G2: 'Bass 1st line', B2: 'Bass 2nd line', D3: 'Bass middle line', F3: 'Bass 4th line', A3: 'Bass top line' }
const BASS_SPACE: Record<string, string> = { A2: 'Bass 1st space', C3: 'Bass 2nd space', E3: 'Bass 3rd space', G3: 'Bass top space' }

function staffReference(pitch: string): string | null {
  if (LANDMARK_REFS[pitch]) return LANDMARK_REFS[pitch]
  return TREBLE_LINE[pitch] || TREBLE_SPACE[pitch] || BASS_LINE[pitch] || BASS_SPACE[pitch] || null
}

function pitchClass(pitch: string): string {
  return pitch.replace(/\d+$/, '')
}

function hasAccidentals(notes: string[]): boolean {
  return notes.some(n => /[#b]/.test(n))
}

function isEquivalent(a: string, b: string): boolean {
  if (a === b) return true
  const pairs: Array<[string, string]> = [
    ['F#','Gb'],['C#','Db'],['D#','Eb'],['G#','Ab'],['A#','Bb'],
  ]
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x))
}

type AnswerState = 'idle' | 'correct' | 'wrong'

interface Props { params: Promise<{ moduleId: string }> }

export default function IdentifySessionPage({ params }: Props) {
  const { moduleId } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { hasSubscription, loading: purchasesLoading } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()
  const isLoading = authLoading || purchasesLoading
  const isFreeModule = moduleId === 'landmarks'

  const mod = getNRModule(moduleId)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [clickedAnswer, setClickedAnswer] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<{ mp: ReturnType<typeof recordNRIdentifySession>['mp']; identifyJustMastered: boolean } | null>(null)
  const [retryMode, setRetryMode] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const processingRef = useRef(false)
  // Per-note tracking: full pitch → {attempts, correct}. Module-only —
  // review answers never land here.
  const noteResultsRef = useRef<Record<string, NoteResult>>({})
  // Display misses: pitchClass → count (for summary "Missed: C, G" list)
  const displayMissRef = useRef<Record<string, number>>({})
  // Full-pitch miss set — drives the "Retry missed" mini-session.
  const missedPitchesRef = useRef<Set<string>>(new Set())
  // Per-question timing. questionStartRef marks when the current card
  // appeared; timingsRef accumulates ms-to-correct-answer across the run.
  const questionStartRef = useRef<number>(0)
  const timingsRef = useRef<number[]>([])
  // Review tally for the session summary.
  const reviewHitsRef = useRef<{ answered: number; correct: number }>({ answered: 0, correct: 0 })
  // Total module questions answered (regardless of correctness). Drives the
  // denominator when computing module accuracy so injected review questions
  // don't dilute it.
  const moduleAnsweredRef = useRef<number>(0)

  const sessionLength = retryMode ? Math.min(RETRY_LENGTH, queue.length) : queue.length

  useEffect(() => {
    if (!isLoading && !isFreeModule && !isPro) router.replace('/account')
  }, [isLoading, isFreeModule, isPro])

  useEffect(() => {
    if (!mod) return
    const store = loadNRProgress()
    if (!isNRModuleUnlocked(moduleId, store)) {
      router.replace(`/programs/note-reading/${moduleId}`)
      return
    }
    const stats = getNoteStats(moduleId, 'identify', store)
    const q = buildWeightedPool(mod.notes, stats, SESSION_LENGTH)
    for (let i = 1; i < q.length; i++) {
      if (pitchClass(q[i]) === pitchClass(q[i - 1])) {
        const j = Math.min(i + 1 + Math.floor(Math.random() * 3), q.length - 1)
        if (j > i) [q[i], q[j]] = [q[j], q[i]]
      }
    }
    // Cumulative review — pull 2-3 weak notes from prior completed modules
    // and inject at non-adjacent interior positions. Returns the tagged
    // queue unchanged if no completed prior modules exist.
    const reviewPool = buildReviewPool(moduleId, 3)
    setQueue(injectReviewQuestions(q, reviewPool))
    noteResultsRef.current = {}
    displayMissRef.current = {}
    missedPitchesRef.current = new Set()
    timingsRef.current = []
    reviewHitsRef.current = { answered: 0, correct: 0 }
    moduleAnsweredRef.current = 0
    questionStartRef.current = performance.now()
  }, [moduleId])

  // Reset the question-start timer whenever we move to a new card.
  useEffect(() => {
    if (answerState === 'idle') questionStartRef.current = performance.now()
  }, [qIdx, answerState])

  const currentEntry = queue[qIdx]
  const currentPitch = currentEntry?.pitch ?? ''
  const currentPitchClass = pitchClass(currentPitch)
  const currentReview = currentEntry?.review ?? null
  const useAccidentalLayout = mod ? hasAccidentals(mod.notes) : false

  const handleAnswer = useCallback((answer: string) => {
    if (processingRef.current || done || !currentPitch) return
    processingRef.current = true

    const isCorrect = isEquivalent(answer, currentPitchClass)

    // Measure time for this question (correct or wrong — we keep both so the
    // summary can distinguish "fast correct" from "slow / second guess").
    const elapsed = performance.now() - questionStartRef.current
    timingsRef.current.push(elapsed)

    // Play the pitch. Non-blocking; audio failures are swallowed inside
    // playPitch so they never affect drill flow.
    void playPitch(currentPitch)

    if (currentReview) {
      // Review question: log to retention, don't touch module accuracy.
      recordRetention({
        sourceModuleId: currentReview.sourceModuleId,
        pitch: currentPitch,
        correct: isCorrect,
      })
      reviewHitsRef.current.answered++
      if (isCorrect) reviewHitsRef.current.correct++
    } else {
      moduleAnsweredRef.current++
      const nr = noteResultsRef.current
      if (!nr[currentPitch]) nr[currentPitch] = { attempts: 0, correct: 0 }
      nr[currentPitch].attempts++
      if (isCorrect) {
        nr[currentPitch].correct++
        setCorrectCount(c => c + 1)
      } else {
        displayMissRef.current[currentPitchClass] = (displayMissRef.current[currentPitchClass] ?? 0) + 1
        missedPitchesRef.current.add(currentPitch)
      }
    }

    setClickedAnswer(answer)
    setAnswerState(isCorrect ? 'correct' : 'wrong')

    // Intra-session reweight: module misses only. Review misses don't
    // multiply — they belong to a prior module's bucket.
    if (!isCorrect && !retryMode && !currentReview) {
      setQueue(prev => {
        const next = prev.slice()
        const len = next.length
        const insertPositions = [qIdx + 2, qIdx + 4]
          .map(p => Math.min(p + Math.floor(Math.random() * 3), len))
          .filter(p => p > qIdx + 1 && p <= len)
        insertPositions.sort((a, b) => b - a)
        for (const pos of insertPositions) next.splice(pos, 0, { pitch: currentPitch, review: null })
        return next
      })
    }

    setTimeout(() => {
      const next = qIdx + 1
      if (next >= sessionLength) {
        setDone(true)
      } else {
        setQIdx(next)
        setAnswerState('idle')
        setClickedAnswer(null)
      }
      processingRef.current = false
    }, isCorrect ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS)
  }, [currentPitch, currentPitchClass, currentReview, qIdx, done, retryMode, sessionLength])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toUpperCase()
      if (NATURAL_LETTERS.includes(key)) handleAnswer(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleAnswer])

  // Save progress when done. Retry mini-sessions intentionally don't
  // record — they exist to shore up weak notes without affecting pass/fail.
  useEffect(() => {
    if (!done || !mod) return
    if (retryMode) {
      setResult({ mp: { moduleId, identify: { completed: false }, play: { completed: false } } as unknown as ReturnType<typeof recordNRIdentifySession>['mp'], identifyJustMastered: false })
      return
    }
    // Accuracy uses the module-question denominator only, so injected
    // review questions don't dilute the threshold.
    const denom = moduleAnsweredRef.current > 0 ? moduleAnsweredRef.current : 1
    const accuracy = correctCount / denom
    const res = recordNRIdentifySession(moduleId, accuracy, noteResultsRef.current)
    setResult(res)
  }, [done])

  if (!mod) return null
  if (!queue.length) return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: F, color: '#7A7060' }}>Loading…</p>
    </div>
  )

  const progressPct = (qIdx / sessionLength) * 100
  // Module accuracy denominator excludes injected review questions.
  const moduleDenom = moduleAnsweredRef.current > 0 ? moduleAnsweredRef.current : 1
  const accuracy = done ? correctCount / moduleDenom : correctCount / moduleDenom

  function buttonStyle(answer: string, isAccidental: boolean): React.CSSProperties {
    const base: React.CSSProperties = {
      borderRadius: isAccidental ? '10px' : '12px',
      border: '1px solid #DDD8CA',
      background: 'white',
      color: '#2A2318',
      fontFamily: isAccidental ? F : SERIF,
      fontWeight: 400,
      cursor: answerState !== 'idle' ? 'default' : 'pointer',
      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
    }
    const isClicked = clickedAnswer !== null && isEquivalent(answer, clickedAnswer)
    const isCorrectTarget = isEquivalent(answer, currentPitchClass)
    // The user clicked this button: flash the clicked button itself.
    if (isClicked) {
      if (answerState === 'correct') return { ...base, background: CORRECT_BG, borderColor: CORRECT_BORDER, color: CORRECT_FG }
      if (answerState === 'wrong') return { ...base, background: WRONG_BG, borderColor: WRONG_BORDER, color: WRONG_FG }
    }
    // The user picked wrong: also highlight the button that was actually
    // correct so they can see it.
    if (answerState === 'wrong' && isCorrectTarget) {
      return { ...base, background: CORRECT_BG, borderColor: CORRECT_BORDER, color: CORRECT_FG }
    }
    // Everything else dims while a feedback window is open.
    if (answerState !== 'idle') return { ...base, opacity: 0.5 }
    return base
  }

  function handleEndSession() {
    setShowEndConfirm(true)
  }

  function confirmEnd() {
    router.push(`/programs/note-reading/${moduleId}`)
  }

  // ── Summary screen ──────────────────────────────────────────────────────────
  if (done && result) {
    const { mp: savedMp, identifyJustMastered } = result
    const pct = Math.round(accuracy * 100)
    const missedEntries = Object.entries(displayMissRef.current).sort((a, b) => b[1] - a[1])
    const missedPitches = Array.from(missedPitchesRef.current)
    const passingSessions = retryMode ? 0 : nrConsecutivePassing(moduleId, 'identify', loadNRProgress())
    const needed = mod.criteria.sessions
    const threshold = mod.criteria.identifyAccuracy ?? 0.9
    const passedThisSession = !retryMode && accuracy >= threshold
    const showContinueToPlay = identifyJustMastered && mod.tools.includes('play')
    const nextModule = NOTE_READING_MODULES.find(m => m.unlockAfter.includes(moduleId))
    const avgMs = timingsRef.current.length
      ? Math.round(timingsRef.current.reduce((s, v) => s + v, 0) / timingsRef.current.length)
      : 0
    const fastestMs = timingsRef.current.length ? Math.round(Math.min(...timingsRef.current)) : 0

    function retry() {
      setDone(false)
      setResult(null)
      setQIdx(0)
      setCorrectCount(0)
      setAnswerState('idle')
      setClickedAnswer(null)
      setRetryMode(false)
      processingRef.current = false
      noteResultsRef.current = {}
      displayMissRef.current = {}
      missedPitchesRef.current = new Set()
      timingsRef.current = []
      reviewHitsRef.current = { answered: 0, correct: 0 }
      moduleAnsweredRef.current = 0
      const store = loadNRProgress()
      const stats = getNoteStats(moduleId, 'identify', store)
      const q = buildWeightedPool(mod!.notes, stats, SESSION_LENGTH)
      for (let i = 1; i < q.length; i++) {
        if (pitchClass(q[i]) === pitchClass(q[i - 1])) {
          const j = Math.min(i + 1 + Math.floor(Math.random() * 3), q.length - 1)
          if (j > i) [q[i], q[j]] = [q[j], q[i]]
        }
      }
      const reviewPool = buildReviewPool(moduleId, 3)
      setQueue(injectReviewQuestions(q, reviewPool))
      questionStartRef.current = performance.now()
    }

    function retryMissed() {
      if (missedPitches.length === 0) return
      // Build a RETRY_LENGTH queue by cycling through missed pitches.
      const q: string[] = []
      let i = 0
      while (q.length < RETRY_LENGTH) {
        q.push(missedPitches[i % missedPitches.length])
        i++
      }
      for (let k = q.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1))
        ;[q[k], q[j]] = [q[j], q[k]]
      }
      setDone(false)
      setResult(null)
      setQIdx(0)
      setCorrectCount(0)
      setAnswerState('idle')
      setClickedAnswer(null)
      setRetryMode(true)
      processingRef.current = false
      noteResultsRef.current = {}
      displayMissRef.current = {}
      missedPitchesRef.current = new Set()
      timingsRef.current = []
      reviewHitsRef.current = { answered: 0, correct: 0 }
      moduleAnsweredRef.current = 0
      // Retry mini-sessions skip review injection — they exist to shore up
      // module-specific weak notes, not to spread attention across modules.
      setQueue(q.map(p => ({ pitch: p, review: null })))
      questionStartRef.current = performance.now()
    }

    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '48px 40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            {retryMode ? 'Retry Complete' : 'Session Complete'}
          </p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '28px' }}>
            Note Identification
          </h2>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '30px', fontWeight: 300, color: pct >= Math.round(threshold * 100) ? CORRECT_FG : '#2A2318', margin: 0 }}>{pct}%</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Accuracy</p>
            </div>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '30px', fontWeight: 300, color: '#2A2318', margin: 0 }}>{(avgMs / 1000).toFixed(1)}s</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Avg time</p>
            </div>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '30px', fontWeight: 300, color: '#2A2318', margin: 0 }}>{(fastestMs / 1000).toFixed(1)}s</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Fastest</p>
            </div>
          </div>

          {/* Missed notes */}
          {missedEntries.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: WRONG_BG, border: `1px solid ${WRONG_BORDER}`, borderRadius: '10px', textAlign: 'left' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: WRONG_FG, letterSpacing: '0.06em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>Missed notes</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: WRONG_FG, margin: 0 }}>
                {missedEntries.map(([n, c]) => c > 1 ? `${n} ×${c}` : n).join(', ')}
              </p>
            </div>
          )}

          {/* Review tally — only appears if review questions were in the session. */}
          {reviewHitsRef.current.answered > 0 && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#F7F3E8', border: '1px solid #E4DDC7', borderRadius: '10px', textAlign: 'left' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.06em', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>
                Review from earlier modules
              </p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#2A2318', margin: 0 }}>
                {reviewHitsRef.current.correct} of {reviewHitsRef.current.answered} correct ·
                <span style={{ color: '#7A7060' }}> doesn&apos;t affect this module&apos;s accuracy</span>
              </p>
            </div>
          )}

          {/* Progress */}
          {!retryMode && (
            <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#EDE8DF', borderRadius: '10px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: '0 0 4px' }}>
                {passedThisSession ? '✓ Session passed' : '✗ Accuracy below target'} · {Math.round(threshold * 100)}% needed
              </p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#2A2318', margin: 0, fontWeight: 400 }}>
                {passingSessions} of {needed} consecutive passing sessions
              </p>
            </div>
          )}

          {/* Module complete banner */}
          {!retryMode && savedMp.completed && (
            <div style={{ marginBottom: '20px', padding: '14px 16px', background: CORRECT_BG, border: `1px solid ${CORRECT_BORDER}`, borderRadius: '10px', textAlign: 'left' }}>
              <p style={{ fontFamily: SERIF, fontSize: '18px', color: CORRECT_FG, margin: '0 0 2px' }}>
                ✓ {mod.title} — complete
              </p>
              {nextModule && (
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: CORRECT_FG, margin: 0 }}>
                  Next: {nextModule.title}
                </p>
              )}
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!retryMode && savedMp.completed && nextModule ? (
              <button
                onClick={() => router.push(`/programs/note-reading/${nextModule.id}`)}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
              >
                Next Module →
              </button>
            ) : !retryMode && showContinueToPlay ? (
              <button
                onClick={() => router.push(`/programs/note-reading/${moduleId}/play`)}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
              >
                Continue to Play It →
              </button>
            ) : null}
            {missedPitches.length > 0 && (
              <button
                onClick={retryMissed}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
              >
                Retry the ones you missed ({missedPitches.length})
              </button>
            )}
            <button
              onClick={retry}
              style={{
                background: ((!retryMode && savedMp.completed && nextModule) || showContinueToPlay || missedPitches.length > 0) ? 'transparent' : '#1A1A18',
                color: ((!retryMode && savedMp.completed && nextModule) || showContinueToPlay || missedPitches.length > 0) ? '#7A7060' : 'white',
                border: ((!retryMode && savedMp.completed && nextModule) || showContinueToPlay || missedPitches.length > 0) ? '1px solid #DDD8CA' : 'none',
                borderRadius: '10px', padding: '13px',
                fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer',
              }}
            >
              {retryMode ? 'New full session' : 'Try again'}
            </button>
            <button
              onClick={() => savedMp.completed && !retryMode
                ? router.push('/programs/note-reading')
                : router.push(`/programs/note-reading/${moduleId}`)
              }
              style={{ background: 'transparent', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
            >
              {savedMp.completed && !retryMode ? '← Back to program' : '← Back to module'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Session screen ──────────────────────────────────────────────────────────
  const reference = answerState === 'wrong' ? staffReference(currentPitch) : null

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', background: '#F2EDDF', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', flexShrink: 0 }}>
        <button onClick={() => router.push(`/programs/note-reading/${moduleId}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: currentReview ? '#B5402A' : '#7A7060', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            {currentReview
              ? `Review · from ${NOTE_READING_MODULES.find(m => m.id === currentReview.sourceModuleId)?.title ?? 'earlier module'}`
              : `${mod.title} · ${retryMode ? 'Retry' : 'Identify'}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            {qIdx + 1} / {sessionLength}
          </span>
          <button
            onClick={handleEndSession}
            style={{ background: 'none', border: '1px solid #DDD8CA', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}
          >
            End
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: '#EDE8DF', flexShrink: 0 }}>
        <div style={{ height: '100%', background: '#1A1A18', width: `${progressPct}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px,2vh,20px) 16px', overflow: 'hidden' }}>
        <div style={{
          background: 'white', border: '1px solid #DDD8CA', borderRadius: '20px',
          padding: 'clamp(12px,2vh,28px) clamp(12px,3vw,28px)',
          maxWidth: '600px', width: '100%', textAlign: 'center',
          boxShadow: '0 2px 20px rgba(26,26,24,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: 'clamp(8px,1.5vh,16px)' }}>
            What note is this?
          </p>

          <div style={{ marginBottom: 'clamp(8px,1.5vh,16px)' }}>
            {mod.clef === 'grand'
              ? <GrandStaffCard note={currentPitch} />
              : <StaffCard note={currentPitch} clef={mod.clef} />
            }
          </div>

          <div style={{ minHeight: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {answerState === 'correct' && (
              <span style={{ fontFamily: SERIF, fontSize: '28px', color: CORRECT_FG }}>✓ {currentPitchClass}</span>
            )}
            {answerState === 'wrong' && (
              <>
                <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: WRONG_FG }}>
                  ✗ That&apos;s <strong style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 400 }}>{currentPitchClass}</strong>
                </span>
                {reference && (
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', marginTop: '4px', letterSpacing: '0.04em' }}>
                    {reference}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Answer buttons */}
        <div style={{ marginTop: 'clamp(10px,2vh,20px)', maxWidth: '600px', width: '100%' }}>
          {useAccidentalLayout ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {NATURAL_LETTERS.map(letter => (
                  <button key={letter} onClick={() => handleAnswer(letter)}
                    disabled={answerState !== 'idle'}
                    style={{
                      ...buttonStyle(letter, false),
                      flex: 1, padding: '12px 0',
                      fontSize: '18px',
                    }}>
                    {letter}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {ACCIDENTAL_NOTES.map(acc => (
                  <button key={acc} onClick={() => handleAnswer(acc)}
                    disabled={answerState !== 'idle'}
                    style={{
                      ...buttonStyle(acc, true),
                      padding: '10px 14px',
                      background: (buttonStyle(acc, true).background as string) === 'white' ? '#FDFAF3' : (buttonStyle(acc, true).background as string),
                      fontSize: 'var(--nl-text-meta)',
                    }}>
                    {acc}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {NATURAL_LETTERS.map(letter => (
                <button key={letter} onClick={() => handleAnswer(letter)}
                  disabled={answerState !== 'idle'}
                  style={{
                    ...buttonStyle(letter, false),
                    flex: 1, padding: 'clamp(10px,2vh,18px) 0',
                    fontSize: 'clamp(16px,3vw,24px)',
                  }}
                  onMouseEnter={e => { if (answerState === 'idle') e.currentTarget.style.background = '#F2EDDF' }}
                  onMouseLeave={e => { if (answerState === 'idle') e.currentTarget.style.background = 'white' }}>
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* End-session confirmation modal */}
      {showEndConfirm && (
        <div
          onClick={() => setShowEndConfirm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#FDFAF3', border: '1px solid #DDD8CA', borderRadius: '16px', padding: '28px 28px 24px', maxWidth: '380px', width: '100%' }}
          >
            <h3 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '22px', color: '#2A2318', margin: '0 0 8px' }}>End this session?</h3>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 20px', lineHeight: 1.55 }}>
              Progress for this session won&apos;t be saved.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{ background: 'transparent', color: '#2A2318', border: '1px solid #DDD8CA', borderRadius: '10px', padding: '10px 16px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
              >
                Keep going
              </button>
              <button
                onClick={confirmEnd}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 16px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
              >
                End session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
