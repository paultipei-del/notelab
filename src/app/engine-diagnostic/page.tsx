'use client'

import { useState, useRef, useEffect } from 'react'
import { SADPitchDetector } from '@/lib/sadDetector'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

// ── Same constants as PlayItCard2 ─────────────────────────────────────────
const DEFAULT_DEAD_WINDOW = 800
const NOTE_DEAD_WINDOWS: Record<string, number> = {
  'C5': 1400, 'B4': 1100, 'C4': 1100, 'B3': 1100,
}
function deadWindowForNote(note: string): number {
  return NOTE_DEAD_WINDOWS[note.replace(/[#b]/g, '')] ?? DEFAULT_DEAD_WINDOW
}

const WRONG_COOLDOWN_MS = 1000
const WRONG_SEMITONE_RANGE = 25

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

const ENHARMONICS: Record<string,string> = {
  'C#':'Db','Db':'C#','D#':'Eb','Eb':'D#',
  'F#':'Gb','Gb':'F#','G#':'Ab','Ab':'G#','A#':'Bb','Bb':'A#',
}
function pitchMatch(played: string, target: string): boolean {
  if (played === target) return true
  const pp = played.replace(/\d+$/,''), tp = target.replace(/\d+$/,'')
  const po = played.match(/\d+$/)?.[0], to = target.match(/\d+$/)?.[0]
  return po === to && ENHARMONICS[tp] === pp
}

// ── Test sequences ────────────────────────────────────────────────────────
const SEQUENCES: Record<string, string[]> = {
  'Chromatic 4': ['C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4','C5'],
  'Chromatic 5': ['C5','C#5','D5','D#5','E5','F5','F#5','G5'],
  'Fifths 4':   ['C4','G4','D5','A4','E5','B4','F#4','C#5','G#4','D#5','A#4','F5','C5'],
  'Octaves':    ['C3','C4','C5','G3','G4','G5','A3','A4','A5'],
  'Around C5':  ['B4','C5','D5','C5','A4','C5','E5','C5','G4','C5'],
  'Around B3':  ['A3','B3','C4','B3','G3','B3','D4','B3','E3','B3'],
  'Grand Mix':  ['C4','G4','C5','E4','A4','D5','F4','B4','C5','G3','E5','F#4'],
}

interface FrameEvent {
  t: number
  type: 'detection' | 'stable' | 'silence' | 'wrong' | 'correct' | 'dead_window' | 'vote_clear'
  note?: string
  midi?: number
  hz?: number
  cents?: number
  rms?: number
  votes?: number
  points?: number
}

interface CardResult {
  target: string
  targetMidi: number
  deadWindowMs: number
  // Timeline
  frames: FrameEvent[]
  // Outcomes
  outcome: 'correct' | 'wrong' | 'timeout'
  detectedAs: string
  latencyMs: number        // time from accept-start to correct detection
  totalTimeMs: number      // total card time including dead window
  wrongsBeforeCorrect: string[]  // wrong stables detected before correct
  fpDuringDead: string[]   // detections during dead window
  firstStableAfterDead: string  // first stable detection after dead window clears
  firstStableMs: number    // ms after dead window cleared
  prevNote: string
  // Audio
  peakRmsAtCorrect: number
  centsAtCorrect: number
}

interface RunResult {
  sequence: string
  params: {
    defaultDeadWindow: number
    noteDeadWindows: Record<string,number>
    wrongCooldown: number
    wrongSemitoneRange: number
    windowSize: number
    stableThreshold: number
    levelThreshold: number
  }
  cards: CardResult[]
  accuracy: number
  avgLatencyMs: number
  avgTotalTimeMs: number
  wrongCount: number
  timeoutCount: number
  timestamp: string
}

let micStream: MediaStream | null = null
let micCtx: AudioContext | null = null
let sadAnalyser: AnalyserNode | null = null
let sadDetector: SADPitchDetector | null = null
let sadBuf: Float32Array | null = null
let rafHandle = 0

export default function EngineDiagnostic() {
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'idle'|'running'|'done'>('idle')
  const [selectedSeq, setSelectedSeq] = useState('Grand Mix')
  const [currentNote, setCurrentNote] = useState('')
  const [currentPhase, setCurrentPhase] = useState<'dead'|'accepting'|''>('')
  const [liveDetected, setLiveDetected] = useState('')
  const [liveStatus, setLiveStatus] = useState<'correct'|'wrong'|''>('')
  const [progress, setProgress] = useState(0)
  const [runs, setRuns] = useState<RunResult[]>([])
  const [currentCards, setCurrentCards] = useState<CardResult[]>([])
  const [copied, setCopied] = useState(false)

  // Params
  const [windowSize, setWindowSize] = useState(10)
  const [stableThreshold, setStableThreshold] = useState(15)
  const [levelThreshold, setLevelThreshold] = useState(0.01)
  const [listenTimeout, setListenTimeout] = useState(5000)

  const abortRef = useRef(false)
  const seqRef = useRef<string[]>([])
  const cardsRef = useRef<CardResult[]>([])
  const noteIdxRef = useRef(0)
  const currentCardRef = useRef<CardResult | null>(null)
  const acceptingRef = useRef(false)
  const cardStartRef = useRef(0)
  const deadEndRef = useRef(0)
  const prevMidiRef = useRef(-1)
  const lastWrongRef = useRef(0)
  const framesRef = useRef<FrameEvent[]>([])
  const wrongsRef = useRef<string[]>([])
  const fpDuringDeadRef = useRef<string[]>([])
  const firstStableAfterDeadRef = useRef('')
  const firstStableMsRef = useRef(-1)
  const peakRmsRef = useRef(0)
  const centsAtCorrectRef = useRef(0)
  const doneRef = useRef(false)

  async function initMic() {
    if (!micStream || !micStream.active) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    }
    if (!micCtx || micCtx.state === 'closed') micCtx = new AudioContext()
    if (micCtx.state === 'suspended') await micCtx.resume()
    if (!sadAnalyser) {
      const source = micCtx.createMediaStreamSource(micStream)
      sadAnalyser = micCtx.createAnalyser()
      sadAnalyser.fftSize = 4096
      source.connect(sadAnalyser)
      sadBuf = new Float32Array(4096)
      sadDetector = new SADPitchDetector(micCtx.sampleRate, { windowSize, stableThreshold, levelThreshold })
    }
  }

  function startCard(idx: number) {
    const note = seqRef.current[idx]
    const deadWindow = deadWindowForNote(note)
    const prevNote = idx > 0 ? seqRef.current[idx - 1] : ''

    const card: CardResult = {
      target: note,
      targetMidi: noteToMidi(note),
      deadWindowMs: deadWindow,
      frames: [],
      outcome: 'timeout',
      detectedAs: '—',
      latencyMs: -1,
      totalTimeMs: -1,
      wrongsBeforeCorrect: [],
      fpDuringDead: [],
      firstStableAfterDead: '—',
      firstStableMs: -1,
      prevNote,
      peakRmsAtCorrect: 0,
      centsAtCorrect: 0,
    }

    currentCardRef.current = card
    framesRef.current = []
    wrongsRef.current = []
    fpDuringDeadRef.current = []
    firstStableAfterDeadRef.current = ''
    firstStableMsRef.current = -1
    peakRmsRef.current = 0
    centsAtCorrectRef.current = 0
    doneRef.current = false
    acceptingRef.current = false
    noteIdxRef.current = idx

    cardStartRef.current = performance.now()
    deadEndRef.current = cardStartRef.current + deadWindow

    sadDetector!.clearVotes()

    setCurrentNote(note)
    setCurrentPhase('dead')
    setLiveDetected('')
    setLiveStatus('')
    setProgress(idx / seqRef.current.length)

    cancelAnimationFrame(rafHandle)
    rafHandle = requestAnimationFrame(tick)
  }

  function finishCard(outcome: 'correct' | 'wrong' | 'timeout', detectedAs: string, latencyMs: number) {
    if (!currentCardRef.current) return
    const card = currentCardRef.current
    const now = performance.now()

    card.frames = [...framesRef.current]
    card.outcome = outcome
    card.detectedAs = detectedAs
    card.latencyMs = Math.round(latencyMs)
    card.totalTimeMs = Math.round(now - cardStartRef.current)
    card.wrongsBeforeCorrect = [...wrongsRef.current]
    card.fpDuringDead = [...fpDuringDeadRef.current]
    card.firstStableAfterDead = firstStableAfterDeadRef.current || '—'
    card.firstStableMs = firstStableMsRef.current
    card.peakRmsAtCorrect = Math.round(peakRmsRef.current * 10000) / 10000
    card.centsAtCorrect = centsAtCorrectRef.current

    cardsRef.current = [...cardsRef.current, card]
    setCurrentCards([...cardsRef.current])

    const nextIdx = noteIdxRef.current + 1
    if (nextIdx >= seqRef.current.length || abortRef.current) {
      finishRun()
    } else {
      setTimeout(() => startCard(nextIdx), 50)
    }
  }

  function finishRun() {
    cancelAnimationFrame(rafHandle)
    const cards = cardsRef.current
    const correct = cards.filter(c => c.outcome === 'correct').length
    const latencies = cards.filter(c => c.latencyMs >= 0).map(c => c.latencyMs)
    const run: RunResult = {
      sequence: selectedSeq,
      params: {
        defaultDeadWindow: DEFAULT_DEAD_WINDOW,
        noteDeadWindows: NOTE_DEAD_WINDOWS,
        wrongCooldown: WRONG_COOLDOWN_MS,
        wrongSemitoneRange: WRONG_SEMITONE_RANGE,
        windowSize, stableThreshold, levelThreshold,
      },
      cards,
      accuracy: Math.round(correct / cards.length * 100),
      avgLatencyMs: latencies.length ? Math.round(latencies.reduce((a,b) => a+b,0) / latencies.length) : 0,
      avgTotalTimeMs: Math.round(cards.reduce((a,c) => a+c.totalTimeMs,0) / cards.length),
      wrongCount: cards.filter(c => c.outcome === 'wrong').length,
      timeoutCount: cards.filter(c => c.outcome === 'timeout').length,
      timestamp: new Date().toISOString(),
    }
    setRuns(prev => [run, ...prev])
    setPhase('done')
    setRunning(false)
    setProgress(1)
  }

  function tick() {
    if (!sadAnalyser || !sadBuf || !sadDetector || doneRef.current || abortRef.current) return
    sadAnalyser.getFloatTimeDomainData(sadBuf as unknown as Float32Array<ArrayBuffer>)
    const now = performance.now()

    // RMS
    let rmsSum = 0
    for (let i = 0; i < sadBuf.length; i++) rmsSum += sadBuf[i] * sadBuf[i]
    const rms = Math.sqrt(rmsSum / sadBuf.length)
    if (rms > peakRmsRef.current) peakRmsRef.current = rms

    const inDead = now < deadEndRef.current
    const target = seqRef.current[noteIdxRef.current]
    const targetMidi = noteToMidi(target)
    const timeFromDeadEnd = now - deadEndRef.current

    if (inDead) {
      setCurrentPhase('dead')
      // Still run detector during dead to warm filters, but record as FP
      const result = sadDetector.update(sadBuf)
      if (result?.stable) {
        fpDuringDeadRef.current.push(result.name)
        framesRef.current.push({ t: now - cardStartRef.current, type: 'stable', note: result.name, midi: result.midi, rms })
        setLiveDetected(result.name)
      }
    } else {
      if (!acceptingRef.current) {
        acceptingRef.current = true
        sadDetector.clearVotes()
        setCurrentPhase('accepting')
        framesRef.current.push({ t: now - cardStartRef.current, type: 'vote_clear' })
      }

      const result = sadDetector.update(sadBuf)

      if (result) {
        const cents = freqToCents(result.freq, result.midi)
        framesRef.current.push({ t: now - cardStartRef.current, type: result.stable ? 'stable' : 'detection', note: result.name, midi: result.midi, hz: result.freq, cents, rms })

        if (result.stable) {
          setLiveDetected(result.name)

          // Record first stable after dead
          if (!firstStableAfterDeadRef.current) {
            firstStableAfterDeadRef.current = result.name
            firstStableMsRef.current = Math.round(timeFromDeadEnd)
          }

          if (pitchMatch(result.name, target)) {
            doneRef.current = true
            centsAtCorrectRef.current = cents
            peakRmsRef.current = rms
            prevMidiRef.current = result.midi
            setLiveStatus('correct')
            finishCard('correct', result.name, timeFromDeadEnd)
            return
          } else {
            const semDist = Math.abs(result.midi - targetMidi)
            const isOctaveOfPrev = prevMidiRef.current >= 0 &&
              (result.midi === prevMidiRef.current + 12 || result.midi === prevMidiRef.current - 12)
            const cooldownOk = now - lastWrongRef.current > WRONG_COOLDOWN_MS

            if (semDist <= WRONG_SEMITONE_RANGE && !isOctaveOfPrev && cooldownOk) {
              wrongsRef.current.push(result.name)
              lastWrongRef.current = now
              setLiveStatus('wrong')
              framesRef.current.push({ t: now - cardStartRef.current, type: 'wrong', note: result.name })
            }
          }
        }
      }

      // Timeout
      if (timeFromDeadEnd > listenTimeout) {
        doneRef.current = true
        finishCard('timeout', '—', -1)
        return
      }
    }

    rafHandle = requestAnimationFrame(tick)
  }

  async function startRun() {
    setPhase('running')
    setRunning(true)
    abortRef.current = false
    cardsRef.current = []
    setCurrentCards([])
    prevMidiRef.current = -1
    lastWrongRef.current = 0
    await initMic()
    sadDetector = new SADPitchDetector(micCtx!.sampleRate, { windowSize, stableThreshold, levelThreshold })
    seqRef.current = SEQUENCES[selectedSeq]
    startCard(0)
  }

  function abort() {
    abortRef.current = true
    cancelAnimationFrame(rafHandle)
    setPhase('idle')
    setRunning(false)
  }

  function copyAll() {
    const NL = '\n', TAB = '\t'
    const lines: string[] = ['=== ENGINE DIAGNOSTIC RESULTS ===']

    runs.forEach((run, ri) => {
      lines.push(NL + `RUN ${ri+1}: ${run.sequence} | ${run.timestamp}`)
      lines.push(`Accuracy: ${run.accuracy}% | Avg Latency: ${run.avgLatencyMs}ms | Avg Total: ${run.avgTotalTimeMs}ms | Wrong: ${run.wrongCount} | Timeout: ${run.timeoutCount}`)
      lines.push(`Params: deadWindow=${run.params.defaultDeadWindow}ms windowSize=${run.params.windowSize} threshold=${run.params.stableThreshold} level=${run.params.levelThreshold}`)
      lines.push(['TARGET','PREV','OUTCOME','DETECTED','LATENCY','TOTAL','DEAD_WIN','CENTS','RMS','FIRST_STABLE','FIRST_STABLE_MS','FP_DURING_DEAD','WRONGS_BEFORE'].join(TAB))
      run.cards.forEach(c => {
        lines.push([
          c.target, c.prevNote || '—', c.outcome, c.detectedAs,
          c.latencyMs >= 0 ? c.latencyMs+'ms' : '—',
          c.totalTimeMs+'ms',
          c.deadWindowMs+'ms',
          c.centsAtCorrect ? (c.centsAtCorrect > 0 ? '+' : '')+c.centsAtCorrect+'c' : '—',
          c.peakRmsAtCorrect || '—',
          c.firstStableAfterDead,
          c.firstStableMs >= 0 ? c.firstStableMs+'ms' : '—',
          c.fpDuringDead.join(' ') || '—',
          c.wrongsBeforeCorrect.join(' ') || '—',
        ].join(TAB))
      })
    })

    navigator.clipboard.writeText(lines.join(NL))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const seq = SEQUENCES[selectedSeq]

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #DDD8CA', background: '#FDFAF3' }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '20px', color: '#2A2318' }}>Engine Diagnostic</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {running && <button onClick={abort} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #DDD8CA', background: '#FDFAF3', fontFamily: F, fontSize: 'var(--nl-text-meta)', color: '#7A7060', cursor: 'pointer' }}>Abort</button>}
          {!running && <button onClick={startRun} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: '#1A1A18', color: 'white', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer' }}>▶ Start</button>}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>

          {/* Live status */}
          <div style={{ background: liveStatus === 'correct' ? '#EAF3DE' : liveStatus === 'wrong' ? '#FDECEA' : 'white', borderRadius: '16px', border: '1px solid ' + (liveStatus === 'correct' ? '#7EC86E' : liveStatus === 'wrong' ? '#F09595' : '#DDD8CA'), padding: '20px', textAlign: 'center' as const, transition: 'all 0.15s' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
              {currentPhase === 'dead' ? '⏳ Dead Window' : currentPhase === 'accepting' ? '🎵 Listening' : 'Ready'}
            </p>
            <p style={{ fontFamily: SERIF, fontSize: '52px', fontWeight: 300, color: '#2A2318', lineHeight: 1, marginBottom: '8px' }}>{currentNote || '—'}</p>
            {liveDetected && <p style={{ fontFamily: F, fontSize: 'var(--nl-text-ui)', color: liveStatus === 'correct' ? '#4CAF50' : liveStatus === 'wrong' ? '#E53935' : '#7A7060' }}>Hearing: {liveDetected}</p>}
          </div>

          {/* Progress */}
          {running && (
            <div style={{ background: '#FDFAF3', borderRadius: '8px', border: '1px solid #DDD8CA', padding: '4px' }}>
              <div style={{ height: '6px', borderRadius: '4px', background: '#B5402A', width: `${progress * 100}%`, transition: 'width 0.3s' }} />
            </div>
          )}

          {/* Sequence */}
          <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Sequence</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              {Object.keys(SEQUENCES).map(s => (
                <button key={s} onClick={() => setSelectedSeq(s)} disabled={running}
                  style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid ' + (selectedSeq === s ? '#1A1A18' : '#DDD8CA'), background: selectedSeq === s ? '#1A1A18' : 'white', color: selectedSeq === s ? 'white' : '#7A7060', fontFamily: F, fontSize: 'var(--nl-text-compact)', cursor: running ? 'default' : 'pointer', textAlign: 'left' as const }}>
                  {s} <span style={{ opacity: 0.5 }}>({SEQUENCES[s].length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Params */}
          <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px' }}>
            <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>Parameters</p>
            {([
              ['Window Size', windowSize, 4, 20, 1, setWindowSize],
              ['Stable Threshold (pts)', stableThreshold, 5, 30, 1, setStableThreshold],
              ['Level Threshold', levelThreshold, 0.001, 0.05, 0.001, setLevelThreshold],
              ['Listen Timeout (ms)', listenTimeout, 1000, 8000, 500, setListenTimeout],
            ] as [string, number, number, number, number, (v: number) => void][]).map(([label, value, min, max, step, set]) => (
              <div key={label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#2A2318' }}>{label}</p>
                  <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#B5402A', fontWeight: 400 }}>{value}</p>
                </div>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={e => set(parseFloat(e.target.value))} disabled={running}
                  style={{ width: '100%', accentColor: '#B5402A' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: results */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>

          {/* Live card results */}
          {currentCards.length > 0 && (
            <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px' }}>
              <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Card Results</p>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 'var(--nl-text-compact)', fontFamily: F }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                      {['Target','Prev','Result','Detected','Latency','Total','Dead Win','Cents','First Stable','First ms','FP Dead','Wrongs'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left' as const, color: '#7A7060', fontWeight: 400, fontSize: 'var(--nl-text-badge)', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...currentCards].reverse().map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F2EDDF', background: c.outcome === 'correct' ? 'white' : c.outcome === 'wrong' ? '#FFF5F5' : '#FFFBF0' }}>
                        <td style={{ padding: '6px 8px', fontFamily: SERIF, fontSize: 'var(--nl-text-body)' }}>{c.target}</td>
                        <td style={{ padding: '6px 8px', color: '#7A7060' }}>{c.prevNote || '—'}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '8px', background: c.outcome === 'correct' ? '#E8F5E9' : c.outcome === 'wrong' ? '#FDECEA' : '#FFF8E1', color: c.outcome === 'correct' ? '#4CAF50' : c.outcome === 'wrong' ? '#E53935' : '#F57F17', fontSize: 'var(--nl-text-compact)' }}>
                            {c.outcome === 'correct' ? '✓' : c.outcome === 'wrong' ? '✗' : '⏱'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', fontFamily: SERIF, fontSize: 'var(--nl-text-body)', color: c.outcome === 'correct' ? '#4CAF50' : '#E53935' }}>{c.detectedAs}</td>
                        <td style={{ padding: '6px 8px', color: c.latencyMs > 500 ? '#E53935' : '#1A1A18' }}>{c.latencyMs >= 0 ? c.latencyMs+'ms' : '—'}</td>
                        <td style={{ padding: '6px 8px', color: '#7A7060' }}>{c.totalTimeMs}ms</td>
                        <td style={{ padding: '6px 8px', color: '#7A7060' }}>{c.deadWindowMs}ms</td>
                        <td style={{ padding: '6px 8px', color: Math.abs(c.centsAtCorrect) > 20 ? '#E53935' : '#7A7060' }}>{c.centsAtCorrect ? (c.centsAtCorrect > 0 ? '+' : '')+c.centsAtCorrect+'¢' : '—'}</td>
                        <td style={{ padding: '6px 8px', color: pitchMatch(c.firstStableAfterDead, c.target) ? '#4CAF50' : '#E53935' }}>{c.firstStableAfterDead}</td>
                        <td style={{ padding: '6px 8px', color: '#7A7060' }}>{c.firstStableMs >= 0 ? c.firstStableMs+'ms' : '—'}</td>
                        <td style={{ padding: '6px 8px', color: c.fpDuringDead.length > 0 ? '#E53935' : '#7A7060', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }} title={c.fpDuringDead.join(', ')}>{c.fpDuringDead.length > 0 ? c.fpDuringDead.slice(-3).join(' ') + (c.fpDuringDead.length > 3 ? '…' : '') : '—'}</td>
                        <td style={{ padding: '6px 8px', color: c.wrongsBeforeCorrect.length > 0 ? '#E53935' : '#7A7060' }}>{c.wrongsBeforeCorrect.join(' ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Run history */}
          {runs.length > 0 && (
            <div style={{ background: '#FDFAF3', borderRadius: '16px', border: '1px solid #DDD8CA', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#7A7060', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Run History</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={copyAll} style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: copied ? '#4CAF50' : '#7A7060', background: 'none', border: '1px solid #DDD8CA', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}>
                    {copied ? '✓ Copied' : 'Copy All'}
                  </button>
                  <button onClick={() => setRuns([])} style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', color: '#7A7060', background: 'none', border: '1px solid #DDD8CA', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}>Clear</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontFamily: F, fontSize: 'var(--nl-text-compact)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #EDE8DF' }}>
                    {['Seq','Accuracy','Avg Latency','Avg Total','Wrong','Timeout','Win','Threshold','Level'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left' as const, color: '#7A7060', fontWeight: 400, fontSize: 'var(--nl-text-badge)', textTransform: 'uppercase' as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F2EDDF', background: i === 0 ? '#FAFAF8' : 'white' }}>
                      <td style={{ padding: '6px 8px' }}>{r.sequence}</td>
                      <td style={{ padding: '6px 8px', color: r.accuracy >= 90 ? '#4CAF50' : r.accuracy >= 70 ? '#B5402A' : '#E53935', fontWeight: 400 }}>{r.accuracy}%</td>
                      <td style={{ padding: '6px 8px', color: r.avgLatencyMs > 500 ? '#E53935' : '#1A1A18' }}>{r.avgLatencyMs}ms</td>
                      <td style={{ padding: '6px 8px', color: '#7A7060' }}>{r.avgTotalTimeMs}ms</td>
                      <td style={{ padding: '6px 8px', color: r.wrongCount > 0 ? '#E53935' : '#7A7060' }}>{r.wrongCount}</td>
                      <td style={{ padding: '6px 8px', color: r.timeoutCount > 0 ? '#E53935' : '#7A7060' }}>{r.timeoutCount}</td>
                      <td style={{ padding: '6px 8px', color: '#7A7060' }}>{r.params.windowSize}</td>
                      <td style={{ padding: '6px 8px', color: '#7A7060' }}>{r.params.stableThreshold}</td>
                      <td style={{ padding: '6px 8px', color: '#7A7060' }}>{r.params.levelThreshold}</td>
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
