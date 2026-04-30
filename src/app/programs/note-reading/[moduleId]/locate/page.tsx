'use client'

import { useState, useEffect, useCallback, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { getNRModule, buildWeightedPool, NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  recordNRLocateSession,
  isNRModuleUnlocked,
  isNRLocateUnlocked,
  loadNRProgress,
  nrConsecutivePassing,
  getNoteStats,
  buildReviewPool,
  injectReviewQuestions,
  recordRetention,
  type QueueEntry,
} from '@/lib/programs/note-reading/progress'
import type { NoteResult } from '@/lib/programs/note-reading/types'
import InteractiveGrandStaff from '@/components/cards/InteractiveGrandStaff'
import IntervallicLocateSession from './IntervallicLocateSession'
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

function pitchClass(pitch: string): string {
  return pitch.replace(/\d+$/, '')
}

type AnswerState = 'idle' | 'correct' | 'wrong'

interface Props { params: Promise<{ moduleId: string }> }

export default function LocateSessionPage({ params }: Props) {
  const { moduleId } = use(params)
  const mod = getNRModule(moduleId)
  if (mod?.variant === 'intervallic') {
    return <IntervallicLocateSession moduleId={moduleId} />
  }
  return <StandardLocateSession moduleId={moduleId} />
}

function StandardLocateSession({ moduleId }: { moduleId: string }) {
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
  const [clickedPitch, setClickedPitch] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<{ mp: ReturnType<typeof recordNRLocateSession>['mp']; locateJustMastered: boolean } | null>(null)
  const [retryMode, setRetryMode] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const processingRef = useRef(false)
  const noteResultsRef = useRef<Record<string, NoteResult>>({})
  const displayMissRef = useRef<Record<string, number>>({})
  const missedPitchesRef = useRef<Set<string>>(new Set())
  const questionStartRef = useRef<number>(0)
  const timingsRef = useRef<number[]>([])
  const reviewHitsRef = useRef<{ answered: number; correct: number }>({ answered: 0, correct: 0 })
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
    if (!isNRLocateUnlocked(moduleId, store)) {
      router.replace(`/programs/note-reading/${moduleId}`)
      return
    }
    const stats = getNoteStats(moduleId, 'locate', store)
    const q = buildWeightedPool(mod.notes, stats, SESSION_LENGTH)
    for (let i = 1; i < q.length; i++) {
      if (pitchClass(q[i]) === pitchClass(q[i - 1])) {
        const j = Math.min(i + 1 + Math.floor(Math.random() * 3), q.length - 1)
        if (j > i) [q[i], q[j]] = [q[j], q[i]]
      }
    }
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

  useEffect(() => {
    if (answerState === 'idle') questionStartRef.current = performance.now()
  }, [qIdx, answerState])

  const currentEntry = queue[qIdx]
  const currentPitch = currentEntry?.pitch ?? ''
  const currentReview = currentEntry?.review ?? null

  const handleTap = useCallback((picked: string) => {
    if (processingRef.current || done || !currentPitch) return
    processingRef.current = true

    const isCorrect = picked === currentPitch
    const elapsed = performance.now() - questionStartRef.current
    timingsRef.current.push(elapsed)

    void playPitch(currentPitch)

    if (currentReview) {
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
        displayMissRef.current[pitchClass(currentPitch)] = (displayMissRef.current[pitchClass(currentPitch)] ?? 0) + 1
        missedPitchesRef.current.add(currentPitch)
      }
    }

    setClickedPitch(picked)
    setAnswerState(isCorrect ? 'correct' : 'wrong')

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
        setClickedPitch(null)
      }
      processingRef.current = false
    }, isCorrect ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS)
  }, [currentPitch, currentReview, qIdx, done, retryMode, sessionLength])

  useEffect(() => {
    if (!done || !mod) return
    if (retryMode) {
      setResult({ mp: { moduleId, identify: { completed: false }, locate: { completed: false }, play: { completed: false } } as unknown as ReturnType<typeof recordNRLocateSession>['mp'], locateJustMastered: false })
      return
    }
    const denom = moduleAnsweredRef.current > 0 ? moduleAnsweredRef.current : 1
    const accuracy = correctCount / denom
    const res = recordNRLocateSession(moduleId, accuracy, noteResultsRef.current)
    setResult(res)
  }, [done])

  if (!mod) return null
  if (!queue.length) return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: F, color: '#7A7060' }}>Loading…</p>
    </div>
  )

  const progressPct = (qIdx / sessionLength) * 100
  const moduleDenom = moduleAnsweredRef.current > 0 ? moduleAnsweredRef.current : 1
  const accuracy = correctCount / moduleDenom

  function handleEndSession() { setShowEndConfirm(true) }
  function confirmEnd() { router.push(`/programs/note-reading/${moduleId}`) }

  // ── Summary screen ──────────────────────────────────────────────────────────
  if (done && result) {
    const { mp: savedMp, locateJustMastered } = result
    const pct = Math.round(accuracy * 100)
    const missedEntries = Object.entries(displayMissRef.current).sort((a, b) => b[1] - a[1])
    const missedPitches = Array.from(missedPitchesRef.current)
    const passingSessions = retryMode ? 0 : nrConsecutivePassing(moduleId, 'locate', loadNRProgress())
    const needed = mod.criteria.sessions
    const threshold = mod.criteria.locateAccuracy ?? 0.9
    const passedThisSession = !retryMode && accuracy >= threshold
    const nextModule = NOTE_READING_MODULES.find(m => m.unlockAfter.includes(moduleId))
    const avgMs = timingsRef.current.length
      ? Math.round(timingsRef.current.reduce((s, v) => s + v, 0) / timingsRef.current.length)
      : 0
    const fastestMs = timingsRef.current.length ? Math.round(Math.min(...timingsRef.current)) : 0

    function resetForNewSession(newQueue: QueueEntry[], newRetryMode: boolean) {
      setDone(false)
      setResult(null)
      setQIdx(0)
      setCorrectCount(0)
      setAnswerState('idle')
      setClickedPitch(null)
      setRetryMode(newRetryMode)
      processingRef.current = false
      noteResultsRef.current = {}
      displayMissRef.current = {}
      missedPitchesRef.current = new Set()
      timingsRef.current = []
      reviewHitsRef.current = { answered: 0, correct: 0 }
      moduleAnsweredRef.current = 0
      setQueue(newQueue)
      questionStartRef.current = performance.now()
    }

    function retry() {
      const store = loadNRProgress()
      const stats = getNoteStats(moduleId, 'locate', store)
      const q = buildWeightedPool(mod!.notes, stats, SESSION_LENGTH)
      for (let i = 1; i < q.length; i++) {
        if (pitchClass(q[i]) === pitchClass(q[i - 1])) {
          const j = Math.min(i + 1 + Math.floor(Math.random() * 3), q.length - 1)
          if (j > i) [q[i], q[j]] = [q[j], q[i]]
        }
      }
      const reviewPool = buildReviewPool(moduleId, 3)
      resetForNewSession(injectReviewQuestions(q, reviewPool), false)
    }

    function retryMissed() {
      if (missedPitches.length === 0) return
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
      // Retry mini-sessions skip review injection — targeted on missed notes.
      resetForNewSession(q.map(p => ({ pitch: p, review: null })), true)
    }

    const moduleFinished = !retryMode && savedMp.completed
    // Reference locateJustMastered to include "just mastered" UI branching
    // later without changing the function signature if we want it. Treated
    // as a nudge flag for future analytics.
    void locateJustMastered

    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '48px 40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            {retryMode ? 'Retry Complete' : 'Session Complete'}
          </p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '28px' }}>
            Note Location
          </h2>

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

          {missedEntries.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: WRONG_BG, border: `1px solid ${WRONG_BORDER}`, borderRadius: '10px', textAlign: 'left' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: WRONG_FG, letterSpacing: '0.06em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>Missed notes</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: WRONG_FG, margin: 0 }}>
                {missedEntries.map(([n, c]) => c > 1 ? `${n} ×${c}` : n).join(', ')}
              </p>
            </div>
          )}

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

          {moduleFinished && (
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                background: missedPitches.length > 0 ? 'transparent' : '#1A1A18',
                color: missedPitches.length > 0 ? '#7A7060' : 'white',
                border: missedPitches.length > 0 ? '1px solid #DDD8CA' : 'none',
                borderRadius: '10px', padding: '13px',
                fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer',
              }}
            >
              {retryMode ? 'New full session' : 'Try again'}
            </button>
            <button
              onClick={() => moduleFinished
                ? router.push('/programs/note-reading')
                : router.push(`/programs/note-reading/${moduleId}`)
              }
              style={{ background: 'transparent', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
            >
              {moduleFinished ? '← Back to program' : '← Back to module'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Session screen ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: '#F2EDDF', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', flexShrink: 0 }}>
        <button onClick={() => router.push(`/programs/note-reading/${moduleId}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: currentReview ? '#B5402A' : '#7A7060', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            {currentReview
              ? `Review · from ${NOTE_READING_MODULES.find(m => m.id === currentReview.sourceModuleId)?.title ?? 'earlier module'}`
              : `${mod.title} · ${retryMode ? 'Retry' : 'Locate'}`}
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

      <div style={{ height: '2px', background: '#EDE8DF', flexShrink: 0 }}>
        <div style={{ height: '100%', background: '#1A1A18', width: `${progressPct}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px,2vh,24px) 16px' }}>
        <div style={{
          background: 'white', border: '1px solid #DDD8CA', borderRadius: '20px',
          padding: 'clamp(16px,2.5vh,28px) clamp(16px,3vw,36px)',
          maxWidth: '560px', width: '100%', textAlign: 'center',
          boxShadow: '0 2px 20px rgba(26,26,24,0.06)',
        }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '10px' }}>
            Where is this note?
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(44px, 8vw, 64px)', fontWeight: 300, color: '#2A2318', margin: '0 0 8px', letterSpacing: '0.02em', lineHeight: 1 }}>
            {pitchClass(currentPitch)}
            <span style={{ fontSize: '0.5em', color: '#7A7060', marginLeft: '6px' }}>{currentPitch.match(/\d+$/)?.[0]}</span>
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <InteractiveGrandStaff
              pool={mod.notes}
              onTap={handleTap}
              markerPitch={clickedPitch}
              correctPitch={answerState === 'wrong' ? currentPitch : null}
              feedback={answerState === 'idle' ? null : answerState}
            />
          </div>

          <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
            {answerState === 'correct' && (
              <span style={{ fontFamily: SERIF, fontSize: '22px', color: CORRECT_FG }}>✓ Right on it</span>
            )}
            {answerState === 'wrong' && clickedPitch && (
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: WRONG_FG }}>
                ✗ You tapped <strong style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}>{clickedPitch}</strong> — target was <strong style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: CORRECT_FG }}>{currentPitch}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

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
