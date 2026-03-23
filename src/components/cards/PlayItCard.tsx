'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QueueCard } from '@/lib/types'
import StaffCard from './StaffCard'
import { NoteDetector, noteToPitchClass } from '@/lib/noteDetector'

interface PlayItCardProps {
  card: QueueCard
  onCorrect: () => void
}

type Status = 'starting' | 'listening' | 'correct' | 'wrong'

const DATA_SIZE = 4096

// Track ALL streams and contexts ever created so we can stop them all
const allStreams: MediaStream[] = []
const allContexts: AudioContext[] = []

export function stopMic() {
  allStreams.forEach(s => s.getTracks().forEach(t => t.stop()))
  allStreams.length = 0
  allContexts.forEach(ctx => ctx.close().catch(() => {}))
  allContexts.length = 0
}

export default function PlayItCard({ card, onCorrect }: PlayItCardProps) {
  const [status, setStatus] = useState<Status>('starting')
  const [detected, setDetected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  const animRef    = useRef<number | null>(null)
  const detectorRef = useRef<NoteDetector | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef   = useRef<MediaStreamAudioSourceNode | null>(null)
  const bufRef     = useRef<Float32Array<ArrayBuffer>>(new Float32Array(DATA_SIZE) as Float32Array<ArrayBuffer>)
  const doneRef    = useRef(false)

  const targetPitch = noteToPitchClass(card.note ?? '')

  // Stop mic when Play It mode is exited entirely
  useEffect(() => {
    return () => {
      stopMic()
    }
  }, [])

  function stopLoop() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    if (sourceRef.current) { try { sourceRef.current.disconnect() } catch(_) {}; sourceRef.current = null }
    detectorRef.current = null
    analyserRef.current = null
  }

  const startDetecting = useCallback(async (stream: MediaStream) => {
    const ctx = new AudioContext()
    allContexts.push(ctx)
    if (ctx.state === 'suspended') await ctx.resume()

    const source = ctx.createMediaStreamSource(stream)
    sourceRef.current = source
    const analyser = ctx.createAnalyser()
    analyser.fftSize = DATA_SIZE * 2
    source.connect(analyser)
    analyserRef.current = analyser

    const detector = new NoteDetector(DATA_SIZE, ctx.sampleRate)
    detectorRef.current = detector
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

        if (played === targetPitch) {
          if (wrongTimeout) { clearTimeout(wrongTimeout); wrongTimeout = null }
          doneRef.current = true
          setStatus('correct')
          stopLoop()
          setTimeout(onCorrect, 200)
          return
        } else {
          setStatus('wrong')
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        allStreams.push(stream)
        setPermissionGranted(true)
        await startDetecting(stream)
      } catch (e: any) {
        setError('Mic access denied. Please allow microphone access.')
        setStatus('listening')
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
    : '#D3D1C7'

  return (
    <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{
        width: '100%', background: bgColor, borderRadius: '20px',
        border: `1px solid ${borderColor}`, padding: '40px 32px', textAlign: 'center',
        boxShadow: '0 4px 32px rgba(26,26,24,0.10)', transition: 'background 0.2s, border-color 0.2s',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888780', display: 'block', marginBottom: '20px' }}>
          Play this note
        </span>

        {card.note && card.clef ? (
          <StaffCard note={card.note} clef={card.clef} />
        ) : (
          <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '32px', fontWeight: 300, color: '#1A1A18' }}>
            {card.front}
          </p>
        )}

        <div style={{ marginTop: '20px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {status === 'starting' && (
            <span style={{ fontSize: '13px', fontWeight: 300, color: '#D3D1C7', letterSpacing: '0.04em' }}>
              Starting mic…
            </span>
          )}
          {status === 'listening' && (
            <>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#BA7517', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: '13px', fontWeight: 300, color: '#888780', letterSpacing: '0.04em' }}>
                {detected ? `Hearing: ${detected}` : 'Play the note…'}
              </span>
            </>
          )}
          {status === 'correct' && (
            <span style={{ fontSize: '15px', fontWeight: 400, color: '#3B6D11', letterSpacing: '0.04em' }}>
              ✓ {detected}
            </span>
          )}
          {status === 'wrong' && detected && (
            <span style={{ fontSize: '15px', fontWeight: 400, color: '#A32D2D', letterSpacing: '0.04em' }}>
              ✗ That's {detected} — try {targetPitch}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '13px', fontWeight: 300, color: '#A32D2D', textAlign: 'center' }}>{error}</p>
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
