'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/lib/types'

interface AudioCardProps {
  card: Card
  revealed: boolean
  onReveal: () => void
  compact?: boolean
  hideReveal?: boolean
}

type PlayState = 'idle' | 'loading' | 'playing' | 'ready'

// Shared sampler — loaded once, reused across all audio cards
let sharedSampler: any = null
let sharedTone: any = null
let samplerLoaded = false
let samplerLoading = false
const loadCallbacks: Array<() => void> = []

async function ensureSampler(): Promise<void> {
  if (samplerLoaded) return
  if (samplerLoading) return new Promise(resolve => loadCallbacks.push(resolve))
  samplerLoading = true
  const Tone = await import('tone')
  sharedTone = Tone
  return new Promise(resolve => {
    sharedSampler = new Tone.Sampler({
      urls: {
        A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
        A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
        A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
        A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
        A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
        A5: 'A5.mp3', C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
        A6: 'A6.mp3', C7: 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
        A7: 'A7.mp3', C8: 'C8.mp3',
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => {
        samplerLoaded = true
        samplerLoading = false
        resolve()
        loadCallbacks.forEach(cb => cb())
        loadCallbacks.length = 0
      },
    }).toDestination()
  })
}

export default function AudioCard({ card, revealed, onReveal, compact, hideReveal }: AudioCardProps) {
  const [playState, setPlayState] = useState<PlayState>('idle')
  const [hasPlayed, setHasPlayed] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset when card changes
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setPlayState('idle')
    setHasPlayed(false)
  }, [card.id])

  const playOnce = useCallback(async () => {
    if (!sharedSampler || !sharedTone) return
    const Tone = sharedTone
    await Tone.start()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setPlayState('playing')
    setHasPlayed(true)

    const notes = card.audioNotes ?? []
    const pattern = card.audioPattern ?? 'harmonic'
    const duration = card.audioDuration ?? '2n'
    const now = Tone.now()
    let totalDuration = 2000

    if (pattern === 'harmonic') {
      sharedSampler.triggerAttackRelease(notes, duration, now)
      totalDuration = 2000
    } else if (pattern === 'ascending') {
      notes.forEach((note: string, i: number) => {
        sharedSampler.triggerAttackRelease(note, '4n', now + i * 0.6)
      })
      totalDuration = notes.length * 600 + 800
    } else if (pattern === 'descending') {
      ;[...notes].reverse().forEach((note: string, i: number) => {
        sharedSampler.triggerAttackRelease(note, '4n', now + i * 0.6)
      })
      totalDuration = notes.length * 600 + 800
    } else if (pattern === 'cadence') {
      const chords = card.audioChords ?? []
      chords.forEach((chord: string[], i: number) => {
        sharedSampler.triggerAttackRelease(chord, '2n', now + i * 1.4)
      })
      totalDuration = (card.audioChords?.length ?? 1) * 1400 + 800
    } else if (pattern === 'scale') {
      const step = 0.35
      notes.forEach((note: string, i: number) => {
        sharedSampler.triggerAttackRelease(note, step, now + i * step)
      })
      totalDuration = notes.length * 350 + 600
    } else if (pattern === 'chord-cascade') {
      // 72 BPM: Q = 60/72s. Two-bar exercise:
      // Bar 1 — broken: note[i] attacks at beat i, sustains (4-i) beats (waterfall)
      // Bar 2 — blocked: all notes together for 4 beats (whole note)
      const Q = 60 / 72
      notes.forEach((note: string, i: number) => {
        const dur = Math.max(1, 4 - i) * Q
        sharedSampler.triggerAttackRelease(note, dur, now + i * Q)
      })
      sharedSampler.triggerAttackRelease(notes, 4 * Q, now + 4 * Q)
      totalDuration = Math.round((8 * Q + 0.8) * 1000)
    } else if (pattern === 'interval-ascending') {
      // 72 BPM: quarter = 0.833s, half = 1.667s
      // root (Q) → top (Q) → [root, top] blocked (H)
      const Q = 60 / 72
      const H = 2 * Q
      sharedSampler.triggerAttackRelease(notes[0], Q, now)
      sharedSampler.triggerAttackRelease(notes[1], Q, now + Q)
      sharedSampler.triggerAttackRelease([notes[0], notes[1]], H, now + 2 * Q)
      totalDuration = Math.round((3 * Q + H + 0.5) * 1000)
    } else if (pattern === 'interval-descending') {
      // top (Q) → root (Q) → [root, top] blocked (H)
      const Q = 60 / 72
      const H = 2 * Q
      sharedSampler.triggerAttackRelease(notes[1], Q, now)
      sharedSampler.triggerAttackRelease(notes[0], Q, now + Q)
      sharedSampler.triggerAttackRelease([notes[0], notes[1]], H, now + 2 * Q)
      totalDuration = Math.round((3 * Q + H + 0.5) * 1000)
    }

    timeoutRef.current = setTimeout(() => setPlayState('ready'), totalDuration)
  }, [card])

  async function handlePlay() {
    if (playState === 'playing') return
    if (!samplerLoaded) {
      setPlayState('loading')
      await ensureSampler()
    }
    await playOnce()
  }

  const buttonLabel = {
    idle: '▶  Play',
    loading: 'Loading…',
    playing: '♩  Playing…',
    ready: '▶  Play Again',
  }[playState]

  return (
    <div style={{ width: '100%', maxWidth: '480px' }}>
      {/* Player */}
      <div style={{
        background: '#FDFAF3',
        border: '1px solid #DDD8CA',
        borderRadius: '20px',
        padding: '36px 32px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(26,26,24,0.08)',
        marginBottom: compact ? '8px' : revealed ? '12px' : '16px',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '16px', lineHeight: 1 }}>𝄞</div>

        <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 300, fontSize: '20px', color: '#2A2318', marginBottom: '4px', letterSpacing: '0.02em' }}>
          {card.audioLabel ?? 'Listen and identify'}
        </p>

        {card.audioHint && (
          <p style={{ fontSize: '12px', fontWeight: 300, color: '#7A7060', marginBottom: '20px' }}>
            {card.audioHint}
          </p>
        )}

        {/* Play button */}
        <button
          onClick={handlePlay}
          disabled={playState === 'loading' || playState === 'playing'}
          style={{
            background: playState === 'playing' ? '#EDE8DF' : '#1A1A18',
            color: playState === 'playing' ? '#7A7060' : 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '11px 32px',
            fontFamily: 'var(--font-jost), sans-serif',
            fontSize: '13px',
            fontWeight: 300,
            letterSpacing: '0.06em',
            cursor: playState === 'loading' || playState === 'playing' ? 'default' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {buttonLabel}
        </button>
      </div>

      {/* Answer — shown after first play, toggled by reveal */}
      {revealed ? (
        <div style={{ background: '#FAEEDA', border: '1px solid #FAC775', borderRadius: '14px', padding: '20px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 400, fontSize: '20px', color: '#2A2318', marginBottom: '6px' }}>
            {card.back.split('—')[0].trim()}
          </p>
          {card.back.includes('—') && (
            <p style={{ fontSize: '13px', fontWeight: 300, color: '#7A7060', lineHeight: 1.7 }}>
              {card.back.split('—').slice(1).join('—').trim()}
            </p>
          )}
        </div>
      ) : hasPlayed && !hideReveal ? (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onReveal}
            style={{
              background: 'transparent',
              border: '1px solid #DDD8CA',
              borderRadius: '50px',
              padding: '9px 24px',
              fontFamily: 'var(--font-jost), sans-serif',
              fontSize: '12px',
              fontWeight: 300,
              color: '#7A7060',
              cursor: 'pointer',
            }}
          >
            Show Answer
          </button>
        </div>
      ) : (
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-jost), sans-serif', fontSize: '12px', fontWeight: 300, color: '#DDD8CA', letterSpacing: '0.03em' }}>
          Press play to hear the example
        </p>
      )}
    </div>
  )
}
