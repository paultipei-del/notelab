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
  buildIntervallicQueue,
  INTERVAL_LABELS,
  pitchToLetterPos,
  type IntervallicQuestion,
  type IntervalSize,
} from '@/lib/programs/note-reading/intervallic'
import { SADPitchDetector } from '@/lib/sadDetector'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const SESSION_LENGTH = 20

// SAD tuning — same constants as standard Play.
const DEAD_WINDOW_MS: Record<string, number> = { 'C5': 1200, 'B4': 900, 'C4': 900, 'B3': 900 }
const DEFAULT_DEAD_MS = 600
const WRONG_COOLDOWN_MS = 1000
const OCTAVE_BLEED_MS = 600
const WRONG_SEMITONE_RANGE = 25

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const ENHARMONICS: Record<string,string> = {
  'C#':'Db','Db':'C#','D#':'Eb','Eb':'D#',
  'F#':'Gb','Gb':'F#','G#':'Ab','Ab':'G#','A#':'Bb','Bb':'A#',
}

const INTERVAL_SIZES: IntervalSize[] = [2, 3, 4, 5, 6, 7, 8]

const RENDER_MIN = pitchToLetterPos('C3') ?? 21
const RENDER_MAX = pitchToLetterPos('E5') ?? 37

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

// Component-scoped mic handles. Unlike the standard Play drill we don't
// keep a module-level singleton — the intervallic session owns the mic
// for its own lifetime and releases it on unmount.
type MicRefs = {
  stream: MediaStream | null
  ctx: AudioContext | null
  analyser: AnalyserNode | null
  detector: SADPitchDetector | null
  buf: Float32Array | null
  raf: number
}

type NoteStatus = 'listening' | 'correct' | 'wrong'

