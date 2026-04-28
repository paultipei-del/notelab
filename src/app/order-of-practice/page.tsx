'use client'

import { useMemo, useState } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

type PracticeStage = {
  id: string
  title: string
  routes: string[][]
}

const STAGES: PracticeStage[] = [
  { id: 'chromatic', title: '1. Chromatic', routes: [['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'C']] },
  { id: 'whole-tone', title: '2. Whole-tone', routes: [['C', 'D', 'E', 'F#', 'Ab', 'Bb', 'C'], ['Db', 'Eb', 'F', 'G', 'A', 'B', 'Db']] },
  { id: 'minor-3rds', title: '3. Minor 3rds', routes: [['C', 'Eb', 'F#', 'A', 'C'], ['Db', 'E', 'G', 'Bb', 'Db'], ['D', 'F', 'Ab', 'B', 'D']] },
  { id: 'major-3rds', title: '4. Major 3rds', routes: [['C', 'E', 'Ab', 'C'], ['Db', 'F', 'A', 'Db'], ['D', 'F#', 'Bb', 'D'], ['Eb', 'G', 'B', 'Eb']] },
  { id: 'fourths', title: '5. 4ths', routes: [['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G', 'C']] },
  { id: 'tritone', title: '6. Tritone', routes: [['C', 'F#', 'C'], ['Db', 'G', 'Db'], ['D', 'Ab', 'D'], ['Eb', 'A', 'Eb'], ['E', 'Bb', 'E'], ['F', 'B', 'F']] },
  { id: 'fifths', title: '7. 5ths', routes: [['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C']] },
]

export default function OrderOfPracticePage() {
  const [stageIdx, setStageIdx] = useState(0)
  const [routeIdx, setRouteIdx] = useState(0)
  const [reversed, setReversed] = useState(false)

  const stage = STAGES[stageIdx]
  const route = stage.routes[routeIdx]

  const displayedRoute = useMemo(() => (reversed ? [...route].reverse() : route), [reversed, route])

  const switchStage = (idx: number) => {
    setStageIdx(idx)
    setRouteIdx(0)
    setReversed(false)
  }

  const switchRoute = (idx: number) => {
    setRouteIdx(idx)
    setReversed(false)
  }

  return (
    <div
      style={{
        background: '#F2EDDF',
        minHeight: 'calc(var(--nl-viewport-h) - var(--nl-site-header-h))',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 'clamp(30px, 4.5vw, 48px)',
            color: '#2A2318',
            marginBottom: 8,
          }}
        >
          Order of Practice
        </h1>
        <p
          style={{
            fontFamily: F,
            color: '#7A7060',
            fontSize: 14,
            lineHeight: 1.7,
            maxWidth: 760,
            marginBottom: 20,
          }}
        >
          Use this sequence to cycle your ideas, voicings, and progressions through harmonic movement patterns.
          Work each stage forward and backward for stronger retention and cleaner recall.
        </p>

        <div
          style={{
            padding: 20,
            marginBottom: 14,
            display: 'grid',
            gap: 16,
            border: '1px solid #D8D0C4',
            background: 'rgba(255,255,255,0.25)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {STAGES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => switchStage(i)}
                style={{
                  fontFamily: F,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 999,
                  padding: '7px 13px',
                  border: '1px solid #CFC6B8',
                  background: i === stageIdx ? '#2A2318' : 'transparent',
                  color: i === stageIdx ? '#F2EDDF' : '#7A7060',
                  cursor: 'pointer',
                }}
              >
                {s.title.replace(/^\d+\.\s/, '')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: F, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7060' }}>
              Starting note
            </span>
            {stage.routes.map((r, i) => (
              <button
                key={`${stage.id}-${i}`}
                type="button"
                onClick={() => switchRoute(i)}
                style={{
                  fontFamily: SERIF,
                  fontSize: 16,
                  borderRadius: 999,
                  padding: '4px 12px',
                  border: '1px solid #CFC6B8',
                  background: i === routeIdx ? '#2A2318' : 'transparent',
                  color: i === routeIdx ? '#F2EDDF' : '#2A2318',
                  cursor: 'pointer',
                }}
              >
                {r[0]}
              </button>
            ))}
          </div>
          <p style={{ fontFamily: F, fontSize: 12, color: '#7A7060', marginTop: -2 }}>
            Choose where this cycle begins. The same pattern starts from each option.
          </p>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: F, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7060' }}>
              Play this route forward, then tap Reverse to practice the return path
            </p>
            <p style={{ fontFamily: SERIF, color: '#2A2318', display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', alignItems: 'baseline' }}>
              {displayedRoute.map((note, i) => (
                <span key={`${note}-${i}`} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 36, lineHeight: 1 }}>{note}</span>
                  {i < displayedRoute.length - 1 && (
                    <span style={{ fontSize: 28, lineHeight: 1, color: '#A39A8D' }}>→</span>
                  )}
                </span>
              ))}
            </p>
            <button
              type="button"
              onClick={() => setReversed((v) => !v)}
              style={{
                marginTop: 10,
                fontFamily: F,
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '8px 12px',
                border: '1px solid #CFC6B8',
                background: reversed ? '#2A2318' : 'transparent',
                color: reversed ? '#F2EDDF' : '#2A2318',
                cursor: 'pointer',
              }}
            >
              Reverse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

