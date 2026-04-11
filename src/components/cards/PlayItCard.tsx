'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QueueCard } from '@/lib/types'
import StaffCard from './StaffCard'
import GrandStaffCard from './GrandStaffCard'
import { NoteDetector, noteToPitchClass } from '@/lib/noteDetector'

interface PlayItCardProps {
  card: QueueCard
  onCorrect: (firstTry: boolean) => void
  onWrong: () => void
}

type Status = 'starting' | 'listening' | 'correct' | 'wrong'

const DATA_SIZE = 4096  // single buffer size for all notes

const ENHARMONICS: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
}

function pitchMatches(played: string, target: string): boolean {
  if (played === target) return true
  return ENHARMONICS[target] === played
}

// Full note matching including octave e.g. 'D#4' matches 'Eb4'
function pitchMatchesFull(played: string, target: string): boolean {
  if (played === target) return true
  const playedClass = played.replace(/\d+$/, '')
  const targetClass = target.replace(/\d+$/, '')
  const playedOctave = played.match(/\d+$/)?.[0]
  const targetOctave = target.match(/\d+$/)?.[0]
  if (playedOctave !== targetOctave) return false
  return ENHARMONICS[targetClass] === playedClass
}



// Track ALL streams and contexts ever created so we can stop them all
const allStreams: MediaStream[] = []
const allContexts: AudioContext[] = []
let cardReadyAt = 0  // timestamp after which wrong answers count
let cardHadWrong = false  // tracks if current card had a wrong attempt
let sharedStream: MediaStream | null = null
let sharedCtx: AudioContext | null = null
let sharedAnalyser: AnalyserNode | null = null
let sharedDetector: NoteDetector | null = null

export function stopMic() {
  allStreams.forEach(s => s.getTracks().forEach(t => t.stop()))
  allStreams.length = 0
  allContexts.forEach(ctx => ctx.close().catch(() => {}))
  allContexts.length = 0
}

