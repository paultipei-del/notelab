'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getNRModule, NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  recordNRLocateSession,
  isNRModuleUnlocked,
  isNRLocateUnlocked,
  loadNRProgress,
  nrConsecutivePassing,
} from '@/lib/programs/note-reading/progress'
import type { NoteResult } from '@/lib/programs/note-reading/types'
import {
  buildIntervallicQueue,
  INTERVAL_LABELS,
  pitchToLetterPos,
  type IntervallicQuestion,
  type IntervalSize,
} from '@/lib/programs/note-reading/intervallic'
import InteractiveGrandStaff from '@/components/cards/InteractiveGrandStaff'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'
import { playPitch } from '@/lib/pianoPlayback'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const SESSION_LENGTH = 20
const RETRY_LENGTH = 5
const CORRECT_ADVANCE_MS = 700
const WRONG_ADVANCE_MS = 1800

const CORRECT_FG = '#3B6D11'
const CORRECT_BG = '#EAF3DE'
const CORRECT_BORDER = '#C0DD97'
const WRONG_FG = '#A32D2D'
const WRONG_BG = '#FCEBEB'
const WRONG_BORDER = '#F09595'

const INTERVAL_SIZES: IntervalSize[] = [2, 3, 4, 5, 6, 7, 8]

type AnswerState = 'idle' | 'correct' | 'wrong'

const RENDER_MIN = pitchToLetterPos('C3') ?? 21
const RENDER_MAX = pitchToLetterPos('E5') ?? 37

