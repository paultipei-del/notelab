'use client'

import { useState } from 'react'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'
const DARK = '#1A1A18'
const GREY = '#B0ACA4'
const ACCENT = '#BA7517'
const MAJ_C = '#2A5C0A'
const MIN_C = '#3B6DB5'
const STROKE_W = 1.2

// ── Lesson 8: shared pattern data (used by Visual Guide + lesson exercises) ─
// Keys are identified by chromatic index from C4 (C4=0, C♯4=1, D4=2, ... C6=24).
// Each pattern lists its 5 notes in order; triad = indices 0, 2, 4 of that list.
export type MajorKey = 'C' | 'F' | 'G' | 'D'
export const MAJOR_PATTERNS: Record<MajorKey, { notes: number[]; letters: string[] }> = {
  C: { notes: [0, 2, 4, 5, 7],    letters: ['C', 'D', 'E',  'F', 'G'] },
  F: { notes: [5, 7, 9, 10, 12],  letters: ['F', 'G', 'A',  'B♭','C'] },
  G: { notes: [7, 9, 11, 12, 14], letters: ['G', 'A', 'B',  'C', 'D'] },
  D: { notes: [2, 4, 6, 7, 9],    letters: ['D', 'E', 'F♯', 'G', 'A'] },
}
export function triadFor(k: MajorKey): number[] {
  const p = MAJOR_PATTERNS[k].notes
  return [p[0], p[2], p[4]]
}
export function triadLetters(k: MajorKey): string[] {
  const l = MAJOR_PATTERNS[k].letters
  return [l[0], l[2], l[4]]
}

// Draw a note oval on a mini staff (no stem)
function MiniNote({ cx, cy, color = DARK }: { cx: number; cy: number; color?: string }) {
  return <ellipse cx={cx} cy={cy} rx={7} ry={4.5} fill={color} />
}

// Draw 5 staff lines for a mini staff section
function MiniStaff({ x1, x2, top, step }: { x1: number; x2: number; top: number; step: number }) {
  return (
    <>
      {[0, 2, 4, 6, 8].map(p => (
        <line key={p} x1={x1} y1={top + p * step} x2={x2} y2={top + p * step}
          stroke={DARK} strokeWidth={STROKE_W} />
      ))}
    </>
  )
}


