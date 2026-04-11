'use client'

import { useState, useRef } from 'react'
import { Card } from '@/lib/types'

// Shared sampler reference from AudioCard
declare const sharedSampler: any
declare const sharedTone: any
declare let samplerLoaded: boolean
declare let samplerLoading: boolean
declare const loadCallbacks: Array<() => void>

let _sharedSampler: any = null
let _sharedTone: any = null
let _samplerLoaded = false
let _samplerLoading = false
const _loadCallbacks: Array<() => void> = []

async function ensureSampler(): Promise<void> {
  if (_samplerLoaded) return
  if (_samplerLoading) return new Promise(resolve => _loadCallbacks.push(resolve))
  _samplerLoading = true
  const Tone = await import('tone')
  _sharedTone = Tone
  return new Promise(resolve => {
    _sharedSampler = new Tone.Sampler({
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
        _samplerLoaded = true
        _samplerLoading = false
        resolve()
        _loadCallbacks.forEach(cb => cb())
        _loadCallbacks.length = 0
      },
    }).toDestination()
  })
}

interface AudioBrowseRowProps {
  card: Card
}

export default function AudioBrowseRow({ card }: AudioBrowseRowProps) {
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const name = card.symbolName ?? card.back.split('—')[0].trim()
  const detail = card.back.split('—')[1]?.trim() ?? ''

  async function handlePlay(e: React.MouseEvent) {
    e.stopPropagation()
    if (playing) return

    if (!_samplerLoaded) {
      setLoading(true)
      await ensureSampler()
      setLoading(false)
    }

    const Tone = _sharedTone
    const sampler = _sharedSampler
    if (!Tone || !sampler) return

    await Tone.start()
    setPlaying(true)

    // In browse mode, normalize intervals to start on C4 for easy comparison
    let notes = card.audioNotes ?? []
    if (card.audioPattern === 'ascending' && notes.length === 2) {
      const noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
      const bottom = notes[0]
      const top = notes[1]
      const matchB = bottom.match(/^([A-G]#?)(\d)$/)
      const matchT = top.match(/^([A-G]#?)(\d)$/)
      if (matchB && matchT) {
        const semisBottom = noteNames.indexOf(matchB[1]) + parseInt(matchB[2]) * 12
        const semisTop = noteNames.indexOf(matchT[1]) + parseInt(matchT[2]) * 12
        const interval = semisTop - semisBottom
        const newTop = noteNames[interval % 12] + (4 + Math.floor(interval / 12))
        notes = ['C4', newTop]
      }
    }
    const pattern = card.audioPattern ?? 'harmonic'
    const duration = card.audioDuration ?? '2n'
    const now = Tone.now()
    let totalDuration = 2000

    if (pattern === 'harmonic') {
      sampler.triggerAttackRelease(notes, duration, now)
      totalDuration = 2000
    } else if (pattern === 'ascending') {
      notes.forEach((note: string, i: number) => {
        sampler.triggerAttackRelease(note, '4n', now + i * 0.6)
      })
      totalDuration = notes.length * 600 + 500
    } else if (pattern === 'cadence') {
      const chords = card.audioChords ?? []
      chords.forEach((chord: string[], i: number) => {
        sampler.triggerAttackRelease(chord, '2n', now + i * 1.4)
      })
      totalDuration = (card.audioChords?.length ?? 1) * 1400 + 500
    } else if (pattern === 'scale') {
      notes.forEach((note: string, i: number) => {
        sampler.triggerAttackRelease(note, '8n', now + i * 0.35)
      })
      totalDuration = notes.length * 350 + 400
    }

    timeoutRef.current = setTimeout(() => setPlaying(false), totalDuration)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
      {/* Play button */}
      <button
        onClick={handlePlay}
        disabled={playing || loading}
        style={{
          flexShrink: 0,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: playing ? '#EDE8DF' : '#1A1A18',
          border: 'none',
          cursor: playing || loading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: playing ? '#9E9A92' : 'white',
          transition: 'all 0.15s',
          flexDirection: 'column' as const,
        }}
      >
        {loading ? '…' : playing ? '♩' : '▶'}
      </button>

      {/* Name and detail */}
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontWeight: 400,
          fontSize: '18px',
          color: '#F0EDE6',
          lineHeight: 1.3,
        }}>
          {name}
        </p>
        {detail && (
          <p style={{
            fontSize: '12px',
            fontWeight: 300,
            color: '#9E9A92',
            marginTop: '2px',
            lineHeight: 1.5,
          }}>
            {detail}
          </p>
        )}
      </div>
    </div>
  )
}
