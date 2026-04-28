'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

const MIN_BPM = 20
const MAX_BPM = 400

const TEMPOS: Array<[number, number, string]> = [
  [20, 24, 'larghissimo'],
  [25, 45, 'grave'],
  [46, 52, 'largo'],
  [53, 60, 'larghetto'],
  [61, 66, 'adagio'],
  [67, 76, 'adagietto'],
  [77, 85, 'andante'],
  [86, 98, 'andantino'],
  [99, 109, 'moderato'],
  [110, 121, 'allegretto'],
  [122, 140, 'allegro'],
  [141, 168, 'vivace'],
  [169, 200, 'presto'],
  [201, 400, 'prestissimo'],
]

const SILENT_MP3 =
  'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'

function tempoName(bpm: number): string {
  for (const [min, max, label] of TEMPOS) {
    if (bpm >= min && bpm <= max) return label
  }
  return ''
}

export default function MetronomePage() {
  const [bpm, setBpmState] = useState(120)
  const [playing, setPlaying] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const nextBeatRef = useRef(0)
  const bpmRef = useRef(120)
  const playingRef = useRef(false)
  const wakeLockRef = useRef<any>(null)
  const silentAudioRef = useRef<HTMLAudioElement | null>(null)

  const setBpm = useCallback((value: number) => {
    const next = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(value)))
    bpmRef.current = next
    setBpmState(next)
    if (playingRef.current && audioContextRef.current) {
      nextBeatRef.current = audioContextRef.current.currentTime + 0.05
    }
  }, [])

  const beep = useCallback((t: number) => {
    const actx = audioContextRef.current
    if (!actx) return
    try {
      const o = actx.createOscillator()
      const g = actx.createGain()
      o.connect(g)
      g.connect(actx.destination)
      o.frequency.value = 1200
      g.gain.setValueAtTime(0.8, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
      o.start(t)
      o.stop(t + 0.1)
    } catch {
      // Ignore audio scheduling errors from interrupted contexts.
    }
  }, [])

  const tick = useCallback(() => {
    const actx = audioContextRef.current
    if (!actx || !playingRef.current) return
    const now = actx.currentTime
    const interval = 60 / bpmRef.current
    while (nextBeatRef.current < now + 0.12) {
      beep(nextBeatRef.current)
      nextBeatRef.current += interval
    }
  }, [beep])

  const startScheduler = useCallback(() => {
    const actx = audioContextRef.current
    if (!actx) return
    nextBeatRef.current = actx.currentTime + 0.05
    if (tickerRef.current) clearInterval(tickerRef.current)
    tickerRef.current = setInterval(tick, 25)
  }, [tick])

  const unlockIOS = useCallback(() => {
    try {
      if (!silentAudioRef.current) {
        const audio = new Audio(SILENT_MP3)
        audio.loop = true
        audio.volume = 0.001
        silentAudioRef.current = audio
      }
      void silentAudioRef.current.play().catch(() => undefined)
    } catch {
      // No-op for unsupported browsers.
    }
  }, [])

  const requestWakeLock = useCallback(async () => {
    try {
      const wakeLockApi = (navigator as any).wakeLock
      if (!wakeLockApi) return
      const lock = await wakeLockApi.request('screen')
      wakeLockRef.current = lock
      lock.addEventListener('release', () => {
        wakeLockRef.current = null
      })
    } catch {
      // Ignore if permission denied / unsupported.
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    const lock = wakeLockRef.current
    if (!lock) return
    void lock.release().catch(() => undefined)
    wakeLockRef.current = null
  }, [])

  const stop = useCallback(() => {
    playingRef.current = false
    setPlaying(false)
    if (tickerRef.current) {
      clearInterval(tickerRef.current)
      tickerRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    unlockIOS()

    const existing = audioContextRef.current
    if (existing) {
      try {
        await existing.close()
      } catch {
        // Ignore stale context close errors.
      }
      audioContextRef.current = null
    }

    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) {
      window.alert('Web Audio not supported on this browser.')
      return
    }

    const actx = new AC()
    audioContextRef.current = actx

    try {
      const buf = actx.createBuffer(1, 1, actx.sampleRate)
      const src = actx.createBufferSource()
      src.buffer = buf
      src.connect(actx.destination)
      src.start(0)
    } catch {
      // Some browsers may reject silent unlock buffer.
    }

    playingRef.current = true
    setPlaying(true)

    if (actx.state === 'suspended') {
      try {
        await actx.resume()
      } catch {
        // Continue anyway; scheduler may still work on some browsers.
      }
    }
    startScheduler()
  }, [startScheduler, unlockIOS])

  const togglePlay = useCallback(() => {
    if (playingRef.current) {
      stop()
      releaseWakeLock()
    } else {
      void start()
      void requestWakeLock()
    }
  }, [releaseWakeLock, requestWakeLock, start, stop])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
        return
      }
      if (e.key === 'ArrowUp') setBpm(bpmRef.current + 1)
      if (e.key === 'ArrowDown') setBpm(bpmRef.current - 1)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && playingRef.current) {
        void requestWakeLock()
        if (silentAudioRef.current?.paused) {
          void silentAudioRef.current.play().catch(() => undefined)
        }
        if (audioContextRef.current?.state === 'suspended') {
          void audioContextRef.current.resume().catch(() => undefined)
        }
      } else if (document.visibilityState === 'hidden') {
        releaseWakeLock()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stop()
      releaseWakeLock()
      if (silentAudioRef.current) {
        silentAudioRef.current.pause()
        silentAudioRef.current = null
      }
      const actx = audioContextRef.current
      if (actx) {
        void actx.close().catch(() => undefined)
        audioContextRef.current = null
      }
    }
  }, [releaseWakeLock, requestWakeLock, setBpm, stop, togglePlay])

  return (
    <div
      style={{
        background: '#F2EDDF',
        height: 'calc(var(--nl-viewport-h) - var(--nl-site-header-h))',
        minHeight: 'calc(var(--nl-viewport-h) - var(--nl-site-header-h))',
        maxHeight: 'calc(var(--nl-viewport-h) - var(--nl-site-header-h))',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 20px 16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 300,
          fontSize: 'clamp(80px, 22vw, 160px)',
          lineHeight: 1,
          color: '#2A2318',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          userSelect: 'none',
          paddingBottom: '1.1rem',
        }}
      >
        {bpm}
      </div>

      <div
        style={{
          fontFamily: F,
          fontWeight: 300,
          fontSize: 12,
          letterSpacing: '0.35em',
          color: '#A89F92',
          textAlign: 'center',
          marginTop: '0.45rem',
          textTransform: 'uppercase',
        }}
      >
        B P M
      </div>

      <div
        style={{
          fontFamily: F,
          fontWeight: 300,
          fontSize: 12,
          letterSpacing: '0.2em',
          color: '#B5AD9F',
          textAlign: 'center',
          marginTop: '0.35rem',
          minHeight: 18,
          textTransform: 'lowercase',
        }}
      >
        {tempoName(bpm)}
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 340,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.35rem',
          marginTop: '2.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
          <button
            type="button"
            onClick={() => setBpm(bpm - 1)}
            style={{
              width: 38,
              height: 38,
              flexShrink: 0,
              background: 'transparent',
              border: '1px solid #C8C0B2',
              color: '#988F82',
              fontFamily: F,
              fontSize: 20,
              fontWeight: 300,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
            }}
          >
            −
          </button>

          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            step={1}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              flex: 1,
              height: 1,
              background: '#C8C0B2',
              outline: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          />

          <button
            type="button"
            onClick={() => setBpm(bpm + 1)}
            style={{
              width: 38,
              height: 38,
              flexShrink: 0,
              background: 'transparent',
              border: '1px solid #C8C0B2',
              color: '#988F82',
              fontFamily: F,
              fontSize: 20,
              fontWeight: 300,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation',
            }}
          >
            +
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '-8px',
          }}
        >
          <span style={{ fontFamily: F, fontSize: 10, fontWeight: 300, color: '#B5AD9F', letterSpacing: '0.15em' }}>
            20
          </span>
          <span style={{ fontFamily: F, fontSize: 10, fontWeight: 300, color: '#B5AD9F', letterSpacing: '0.15em' }}>
            400
          </span>
        </div>

        <button
          type="button"
          onClick={togglePlay}
          style={{
            width: '100%',
            height: 48,
            background: playing ? '#E8E4DC' : 'transparent',
            border: `1px solid ${playing ? '#988F82' : '#B8AF9F'}`,
            color: playing ? '#6F665A' : '#8F8578',
            fontFamily: F,
            fontWeight: 300,
            fontSize: 11,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
            touchAction: 'manipulation',
          }}
        >
          {playing ? 'stop' : 'play'}
        </button>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2A2318;
          border: none;
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2A2318;
          border: none;
        }
      `}</style>
    </div>
  )
}