// ── Lesson 8: Major Five-Finger Patterns (Visual Guide) ──────────────────
// Consolidated teaching card — interactive keyboard with C / F / G / D tabs,
// a 5-finger pattern + triad highlight, finger numbers, and a reference staff.
export function MajorPatternDiagram() {
  const [patternKey, setPatternKey] = useState<MajorKey>('C')
  const p = MAJOR_PATTERNS[patternKey]
  const triad = triadFor(patternKey)
  const triadSet = new Set(triad)

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 14, lineHeight: 1.7 }}>
        A <strong style={{ color: DARK }}>five-finger pattern</strong> uses five adjacent keys
        with a specific step formula. <strong>Major</strong> patterns follow{' '}
        <strong style={{ color: MAJ_C }}>W–W–H–W</strong>: whole steps between every pair of keys
        except keys 3 and 4, which is a half step.
      </p>

      {/* Pattern tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['C', 'F', 'G', 'D'] as const).map(k => {
          const isActive = k === patternKey
          return (
            <button key={k} onClick={() => setPatternKey(k)}
              style={{
                padding: '6px 14px', borderRadius: 8,
                background: isActive ? MAJ_C : 'transparent',
                border: `1px solid ${isActive ? MAJ_C : '#DDD8CA'}`,
                fontFamily: F, fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'white' : '#7A7060',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {k} major
            </button>
          )
        })}
        <span style={{ flex: 1 }} />
        <span style={{
          fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: MAJ_C,
          alignSelf: 'center',
        }}>
          {p.letters.join(' ')}  ·  triad {triadLetters(patternKey).join(' – ')}
        </span>
      </div>

      <PatternKeyboard pattern={p.notes} triadSet={triadSet} patternLetters={p.letters} />

      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', margin: '14px 0 10px', lineHeight: 1.7 }}>
        Stack the <strong>1st, 3rd, and 5th</strong> notes of the pattern to form a{' '}
        <strong style={{ color: DARK }}>triad</strong> — the chord that gives the key its sound.
        <br />On the staff, a five-finger pattern walks from a line note to a space note
        and back without skipping any line or space.
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '10px 0', marginBottom: 4 }}>
        <StaffExamples />
      </div>
    </div>
  )
}

// Interactive 2-octave keyboard highlighting 5 pattern keys + triad subset.
// Chromatic index 0 = C4 (bottom-left C), 24 = C6 (two octaves up).
// Used by the Visual Guide and by Lesson 8 Ex 2/3 to display a pattern or triad.
export function PatternKeyboard({
  pattern, triadSet, patternLetters,
}: {
  pattern: number[]; triadSet: Set<number>; patternLetters?: string[]
}) {
  // Dimensions match PianoKeyboard.tsx (WK_W=86 pitch 88, BK_W=51)
  const KEY_PITCH = 88
  const WK_W = 86
  const BK_W = 51
  const LEFT_PAD = 30
  const RIGHT_PAD = 8
  const KB_TOP = 120
  const KEY_Y  = 69 + KB_TOP
  const KEY_END = 441 + KB_TOP
  const FACE_B = 449 + KB_TOP
  const BK_END = 301 + KB_TOP
  const BK_H   = BK_END - KEY_Y

  // 15 white keys across two octaves (C4..C6)
  const WHITE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const N_WHITE = 15
  const VW = LEFT_PAD + N_WHITE * KEY_PITCH - 2 + RIGHT_PAD
  const VH = 600

  const wkX = (i: number) => LEFT_PAD + i * KEY_PITCH

  // Chromatic index → key type + display geometry
  // Within an octave (0..11): white key indices = 0,2,4,5,7,9,11
  //                           black key indices = 1,3,6,8,10
  // Black-key x offsets from the octave's C (same as PianoKeyboard.tsx)
  const BK_OCTAVE_OFFSETS = [82 - 30, 175 - 30, 343 - 30, 437 - 30, 531 - 30]
  // Map chromatic index within octave to white-slot or black-slot
  const WHITE_SLOT_IN_OCT: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 }
  const BLACK_SLOT_IN_OCT: Record<number, number> = { 1: 0, 3: 1, 6: 2, 8: 3, 10: 4 }

  function keyInfo(chromatic: number): { kind: 'white' | 'black'; x: number; centerX: number } {
    const oct = Math.floor(chromatic / 12)
    const rem = chromatic % 12
    if (rem in WHITE_SLOT_IN_OCT) {
      const i = oct * 7 + WHITE_SLOT_IN_OCT[rem]
      return { kind: 'white', x: wkX(i), centerX: wkX(i) + WK_W / 2 }
    }
    const bi = BLACK_SLOT_IN_OCT[rem]
    const x = wkX(oct * 7) + BK_OCTAVE_OFFSETS[bi]
    return { kind: 'black', x, centerX: x + BK_W / 2 }
  }

  // Pre-compute lookup maps: chromatic → pattern finger (1-5) and triad flag
  const fingerByChromatic: Record<number, number> = {}
  pattern.forEach((c, i) => { fingerByChromatic[c] = i + 1 })

  // Letters above each lit key — optional; omitted in match-the-pattern exercises
  const letterByChromatic: Record<number, string> = {}
  if (patternLetters) pattern.forEach((c, i) => { letterByChromatic[c] = patternLetters[i] })

  return (
    <div style={{ borderRadius: 18, overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.40)' }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="mpk-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7A5228" />
            <stop offset="35%" stopColor="#3a2418" />
            <stop offset="100%" stopColor="#1a0f08" />
          </linearGradient>
          <linearGradient id="mpk-woodSheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.14" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mpk-ivory" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fefdf9" />
            <stop offset="60%" stopColor="#f4eedc" />
            <stop offset="100%" stopColor="#e5dfcb" />
          </linearGradient>
          <linearGradient id="mpk-wPat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EAF5DE" />
            <stop offset="55%" stopColor="#B4D890" />
            <stop offset="100%" stopColor="#78A850" />
          </linearGradient>
          <linearGradient id="mpk-wTriad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF8E0" />
            <stop offset="55%" stopColor="#F0D070" />
            <stop offset="100%" stopColor="#C89028" />
          </linearGradient>
          <linearGradient id="mpk-lEdge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6A5840" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#6A5840" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mpk-bDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a2420" />
            <stop offset="6%" stopColor="#0a0805" />
            <stop offset="100%" stopColor="#1c1814" />
          </linearGradient>
          <linearGradient id="mpk-bPat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#488828" />
            <stop offset="35%" stopColor="#2E5A18" />
            <stop offset="100%" stopColor="#132810" />
          </linearGradient>
          <linearGradient id="mpk-bTriad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D49210" />
            <stop offset="35%" stopColor="#7A5200" />
            <stop offset="100%" stopColor="#3A2400" />
          </linearGradient>
          <radialGradient id="mpk-bSheen" cx="50%" cy="18%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="0.20" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <filter id="mpk-bShadow" x="-12%" y="-4%" width="130%" height="120%">
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.65" />
          </filter>
        </defs>

        <rect x={0} y={0} width={VW} height={VH} fill="url(#mpk-wood)" />
        <rect x={0} y={KB_TOP - 88} width={VW} height={36} fill="url(#mpk-woodSheen)" rx={4} />
        <rect x={24} y={KB_TOP - 8} width={VW - 48} height={10} fill="#6a1515" rx={3} />
        <rect x={24} y={KB_TOP - 8} width={VW - 48} height={3}  fill="#9a2828" opacity={0.55} rx={3} />

        {/* Finger-number pills in the wood area, above each pattern key */}
        {pattern.map(c => {
          const info = keyInfo(c)
          const finger = fingerByChromatic[c]
          const isTri  = triadSet.has(c)
          return (
            <g key={`f-${c}`}>
              <circle cx={info.centerX} cy={KB_TOP - 48} r={14}
                fill={isTri ? '#D49210' : MAJ_C} />
              <text x={info.centerX} y={KB_TOP - 44}
                fontFamily={F} fontSize={15} fontWeight={700} fill="white"
                textAnchor="middle" dominantBaseline="central">
                {finger}
              </text>
              {patternLetters && (
                <text x={info.centerX} y={KB_TOP - 18}
                  fontFamily={F} fontSize={12} fontWeight={600}
                  fill={isTri ? '#F0D070' : '#C0E890'}
                  textAnchor="middle" dominantBaseline="central">
                  {letterByChromatic[c]}
                </text>
              )}
            </g>
          )
        })}

        {/* White keys */}
        {Array.from({ length: N_WHITE }, (_, i) => {
          const x = wkX(i)
          const letter = WHITE_LETTERS[i % 7]
          // Is this white key in the pattern?
          const oct = Math.floor(i / 7)
          const slotInOct = i % 7
          const chromatic = oct * 12 + [0, 2, 4, 5, 7, 9, 11][slotInOct]
          const isPat = pattern.includes(chromatic)
          const isTri = triadSet.has(chromatic)
          const fill = isTri ? 'url(#mpk-wTriad)' : isPat ? 'url(#mpk-wPat)' : 'url(#mpk-ivory)'
          const labelColor = isTri ? '#7A4800' : isPat ? '#1A5C0A' : '#7A7060'
          return (
            <g key={i}>
              <rect x={x} y={KEY_Y} width={WK_W} height={FACE_B - KEY_Y} fill={fill} rx={5} />
              <rect x={x} y={KEY_Y + 6} width={14} height={FACE_B - KEY_Y - 6} fill="url(#mpk-lEdge)" />
              <rect x={x} y={KEY_Y} width={WK_W} height={28} fill="white" opacity={0.12} rx={5} />
              <text x={x + WK_W / 2} y={KEY_END - 18}
                fontFamily="var(--font-cormorant), serif"
                fontSize={24} fontWeight={isPat ? 700 : 500}
                fill={labelColor}
                textAnchor="middle" dominantBaseline="auto">
                {letter}
              </text>
            </g>
          )
        })}

        {/* Black keys */}
        {Array.from({ length: 2 }, (_, oct) =>
          [1, 3, 6, 8, 10].map(rem => {
            const chromatic = oct * 12 + rem
            const info = keyInfo(chromatic)
            const isPat = pattern.includes(chromatic)
            const isTri = triadSet.has(chromatic)
            const fill = isTri ? 'url(#mpk-bTriad)' : isPat ? 'url(#mpk-bPat)' : 'url(#mpk-bDark)'
            return (
              <g key={`${oct}-${rem}`} filter="url(#mpk-bShadow)">
                <rect x={info.x} y={KEY_Y} width={BK_W} height={BK_H} fill={fill} rx={7} />
                <rect x={info.x} y={KEY_Y} width={BK_W} height={BK_H} fill="url(#mpk-bSheen)" rx={7} />
                <rect x={info.x + 4} y={BK_END - 22} width={BK_W - 8} height={22}
                  fill="#2A1808" opacity={0.55} rx={4} />
              </g>
            )
          })
        )}

        <rect x={0} y={FACE_B} width={VW} height={VH - FACE_B} fill="url(#mpk-wood)" />
      </svg>
    </div>
  )
}

