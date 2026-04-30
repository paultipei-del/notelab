'use client'

import { useState, useEffect, useRef } from 'react'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import { SADPitchDetector } from '@/lib/sadDetector'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

// C2–C6 chromatic
const ALL_NOTES: string[] = []
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
for (let oct = 2; oct <= 6; oct++) {
  for (const n of NOTE_NAMES) {
    const note = n + oct
    if (note === 'C2') ALL_NOTES.push(note)
    else if (note === 'C6') { ALL_NOTES.push(note); break }
    else ALL_NOTES.push(note)
  }
  if (oct === 6) break
}

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

function buildQueue(length: number): string[] {
  const result: string[] = []
  while (result.length < length) {
    result.push(...[...ALL_NOTES].sort(() => Math.random() - 0.5))
  }
  return result.slice(0, length)
}

const DEAD_WINDOW_MS: Record<string, number> = { 'C5': 1200, 'B4': 900, 'C4': 900, 'B3': 900 }
const DEFAULT_DEAD_MS = 600
const WRONG_COOLDOWN_MS = 1000
const OCTAVE_BLEED_MS = 600
const WRONG_SEMITONE_RANGE = 25
const SESSION_LENGTH = 10

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
  sadCtx = null; sadAnalyser = null; sadDetector = null
}

type NoteStatus = 'listening' | 'correct' | 'wrong'

export default function TestPage() {
  const [queue, setQueue] = useState<string[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [noteStatus, setNoteStatus] = useState<NoteStatus>('listening')
  const [detected, setDetected] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [micReady, setMicReady] = useState(false)

  const targetRef = useRef('')
  const cardStartRef = useRef(0)
  const acceptStartRef = useRef(0)
  const doneNoteRef = useRef(false)
  const prevMidiRef = useRef(-1)
  const lastWrongRef = useRef(0)
  const qIdxRef = useRef(0)
  const correctRef = useRef(0)
  const sessionDoneRef = useRef(false)

  useEffect(() => {
    const q = buildQueue(SESSION_LENGTH)
    setQueue(q)
    return () => stopMic()
  }, [])

  useEffect(() => {
    if (!queue.length) return

    async function init() {
      try {
        if (!sadStream || !sadStream.active || !sadStream.getTracks().every(t => t.readyState === 'live')) {
          sadStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          sadCtx = null; sadAnalyser = null; sadDetector = null
        }
        if (!sadCtx || sadCtx.state === 'closed') sadCtx = new AudioContext()
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
    return () => stopMic()
  }, [queue])

  function startNote(pitch: string, idx: number) {
    cancelAnimationFrame(rafHandle)
    targetRef.current = pitch
    qIdxRef.current = idx
    cardStartRef.current = Date.now()
    acceptStartRef.current = 0
    doneNoteRef.current = false
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
        correctRef.current += 1
        setCorrectCount(correctRef.current)
        setNoteStatus('correct')
        setTimeout(() => advanceNote(), 200)
        return
      } else {
        const semDist = Math.abs(result.midi - noteToMidi(target))
        const isOctOfPrev = prevMidiRef.current >= 0 &&
          (result.midi === prevMidiRef.current + 12 || result.midi === prevMidiRef.current - 12)
        if (semDist <= WRONG_SEMITONE_RANGE && !isOctOfPrev && now - lastWrongRef.current > WRONG_COOLDOWN_MS) {
          setNoteStatus('wrong')
          lastWrongRef.current = now
        }
      }
    }
    if (!doneNoteRef.current) rafHandle = requestAnimationFrame(tick)
  }

  function advanceNote() {
    const next = qIdxRef.current + 1
    if (next >= SESSION_LENGTH) {
      sessionDoneRef.current = true
      cancelAnimationFrame(rafHandle)
      setDone(true)
    } else {
      startNote(queue[next], next)
    }
  }

  function restart() {
    stopMic()
    setDone(false); setQIdx(0); setCorrectCount(0)
    setNoteStatus('listening'); setDetected(null)
    prevMidiRef.current = -1; sessionDoneRef.current = false
    correctRef.current = 0; setMicReady(false)
    const q = buildQueue(SESSION_LENGTH)
    setQueue([])
    setTimeout(() => setQueue(q), 50)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#ECE3CC', borderRadius: '20px', border: '1px solid #D9CFAE', padding: '48px 40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#7A7060', marginBottom: '6px' }}>Done</p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '40px', color: '#2A2318', marginBottom: '24px' }}>
            {correctRef.current} / {SESSION_LENGTH}
          </h2>
          <button onClick={restart} style={{ background: '#1A1A18', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  const currentPitch = queue[qIdx] ?? ''
  const bgColor = noteStatus === 'correct' ? '#EAF3DE' : noteStatus === 'wrong' ? '#FFF0F0' : 'white'
  const borderColor = noteStatus === 'correct' ? '#C0DD97' : noteStatus === 'wrong' ? '#F09595' : '#D9CFAE'

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '16px' }}>
      <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        Test — C2–C6 chromatic
      </p>

      {micError && (
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B5402A' }}>{micError}</p>
      )}

      {currentPitch && (
        <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '24px', transition: 'background 0.15s, border-color 0.15s', width: '100%', maxWidth: '480px' }}>
          <GrandStaffCard note={currentPitch} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
          {qIdx + 1} / {SESSION_LENGTH}
        </p>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060' }}>
          Correct: {correctCount}
        </p>
        {detected && (
          <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: noteStatus === 'correct' ? '#3B6D11' : noteStatus === 'wrong' ? '#B5402A' : '#7A7060' }}>
            Heard: {detected}
          </p>
        )}
      </div>

      {!micReady && !micError && (
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>Starting mic…</p>
      )}
    </div>
  )
}
