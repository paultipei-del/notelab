'use client'

import { useState, useRef, useCallback } from 'react'
import { SADPitchDetector } from '@/lib/sadDetector'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

function noteToMidi(name: string): number {
  const m = name.match(/^([A-G]#?)(\d)$/)
  if (!m) return 60
  return (parseInt(m[2]) + 1) * 12 + NOTE_NAMES.indexOf(m[1])
}
function midiToFreq(midi: number) { return 440 * Math.pow(2, (midi - 69) / 12) }
function freqToCents(hz: number, midi: number) {
  return Math.round(1200 * Math.log2(hz / midiToFreq(midi)))
}
function notePitchClass(n: string) { return n.replace(/\d+$/, '') }
function pitchMatch(a: string, b: string) {
  if (a === b) return true
  const E: Record<string,string> = {'C#':'Db','Db':'C#','D#':'Eb','Eb':'D#','F#':'Gb','Gb':'F#','G#':'Ab','Ab':'G#','A#':'Bb','Bb':'A#'}
  const apc = notePitchClass(a), bpc = notePitchClass(b)
  return a.match(/\d+$/)?.[0] === b.match(/\d+$/)?.[0] && E[apc] === bpc
}

const SEQUENCES: Record<string, string[]> = {
  Chromatic: ['C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4','C5'],
  'Chromatic 3': ['C3','C#3','D3','D#3','E3','F3','F#3','G3','G#3','A3','A#3','B3','C4'],
  Fifths:    ['C4','G4','D5','A4','E5','B4','F#4','C#5','G#4','D#5','A#4','F5','C5'],
  'Fifths 3': ['C3','G3','D3','A3','E3','B3','F#3','C#3','G#3','D#3','A#3','F3','C4'],
  Octaves:   ['C3','C4','C5','G3','G4','G5','A3','A4','A5'],
  Wide:      ['C4','C6','G2','B5','A3','D#5','F2','E6','C4'],
  'Mixed 3-4': ['C3','C4','G3','G4','E3','E4','A3','A4','D3','D4','B3','B4'],
  'C5 Focus': ['C5','C5','C5','C5','C5','B4','C5','D5','C5','G4','C5','C4','C5'],
  'Octave C': ['C3','C4','C5','C6','C5','C4','C3','C5','C4','C5'],
  'Around C5': ['B4','C5','D5','C5','A4','C5','E5','C5','G4','C5','F5','C5'],
}

interface NoteResult {
  target: string
  detected: string
  correct: boolean
  latencyMs: number
  frames: number
  falsePositivesBefore: string[]  // wrong notes detected during dead window
  bleedAfter: string[]            // wrong notes detected after correct
  cents: number
  rms: number
}

interface RunSummary {
  params: { deadWindow: number; windowSize: number; stableThreshold: number; levelThreshold: number }
  sequence: string
  notes: NoteResult[]
  accuracy: number
  avgLatencyMs: number
  falsePositiveCount: number
  bleedCount: number
}

let micStream: MediaStream | null = null
let micCtx: AudioContext | null = null

export default function PitchDiagnostic() {
  // Params
  const [deadWindow, setDeadWindow] = useState(1000)
  const [windowSize, setWindowSize] = useState(8)
  const [stableThreshold, setStableThreshold] = useState(6)
  const [levelThreshold, setLevelThreshold] = useState(0.008)
  const [selectedSeq, setSelectedSeq] = useState('Chromatic')
  const [listenTimeout, setListenTimeout] = useState(4000)

  // State
  const [phase, setPhase] = useState<'idle'|'init'|'waiting'|'dead'|'listening'|'done'>('idle')
  const [noteIdx, setNoteIdx] = useState(0)
  const [currentNote, setCurrentNote] = useState('')
  const [liveDetected, setLiveDetected] = useState('')
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [copied, setCopied] = useState(false)
  const [currentResults, setCurrentResults] = useState<NoteResult[]>([])

  const detectorRef = useRef<SADPitchDetector | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const bufRef = useRef<Float32Array | null>(null)
  const rafRef = useRef(0)
  const abortRef = useRef(false)

  // Per-note tracking
  const phaseRef = useRef<'dead'|'listening'>('dead')
  const noteStartRef = useRef(0)
  const deadEndRef = useRef(0)
  const firstCorrectRef = useRef(0)
  const frameCountRef = useRef(0)
  const falsePositivesRef = useRef<string[]>([])
  const bleedRef = useRef<string[]>([])
  const noteResultsRef = useRef<NoteResult[]>([])
  const currentNoteRef = useRef('')
  const seqRef = useRef<string[]>([])
  const noteIdxRef = useRef(0)

  async function initMic() {
    if (!micStream || !micStream.active) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    }
    if (!micCtx || micCtx.state === 'closed') micCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (micCtx.state === 'suspended') await micCtx.resume()
    if (!analyserRef.current) {
      const source = micCtx.createMediaStreamSource(micStream)
      const analyser = micCtx.createAnalyser()
      analyser.fftSize = 4096
      source.connect(analyser)
      analyserRef.current = analyser
      bufRef.current = new Float32Array(4096)
    }
    detectorRef.current = new SADPitchDetector(micCtx.sampleRate, { windowSize, stableThreshold, levelThreshold })
  }

  function flushDetector() {
    detectorRef.current?.reset()
    if (bufRef.current && analyserRef.current) {
      for (let i = 0; i < 8; i++) {
        analyserRef.current.getFloatTimeDomainData(bufRef.current as unknown as Float32Array<ArrayBuffer>)
      }
    }
    frameCountRef.current = 0
    falsePositivesRef.current = []
    bleedRef.current = []
    firstCorrectRef.current = 0
  }

  function startNote(idx: number) {
    const note = seqRef.current[idx]
    currentNoteRef.current = note
    noteIdxRef.current = idx
    noteStartRef.current = performance.now()
    deadEndRef.current = noteStartRef.current + deadWindow
    phaseRef.current = 'dead'
    setNoteIdx(idx)
    setCurrentNote(note)
    setPhase('dead')
    setLiveDetected('')
    flushDetector()
    // Restart RAF loop for this note
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }

  function finishNote(detected: string, latencyMs: number, cents: number, rms: number) {
    const target = currentNoteRef.current
    const correct = pitchMatch(detected, target)
    const result: NoteResult = {
      target, detected, correct, latencyMs,
      frames: frameCountRef.current,
      falsePositivesBefore: [...falsePositivesRef.current],
      bleedAfter: [...bleedRef.current],
      cents, rms,
    }
    noteResultsRef.current = [...noteResultsRef.current, result]
    setCurrentResults([...noteResultsRef.current])

    const nextIdx = noteIdxRef.current + 1
    if (nextIdx >= seqRef.current.length) {
      finishRun()
    } else {
      // Signal tick to advance — don't call startNote directly inside tick
      setTimeout(() => startNote(nextIdx), 0)
    }
  }

  function finishRun() {
    cancelAnimationFrame(rafRef.current)
    const notes = noteResultsRef.current
    const correct = notes.filter(n => n.correct).length
    const summary: RunSummary = {
      params: { deadWindow, windowSize, stableThreshold, levelThreshold },
      sequence: selectedSeq,
      notes,
      accuracy: Math.round(correct / notes.length * 100),
      avgLatencyMs: Math.round(notes.reduce((s, n) => s + n.latencyMs, 0) / notes.length),
      falsePositiveCount: notes.reduce((s, n) => s + n.falsePositivesBefore.length, 0),
      bleedCount: notes.reduce((s, n) => s + n.bleedAfter.length, 0),
    }
    setRuns(prev => [summary, ...prev])
    setPhase('done')
    abortRef.current = false
  }

  function tick() {
    if (!analyserRef.current || !bufRef.current || !detectorRef.current || abortRef.current) return
    analyserRef.current.getFloatTimeDomainData(bufRef.current as unknown as Float32Array<ArrayBuffer>)

    let sum = 0
    for (let i = 0; i < bufRef.current.length; i++) sum += bufRef.current[i] ** 2
    const rms = Math.sqrt(sum / bufRef.current.length)

    const result = detectorRef.current.update(bufRef.current)
    frameCountRef.current++

    const now = performance.now()
    const target = currentNoteRef.current

    if (result?.stable) {
      setLiveDetected(result.name)

      if (phaseRef.current === 'dead') {
        // During dead window — track false positives
        if (!pitchMatch(result.name, target)) {
          falsePositivesRef.current.push(result.name)
        }
        // Check if dead window expired
        if (now >= deadEndRef.current) {
          phaseRef.current = 'listening'
          setPhase('listening')
        }
      } else {
        // Listening phase
        const midi = noteToMidi(target)
        const cents = freqToCents(result.freq, midi)

        if (pitchMatch(result.name, target)) {
          if (firstCorrectRef.current === 0) firstCorrectRef.current = now
          const latency = now - deadEndRef.current
          finishNote(result.name, Math.round(latency), cents, Math.round(rms * 10000) / 10000)
          // Don't schedule next frame — startNote will restart via setTimeout
          return
        } else {
          // Wrong note during listening — bleed
          bleedRef.current.push(result.name)
        }
      }
    }

    // Timeout — no correct note detected
    if (phaseRef.current === 'listening' && now - deadEndRef.current > listenTimeout) {
      finishNote('(none)', listenTimeout, 0, 0)
      return
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  async function startRun() {
    setPhase('init')
    abortRef.current = false
    noteResultsRef.current = []
    setCurrentResults([])
    await initMic()
    seqRef.current = SEQUENCES[selectedSeq]
    startNote(0)
  }

  function abort() {
    abortRef.current = true
    cancelAnimationFrame(rafRef.current)
    setPhase('idle')
  }

  const seq = SEQUENCES[selectedSeq]
  const isDone = phase === 'done'
  const isRunning = phase !== 'idle' && phase !== 'done'
  const latestRun = runs[0]

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #D9CFAE', background: '#ECE3CC' }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '20px', color: '#2A2318' }}>Pitch Detection Calibration</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isRunning && <button onClick={abort} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #D9CFAE', background: '#ECE3CC', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', cursor: 'pointer' }}>Abort</button>}
          {!isRunning && <button onClick={startRun} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: '#1A1A18', color: 'white', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}>▶ Start Test</button>}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>

        {/* Left: params + instructions */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>

          {/* Instructions */}
          <div style={{ background: isRunning ? '#FAEEDA' : 'white', borderRadius: '16px', border: '1px solid ' + (isRunning ? '#B5402A' : '#D9CFAE'), padding: '20px' }}>
            {phase === 'idle' && (
              <>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Instructions</p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', fontWeight: 400, color: '#2A2318', lineHeight: 1.7 }}>
                  Set your parameters, choose a sequence, then press Start. The tool will prompt you to play each note on the piano in order. Play the note, hold it briefly, then lift. It will automatically advance.
                </p>
              </>
            )}
            {(phase === 'dead' || phase === 'listening') && (
              <>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B5402A', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
                  {phase === 'dead' ? `Clearing… (${deadWindow}ms)` : 'Listening'}
                </p>
                <p style={{ fontFamily: SERIF, fontSize: '56px', fontWeight: 300, color: '#2A2318', lineHeight: 1, marginBottom: '8px' }}>{currentNote}</p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>Note {noteIdx + 1} of {seq.length}</p>
                {liveDetected && (
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-meta)', color: pitchMatch(liveDetected, currentNote) ? '#4CAF50' : '#E53935', marginTop: '8px' }}>
                    Hearing: {liveDetected}
                  </p>
                )}
              </>
            )}
            {phase === 'done' && (
              <>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#4CAF50', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Complete</p>
                <p style={{ fontFamily: SERIF, fontSize: '28px', fontWeight: 300, color: '#2A2318' }}>{latestRun?.accuracy}% accurate</p>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', marginTop: '4px' }}>Avg latency: {latestRun?.avgLatencyMs}ms</p>
              </>
            )}
          </div>

          {/* Progress bar */}
          {isRunning && (
            <div style={{ background: '#ECE3CC', borderRadius: '8px', border: '1px solid #D9CFAE', padding: '4px' }}>
              <div style={{ height: '6px', borderRadius: '4px', background: '#B5402A', width: `${(noteIdx / seq.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>
          )}

          {/* Sequence selector */}
          <div style={{ background: '#ECE3CC', borderRadius: '16px', border: '1px solid #D9CFAE', padding: '20px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Sequence</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              {Object.keys(SEQUENCES).map(seq => (
                <button key={seq} onClick={() => setSelectedSeq(seq)} disabled={isRunning}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid ' + (selectedSeq === seq ? '#1A1A18' : '#D9CFAE'), background: selectedSeq === seq ? '#1A1A18' : 'white', color: selectedSeq === seq ? 'white' : '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', cursor: isRunning ? 'default' : 'pointer', textAlign: 'left' as const }}>
                  {seq} <span style={{ opacity: 0.6 }}>({SEQUENCES[seq].join(' → ').slice(0, 20)}…)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div style={{ background: '#ECE3CC', borderRadius: '16px', border: '1px solid #D9CFAE', padding: '20px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>Parameters</p>
            {([
              ['Dead Window (ms)', deadWindow, 0, 1000, 50, setDeadWindow],
              ['Window Size', windowSize, 4, 20, 1, setWindowSize],
              ['Stable Threshold', stableThreshold, 2, 16, 1, setStableThreshold],
              ['Level Threshold', levelThreshold, 0.001, 0.05, 0.001, setLevelThreshold],
              ['Listen Timeout (ms)', listenTimeout, 1000, 8000, 500, setListenTimeout],
            ] as [string, number, number, number, number, (v: number) => void][]).map(([label, value, min, max, step, set]) => (
              <div key={label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#2A2318' }}>{label}</p>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: '#B5402A' }}>{value}</p>
                </div>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={e => set(parseFloat(e.target.value))} disabled={isRunning}
                  style={{ width: '100%', accentColor: '#B5402A' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: results */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>

          {/* Live note results */}
          {(isRunning || isDone) && currentResults.length > 0 && (
            <div style={{ background: '#ECE3CC', borderRadius: '16px', border: '1px solid #D9CFAE', padding: '20px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Results</p>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                      {['Target','Detected','Correct','Latency','FP Before','Bleed After','Cents'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left' as const, fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', fontWeight: 400, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...currentResults].reverse().map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F2EDDF', background: r.correct ? 'white' : '#FFF5F5' }}>
                        <td style={{ padding: '6px 10px', fontFamily: SERIF, fontSize: 'var(--nl-text-body)' }}>{r.target}</td>
                        <td style={{ padding: '6px 10px', fontFamily: SERIF, fontSize: 'var(--nl-text-body)', color: r.correct ? '#4CAF50' : '#E53935' }}>{r.detected}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', background: r.correct ? '#E8F5E9' : '#FDECEA', color: r.correct ? '#4CAF50' : '#E53935', fontFamily: F, fontSize: 'var(--nl-text-compact)' }}>
                            {r.correct ? '✓' : '✗'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: r.latencyMs > 400 ? '#E53935' : '#1A1A18' }}>{r.latencyMs}ms</td>
                        <td style={{ padding: '6px 10px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: r.falsePositivesBefore.length > 0 ? '#E53935' : '#7A7060' }}>
                          {r.falsePositivesBefore.length > 0 ? r.falsePositivesBefore.join(', ') : '—'}
                        </td>
                        <td style={{ padding: '6px 10px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: r.bleedAfter.length > 0 ? '#E53935' : '#7A7060' }}>
                          {r.bleedAfter.length > 0 ? r.bleedAfter.join(', ') : '—'}
                        </td>
                        <td style={{ padding: '6px 10px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: Math.abs(r.cents) > 20 ? '#E53935' : '#7A7060' }}>
                          {r.cents !== 0 ? (r.cents > 0 ? '+' : '') + r.cents + '¢' : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Run history */}
          {runs.length > 0 && (
            <div style={{ background: '#ECE3CC', borderRadius: '16px', border: '1px solid #D9CFAE', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Run History</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => {
                    const NL = String.fromCharCode(10)
                    const TAB = String.fromCharCode(9)
                    const lines: string[] = ['=== PITCH DIAGNOSTIC RESULTS ===']
                    runs.forEach((run, ri) => {
                      lines.push(NL + 'RUN ' + (ri+1) + ': ' + run.sequence + ' | Accuracy: ' + run.accuracy + '% | Avg Latency: ' + run.avgLatencyMs + 'ms | FP: ' + run.falsePositiveCount + ' | Bleed: ' + run.bleedCount)
                      lines.push('Params: deadWindow=' + run.params.deadWindow + 'ms windowSize=' + run.params.windowSize + ' stableThreshold=' + run.params.stableThreshold + ' levelThreshold=' + run.params.levelThreshold)
                      lines.push('TARGET' + TAB + 'DETECTED' + TAB + 'CORRECT' + TAB + 'LATENCY' + TAB + 'FP_BEFORE' + TAB + 'BLEED_AFTER' + TAB + 'CENTS')
                      run.notes.forEach(n => {
                        lines.push([n.target, n.detected, n.correct ? 'Y' : 'N', n.latencyMs + 'ms', n.falsePositivesBefore.join(' ') || '-', n.bleedAfter.join(' ') || '-', n.cents ? ((n.cents > 0 ? '+' : '') + n.cents + 'c') : '-'].join(TAB))
                      })
                    })
                    navigator.clipboard.writeText(lines.join(NL))
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }} style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: copied ? '#4CAF50' : '#7A7060', background: 'none', border: '1px solid #D9CFAE', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}>
                    {copied ? '✓ Copied' : 'Copy All'}
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setRuns([])} style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', background: 'none', border: '1px solid #D9CFAE', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}>Clear</button>
                </div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                    {['Seq','Accuracy','Avg Latency','False Pos','Bleed','Dead Win','Win Size','Stable','Level'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left' as const, fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', fontWeight: 400, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F2EDDF', background: i === 0 ? '#FAFAF8' : 'white' }}>
                      <td style={{ padding: '6px 8px', fontFamily: F, fontSize: 'var(--nl-text-compact)' }}>{run.sequence}</td>
                      <td style={{ padding: '6px 8px', fontFamily: F, fontSize: 'var(--nl-text-compact)', fontWeight: 400, color: run.accuracy >= 90 ? '#4CAF50' : run.accuracy >= 70 ? '#B5402A' : '#E53935' }}>{run.accuracy}%</td>
                      <td style={{ padding: '6px 8px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: run.avgLatencyMs > 400 ? '#E53935' : '#1A1A18' }}>{run.avgLatencyMs}ms</td>
                      <td style={{ padding: '6px 8px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: run.falsePositiveCount > 0 ? '#E53935' : '#7A7060' }}>{run.falsePositiveCount}</td>
                      <td style={{ padding: '6px 8px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: run.bleedCount > 0 ? '#E53935' : '#7A7060' }}>{run.bleedCount}</td>
                      <td style={{ padding: '6px 8px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>{run.params.deadWindow}ms</td>
                      <td style={{ padding: '6px 8px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>{run.params.windowSize}</td>
                      <td style={{ padding: '6px 8px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>{run.params.stableThreshold}</td>
                      <td style={{ padding: '6px 8px', fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060' }}>{run.params.levelThreshold}</td>
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
