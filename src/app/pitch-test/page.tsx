'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NoteDetector, noteToPitchClass, DetectedNote } from '@/lib/noteDetector'
import GrandStaffCard from '@/components/cards/GrandStaffCard'

// All chromatic notes C2-C6
const ALL_NOTES: string[] = []
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
for (let oct = 2; oct <= 6; oct++) {
  for (const n of NOTE_NAMES) {
    ALL_NOTES.push(n + oct)
    if (n === 'C' && oct === 6) break
  }
}

const DATA_SIZE_LO = 4096
const DATA_SIZE_HI = 2048
let allStreams: MediaStream[] = []
function stopMic() {
  allStreams.forEach(s => s.getTracks().forEach(t => t.stop()))
  allStreams = []
}

export default function PitchTest() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [detected, setDetected] = useState<string>('—')
  const [detectedFreq, setDetectedFreq] = useState<number>(0)
  const [log, setLog] = useState<{note: string, detected: string, freq: number}[]>([])
  const [micActive, setMicActive] = useState(false)
  const detectorRef = useRef<NoteDetector | null>(null)
  const rafRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufRef = useRef<Float32Array | null>(null)

  const currentNote = ALL_NOTES[idx]

  // Update detector target when note changes, restart if buffer size changes
  const prevDataSizeRef = useRef(0)
  useEffect(() => {
    const NOTE_NAMES_D = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    const match = ALL_NOTES[idx].match(/^([A-G][#b]?)(\d)$/)
    if (!match) return
    const midi = (parseInt(match[2]) + 1) * 12 + NOTE_NAMES_D.indexOf(match[1])
    const needsLo = midi < 76
    const newDataSize = needsLo ? DATA_SIZE_LO : DATA_SIZE_HI
    if (newDataSize !== prevDataSizeRef.current) {
      // Buffer size change — need full restart
      prevDataSizeRef.current = newDataSize
      cancelAnimationFrame(rafRef.current)
      startMic(idx)
    } else if (detectorRef.current) {
      // Same buffer size — just update target
      detectorRef.current.setTarget(midi)
    }
  }, [idx])

  const startMic = useCallback(async (noteIdx?: number) => {
    try {
      stopMic()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      allStreams.push(stream)
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      source.connect(analyser)
      analyserRef.current = analyser
      const NOTE_NAMES_D = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
      const targetIdx = noteIdx ?? idx
      const match = ALL_NOTES[targetIdx].match(/^([A-G][#b]?)(\d)$/)
      const midi = match ? (parseInt(match[2]) + 1) * 12 + NOTE_NAMES_D.indexOf(match[1]) : 60
      const dataSize = midi < 76 ? DATA_SIZE_LO : DATA_SIZE_HI
      analyser.fftSize = dataSize * 2
      bufRef.current = new Float32Array(dataSize)
      const det = new NoteDetector(dataSize, ctx.sampleRate)
      det.setTarget(midi)
      detectorRef.current = det
      setMicActive(true)

      function tick() {
        if (!analyserRef.current || !bufRef.current || !detectorRef.current) return
        analyserRef.current.getFloatTimeDomainData(bufRef.current as unknown as Float32Array<ArrayBuffer>)
        detectorRef.current.update(bufRef.current)
        const result = detectorRef.current.getNote()
        if (result?.stable) {
          setDetected(result.name)
          setDetectedFreq(Math.round(result.freq))
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch(e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    startMic()
    return () => {
      cancelAnimationFrame(rafRef.current)
      stopMic()
    }
  }, [])

  function logAndNext() {
    setLog(prev => [...prev, { note: currentNote, detected, freq: detectedFreq }])
    if (idx < ALL_NOTES.length - 1) {
      setIdx(i => i + 1)
    }
    setDetected('—')
    setDetectedFreq(0)
  }

  function prev() {
    if (idx > 0) {
      setIdx(i => i - 1)
    }
    setDetected('—')
    setDetectedFreq(0)
  }

  const F = 'var(--font-jost), sans-serif'
  const SERIF = 'var(--font-cormorant), serif'

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #D3D1C7' }}>
        <button onClick={() => { stopMic(); router.push('/') }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px', color: '#888780' }}>← Back</button>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '20px', color: '#1A1A18' }}>Pitch Detection Diagnostic</h1>
        <span style={{ fontFamily: F, fontSize: '12px', color: '#888780' }}>{idx + 1} / {ALL_NOTES.length}</span>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Current note */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '32px', marginBottom: '16px', textAlign: 'center' }}>
          <p style={{ fontFamily: F, fontSize: '11px', color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Play this note</p>
          <h2 style={{ fontFamily: SERIF, fontSize: '48px', fontWeight: 300, color: '#1A1A18', marginBottom: '16px' }}>{currentNote}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <GrandStaffCard note={currentNote} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' as const }}>
              <p style={{ fontFamily: F, fontSize: '10px', color: '#888780', marginBottom: '4px' }}>Detected</p>
              <p style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 300, color: detected === currentNote ? '#4CAF50' : '#E53935' }}>{detected}</p>
              <p style={{ fontFamily: F, fontSize: '10px', color: '#888780' }}>{detectedFreq > 0 ? detectedFreq + ' Hz' : ''}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button onClick={prev} disabled={idx === 0}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #D3D1C7', background: 'white', fontFamily: F, fontSize: '13px', color: '#888780', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>
            ← Prev
          </button>
          <button onClick={logAndNext}
            style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: '#1A1A18', fontFamily: F, fontSize: '13px', color: 'white', cursor: 'pointer' }}>
            Log & Next →
          </button>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontFamily: F, fontSize: '11px', color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Log</p>
              <button onClick={() => {
                const text = log.map(e => `${e.note}→ ${e.detected}${e.freq} Hz`).join('\n')
                navigator.clipboard.writeText(text)
              }} style={{ background: 'none', border: '1px solid #D3D1C7', borderRadius: '6px', padding: '3px 10px', fontFamily: F, fontSize: '11px', color: '#888780', cursor: 'pointer' }}>
                Copy
              </button>
            </div>
            <div style={{ fontFamily: F, fontSize: '12px', lineHeight: 1.8 }}>
              {log.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', color: entry.note === entry.detected ? '#4CAF50' : '#E53935' }}>
                  <span style={{ width: '50px' }}>{entry.note}</span>
                  <span style={{ width: '80px' }}>→ {entry.detected}</span>
                  <span style={{ color: '#888780' }}>{entry.freq} Hz</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
