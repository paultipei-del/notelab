'use client'

import { useState, useEffect } from 'react'

// Realistic one-octave piano keyboard (C–C)
// Dimensions based on standard acoustic piano proportions
//
// viewBox: 0 0 680 480
// White key: 88px pitch, 86px usable (2px gap), 372px tall
// Black key: 51px wide, 232px tall
// Asymmetric black key offsets match real hammer spacing

const VW = 680
const VH = 480

const KEY_Y   = 69   // top of keys
const KEY_END = 441  // bottom of white keys (372px height)
const KEY_H   = KEY_END - KEY_Y
const FACE_B  = 449  // bottom of front face
const BK_END  = 301  // bottom of black keys (232px height)
const BK_H    = BK_END - KEY_Y

const WK_W = 86  // usable white key width (88px pitch - 2px gap)
const BK_W = 51  // black key width (≈ 58% of 88)

// White key left-edge x positions
const WK_X: Record<string, number> = {
  C: 30, D: 118, E: 206, F: 294, G: 382, A: 470, B: 558,
}

// Black key left-edge x positions — asymmetric, matching real piano hammer spacing
const BK_X: Record<string, number> = {
  'C#': 82, 'D#': 175, 'F#': 343, 'G#': 437, 'A#': 531,
}

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_NOTES = ['C#', 'D#', 'F#', 'G#', 'A#']

const BK_LABELS: Record<string, { sharp: string; flat: string }> = {
  'C#': { sharp: 'C♯', flat: 'D♭' },
  'D#': { sharp: 'D♯', flat: 'E♭' },
  'F#': { sharp: 'F♯', flat: 'G♭' },
  'G#': { sharp: 'G♯', flat: 'A♭' },
  'A#': { sharp: 'A♯', flat: 'B♭' },
}

// Sharp of each white key (within this octave)
const SHARP_TARGET: Record<string, { note: string; isBlack: boolean } | null> = {
  C: { note: 'C#', isBlack: true  },
  D: { note: 'D#', isBlack: true  },
  E: { note: 'F',  isBlack: false },  // E♯ = F (enharmonic)
  F: { note: 'F#', isBlack: true  },
  G: { note: 'G#', isBlack: true  },
  A: { note: 'A#', isBlack: true  },
  B: null,                             // B♯ = C in next octave — out of range
}

// Flat of each white key (within this octave)
const FLAT_TARGET: Record<string, { note: string; isBlack: boolean } | null> = {
  C: null,                             // C♭ = B in prev octave — out of range
  D: { note: 'C#', isBlack: true  },  // D♭ = C#
  E: { note: 'D#', isBlack: true  },  // E♭ = D#
  F: { note: 'E',  isBlack: false },  // F♭ = E (enharmonic)
  G: { note: 'F#', isBlack: true  },  // G♭ = F#
  A: { note: 'G#', isBlack: true  },  // A♭ = G#
  B: { note: 'A#', isBlack: true  },  // B♭ = A#
}

// Accidental display names — always use the selected note's letter, not the enharmonic
const SHARP_DISPLAY: Record<string, string> = {
  C: 'C♯', D: 'D♯', E: 'E♯', F: 'F♯', G: 'G♯', A: 'A♯', B: 'B♯',
}
const FLAT_DISPLAY: Record<string, string> = {
  C: 'C♭', D: 'D♭', E: 'E♭', F: 'F♭', G: 'G♭', A: 'A♭', B: 'B♭',
}

// Whole step above each white key (2 semitones; B is out of range for this octave)
const WHOLE_TARGET: Record<string, { note: string; isBlack: boolean } | null> = {
  C: { note: 'D',  isBlack: false },
  D: { note: 'E',  isBlack: false },
  E: { note: 'F#', isBlack: true  },  // E + whole = F♯ (skips F)
  F: { note: 'G',  isBlack: false },
  G: { note: 'A',  isBlack: false },
  A: { note: 'B',  isBlack: false },
  B: null,                             // B + whole = C♯ in next octave — out of range
}

