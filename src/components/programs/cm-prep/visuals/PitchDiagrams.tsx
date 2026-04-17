'use client'

import { useState } from 'react'
import { PianoKeyboard, type PianoMode } from '../PianoKeyboard'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#B0ACA4'
const ACCENT = '#BA7517'
const HIGHLIGHT_A = '#BA7517'  // gold for first note
const HIGHLIGHT_B = '#3B6DB5'  // blue for second note
const SHARP_C = '#2A5C0A'
const FLAT_C = '#3B6DB5'
const NAT_C = '#7A7060'
const STROKE_W = 1.3

// Piano key layout helpers
const WK_W = 22   // white key width
const WK_H = 64   // white key height
const BK_W = 14   // black key width
const BK_H = 40   // black key height

// White key x positions for one octave (C=0 base)
const WHITE_X: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }
// Black key x offset (left edge, relative to octave start)
const BLACK_X: Record<string, number> = { 'C#': 14, 'D#': 36, 'F#': 80, 'G#': 102, 'A#': 124 }

interface KeyState { white?: string; black?: string }  // 'a' | 'b' | 'normal'

function PianoOctave({
  ox = 0, oy = 0, states = {}, labels = {},
}: {
  ox?: number; oy?: number
  states?: Record<string, string>  // note → 'a' | 'b' | 'dim'
  labels?: Record<string, string>
}) {
  const noteColor = (n: string) => {
    if (states[n] === 'a') return HIGHLIGHT_A
    if (states[n] === 'b') return HIGHLIGHT_B
    if (states[n] === 'dim') return '#DDD8CA'
    return null
  }

  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#']

  return (
    <g transform={`translate(${ox},${oy})`}>
      {/* White keys */}
      {whiteKeys.map(k => {
        const x = WHITE_X[k] * WK_W
        const color = noteColor(k)
        return (
          <g key={k}>
            <rect x={x} y={0} width={WK_W - 1} height={WK_H} fill={color || 'white'} stroke={DARK} strokeWidth={0.8} rx={2} />
            {labels[k] && (
              <text x={x + WK_W / 2 - 0.5} y={WK_H - 7} fontFamily={F} fontSize={9} textAnchor="middle"
                fill={color ? 'white' : '#7A7060'}>{labels[k]}</text>
            )}
          </g>
        )
      })}
      {/* Black keys */}
      {blackKeys.map(k => {
        const x = BLACK_X[k]
        const color = noteColor(k)
        return (
          <g key={k}>
            <rect x={x} y={0} width={BK_W} height={BK_H} fill={color || DARK} stroke={DARK} strokeWidth={0.6} rx={1.5} />
            {labels[k] && (
              <text x={x + BK_W / 2} y={BK_H - 5} fontFamily={F} fontSize={8} textAnchor="middle"
                fill="white">{labels[k]}</text>
            )}
          </g>
        )
      })}
    </g>
  )
}

// ── Lesson 5: Sharps, Flats, Naturals ─────────────────────────────────────
export function AccidentalsDiagram() {
  const [mode, setMode] = useState<PianoMode>('sharps')

  const tabs: { mode: PianoMode; symbol: string; label: string; color: string; desc: string }[] = [
    { mode: 'sharps',   symbol: '♯', label: 'Sharp',   color: SHARP_C, desc: 'Raises the note by one half step — one key to the right' },
    { mode: 'flats',    symbol: '♭', label: 'Flat',    color: FLAT_C,  desc: 'Lowers the note by one half step — one key to the left'  },
    { mode: 'naturals', symbol: '♮', label: 'Natural', color: NAT_C,   desc: 'Cancels any sharp or flat — returns to the white key'    },
  ]

  const active = tabs.find(t => t.mode === mode)!

  return (
    <div>
      {/* Toggle buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => {
          const isActive = t.mode === mode
          return (
            <button
              key={t.mode}
              onClick={() => setMode(t.mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px',
                background: isActive ? DARK : 'transparent',
                border: `1px solid ${isActive ? DARK : '#DDD8CA'}`,
                borderRadius: 10,
                fontFamily: F, fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'white' : '#7A7060',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontFamily: 'Bravura, serif', fontSize: 18, lineHeight: 1, color: isActive ? 'white' : t.color }}>
                {t.symbol}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Description */}
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 14, lineHeight: 1.6 }}>
        {active.desc}
      </p>

      {/* Keyboard */}
      <PianoKeyboard mode={mode} />
    </div>
  )
}

