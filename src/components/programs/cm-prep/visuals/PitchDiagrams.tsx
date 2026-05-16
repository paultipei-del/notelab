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
    if (states[n] === 'dim') return '#D9CFAE'
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
    { mode: 'sharps',   symbol: '♯', label: 'Sharp',   color: SHARP_C, desc: 'Raises the note by one half step · one key to the right' },
    { mode: 'flats',    symbol: '♭', label: 'Flat',    color: FLAT_C,  desc: 'Lowers the note by one half step · one key to the left'  },
    { mode: 'naturals', symbol: '♮', label: 'Natural', color: NAT_C,   desc: 'Cancels any sharp or flat · returns to the white key'    },
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
                border: `1px solid ${isActive ? DARK : '#D9CFAE'}`,
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
    { mode: 'half-steps',  symbol: 'H', label: 'Half Step',  color: SHARP_C, desc: 'Adjacent keys · no key between. The smallest distance in music.' },
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
                border: `1px solid ${isActive ? DARK : '#D9CFAE'}`,
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
// Consolidated visual guide — shows the keyboard with interval brackets,
// a 4-measure staff of ascending 2nd–5th, and the even/odd rule. The lesson
// itself skips straight to Exercise 1; all teaching happens here.
export function IntervalsDiagram() {
  return (
    <div>
      <IntervalsKeyboardVisual />
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060',
        margin: '14px 0 10px', lineHeight: 1.7 }}>
        When counting intervals on the staff, count the line or space on which each note sits,
        and all the lines or spaces between the two notes.
      </p>
      <div style={{ background: 'linear-gradient(to bottom, #FBF9F4, #F4F1E8)', border: '1px solid var(--brown-faint)', borderRadius: 12,
        padding: '10px 0', marginBottom: 14 }}>
        <IntervalsAscendingStaff />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: '#F7F4ED', border: '1px solid #D9CFAE', borderRadius: 8,
          padding: '10px 14px' }}>
          <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', margin: 0, lineHeight: 1.7 }}>
            Intervals with <strong style={{ color: DARK }}>even</strong> numbers (2nd, 4th) are made of{' '}
            <strong>one line note and one space note</strong>.
          </p>
        </div>
        <div style={{ background: '#F7F4ED', border: '1px solid #D9CFAE', borderRadius: 8,
          padding: '10px 14px' }}>
          <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', margin: 0, lineHeight: 1.7 }}>
            Intervals with <strong style={{ color: DARK }}>odd</strong> numbers (3rd, 5th) are made of{' '}
            <strong>two line notes or two space notes</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}