// Half step above each black key (= the next white key, no black between)
const SHARP_TARGET_BK: Record<string, { note: string; isBlack: boolean }> = {
  'C#': { note: 'D',  isBlack: false },
  'D#': { note: 'E',  isBlack: false },
  'F#': { note: 'G',  isBlack: false },
  'G#': { note: 'A',  isBlack: false },
  'A#': { note: 'B',  isBlack: false },
}

// Whole step above each black key (2 semitones)
const WHOLE_TARGET_BK: Record<string, { note: string; isBlack: boolean } | null> = {
  'C#': { note: 'D#', isBlack: true  },  // C# + 2 = D#
  'D#': { note: 'F',  isBlack: false },  // D# + 2 = F (skips E)
  'F#': { note: 'G#', isBlack: true  },  // F# + 2 = G#
  'G#': { note: 'A#', isBlack: true  },  // G# + 2 = A#
  'A#': null,                             // A# + 2 = C in next octave — out of range
}

// ── Descending targets ─────────────────────────────────────────────────────
// Half step below each white key = FLAT_TARGET (already defined above, reused)

// Whole step below each white key
const WHOLE_TARGET_DOWN: Record<string, { note: string; isBlack: boolean } | null> = {
  C: null,                              // C - 2 = A# in prev octave — out of range
  D: { note: 'C',  isBlack: false },   // D - 2 = C
  E: { note: 'D',  isBlack: false },   // E - 2 = D
  F: { note: 'D#', isBlack: true  },   // F - 2 = D#
  G: { note: 'F',  isBlack: false },   // G - 2 = F
  A: { note: 'G',  isBlack: false },   // A - 2 = G
  B: { note: 'A',  isBlack: false },   // B - 2 = A
}

// Half step below each black key (= adjacent white key to the left)
const HALF_TARGET_BK_DOWN: Record<string, { note: string; isBlack: boolean }> = {
  'C#': { note: 'C',  isBlack: false },
  'D#': { note: 'D',  isBlack: false },
  'F#': { note: 'F',  isBlack: false },
  'G#': { note: 'G',  isBlack: false },
  'A#': { note: 'A',  isBlack: false },
}

// Whole step below each black key
const WHOLE_TARGET_BK_DOWN: Record<string, { note: string; isBlack: boolean } | null> = {
  'C#': null,                             // C# - 2 = B in prev octave — out of range
  'D#': { note: 'C#', isBlack: true  },  // D# - 2 = C#
  'F#': { note: 'E',  isBlack: false },  // F# - 2 = E
  'G#': { note: 'F#', isBlack: true  },  // G# - 2 = F#
  'A#': { note: 'G#', isBlack: true  },  // A# - 2 = G#
}

export type PianoMode = 'sharps' | 'flats' | 'naturals' | 'half-steps' | 'whole-steps'

