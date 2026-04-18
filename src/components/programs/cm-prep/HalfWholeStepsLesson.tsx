'use client'

import { useState, useRef, useMemo } from 'react'

const F      = 'var(--font-jost), sans-serif'
const SERIF  = 'var(--font-cormorant), serif'
const DARK   = '#1A1A18'
const GREY   = '#7A7060'
const ACCENT  = '#BA7517'
const ACCENT2 = '#3B6DB5'
const CORRECT = '#2A6B1E'
const WRONG   = '#B5402A'
const STROKE  = 1.3

// ── Staff geometry ────────────────────────────────────────────────────────────
const step  = 8
const sL    = 32
const sR    = 360
const tTop  = 54
const svgW  = sR + 16        // 376
const svgH  = tTop + 8 * step + 54  // 172

function posToY(pos: number) { return tTop + (10 - pos) * step }
function lineY(n: number)    { return tTop + (5 - n) * 2 * step }

// ── Piano keyboard geometry ───────────────────────────────────────────────────
const VW = 680
const VH = 480
const KEY_Y  = 69
const KEY_END = 441
const FACE_B  = 449
const BK_END  = 301
const BK_H    = BK_END - KEY_Y   // 232
const WK_W = 86
const BK_W = 51

const WK_X: Record<string, number> = { C: 30, D: 118, E: 206, F: 294, G: 382, A: 470, B: 558 }
const BK_X: Record<string, number> = { 'C#': 82, 'D#': 175, 'F#': 343, 'G#': 437, 'A#': 531 }
const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_NOTES = ['C#', 'D#', 'F#', 'G#', 'A#']

const BK_LABELS: Record<string, string> = {
  'C#': 'C♯', 'D#': 'D♯', 'F#': 'F♯', 'G#': 'G♯', 'A#': 'A♯',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffled<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

// ── SVG primitives ────────────────────────────────────────────────────────────
function StaffBase() {
  return (
    <>
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE} />
      ))}
    </>
  )
}

function TrebleClef() {
  return (
    <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
      fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
  )
}

function BravuraNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return (
    <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={60}
      fill={color} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
  )
}

