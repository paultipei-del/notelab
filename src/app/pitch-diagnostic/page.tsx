'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SADPitchDetector, midiToName } from '@/lib/sadDetector'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

function midiToFreq(midi: number) { return 440 * Math.pow(2, (midi - 69) / 12) }
function freqToCents(hz: number, midi: number) {
  return Math.round(1200 * Math.log2(hz / midiToFreq(midi)))
}

interface Frame {
  t: number; midi: number; hz: number; cents: number; rms: number; stable: boolean; name: string
}

let micStream: MediaStream | null = null
let micCtx: AudioContext | null = null

export default function PitchDiagnostic() {
  const [running, setRunning] = useState(false)
  const [frames, setFrames] = useState<Frame[]>([])
  const [currentFrame, setCurrentFrame] = useState<Frame | null>(null)
  const [windowSize, setWindowSize] = useState(8)
  const [stableThreshold, setStableThreshold] = useState(6)
  const [levelThreshold, setLevelThreshold] = useState(0.008)
  const [crossover, setCrossover] = useState(400)
  const [testNote, setTestNote] = useState('')
  const [log, setLog] = useState<{note: string; result: string; latencyMs: number; frames: number}[]>([])

  const detectorRef = useRef<SADPitchDetector | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufRef = useRef<Float32Array | null>(null)
  const rafRef = useRef(0)
  const framesRef = useRef<Frame[]>([])
  const testStartRef = useRef(0)
  const frameCountRef = useRef(0)

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setRunning(false)
  }, [])

  const start = useCallback(async () => {
    try {
      if (!micStream || !micStream.active) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      if (!micCtx || micCtx.state === 'closed') micCtx = new AudioContext()
      if (micCtx.state === 'suspended') await micCtx.resume()

      const source = micCtx.createMediaStreamSource(micStream)
      const analyser = micCtx.createAnalyser()
      analyser.fftSize = 4096
      source.connect(analyser)
      analyserRef.current = analyser
      bufRef.current = new Float32Array(4096)
      detectorRef.current = new SADPitchDetector(micCtx.sampleRate, { windowSize, stableThreshold, levelThreshold, crossover })
      framesRef.current = []
      frameCountRef.current = 0
      setFrames([])
      setRunning(true)

      function tick() {
        if (!analyserRef.current || !bufRef.current || !detectorRef.current) return
        analyserRef.current.getFloatTimeDomainData(bufRef.current as unknown as Float32Array<ArrayBuffer>)
        let sum = 0
        for (let i = 0; i < bufRef.current.length; i++) sum += bufRef.current[i] ** 2
        const rms = Math.sqrt(sum / bufRef.current.length)
        const result = detectorRef.current.update(bufRef.current)
        frameCountRef.current++
        if (result) {
          const cents = freqToCents(result.freq, result.midi)
          const frame: Frame = { t: performance.now(), midi: result.midi, hz: Math.round(result.freq * 10) / 10, cents, rms: Math.round(rms * 10000) / 10000, stable: result.stable, name: result.name }
          setCurrentFrame(frame)
          if (result.stable) {
            framesRef.current = [...framesRef.current.slice(-99), frame]
            setFrames([...framesRef.current])
            if (testNote && testStartRef.current > 0) {
              setLog(prev => [...prev, { note: testNote, result: result.name, latencyMs: Math.round(frame.t - testStartRef.current), frames: frameCountRef.current }])
              testStartRef.current = 0; frameCountRef.current = 0
            }
          }
        } else { setCurrentFrame(null) }
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch(e) { console.error(e) }
  }, [windowSize, stableThreshold, levelThreshold, crossover])

  useEffect(() => {
    if (running && micCtx) {
      detectorRef.current = new SADPitchDetector(micCtx.sampleRate, { windowSize, stableThreshold, levelThreshold, crossover })
    }
  }, [windowSize, stableThreshold, levelThreshold, crossover])

  function startTestNote(note: string) {
    setTestNote(note); testStartRef.current = performance.now(); frameCountRef.current = 0
    detectorRef.current?.reset()
    if (bufRef.current && analyserRef.current) {
      for (let i = 0; i < 8; i++) analyserRef.current.getFloatTimeDomainData(bufRef.current as unknown as Float32Array<ArrayBuffer>)
    }
  }

  const latest = frames.slice(-20)

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #D3D1C7', background: 'white' }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '20px', color: '#1A1A18' }}>Pitch Diagnostic</h1>
        <button onClick={running ? stop : start} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: running ? '#E53935' : '#1A1A18', color: 'white', fontFamily: F, fontSize: '13px', cursor: 'pointer' }}>
          {running ? 'Stop' : 'Start Mic'}
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
          {/* Current */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px', textAlign: 'center' as const }}>
            <p style={{ fontFamily: F, fontSize: '10px', color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Detecting</p>
            <p style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 300, color: currentFrame?.stable ? '#4CAF50' : '#1A1A18', lineHeight: 1, marginBottom: '12px' }}>{currentFrame?.name ?? '—'}</p>
            {currentFrame && (
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                {[['Hz', String(currentFrame.hz), false], ['Cents', (currentFrame.cents > 0 ? '+' : '') + currentFrame.cents, Math.abs(currentFrame.cents) > 20], ['RMS', String(currentFrame.rms), false]].map(([label, val, warn]) => (
                  <div key={label as string}>
                    <p style={{ fontFamily: F, fontSize: '10px', color: '#888780' }}>{label as string}</p>
                    <p style={{ fontFamily: F, fontSize: '13px', color: warn ? '#E53935' : '#1A1A18' }}>{val as string}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Params */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px' }}>
            <p style={{ fontFamily: F, fontSize: '10px', color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>Parameters</p>
            {([
              ['Window Size', windowSize, 4, 20, 1, setWindowSize],
              ['Stable Threshold', stableThreshold, 2, 16, 1, setStableThreshold],
              ['Level Threshold', levelThreshold, 0.001, 0.05, 0.001, setLevelThreshold],
              ['Crossover Hz', crossover, 100, 1000, 50, setCrossover],
            ] as [string, number, number, number, number, (v: number) => void][]).map(([label, value, min, max, step, set]) => (
              <div key={label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#1A1A18' }}>{label}</p>
                  <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#BA7517' }}>{value}</p>
                </div>
                <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#BA7517' }} />
              </div>
            ))}
          </div>

          {/* Test notes */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px' }}>
            <p style={{ fontFamily: F, fontSize: '10px', color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Test Latency</p>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
              {['C3','G3','C4','G4','C5','G5','C6'].map(note => (
                <button key={note} onClick={() => startTestNote(note)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid ' + (testNote === note ? '#BA7517' : '#D3D1C7'), background: testNote === note ? '#FAEEDA' : 'white', fontFamily: F, fontSize: '12px', color: testNote === note ? '#BA7517' : '#888780', cursor: 'pointer' }}>
                  {note}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: F, fontSize: '11px', color: '#888780', marginTop: '8px' }}>Click a note, then play it on piano</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
          {/* Cents bar chart */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px' }}>
            <p style={{ fontFamily: F, fontSize: '10px', color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Cents Deviation — last 20 stable frames</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '80px', position: 'relative' as const }}>
              <div style={{ position: 'absolute' as const, left: 0, right: 0, top: '50%', height: '1px', background: '#EDE8DF' }} />
              {latest.map((f, i) => {
                const h = Math.min(38, Math.abs(f.cents))
                const color = Math.abs(f.cents) > 20 ? '#E53935' : '#4CAF50'
                return (
                  <div key={i} title={`${f.name} ${f.cents > 0 ? '+' : ''}${f.cents}¢`} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center' }}>
                    {f.cents > 0 && <div style={{ width: '100%', height: h, background: color, marginBottom: '40px' }} />}
                    {f.cents <= 0 && <div style={{ width: '100%', height: h, background: color, marginTop: '40px' }} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent detections */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px' }}>
            <p style={{ fontFamily: F, fontSize: '10px', color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Recent Stable Detections</p>
            <div style={{ overflowX: 'auto' as const }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                    {['Note', 'Hz', 'Cents', 'RMS'].map(h => <th key={h} style={{ padding: '6px 12px', textAlign: 'left' as const, fontFamily: F, fontSize: '10px', color: '#888780', fontWeight: 400, textTransform: 'uppercase' as const }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...latest].reverse().map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F5F2EC' }}>
                      <td style={{ padding: '6px 12px', fontFamily: SERIF, fontSize: '16px' }}>{f.name}</td>
                      <td style={{ padding: '6px 12px', fontFamily: F, fontSize: '12px', color: '#888780' }}>{f.hz}</td>
                      <td style={{ padding: '6px 12px', fontFamily: F, fontSize: '12px', color: Math.abs(f.cents) > 20 ? '#E53935' : '#4CAF50' }}>{f.cents > 0 ? '+' : ''}{f.cents}</td>
                      <td style={{ padding: '6px 12px', fontFamily: F, fontSize: '12px', color: '#888780' }}>{f.rms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latency log */}
          {log.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontFamily: F, fontSize: '10px', color: '#888780', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Latency Log</p>
                <button onClick={() => setLog([])} style={{ fontFamily: F, fontSize: '11px', color: '#888780', background: 'none', border: '1px solid #D3D1C7', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}>Clear</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                    {['Target', 'Detected', 'Latency', 'Frames'].map(h => <th key={h} style={{ padding: '6px 12px', textAlign: 'left' as const, fontFamily: F, fontSize: '10px', color: '#888780', fontWeight: 400, textTransform: 'uppercase' as const }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {log.map((e, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F5F2EC' }}>
                      <td style={{ padding: '6px 12px', fontFamily: SERIF, fontSize: '15px' }}>{e.note}</td>
                      <td style={{ padding: '6px 12px', fontFamily: SERIF, fontSize: '15px', color: e.note === e.result ? '#4CAF50' : '#E53935' }}>{e.result}</td>
                      <td style={{ padding: '6px 12px', fontFamily: F, fontSize: '12px', color: e.latencyMs > 400 ? '#E53935' : '#4CAF50' }}>{e.latencyMs}ms</td>
                      <td style={{ padding: '6px 12px', fontFamily: F, fontSize: '12px', color: '#888780' }}>{e.frames}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
