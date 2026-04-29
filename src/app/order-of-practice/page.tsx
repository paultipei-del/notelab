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
      <style>{`
        .oop-pill {
          font-family: ${F};
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border-radius: 999px;
          padding: 6px 12px;
          border: 1px solid #D8D0C4;
          background: transparent;
          color: #7A7060;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
        }
        .oop-pill:hover {
          background: rgba(42, 35, 24, 0.05);
          color: #2A2318;
          border-color: #B8AE9C;
        }
        .oop-pill[data-active="true"] {
          background: #2A2318;
          color: #F2EDDF;
          border-color: #2A2318;
        }
        .oop-pill[data-active="true"]:hover {
          background: #1A140C;
        }

        .oop-note {
          font-family: ${SERIF};
          font-size: 15px;
          line-height: 1;
          border-radius: 999px;
          padding: 5px 11px;
          min-width: 38px;
          border: 1px solid #D8D0C4;
          background: transparent;
          color: #2A2318;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
        }
        .oop-note:hover {
          background: rgba(42, 35, 24, 0.05);
          border-color: #B8AE9C;
        }
        .oop-note[data-active="true"] {
          background: #2A2318;
          color: #F2EDDF;
          border-color: #2A2318;
        }
        .oop-note[data-active="true"]:hover {
          background: #1A140C;
        }

        .oop-reverse {
          font-family: ${F};
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 7px 16px;
          border: 1px solid #2A2318;
          background: transparent;
          color: #2A2318;
          cursor: pointer;
          border-radius: 999px;
          transition: background 160ms ease, color 160ms ease;
        }
        .oop-reverse:hover {
          background: rgba(42, 35, 24, 0.08);
        }
        .oop-reverse[data-active="true"] {
          background: #2A2318;
          color: #F2EDDF;
        }
        .oop-reverse[data-active="true"]:hover {
          background: #1A140C;
        }
      `}</style>
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
            marginBottom: 24,
          }}
        >
          Use this sequence to cycle your ideas, voicings, and progressions through harmonic movement patterns.
          Work each stage forward and backward for stronger retention and cleaner recall.
        </p>

        <div
          style={{
            padding: 28,
            marginBottom: 14,
            display: 'grid',
            gap: 28,
            border: '1px solid #D8D0C4',
            background: 'rgba(255,255,255,0.25)',
          }}
        >
          <section style={{ display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center' }}>
            <SectionLabel>Pattern</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {STAGES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className="oop-pill"
                  data-active={i === stageIdx}
                  onClick={() => switchStage(i)}
                >
                  {s.title.replace(/^\d+\.\s/, '')}
                </button>
              ))}
            </div>
          </section>

          <section style={{ display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center' }}>
            <SectionLabel>Starting note</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {stage.routes.map((r, i) => (
                <button
                  key={`${stage.id}-${i}`}
                  type="button"
                  className="oop-note"
                  data-active={i === routeIdx}
                  onClick={() => switchRoute(i)}
                >
                  {r[0]}
                </button>
              ))}
            </div>
          </section>

          <div style={{ borderTop: '1px solid #E2DCCE', margin: '0 -28px' }} />

          <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div
              style={{
                fontFamily: SERIF,
                color: '#2A2318',
                display: 'flex',
                flexWrap: 'nowrap',
                columnGap: 'clamp(4px, 1.1vw, 14px)',
                justifyContent: 'center',
                alignItems: 'baseline',
                lineHeight: 1.2,
                width: '100%',
                whiteSpace: 'nowrap',
              }}
            >
              {displayedRoute.map((note, i) => (
                <span key={`${note}-${i}`} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'clamp(4px, 1.1vw, 14px)' }}>
                  <span style={{ fontSize: 'clamp(13px, 2.6vw, 32px)', lineHeight: 1 }}>{note}</span>
                  {i < displayedRoute.length - 1 && (
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: 'clamp(8px, 1.4vw, 16px)',
                        lineHeight: 1,
                        color: '#2A2318',
                        opacity: 0.18,
                      }}
                    >
                      —
                    </span>
                  )}
                </span>
              ))}
            </div>

            <button
              type="button"
              className="oop-reverse"
              data-active={reversed}
              onClick={() => setReversed((v) => !v)}
            >
              Reverse
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: F,
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: '#9A8F7E',
      }}
    >
      {children}
    </span>
  )
}