function LedgerLine({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return <line x1={cx - 16} y1={cy} x2={cx + 16} y2={cy} stroke={color} strokeWidth={2.5} />
}

function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <div style={{ flex: 1, height: '4px', background: '#EDE8DF', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${(done / total) * 100}%`, height: '100%', background: color,
          borderRadius: '2px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontFamily: F, fontSize: 'var(--nl-text-badge)', color: '#B0ACA4', whiteSpace: 'nowrap' }}>
        {done + 1} / {total}
      </span>
    </div>
  )
}

function PrimaryBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: DARK, color: 'white', border: 'none', borderRadius: 10,
      padding: '12px 28px', fontFamily: F, fontSize: 'var(--nl-text-meta)', cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}

// ── Pool types ────────────────────────────────────────────────────────────────
interface StepQuestion {
  from: string
  answer: string
  direction: 'up' | 'down'
  fromLabel: string
  toLabel: string
}

// ── Pools ─────────────────────────────────────────────────────────────────────
const HALF_POOL: StepQuestion[] = [
  // Ascending from white keys
  { from: 'C', answer: 'C#', direction: 'up',   fromLabel: 'C',  toLabel: 'C♯' },
  { from: 'D', answer: 'D#', direction: 'up',   fromLabel: 'D',  toLabel: 'D♯' },
  { from: 'E', answer: 'F',  direction: 'up',   fromLabel: 'E',  toLabel: 'F'  },
  { from: 'F', answer: 'F#', direction: 'up',   fromLabel: 'F',  toLabel: 'F♯' },
  { from: 'G', answer: 'G#', direction: 'up',   fromLabel: 'G',  toLabel: 'G♯' },
  { from: 'A', answer: 'A#', direction: 'up',   fromLabel: 'A',  toLabel: 'A♯' },
  { from: 'B', answer: 'C5', direction: 'up',   fromLabel: 'B',  toLabel: 'C'  },
  // Ascending from black keys
  { from: 'C#', answer: 'D', direction: 'up',   fromLabel: 'C♯', toLabel: 'D'  },
  { from: 'D#', answer: 'E', direction: 'up',   fromLabel: 'D♯', toLabel: 'E'  },
  { from: 'F#', answer: 'G', direction: 'up',   fromLabel: 'F♯', toLabel: 'G'  },
  { from: 'G#', answer: 'A', direction: 'up',   fromLabel: 'G♯', toLabel: 'A'  },
  { from: 'A#', answer: 'B', direction: 'up',   fromLabel: 'A♯', toLabel: 'B'  },
  // Descending from white keys
  { from: 'D', answer: 'C#', direction: 'down', fromLabel: 'D',  toLabel: 'C♯' },
  { from: 'E', answer: 'D#', direction: 'down', fromLabel: 'E',  toLabel: 'D♯' },
  { from: 'F', answer: 'E',  direction: 'down', fromLabel: 'F',  toLabel: 'E'  },
  { from: 'G', answer: 'F#', direction: 'down', fromLabel: 'G',  toLabel: 'F♯' },
  { from: 'A', answer: 'G#', direction: 'down', fromLabel: 'A',  toLabel: 'G♯' },
  { from: 'B', answer: 'A#', direction: 'down', fromLabel: 'B',  toLabel: 'A♯' },
  // Descending from black keys
  { from: 'C#', answer: 'C', direction: 'down', fromLabel: 'C♯', toLabel: 'C'  },
  { from: 'D#', answer: 'D', direction: 'down', fromLabel: 'D♯', toLabel: 'D'  },
  { from: 'F#', answer: 'F', direction: 'down', fromLabel: 'F♯', toLabel: 'F'  },
  { from: 'G#', answer: 'G', direction: 'down', fromLabel: 'G♯', toLabel: 'G'  },
  { from: 'A#', answer: 'A', direction: 'down', fromLabel: 'A♯', toLabel: 'A'  },
]

const WHOLE_POOL: StepQuestion[] = [
  { from: 'C', answer: 'D',  direction: 'up', fromLabel: 'C',  toLabel: 'D'  },
  { from: 'D', answer: 'E',  direction: 'up', fromLabel: 'D',  toLabel: 'E'  },
  { from: 'E', answer: 'F#', direction: 'up', fromLabel: 'E',  toLabel: 'F♯' },
  { from: 'F', answer: 'G',  direction: 'up', fromLabel: 'F',  toLabel: 'G'  },
  { from: 'G', answer: 'A',  direction: 'up', fromLabel: 'G',  toLabel: 'A'  },
  { from: 'A', answer: 'B',  direction: 'up', fromLabel: 'A',  toLabel: 'B'  },
]

const LETTER_POOL: { from: string; to: string; type: 'H' | 'W' }[] = [
  { from: 'E',  to: 'F',  type: 'H' },  // given — ascending natural H
  // Ascending
  { from: 'F',  to: 'G',  type: 'W' },
  { from: 'B',  to: 'C',  type: 'H' },
  { from: 'C',  to: 'D',  type: 'W' },
  { from: 'E',  to: 'F♯', type: 'W' },
  { from: 'F♯', to: 'G',  type: 'H' },
  { from: 'A',  to: 'B♭', type: 'H' },
  { from: 'D',  to: 'E',  type: 'W' },
  { from: 'C♯', to: 'D',  type: 'H' },
  { from: 'G',  to: 'A',  type: 'W' },
  { from: 'A',  to: 'B',  type: 'W' },
  { from: 'B♭', to: 'B',  type: 'H' },
  // Descending
  { from: 'F',  to: 'E',  type: 'H' },
  { from: 'C',  to: 'B',  type: 'H' },
  { from: 'G',  to: 'F♯', type: 'H' },
  { from: 'B♭', to: 'A',  type: 'H' },
  { from: 'D♭', to: 'C',  type: 'H' },
  { from: 'D',  to: 'C',  type: 'W' },
  { from: 'E',  to: 'D',  type: 'W' },
  { from: 'A',  to: 'G',  type: 'W' },
  { from: 'B',  to: 'A',  type: 'W' },
  { from: 'F♯', to: 'E',  type: 'W' },
  { from: 'G♯', to: 'F♯', type: 'W' },
]

// pos: treble clef (0=C4,1=D4,2=E4,3=F4,4=G4,5=A4,6=B4,7=C5)
// acc: 'sharp' | 'flat' | null — accidental on that note
interface StaffPairItem {
  pos1: number; pos2: number
  acc1: 'sharp' | 'flat' | null
  acc2: 'sharp' | 'flat' | null
  name1: string; name2: string
  type: 'H' | 'W'
}

const STAFF_POOL: StaffPairItem[] = [
  // given — ascending natural H
  { pos1: 2, pos2: 3, acc1: null,    acc2: null,    name1: 'E',  name2: 'F',  type: 'H' },
  // Ascending half steps
  { pos1: 3, pos2: 4, acc1: 'sharp', acc2: null,    name1: 'F♯', name2: 'G',  type: 'H' },
  { pos1: 4, pos2: 5, acc1: 'sharp', acc2: null,    name1: 'G♯', name2: 'A',  type: 'H' },
  { pos1: 5, pos2: 6, acc1: null,    acc2: 'flat',  name1: 'A',  name2: 'B♭', type: 'H' },
  { pos1: 6, pos2: 7, acc1: null,    acc2: null,    name1: 'B',  name2: 'C',  type: 'H' },
  // Descending half steps
  { pos1: 4, pos2: 3, acc1: null,    acc2: 'sharp', name1: 'G',  name2: 'F♯', type: 'H' },
  { pos1: 6, pos2: 5, acc1: 'flat',  acc2: null,    name1: 'B♭', name2: 'A',  type: 'H' },
  { pos1: 3, pos2: 2, acc1: null,    acc2: null,    name1: 'F',  name2: 'E',  type: 'H' },
  { pos1: 5, pos2: 4, acc1: null,    acc2: 'sharp', name1: 'A',  name2: 'G♯', type: 'H' },
  // Ascending whole steps
  { pos1: 1, pos2: 2, acc1: null,    acc2: null,    name1: 'D',  name2: 'E',  type: 'W' },
  { pos1: 4, pos2: 5, acc1: null,    acc2: null,    name1: 'G',  name2: 'A',  type: 'W' },
  { pos1: 2, pos2: 3, acc1: null,    acc2: 'sharp', name1: 'E',  name2: 'F♯', type: 'W' },
  { pos1: 3, pos2: 4, acc1: null,    acc2: null,    name1: 'F',  name2: 'G',  type: 'W' },
  { pos1: 5, pos2: 6, acc1: null,    acc2: null,    name1: 'A',  name2: 'B',  type: 'W' },
  // Descending whole steps
  { pos1: 2, pos2: 1, acc1: null,    acc2: null,    name1: 'E',  name2: 'D',  type: 'W' },
  { pos1: 4, pos2: 3, acc1: null,    acc2: null,    name1: 'G',  name2: 'F',  type: 'W' },
  { pos1: 5, pos2: 4, acc1: null,    acc2: null,    name1: 'A',  name2: 'G',  type: 'W' },
  { pos1: 3, pos2: 2, acc1: 'sharp', acc2: null,    name1: 'F♯', name2: 'E',  type: 'W' },
  { pos1: 6, pos2: 5, acc1: null,    acc2: null,    name1: 'B',  name2: 'A',  type: 'W' },
]

// ── Phase definitions ─────────────────────────────────────────────────────────
type Phase = 'intro' | 'half-keyboard' | 'whole-keyboard' | 'letter-pairs' | 'staff-pairs'
const PHASE_ORDER: Phase[] = ['intro', 'half-keyboard', 'whole-keyboard', 'letter-pairs', 'staff-pairs']

// ── StepsIntro ────────────────────────────────────────────────────────────────
function StepsIntro({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 300, color: DARK, marginBottom: 4 }}>
        Half Steps &amp; Whole Steps
      </p>
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 16, lineHeight: 1.7 }}>
        Two fundamental building blocks of music are <strong style={{ color: DARK }}>half steps</strong> and{' '}
        <strong style={{ color: DARK }}>whole steps</strong>. Every scale, chord, and interval is made of these.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, background: '#F7F4ED', border: '1px solid #DDD8CA', borderRadius: 10, padding: '12px 16px' }}>
          <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: ACCENT, margin: '0 0 6px' }}>
            H — Half Step
          </p>
          <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0, lineHeight: 1.7 }}>
            Adjacent keys — no key between. Examples: C to C♯, or E to F.
          </p>
        </div>
        <div style={{ flex: 1, background: '#F7F4ED', border: '1px solid #DDD8CA', borderRadius: 10, padding: '12px 16px' }}>
          <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: ACCENT2, margin: '0 0 6px' }}>
            W — Whole Step
          </p>
          <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0, lineHeight: 1.7 }}>
            Skips exactly one key. Examples: C to D, or E to F♯.
          </p>
        </div>
      </div>

      <p style={{ fontFamily: F, fontSize: 12, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
        Remember: when counting keys, include the black keys.
      </p>

      <PrimaryBtn label="Exercise 1 →" onClick={onNext} />
    </div>
  )
}

// ── StepKeyboard (inline SVG keyboard for exercises 1 & 2) ────────────────────
function StepKeyboard({
  fromNote,
  answer,
  kbState,
  wrongNote,
  stepType,
  uid,
  onKeyClick,
}: {
  fromNote: string
  answer: string
  kbState: 'idle' | 'correct' | 'wrong'
  wrongNote: string | null
  stepType: 'half' | 'whole'
  uid: string
  onKeyClick: (note: string) => void
}) {
  const arrowMarkId = `arrMark-${uid}`
  const arrowY = KEY_Y - 22

  const isWhiteNote = (n: string) => WHITE_NOTES.includes(n) || n === 'C5'

  const wFill = (note: string) => {
    const isFrom   = note === fromNote
    const isAnswer = note === answer
    if (kbState === 'correct' && (isFrom || isAnswer)) return '#88C060'
    if (kbState === 'wrong'   && note === wrongNote)   return '#F08070'
    if (isFrom) return stepType === 'half' ? `url(#wAmber-${uid})` : `url(#wBlue-${uid})`
    return `url(#ivory-${uid})`
  }

  const bFill = (note: string) => {
    const isFrom   = note === fromNote
    const isAnswer = note === answer
    if (kbState === 'correct' && (isFrom || isAnswer)) return CORRECT
    if (kbState === 'wrong'   && note === wrongNote)   return WRONG
    if (isFrom) return stepType === 'half' ? `url(#bAmber-${uid})` : `url(#bBlue-${uid})`
    return `url(#bDark-${uid})`
  }

  const bFilter = (note: string) => {
    const isAnswer = note === answer
    if (kbState === 'correct' && isAnswer) return `url(#glowCorrect-${uid})`
    if (kbState === 'wrong'   && note === wrongNote) return `url(#glowWrong-${uid})`
    return `url(#bShadow-${uid})`
  }

  // Arrow geometry
  const fromX = isWhiteNote(fromNote)
    ? (fromNote === 'C5' ? 646 + 13 : WK_X[fromNote] + WK_W / 2)
    : BK_X[fromNote] + BK_W / 2
  const toX = answer === 'C5'
    ? 646 + 13
    : (WHITE_NOTES.includes(answer) ? WK_X[answer] + WK_W / 2 : BK_X[answer] + BK_W / 2)

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
      <defs>
        {/* Arrow marker */}
        <marker id={arrowMarkId} markerWidth="9" markerHeight="9"
          refX="4.5" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill="rgba(255,255,255,0.85)" />
        </marker>

        {/* Wood case */}
        <linearGradient id={`wood-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7A5228" />
          <stop offset="35%"  stopColor="#3a2418" />
          <stop offset="100%" stopColor="#1a0f08" />
        </linearGradient>
        <linearGradient id={`woodSheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.14" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Ivory white keys */}
        <linearGradient id={`ivory-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#fbf9f3" />
          <stop offset="60%"  stopColor="#eae2cc" />
          <stop offset="100%" stopColor="#d4cebd" />
        </linearGradient>
        {/* Left-edge shadow */}
        <linearGradient id={`lEdge-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#6A5840" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#6A5840" stopOpacity="0" />
        </linearGradient>

        {/* Amber highlight (half steps) */}
        <linearGradient id={`wAmber-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFF8E0" />
          <stop offset="55%"  stopColor="#F0D070" />
          <stop offset="100%" stopColor="#C89028" />
        </linearGradient>
        {/* Blue highlight (whole steps) */}
        <linearGradient id={`wBlue-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#EAF4FF" />
          <stop offset="55%"  stopColor="#B0CCF0" />
          <stop offset="100%" stopColor="#7098D0" />
        </linearGradient>

        {/* Black key — standard dark */}
        <linearGradient id={`bDark-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2a2420" />
          <stop offset="6%"   stopColor="#0a0805" />
          <stop offset="100%" stopColor="#1c1814" />
        </linearGradient>
        {/* Black key top sheen */}
        <radialGradient id={`bSheen-${uid}`} cx="50%" cy="18%" r="65%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.20" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Amber black key */}
        <linearGradient id={`bAmber-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#D49210" />
          <stop offset="35%"  stopColor="#7A5200" />
          <stop offset="100%" stopColor="#3A2400" />
        </linearGradient>
        {/* Blue black key */}
        <linearGradient id={`bBlue-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3868C8" />
          <stop offset="35%"  stopColor="#102060" />
          <stop offset="100%" stopColor="#040818" />
        </linearGradient>

        {/* Black key shadow */}
        <filter id={`bShadow-${uid}`} x="-12%" y="-4%" width="130%" height="120%">
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.65" />
        </filter>
        {/* Amber glow filter */}
        <filter id={`glowAmber-${uid}`} x="-25%" y="-8%" width="155%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#D49210" floodOpacity="0.75" />
        </filter>
        {/* Blue glow filter */}
        <filter id={`glowBlue-${uid}`} x="-25%" y="-8%" width="155%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#3060C0" floodOpacity="0.75" />
        </filter>
        {/* Correct glow */}
        <filter id={`glowCorrect-${uid}`} x="-25%" y="-8%" width="155%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor={CORRECT} floodOpacity="0.75" />
        </filter>
        {/* Wrong glow */}
        <filter id={`glowWrong-${uid}`} x="-25%" y="-8%" width="155%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor={WRONG} floodOpacity="0.75" />
        </filter>
      </defs>

      {/* Wood case body */}
      <rect x={0} y={0} width={VW} height={VH} fill={`url(#wood-${uid})`} />
      {/* Top sheen */}
      <rect x={0} y={32} width={VW} height={36} fill={`url(#woodSheen-${uid})`} rx={4} />

      {/* Red felt dust cover */}
      <rect x={24} y={61} width={VW - 48} height={10} fill="#6a1515" rx={3} />
      <rect x={24} y={61} width={VW - 48} height={3}  fill="#9a2828" opacity={0.55} rx={3} />

      {/* White keys */}
      {WHITE_NOTES.map(note => {
        const x = WK_X[note]
        const isFrom = note === fromNote
        return (
          <g
            key={note}
            onClick={() => !isFrom && onKeyClick(note)}
            style={{ cursor: isFrom ? 'not-allowed' : 'pointer' }}
          >
            {/* Main body */}
            <rect x={x} y={KEY_Y} width={WK_W} height={FACE_B - KEY_Y}
              fill={wFill(note)} rx={5} />
            {/* Left-edge shadow strip */}
            <rect x={x} y={KEY_Y + 6} width={14} height={FACE_B - KEY_Y - 6}
              fill={`url(#lEdge-${uid})`} />
            {/* Top surface gloss */}
            <rect x={x} y={KEY_Y} width={WK_W} height={28}
              fill="white" opacity={0.12} rx={5} />
            {/* Label */}
            <text
              x={x + WK_W / 2} y={KEY_END - 18}
              fontFamily={SERIF}
              fontSize={24} fontWeight="600"
              fill={GREY}
              textAnchor="middle" dominantBaseline="auto"
            >
              {note}
            </text>
          </g>
        )
      })}

      {/* C5 sliver */}
      {(() => {
        const sliverX = 646
        const sliverW = VW - 646 - 8
        const isFrom   = fromNote === 'C5'
        const isAnswer = answer === 'C5'
        const sliverFill = kbState === 'correct' && (isFrom || isAnswer)
          ? '#88C060'
          : kbState === 'wrong' && wrongNote === 'C5'
          ? '#F08070'
          : `url(#ivory-${uid})`
        return (
          <g
            onClick={() => !isFrom && onKeyClick('C5')}
            style={{ cursor: isFrom ? 'not-allowed' : 'pointer' }}
          >
            <rect x={sliverX} y={KEY_Y} width={sliverW} height={FACE_B - KEY_Y}
              fill={sliverFill} rx={5} />
            <rect x={sliverX} y={KEY_Y + 6} width={14} height={FACE_B - KEY_Y - 6}
              fill={`url(#lEdge-${uid})`} />
            <rect x={sliverX} y={KEY_Y} width={sliverW} height={28}
              fill="white" opacity={0.12} rx={5} />
          </g>
        )
      })()}

      {/* Black keys */}
      {BLACK_NOTES.map(note => {
        const x = BK_X[note]
        const label = BK_LABELS[note]
        const isFrom = note === fromNote
        return (
          <g key={note} filter={bFilter(note)}
            onClick={() => !isFrom && onKeyClick(note)}
            style={{ cursor: isFrom ? 'not-allowed' : 'pointer' }}
          >
            {/* Main body */}
            <rect x={x} y={KEY_Y} width={BK_W} height={BK_H}
              fill={bFill(note)} rx={7} />
            {/* Radial top sheen */}
            <rect x={x} y={KEY_Y} width={BK_W} height={BK_H}
              fill={`url(#bSheen-${uid})`} rx={7} />
            {/* Front face shadow */}
            <rect x={x + 4} y={BK_END - 22} width={BK_W - 8} height={22}
              fill="#2A1808" opacity={0.55} rx={4} />
            {/* Label */}
            <text
              x={x + BK_W / 2} y={BK_END - 9}
              fontFamily={SERIF}
              fontSize={15} fontWeight="700"
              fill="#A89870"
              textAnchor="middle" dominantBaseline="auto"
            >
              {label}
            </text>
          </g>
        )
      })}

      {/* Bottom wood */}
      <rect x={0} y={FACE_B} width={VW} height={VH - FACE_B}
        fill={`url(#wood-${uid})`} />

      {/* Arrow when correct */}
      {kbState === 'correct' && (
        <line
          x1={fromX} y1={arrowY}
          x2={toX}   y2={arrowY}
          stroke="rgba(255,255,255,0.85)" strokeWidth={3}
          markerEnd={`url(#${arrowMarkId})`}
        />
      )}
    </svg>
  )
}

// ── StepKeyboardEx ────────────────────────────────────────────────────────────
function StepKeyboardEx({
  pool,
  total,
  stepType,
  exLabel,
  onDone,
}: {
  pool: StepQuestion[]
  total: number
  stepType: 'half' | 'whole'
  exLabel: string
  onDone: () => void
}) {
  const items = useMemo(() => shuffled(pool).slice(0, total), [])

  const [idx,      setIdx]      = useState(0)
  const [kbState,  setKbState]  = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongNote, setWrongNote] = useState<string | null>(null)
  const lockedRef = useRef(false)

  const item        = items[idx]
  const fromNote    = item.from
  const answer      = item.answer
  const direction   = item.direction
  const accentColor = stepType === 'half' ? ACCENT : ACCENT2
  const uid         = stepType === 'half' ? 'hk' : 'wk'

  function handleKeyClick(note: string) {
    if (lockedRef.current) return
    lockedRef.current = true
    if (note === answer) {
      setKbState('correct')
      setTimeout(() => {
        const next = idx + 1
        if (next >= total) { onDone(); return }
        setIdx(next)
        setKbState('idle')
        setWrongNote(null)
        lockedRef.current = false
      }, 1200)
    } else {
      setWrongNote(note)
      setKbState('wrong')
      setTimeout(() => {
        setKbState('idle')
        setWrongNote(null)
        lockedRef.current = false
      }, 800)
    }
  }

  const feedbackText = (() => {
    if (kbState === 'wrong') {
      return stepType === 'half'
        ? 'Try again — look for the adjacent key'
        : 'Try again — skip exactly one key'
    }
    if (kbState === 'correct') {
      return `✓ ${item.fromLabel} → ${item.toLabel}`
    }
    return ''
  })()

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{exLabel}</p>
      <ProgressBar done={idx} total={total} color={accentColor} />
      <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 12, lineHeight: 1.7 }}>
        Starting from{' '}
        <strong style={{ color: accentColor }}>{item.fromLabel}</strong>
        {' '}— click the key one <strong>{stepType === 'half' ? 'half' : 'whole'} step</strong>{' '}
        <strong>{direction === 'up' ? 'above' : 'below'}</strong>
      </p>

      <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.40)', marginBottom: 12 }}>
        <StepKeyboard
          fromNote={fromNote}
          answer={answer}
          kbState={kbState}
          wrongNote={wrongNote}
          stepType={stepType}
          uid={uid}
          onKeyClick={handleKeyClick}
        />
      </div>

      <p style={{
        fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: kbState === 'correct' ? CORRECT : kbState === 'wrong' ? WRONG : '#B0ACA4',
      }}>
        {feedbackText}
      </p>
    </div>
  )
}

// ── LetterPairEx ──────────────────────────────────────────────────────────────
function LetterPairEx({
  total = 8,
  exLabel,
  onDone,
}: {
  total?: number
  exLabel: string
  onDone: (correct: number, total: number) => void
}) {
  const scoredItems = useMemo(() => shuffled(LETTER_POOL.slice(1)).slice(0, total), [])

  const [showExample, setShowExample] = useState(true)
  const [idx,         setIdx]         = useState(0)
  const [answered,    setAnswered]     = useState<'H' | 'W' | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  function handleAnswer(choice: 'H' | 'W') {
    if (lockedRef.current || answered !== null) return
    lockedRef.current = true
    setAnswered(choice)
    const item = scoredItems[idx]
    const ok = choice === item.type
    if (ok) correctRef.current += 1
    setTimeout(() => {
      const next = idx + 1
      if (next >= scoredItems.length) {
        onDone(correctRef.current, scoredItems.length)
        return
      }
      setIdx(next)
      setAnswered(null)
      lockedRef.current = false
    }, 1200)
  }

  if (showExample) {
    const ex = LETTER_POOL[0]
    return (
      <div>
        <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{exLabel}</p>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 16, lineHeight: 1.7 }}>
          For each pair of notes, identify whether they are a <strong>half step (H)</strong> or a{' '}
          <strong>whole step (W)</strong> apart.
        </p>

        <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
          padding: '20px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontFamily: SERIF, fontSize: 42, color: DARK, lineHeight: 1.2, marginBottom: 16 }}>
            <span>{ex.from}</span>
            <span style={{ color: GREY, margin: '0 16px' }}>→</span>
            <span>{ex.to}</span>
          </div>
          <div style={{ display: 'inline-block', background: ACCENT + '22',
            border: `1px solid ${ACCENT}55`, borderRadius: 8,
            padding: '6px 18px', fontFamily: F, fontSize: 14, fontWeight: 700, color: ACCENT,
            marginBottom: 12 }}>
            H — Half Step
          </div>
          <p style={{ fontFamily: F, fontSize: 13, color: GREY, margin: 0, lineHeight: 1.7 }}>
            E and F are adjacent white keys — no black key between them.
          </p>
        </div>

        <PrimaryBtn label="Exercise 3 →" onClick={() => setShowExample(false)} />
      </div>
    )
  }

  const item = scoredItems[idx]

  const btnStyle = (choice: 'H' | 'W') => {
    const isChosen  = answered === choice
    const isCorrect = choice === item.type
    let bg: string = '#EDE8DF', color: string = GREY
    if (answered !== null) {
      if (isCorrect)       { bg = CORRECT; color = 'white' }
      else if (isChosen)   { bg = WRONG;   color = 'white' }
    } else {
      bg = DARK; color = 'white'
    }
    return {
      padding: '10px 20px', borderRadius: 10, fontFamily: F,
      fontSize: 14, fontWeight: 600, cursor: answered !== null ? 'default' : 'pointer',
      border: 'none', background: bg, color,
    } as React.CSSProperties
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{exLabel}</p>
      <ProgressBar done={idx} total={scoredItems.length} color={ACCENT} />

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '20px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontFamily: SERIF, fontSize: 42, color: DARK, lineHeight: 1.2 }}>
          <span>{item.from}</span>
          <span style={{ color: GREY, margin: '0 16px' }}>→</span>
          <span>{item.to}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
        <button style={btnStyle('H')} onClick={() => handleAnswer('H')}>
          H — Half Step
        </button>
        <button style={btnStyle('W')} onClick={() => handleAnswer('W')}>
          W — Whole Step
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: answered === null ? '#B0ACA4' : answered === item.type ? CORRECT : WRONG }}>
        {answered !== null && answered !== item.type && (
          <>Correct answer: <strong style={{ color: CORRECT }}>{item.type === 'H' ? 'H — Half Step' : 'W — Whole Step'}</strong></>
        )}
        {answered !== null && answered === item.type && '✓ Correct'}
      </p>
    </div>
  )
}