// Interactive two-octave keyboard for intervals — click any white key, pick
// an interval size (2nd/3rd/4th/5th), see the span highlighted with an
// amber/blue pair and a connecting arc. Same visual language as PianoKeyboard.
function IntervalsKeyboardVisual() {
  // Interval size (white-key count from first note to second, inclusive)
  const [size, setSize] = useState<2 | 3 | 4 | 5>(3)
  // Direction: 'up' = ascending (right), 'down' = descending (left)
  const [direction, setDirection] = useState<'up' | 'down'>('up')
  // Default start on E4 (index 2 = third white key)
  const [fromIdx, setFromIdx] = useState<number>(2)

  // Two octaves C4..B5 plus C6 terminator = 15 white keys
  const WHITE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const NAMES = [
    'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
    'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
    'C6',
  ]
  const N_WHITE = NAMES.length   // 15

  const KEY_PITCH = 88
  const WK_W = 86
  const BK_W = 51
  const LEFT_PAD = 30
  const RIGHT_PAD = 8
  const KB_TOP = 120             // headroom for interval label
  const KEY_Y = 69 + KB_TOP
  const KEY_END = 441 + KB_TOP
  const FACE_B = 449 + KB_TOP
  const BK_END = 301 + KB_TOP
  const BK_H = BK_END - KEY_Y
  const VW_KB = LEFT_PAD + N_WHITE * KEY_PITCH - 2 + RIGHT_PAD
  const VH_KB = 600

  const wkX = (i: number) => LEFT_PAD + i * KEY_PITCH

  // Black-key offsets, in each octave start of 7 white keys.
  // Relative to its octave's C x: positions of C#/D#/F#/G#/A#
  const BK_OCTAVE_OFFSETS = [82 - 30, 175 - 30, 343 - 30, 437 - 30, 531 - 30]
  const BLACK_KEYS: { x: number }[] = []
  for (let oct = 0; oct < 2; oct++) {
    for (const off of BK_OCTAVE_OFFSETS) {
      BLACK_KEYS.push({ x: wkX(oct * 7) + off })
    }
  }

  const toIdx = direction === 'up' ? fromIdx + size - 1 : fromIdx - (size - 1)
  const inRange = toIdx >= 0 && toIdx < N_WHITE

  const fromCenterX = wkX(fromIdx) + WK_W / 2
  const toCenterX   = inRange ? wkX(toIdx) + WK_W / 2 : 0

  // Arrow + label above the keyboard (in the wood area)
  const ARROW_Y = KB_TOP - 30

  const sizes: (2 | 3 | 4 | 5)[] = [2, 3, 4, 5]
  const sizeLabel = (s: number) => s === 2 ? '2nd' : s === 3 ? '3rd' : s === 4 ? '4th' : '5th'
  const SIZE_COLOR: Record<number, string> = { 2: '#4A9E30', 3: ACCENT, 4: '#3B6DB5', 5: '#7B4CA8' }
  const activeColor = SIZE_COLOR[size]

  return (
    <div>
      {/* Interval size tabs + direction toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {sizes.map(s => {
          const isActive = s === size
          return (
            <button key={s} onClick={() => setSize(s)}
              style={{
                padding: '6px 14px', borderRadius: 8,
                background: isActive ? SIZE_COLOR[s] : 'transparent',
                border: `1px solid ${isActive ? SIZE_COLOR[s] : '#D9CFAE'}`,
                fontFamily: F, fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'white' : '#7A7060',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {sizeLabel(s)}
            </button>
          )
        })}

        {/* Direction toggle */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {(['up', 'down'] as const).map(dir => {
            const isActive = direction === dir
            return (
              <button key={dir}
                onClick={() => {
                  setDirection(dir)
                  // Reset to a starting note that keeps the interval in range
                  if (dir === 'down') setFromIdx(9)    // E5 · room below for 5ths
                  else                setFromIdx(2)    // E4 · room above
                }}
                style={{
                  padding: '6px 10px', borderRadius: 8,
                  background: isActive ? '#1A1A18' : 'transparent',
                  border: `1px solid ${isActive ? '#1A1A18' : '#D9CFAE'}`,
                  fontFamily: F, fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'white' : '#7A7060',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {dir === 'up' ? '↑ up' : '↓ down'}
              </button>
            )
          })}
        </div>

        <span style={{ flex: 1 }} />
        <span style={{
          fontFamily: SERIF, fontSize: 17, fontWeight: 600,
          color: activeColor, opacity: inRange ? 0.95 : 0.35,
          alignSelf: 'center',
        }}>
          {inRange
            ? `${NAMES[fromIdx].replace(/\d/, '')} → ${NAMES[toIdx].replace(/\d/, '')}  (${sizeLabel(size)})`
            : `Out of range · pick a ${direction === 'up' ? 'lower' : 'higher'} starting note`}
        </span>
      </div>

      {/* Keyboard */}
      <div style={{ borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.40)' }}>
        <svg viewBox={`0 0 ${VW_KB} ${VH_KB}`} width="100%" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="ikv-wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7A5228" />
              <stop offset="35%" stopColor="#3a2418" />
              <stop offset="100%" stopColor="#1a0f08" />
            </linearGradient>
            <linearGradient id="ikv-woodSheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.14" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ikv-ivory" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fefdf9" />
              <stop offset="60%" stopColor="#f4eedc" />
              <stop offset="100%" stopColor="#e5dfcb" />
            </linearGradient>
            <linearGradient id="ikv-wAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF8E0" />
              <stop offset="55%" stopColor="#F0D070" />
              <stop offset="100%" stopColor="#C89028" />
            </linearGradient>
            <linearGradient id="ikv-wBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EAF4FF" />
              <stop offset="55%" stopColor="#B0CCF0" />
              <stop offset="100%" stopColor="#7098D0" />
            </linearGradient>
            <linearGradient id="ikv-lEdge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6A5840" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#6A5840" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ikv-bDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a2420" />
              <stop offset="6%" stopColor="#0a0805" />
              <stop offset="100%" stopColor="#1c1814" />
            </linearGradient>
            <radialGradient id="ikv-bSheen" cx="50%" cy="18%" r="65%">
              <stop offset="0%" stopColor="white" stopOpacity="0.20" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <filter id="ikv-bShadow" x="-12%" y="-4%" width="130%" height="120%">
              <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.65" />
            </filter>
            <marker id="ikv-arrow" markerWidth="9" markerHeight="9"
              refX="4.5" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="rgba(255,255,255,0.85)" />
            </marker>
          </defs>

          {/* Wood case */}
          <rect x={0} y={0} width={VW_KB} height={VH_KB} fill="url(#ikv-wood)" />
          <rect x={0} y={KB_TOP - 88} width={VW_KB} height={36}
            fill="url(#ikv-woodSheen)" rx={4} />
          <rect x={24} y={KB_TOP - 8} width={VW_KB - 48} height={10} fill="#6a1515" rx={3} />
          <rect x={24} y={KB_TOP - 8} width={VW_KB - 48} height={3}  fill="#9a2828" opacity={0.55} rx={3} />

          {/* Arrow connecting "from" key to target (on the wood, above the keys) */}
          {inRange && (
            <line x1={fromCenterX} y1={ARROW_Y} x2={toCenterX} y2={ARROW_Y}
              stroke="rgba(255,255,255,0.85)" strokeWidth={3}
              markerEnd="url(#ikv-arrow)" />
          )}

          {/* Interval label floating above the arrow midpoint */}
          {inRange && (
            <g>
              <rect x={(fromCenterX + toCenterX) / 2 - 34} y={ARROW_Y - 30}
                width={68} height={20} rx={5} fill={activeColor} />
              <text x={(fromCenterX + toCenterX) / 2} y={ARROW_Y - 16}
                fontFamily={F} fontSize={13} fontWeight={700} fill="white"
                textAnchor="middle" dominantBaseline="auto">
                {sizeLabel(size)}
              </text>
            </g>
          )}

          {/* White keys */}
          {NAMES.map((name, i) => {
            const x = wkX(i)
            const letter = WHITE_LETTERS[i % 7]
            const isFrom = i === fromIdx
            const isTo   = inRange && i === toIdx
            const fill = isFrom ? 'url(#ikv-wAmber)'
                      : isTo   ? 'url(#ikv-wBlue)'
                      : 'url(#ikv-ivory)'
            const labelColor = isFrom ? '#7A4800'
                            : isTo   ? '#1A3A6A'
                            : '#7A7060'
            return (
              <g key={name}
                onClick={() => setFromIdx(i)}
                style={{ cursor: 'pointer' }}>
                <rect x={x} y={KEY_Y} width={WK_W} height={FACE_B - KEY_Y} fill={fill} rx={5} />
                <rect x={x} y={KEY_Y + 6} width={14} height={FACE_B - KEY_Y - 6} fill="url(#ikv-lEdge)" />
                <rect x={x} y={KEY_Y} width={WK_W} height={28} fill="white" opacity={0.12} rx={5} />
                <text x={x + WK_W / 2} y={KEY_END - 18}
                  fontFamily="var(--font-cormorant), serif"
                  fontSize={28} fontWeight={isFrom || isTo ? 700 : 500}
                  fill={labelColor}
                  textAnchor="middle" dominantBaseline="auto">
                  {letter}
                </text>
              </g>
            )
          })}

          {/* Black keys (decorative · not clickable since this lesson has no accidentals) */}
          {BLACK_KEYS.map((bk, i) => (
            <g key={i} filter="url(#ikv-bShadow)">
              <rect x={bk.x} y={KEY_Y} width={BK_W} height={BK_H} fill="url(#ikv-bDark)" rx={7} />
              <rect x={bk.x} y={KEY_Y} width={BK_W} height={BK_H} fill="url(#ikv-bSheen)" rx={7} />
              <rect x={bk.x + 4} y={BK_END - 22} width={BK_W - 8} height={22}
                fill="#2A1808" opacity={0.55} rx={4} />
            </g>
          ))}

          {/* Bottom wood */}
          <rect x={0} y={FACE_B} width={VW_KB} height={VH_KB - FACE_B} fill="url(#ikv-wood)" />
        </svg>
      </div>
    </div>
  )
}

// 4-measure treble staff with ascending harmonic 2nd–5th starting on E4.
// Same staff geometry as every other lesson card.
function IntervalsAscendingStaff() {
  const step  = 8
  const sL    = 32
  const sR    = 360
  const tTop  = 54
  const svgW  = sR + 16
  const svgH  = tTop + 8 * step + 54

  const lineY = (n: number) => tTop + (5 - n) * 2 * step
  const posToY = (pos: number) => tTop + (10 - pos) * step

  // All intervals start on F4 (pos=3). Targets: G4, A4, B4, C5.
  const BOTTOM = 3
  const intervals = [
    { top: 4, label: '2nd' },
    { top: 5, label: '3rd' },
    { top: 6, label: '4th' },
    { top: 7, label: '5th' },
  ]

  const startX = sL + 66
  const span   = sR - startX
  const measureW = span / 4
  const noteCenters  = [0, 1, 2, 3].map(i => startX + (i + 0.5) * measureW)
  const barPositions = [1, 2, 3, 4].map(i => startX + i * measureW)

  // Horizontal offset for the "upper" notehead when the interval is a 2nd.
  // Adjacent noteheads can't share an x — the upper note shifts right by ~one
  // notehead width so both heads remain readable (standard engraving rule).
  const NH_OFFSET = 18

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
      style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE_W} />
      ))}
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      {barPositions.map((bx, i) => (
        <line key={i} x1={bx} y1={tTop} x2={bx} y2={lineY(1)}
          stroke={DARK} strokeWidth={STROKE_W} />
      ))}
      <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>

      {intervals.map((ival, i) => {
        const isSecond = ival.top - BOTTOM === 1
        const bottomX  = noteCenters[i] - (isSecond ? NH_OFFSET / 2 : 0)
        const topX     = noteCenters[i] + (isSecond ? NH_OFFSET / 2 : 0)
        return (
          <g key={ival.label}>
            <text x={bottomX} y={posToY(BOTTOM)} fontFamily="Bravura, serif" fontSize={60}
              fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
            <text x={topX} y={posToY(ival.top)} fontFamily="Bravura, serif" fontSize={60}
              fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
            <text x={noteCenters[i]} y={lineY(5) - 10}
              fontFamily={F} fontSize={11} fontWeight={700} fill={ACCENT}
              textAnchor="middle">{ival.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