// Two reference staves: C major 5FP in treble, D major 5FP in bass.
// Uses the standard svgW/svgH matching the other CM Prep staff cards.
function StaffExamples() {
  const step = 8
  const sL   = 32
  const sR   = 360
  const tTop = 54
  const svgW = sR + 16
  const svgH = tTop + 8 * step + 54

  const lineY  = (n: number) => tTop + (5 - n) * 2 * step
  const posToY = (pos: number) => tTop + (10 - pos) * step

  // Treble C major 5FP: C4 D4 E4 F4 G4 → pos 0,1,2,3,4
  // Bass   D major 5FP: D3 E3 F#3 G3 A3 → pos 6,7,8,9,10 (F#3 = pos 8 with sharp accidental)
  const trebleNotes = [{ pos: 0, letter: 'C' }, { pos: 1, letter: 'D' }, { pos: 2, letter: 'E' }, { pos: 3, letter: 'F' }, { pos: 4, letter: 'G' }]
  const bassNotes   = [{ pos: 6, letter: 'D' }, { pos: 7, letter: 'E' }, { pos: 8, letter: 'F♯', acc: true }, { pos: 9, letter: 'G' }, { pos: 10, letter: 'A' }]

  const xStart = sL + 70
  const xEnd   = sR - 12
  const span   = xEnd - xStart
  const xs = (n: number) => Array.from({ length: n }, (_, i) => xStart + (i + 0.5) * (span / n))

  const renderStaff = (clef: 'treble' | 'bass', notes: { pos: number; letter: string; acc?: boolean }[]) => {
    const xx = xs(notes.length)
    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
        style={{ maxWidth: svgW, display: 'block', margin: '6px auto' }}>
        {[1, 2, 3, 4, 5].map(n => (
          <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
            stroke={DARK} strokeWidth={STROKE_W} />
        ))}
        <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />
        {clef === 'treble'
          ? <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
              fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
          : <text x={sL + 2} y={tTop + 2 * step + 2} fontFamily="Bravura, serif" fontSize={66}
              fill={DARK} dominantBaseline="auto">{'\uD834\uDD22'}</text>}

        {notes.map((n, i) => {
          const cx = xx[i]
          const cy = posToY(n.pos)
          return (
            <g key={i}>
              {n.pos === 0 && clef === 'treble' &&
                <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke={DARK} strokeWidth={STROKE_W} />}
              {n.acc && (
                <text x={cx - 20} y={cy} fontFamily="Bravura, serif" fontSize={48}
                  fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE262'}</text>
              )}
              <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={60}
                fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
              <text x={cx} y={lineY(5) - 8}
                fontFamily={F} fontSize={11} fontWeight={700} fill={MAJ_C}
                textAnchor="middle">{n.letter}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 11, color: GREY, textAlign: 'center', margin: '0 0 4px' }}>
        C major — treble
      </p>
      {renderStaff('treble', trebleNotes)}
      <p style={{ fontFamily: F, fontSize: 11, color: GREY, textAlign: 'center', margin: '12px 0 4px' }}>
        D major — bass
      </p>
      {renderStaff('bass', bassNotes)}
    </div>
  )
}

// ── Lesson 9: Minor Five-Finger Patterns ──────────────────────────────────
export function MinorPatternDiagram() {
  const step = 9
  const sL = 25
  const sR = 490
  const tTop = 30
  const noteColor = MIN_C

  // c minor: C4(10), D4(9), Eb4(8), F4(7), G4(6)
  // Eb4 sits at E4's position with a flat
  const patternPos = [10, 9, 8, 7, 6]
  const patternNames = ['C', 'D', 'E♭', 'F', 'G']
  const steps = ['W', 'H', 'W', 'W']
  const stepColors = ['#2A5C0A', '#B5402A', '#2A5C0A', '#2A5C0A']
  const noteSpacing = 78
  const startX = sL + 52

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 520 230" width="100%" style={{ maxWidth: 520, display: 'block', margin: '0 auto' }}>

        <text x={sL} y={18} fontFamily={F} fontSize={11} fill={MIN_C} fontWeight="600">
          c minor Five-Finger Pattern — W H W W  (♭3rd)
        </text>

        <MiniStaff x1={sL} x2={sR} top={tTop} step={step} />
        <line x1={sL} y1={tTop} x2={sL} y2={tTop + 8 * step} stroke={DARK} strokeWidth={STROKE_W} />
        <line x1={sR} y1={tTop} x2={sR} y2={tTop + 8 * step} stroke={DARK} strokeWidth={2.5} />
        <text x={sL + 2} y={tTop + 42} fontFamily="Bravura, serif" fontSize={55} fill={DARK}>&#x1D11E;</text>

        {/* C4 ledger */}
        <line x1={startX - 12} y1={tTop + 10 * step} x2={startX + 12} y2={tTop + 10 * step}
          stroke={DARK} strokeWidth={STROKE_W} />

        {patternPos.map((pos, i) => {
          const cx = startX + i * noteSpacing
          const cy = tTop + pos * step
          const isFlat = patternNames[i] === 'E♭'
          return (
            <g key={i}>
              {isFlat && (
                <text x={cx - 14} y={cy + 4} fontFamily="Bravura, serif" fontSize={16} fill={MIN_C}>&#x266D;</text>
              )}
              <MiniNote cx={cx} cy={cy} color={noteColor} />
              <text x={cx} y={cy - 14} fontFamily={F} fontSize={10} fill={noteColor} textAnchor="middle" fontWeight="600">
                {patternNames[i]}
              </text>
            </g>
          )
        })}

        {steps.map((s, i) => {
          const x1 = startX + i * noteSpacing
          const x2 = startX + (i + 1) * noteSpacing
          const midX = (x1 + x2) / 2

          return (
            <g key={i}>
              <rect x={midX - 9} y={tTop + 8 * step + 14} width={18} height={16} rx={8}
                fill={s === 'H' ? 'rgba(181,64,42,0.14)' : 'rgba(59,109,181,0.12)'}
                stroke={stepColors[i]} strokeWidth={1} />
              <text x={midX} y={tTop + 8 * step + 26}
                fontFamily={F} fontSize={10} fill={stepColors[i]} textAnchor="middle" fontWeight="700">
                {s}
              </text>
            </g>
          )
        })}

        {/* Comparison box */}
        <rect x={sL} y={tTop + 8 * step + 48} width={sR - sL} height={38} rx={10}
          fill="rgba(59,109,181,0.06)" stroke="rgba(59,109,181,0.2)" strokeWidth={1} />
        <text x={sL + 10} y={tTop + 8 * step + 64} fontFamily={F} fontSize={10} fill={MAJ_C}>
          C Major: C D E F G  (W W H W)
        </text>
        <text x={sL + 10} y={tTop + 8 * step + 80} fontFamily={F} fontSize={10} fill={MIN_C}>
          c minor:  C D E♭ F G  (W H W W) — the 3rd is lowered by one half step
        </text>

        {/* All 4 minor patterns summary */}
        <rect x={sL} y={tTop + 8 * step + 96} width={sR - sL} height={50} rx={10}
          fill="rgba(59,109,181,0.06)" stroke="rgba(59,109,181,0.2)" strokeWidth={1} />
        {[
          { key: 'c', notes: 'C D E♭ F G', triad: 'C–E♭–G' },
          { key: 'f', notes: 'F G A♭ B♭ C', triad: 'F–A♭–C' },
          { key: 'g', notes: 'G A B♭ C D', triad: 'G–B♭–D' },
          { key: 'd', notes: 'D E F G A', triad: 'D–F–A' },
        ].map((p, i) => (
          <g key={p.key}>
            <text x={sL + 12 + i * 116} y={tTop + 8 * step + 116}
              fontFamily={F} fontSize={10} fill={MIN_C} fontWeight="600">{p.key} minor</text>
            <text x={sL + 12 + i * 116} y={tTop + 8 * step + 130}
              fontFamily={F} fontSize={9} fill={DARK}>{p.notes}</text>
            <text x={sL + 12 + i * 116} y={tTop + 8 * step + 142}
              fontFamily={F} fontSize={9} fill={GREY}>triad: {p.triad}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Lesson 10: Key Signatures ─────────────────────────────────────────────
export function KeySignatureDiagram() {
  const step = 8
  const sTop = 30
  const colW = 155
  const sL = 20
  const sEnd = 110

  const keySigs = [
    { name: 'C major', label: 'No sharps or flats', sharps: [], flats: [], accent: '#7A7060' },
    { name: 'G major', label: '1 sharp: F♯', sharps: [{ name: 'F♯', pos: 0 }], flats: [], accent: MAJ_C },
    { name: 'F major', label: '1 flat: B♭', sharps: [], flats: [{ name: 'B♭', pos: 4 }], accent: '#3B6DB5' },
  ]

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 490 175" width="100%" style={{ maxWidth: 490, display: 'block', margin: '0 auto' }}>

        {keySigs.map((ks, ki) => {
          const ox = sL + ki * colW

          return (
            <g key={ks.name}>
              {/* Staff */}
              {[0, 2, 4, 6, 8].map(p => (
                <line key={p} x1={ox} y1={sTop + p * step} x2={ox + sEnd} y2={sTop + p * step}
                  stroke={DARK} strokeWidth={STROKE_W} />
              ))}
              <line x1={ox} y1={sTop} x2={ox} y2={sTop + 8 * step} stroke={DARK} strokeWidth={STROKE_W} />
              <line x1={ox + sEnd} y1={sTop} x2={ox + sEnd} y2={sTop + 8 * step} stroke={DARK} strokeWidth={1.5} />

              {/* Treble clef */}
              <text x={ox + 1} y={sTop + 36} fontFamily="Bravura, serif" fontSize={50} fill={DARK}>&#x1D11E;</text>

              {/* Sharp accidentals in key sig */}
              {ks.sharps.map((acc, ai) => (
                <text key={ai} x={ox + 42 + ai * 10} y={sTop + acc.pos * step + 5}
                  fontFamily="Bravura, serif" fontSize={16} fill={ks.accent}>&#x266F;</text>
              ))}

              {/* Flat accidentals in key sig */}
              {ks.flats.map((acc, ai) => (
                <text key={ai} x={ox + 42 + ai * 10} y={sTop + acc.pos * step + 8}
                  fontFamily="Bravura, serif" fontSize={18} fill={ks.accent}>&#x266D;</text>
              ))}

              {/* Label */}
              <text x={ox + sEnd / 2} y={sTop + 8 * step + 20}
                fontFamily={SERIF} fontSize={15} fontWeight="400" fill={DARK} textAnchor="middle">
                {ks.name}
              </text>
              <text x={ox + sEnd / 2} y={sTop + 8 * step + 35}
                fontFamily={F} fontSize={10} fill={ks.accent} textAnchor="middle">
                {ks.label}
              </text>
            </g>
          )
        })}

        {/* Summary rule */}
        <rect x={sL} y={145} width={450} height={24} rx={8}
          fill="rgba(186,117,23,0.08)" stroke="rgba(186,117,23,0.2)" strokeWidth={1} />
        <text x={sL + 225} y={161} fontFamily={F} fontSize={10} fill={DARK} textAnchor="middle">
          Key signature appears right after the clef — its accidentals apply to the entire piece
        </text>
      </svg>
    </div>
  )
}

// ── Lesson 11: Major Scales ────────────────────────────────────────────────
export function MajorScaleDiagram() {
  const step = 9
  const sL = 25
  const sR = 500
  const tTop = 30

  // C major scale on treble: C4(10), D4(9), E4(8), F4(7), G4(6), A4(5), B4(4), C5(3)
  const scalePos = [10, 9, 8, 7, 6, 5, 4, 3]
  const scaleNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']
  const scaleSteps = ['W', 'W', 'H', 'W', 'W', 'W', 'H']
  const stepColor = (s: string) => s === 'H' ? '#B5402A' : MAJ_C
  const noteSpacing = 56
  const startX = sL + 52

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 530 190" width="100%" style={{ maxWidth: 530, display: 'block', margin: '0 auto' }}>

        <text x={sL} y={18} fontFamily={F} fontSize={11} fill={DARK} fontWeight="600">
          C Major Scale — pattern: W W H W W W H
        </text>

        <MiniStaff x1={sL} x2={sR} top={tTop} step={step} />
        <line x1={sL} y1={tTop} x2={sL} y2={tTop + 8 * step} stroke={DARK} strokeWidth={STROKE_W} />
        <line x1={sR} y1={tTop} x2={sR} y2={tTop + 8 * step} stroke={DARK} strokeWidth={2.5} />
        <text x={sL + 2} y={tTop + 42} fontFamily="Bravura, serif" fontSize={55} fill={DARK}>&#x1D11E;</text>

        {/* Ledger line for C4 */}
        <line x1={startX - 12} y1={tTop + 10 * step} x2={startX + 12} y2={tTop + 10 * step}
          stroke={DARK} strokeWidth={STROKE_W} />

        {scalePos.map((pos, i) => {
          const cx = startX + i * noteSpacing
          const cy = tTop + pos * step
          const color = i === 0 || i === 7 ? ACCENT : DARK

          return (
            <g key={i}>
              <ellipse cx={cx} cy={cy} rx={7} ry={4.5} fill={color} />
              <text x={cx} y={cy - 13} fontFamily={F} fontSize={10} fill={color} textAnchor="middle" fontWeight="600">
                {scaleNames[i]}
              </text>
              {/* Scale degree number */}
              <text x={cx} y={tTop + 8 * step + 20}
                fontFamily={F} fontSize={9} fill={GREY} textAnchor="middle">{i + 1}</text>
            </g>
          )
        })}

        {/* Step labels */}
        {scaleSteps.map((s, i) => {
          const midX = startX + i * noteSpacing + noteSpacing / 2
          return (
            <g key={i}>
              <rect x={midX - 8} y={tTop + 8 * step + 28} width={16} height={14} rx={7}
                fill={s === 'H' ? 'rgba(181,64,42,0.12)' : 'rgba(42,92,10,0.10)'}
                stroke={stepColor(s)} strokeWidth={1} />
              <text x={midX} y={tTop + 8 * step + 39}
                fontFamily={F} fontSize={9} fill={stepColor(s)} textAnchor="middle" fontWeight="700">{s}</text>
            </g>
          )
        })}

        {/* G and F major summaries */}
        <rect x={sL} y={tTop + 8 * step + 54} width={(sR - sL) * 0.48} height={40} rx={8}
          fill="rgba(42,92,10,0.07)" stroke="rgba(42,92,10,0.2)" strokeWidth={1} />
        <text x={sL + 10} y={tTop + 8 * step + 70} fontFamily={F} fontSize={10} fill={MAJ_C} fontWeight="600">G major:</text>
        <text x={sL + 10} y={tTop + 8 * step + 84} fontFamily={F} fontSize={10} fill={DARK}>G A B C D E F♯ G</text>

        <rect x={sR - (sR - sL) * 0.48} y={tTop + 8 * step + 54} width={(sR - sL) * 0.48} height={40} rx={8}
          fill="rgba(59,109,181,0.07)" stroke="rgba(59,109,181,0.2)" strokeWidth={1} />
        <text x={sR - (sR - sL) * 0.48 + 10} y={tTop + 8 * step + 70} fontFamily={F} fontSize={10} fill={'#3B6DB5'} fontWeight="600">F major:</text>
        <text x={sR - (sR - sL) * 0.48 + 10} y={tTop + 8 * step + 84} fontFamily={F} fontSize={10} fill={DARK}>F G A B♭ C D E F</text>
      </svg>
    </div>
  )
}

// ── Lesson 12: Time Signatures ────────────────────────────────────────────
export function TimeSignatureDiagram() {
  const col1 = 20
  const col2 = 220

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 490 260" width="100%" style={{ maxWidth: 490, display: 'block', margin: '0 auto' }}>

        {/* Time signature anatomy */}
        <text x={col1} y={22} fontFamily={F} fontSize={11} fill={DARK} fontWeight="600">Time Signature</text>

        {/* Draw 4/4 large */}
        <text x={col1 + 10} y={82} fontFamily="Bravura, serif" fontSize={72} fill={DARK}>𝄴</text>

        <line x1={col1 + 62} y1={30} x2={col1 + 62} y2={110} stroke={GREY} strokeWidth={0.8} strokeDasharray="3 2" />
        <text x={col1 + 70} y={55} fontFamily={F} fontSize={10} fill={DARK}>Top number = beats per measure</text>
        <line x1={col1 + 62} y1={68} x2={col1 + 68} y2={65} stroke={GREY} strokeWidth={0.8} />
        <text x={col1 + 70} y={90} fontFamily={F} fontSize={10} fill={DARK}>Bottom number = which note gets 1 beat</text>
        <text x={col1 + 70} y={104} fontFamily={F} fontSize={10} fill={GREY}>(4 = quarter note)</text>

        {/* Common time signatures */}
        <rect x={col1} y={122} width={185} height={48} rx={8} fill="rgba(186,117,23,0.07)" stroke="rgba(186,117,23,0.2)" strokeWidth={1} />
        <text x={col1 + 10} y={140} fontFamily={F} fontSize={10} fill={DARK} fontWeight="600">Common time signatures:</text>
        <text x={col1 + 10} y={156} fontFamily={F} fontSize={10} fill={DARK}>4/4 — 4 quarter-note beats</text>
        <text x={col1 + 10} y={168} fontFamily={F} fontSize={10} fill={DARK}>3/4 — 3 quarter-note beats · 2/4 — 2 beats</text>

        {/* Note value chart */}
        <text x={col2} y={22} fontFamily={F} fontSize={11} fill={DARK} fontWeight="600">Note Values (quarter note = 1 beat)</text>

        {[
          { label: 'Whole note', beats: '4 beats', shape: 'open-oval', y: 55 },
          { label: 'Half note', beats: '2 beats', shape: 'open-stem', y: 95 },
          { label: 'Quarter note', beats: '1 beat', shape: 'filled-stem', y: 135 },
          { label: 'Eighth note', beats: '½ beat', shape: 'flag', y: 175 },
        ].map(({ label, beats, shape, y }) => {
          const nx = col2 + 25  // note x center
          const ny = y

          return (
            <g key={label}>
              {/* Note glyph */}
              {shape === 'open-oval' && (
                <ellipse cx={nx} cy={ny} rx={9} ry={6} fill="none" stroke={DARK} strokeWidth={1.5} />
              )}
              {shape === 'open-stem' && (
                <>
                  <ellipse cx={nx} cy={ny} rx={8} ry={5.5} fill="none" stroke={DARK} strokeWidth={1.5} />
                  <line x1={nx + 7} y1={ny} x2={nx + 7} y2={ny - 26} stroke={DARK} strokeWidth={1.5} />
                </>
              )}
              {shape === 'filled-stem' && (
                <>
                  <ellipse cx={nx} cy={ny} rx={8} ry={5.5} fill={DARK} />
                  <line x1={nx + 7} y1={ny} x2={nx + 7} y2={ny - 26} stroke={DARK} strokeWidth={1.5} />
                </>
              )}
              {shape === 'flag' && (
                <>
                  <ellipse cx={nx} cy={ny} rx={8} ry={5.5} fill={DARK} />
                  <line x1={nx + 7} y1={ny} x2={nx + 7} y2={ny - 26} stroke={DARK} strokeWidth={1.5} />
                  <path d={`M ${nx + 7} ${ny - 26} C ${nx + 22} ${ny - 20} ${nx + 22} ${ny - 10} ${nx + 7} ${ny - 8}`}
                    fill="none" stroke={DARK} strokeWidth={1.5} />
                </>
              )}
              {/* Label */}
              <text x={col2 + 50} y={ny + 4} fontFamily={F} fontSize={11} fill={DARK}>{label}</text>
              <text x={col2 + 170} y={ny + 4} fontFamily={F} fontSize={11} fill={ACCENT} fontWeight="600">{beats}</text>
            </g>
          )
        })}

        {/* Rest note at bottom */}
        <text x={col2} y={225} fontFamily={F} fontSize={10} fill={GREY}>
          Rests: whole rest (hangs down) · half rest (sits up) · quarter rest
        </text>
      </svg>
    </div>
  )
}

// ── Review: Patterns (compare major vs minor) ─────────────────────────────
export function ReviewPatternsDiagram() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.08em', textTransform: 'uppercase', color: MAJ_C, marginBottom: '8px' }}>
          Major — W W H W
        </p>
        <MajorPatternDiagram />
      </div>
      <div>
        <p style={{ fontFamily: F, fontSize: 'var(--nl-text-compact)', letterSpacing: '0.08em', textTransform: 'uppercase', color: MIN_C, marginBottom: '8px' }}>
          Minor — W H W W
        </p>
        <MinorPatternDiagram />
      </div>
    </div>
  )
}
