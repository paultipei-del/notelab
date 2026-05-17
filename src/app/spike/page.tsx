'use client'

/**
 * VexFlow validation spike. Drop in, click the buttons, confirm rendering
 * is smooth and the API behaves as documented before committing the full
 * grand-staff component to the build.
 */

import { useEffect, useRef, useState } from 'react'
import { Renderer, Stave, StaveNote, Formatter, Voice } from 'vexflow'

const F = 'var(--font-jost), sans-serif'

const PRESETS: { label: string; keys: string[] }[] = [
  { label: 'C major',      keys: ['c/4', 'e/4', 'g/4'] },
  { label: 'D major',      keys: ['d/4', 'f#/4', 'a/4'] },
  { label: 'Cmaj7',        keys: ['c/4', 'e/4', 'g/4', 'b/4'] },
  { label: 'G7',           keys: ['g/3', 'b/3', 'd/4', 'f/4'] },
  { label: 'Empty (rest)', keys: [] },
]

export default function VexFlowSpike() {
  const ref = useRef<HTMLDivElement>(null)
  const [preset, setPreset] = useState(0)
  const [lastRenderMs, setLastRenderMs] = useState<number | null>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const start = performance.now()

    container.innerHTML = ''
    const renderer = new Renderer(container, Renderer.Backends.SVG)
    renderer.resize(420, 150)
    const ctx = renderer.getContext()
    const stave = new Stave(10, 0, 400)
    stave.addClef('treble').setContext(ctx).draw()

    const keys = PRESETS[preset].keys
    const voice = new Voice({ numBeats: 4, beatValue: 4 })
    if (keys.length === 0) {
      voice.addTickables([new StaveNote({ keys: ['b/4'], duration: 'wr' })])
    } else {
      voice.addTickables([new StaveNote({ keys, duration: 'w' })])
    }
    new Formatter().joinVoices([voice]).format([voice], 340)
    voice.draw(ctx, stave)

    setLastRenderMs(performance.now() - start)
  }, [preset])

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{
          fontFamily: 'var(--font-cormorant), serif', fontWeight: 300,
          fontSize: 32, color: '#2A2318', marginBottom: 24,
        }}>
          VexFlow spike
        </h1>
        <div ref={ref} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPreset(i)}
              style={{
                fontFamily: F, fontSize: 13,
                padding: '8px 14px',
                background: preset === i ? '#1A1A18' : 'var(--cream-key)',
                color: preset === i ? 'var(--cream-key)' : '#2A2318',
                border: '1px solid var(--brown-faint)',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {lastRenderMs !== null && (
          <p style={{ fontFamily: F, fontSize: 12, color: '#7A7060' }}>
            Last render: {lastRenderMs.toFixed(2)}ms
            {lastRenderMs > 16 && ' · over 16ms budget — consider reusing the Renderer'}
          </p>
        )}
      </div>
    </div>
  )
}