// ── StaffPairEx ───────────────────────────────────────────────────────────────
const NOTE1_X = 150
const NOTE2_X = 240

const ACC_SHARP = '\uE262'
const ACC_FLAT  = '\uE260'

function Accidental({ cx, cy, type }: { cx: number; cy: number; type: 'sharp' | 'flat' }) {
  return (
    <text x={cx - 20} y={cy}
      fontFamily="Bravura, serif" fontSize={48}
      fill={DARK} textAnchor="middle" dominantBaseline="central">
      {type === 'sharp' ? ACC_SHARP : ACC_FLAT}
    </text>
  )
}

function StaffPairSVG({ item }: { item: StaffPairItem }) {
  const cy1 = posToY(item.pos1)
  const cy2 = posToY(item.pos2)

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
      style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
      <StaffBase />
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE} />
      <TrebleClef />

      {/* Ledger lines for C4 (pos=0) */}
      {item.pos1 === 0 && <LedgerLine cx={NOTE1_X} cy={cy1} />}
      {item.pos2 === 0 && <LedgerLine cx={NOTE2_X} cy={cy2} />}

      {item.acc1 && <Accidental cx={NOTE1_X} cy={cy1} type={item.acc1} />}
      <BravuraNote cx={NOTE1_X} cy={cy1} color={DARK} />
      {item.acc2 && <Accidental cx={NOTE2_X} cy={cy2} type={item.acc2} />}
      <BravuraNote cx={NOTE2_X} cy={cy2} color={DARK} />
    </svg>
  )
}