export default function IntervallicPlaySession({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { hasSubscription, loading: purchasesLoading } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()
  const isLoading = authLoading || purchasesLoading

  const mod = getNRModule(moduleId)
  const [queue, setQueue] = useState<IntervallicQuestion[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [noteStatus, setNoteStatus] = useState<NoteStatus>('listening')
  const [detected, setDetected] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const [savedMp, setSavedMp] = useState<ReturnType<typeof recordNRPlaySession> | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [micReady, setMicReady] = useState(false)

  const noteResultsRef = useRef<Record<string, NoteResult>>({})
  const intervalMissRef = useRef<Record<IntervalSize, number>>(
    INTERVAL_SIZES.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<IntervalSize, number>),
  )
  const hadWrongThisNoteRef = useRef(false)
  const missedQuestionsRef = useRef<IntervallicQuestion[]>([])

  const mic = useRef<MicRefs>({ stream: null, ctx: null, analyser: null, detector: null, buf: null, raf: 0 })
  const targetRef = useRef('')
  const currentQuestionRef = useRef<IntervallicQuestion | null>(null)
  const cardStartRef = useRef(0)
  const acceptStartRef = useRef(0)
  const doneNoteRef = useRef(false)
  const prevMidiRef = useRef(-1)
  const lastWrongRef = useRef(0)
  const qIdxRef = useRef(0)
  const correctRef = useRef(0)
  const responseTimesRef = useRef<number[]>([])
  const sessionDoneRef = useRef(false)

  function stopMic() {
    cancelAnimationFrame(mic.current.raf)
    mic.current.stream?.getTracks().forEach(t => t.stop())
    mic.current.ctx?.close().catch(() => {})
    mic.current = { stream: null, ctx: null, analyser: null, detector: null, buf: null, raf: 0 }
  }

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
    const q = buildIntervallicQueue(mod.notes, SESSION_LENGTH, { min: RENDER_MIN, max: RENDER_MAX })
    setQueue(q)
    qIdxRef.current = 0
    correctRef.current = 0
    responseTimesRef.current = []
    sessionDoneRef.current = false
    noteResultsRef.current = {}
    intervalMissRef.current = INTERVAL_SIZES.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<IntervalSize, number>)
    missedQuestionsRef.current = []
    hadWrongThisNoteRef.current = false
  }, [moduleId])

  // Start mic when queue is ready
  useEffect(() => {
    if (!queue.length || !mod) return
    let cancelled = false
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        if (ctx.state === 'suspended') await ctx.resume()
        const src = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 4096
        src.connect(analyser)
        const buf = new Float32Array(4096)
        const detector = new SADPitchDetector(ctx.sampleRate)
        mic.current = { stream, ctx, analyser, detector, buf, raf: 0 }
        setMicReady(true)
        startNote(queue[0], 0)
      } catch {
        setMicError('Microphone access denied. Please allow microphone access and reload.')
      }
    }
    init()
    return () => { cancelled = true; stopMic() }
  }, [queue])

  function startNote(q: IntervallicQuestion, idx: number) {
    cancelAnimationFrame(mic.current.raf)
    targetRef.current = q.secondPitch
    currentQuestionRef.current = q
    qIdxRef.current = idx
    cardStartRef.current = Date.now()
    acceptStartRef.current = 0
    doneNoteRef.current = false
    hadWrongThisNoteRef.current = false
    mic.current.detector?.clearVotes()
    setNoteStatus('listening')
    setDetected(null)
    setQIdx(idx)
    mic.current.raf = requestAnimationFrame(tick)
  }

  function tick() {
    const m = mic.current
    if (!m.analyser || !m.buf || !m.detector || sessionDoneRef.current) return
    m.analyser.getFloatTimeDomainData(m.buf as unknown as Float32Array<ArrayBuffer>)
    const now = Date.now()
    const timeOnCard = now - cardStartRef.current
    const target = targetRef.current
    const deadMs = DEAD_WINDOW_MS[target.replace(/[#b]/g, '')] ?? DEFAULT_DEAD_MS

    if (timeOnCard < deadMs) { m.raf = requestAnimationFrame(tick); return }
    if (acceptStartRef.current === 0) acceptStartRef.current = now

    const result = m.detector.update(m.buf)
    if (result?.stable) {
      setDetected(result.name)
      const targetMidi = noteToMidi(target)
      const timeSinceAccept = now - acceptStartRef.current
      const isOctaveBleed =
        ((prevMidiRef.current >= 0 && (result.midi === prevMidiRef.current - 12 || result.midi === prevMidiRef.current + 12)) ||
          result.midi === targetMidi - 12 || result.midi === targetMidi + 12) &&
        timeSinceAccept < OCTAVE_BLEED_MS

      if (isOctaveBleed) { m.raf = requestAnimationFrame(tick); return }

      if (pitchMatch(result.name, target)) {
        if (doneNoteRef.current) return
        doneNoteRef.current = true
        prevMidiRef.current = result.midi
        const responseMs = now - acceptStartRef.current
        const firstTry = !hadWrongThisNoteRef.current
        correctRef.current += 1
        responseTimesRef.current = [...responseTimesRef.current, responseMs]
        setCorrectCount(correctRef.current)
        setResponseTimes([...responseTimesRef.current])
        setNoteStatus('correct')

        if (!noteResultsRef.current[target]) noteResultsRef.current[target] = { attempts: 0, correct: 0, responseMsTotal: 0 }
        noteResultsRef.current[target].attempts++
        noteResultsRef.current[target].correct += firstTry ? 1 : 0
        noteResultsRef.current[target].responseMsTotal = (noteResultsRef.current[target].responseMsTotal ?? 0) + responseMs

        setTimeout(() => advanceNote(), 300)
        return
      } else {
        const semDist = Math.abs(result.midi - noteToMidi(target))
        const isOctOfPrev = prevMidiRef.current >= 0 &&
          (result.midi === prevMidiRef.current + 12 || result.midi === prevMidiRef.current - 12)
        if (semDist <= WRONG_SEMITONE_RANGE && !isOctOfPrev && now - lastWrongRef.current > WRONG_COOLDOWN_MS) {
          if (!hadWrongThisNoteRef.current) {
            hadWrongThisNoteRef.current = true
            const q = currentQuestionRef.current
            if (q) {
              intervalMissRef.current[q.intervalSize]++
              missedQuestionsRef.current.push(q)
            }
          }
          setNoteStatus('wrong')
          lastWrongRef.current = now
        }
      }
    }
    if (!doneNoteRef.current) m.raf = requestAnimationFrame(tick)
  }

  function advanceNote() {
    const next = qIdxRef.current + 1
    if (next >= SESSION_LENGTH) {
      sessionDoneRef.current = true
      cancelAnimationFrame(mic.current.raf)
      setDone(true)
    } else {
      startNote(queue[next], next)
    }
  }

  useEffect(() => {
    if (!done || !mod) return
    const accuracy = correctRef.current / SESSION_LENGTH
    const avgMs = responseTimesRef.current.length > 0
      ? responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
      : 9999
    const mp = recordNRPlaySession(moduleId, accuracy, avgMs, noteResultsRef.current)
    setSavedMp(mp)
  }, [done])

  if (!mod) return null

  const currentQ = queue[qIdx]
  const currentTarget = currentQ?.secondPitch ?? ''
  const avgResponseSec = responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000).toFixed(1)
    : '—'
  const bgColor = noteStatus === 'correct' ? '#EAF3DE' : noteStatus === 'wrong' ? '#FFF0F0' : 'white'
  const borderColor = noteStatus === 'correct' ? '#C0DD97' : noteStatus === 'wrong' ? '#F09595' : '#D9CFAE'

  // ── Summary ────────────────────────────────────────────────────────────────
  if (done && savedMp) {
    const accuracy = correctRef.current / SESSION_LENGTH
    const pct = Math.round(accuracy * 100)
    const avgMs = responseTimesRef.current.length > 0
      ? responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
      : null
    const missedIntervalEntries = INTERVAL_SIZES
      .filter(s => intervalMissRef.current[s] > 0)
      .map(s => ({ size: s, count: intervalMissRef.current[s] }))
      .sort((a, b) => b.count - a.count)
    const passingSessions = nrConsecutivePassing(moduleId, 'play', loadNRProgress())
    const needed = mod.criteria.sessions
    const threshold = mod.criteria.playAccuracy ?? 0.9
    const msThreshold = mod.criteria.playAvgResponseMs
    const passedAcc = accuracy >= threshold
    const passedMs = msThreshold === undefined || (avgMs !== null && avgMs <= msThreshold)
    const passedSession = passedAcc && passedMs
    const nextModule = NOTE_READING_MODULES.find(m => m.unlockAfter.includes(moduleId))

    function retry() {
      setDone(false); setSavedMp(null); setQIdx(0); setCorrectCount(0)
      setResponseTimes([]); setNoteStatus('listening'); setDetected(null)
      noteResultsRef.current = {}
      intervalMissRef.current = INTERVAL_SIZES.reduce((acc, s) => { acc[s] = 0; return acc }, {} as Record<IntervalSize, number>)
      missedQuestionsRef.current = []
      prevMidiRef.current = -1; sessionDoneRef.current = false
      correctRef.current = 0; responseTimesRef.current = []
      hadWrongThisNoteRef.current = false
      const q = buildIntervallicQueue(mod!.notes, SESSION_LENGTH, { min: RENDER_MIN, max: RENDER_MAX })
      setQueue(q)
      setTimeout(() => startNote(q[0], 0), 50)
    }

    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#ECE3CC', borderRadius: '20px', border: '1px solid #D9CFAE', padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            Session Complete
          </p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '28px' }}>
            Intervallic Play It
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 300, color: passedAcc ? '#3B6D11' : '#2A2318', margin: 0 }}>{pct}%</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Accuracy</p>
            </div>
            {avgMs !== null && (
              <div>
                <p style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 300, color: passedMs ? '#3B6D11' : '#2A2318', margin: 0 }}>{(avgMs / 1000).toFixed(1)}s</p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Avg Response</p>
              </div>
            )}
          </div>

          {missedIntervalEntries.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#FCEBEB', border: '1px solid #F09595', borderRadius: '10px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#A32D2D', letterSpacing: '0.06em', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>Intervals you missed</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#A32D2D', margin: 0 }}>
                {missedIntervalEntries.map(e => e.count > 1 ? `${INTERVAL_LABELS[e.size]} ×${e.count}` : INTERVAL_LABELS[e.size]).join(', ')}
              </p>
            </div>
          )}

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedMp.completed && nextModule && (
              <button
                onClick={() => { stopMic(); router.push(`/programs/note-reading/${nextModule.id}`) }}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
              >
                Next Module →
              </button>
            )}
            <button
              onClick={retry}
              style={{
                background: savedMp.completed && nextModule ? 'transparent' : '#1A1A18',
                color: savedMp.completed && nextModule ? '#7A7060' : 'white',
                border: savedMp.completed && nextModule ? '1px solid #D9CFAE' : 'none',
                borderRadius: '10px', padding: '13px',
                fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => {
                stopMic()
                if (savedMp.completed) router.push('/programs/note-reading')
                else router.push(`/programs/note-reading/${moduleId}`)
              }}
              style={{ background: 'transparent', color: '#7A7060', border: '1px solid #D9CFAE', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
            >
              {savedMp.completed ? '← Back to program' : '← Back to module'}
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
    <div style={{ height: '100dvh', overflow: 'hidden', background: 'transparent', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', flexShrink: 0 }}>
        <button onClick={() => { stopMic(); router.push(`/programs/note-reading/${moduleId}`) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            {mod.title} · Play It
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0 }}>{qIdx + 1} / {SESSION_LENGTH}</p>
          {responseTimes.length > 0 && (
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', margin: 0 }}>avg {avgResponseSec}s</p>
          )}
        </div>
      </div>

      <div style={{ height: '2px', background: '#EDE8DF', flexShrink: 0 }}>
        <div style={{ height: '100%', background: '#1A1A18', width: `${(qIdx / SESSION_LENGTH) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px,2vh,20px) 16px' }}>
        {micError ? (
          <div style={{
            maxWidth: '440px', width: '100%', background: '#ECE3CC',
            border: '1px solid #D9CFAE', borderRadius: '16px', padding: '28px 32px',
            textAlign: 'center', boxShadow: '0 2px 20px rgba(26,26,24,0.06)',
          }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', margin: '0 0 8px' }}>
              Can&apos;t hear your piano
            </p>
            <h3 style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 300, color: '#2A2318', margin: '0 0 12px' }}>
              Microphone access needed
            </h3>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', lineHeight: 1.6, margin: '0 0 20px' }}>
              Play It uses your microphone to listen for the note you play. Allow mic access in your browser&apos;s address bar, then reload.
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
                style={{ background: 'transparent', color: '#7A7060', border: '1px solid #D9CFAE', borderRadius: '10px', padding: '11px 20px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}
              >
                ← Back to module
              </button>
            </div>
          </div>
        ) : !micReady ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 300, color: '#2A2318', margin: '0 0 4px' }}>
              Get your piano ready
            </p>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>Warming up the microphone…</p>
          </div>
        ) : (
          <div style={{ maxWidth: '560px', width: '100%' }}>
            <div style={{
              background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '20px',
              padding: 'clamp(16px,2.5vh,32px) clamp(12px,3vw,32px)',
              textAlign: 'center', transition: 'all 0.15s',
              boxShadow: '0 2px 20px rgba(26,26,24,0.06)',
            }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: 'clamp(4px,1vh,10px)' }}>
                {noteStatus === 'correct' ? '✓ Correct' : 'Play the interval'}
              </p>
              <p style={{ fontFamily: SERIF, fontSize: 'clamp(22px,4vw,30px)', fontWeight: 300, color: '#2A2318', margin: '0 0 clamp(8px,1.5vh,16px)' }}>
                <span style={{ color: '#7A7060' }}>From</span> {currentQ.firstPitch} ·
                <span style={{ color: '#B5402A' }}> {directionWord} a {INTERVAL_LABELS[currentQ.intervalSize]}</span>
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(8px,1.5vh,20px)' }}>
                <GrandStaffCard note={currentQ.firstPitch} />
              </div>

              <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {noteStatus === 'listening' && (
                  <>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#B5402A', animation: 'pulse 1s infinite' }} />
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
                      {detected ? `Hearing: ${detected}` : 'Play the note…'}
                    </span>
                  </>
                )}
                {noteStatus === 'correct' && (
                  <span style={{ fontFamily: SERIF, fontSize: '22px', color: '#3B6D11' }}>
                    ✓ {currentTarget}
                  </span>
                )}
                {noteStatus === 'wrong' && detected && (
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#A32D2D' }}>
                    ✗ That&apos;s {detected} — target is {currentTarget.replace(/\d+$/, '')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
