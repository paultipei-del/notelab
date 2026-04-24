'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getNRModule, NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  recordNRPlaySession,
  isNRPlayUnlocked,
  loadNRProgress,
  nrConsecutivePassing,
} from '@/lib/programs/note-reading/progress'
import type { NoteResult } from '@/lib/programs/note-reading/types'
import {
  buildRhythmicQueue,
  beatMs,
  type RhythmicMeasure,
} from '@/lib/programs/note-reading/rhythmic'
import { SADPitchDetector } from '@/lib/sadDetector'
import RhythmicMeasureStaff from '@/components/cards/RhythmicMeasureStaff'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const SESSION_LENGTH = 10
const NOTES_PER_MEASURE = 4
const LEAD_IN_BEATS = 2
const GAP_AFTER_MEASURE_MS = 700
const DEFAULT_TEMPO = 60
// Swallow analyser output during the first slice of each beat so the
// metronome click can't register as a detected pitch.
const BEAT_DEAD_WINDOW_MS = 120
const OCTAVE_BLEED_MS = 600

const CORRECT_FG = '#3B6D11'
const CORRECT_BG = '#EAF3DE'
const CORRECT_BORDER = '#C0DD97'
const WRONG_FG = '#A32D2D'
const WRONG_BG = '#FCEBEB'
const WRONG_BORDER = '#F09595'

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const ENHARMONICS: Record<string, string> = {
  'C#':'Db','Db':'C#','D#':'Eb','Eb':'D#',
  'F#':'Gb','Gb':'F#','G#':'Ab','Ab':'G#','A#':'Bb','Bb':'A#',
}

