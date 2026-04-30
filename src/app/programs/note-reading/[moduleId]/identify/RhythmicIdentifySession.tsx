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
  buildRhythmicQueue,
  beatMs,
  type RhythmicMeasure,
} from '@/lib/programs/note-reading/rhythmic'
import RhythmicMeasureStaff from '@/components/cards/RhythmicMeasureStaff'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const SESSION_LENGTH = 10    // 10 measures × 4 notes = 40 pitch identifications
const NOTES_PER_MEASURE = 4
const LEAD_IN_BEATS = 2      // count-in beats before the measure's notes begin
const GAP_AFTER_MEASURE_MS = 700
const DEFAULT_TEMPO = 60
// Timing window: a press must land within this many ms of the beat tick
// to count as "on time". Outside this window, the letter is treated as
// a late press and marked wrong even if the letter is right.
const BEAT_TIMING_TOLERANCE_MS = 300

const CORRECT_FG = '#3B6D11'
const CORRECT_BG = '#EAF3DE'
const CORRECT_BORDER = '#C0DD97'
const WRONG_FG = '#A32D2D'
const WRONG_BG = '#FCEBEB'
const WRONG_BORDER = '#F09595'

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
type Letter = typeof LETTERS[number]

type BeatState = 'pending' | 'correct' | 'wrong'

function pitchLetter(pitch: string): Letter {
  return (pitch.match(/^([A-G])/)?.[1] ?? 'C') as Letter
}

// Click synth — short sine burst. Accent pitch used on beat 1 to give a
// hint of downbeat without a full drum sound.
function playClick(ctx: AudioContext, accent: boolean) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = accent ? 1800 : 1200
  osc.connect(gain)
  gain.connect(ctx.destination)
  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(accent ? 0.18 : 0.12, now + 0.002)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)
  osc.start(now)
  osc.stop(now + 0.06)
}

