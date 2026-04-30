'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getNRModule, NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  recordNRIdentifySession,
  isNRModuleUnlocked,
  loadNRProgress,
  nrConsecutivePassing,
} from '@/lib/programs/note-reading/progress'
import type { NoteResult } from '@/lib/programs/note-reading/types'
import {
  buildIntervallicQueue,
  INTERVAL_SIZES,
  INTERVAL_LABELS,
  pitchToLetterPos,
  type IntervallicQuestion,
  type IntervalSize,
} from '@/lib/programs/note-reading/intervallic'
import TwoNoteGrandStaff from '@/components/cards/TwoNoteGrandStaff'
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

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
type Letter = typeof LETTERS[number]

type AnswerState = 'idle' | 'correct' | 'wrong'

// Grand-staff renderable window, in letter-position units matching
// pitchToLetterPos. C3 = 21, E5 = 37 → stay one line-space either side.
const RENDER_MIN = pitchToLetterPos('C3') ?? 21
const RENDER_MAX = pitchToLetterPos('E5') ?? 37

export default function IntervallicIdentifySession({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { hasSubscription, loading: purchasesLoading } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()
  const isLoading = authLoading || purchasesLoading

  const mod = getNRModule(moduleId)
  const [queue, setQueue] = useState<IntervallicQuestion[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [pickedLetter, setPickedLetter] = useState<Letter | null>(null)
  const [pickedSize, setPickedSize] = useState<IntervalSize | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<{
    mp: ReturnType<typeof recordNRIdentifySession>['mp']
    identifyJustMastered: boolean
  } | null>(null)
  const [retryMode, setRetryMode] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const processingRef = useRef(false)
  // Per-pitch tracking uses the TARGET (second) pitch — that's the note
  // the student is identifying.
  const noteResultsRef = useRef<Record<string, NoteResult>>({})
  // Per-interval miss counts (for the summary "often missed" list).
  const intervalMissRef = useRef<Record<IntervalSize, number>>(
    INTERVAL_SIZES.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<IntervalSize, number>),
  )
  // Full questions we missed, for the retry mini-session.
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
    if (!isNRModuleUnlocked(moduleId, store)) {
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
  const currentTargetLetter = (currentTarget.match(/^([A-G])/)?.[1] ?? 'C') as Letter

  // Both halves of the answer must be picked before the question resolves.
  // We auto-submit once both are set.
  useEffect(() => {
    if (!currentQ) return
    if (processingRef.current || done) return
    if (pickedLetter === null || pickedSize === null) return
    processingRef.current = true

    const isCorrect = pickedLetter === currentTargetLetter && pickedSize === currentQ.intervalSize
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

    setAnswerState(isCorrect ? 'correct' : 'wrong')

    setTimeout(() => {
      const next = qIdx + 1
      if (next >= sessionLength) {
        setDone(true)
      } else {
        setQIdx(next)
        setAnswerState('idle')
        setPickedLetter(null)
        setPickedSize(null)
      }
      processingRef.current = false
    }, isCorrect ? CORRECT_ADVANCE_MS : WRONG_ADVANCE_MS)
  }, [pickedLetter, pickedSize, currentQ, currentTarget, currentTargetLetter, qIdx, sessionLength, done])

  // Save progress when done. Retry mini-sessions don't record.
  useEffect(() => {
    if (!done || !mod) return
    if (retryMode) {
      setResult({
        mp: { moduleId, identify: { completed: false }, locate: { completed: false }, play: { completed: false } } as unknown as ReturnType<typeof recordNRIdentifySession>['mp'],
        identifyJustMastered: false,
      })
      return
    }
    const accuracy = correctCount / sessionLength
    const res = recordNRIdentifySession(moduleId, accuracy, noteResultsRef.current)
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
    const { mp: savedMp, identifyJustMastered } = result
    void identifyJustMastered
    const accuracy = correctCount / sessionLength
    const pct = Math.round(accuracy * 100)
    const passingSessions = retryMode ? 0 : nrConsecutivePassing(moduleId, 'identify', loadNRProgress())
    const needed = mod.criteria.sessions
    const threshold = mod.criteria.identifyAccuracy ?? 0.9
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
      setPickedLetter(null)
      setPickedSize(null)
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
      // Shuffle
      for (let k = q.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1))
        ;[q[k], q[j]] = [q[j], q[k]]
      }
      resetForNewSession(q, true)
    }

    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#ECE3CC', borderRadius: '20px', border: '1px solid #D9CFAE', padding: '48px 40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            {retryMode ? 'Retry Complete' : 'Session Complete'}
          </p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '28px' }}>
            Intervallic Identify
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
                border: missedQuestionsRef.current.length > 0 ? '1px solid #D9CFAE' : 'none',
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
              style={{ background: 'transparent', color: '#7A7060', border: '1px solid #D9CFAE', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
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

  function letterButtonStyle(letter: Letter): React.CSSProperties {
    const base: React.CSSProperties = {
      flex: 1,
      padding: '12px 0',
      borderRadius: '10px',
      border: '1px solid #D9CFAE',
      background: 'white',
      color: '#2A2318',
      fontFamily: SERIF,
      fontSize: '20px',
      fontWeight: 400,
      cursor: answerState !== 'idle' ? 'default' : 'pointer',
      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
    }
    const isPicked = pickedLetter === letter
    const isTarget = letter === currentTargetLetter
    if (answerState === 'idle') {
      return isPicked
        ? { ...base, background: '#EDE8DF', borderColor: '#1A1A18' }
        : base
    }
    // Feedback state
    if (isPicked) {
      return answerState === 'correct'
        ? { ...base, background: CORRECT_BG, borderColor: CORRECT_BORDER, color: CORRECT_FG }
        : { ...base, background: WRONG_BG, borderColor: WRONG_BORDER, color: WRONG_FG }
    }
    if (answerState === 'wrong' && isTarget) {
      return { ...base, background: CORRECT_BG, borderColor: CORRECT_BORDER, color: CORRECT_FG }
    }
    return { ...base, opacity: 0.5 }
  }

  function intervalButtonStyle(size: IntervalSize): React.CSSProperties {
    const base: React.CSSProperties = {
      flex: 1,
      padding: '10px 0',
      borderRadius: '10px',
      border: '1px solid #D9CFAE',
      background: '#ECE3CC',
      color: '#2A2318',
      fontFamily: F,
      fontSize: '14px',
      fontWeight: 400,
      cursor: answerState !== 'idle' ? 'default' : 'pointer',
      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
    }
    const isPicked = pickedSize === size
    const isTarget = size === currentQ!.intervalSize
    if (answerState === 'idle') {
      return isPicked
        ? { ...base, background: '#EDE8DF', borderColor: '#1A1A18' }
        : base
    }
    if (isPicked) {
      return answerState === 'correct'
        ? { ...base, background: CORRECT_BG, borderColor: CORRECT_BORDER, color: CORRECT_FG }
        : { ...base, background: WRONG_BG, borderColor: WRONG_BORDER, color: WRONG_FG }
    }
    if (answerState === 'wrong' && isTarget) {
      return { ...base, background: CORRECT_BG, borderColor: CORRECT_BORDER, color: CORRECT_FG }
    }
    return { ...base, opacity: 0.5 }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#F2EDDF', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', flexShrink: 0 }}>
        <button onClick={() => router.push(`/programs/note-reading/${moduleId}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            {mod.title} · {retryMode ? 'Retry' : 'Identify'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
            {qIdx + 1} / {sessionLength}
          </span>
          <button
            onClick={handleEndSession}
            style={{ background: 'none', border: '1px solid #D9CFAE', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}
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
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(10px,2vh,24px) 16px' }}>
        <div style={{
          background: 'white', border: '1px solid #D9CFAE', borderRadius: '20px',
          padding: 'clamp(14px,2.5vh,28px) clamp(14px,3vw,32px)',
          maxWidth: '640px', width: '100%', textAlign: 'center',
          boxShadow: '0 2px 20px rgba(26,26,24,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: 'clamp(6px,1.5vh,12px)' }}>
            Name the second note and the interval
          </p>

          <TwoNoteGrandStaff
            first={currentQ.firstPitch}
            second={currentQ.secondPitch}
            highlightSecond={answerState !== 'correct'}
            showFirstLabel
            showSecondLabel={answerState !== 'idle'}
            secondLabelColor={answerState === 'correct' ? CORRECT_FG : WRONG_FG}
          />

          <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
            {answerState === 'correct' && (
              <span style={{ fontFamily: SERIF, fontSize: '22px', color: CORRECT_FG }}>
                ✓ {currentTargetLetter} · {INTERVAL_LABELS[currentQ.intervalSize]} {currentQ.direction}
              </span>
            )}
            {answerState === 'wrong' && (
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: WRONG_FG }}>
                ✗ Target was <strong style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}>{currentTargetLetter}</strong> — a <strong style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}>{INTERVAL_LABELS[currentQ.intervalSize]} {currentQ.direction}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Answer pickers */}
        <div style={{ marginTop: 'clamp(12px,2vh,20px)', maxWidth: '640px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 6px', textAlign: 'center' }}>
              Letter
            </p>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
              {LETTERS.map(letter => (
                <button
                  key={letter}
                  disabled={answerState !== 'idle'}
                  onClick={() => setPickedLetter(letter)}
                  style={letterButtonStyle(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 6px', textAlign: 'center' }}>
              Interval (a {INTERVAL_LABELS[currentQ.intervalSize].replace(/^\d+/, '?')} {currentQ.direction})
            </p>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
              {INTERVAL_SIZES.map(size => (
                <button
                  key={size}
                  disabled={answerState !== 'idle'}
                  onClick={() => setPickedSize(size)}
                  style={intervalButtonStyle(size)}
                >
                  {INTERVAL_LABELS[size]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* End-session modal */}
      {showEndConfirm && (
        <div
          onClick={() => setShowEndConfirm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#ECE3CC', border: '1px solid #D9CFAE', borderRadius: '16px', padding: '28px 28px 24px', maxWidth: '380px', width: '100%' }}
          >
            <h3 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '22px', color: '#2A2318', margin: '0 0 8px' }}>End this session?</h3>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: '0 0 20px', lineHeight: 1.55 }}>
              Progress for this session won&apos;t be saved.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{ background: 'transparent', color: '#2A2318', border: '1px solid #D9CFAE', borderRadius: '10px', padding: '10px 16px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
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