function StaffPairEx({
  total = 6,
  exLabel,
  onDone,
}: {
  total?: number
  exLabel: string
  onDone: (correct: number, total: number) => void
}) {
  const scoredItems = useMemo(() => shuffled(STAFF_POOL.slice(1)).slice(0, total), [])

  const [showExample, setShowExample] = useState(true)
  const [idx,         setIdx]         = useState(0)
  const [answered,    setAnswered]     = useState<'H' | 'W' | null>(null)
  const correctRef = useRef(0)
  const lockedRef  = useRef(false)

  function handleAnswer(choice: 'H' | 'W') {
    if (lockedRef.current || answered !== null) return
    lockedRef.current = true
    setAnswered(choice)
    const item = scoredItems[idx]
    const ok = choice === item.type
    if (ok) correctRef.current += 1
    setTimeout(() => {
      const next = idx + 1
      if (next >= scoredItems.length) {
        onDone(correctRef.current, scoredItems.length)
        return
      }
      setIdx(next)
      setAnswered(null)
      lockedRef.current = false
    }, 1200)
  }

  if (showExample) {
    const ex = STAFF_POOL[0]
    return (
      <div>
        <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{exLabel}</p>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 16, lineHeight: 1.7 }}>
          Now identify half and whole steps on the staff. The letter names will help you.
        </p>

        <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
          padding: '8px 0', marginBottom: 12 }}>
          <StaffPairSVG item={ex} />
        </div>

        <div style={{ display: 'inline-block', background: ACCENT + '22',
          border: `1px solid ${ACCENT}55`, borderRadius: 8,
          padding: '6px 18px', fontFamily: F, fontSize: 14, fontWeight: 700, color: ACCENT,
          marginBottom: 12 }}>
          H — Half Step
        </div>
        <p style={{ fontFamily: F, fontSize: 13, color: GREY, marginBottom: 20, lineHeight: 1.7 }}>
          E and F are adjacent white notes — no black key between them.
        </p>

        <PrimaryBtn label="Exercise 4 →" onClick={() => setShowExample(false)} />
      </div>
    )
  }

  const item = scoredItems[idx]

  const btnStyle = (choice: 'H' | 'W') => {
    const isChosen  = answered === choice
    const isCorrect = choice === item.type
    let bg: string = DARK, color: string = 'white'
    if (answered !== null) {
      if (isCorrect)       { bg = CORRECT; color = 'white' }
      else if (isChosen)   { bg = WRONG;   color = 'white' }
      else                 { bg = '#EDE8DF'; color = GREY  }
    }
    return {
      padding: '10px 20px', borderRadius: 10, fontFamily: F,
      fontSize: 14, fontWeight: 600, cursor: answered !== null ? 'default' : 'pointer',
      border: 'none', background: bg, color,
    } as React.CSSProperties
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#B0ACA4', marginBottom: 16 }}>{exLabel}</p>
      <ProgressBar done={idx} total={scoredItems.length} color={ACCENT} />

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '8px 0', marginBottom: 16 }}>
        <StaffPairSVG item={item} />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
        <button style={btnStyle('H')} onClick={() => handleAnswer('H')}>
          H — Half Step
        </button>
        <button style={btnStyle('W')} onClick={() => handleAnswer('W')}>
          W — Whole Step
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, minHeight: '1.5em',
        color: answered === null ? '#B0ACA4' : answered === item.type ? CORRECT : WRONG }}>
        {answered !== null && answered !== item.type && (
          <>Correct answer: <strong style={{ color: CORRECT }}>{item.type === 'H' ? 'H — Half Step' : 'W — Whole Step'}</strong></>
        )}
        {answered !== null && answered === item.type && '✓ Correct'}
      </p>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function HalfWholeStepsLesson({
  passingScore,
  onComplete,
}: {
  passingScore: number
  onComplete: (score: number, total: number) => void
}) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [key,   setKey]   = useState(0)
  const scoreRef = useRef({ correct: 0, total: 0 })

  function next() {
    const idx = PHASE_ORDER.indexOf(phase)
    if (idx + 1 >= PHASE_ORDER.length) {
      const { correct, total } = scoreRef.current
      onComplete(total > 0 ? correct / total : 1, total)
      return
    }
    setPhase(PHASE_ORDER[idx + 1])
    setKey(k => k + 1)
  }

  function scored(correct: number, total: number) {
    scoreRef.current.correct += correct
    scoreRef.current.total   += total
    next()
  }

  if (phase === 'intro') {
    return <StepsIntro key={key} onNext={next} />
  }
  if (phase === 'half-keyboard') {
    return (
      <StepKeyboardEx
        key={key}
        pool={HALF_POOL}
        total={12}
        stepType="half"
        exLabel="Exercise 1 — Half steps on the keyboard"
        onDone={next}
      />
    )
  }
  if (phase === 'whole-keyboard') {
    return (
      <StepKeyboardEx
        key={key}
        pool={WHOLE_POOL}
        total={6}
        stepType="whole"
        exLabel="Exercise 2 — Whole steps on the keyboard"
        onDone={next}
      />
    )
  }
  if (phase === 'letter-pairs') {
    return (
      <LetterPairEx
        key={key}
        total={14}
        exLabel="Exercise 3 — Half or whole step?"
        onDone={scored}
      />
    )
  }
  return (
    <StaffPairEx
      key={key}
      total={12}
      exLabel="Exercise 4 — Steps on the staff"
      onDone={scored}
    />
  )
}