export default function IntervallicLocateSession({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { hasSubscription, loading: purchasesLoading } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()
  const isLoading = authLoading || purchasesLoading

  const mod = getNRModule(moduleId)
  const [queue, setQueue] = useState<IntervallicQuestion[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [pickedPitch, setPickedPitch] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<{
    mp: ReturnType<typeof recordNRLocateSession>['mp']
    locateJustMastered: boolean
  } | null>(null)
  const [retryMode, setRetryMode] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const processingRef = useRef(false)
  const noteResultsRef = useRef<Record<string, NoteResult>>({})
  const intervalMissRef = useRef<Record<IntervalSize, number>>(
    INTERVAL_SIZES.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<IntervalSize, number>),
  )
  const missedQuestionsRef = useRef<IntervallicQuestion[]>([])
  const questionStartRef = useRef<number>(0)
  const timingsRef = useRef<number[]>([])

  const sessionLength = retryMode ? Math.min(RETRY_LENGTH, queue.length) : queue.length

  useEffect(() => {
    if (!isLoading && !isPro) router.replace('/account')
  }, [isLoading, isPro])

  useEffect(() => {
    if (!mod) return
    const store = loadNRProgress()
    if (!isNRModuleUnlocked(moduleId, store) || !isNRLocateUnlocked(moduleId, store)) {
      router.replace(`/programs/note-reading/${moduleId}`)
      return
    }
    const q = buildIntervallicQueue(mod.notes, SESSION_LENGTH, { min: RENDER_MIN, max: RENDER_MAX })
    setQueue(q)
    noteResultsRef.current = {}
    intervalMissRef.current = INTERVAL_SIZES.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<IntervalSize, number>)
    missedQuestionsRef.current = []
    timingsRef.current = []
    questionStartRef.current = performance.now()
  }, [moduleId])

  useEffect(() => {
    if (answerState === 'idle') questionStartRef.current = performance.now()
  }, [qIdx, answerState])

  const currentQ = queue[qIdx]
  const currentTarget = currentQ?.secondPitch ?? ''

  function handleTap(picked: string) {
    if (processingRef.current || done || !currentQ) return
    processingRef.current = true

    const isCorrect = picked === currentTarget
    const elapsed = performance.now() - questionStartRef.current
    timingsRef.current.push(elapsed)
    void playPitch(currentTarget)

    const nr = noteResultsRef.current
    if (!nr[currentTarget]) nr[currentTarget] = { attempts: 0, correct: 0 }
    nr[currentTarget].attempts++
    if (isCorrect) {
      nr[currentTarget].correct++
      setCorrectCount(c => c + 1)
    } else {
      intervalMissRef.current[currentQ.intervalSize]++
      missedQuestionsRef.current.push(currentQ)
    }

    setPickedPitch(picked)
    setAnswerState(isCorrect ? 'correct' : 'wrong')

    setTimeout(() => {
      const next = qIdx + 1
      if (next >= sessionLength) {
        setDone(true)
      } else {
        setQIdx(next)
        setAnswerState('idle')
        setPickedPitch(null)
      }
      processingRef.current = false
    }, isCorrect ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS)
  }

  useEffect(() => {
    if (!done || !mod) return
    if (retryMode) {
      setResult({
        mp: { moduleId, identify: { completed: false }, locate: { completed: false }, play: { completed: false } } as unknown as ReturnType<typeof recordNRLocateSession>['mp'],
        locateJustMastered: false,
      })
      return
    }
    const accuracy = correctCount / sessionLength
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

  function handleEndSession() { setShowEndConfirm(true) }
  function confirmEnd() { router.push(`/programs/note-reading/${moduleId}`) }

  // ── Summary ─────────────────────────────────────────────────────────────────
  if (done && result) {
    const { mp: savedMp, locateJustMastered } = result
    void locateJustMastered
    const accuracy = correctCount / sessionLength
    const pct = Math.round(accuracy * 100)
    const passingSessions = retryMode ? 0 : nrConsecutivePassing(moduleId, 'locate', loadNRProgress())
    const needed = mod.criteria.sessions
    const threshold = mod.criteria.locateAccuracy ?? 0.9
    const passedThisSession = !retryMode && accuracy >= threshold
    const nextModule = NOTE_READING_MODULES.find(m => m.unlockAfter.includes(moduleId))
    const avgMs = timingsRef.current.length
      ? Math.round(timingsRef.current.reduce((s, v) => s + v, 0) / timingsRef.current.length)
      : 0
    const fastestMs = timingsRef.current.length ? Math.round(Math.min(...timingsRef.current)) : 0
    const missedIntervalEntries = INTERVAL_SIZES
      .filter(s => intervalMissRef.current[s] > 0)
      .map(s => ({ size: s, count: intervalMissRef.current[s] }))
      .sort((a, b) => b.count - a.count)
    const moduleFinished = !retryMode && savedMp.completed

    function resetForNewSession(newQueue: IntervallicQuestion[], newRetryMode: boolean) {
      setDone(false)
      setResult(null)
      setQIdx(0)
      setCorrectCount(0)
      setAnswerState('idle')
      setPickedPitch(null)
      setRetryMode(newRetryMode)
      processingRef.current = false
      noteResultsRef.current = {}
      intervalMissRef.current = INTERVAL_SIZES.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<IntervalSize, number>)
      missedQuestionsRef.current = []
      timingsRef.current = []
      setQueue(newQueue)
      questionStartRef.current = performance.now()
    }

    function retry() {
      const q = buildIntervallicQueue(mod!.notes, SESSION_LENGTH, { min: RENDER_MIN, max: RENDER_MAX })
      resetForNewSession(q, false)
    }

    function retryMissed() {
      const misses = missedQuestionsRef.current.slice()
      if (misses.length === 0) return
      const q: IntervallicQuestion[] = []
      let i = 0
      while (q.length < RETRY_LENGTH) {
        q.push(misses[i % misses.length])
        i++
      }
      for (let k = q.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1))
        ;[q[k], q[j]] = [q[j], q[k]]
      }
      resetForNewSession(q, true)
    }

    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '48px 40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            {retryMode ? 'Retry Complete' : 'Session Complete'}
          </p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '28px' }}>
            Intervallic Locate
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

          {missedIntervalEntries.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: WRONG_BG, border: `1px solid ${WRONG_BORDER}`, borderRadius: '10px', textAlign: 'left' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: WRONG_FG, letterSpacing: '0.06em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>Intervals you missed</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: WRONG_FG, margin: 0 }}>
                {missedIntervalEntries.map(e => e.count > 1 ? `${INTERVAL_LABELS[e.size]} ×${e.count}` : INTERVAL_LABELS[e.size]).join(', ')}
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
            {missedQuestionsRef.current.length > 0 && (
              <button
                onClick={retryMissed}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
              >
                Retry the ones you missed ({missedQuestionsRef.current.length})
              </button>
            )}
            <button
              onClick={retry}
              style={{
                background: missedQuestionsRef.current.length > 0 ? 'transparent' : '#1A1A18',
                color: missedQuestionsRef.current.length > 0 ? '#7A7060' : 'white',
                border: missedQuestionsRef.current.length > 0 ? '1px solid #DDD8CA' : 'none',
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
  if (!currentQ) return null
  const directionWord = currentQ.direction === 'up' ? 'up' : 'down'

  return (
    <div style={{ minHeight: '100dvh', background: '#F2EDDF', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', flexShrink: 0 }}>
        <button onClick={() => router.push(`/programs/note-reading/${moduleId}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            {mod.title} · {retryMode ? 'Retry' : 'Locate'}
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
            Tap where the second note lands
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(28px,5vw,38px)', fontWeight: 300, color: '#2A2318', margin: '0 0 10px', lineHeight: 1.15 }}>
            <span style={{ color: '#7A7060' }}>From</span> {currentQ.firstPitch} ·
            <span style={{ color: '#B5402A' }}> {directionWord} a {INTERVAL_LABELS[currentQ.intervalSize]}</span>
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <InteractiveGrandStaff
              pool={mod.notes}
              onTap={handleTap}
              anchorPitch={currentQ.firstPitch}
              anchorLabel={currentQ.firstPitch}
              markerPitch={pickedPitch}
              correctPitch={answerState === 'wrong' ? currentTarget : null}
              feedback={answerState === 'idle' ? null : answerState}
            />
          </div>

          <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
            {answerState === 'correct' && (
              <span style={{ fontFamily: SERIF, fontSize: '22px', color: CORRECT_FG }}>
                ✓ {currentTarget}
              </span>
            )}
            {answerState === 'wrong' && pickedPitch && (
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: WRONG_FG }}>
                ✗ You tapped <strong style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}>{pickedPitch}</strong> — target was <strong style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400, color: CORRECT_FG }}>{currentTarget}</strong>
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
