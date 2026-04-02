'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SADPitchDetector } from '@/lib/sadDetector'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import { noteToPitchClass } from '@/lib/noteDetector'
import type { QueueCard } from '@/lib/types'

// ── Constants (confirmed from Note Rush Assembly-CSharp source) ───────────
const MIN_TIME_ON_CARD_MS = 800    // MinTimeOnCurrentNote = 0.5s + buffer
const WRONG_FRAMES_REQUIRED = 20   // IncorrectNoteRepsRequired = 20
const WRONG_COOLDOWN_MS = 1000     // 1s between wrong answer calls
const WRONG_SEMITONE_RANGE = 25    // must be within 25 semitones of target

// ── Shared mic state (persists across cards) ──────────────────────────────
let sadStream: MediaStream | null = null
let sadCtx: AudioContext | null = null
let sadAnalyser: AnalyserNode | null = null
let sadDetector: SADPitchDetector | null = null
let sadBuf: Float32Array | null = null

// ── Per-card state ────────────────────────────────────────────────────────
let cardStartTime = 0
let cardHadWrong = false
let wrongFrameCount = 0
let lastWrongTime = 0
let prevMidi = -1

// ── Helpers ───────────────────────────────────────────────────────────────
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
function noteToMidi(name: string): number {
  const m = name.match(/^([A-G]#?)(\d)$/)
  if (!m) return 60
  return (parseInt(m[2]) + 1) * 12 + NOTE_NAMES.indexOf(m[1])
}

const ENHARMONICS: Record<string, string> = {
  'C#':'Db','Db':'C#','D#':'Eb','Eb':'D#',
  'F#':'Gb','Gb':'F#','G#':'Ab','Ab':'G#','A#':'Bb','Bb':'A#',
}

function pitchMatch(played: string, target: string): boolean {
  if (played === target) return true
  const pp = played.replace(/\d+$/, ''), tp = target.replace(/\d+$/, '')
  const po = played.match(/\d+$/)?.[0], to = target.match(/\d+$/)?.[0]
  return po === to && ENHARMONICS[tp] === pp
}

// ── Component ─────────────────────────────────────────────────────────────
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
  const rafRef = useRef(0)

  const targetNote = card.note ?? ''
  const stopLoop = useCallback(() => cancelAnimationFrame(rafRef.current), [])

  useEffect(() => {
    // ── Reset per-card state ──────────────────────────────────────────────
    doneRef.current = false
    cardHadWrong = false
    wrongFrameCount = 0
    cardStartTime = 0  // will be set after dead window
    setStatus('starting')
    setDetected(null)

    async function init() {
      try {
        // ── Ensure mic stream is alive ──────────────────────────────────
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

        // ── Hard flush: reset detector completely ─────────────────────
        // This clears circular buffers, filter state, and detection window
        sadDetector!.reset()

        // ── Dead window: exactly like Note Rush's MinTimeOnCurrentNote ─
        // Do NOT run detector during this period — just drain the analyser
        setStatus('listening')
        const DEAD_WINDOW_MS = 800
        const deadEnd = Date.now() + DEAD_WINDOW_MS

        function drainAndWait() {
          if (Date.now() < deadEnd) {
            // Drain the analyser buffer to prevent buildup of old audio
            if (sadBuf && sadAnalyser) {
              sadAnalyser.getFloatTimeDomainData(sadBuf as unknown as Float32Array<ArrayBuffer>)
            }
            rafRef.current = requestAnimationFrame(drainAndWait)
            return
          }
          // Dead window over — flush detector one final time then start
          sadDetector!.reset()
          cardStartTime = Date.now()
          rafRef.current = requestAnimationFrame(tick)
        }

        function tick() {
          if (!sadAnalyser || !sadBuf || !sadDetector || doneRef.current) return
          sadAnalyser.getFloatTimeDomainData(sadBuf as unknown as Float32Array<ArrayBuffer>)
          const result = sadDetector.update(sadBuf)

          if (result?.stable) {
            setDetected(result.name)

            if (pitchMatch(result.name, targetNote)) {
              // ── Correct note ──────────────────────────────────────────
              if (doneRef.current) return
              doneRef.current = true
              prevMidi = result.midi
              setStatus('correct')
              stopLoop()
              setTimeout(() => onCorrect(!cardHadWrong), 200)
              return
            } else {
              // ── Wrong note ────────────────────────────────────────────
              wrongFrameCount++
              const now = Date.now()
              const timeOnCard = now - cardStartTime
              const detMidi = result.midi
              const tgtMidi = noteToMidi(targetNote)
              const semDist = Math.abs(detMidi - tgtMidi)
              const isOctaveOfPrev = prevMidi >= 0 &&
                (detMidi === prevMidi + 12 || detMidi === prevMidi - 12)
              const cooldownOk = now - lastWrongTime > WRONG_COOLDOWN_MS

              if (
                wrongFrameCount >= WRONG_FRAMES_REQUIRED &&
                timeOnCard >= MIN_TIME_ON_CARD_MS &&
                semDist <= WRONG_SEMITONE_RANGE &&
                !isOctaveOfPrev &&
                cooldownOk
              ) {
                setStatus('wrong')
                cardHadWrong = true
                lastWrongTime = now
                wrongFrameCount = 0
                onWrong()
              }
            }
          } else {
            // No stable detection — reset wrong counter
            wrongFrameCount = 0
          }

          rafRef.current = requestAnimationFrame(tick)
        }

        drainAndWait()

      } catch(e: any) {
        setError('Mic access denied.')
        setStatus('listening')
      }
    }

    stopLoop()
    init()
    return () => stopLoop()
  }, [card.id])

  const bgColor = status === 'correct' ? '#EAF3DE' : status === 'wrong' ? '#FCEBEB' : 'white'
  const borderColor = status === 'correct' ? '#7EC86E' : status === 'wrong' ? '#F09595' : '#D3D1C7'

  return (
    <div style={{ background: bgColor, border: '1px solid ' + borderColor, borderRadius: '20px', padding: '40px 32px', transition: 'all 0.15s', textAlign: 'center' as const }}>
      <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '11px', fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '24px' }}>
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
        <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', fontWeight: 300, color: status === 'wrong' ? '#E53935' : '#888780' }}>
          {status === 'wrong' ? `Heard: ${detected} — try ${targetNote}` : `Heard: ${detected}`}
        </p>
      )}
      {error && <p style={{ fontFamily: 'var(--font-jost), sans-serif', fontSize: '13px', color: '#E53935' }}>{error}</p>}
    </div>
  )
}