export default function RhythmicIdentifySession({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { hasSubscription, loading: purchasesLoading } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()
  const isLoading = authLoading || purchasesLoading

  const mod = getNRModule(moduleId)
  const [queue, setQueue] = useState<RhythmicMeasure[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [running, setRunning] = useState(false)   // measure is actively playing
  const [activeBeat, setActiveBeat] = useState<number | null>(null)
  const [beatStates, setBeatStates] = useState<BeatState[]>(['pending', 'pending', 'pending', 'pending'])
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<{
    mp: ReturnType<typeof recordNRIdentifySession>['mp']
    identifyJustMastered: boolean
  } | null>(null)
  const [retryMode, setRetryMode] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [awaitingStart, setAwaitingStart] = useState(true)  // true before first "Start" click
  const [measureFlash, setMeasureFlash] = useState<'correct' | 'partial' | 'wrong' | null>(null)

  // Timers + live state kept in refs so the RAF loop sees fresh data.
  const ctxRef = useRef<AudioContext | null>(null)
  const timeoutsRef = useRef<number[]>([])
  const pressedThisBeatRef = useRef<Letter | null>(null)
  // Timestamp of the press (for the 300ms-around-the-tick tolerance check).
  // Stored alongside `pressedThisBeatRef` so finaliseBeat can compute offset.
  const pressTimeMsRef = useRef<number | null>(null)
  // Start time of the currently-active beat (performance.now()).
  const beatStartRef = useRef<number>(0)
  const beatStatesRef = useRef<BeatState[]>(['pending', 'pending', 'pending', 'pending'])
  const qIdxRef = useRef(0)
  const runningRef = useRef(false)
  const retryModeRef = useRef(false)
  const noteResultsRef = useRef<Record<string, NoteResult>>({})
  const missedLettersRef = useRef<Record<string, number>>({})
  const missedMeasuresRef = useRef<RhythmicMeasure[]>([])
  const measureHadMissRef = useRef(false)
  const timingsRef = useRef<number[]>([])

  const sessionLength = retryMode ? Math.min(5, queue.length) : queue.length

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
    const q = buildRhythmicQueue(mod.notes, SESSION_LENGTH, DEFAULT_TEMPO)
    setQueue(q)
    noteResultsRef.current = {}
    missedLettersRef.current = {}
    missedMeasuresRef.current = []
    timingsRef.current = []
  }, [moduleId])

  // Keyboard input — capture letters A-G while a beat is active.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toUpperCase() as Letter
      if (!LETTERS.includes(key)) return
      handleLetter(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function clearScheduled() {
    for (const h of timeoutsRef.current) window.clearTimeout(h)
    timeoutsRef.current = []
  }

  function handleLetter(letter: Letter) {
    if (!runningRef.current) return
    if (pressedThisBeatRef.current !== null) return    // only first press counts
    pressedThisBeatRef.current = letter
    pressTimeMsRef.current = performance.now()
  }

  // Finalise the beat at index `beatIdx` of the given measure. Runs at
  // the moment the NEXT beat tick would sound (or the end of the measure
  // for the last note). A beat counts as correct only if the student
  // pressed the right letter AND the press landed within
  // BEAT_TIMING_TOLERANCE_MS of the beat tick.
  function finalizeBeat(measure: RhythmicMeasure, beatIdx: number) {
    const expected = pitchLetter(measure.notes[beatIdx])
    const pressed = pressedThisBeatRef.current
    const pressTime = pressTimeMsRef.current
    const letterMatch = pressed === expected
    const onTime = pressTime !== null && (pressTime - beatStartRef.current) <= BEAT_TIMING_TOLERANCE_MS
    const isCorrect = letterMatch && onTime

    const next = beatStatesRef.current.slice()
    next[beatIdx] = isCorrect ? 'correct' : 'wrong'
    beatStatesRef.current = next
    setBeatStates(next)

    setTotalAnswered(n => n + 1)
    if (isCorrect) setCorrectCount(c => c + 1)

    // Per-pitch noteResults and per-letter miss counts.
    const fullPitch = measure.notes[beatIdx]
    if (!noteResultsRef.current[fullPitch]) noteResultsRef.current[fullPitch] = { attempts: 0, correct: 0 }
    noteResultsRef.current[fullPitch].attempts++
    if (isCorrect) {
      noteResultsRef.current[fullPitch].correct++
    } else {
      missedLettersRef.current[expected] = (missedLettersRef.current[expected] ?? 0) + 1
      measureHadMissRef.current = true
    }

    pressedThisBeatRef.current = null
    pressTimeMsRef.current = null
  }

  function startMeasure(measureIdx: number) {
    if (!queue.length) return
    const measure = queue[measureIdx]
    const bMs = beatMs(measure.tempoBpm)

    // Ensure AudioContext is alive. Lazy-create on first start to avoid
    // autoplay blocks; resume if the tab was backgrounded.
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()

    qIdxRef.current = measureIdx
    runningRef.current = true
    measureHadMissRef.current = false
    pressedThisBeatRef.current = null
    beatStatesRef.current = ['pending', 'pending', 'pending', 'pending']
    setBeatStates(['pending', 'pending', 'pending', 'pending'])
    setRunning(true)
    setActiveBeat(null)
    setMeasureFlash(null)

    // Lead-in count clicks (no visual beat active).
    for (let i = 0; i < LEAD_IN_BEATS; i++) {
      const h = window.setTimeout(() => {
        if (!runningRef.current) return
        playClick(ctxRef.current!, i === 0)
      }, i * bMs)
      timeoutsRef.current.push(h)
    }

    // The measure's four note beats.
    const measureStart = LEAD_IN_BEATS * bMs
    for (let beat = 0; beat < NOTES_PER_MEASURE; beat++) {
      const tickAt = measureStart + beat * bMs
      const h = window.setTimeout(() => {
        if (!runningRef.current) return
        // Finalise prior beat at the moment of this tick (its window ended).
        if (beat > 0) finalizeBeat(measure, beat - 1)
        // Stamp the start time of the new beat so the press tolerance
        // check can measure offset from the tick.
        beatStartRef.current = performance.now()
        pressedThisBeatRef.current = null
        pressTimeMsRef.current = null
        setActiveBeat(beat)
        playClick(ctxRef.current!, beat === 0)
      }, tickAt)
      timeoutsRef.current.push(h)
    }
    // End-of-measure: finalise last beat, show feedback, advance.
    const measureEnd = measureStart + NOTES_PER_MEASURE * bMs
    const hEnd = window.setTimeout(() => {
      if (!runningRef.current) return
      finalizeBeat(measure, NOTES_PER_MEASURE - 1)
      setActiveBeat(null)
      runningRef.current = false
      setRunning(false)
      // Per-measure flash classification.
      const finalStates = beatStatesRef.current
      const allRight = finalStates.every(s => s === 'correct')
      const anyRight = finalStates.some(s => s === 'correct')
      setMeasureFlash(allRight ? 'correct' : anyRight ? 'partial' : 'wrong')
      if (!allRight) missedMeasuresRef.current.push(measure)

      // Advance after a short beat-shaped pause so the feedback lands.
      const hNext = window.setTimeout(() => {
        const nextIdx = measureIdx + 1
        if (nextIdx >= sessionLength) {
          setDone(true)
        } else {
          setQIdx(nextIdx)
          startMeasure(nextIdx)
        }
      }, GAP_AFTER_MEASURE_MS)
      timeoutsRef.current.push(hNext)
    }, measureEnd)
    timeoutsRef.current.push(hEnd)
  }

  // Stop any in-flight timers when the component unmounts or the session ends.
  useEffect(() => {
    return () => {
      runningRef.current = false
      clearScheduled()
      ctxRef.current?.close().catch(() => {})
      ctxRef.current = null
    }
  }, [])

  // Record session when done.
  useEffect(() => {
    if (!done || !mod) return
    if (retryModeRef.current) {
      setResult({
        mp: { moduleId, identify: { completed: false }, locate: { completed: false }, play: { completed: false } } as unknown as ReturnType<typeof recordNRIdentifySession>['mp'],
        identifyJustMastered: false,
      })
      return
    }
    const total = sessionLength * NOTES_PER_MEASURE
    const accuracy = total > 0 ? correctCount / total : 0
    const res = recordNRIdentifySession(moduleId, accuracy, noteResultsRef.current)
    setResult(res)
  }, [done])

  function handleStart() {
    if (awaitingStart) {
      setAwaitingStart(false)
    }
    setDone(false)
    setResult(null)
    setCorrectCount(0)
    setTotalAnswered(0)
    setQIdx(0)
    clearScheduled()
    startMeasure(0)
  }

  function handleEndSession() { setShowEndConfirm(true) }
  function confirmEnd() {
    clearScheduled()
    runningRef.current = false
    router.push(`/programs/note-reading/${moduleId}`)
  }

  if (!mod) return null
  if (!queue.length) return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: F, color: '#7A7060' }}>Loading…</p>
    </div>
  )

  const progressPct = (qIdx / sessionLength) * 100

  // ── Summary ────────────────────────────────────────────────────────────────
  if (done && result) {
    const { mp: savedMp, identifyJustMastered } = result
    void identifyJustMastered
    const totalNotes = sessionLength * NOTES_PER_MEASURE
    const accuracy = totalNotes > 0 ? correctCount / totalNotes : 0
    const pct = Math.round(accuracy * 100)
    const passingSessions = retryMode ? 0 : nrConsecutivePassing(moduleId, 'identify', loadNRProgress())
    const needed = mod.criteria.sessions
    const threshold = mod.criteria.identifyAccuracy ?? 0.9
    const passedThisSession = !retryMode && accuracy >= threshold
    const nextModule = NOTE_READING_MODULES.find(m => m.unlockAfter.includes(moduleId))
    const moduleFinished = !retryMode && savedMp.completed
    const missedLetters = Object.entries(missedLettersRef.current).sort((a, b) => b[1] - a[1])

    function reset(newQueue: RhythmicMeasure[], newRetry: boolean) {
      clearScheduled()
      runningRef.current = false
      setDone(false)
      setResult(null)
      setQIdx(0)
      setCorrectCount(0)
      setTotalAnswered(0)
      setActiveBeat(null)
      setBeatStates(['pending', 'pending', 'pending', 'pending'])
      beatStatesRef.current = ['pending', 'pending', 'pending', 'pending']
      setMeasureFlash(null)
      setRetryMode(newRetry)
      retryModeRef.current = newRetry
      noteResultsRef.current = {}
      missedLettersRef.current = {}
      missedMeasuresRef.current = []
      timingsRef.current = []
      setQueue(newQueue)
      // Let React commit the new queue before starting.
      window.setTimeout(() => startMeasure(0), 50)
    }

    function retry() {
      const q = buildRhythmicQueue(mod!.notes, SESSION_LENGTH, DEFAULT_TEMPO)
      reset(q, false)
    }

    function retryMissed() {
      const misses = missedMeasuresRef.current.slice()
      if (misses.length === 0) return
      const q: RhythmicMeasure[] = []
      let i = 0
      while (q.length < 5) {
        q.push(misses[i % misses.length])
        i++
      }
      reset(q, true)
    }

    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '48px 40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            {retryMode ? 'Retry Complete' : 'Session Complete'}
          </p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '28px' }}>
            Rhythmic Identify
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 300, color: pct >= Math.round(threshold * 100) ? CORRECT_FG : '#2A2318', margin: 0 }}>{pct}%</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Accuracy</p>
            </div>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 300, color: '#2A2318', margin: 0 }}>{correctCount}/{totalNotes}</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Notes caught</p>
            </div>
          </div>

          {missedLetters.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: WRONG_BG, border: `1px solid ${WRONG_BORDER}`, borderRadius: '10px', textAlign: 'left' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: WRONG_FG, letterSpacing: '0.06em', textTransform: 'uppercase' as const, margin: '0 0 6px' }}>Missed letters</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: WRONG_FG, margin: 0 }}>
                {missedLetters.map(([l, c]) => c > 1 ? `${l} ×${c}` : l).join(', ')}
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
            {missedMeasuresRef.current.length > 0 && (
              <button
                onClick={retryMissed}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
              >
                Retry the measures you missed ({missedMeasuresRef.current.length})
              </button>
            )}
            <button
              onClick={retry}
              style={{
                background: missedMeasuresRef.current.length > 0 ? 'transparent' : '#1A1A18',
                color: missedMeasuresRef.current.length > 0 ? '#7A7060' : 'white',
                border: missedMeasuresRef.current.length > 0 ? '1px solid #DDD8CA' : 'none',
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
  const currentMeasure = queue[qIdx]
  const cardBorder = measureFlash === 'correct' ? CORRECT_BORDER
    : measureFlash === 'wrong' ? WRONG_BORDER
    : '#DDD8CA'
  const cardBg = measureFlash === 'correct' ? CORRECT_BG
    : measureFlash === 'wrong' ? WRONG_BG
    : 'white'

  return (
    <div style={{ minHeight: '100dvh', background: '#F2EDDF', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', flexShrink: 0 }}>
        <button onClick={confirmEnd}
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
            {Math.min(qIdx + 1, sessionLength)} / {sessionLength}
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
          background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '20px',
          padding: 'clamp(18px,3vh,32px) clamp(18px,4vw,36px)',
          maxWidth: '560px', width: '100%', textAlign: 'center',
          boxShadow: '0 2px 20px rgba(26,26,24,0.06)',
          transition: 'background 0.2s, border-color 0.2s',
        }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '10px' }}>
            Press each letter within {BEAT_TIMING_TOLERANCE_MS}ms of its beat · {currentMeasure.tempoBpm} BPM
          </p>

          <RhythmicMeasureStaff
            notes={currentMeasure.notes}
            activeIndex={activeBeat}
            beatStates={beatStates}
            revealLetters={measureFlash !== null}
          />

          <div style={{ minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
            {awaitingStart && (
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
                Press Start when you&apos;re ready — you&apos;ll get a 2-beat count-in.
              </span>
            )}
            {!awaitingStart && running && activeBeat === null && (
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
                Count-in…
              </span>
            )}
            {!awaitingStart && running && activeBeat !== null && (
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#B5402A' }}>
                Beat {activeBeat + 1} / 4
              </span>
            )}
            {!awaitingStart && !running && measureFlash !== null && (
              <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: measureFlash === 'correct' ? CORRECT_FG : WRONG_FG }}>
                {measureFlash === 'correct' ? '✓ Perfect measure' : measureFlash === 'partial' ? 'Partial — watch the missed beats' : '✗ Missed the measure'}
              </span>
            )}
          </div>
        </div>

        {/* Letter buttons */}
        <div style={{ marginTop: 'clamp(14px,2.5vh,22px)', maxWidth: '560px', width: '100%' }}>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            {LETTERS.map(letter => (
              <button
                key={letter}
                disabled={!running || activeBeat === null}
                onClick={() => handleLetter(letter)}
                style={{
                  flex: 1, padding: '14px 0',
                  borderRadius: '10px', border: '1px solid #DDD8CA',
                  background: 'white', color: '#2A2318',
                  fontFamily: SERIF, fontSize: '22px', fontWeight: 400,
                  cursor: running && activeBeat !== null ? 'pointer' : 'default',
                  opacity: running && activeBeat !== null ? 1 : 0.5,
                  transition: 'background 0.1s',
                }}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Start / advance controls */}
        {awaitingStart && (
          <button
            onClick={handleStart}
            style={{ marginTop: '18px', background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
          >
            Start
          </button>
        )}
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
