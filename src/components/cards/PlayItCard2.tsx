'use client'

import { useState, useEffect, useRef } from 'react'
import { SADPitchDetector } from '@/lib/sadDetector'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import { noteToPitchClass } from '@/lib/noteDetector'
import type { QueueCard } from '@/lib/types'

// ── Note Rush confirmed constants ─────────────────────────────────────────
const MIN_TIME_ON_CARD_MS = 600
const NOTE_DEAD_WINDOWS: Record<string, number> = {
  'C5': 1200, 'B4': 900, 'C4': 900, 'B3': 900,
}
function deadWindowForNote(note: string): number {
  return NOTE_DEAD_WINDOWS[note.replace(/[#b]/g, '')] ?? MIN_TIME_ON_CARD_MS
}
const WRONG_FRAMES_REQUIRED = 20
const WRONG_COOLDOWN_MS = 1000
const OCTAVE_BLEED_FILTER_MS = 600
const WRONG_SEMITONE_RANGE = 25

// ── Diagnostic types ──────────────────────────────────────────────────────
interface FrameLog {
  t: number          // ms since card start
  hz: number
  midi: number
  cents: number      // deviation from integer midi
  pts: number        // points awarded this frame
  totalPts: number   // running total for current note
  peak: number       // peak amplitude
  inDeadWindow: boolean
  stable: boolean
}

interface DecisionLog {
  t: number
  detected: string
  detectedMidi: number
  target: string
  targetMidi: number
  outcome: 'correct' | 'wrong' | 'octave-bleed' | 'cooldown' | 'range'
  timeSinceCardStart: number
  timeSinceDeadWindow: number
}

interface CardLog {
  cardNote: string
  clef: string
  cardShownAt: number
  resolvedAt: number | null
  outcome: 'correct-first' | 'correct-retry' | 'abandoned'
  totalFrames: number
  stableFrames: number
  falseDetections: DecisionLog[]
  correctDecision: DecisionLog | null
  frames: FrameLog[]
}

interface SessionLog {
  startedAt: string
  cards: CardLog[]
}

// ── Diagnostic mode — persists across card remounts ─────────────────────
let diagEnabledGlobal = false

// ── Shared audio pipeline ─────────────────────────────────────────────────
let sadStream: MediaStream | null = null

export function stopMic() {
  cancelAnimationFrame(rafHandle)
  if (sadStream) {
    sadStream.getTracks().forEach(t => t.stop())
    sadStream = null
  }
  if (sadCtx) {
    sadCtx.close().catch(() => {})
    sadCtx = null
  }
  sadAnalyser = null
  sadDetector = null
}
let sadCtx: AudioContext | null = null
let sadAnalyser: AnalyserNode | null = null
let sadDetector: SADPitchDetector | null = null
let sadBuf: Float32Array | null = null
let rafHandle = 0

// ── Per-card state ────────────────────────────────────────────────────────
let cardStartTime = 0
let cardHadWrong = false
let wrongFrameCount = 0
let lastWrongTime = 0
let prevMidi = -1

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
function noteToMidi(name: string): number {
  const m = name.match(/^([A-G]#?)(\d)$/)
  if (!m) return 60
  return (parseInt(m[2]) + 1) * 12 + NOTE_NAMES.indexOf(m[1])
}

const ENHARMONICS: Record<string,string> = {
  'C#':'Db','Db':'C#','D#':'Eb','Eb':'D#',
  'F#':'Gb','Gb':'F#','G#':'Ab','Ab':'G#','A#':'Bb','Bb':'A#',
}

function pitchMatch(played: string, target: string): boolean {
  if (played === target) return true
  const pp = played.replace(/\d+$/,''), tp = target.replace(/\d+$/,'')
  const po = played.match(/\d+$/)?.[0], to = target.match(/\d+$/)?.[0]
  return po === to && ENHARMONICS[tp] === pp
}

function peakAmplitude(buf: Float32Array): number {
  let peak = 0
  for (let i = 0; i < buf.length; i++) {
    const a = Math.abs(buf[i])
    if (a > peak) peak = a
  }
  return peak
}

interface Props {
  card: QueueCard
  onCorrect: (firstTry: boolean) => void
  onWrong: () => void
}

type Status = 'starting' | 'listening' | 'correct' | 'wrong'

export default function PlayItCard2({ card, onCorrect, onWrong }: Props) {
  const [status, setStatus] = useState<Status>('starting')
  const [detected, setDetected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const doneRef = useRef(false)
  const targetNoteRef = useRef(card.note ?? '')
  const acceptStartRef = useRef(0)

  // ── Diagnostic ────────────────────────────────────────────────────────
  const diagMode = typeof window !== 'undefined' && window.location.search.includes('dev=true')
  const diagModeRef = useRef(diagMode)
  const sessionLogRef = useRef<SessionLog>({ startedAt: new Date().toISOString(), cards: [] })
  const currentCardLogRef = useRef<CardLog | null>(null)
  const [diagEnabled, setDiagEnabled] = useState(diagEnabledGlobal)
  const [frameCount, setFrameCount] = useState(0)
  const [stableCount, setStableCount] = useState(0)
  const frameCountRef = useRef(0)
  const stableCountRef = useRef(0)

  function startCardLog() {
    console.log('DIAG startCardLog called, diagMode=', diagModeRef.current)
    if (!diagModeRef.current) return
    currentCardLogRef.current = {
      cardNote: card.note ?? '',
      clef: card.clef ?? '',
      cardShownAt: Date.now(),
      resolvedAt: null,
      outcome: 'abandoned',
      totalFrames: 0,
      stableFrames: 0,
      falseDetections: [],
      correctDecision: null,
      frames: [],
    }
    frameCountRef.current = 0
    stableCountRef.current = 0
  }

  function endCardLog(outcome: CardLog['outcome']) {
    console.log('DIAG endCardLog', outcome, 'diagMode=', diagModeRef.current, 'cardLog=', !!currentCardLogRef.current)
    if (!diagModeRef.current || !currentCardLogRef.current) return
    const c = currentCardLogRef.current
    c.resolvedAt = Date.now()
    c.outcome = outcome
    c.totalFrames = frameCountRef.current
    c.stableFrames = stableCountRef.current
    sessionLogRef.current.cards.push({ ...c })
    currentCardLogRef.current = null
  }

  function exportLog() {
    const json = JSON.stringify(sessionLogRef.current, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notelab-diagnostic-' + new Date().toISOString().slice(0,19).replace(/:/g,'-') + '.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    targetNoteRef.current = card.note ?? ''
    doneRef.current = false
    acceptStartRef.current = 0
    cardHadWrong = false
    wrongFrameCount = 0
    cardStartTime = Date.now()
    setStatus('starting')
    setDetected(null)
    startCardLog()

    async function init() {
      try {
        if (!sadStream || !sadStream.active || !sadStream.getTracks().every(t => t.readyState === 'live')) {
          sadStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          sadCtx = null; sadAnalyser = null; sadDetector = null
        }
        if (!sadCtx || sadCtx.state === 'closed') sadCtx = new AudioContext()
        if (sadCtx.state === 'suspended') await sadCtx.resume()

        if (!sadAnalyser) {
          const source = sadCtx.createMediaStreamSource(sadStream!)
          sadAnalyser = sadCtx.createAnalyser()
          sadAnalyser.fftSize = 4096
          source.connect(sadAnalyser)
          sadBuf = new Float32Array(4096)
          sadDetector = new SADPitchDetector(sadCtx.sampleRate)
        }

        sadDetector!.clearVotes()
        cardStartTime = Date.now()
        setStatus('listening')
        cancelAnimationFrame(rafHandle)
        rafHandle = requestAnimationFrame(tick)

      } catch(e: any) {
        setError('Mic access denied.')
        setStatus('listening')
      }
    }

    init()
    return () => {
      doneRef.current = true
      // Only mark abandoned if not already resolved by correct/wrong detection
      if (currentCardLogRef.current) endCardLog('abandoned')
    }
  }, [card.id])

  function tick() {
    if (!sadAnalyser || !sadBuf || !sadDetector || doneRef.current) return
    sadAnalyser.getFloatTimeDomainData(sadBuf as unknown as Float32Array<ArrayBuffer>)
    const now = Date.now()
    const timeOnCard = now - cardStartTime
    const inDeadWindow = timeOnCard < deadWindowForNote(targetNoteRef.current)

    if (inDeadWindow) {
      if (diagModeRef.current) {
        frameCountRef.current++
        setFrameCount(frameCountRef.current)
      }
      rafHandle = requestAnimationFrame(tick)
      return
    }

    if (acceptStartRef.current === 0) acceptStartRef.current = now

    const result = sadDetector.update(sadBuf)

    if (diagEnabled) {
      frameCountRef.current++
      setFrameCount(frameCountRef.current)
      if (result) {
        stableCountRef.current++
        setStableCount(stableCountRef.current)
        if (currentCardLogRef.current) {
          const frameLog: FrameLog = {
            t: timeOnCard,
            hz: result.freq,
            midi: result.midi,
            cents: Math.abs(result.midi - Math.round(result.midi)) * 100,
            pts: 0, // SAD detector doesn't expose per-frame pts externally
            totalPts: 0,
            peak: peakAmplitude(sadBuf),
            inDeadWindow: false,
            stable: result.stable,
          }
          currentCardLogRef.current.frames.push(frameLog)
        }
      }
    }

    if (result?.stable) {
      setDetected(result.name)
      const target = targetNoteRef.current
      const timeSinceAccept = now - acceptStartRef.current
      const targetMidiVal = noteToMidi(target)

      const isOctaveBleed = (
        (prevMidi >= 0 && (result.midi === prevMidi - 12 || result.midi === prevMidi + 12)) ||
        (result.midi === targetMidiVal - 12 || result.midi === targetMidiVal + 12)
      ) && timeSinceAccept < OCTAVE_BLEED_FILTER_MS

      if (isOctaveBleed) {
        if (diagModeRef.current && currentCardLogRef.current) {
          currentCardLogRef.current.falseDetections.push({
            t: timeOnCard, detected: result.name, detectedMidi: result.midi,
            target, targetMidi: targetMidiVal, outcome: 'octave-bleed',
            timeSinceCardStart: timeOnCard, timeSinceDeadWindow: timeSinceAccept,
          })
        }
        rafHandle = requestAnimationFrame(tick)
        return
      }

      if (pitchMatch(result.name, target)) {
        if (doneRef.current) return
        doneRef.current = true
        prevMidi = result.midi
        setStatus('correct')
        if (diagModeRef.current && currentCardLogRef.current) {
          currentCardLogRef.current.correctDecision = {
            t: timeOnCard, detected: result.name, detectedMidi: result.midi,
            target, targetMidi: targetMidiVal, outcome: 'correct',
            timeSinceCardStart: timeOnCard, timeSinceDeadWindow: timeSinceAccept,
          }
          endCardLog(cardHadWrong ? 'correct-retry' : 'correct-first')
        }
        setTimeout(() => onCorrect(!cardHadWrong), 200)
        return
      } else {
        const detMidi = result.midi
        const tgtMidi = noteToMidi(target)
        const semDist = Math.abs(detMidi - tgtMidi)
        const isOctaveOfPrev = prevMidi >= 0 &&
          (detMidi === prevMidi + 12 || detMidi === prevMidi - 12)
        const cooldownOk = now - lastWrongTime > WRONG_COOLDOWN_MS

        if (diagModeRef.current && currentCardLogRef.current) {
          const outcome = !cooldownOk ? 'cooldown' : semDist > WRONG_SEMITONE_RANGE ? 'range' : 'wrong'
          currentCardLogRef.current.falseDetections.push({
            t: timeOnCard, detected: result.name, detectedMidi: result.midi,
            target, targetMidi: tgtMidi, outcome,
            timeSinceCardStart: timeOnCard, timeSinceDeadWindow: timeSinceAccept,
          })
        }

        if (semDist <= WRONG_SEMITONE_RANGE && !isOctaveOfPrev && cooldownOk) {
          setStatus('wrong')
          cardHadWrong = true
          lastWrongTime = now
          onWrong()
        }
      }
    }

    rafHandle = requestAnimationFrame(tick)
  }

  const bgColor = status === 'correct' ? '#EAF3DE' : status === 'wrong' ? '#FCEBEB' : 'white'
  const borderColor = status === 'correct' ? '#7EC86E' : status === 'wrong' ? '#F09595' : '#DDD8CA'
  const F = 'var(--font-jost), sans-serif'

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ background: bgColor, border: '1px solid ' + borderColor, borderRadius: '20px', padding: '40px 32px', transition: 'all 0.15s', textAlign: 'center' as const }}>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '24px' }}>
          {status === 'starting' ? 'Starting mic…' : status === 'correct' ? '✓ Correct' : 'Play this note'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          {card.note && card.clef
            ? card.clef === 'grand'
              ? <GrandStaffCard note={card.note} />
              : <StaffCard note={card.note} clef={card.clef} />
            : null}
        </div>
        {detected && status !== 'correct' && (
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: status === 'wrong' ? '#E53935' : '#7A7060' }}>
            {status === 'wrong' ? `Heard: ${detected} — try ${targetNoteRef.current}` : `Heard: ${detected}`}
          </p>
        )}
        {error && <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#E53935' }}>{error}</p>}
      </div>

      {/* ── Diagnostic overlay ── */}
      {diagMode && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 999,
          background: '#1A1A18', color: 'white', borderRadius: '12px',
          padding: '12px 16px', fontFamily: F, fontSize: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minWidth: '200px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Diagnostic</span>
            <button
              onClick={() => { diagEnabledGlobal = !diagEnabledGlobal; setDiagEnabled(diagEnabledGlobal) }}
              style={{
                background: diagEnabled ? '#4CAF50' : '#555', border: 'none', borderRadius: '6px',
                color: 'white', padding: '2px 8px', cursor: 'pointer', fontSize: '11px',
              }}
            >
              {diagEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {diagEnabled && (
            <>
              <div style={{ color: '#aaa', marginBottom: '4px' }}>Target: <span style={{ color: 'white' }}>{targetNoteRef.current}</span></div>
              <div style={{ color: '#aaa', marginBottom: '4px' }}>Detected: <span style={{ color: '#4CAF50' }}>{detected ?? '—'}</span></div>
              <div style={{ color: '#aaa', marginBottom: '4px' }}>Frames: <span style={{ color: 'white' }}>{frameCount}</span></div>
              <div style={{ color: '#aaa', marginBottom: '4px' }}>Stable: <span style={{ color: 'white' }}>{stableCount}</span></div>
              <div style={{ color: '#aaa', marginBottom: '8px' }}>Cards: <span style={{ color: 'white' }}>{sessionLogRef.current.cards.length}</span></div>
              <button
                onClick={exportLog}
                style={{
                  width: '100%', background: '#B5402A', border: 'none', borderRadius: '6px',
                  color: 'white', padding: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 500,
                }}
              >
                Export JSON
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