// ── Lesson 6: Half Steps and Whole Steps ──────────────────────────────────
export function StepsDiagram() {
  const [mode, setMode] = useState<PianoMode>('half-steps')

  const tabs: { mode: PianoMode; symbol: string; label: string; color: string; desc: string }[] = [
    { mode: 'half-steps',  symbol: 'H', label: 'Half Step',  color: SHARP_C, desc: 'Adjacent keys — no key between. The smallest distance in music.' },
    { mode: 'whole-steps', symbol: 'W', label: 'Whole Step', color: FLAT_C,  desc: 'Skips exactly one key. Equal to two half steps.' },
  ]

  const active = tabs.find(t => t.mode === mode)!

  return (
    <div>
      {/* Toggle buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => {
          const isActive = t.mode === mode
          return (
            <button
              key={t.mode}
              onClick={() => setMode(t.mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px',
                background: isActive ? DARK : 'transparent',
                border: `1px solid ${isActive ? DARK : '#DDD8CA'}`,
                borderRadius: 10,
                fontFamily: F, fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'white' : '#7A7060',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 18, lineHeight: 1, color: isActive ? 'white' : t.color }}>
                {t.symbol}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Description */}
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 14, lineHeight: 1.6 }}>
        {active.desc}
      </p>

      {/* Keyboard */}
      <PianoKeyboard mode={mode} />
    </div>
  )
}

// ── Lesson 7: Intervals ────────────────────────────────────────────────────
export function IntervalsDiagram() {
  const step = 9
  const sL = 20
  const tTop = 30

  // Draw a mini treble staff section for each interval
  // C5 = pos 3, D5 = pos 2, E5 = pos 1, F5 = pos 0, G5 = pos -1
  // We'll show: unison (skip), 2nd (C-D), 3rd (C-E), 4th (C-F), 5th (C-G)
  const intervals = [
    { label: '2nd', low: 3, high: 2, desc: 'C to D\nLine to space' },
    { label: '3rd', low: 3, high: 1, desc: 'C to E\nSpace to space' },
    { label: '4th', low: 3, high: 0, desc: 'C to F\nLine ↑' },
    { label: '5th', low: 3, high: -1, desc: 'C to G\nLine to line' },
  ]

  const colW = 118

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 490 185" width="100%" style={{ maxWidth: 490, display: 'block', margin: '0 auto' }}>

        {intervals.map((intv, i) => {
          const ox = sL + i * colW

          // Staff lines: pos 0..8 covers F5..E4. We show a partial staff (lines 0–8 only)
          const staffEndX = ox + colW - 16

          return (
            <g key={intv.label}>
              {/* Mini staff */}
              {[0, 2, 4, 6, 8].map(p => (
                <line key={p} x1={ox} y1={tTop + p * step} x2={staffEndX} y2={tTop + p * step}
                  stroke={DARK} strokeWidth={1} />
              ))}
              <line x1={ox} y1={tTop} x2={ox} y2={tTop + 8 * step} stroke={DARK} strokeWidth={1} />
              <line x1={staffEndX} y1={tTop} x2={staffEndX} y2={tTop + 8 * step} stroke={DARK} strokeWidth={1} />

              {/* Treble clef (small) */}
              <text x={ox + 1} y={tTop + 38} fontFamily="Bravura, serif" fontSize={50} fill="#B0ACA4">&#x1D11E;</text>

              {/* Ledger line above staff if needed (G5 at pos -1) */}
              {intv.high === -1 && (
                <line x1={ox + 65 - 12} y1={tTop - step} x2={ox + 65 + 12} y2={tTop - step}
                  stroke={DARK} strokeWidth={1} />
              )}

              {/* Bottom note (C5, pos 3) */}
              <ellipse cx={ox + 50} cy={tTop + intv.low * step} rx={7} ry={4.5} fill={HIGHLIGHT_A} />
              {/* Top note */}
              <ellipse cx={ox + 80} cy={tTop + intv.high * step} rx={7} ry={4.5} fill={HIGHLIGHT_B} />

              {/* Interval number */}
              <text x={ox + colW / 2 - 4} y={tTop + 8 * step + 22}
                fontFamily={SERIF} fontSize={22} fontWeight="400" fill={DARK} textAnchor="middle">
                {intv.label}
              </text>

              {/* Description */}
              {intv.desc.split('\n').map((line, j) => (
                <text key={j} x={ox + colW / 2 - 4} y={tTop + 8 * step + 42 + j * 14}
                  fontFamily={F} fontSize={9} fill={GREY} textAnchor="middle">
                  {line}
                </text>
              ))}
            </g>
          )
        })}

        {/* Rule box */}
        <rect x={sL} y={165} width={440} height={16} rx={6} fill="rgba(186,117,23,0.07)" stroke="rgba(186,117,23,0.2)" strokeWidth={1} />
        <text x={sL + 220} y={177} fontFamily={F} fontSize={9.5} fill={DARK} textAnchor="middle">
          Count interval by including both notes: C(1) D(2) = 2nd · C(1) D(2) E(3) = 3rd
        </text>
      </svg>
    </div>
  )
}