export function PianoKeyboard({ mode }: { mode: PianoMode }) {
  const uid = mode

  const defaultSelected = (m: PianoMode) =>
    m === 'flats' ? 'D' : 'C'

  const [selected, setSelected] = useState<string>(defaultSelected(mode))
  const [direction, setDirection] = useState<'up' | 'down'>('up')

  // Reset selection when mode tab changes
  useEffect(() => {
    setSelected(defaultSelected(mode))
  }, [mode])

  const isStepMode = mode === 'half-steps' || mode === 'whole-steps'
  const isBlackSelected = BLACK_NOTES.includes(selected)

  // Amber = ascending steps or sharps lesson; Blue = descending steps or flats lesson
  const useAmber = mode === 'sharps' || (isStepMode && direction === 'up')
  const useBlue  = mode === 'flats'  || (isStepMode && direction === 'down')

  // What does the selected key move to?
  const target = (() => {
    if (mode === 'sharps')
      return isBlackSelected ? SHARP_TARGET_BK[selected] : SHARP_TARGET[selected]
    if (mode === 'flats')
      return isBlackSelected ? null : FLAT_TARGET[selected]
    if (mode === 'half-steps')
      return direction === 'up'
        ? (isBlackSelected ? SHARP_TARGET_BK[selected]   : SHARP_TARGET[selected])
        : (isBlackSelected ? HALF_TARGET_BK_DOWN[selected]: FLAT_TARGET[selected])
    if (mode === 'whole-steps')
      return direction === 'up'
        ? (isBlackSelected ? WHOLE_TARGET_BK[selected]     : WHOLE_TARGET[selected])
        : (isBlackSelected ? WHOLE_TARGET_BK_DOWN[selected]: WHOLE_TARGET_DOWN[selected])
    return null
  })()

  // ── White key fill ───────────────────────────────────────────────────────
  const wFill = (note: string) => {
    if (mode === 'naturals') return `url(#green-${uid})`
    const isSelected = !isBlackSelected && note === selected
    const isTarget   = target && !target.isBlack && target.note === note
    if (useAmber && (isSelected || isTarget)) return `url(#wAmber-${uid})`
    if (useBlue  && (isSelected || isTarget)) return `url(#wBlue-${uid})`
    return `url(#ivory-${uid})`
  }

  const wLabelColor = (note: string) => {
    if (mode === 'naturals') return '#1A5C0A'
    const isSelected = !isBlackSelected && note === selected
    const isTarget   = target && !target.isBlack && target.note === note
    if (useAmber && (isSelected || isTarget)) return '#7A4800'
    if (useBlue  && (isSelected || isTarget)) return '#1A3A6A'
    return '#7A7060'
  }

  // ── Black key fill ───────────────────────────────────────────────────────
  const bFill = (note: string) => {
    if (mode === 'naturals') return `url(#bGray-${uid})`
    const isFrom   = isBlackSelected && note === selected
    const isTarget = target?.isBlack && target.note === note
    if (useAmber && (isFrom || isTarget)) return `url(#bAmber-${uid})`
    if (useBlue  && (isFrom || isTarget)) return `url(#bBlue-${uid})`
    return `url(#bDark-${uid})`
  }

  const bFilter = (note: string) => {
    const isFrom   = isBlackSelected && note === selected
    const isTarget = target?.isBlack && target.note === note
    if (useAmber && (isFrom || isTarget)) return `url(#glowAmber-${uid})`
    if (useBlue  && (isFrom || isTarget)) return `url(#glowBlue-${uid})`
    return `url(#bShadow-${uid})`
  }

  const bLabel = (note: string) => {
    if (mode === 'naturals') return null
    const bl = BK_LABELS[note]
    return mode === 'flats' ? bl.flat : bl.sharp
  }

  const bLabelColor = (note: string) => {
    const isFrom   = isBlackSelected && note === selected
    const isTarget = target?.isBlack && target.note === note
    if (useAmber && (isFrom || isTarget)) return '#FFE890'
    if (useBlue  && (isFrom || isTarget)) return '#C0D8FF'
    return '#A89870'
  }

  const wLabel = (note: string) => {
    if (mode === 'naturals') return note + '♮'
    // Enharmonic white-key targets get the accidental name only in sharps/flats lesson (e.g. F → E♯)
    // Half-steps and whole-steps always use the plain note name
    if (!isBlackSelected && (mode === 'sharps' || mode === 'flats') && target && !target.isBlack && target.note === note) {
      return mode === 'flats' ? FLAT_DISPLAY[selected] : SHARP_DISPLAY[selected]
    }
    return note
  }

  // ── Arrow geometry — dynamic based on selection ──────────────────────────
  const arrowY     = KEY_Y - 22
  const arrowMarkId = `arrMark-${uid}`

  const fromX = isBlackSelected
    ? BK_X[selected] + BK_W / 2
    : WK_X[selected] + WK_W / 2
  const toX   = target
    ? target.isBlack
      ? BK_X[target.note] + BK_W / 2
      : WK_X[target.note] + WK_W / 2
    : 0

  const showArrow   = mode !== 'naturals' && target !== null
  const accentColor =
    mode === 'naturals' ? '#7A7060' :
    useAmber            ? '#4A9E30' : '#5580D8'
  const arrowLabel =
    mode === 'sharps'   ? '♯ raises by a half step' :
    mode === 'flats'    ? '♭ lowers by a half step' :
    mode === 'naturals' ? '♮ cancels any sharp or flat' :
    mode === 'half-steps'
      ? (direction === 'up' ? 'H — adjacent keys going up' : 'H — adjacent keys going down')
      : (direction === 'up' ? 'W — skips one key going up'  : 'W — skips one key going down')

  // Result label e.g. "E → E♯", "C → D", "C♯ → D"
  const resultLabel = (() => {
    if (mode === 'naturals') return selected + '♮'
    if (!target) return null
    const fromDisplay = isBlackSelected ? BK_LABELS[selected].sharp : selected
    let toName: string
    if (mode === 'sharps') {
      // Sharps lesson: use enharmonic name (E → E♯, not E → F)
      toName = isBlackSelected ? target.note : SHARP_DISPLAY[selected]
    } else if (mode === 'flats') {
      // Flats lesson: use enharmonic name (F → F♭, not F → E)
      toName = FLAT_DISPLAY[selected]
    } else {
      // Half-steps and whole-steps: always use the actual note name (E → F, not E → E♯)
      toName = target.isBlack
        ? BK_LABELS[target.note].sharp         // e.g. F♯, D♯, G♯
        : target.note                          // e.g. D, E, F, G, B…
    }
    return `${fromDisplay} → ${toName}`
  })()

  return (
    <div style={{ width: '100%', marginBottom: 4 }}>
      {/* Badge + result label + direction toggle row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 10, paddingLeft: 2,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: accentColor + '1A',
          border: `1px solid ${accentColor}55`,
          borderRadius: 8,
          padding: '5px 12px',
          fontFamily: 'var(--font-jost), sans-serif',
          fontSize: 13, fontWeight: 600,
          color: accentColor,
        }}>
          {arrowLabel}
        </span>
        {resultLabel && (
          <span style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 17, fontWeight: 600,
            color: accentColor,
            opacity: 0.9,
          }}>
            {resultLabel}
          </span>
        )}
        {isStepMode && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {(['up', 'down'] as const).map(dir => {
              const isActive = direction === dir
              return (
                <button
                  key={dir}
                  onClick={() => {
                    setDirection(dir)
                    // Reset to a key that is valid in the new direction
                    setSelected(dir === 'down' ? 'D' : 'C')
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px',
                    background: isActive ? accentColor : 'transparent',
                    border: `1px solid ${isActive ? accentColor : '#DDD8CA'}`,
                    borderRadius: 6,
                    fontFamily: 'var(--font-jost), sans-serif',
                    fontSize: 12, fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'white' : '#7A7060',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {dir === 'up' ? '↑' : '↓'}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.40)',
      }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
        <defs>
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
            <stop offset="0%"   stopColor="#fefdf9" />
            <stop offset="60%"  stopColor="#f4eedc" />
            <stop offset="100%" stopColor="#e5dfcb" />
          </linearGradient>
          {/* Left-edge shadow per white key */}
          <linearGradient id={`lEdge-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6A5840" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#6A5840" stopOpacity="0" />
          </linearGradient>

          {/* Amber highlight (sharps) */}
          <linearGradient id={`wAmber-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FFF8E0" />
            <stop offset="55%"  stopColor="#F0D070" />
            <stop offset="100%" stopColor="#C89028" />
          </linearGradient>
          {/* Blue highlight (flats) */}
          <linearGradient id={`wBlue-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#EAF4FF" />
            <stop offset="55%"  stopColor="#B0CCF0" />
            <stop offset="100%" stopColor="#7098D0" />
          </linearGradient>
          {/* Green (naturals) */}
          <linearGradient id={`green-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#F0FAE0" />
            <stop offset="55%"  stopColor="#C0E890" />
            <stop offset="100%" stopColor="#88C060" />
          </linearGradient>

          {/* Black key — standard dark */}
          <linearGradient id={`bDark-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2a2420" />
            <stop offset="6%"   stopColor="#0a0805" />
            <stop offset="100%" stopColor="#1c1814" />
          </linearGradient>
          {/* Black key top sheen (curvature) */}
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
          {/* Gray black key (naturals) */}
          <linearGradient id={`bGray-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#686460" />
            <stop offset="40%"  stopColor="#404038" />
            <stop offset="100%" stopColor="#202020" />
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

          {/* Arrow marker */}
          <marker id={arrowMarkId} markerWidth="9" markerHeight="9"
            refX="4.5" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 Z" fill="rgba(255,255,255,0.85)" />
          </marker>
        </defs>

        {/* ── Wood case body ─────────────────────────────────────────────── */}
        <rect x={0} y={0} width={VW} height={VH} fill={`url(#wood-${uid})`} />
        {/* Top sheen */}
        <rect x={0} y={32} width={VW} height={36}
          fill={`url(#woodSheen-${uid})`} rx={4} />

        {/* Red felt dust cover */}
        <rect x={24} y={61} width={VW - 48} height={10}
          fill="#6a1515" rx={3} />
        <rect x={24} y={61} width={VW - 48} height={3}
          fill="#9a2828" opacity={0.55} rx={3} />

        {/* ── White keys ─────────────────────────────────────────────────── */}
        {WHITE_NOTES.map(note => {
          const x = WK_X[note]
          const targetMap =
            mode === 'flats' || (mode === 'half-steps' && direction === 'down') ? FLAT_TARGET :
            mode === 'whole-steps' && direction === 'down' ? WHOLE_TARGET_DOWN :
            mode === 'whole-steps' ? WHOLE_TARGET : SHARP_TARGET
          const isInactive = mode !== 'naturals' && targetMap[note] === null
          return (
            <g
              key={note}
              onClick={() => !isInactive && setSelected(note)}
              style={{ cursor: isInactive ? 'not-allowed' : 'pointer' }}
            >
              {/* Main body — extends to FACE_B so it owns the rounded bottom corners */}
              <rect x={x} y={KEY_Y} width={WK_W} height={FACE_B - KEY_Y}
                fill={wFill(note)} rx={5} />
              {/* Left-edge shadow strip (3D depth) — runs full key height */}
              <rect x={x} y={KEY_Y + 6} width={14} height={FACE_B - KEY_Y - 6}
                fill={`url(#lEdge-${uid})`} />
              {/* Top surface gloss */}
              <rect x={x} y={KEY_Y} width={WK_W} height={28}
                fill="white" opacity={0.12} rx={5} />
              {/* Inactive overlay (B in sharps, C in flats) */}
              {isInactive && (
                <rect x={x} y={KEY_Y} width={WK_W} height={FACE_B - KEY_Y}
                  fill="rgba(0,0,0,0.18)" rx={5} />
              )}
              {/* Label */}
              <text
                x={x + WK_W / 2} y={KEY_END - 18}
                fontFamily="var(--font-cormorant), serif"
                fontSize={24} fontWeight="600"
                fill={wLabelColor(note)}
                textAnchor="middle" dominantBaseline="auto"
              >
                {wLabel(note)}
              </text>
            </g>
          )
        })}

        {/* C8 sliver (rightmost partial C) — grayed when B is inactive */}
        {(() => {
          const bInactive = mode !== 'naturals' && (() => {
            if (mode === 'flats') return FLAT_TARGET['B'] === null  // false, B♭ is valid
            if (mode === 'half-steps' && direction === 'down') return FLAT_TARGET['B'] === null
            if (mode === 'whole-steps' && direction === 'down') return WHOLE_TARGET_DOWN['B'] === null
            return SHARP_TARGET['B'] === null  // true for sharps, ascending half/whole
          })()
          return (
            <g>
              <rect x={646} y={KEY_Y} width={VW - 646 - 8} height={FACE_B - KEY_Y}
                fill={`url(#ivory-${uid})`} rx={5} />
              {bInactive && (
                <rect x={646} y={KEY_Y} width={VW - 646 - 8} height={FACE_B - KEY_Y}
                  fill="rgba(0,0,0,0.18)" rx={5} />
              )}
            </g>
          )
        })()}

        {/* ── Black keys ─────────────────────────────────────────────────── */}
        {BLACK_NOTES.map(note => {
          const x = BK_X[note]
          const label = bLabel(note)
          const bkIsInactive = isStepMode && mode === 'whole-steps' && (
            direction === 'up' ? WHOLE_TARGET_BK[note] === null : WHOLE_TARGET_BK_DOWN[note] === null
          )
          return (
            <g
              key={note}
              filter={bFilter(note)}
              onClick={() => isStepMode && !bkIsInactive && setSelected(note)}
              style={{ cursor: isStepMode && !bkIsInactive ? 'pointer' : 'default' }}
            >
              {/* Main body */}
              <rect x={x} y={KEY_Y} width={BK_W} height={BK_H}
                fill={bFill(note)} rx={7} />
              {/* Radial top sheen (curvature illusion) */}
              <rect x={x} y={KEY_Y} width={BK_W} height={BK_H}
                fill={`url(#bSheen-${uid})`} rx={7} />
              {/* Front face shadow at bottom */}
              <rect x={x + 4} y={BK_END - 22} width={BK_W - 8} height={22}
                fill="#2A1808" opacity={0.55} rx={4} />
              {/* Inactive overlay (A# in whole-steps) */}
              {bkIsInactive && (
                <rect x={x} y={KEY_Y} width={BK_W} height={BK_H}
                  fill="rgba(0,0,0,0.35)" rx={7} />
              )}
              {/* Label — single line for sharps/flats lesson; dual for step modes */}
              {label && (
                <text
                  x={x + BK_W / 2} y={isStepMode ? BK_END - 20 : BK_END - 9}
                  fontFamily="var(--font-cormorant), serif"
                  fontSize={isStepMode ? 13 : 15} fontWeight="700"
                  fill={bLabelColor(note)}
                  textAnchor="middle" dominantBaseline="auto"
                >
                  {label}
                </text>
              )}
              {isStepMode && (
                <text
                  x={x + BK_W / 2} y={BK_END - 6}
                  fontFamily="var(--font-cormorant), serif"
                  fontSize={12} fontWeight="600"
                  fill={bLabelColor(note)}
                  textAnchor="middle" dominantBaseline="auto"
                  opacity={0.7}
                >
                  {BK_LABELS[note].flat}
                </text>
              )}
            </g>
          )
        })}

        {/* ── Bottom wood ────────────────────────────────────────────────── */}
        <rect x={0} y={FACE_B} width={VW} height={VH - FACE_B}
          fill={`url(#wood-${uid})`} />

        {/* ── Arrow (sharps / flats) — dynamic, white line on dark wood ─── */}
        {showArrow && (
          <line
            x1={fromX} y1={arrowY}
            x2={toX}   y2={arrowY}
            stroke="rgba(255,255,255,0.85)" strokeWidth={3}
            markerEnd={`url(#${arrowMarkId})`}
          />
        )}
      </svg>
      </div>
    </div>
  )
}
