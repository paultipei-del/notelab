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
} from '@/lib/programs/note-reading/progress'
import type { NoteResult } from '@/lib/programs/note-reading/types'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const SESSION_LENGTH = 20

const NATURAL_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const ACCIDENTAL_NOTES = ['C#','Db','D#','Eb','F#','Gb','G#','Ab','A#','Bb']

function pitchClass(pitch: string): string {
  return pitch.replace(/\d+$/, '')
}

function hasAccidentals(notes: string[]): boolean {
  return notes.some(n => /[#b]/.test(n))
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
  const [queue, setQueue] = useState<string[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<{ mp: ReturnType<typeof recordNRIdentifySession>['mp']; identifyJustMastered: boolean } | null>(null)
  const processingRef = useRef(false)
  // Per-note tracking: full pitch → {attempts, correct}
  const noteResultsRef = useRef<Record<string, NoteResult>>({})
  // Display misses: pitchClass → count (for summary "Missed: C, G" list)
  const displayMissRef = useRef<Record<string, number>>({})

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
    // Avoid consecutive same pitch class
    for (let i = 1; i < q.length; i++) {
      if (pitchClass(q[i]) === pitchClass(q[i - 1])) {
        const j = Math.min(i + 1 + Math.floor(Math.random() * 3), q.length - 1)
        if (j > i) [q[i], q[j]] = [q[j], q[i]]
      }
    }
    setQueue(q)
    noteResultsRef.current = {}
    displayMissRef.current = {}
  }, [moduleId])

  const currentPitch = queue[qIdx] ?? ''
  const currentPitchClass = pitchClass(currentPitch)
  const useAccidentalLayout = mod ? hasAccidentals(mod.notes) : false

  const handleAnswer = useCallback((answer: string) => {
    if (processingRef.current || done || !currentPitch) return
    processingRef.current = true

    const isCorrect = answer === currentPitchClass ||
      (useAccidentalLayout && (
        (currentPitchClass === 'F#' && answer === 'Gb') ||
        (currentPitchClass === 'Gb' && answer === 'F#') ||
        (currentPitchClass === 'C#' && answer === 'Db') ||
        (currentPitchClass === 'Db' && answer === 'C#') ||
        (currentPitchClass === 'D#' && answer === 'Eb') ||
        (currentPitchClass === 'Eb' && answer === 'D#') ||
        (currentPitchClass === 'G#' && answer === 'Ab') ||
        (currentPitchClass === 'Ab' && answer === 'G#') ||
        (currentPitchClass === 'A#' && answer === 'Bb') ||
        (currentPitchClass === 'Bb' && answer === 'A#')
      ))

    // Track per-note results (by full pitch)
    const nr = noteResultsRef.current
    if (!nr[currentPitch]) nr[currentPitch] = { attempts: 0, correct: 0 }
    nr[currentPitch].attempts++
    if (isCorrect) {
      nr[currentPitch].correct++
      setCorrectCount(c => c + 1)
    } else {
      displayMissRef.current[currentPitchClass] = (displayMissRef.current[currentPitchClass] ?? 0) + 1
    }

    setAnswerState(isCorrect ? 'correct' : 'wrong')

    setTimeout(() => {
      const next = qIdx + 1
      if (next >= SESSION_LENGTH) {
        setDone(true)
      } else {
        setQIdx(next)
        setAnswerState('idle')
      }
      processingRef.current = false
    }, isCorrect ? 280 : 700)
  }, [currentPitch, currentPitchClass, qIdx, done, useAccidentalLayout])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toUpperCase()
      if (NATURAL_LETTERS.includes(key)) handleAnswer(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleAnswer])

  // Save progress when done
  useEffect(() => {
    if (!done || !mod) return
    const accuracy = correctCount / SESSION_LENGTH
    const res = recordNRIdentifySession(moduleId, accuracy, noteResultsRef.current)
    setResult(res)
  }, [done])

  if (!mod) return null
  if (!queue.length) return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: F, color: '#7A7060' }}>Loading…</p>
    </div>
  )

  const bgColor = answerState === 'correct' ? '#EAF3DE' : answerState === 'wrong' ? '#FFF0F0' : 'white'
  const borderColor = answerState === 'correct' ? '#C0DD97' : answerState === 'wrong' ? '#F09595' : '#DDD8CA'
  const progressPct = (qIdx / SESSION_LENGTH) * 100
  const accuracy = correctCount / SESSION_LENGTH

  // ── Summary screen ──────────────────────────────────────────────────────────
  if (done && result) {
    const { mp: savedMp, identifyJustMastered } = result
    const pct = Math.round(accuracy * 100)
    const missedNotes = Object.entries(displayMissRef.current)
      .sort((a, b) => b[1] - a[1])
      .map(([note]) => note)
    const passingSessions = nrConsecutivePassing(moduleId, 'identify', loadNRProgress())
    const needed = mod.criteria.sessions
    const threshold = mod.criteria.identifyAccuracy ?? 0.9
    const passedThisSession = accuracy >= threshold
    const showContinueToPlay = identifyJustMastered && mod.tools.includes('play')
    const nextModule = NOTE_READING_MODULES.find(m => m.unlockAfter.includes(moduleId))

    function retry() {
      setDone(false)
      setResult(null)
      setQIdx(0)
      setCorrectCount(0)
      setAnswerState('idle')
      processingRef.current = false
      noteResultsRef.current = {}
      displayMissRef.current = {}
      const store = loadNRProgress()
      const stats = getNoteStats(moduleId, 'identify', store)
      const q = buildWeightedPool(mod!.notes, stats, SESSION_LENGTH)
      for (let i = 1; i < q.length; i++) {
        if (pitchClass(q[i]) === pitchClass(q[i - 1])) {
          const j = Math.min(i + 1 + Math.floor(Math.random() * 3), q.length - 1)
          if (j > i) [q[i], q[j]] = [q[j], q[i]]
        }
      }
      setQueue(q)
    }

    return (
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            Session Complete
          </p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '28px' }}>
            Note Identification
          </h2>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 300, color: pct >= Math.round(threshold * 100) ? '#3B6D11' : '#2A2318', margin: 0 }}>{pct}%</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Accuracy</p>
            </div>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 300, color: '#2A2318', margin: 0 }}>{correctCount}/{SESSION_LENGTH}</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Notes</p>
            </div>
          </div>

          {/* Missed notes */}
          {missedNotes.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#FCEBEB', border: '1px solid #F09595', borderRadius: '10px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#A32D2D', letterSpacing: '0.06em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>Missed</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#A32D2D', margin: 0 }}>{missedNotes.join(', ')}</p>
            </div>
          )}

          {/* Progress */}
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#EDE8DF', borderRadius: '10px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: '0 0 4px' }}>
              {passedThisSession ? '✓ Session passed' : '✗ Accuracy below target'} · {Math.round(threshold * 100)}% needed
            </p>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#2A2318', margin: 0, fontWeight: 400 }}>
              {passingSessions} of {needed} consecutive passing sessions
            </p>
          </div>

          {/* Module complete banner */}
          {savedMp.completed && (
            <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: '10px', textAlign: 'left' }}>
              <p style={{ fontFamily: SERIF, fontSize: '18px', color: '#3B6D11', margin: '0 0 2px' }}>
                ✓ {mod.title} — complete
              </p>
              {nextModule && (
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#3B6D11', margin: 0 }}>
                  Next: {nextModule.title}
                </p>
              )}
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedMp.completed && nextModule ? (
              <button
                onClick={() => router.push(`/programs/note-reading/${nextModule.id}`)}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
              >
                Next Module →
              </button>
            ) : showContinueToPlay ? (
              <button
                onClick={() => router.push(`/programs/note-reading/${moduleId}/play`)}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
              >
                Continue to Play It →
              </button>
            ) : null}
            <button
              onClick={retry}
              style={{
                background: (savedMp.completed && nextModule) || showContinueToPlay ? 'transparent' : '#1A1A18',
                color: (savedMp.completed && nextModule) || showContinueToPlay ? '#7A7060' : 'white',
                border: (savedMp.completed && nextModule) || showContinueToPlay ? '1px solid #DDD8CA' : 'none',
                borderRadius: '10px', padding: '13px',
                fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => savedMp.completed
                ? router.push('/programs/note-reading')
                : router.push(`/programs/note-reading/${moduleId}`)
              }
              style={{ background: 'transparent', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
            >
              {savedMp.completed ? '← Back to program' : '← Back to module'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Session screen ──────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100dvh', overflow: 'hidden', background: '#F2EDDF', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', flexShrink: 0 }}>
        <button onClick={() => router.push(`/programs/note-reading/${moduleId}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            {mod.title} · Identify
          </p>
        </div>
        <span style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>
          {qIdx + 1} / {SESSION_LENGTH}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '2px', background: '#EDE8DF', flexShrink: 0 }}>
        <div style={{ height: '100%', background: '#1A1A18', width: `${progressPct}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px,2vh,20px) 16px', overflow: 'hidden' }}>
        <div style={{
          background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '20px',
          padding: 'clamp(12px,2vh,28px) clamp(12px,3vw,28px)',
          maxWidth: '600px', width: '100%', textAlign: 'center',
          transition: 'background 0.15s, border-color 0.15s',
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

          <div style={{ height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {answerState === 'correct' && (
              <span style={{ fontFamily: SERIF, fontSize: '28px', color: '#3B6D11' }}>✓ {currentPitchClass}</span>
            )}
            {answerState === 'wrong' && (
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#A32D2D' }}>
                ✗ That's <strong style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}>{currentPitchClass}</strong>
              </span>
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
                      flex: 1, padding: '12px 0',
                      borderRadius: '10px', border: '1px solid #DDD8CA',
                      background: 'white', color: '#2A2318',
                      fontFamily: SERIF, fontSize: '18px', fontWeight: 400,
                      cursor: answerState !== 'idle' ? 'default' : 'pointer',
                      opacity: answerState !== 'idle' ? 0.6 : 1,
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
                      padding: '10px 14px',
                      borderRadius: '10px', border: '1px solid #DDD8CA',
                      background: '#FDFAF3', color: '#2A2318',
                      fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400,
                      cursor: answerState !== 'idle' ? 'default' : 'pointer',
                      opacity: answerState !== 'idle' ? 0.6 : 1,
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
                    flex: 1, padding: 'clamp(10px,2vh,18px) 0',
                    borderRadius: '12px', border: '1px solid #DDD8CA',
                    background: 'white', color: '#2A2318',
                    fontFamily: SERIF, fontSize: 'clamp(16px,3vw,24px)', fontWeight: 400,
                    cursor: answerState !== 'idle' ? 'default' : 'pointer',
                    transition: 'background 0.1s',
                    opacity: answerState !== 'idle' ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (answerState === 'idle') e.currentTarget.style.background = '#F2EDDF' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white' }}>
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