export default function PlayItCard({ card, onCorrect, onWrong }: PlayItCardProps) {
  const [status, setStatus] = useState<Status>('starting')
  const [detected, setDetected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  const animRef    = useRef<number | null>(null)
  const detectorRef = useRef<NoteDetector | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef2 = useRef<AnalyserNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef   = useRef<MediaStreamAudioSourceNode | null>(null)
  const bufRef     = useRef<Float32Array<ArrayBuffer>>(new Float32Array(DATA_SIZE) as Float32Array<ArrayBuffer>)
  const doneRef    = useRef(false)

  const targetNote = card.note ?? ''  // full note e.g. 'D5'
  const targetPitch = noteToPitchClass(targetNote)  // pitch class e.g. 'D' (kept for display)

  // Stop mic when Play It mode is exited entirely
  useEffect(() => {
    return () => {
      stopMic()
    }
  }, [])

  function stopLoop() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    if (sourceRef.current) { try { sourceRef.current.disconnect() } catch(_) {}; sourceRef.current = null }
    if (detectorRef.current) { detectorRef.current.reset(); detectorRef.current = null }
    analyserRef.current = null
  }

  const startDetecting = useCallback(async (stream: MediaStream) => {
    // Reuse AudioContext, analyser and detector across cards
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new AudioContext()
      allContexts.push(sharedCtx)
      sharedAnalyser = null
      sharedDetector = null
    }
    if (sharedCtx.state === 'suspended') await sharedCtx.resume()
    if (!sharedAnalyser) {
      const source = sharedCtx.createMediaStreamSource(stream)
      sourceRef.current = source
      sharedAnalyser = sharedCtx.createAnalyser()
      sharedAnalyser.fftSize = DATA_SIZE
      source.connect(sharedAnalyser)
      bufRef.current = new Float32Array(DATA_SIZE) as Float32Array<ArrayBuffer>
    }
    analyserRef.current = sharedAnalyser

    const NOTE_NAMES_D = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    const FLAT_NAMES_D = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
    const noteMatch = targetNote.match(/^([A-G][#b]?)(\d)$/)
    const noteMidi = noteMatch ? (() => {
      const pc = NOTE_NAMES_D.indexOf(noteMatch[1]) >= 0 ? NOTE_NAMES_D.indexOf(noteMatch[1]) : FLAT_NAMES_D.indexOf(noteMatch[1])
      return (parseInt(noteMatch[2]) + 1) * 12 + pc
    })() : 60
    if (!sharedDetector) {
      sharedDetector = new NoteDetector(DATA_SIZE, sharedCtx.sampleRate)
    }
    sharedDetector.setTarget(noteMidi)
    detectorRef.current = sharedDetector
    doneRef.current = false
    setStatus('listening')

    let wrongTimeout: ReturnType<typeof setTimeout> | null = null

    function tick() {
      if (!analyserRef.current || !detectorRef.current || doneRef.current) return
      analyserRef.current.getFloatTimeDomainData(bufRef.current)
      detectorRef.current.update(bufRef.current)
      const note = detectorRef.current.getNote()

      if (note && note.stable) {
        setDetected(note.name)
        const played = noteToPitchClass(note.name)
        const playedFull = note.name  // includes octave e.g. 'D4'

        if (pitchMatchesFull(playedFull, targetNote)) {
          if (wrongTimeout) { clearTimeout(wrongTimeout); wrongTimeout = null }
          doneRef.current = true
          setStatus('correct')
          stopLoop()
          setTimeout(() => onCorrect(!cardHadWrong), 100)
          return
        } else {
          setStatus('wrong')
          if (Date.now() >= cardReadyAt) { cardHadWrong = true; onWrong() }
          if (!wrongTimeout) {
            wrongTimeout = setTimeout(() => {
              if (!doneRef.current) setStatus('listening')
              wrongTimeout = null
            }, 700)
          }
        }
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
  }, [card.note, onCorrect, targetPitch])

  // Auto-start mic on first card, reuse stream on subsequent cards
  useEffect(() => {
    doneRef.current = false
    setStatus('starting')
    setDetected(null)
    stopLoop()

    async function init() {
      try {
        // Reuse stream across cards
        const streamHealthy = sharedStream && sharedStream.active && sharedStream.getTracks().every(t => t.readyState === 'live')
        if (!streamHealthy) {
          console.log('CALLING getUserMedia')
          sharedStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          allStreams.push(sharedStream)
          sharedCtx = null
          sharedAnalyser = null
          sharedDetector = null
          analyserRef.current = null
        }
        const stream = sharedStream
        setPermissionGranted(true)
        console.log('sharedStream active:', sharedStream?.active, 'sharedCtx:', sharedCtx?.state)
        if (stream) await startDetecting(stream)
      } catch (e: any) {
        setError('Mic access denied. Please allow microphone access.')
        setStatus('listening')
      }
    }

    cardHadWrong = false
    cardReadyAt = Date.now() + 300
    // Reset detector to clear previous note memory
    if (detectorRef.current) detectorRef.current.reset()
    // Update detector target for octave correction
    if (detectorRef.current) {
      const NOTE_NAMES_T = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
      const FLAT_NAMES_T = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
      const m = targetNote.match(/^([A-G][#b]?)(\d)$/)
      if (m) {
        const pc = NOTE_NAMES_T.indexOf(m[1]) >= 0 ? NOTE_NAMES_T.indexOf(m[1]) : FLAT_NAMES_T.indexOf(m[1])
        const midi = (parseInt(m[2]) + 1) * 12 + pc
        detectorRef.current.setTarget(midi)
      }
    }
    init()
    return () => {
      stopLoop()
      // Don't stop sharedStream here — handled by mode switch
    }
  }, [card.id])

  const bgColor = status === 'correct' ? '#EAF3DE'
    : status === 'wrong' ? '#FCEBEB'
    : 'white'
  const borderColor = status === 'correct' ? '#C0DD97'
    : status === 'wrong' ? '#F09595'
    : '#DDD8CA'

  return (
    <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div
        className="nl-study-card-hover"
        style={{
          width: '100%', background: bgColor, borderRadius: '20px',
          border: `1px solid ${borderColor}`, padding: '40px 32px', textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 'var(--nl-text-badge)', fontWeight: 400, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A7060', display: 'block', marginBottom: '20px' }}>
          Play this note
        </span>

        {card.note && card.clef ? (
          card.clef === 'grand' ? <GrandStaffCard note={card.note} /> : <StaffCard note={card.note} clef={card.clef} />
        ) : (
          <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '32px', fontWeight: 300, color: '#2A2318' }}>
            {card.front}
          </p>
        )}

        <div style={{ marginTop: '20px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>

          {status === 'listening' && (
            <>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#B5402A', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#7A7060', letterSpacing: '0.04em' }}>
                {detected ? `Hearing: ${detected}` : 'Play the note…'}
              </span>
            </>
          )}
          {status === 'correct' && (
            <span style={{ fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#3B6D11', letterSpacing: '0.04em' }}>
              ✓ {detected}
            </span>
          )}
          {status === 'wrong' && detected && (
            <span style={{ fontSize: 'var(--nl-text-body)', fontWeight: 400, color: '#A32D2D', letterSpacing: '0.04em' }}>
              ✗ That's {detected} — try {targetNote}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#A32D2D', textAlign: 'center' }}>{error}</p>
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
