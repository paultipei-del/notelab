'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { getNRModule, buildWeightedPool, NOTE_READING_MODULES } from '@/lib/programs/note-reading/modules'
import {
  recordNRPlaySession,
  isNRPlayUnlocked,
  loadNRProgress,
  nrConsecutivePassing,
  getNoteStats,
  buildReviewPool,
  injectReviewQuestions,
  recordRetention,
  type QueueEntry,
} from '@/lib/programs/note-reading/progress'
import type { NoteResult } from '@/lib/programs/note-reading/types'
import { SADPitchDetector } from '@/lib/sadDetector'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import IntervallicPlaySession from './IntervallicPlaySession'
import RhythmicPlaySession from './RhythmicPlaySession'
import { useAuth } from '@/hooks/useAuth'
import { usePurchases } from '@/hooks/usePurchases'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const SESSION_LENGTH = 20

// SAD constants — same as PlayItCard2
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

function noteToMidi(name: string): number {
  const m = name.match(/^([A-Gb#]+)(\d)$/)
  if (!m) return 60
  const pc = m[1].includes('b') ? ENHARMONICS[m[1]] ?? m[1] : m[1]
  return (parseInt(m[2]) + 1) * 12 + NOTE_NAMES.indexOf(pc)
}

function pitchMatch(played: string, target: string): boolean {
  if (played === target) return true
  const pp = played.replace(/\d+$/,''), tp = target.replace(/\d+$/,'')
  const po = played.match(/\d+$/)?.[0], to = target.match(/\d+$/)?.[0]
  return po === to && ENHARMONICS[tp] === pp
}

function buildQueue(notes: string[], length: number): string[] {
  const unique = [...new Set(notes)]
  const result: string[] = []
  while (result.length < length) {
    result.push(...[...unique].sort(() => Math.random() - 0.5))
  }
  const q = result.slice(0, length)
  for (let i = 1; i < q.length; i++) {
    if (q[i].replace(/\d+$/,'') === q[i-1].replace(/\d+$/,'')) {
      const j = Math.min(i + 1 + Math.floor(Math.random() * 3), q.length - 1)
      if (j > i) [q[i], q[j]] = [q[j], q[i]]
    }
  }
  return q
}

// Unused — `buildQueue` is retained for reference but the actual session
// builds a weighted pool (via buildWeightedPool) and then injects review
// questions to produce a tagged QueueEntry[]. Kept to avoid churning
// exports outside the file.
void buildQueue

// Shared audio pipeline (module-level, like PlayItCard2)
let sadStream: MediaStream | null = null
let sadCtx: AudioContext | null = null
let sadAnalyser: AnalyserNode | null = null
let sadDetector: SADPitchDetector | null = null
let sadBuf: Float32Array | null = null
let rafHandle = 0

function stopMic() {
  cancelAnimationFrame(rafHandle)
  sadStream?.getTracks().forEach(t => t.stop())
  sadStream = null
  sadCtx?.close().catch(() => {})
  sadCtx = null
  sadAnalyser = null
  sadDetector = null
}

type NoteStatus = 'listening' | 'correct' | 'wrong'

interface Props { params: Promise<{ moduleId: string }> }

export default function PlaySessionPage({ params }: Props) {
  const { moduleId } = use(params)
  const mod = getNRModule(moduleId)
  if (mod?.variant === 'intervallic') {
    return <IntervallicPlaySession moduleId={moduleId} />
  }
  if (mod?.variant === 'rhythmic') {
    return <RhythmicPlaySession moduleId={moduleId} />
  }
  return <StandardPlaySession moduleId={moduleId} />
}

function StandardPlaySession({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { hasSubscription, loading: purchasesLoading } = usePurchases(user?.id ?? null)
  const isPro = hasSubscription()
  const isLoading = authLoading || purchasesLoading

  const mod = getNRModule(moduleId)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [noteStatus, setNoteStatus] = useState<NoteStatus>('listening')
  const [detected, setDetected] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const [savedMp, setSavedMp] = useState<ReturnType<typeof recordNRPlaySession> | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [micReady, setMicReady] = useState(false)
  // Per-note tracking
  const noteResultsRef = useRef<Record<string, NoteResult>>({})
  const displayMissRef = useRef<Record<string, number>>({})
  const hadWrongThisNoteRef = useRef(false)
  // Review bookkeeping — mirrors identify/locate.
  const reviewHitsRef = useRef<{ answered: number; correct: number }>({ answered: 0, correct: 0 })
  const moduleAnsweredRef = useRef<number>(0)
  // Tracks the review-flag for the currently active question so the
  // tick-loop callback can branch on it without re-reading React state.
  const currentReviewRef = useRef<{ sourceModuleId: string } | null>(null)

  // Shared refs for RAF loop
  const targetRef = useRef('')
  const cardStartRef = useRef(0)
  const acceptStartRef = useRef(0)
  const doneNoteRef = useRef(false)
  const prevMidiRef = useRef(-1)
  const lastWrongRef = useRef(0)
  const qIdxRef = useRef(0)
  const correctRef = useRef(0)
  const responseTimesRef = useRef<number[]>([])
  const sessionDoneRef = useRef(false)

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
    const stats = getNoteStats(moduleId, 'play', store)
    const base = buildWeightedPool(mod.notes, stats, SESSION_LENGTH)
    const reviewPool = buildReviewPool(moduleId, 3)
    setQueue(injectReviewQuestions(base, reviewPool))
    qIdxRef.current = 0
    correctRef.current = 0
    responseTimesRef.current = []
    sessionDoneRef.current = false
    noteResultsRef.current = {}
    displayMissRef.current = {}
    hadWrongThisNoteRef.current = false
    reviewHitsRef.current = { answered: 0, correct: 0 }
    moduleAnsweredRef.current = 0
  }, [moduleId])

  // Start mic + begin session when queue is ready
  useEffect(() => {
    if (!queue.length || !mod) return

    async function init() {
      try {
        if (!sadStream || !sadStream.active || !sadStream.getTracks().every(t => t.readyState === 'live')) {
          sadStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          sadCtx = null; sadAnalyser = null; sadDetector = null
        }
        if (!sadCtx || sadCtx.state === 'closed') sadCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        if (sadCtx.state === 'suspended') await sadCtx.resume()
        if (!sadAnalyser) {
          const src = sadCtx.createMediaStreamSource(sadStream!)
          sadAnalyser = sadCtx.createAnalyser()
          sadAnalyser.fftSize = 4096
          src.connect(sadAnalyser)
          sadBuf = new Float32Array(4096)
          sadDetector = new SADPitchDetector(sadCtx.sampleRate)
        }
        setMicReady(true)
        startNote(queue[0], 0)
      } catch {
        setMicError('Microphone access denied. Please allow microphone access and reload.')
      }
    }

    init()
    return () => { stopMic() }
  }, [queue])

  function startNote(entry: QueueEntry, idx: number) {
    cancelAnimationFrame(rafHandle)
    targetRef.current = entry.pitch
    currentReviewRef.current = entry.review
    qIdxRef.current = idx
    cardStartRef.current = Date.now()
    acceptStartRef.current = 0
    doneNoteRef.current = false
    hadWrongThisNoteRef.current = false
    sadDetector?.clearVotes()
    setNoteStatus('listening')
    setDetected(null)
    setQIdx(idx)
    rafHandle = requestAnimationFrame(tick)
  }

  function tick() {
    if (!sadAnalyser || !sadBuf || !sadDetector || sessionDoneRef.current) return
    sadAnalyser.getFloatTimeDomainData(sadBuf as unknown as Float32Array<ArrayBuffer>)
    const now = Date.now()
    const timeOnCard = now - cardStartRef.current
    const target = targetRef.current
    const deadMs = DEAD_WINDOW_MS[target.replace(/[#b]/g, '')] ?? DEFAULT_DEAD_MS

    if (timeOnCard < deadMs) { rafHandle = requestAnimationFrame(tick); return }
    if (acceptStartRef.current === 0) acceptStartRef.current = now

    const result = sadDetector.update(sadBuf)
    if (result?.stable) {
      setDetected(result.name)
      const targetMidi = noteToMidi(target)
      const timeSinceAccept = now - acceptStartRef.current
      const isOctaveBleed =
        ((prevMidiRef.current >= 0 && (result.midi === prevMidiRef.current - 12 || result.midi === prevMidiRef.current + 12)) ||
         result.midi === targetMidi - 12 || result.midi === targetMidi + 12) &&
        timeSinceAccept < OCTAVE_BLEED_MS

      if (isOctaveBleed) { rafHandle = requestAnimationFrame(tick); return }

      if (pitchMatch(result.name, target)) {
        if (doneNoteRef.current) return
        doneNoteRef.current = true
        prevMidiRef.current = result.midi
        const responseMs = now - acceptStartRef.current
        const review = currentReviewRef.current
        const firstTry = !hadWrongThisNoteRef.current
        setNoteStatus('correct')

        if (review) {
          // Log retention; don't touch module accuracy or response-time bucket.
          recordRetention({
            sourceModuleId: review.sourceModuleId,
            pitch: target,
            correct: firstTry,
          })
          reviewHitsRef.current.answered++
          if (firstTry) reviewHitsRef.current.correct++
        } else {
          correctRef.current += 1
          responseTimesRef.current = [...responseTimesRef.current, responseMs]
          setCorrectCount(correctRef.current)
          setResponseTimes([...responseTimesRef.current])
          moduleAnsweredRef.current++
          if (!noteResultsRef.current[target]) noteResultsRef.current[target] = { attempts: 0, correct: 0, responseMsTotal: 0 }
          noteResultsRef.current[target].attempts++
          noteResultsRef.current[target].correct += firstTry ? 1 : 0
          noteResultsRef.current[target].responseMsTotal = (noteResultsRef.current[target].responseMsTotal ?? 0) + responseMs
        }

        setTimeout(() => advanceNote(), 200)
        return
      } else {
        const semDist = Math.abs(result.midi - noteToMidi(target))
        const isOctOfPrev = prevMidiRef.current >= 0 &&
          (result.midi === prevMidiRef.current + 12 || result.midi === prevMidiRef.current - 12)
        if (semDist <= WRONG_SEMITONE_RANGE && !isOctOfPrev && now - lastWrongRef.current > WRONG_COOLDOWN_MS) {
          hadWrongThisNoteRef.current = true
          setNoteStatus('wrong')
          lastWrongRef.current = now
          // Only record the wrong-note tally when this isn't a review
          // question — review misses stay in the retention log instead.
          if (!currentReviewRef.current) {
            const pc = target.replace(/\d+$/,'')
            displayMissRef.current[pc] = (displayMissRef.current[pc] ?? 0) + 1
          }
        }
      }
    }

    if (!doneNoteRef.current) rafHandle = requestAnimationFrame(tick)
  }

  function advanceNote() {
    const next = qIdxRef.current + 1
    if (next >= queue.length) {
      sessionDoneRef.current = true
      cancelAnimationFrame(rafHandle)
      setDone(true)
    } else {
      startNote(queue[next], next)
    }
  }

  useEffect(() => {
    if (!done || !mod) return
    // Accuracy + avg-response denominators use module-question counts only —
    // review answers are excluded so they don't skew mastery.
    const moduleAnswered = moduleAnsweredRef.current > 0 ? moduleAnsweredRef.current : 1
    const accuracy = correctRef.current / moduleAnswered
    const avgMs = responseTimesRef.current.length > 0
      ? responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
      : 9999
    const mp = recordNRPlaySession(moduleId, accuracy, avgMs, noteResultsRef.current)
    setSavedMp(mp)
  }, [done])

  if (!mod) return null

  const currentEntry = queue[qIdx]
  const currentPitch = currentEntry?.pitch ?? ''
  const currentReview = currentEntry?.review ?? null
  const avgResponseSec = responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000).toFixed(1)
    : '—'
  const bgColor = noteStatus === 'correct' ? '#EAF3DE' : noteStatus === 'wrong' ? '#FFF0F0' : 'white'
  const borderColor = noteStatus === 'correct' ? '#C0DD97' : noteStatus === 'wrong' ? '#F09595' : '#D9CFAE'

  // ── Summary ─────────────────────────────────────────────────────────────────
  if (done && savedMp) {
    const moduleAnsweredDenom = moduleAnsweredRef.current > 0 ? moduleAnsweredRef.current : 1
    const accuracy = correctRef.current / moduleAnsweredDenom
    const pct = Math.round(accuracy * 100)
    const avgMs = responseTimesRef.current.length > 0
      ? responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length
      : null
    const missedNotes = Object.entries(displayMissRef.current).sort((a, b) => b[1] - a[1]).map(([n]) => n)
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
      noteResultsRef.current = {}; displayMissRef.current = {}
      prevMidiRef.current = -1; sessionDoneRef.current = false
      correctRef.current = 0; responseTimesRef.current = []
      reviewHitsRef.current = { answered: 0, correct: 0 }
      moduleAnsweredRef.current = 0
      const store = loadNRProgress()
      const stats = getNoteStats(moduleId, 'play', store)
      const base = buildWeightedPool(mod!.notes, stats, SESSION_LENGTH)
      const reviewPool = buildReviewPool(moduleId, 3)
      const tagged = injectReviewQuestions(base, reviewPool)
      setQueue(tagged)
      setTimeout(() => startNote(tagged[0], 0), 50)
    }

    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#ECE3CC', borderRadius: '20px', border: '1px solid #D9CFAE', padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>
            Session Complete
          </p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#2A2318', marginBottom: '28px' }}>
            Staff Recognition
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 300, color: passedAcc ? '#3B6D11' : '#2A2318', margin: 0 }}>{pct}%</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Accuracy</p>
            </div>
            {avgMs !== null && (
              <div>
                <p style={{ fontFamily: SERIF, fontSize: '36px', fontWeight: 300, color: passedMs ? '#3B6D11' : '#2A2318', margin: 0 }}>{(avgMs/1000).toFixed(1)}s</p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>Avg Response</p>
              </div>
            )}
          </div>

          {missedNotes.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#FCEBEB', border: '1px solid #F09595', borderRadius: '10px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#A32D2D', letterSpacing: '0.06em', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>Missed</p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#A32D2D', margin: 0 }}>{missedNotes.join(', ')}</p>
            </div>
          )}

          {reviewHitsRef.current.answered > 0 && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#F7F3E8', border: '1px solid #E4DDC7', borderRadius: '10px', textAlign: 'left' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.06em', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>
                Review from earlier modules
              </p>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#2A2318', margin: 0 }}>
                {reviewHitsRef.current.correct} of {reviewHitsRef.current.answered} played right
              </p>
            </div>
          )}

          <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#EDE8DF', borderRadius: '10px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: passedSession ? '#3B6D11' : '#A32D2D', margin: '0 0 4px', fontWeight: 500 }}>
              {passedSession
                ? '✓ Counted toward mastery'
                : !passedAcc
                  ? `Session didn't count — need ${Math.round(threshold * 100)}% accuracy`
                  : `Great accuracy — but your average was ${avgMs !== null ? (avgMs / 1000).toFixed(1) : '?'}s. Need under ${msThreshold ? (msThreshold / 1000).toFixed(1) : '?'}s for this to count.`}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedMp.completed && nextModule ? (
              <button
                onClick={() => router.push(`/programs/note-reading/${nextModule.id}`)}
                style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, cursor: 'pointer' }}
              >
                Next Module →
              </button>
            ) : null}
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
                savedMp.completed
                  ? router.push('/programs/note-reading')
                  : router.push(`/programs/note-reading/${moduleId}`)
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

  // ── Session screen ───────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100dvh', overflow: 'hidden', background: '#F2EDDF', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', flexShrink: 0 }}>
        <button onClick={() => { stopMic(); router.push(`/programs/note-reading/${moduleId}`) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: currentReview ? '#B5402A' : '#7A7060', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            {currentReview
              ? `Review · from ${NOTE_READING_MODULES.find(m => m.id === currentReview.sourceModuleId)?.title ?? 'earlier module'}`
              : `${mod.title} · Play It`}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', margin: 0 }}>{qIdx + 1} / {queue.length || SESSION_LENGTH}</p>
          {responseTimes.length > 0 && (
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', margin: 0 }}>avg {avgResponseSec}s</p>
          )}
        </div>
      </div>

      <div style={{ height: '2px', background: '#EDE8DF', flexShrink: 0 }}>
        <div style={{ height: '100%', background: '#1A1A18', width: `${queue.length ? (qIdx / queue.length) * 100 : 0}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px,2vh,20px) 16px' }}>
        {micError ? (
          // Friendly no-mic fallback — Play It listens through the mic (not
          // MIDI), so a denied permission is a blocker. Offer a clear recovery
          // path instead of a raw error string.
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
              Play It uses your microphone to listen for the note you play on your piano. Allow mic access in your browser&apos;s address bar, then reload this page.
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
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: 'clamp(8px,1.5vh,20px)' }}>
                {noteStatus === 'correct' ? '✓ Correct' : 'Play this note'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(8px,1.5vh,20px)' }}>
                {mod.clef === 'grand'
                  ? <GrandStaffCard note={currentPitch} />
                  : <StaffCard note={currentPitch} clef={mod.clef} />
                }
              </div>

              <div style={{ minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {noteStatus === 'listening' && (
                  <>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#B5402A', animation: 'pulse 1s infinite' }} />
                    <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
                      {detected ? `Hearing: ${detected}` : 'Play the note…'}
                    </span>
                  </>
                )}
                {noteStatus === 'wrong' && detected && (
                  <span style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#A32D2D' }}>
                    ✗ That's {detected} — try {currentPitch.replace(/\d+$/, '')}
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
