'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SADPitchDetector, midiToName } from '@/lib/sadDetector'
import StaffCard from '@/components/cards/StaffCard'
import GrandStaffCard from '@/components/cards/GrandStaffCard'
import { noteToPitchClass } from '@/lib/noteDetector'
import type { QueueCard } from '@/lib/types'

const DATA_SIZE = 4096

let sadStream: MediaStream | null = null
let sadCtx: AudioContext | null = null
let sadAnalyser: AnalyserNode | null = null
let sadDetector: SADPitchDetector | null = null
let sadBuf: Float32Array | null = null
let cardReadyAt2 = 0
let cardHadWrong2 = false

const ENHARMONICS: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#', 'A#': 'Bb', 'Bb': 'A#',
}

function pitchMatch(played: string, target: string): boolean {
  if (played === target) return true
  const playedPc = played.replace(/\d+$/, '')
  const targetPc = target.replace(/\d+$/, '')
  const playedOct = played.match(/\d+$/)?.[0]
  const targetOct = target.match(/\d+$/)?.[0]
  if (playedOct !== targetOct) return false
  return ENHARMONICS[targetPc] === playedPc
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
  const rafRef = useRef(0)

  const targetNote = card.note ?? ''
  const targetPc = noteToPitchClass(targetNote)

  const stopLoop = useCallback(() => cancelAnimationFrame(rafRef.current), [])

  useEffect(() => {
    doneRef.current = false
    cardHadWrong2 = false
    cardReadyAt2 = Date.now() + 800
    setStatus('starting')
    setDetected(null)

    async function init() {
      try {
        if (!sadStream || !sadStream.active || !sadStream.getTracks().every(t => t.readyState === 'live')) {
          sadStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          sadCtx = null
          sadAnalyser = null
          sadDetector = null
        }

        if (!sadCtx || sadCtx.state === 'closed') {
          sadCtx = new AudioContext()
        }
        if (sadCtx.state === 'suspended') await sadCtx.resume()

        if (!sadAnalyser) {
          const source = sadCtx.createMediaStreamSource(sadStream!)
          sadAnalyser = sadCtx.createAnalyser()
          sadAnalyser.fftSize = DATA_SIZE
          source.connect(sadAnalyser)
          sadBuf = new Float32Array(DATA_SIZE)
          sadDetector = new SADPitchDetector(sadCtx.sampleRate)
        }

        // Hard flush — reset detector AND wait for dead window
        if (sadDetector) sadDetector.reset()
        // Flush the analyser buffer by reading it several times
        if (sadBuf && sadAnalyser) {
          for (let i = 0; i < 8; i++) {
            sadAnalyser.getFloatTimeDomainData(sadBuf as unknown as Float32Array<ArrayBuffer>)
          }
        }

        setStatus('listening')

        // Wait for dead window before starting detection
        await new Promise(resolve => setTimeout(resolve, 800))
        if (doneRef.current) return
        // Flush again after wait
        if (sadDetector) sadDetector.reset()
        if (sadBuf && sadAnalyser) {
          for (let i = 0; i < 8; i++) {
            sadAnalyser.getFloatTimeDomainData(sadBuf as unknown as Float32Array<ArrayBuffer>)
          }
        }

        function tick() {
          if (!sadAnalyser || !sadBuf || !sadDetector || doneRef.current) return
          sadAnalyser.getFloatTimeDomainData(sadBuf as unknown as Float32Array<ArrayBuffer>)
          const result = sadDetector.update(sadBuf)

          if (result?.stable) {
            setDetected(result.name)
            if (pitchMatch(result.name, targetNote)) {
              if (doneRef.current) return
              doneRef.current = true
              setStatus('correct')
              stopLoop()
              setTimeout(() => onCorrect(!cardHadWrong2), 100)
              return
            } else {
              setStatus('wrong')
              if (Date.now() >= cardReadyAt2) {
                cardHadWrong2 = true
                onWrong()
              }
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()

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
        {card.note && card.clef ? (
          card.clef === 'grand' ? <GrandStaffCard note={card.note} /> : <StaffCard note={card.note} clef={card.clef} />
        ) : null}
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
