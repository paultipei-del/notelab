'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { QueueCard } from '@/lib/types'
import StaffCard from './StaffCard'
import { NoteDetector, noteToPitchClass } from '@/lib/noteDetector'

interface PlayItCardProps {
  card: QueueCard
  onCorrect: () => void
}

type Status = 'idle' | 'listening' | 'correct' | 'wrong'

const DATA_SIZE = 4096

export default function PlayItCard({ card, onCorrect }: PlayItCardProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [detected, setDetected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const animRef   = useRef<number | null>(null)
  const detectorRef = useRef<NoteDetector | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufRef    = useRef<Float32Array<ArrayBuffer>>(new Float32Array(DATA_SIZE) as Float32Array<ArrayBuffer>)

  const targetPitch = noteToPitchClass(card.note ?? '')

  const stop = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    detectorRef.current = null
    analyserRef.current = null
  }, [])

  // Stop on card change
  useEffect(() => {
    setStatus('idle')
    setDetected(null)
    setError(null)
    stop()
  }, [card.id, stop])

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop])

  async function startListening() {
    setError(null)
    setDetected(null)
    setStatus('listening')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream

      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = DATA_SIZE * 2
      source.connect(analyser)
      analyserRef.current = analyser

      const detector = new NoteDetector(DATA_SIZE, ctx.sampleRate)
      detectorRef.current = detector

      let wrongTimeout: ReturnType<typeof setTimeout> | null = null

      function tick() {
        if (!analyserRef.current || !detectorRef.current) return
        analyserRef.current.getFloatTimeDomainData(bufRef.current)
        detectorRef.current.update(bufRef.current)
        const note = detectorRef.current.getNote()

        if (note && note.stable) {
          setDetected(note.name)
          const played = noteToPitchClass(note.name)

          if (played === targetPitch) {
            if (wrongTimeout) { clearTimeout(wrongTimeout); wrongTimeout = null }
            setStatus('correct')
            stop()
            setTimeout(onCorrect, 600)
            return
          } else {
            setStatus('wrong')
            if (!wrongTimeout) {
              wrongTimeout = setTimeout(() => {
                setStatus('listening')
                wrongTimeout = null
              }, 800)
            }
          }
        }

        animRef.current = requestAnimationFrame(tick)
      }

      animRef.current = requestAnimationFrame(tick)
    } catch (e: any) {
      setError('Mic access denied. Please allow microphone access and try again.')
      setStatus('idle')
    }
  }

  const bgColor = status === 'correct' ? '#EAF3DE'
    : status === 'wrong' ? '#FCEBEB'
    : 'white'

  const borderColor = status === 'correct' ? '#C0DD97'
    : status === 'wrong' ? '#F09595'
    : '#D3D1C7'

  return (
    <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

      {/* Card */}
      <div style={{
        width: '100%',
        background: bgColor,
        borderRadius: '20px',
        border: `1px solid ${borderColor}`,
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 4px 32px rgba(26,26,24,0.10)',
        transition: 'background 0.2s, border-color 0.2s',
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

        {/* Status feedback */}
        <div style={{ marginTop: '20px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {status === 'listening' && (
            <>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#BA7517', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: '13px', fontWeight: 300, color: '#888780', letterSpacing: '0.04em' }}>
                {detected ? `Hearing: ${detected}` : 'Listening…'}
              </span>
            </>
          )}
          {status === 'correct' && (
            <span style={{ fontSize: '15px', fontWeight: 400, color: '#3B6D11', letterSpacing: '0.04em' }}>
              ✓ Correct — {detected}
            </span>
          )}
          {status === 'wrong' && detected && (
            <span style={{ fontSize: '15px', fontWeight: 400, color: '#A32D2D', letterSpacing: '0.04em' }}>
              ✗ That's {detected} — try again
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      {status === 'idle' && (
        <button onClick={startListening} style={{
          background: '#1A1A18',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          padding: '14px 36px',
          fontFamily: 'var(--font-jost), sans-serif',
          fontSize: '13px',
          fontWeight: 300,
          letterSpacing: '0.08em',
          cursor: 'pointer',
        }}>
          🎹 Start Listening
        </button>
      )}

      {status === 'listening' && (
        <button onClick={() => { stop(); setStatus('idle'); setDetected(null) }} style={{
          background: 'transparent',
          color: '#888780',
          border: '1px solid #D3D1C7',
          borderRadius: '10px',
          padding: '10px 24px',
          fontFamily: 'var(--font-jost), sans-serif',
          fontSize: '13px',
          fontWeight: 300,
          cursor: 'pointer',
        }}>
          Stop
        </button>
      )}

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