function noteToMidi(name: string): number {
  const m = name.match(/^([A-Gb#]+)(\d)$/)
  if (!m) return 60
  const pc = m[1].includes('b') ? ENHARMONICS[m[1]] ?? m[1] : m[1]
  return (parseInt(m[2]) + 1) * 12 + NOTE_NAMES.indexOf(pc)
}

function pitchMatch(played: string, target: string): boolean {
  if (played === target) return true
  const pp = played.replace(/\d+$/, ''), tp = target.replace(/\d+$/, '')
  const po = played.match(/\d+$/)?.[0], to = target.match(/\d+$/)?.[0]
  return po === to && ENHARMONICS[tp] === pp
}

type BeatState = 'pending' | 'correct' | 'wrong'
type MicRefs = {
  stream: MediaStream | null
  ctx: AudioContext | null
  analyser: AnalyserNode | null
  detector: SADPitchDetector | null
  buf: Float32Array | null
  raf: number
}

// Separate output audio context for the metronome click so it doesn't
// share state with the mic-analysis context.
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

export default function RhythmicPlaySession({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { hasSubscription, loading: purchasesLoading } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()
  const isLoading = authLoading || purchasesLoading

  const mod = getNRModule(moduleId)
  const [queue, setQueue] = useState<RhythmicMeasure[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [activeBeat, setActiveBeat] = useState<number | null>(null)
  const [beatStates, setBeatStates] = useState<BeatState[]>(['pending', 'pending', 'pending', 'pending'])
  const [running, setRunning] = useState(false)
  const [detected, setDetected] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [savedMp, setSavedMp] = useState<ReturnType<typeof recordNRPlaySession> | null>(null)
  const [retryMode, setRetryMode] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [awaitingStart, setAwaitingStart] = useState(true)
  const [micError, setMicError] = useState<string | null>(null)
  const [micReady, setMicReady] = useState(false)
  const [measureFlash, setMeasureFlash] = useState<'correct' | 'partial' | 'wrong' | null>(null)

  // Metronome output context (separate from mic input ctx).
  const clickCtxRef = useRef<AudioContext | null>(null)
  const timeoutsRef = useRef<number[]>([])
  // Shared between React state and the RAF loop.
  const mic = useRef<MicRefs>({ stream: null, ctx: null, analyser: null, detector: null, buf: null, raf: 0 })
  const qIdxRef = useRef(0)
  const runningRef = useRef(false)
  const activeBeatRef = useRef<number | null>(null)
  const beatStatesRef = useRef<BeatState[]>(['pending', 'pending', 'pending', 'pending'])
  const currentTargetRef = useRef<string>('')
  const beatStartRef = useRef(0)
  const beatResolvedRef = useRef(false)
  const prevMidiRef = useRef(-1)
  const noteResultsRef = useRef<Record<string, NoteResult>>({})
  const responseTimesRef = useRef<number[]>([])
  const missedLettersRef = useRef<Record<string, number>>({})
  const missedMeasuresRef = useRef<RhythmicMeasure[]>([])
  const measureHadMissRef = useRef(false)
  const correctRef = useRef(0)
  const totalAnsweredRef = useRef(0)

  const sessionLength = retryMode ? Math.min(5, queue.length) : queue.length

  useEffect(() => {
    if (!isLoading && !isPro) router.replace('/account')
  }, [isLoading, isPro])

  useEffect(() => {
    if (!mod) return
    const store = loadNRProgress()
    if (!isNRPlayUnlocked(moduleId, store)) {
      router.replace(`/programs/note-reading/${moduleId}`)
      return
    }
    const q = buildRhythmicQueue(mod.notes, SESSION_LENGTH, DEFAULT_TEMPO)
    setQueue(q)
    noteResultsRef.current = {}
    missedLettersRef.current = {}
    missedMeasuresRef.current = []
    responseTimesRef.current = []
    correctRef.current = 0
    totalAnsweredRef.current = 0
    qIdxRef.current = 0
  }, [moduleId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false
      for (const h of timeoutsRef.current) window.clearTimeout(h)
      timeoutsRef.current = []
      cancelAnimationFrame(mic.current.raf)
      mic.current.stream?.getTracks().forEach(t => t.stop())
      mic.current.ctx?.close().catch(() => {})
      clickCtxRef.current?.close().catch(() => {})
      mic.current = { stream: null, ctx: null, analyser: null, detector: null, buf: null, raf: 0 }
      clickCtxRef.current = null
    }
  }, [])

  async function ensureMic(): Promise<boolean> {
    if (mic.current.analyser) return true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const ctx = new AudioContext()
      if (ctx.state === 'suspended') await ctx.resume()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 4096
      src.connect(analyser)
      const buf = new Float32Array(4096)
      const detector = new SADPitchDetector(ctx.sampleRate)
      mic.current = { stream, ctx, analyser, detector, buf, raf: 0 }
      setMicReady(true)
      return true
    } catch {
      setMicError('Microphone access denied. Please allow microphone access and reload.')
      return false
    }
  }

  function clearScheduled() {
    for (const h of timeoutsRef.current) window.clearTimeout(h)
    timeoutsRef.current = []
  }

  // Called when the beat-window closes (next tick fires, or measure ends).
  function finalizeBeat(measure: RhythmicMeasure, beatIdx: number) {
    // If the beat was already resolved (correct detection), nothing to do.
    if (beatStatesRef.current[beatIdx] === 'correct') return
    // Otherwise mark as wrong.
    const expected = measure.notes[beatIdx]
    const next = beatStatesRef.current.slice()
    next[beatIdx] = 'wrong'
    beatStatesRef.current = next
    setBeatStates(next)
    totalAnsweredRef.current++
    const letter = expected.replace(/\d+$/, '')
    missedLettersRef.current[letter] = (missedLettersRef.current[letter] ?? 0) + 1
    measureHadMissRef.current = true

    if (!noteResultsRef.current[expected]) noteResultsRef.current[expected] = { attempts: 0, correct: 0, responseMsTotal: 0 }
    noteResultsRef.current[expected].attempts++
  }

  function tick() {
    const m = mic.current
    if (!m.analyser || !m.buf || !m.detector || !runningRef.current) return
    if (activeBeatRef.current === null || beatResolvedRef.current) {
      m.raf = requestAnimationFrame(tick)
      return
    }
    const now = performance.now()
    const timeSinceBeat = now - beatStartRef.current
    if (timeSinceBeat < BEAT_DEAD_WINDOW_MS) {
      m.raf = requestAnimationFrame(tick)
      return
    }
    m.analyser.getFloatTimeDomainData(m.buf as unknown as Float32Array<ArrayBuffer>)
    const result = m.detector.update(m.buf)
    if (result?.stable) {
      setDetected(result.name)
      const target = currentTargetRef.current
      const targetMidi = noteToMidi(target)
      const isOctaveBleed =
        ((prevMidiRef.current >= 0 && (result.midi === prevMidiRef.current - 12 || result.midi === prevMidiRef.current + 12)) ||
          result.midi === targetMidi - 12 || result.midi === targetMidi + 12) &&
        timeSinceBeat < OCTAVE_BLEED_MS
      if (!isOctaveBleed) {
        const beatIdx = activeBeatRef.current!
        if (pitchMatch(result.name, target)) {
          // Correct pitch within beat window.
          beatResolvedRef.current = true
          prevMidiRef.current = result.midi
          const responseMs = timeSinceBeat
          responseTimesRef.current = [...responseTimesRef.current, responseMs]
          const next = beatStatesRef.current.slice()
          next[beatIdx] = 'correct'
          beatStatesRef.current = next
          setBeatStates(next)
          correctRef.current++
          totalAnsweredRef.current++
          setCorrectCount(correctRef.current)
          if (!noteResultsRef.current[target]) noteResultsRef.current[target] = { attempts: 0, correct: 0, responseMsTotal: 0 }
          noteResultsRef.current[target].attempts++
          noteResultsRef.current[target].correct++
          noteResultsRef.current[target].responseMsTotal = (noteResultsRef.current[target].responseMsTotal ?? 0) + responseMs
        } else {
          // Wrong pitch — lock the beat as wrong, don't keep listening.
          beatResolvedRef.current = true
          const next = beatStatesRef.current.slice()
          next[beatIdx] = 'wrong'
          beatStatesRef.current = next
          setBeatStates(next)
          totalAnsweredRef.current++
          const letter = target.replace(/\d+$/, '')
          missedLettersRef.current[letter] = (missedLettersRef.current[letter] ?? 0) + 1
          measureHadMissRef.current = true
          if (!noteResultsRef.current[target]) noteResultsRef.current[target] = { attempts: 0, correct: 0, responseMsTotal: 0 }
          noteResultsRef.current[target].attempts++
        }
      }
    }
    m.raf = requestAnimationFrame(tick)
  }

  function startMeasure(measureIdx: number) {
    if (!queue.length) return
    const measure = queue[measureIdx]
    const bMs = beatMs(measure.tempoBpm)
    if (!clickCtxRef.current || clickCtxRef.current.state === 'closed') {
      clickCtxRef.current = new AudioContext()
    }
    if (clickCtxRef.current.state === 'suspended') void clickCtxRef.current.resume()

    qIdxRef.current = measureIdx
    runningRef.current = true
    measureHadMissRef.current = false
    beatStatesRef.current = ['pending', 'pending', 'pending', 'pending']
    setBeatStates(['pending', 'pending', 'pending', 'pending'])
    setRunning(true)
    setActiveBeat(null)
    activeBeatRef.current = null
    setMeasureFlash(null)
    setDetected(null)
    mic.current.detector?.clearVotes()

    // Lead-in count-in clicks.
    for (let i = 0; i < LEAD_IN_BEATS; i++) {
      const h = window.setTimeout(() => {
        if (!runningRef.current) return
        playClick(clickCtxRef.current!, i === 0)
      }, i * bMs)
      timeoutsRef.current.push(h)
    }

    const measureStart = LEAD_IN_BEATS * bMs
    for (let beat = 0; beat < NOTES_PER_MEASURE; beat++) {
      const tickAt = measureStart + beat * bMs
      const h = window.setTimeout(() => {
        if (!runningRef.current) return
        // Finalise prior beat at the moment of this tick.
        if (beat > 0) finalizeBeat(measure, beat - 1)
        // Open this beat.
        activeBeatRef.current = beat
        setActiveBeat(beat)
        currentTargetRef.current = measure.notes[beat]
        beatStartRef.current = performance.now()
        beatResolvedRef.current = false
        mic.current.detector?.clearVotes()
        playClick(clickCtxRef.current!, beat === 0)
      }, tickAt)
      timeoutsRef.current.push(h)
    }
    // End of measure: finalise last beat, show feedback, advance.
    const measureEnd = measureStart + NOTES_PER_MEASURE * bMs
    const hEnd = window.setTimeout(() => {
      if (!runningRef.current) return
      finalizeBeat(measure, NOTES_PER_MEASURE - 1)
      activeBeatRef.current = null
      setActiveBeat(null)
      runningRef.current = false
      setRunning(false)
      const finalStates = beatStatesRef.current
      const allRight = finalStates.every(s => s === 'correct')
      const anyRight = finalStates.some(s => s === 'correct')
      setMeasureFlash(allRight ? 'correct' : anyRight ? 'partial' : 'wrong')
      if (!allRight) missedMeasuresRef.current.push(measure)

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

    // Kick off the RAF-based detection loop if it's not already running.
    cancelAnimationFrame(mic.current.raf)
    mic.current.raf = requestAnimationFrame(tick)
  }

  async function handleStart() {
    const ok = await ensureMic()
    if (!ok) return
    setAwaitingStart(false)
    setDone(false)
    setSavedMp(null)
    setCorrectCount(0)
    totalAnsweredRef.current = 0
    correctRef.current = 0
    setQIdx(0)
    clearScheduled()
    startMeasure(0)
  }

  function handleEndSession() { setShowEndConfirm(true) }
  function confirmEnd() {
    runningRef.current = false
    clearScheduled()
    cancelAnimationFrame(mic.current.raf)
    router.push(`/programs/note-reading/${moduleId}`)
  }

  // Record session when done.
  useEffect(() => {
    if (!done || !mod) return
    if (retryMode) {
      setSavedMp({ moduleId, identify: { completed: false }, locate: { completed: false }, play: { completed: false } } as unknown as ReturnType<typeof recordNRPlaySession>)
      return
    }
    const totalNotes = sessionLength * NOTES_PER_MEASURE
    const accuracy = totalNotes > 0 ? correctRef.current / totalNotes : 0
    const avgMs = responseTimesRef.current.length > 0
      ? responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
      : 9999
    const mp = recordNRPlaySession(moduleId, accuracy, avgMs, noteResultsRef.current)
    setSavedMp(mp)
  }, [done])

  if (!mod) return null
  if (!queue.length) return (
    <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: F, color: '#7A7060' }}>Loading…</p>
    </div>
  )

  const progressPct = (qIdx / sessionLength) * 100

  // ── Summary ────────────────────────────────────────────────────────────────
  if (done && savedMp) {
    const totalNotes = sessionLength * NOTES_PER_MEASURE
    const accuracy = totalNotes > 0 ? correctRef.current / totalNotes : 0
    const pct = Math.round(accuracy * 100)
    const avgMs = responseTimesRef.current.length > 0
      ? responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
      : null
    const missedLetters = Object.entries(missedLettersRef.current).sort((a, b) => b[1] - a[1])
    const passingSessions = nrConsecutivePassing(moduleId, 'play', loadNRProgress())
    const needed = mod.criteria.sessions
    const threshold = mod.criteria.playAccuracy ?? 0.9
    const msThreshold = mod.criteria.playAvgResponseMs
    const passedAcc = accuracy >= threshold
    const passedMs = msThreshold === undefined || (avgMs !== null && avgMs <= msThreshold)
    const passedSession = passedAcc && passedMs
    const nextModule = NOTE_READING_MODULES.find(m => m.unlockAfter.includes(moduleId))
    const moduleFinished = !retryMode && savedMp.completed

    function reset(newQueue: RhythmicMeasure[], newRetry: boolean) {
      clearScheduled()
      runningRef.current = false
      cancelAnimationFrame(mic.current.raf)
      setDone(false)
      setSavedMp(null)
      setQIdx(0)
      setCorrectCount(0)
      totalAnsweredRef.current = 0
      correctRef.current = 0
      setActiveBeat(null)
      setBeatStates(['pending', 'pending', 'pending', 'pending'])
      beatStatesRef.current = ['pending', 'pending', 'pending', 'pending']
      setMeasureFlash(null)
      setRetryMode(newRetry)
      noteResultsRef.current = {}
      missedLettersRef.current = {}
      missedMeasuresRef.current = []
      responseTimesRef.current = []
      setQueue(newQueue)
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
      <div style={{ minHeight: '100vh', background: '#F2EDDF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#FDFAF3', borderRadius: '20px', border: '1px solid #DDD8CA', padding: '48px 40px', maxWidth: '460px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            {retryMode ? 'Retry Complete' : 'Session Complete'}
          </p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '28px' }}>
            Rhythmic Play It
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 300, color: passedAcc ? CORRECT_FG : '#2A2318', margin: 0 }}>{pct}%</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Accuracy</p>
            </div>
            {avgMs !== null && (
              <div>
                <p style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 300, color: passedMs ? CORRECT_FG : '#2A2318', margin: 0 }}>{(avgMs / 1000).toFixed(1)}s</p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Avg response</p>
              </div>
            )}
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
                {passedSession ? '✓ Session passed' : '✗ Criteria not met'}
                {' · '}{Math.round(threshold * 100)}% accuracy needed
                {msThreshold && ` · avg <${(msThreshold / 1000).toFixed(1)}s needed`}
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
              onClick={() => {
                runningRef.current = false
                clearScheduled()
                cancelAnimationFrame(mic.current.raf)
                if (moduleFinished) router.push('/programs/note-reading')
                else router.push(`/programs/note-reading/${moduleId}`)
              }}
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
            {mod.title} · {retryMode ? 'Retry' : 'Play It'}
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
        {micError ? (
          <div style={{
            maxWidth: '440px', width: '100%', background: '#FDFAF3',
            border: '1px solid #DDD8CA', borderRadius: '16px', padding: '28px 32px',
            textAlign: 'center', boxShadow: '0 2px 20px rgba(26,26,24,0.06)',
          }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 8px' }}>
              Can&apos;t hear your piano
            </p>
            <h3 style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 300, color: '#2A2318', margin: '0 0 12px' }}>
              Microphone access needed
            </h3>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', lineHeight: 1.6, margin: '0 0 20px' }}>
              Play It uses your microphone to listen for each note. Allow mic access in your browser&apos;s address bar, then reload.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 20px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
              >
                Reload and retry
              </button>
              <button
                onClick={() => router.push(`/programs/note-reading/${moduleId}`)}
                style={{ background: 'transparent', color: '#7A7060', border: '1px solid #DDD8CA', borderRadius: '10px', padding: '11px 20px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
              >
                ← Back to module
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '20px',
              padding: 'clamp(18px,3vh,32px) clamp(18px,4vw,36px)',
              maxWidth: '560px', width: '100%', textAlign: 'center',
              boxShadow: '0 2px 20px rgba(26,26,24,0.06)',
              transition: 'background 0.2s, border-color 0.2s',
            }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '10px' }}>
                Play each note on its beat · {currentMeasure.tempoBpm} BPM
              </p>

              <RhythmicMeasureStaff
                notes={currentMeasure.notes}
                activeIndex={activeBeat}
                beatStates={beatStates}
                revealLetters={measureFlash !== null}
              />

              <div style={{ minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                {awaitingStart && (
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
                    Get your piano ready. Press Start for a 2-beat count-in.
                  </span>
                )}
                {!awaitingStart && !micReady && (
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
                    Warming up the microphone…
                  </span>
                )}
                {!awaitingStart && micReady && running && activeBeat === null && (
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
                    Count-in…
                  </span>
                )}
                {!awaitingStart && micReady && running && activeBeat !== null && (
                  <>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#B5402A', animation: 'pulse 1s infinite' }} />
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#B5402A' }}>
                      Beat {activeBeat + 1} / 4 {detected ? `· hearing ${detected}` : ''}
                    </span>
                  </>
                )}
                {!awaitingStart && !running && measureFlash !== null && (
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: measureFlash === 'correct' ? CORRECT_FG : WRONG_FG }}>
                    {measureFlash === 'correct' ? '✓ Perfect measure' : measureFlash === 'partial' ? 'Partial — watch the missed beats' : '✗ Missed the measure'}
                  </span>
                )}
              </div>
            </div>

            {awaitingStart && (
              <button
                onClick={handleStart}
                style={{ marginTop: '18px', background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
              >
                Start
              </button>
            )}
          </>
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
