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

// Minor patterns use the same four roots but with a lowered 3rd.
export type MinorKey = 'C' | 'F' | 'G' | 'D'
export const MINOR_PATTERNS: Record<MinorKey, { notes: number[]; letters: string[] }> = {
  C: { notes: [0, 2, 3, 5, 7],    letters: ['C', 'D', 'E♭', 'F', 'G'] },
  F: { notes: [5, 7, 8, 10, 12],  letters: ['F', 'G', 'A♭', 'B♭','C'] },
  G: { notes: [7, 9, 10, 12, 14], letters: ['G', 'A', 'B♭', 'C', 'D'] },
  D: { notes: [2, 4, 5, 7, 9],    letters: ['D', 'E', 'F',  'G', 'A'] },
}
export function minorTriadFor(k: MinorKey): number[] {
  const p = MINOR_PATTERNS[k].notes
  return [p[0], p[2], p[4]]
}
export function minorTriadLetters(k: MinorKey): string[] {
  const l = MINOR_PATTERNS[k].letters
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
      </div>

      <PatternLegend letters={p.letters} mode="major" />
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

// ── Finger / letter legend — HTML chips rendered above the keyboard ───────
// The in-SVG pills previously drawn in PatternKeyboard scale down with the
// keyboard and become unreadable; this legend uses real browser font sizing.
export function PatternLegend({
  letters, triadIndices = [0, 2, 4], mode = 'major',
}: {
  letters: string[]
  triadIndices?: number[]
  mode?: 'major' | 'minor'
}) {
  const patternBg     = mode === 'major' ? '#EAF5DE' : '#E4EDFA'
  const patternBorder = mode === 'major' ? '#78A850' : '#3B6DB5'
  const patternText   = mode === 'major' ? '#1A5C0A' : '#2A4D7A'
  const triadBg       = '#FFF4D0'
  const triadBorder   = '#C89028'
  const triadText     = '#7A4800'
  const triadSet = new Set(triadIndices)

  // Fixed-width grid so the bracket below can line up with each chip's center.
  const COL_W = 68
  const COL_GAP = 8
  const GRID_W = 5 * COL_W + 4 * COL_GAP
  const colCenter = (i: number) => i * (COL_W + COL_GAP) + COL_W / 2

  return (
    <div style={{ margin: '0 0 12px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(5, ${COL_W}px)`,
        gap: COL_GAP, justifyContent: 'center', marginBottom: 4,
      }}>
        {letters.map((letter, i) => {
          const isTri = triadSet.has(i)
          const ordinal = ['1st', '2nd', '3rd', '4th', '5th'][i]
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '6px 0', borderRadius: 10,
              background: isTri ? triadBg : patternBg,
              border: `1.5px solid ${isTri ? triadBorder : patternBorder}`,
              color: isTri ? triadText : patternText,
            }}>
              <div style={{
                fontFamily: F, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                opacity: 0.75,
              }}>{ordinal}</div>
              <div style={{
                fontFamily: SERIF, fontSize: 22, fontWeight: 700,
                lineHeight: 1.1, marginTop: 2,
              }}>{letter}</div>
            </div>
          )
        })}
      </div>

      {/* Triad bracket: single gold rail spanning the three triad chips,
          with tick marks at 1st / 3rd / 5th and one "triad" label */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={GRID_W} height={28} viewBox={`0 0 ${GRID_W} 28`}
          style={{ display: 'block' }}>
          <line x1={colCenter(0)} y1={6} x2={colCenter(4)} y2={6}
            stroke={triadBorder} strokeWidth={2} strokeLinecap="round" />
          {[0, 2, 4].map(i => (
            <line key={i} x1={colCenter(i)} y1={2} x2={colCenter(i)} y2={10}
              stroke={triadBorder} strokeWidth={2} strokeLinecap="round" />
          ))}
          <text x={colCenter(2)} y={22}
            fontFamily={F} fontSize={11} fontWeight={700}
            fill={triadText} textAnchor="middle"
            letterSpacing="1">TRIAD</text>
        </svg>
      </div>
    </div>
  )
}

// Interactive 2-octave keyboard highlighting 5 pattern keys + triad subset.
// Chromatic index 0 = C4 (bottom-left C), 24 = C6 (two octaves up).
// Used by the Visual Guide and by Lesson 8 Ex 2/3 to display a pattern or triad.
export function PatternKeyboard({
  pattern, triadSet, patternLetters, onKeyClick,
}: {
  pattern: number[]
  triadSet: Set<number>
  patternLetters?: string[]
  onKeyClick?: (chromatic: number) => void
}) {
  const isInteractive = typeof onKeyClick === 'function'
  // Dimensions match PianoKeyboard.tsx (WK_W=86 pitch 88, BK_W=51)
  const KEY_PITCH = 88
  const WK_W = 86
  const BK_W = 51
  const LEFT_PAD = 30
  const RIGHT_PAD = 8
  const KB_TOP = 44   // shorter wood panel now that finger pills live outside the SVG
  const KEY_Y  = 69 + KB_TOP
  const KEY_END = 441 + KB_TOP
  const FACE_B = 449 + KB_TOP
  const BK_END = 301 + KB_TOP
  const BK_H   = BK_END - KEY_Y

  // 15 white keys across two octaves (C4..C6)
  const WHITE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
  const N_WHITE = 15
  const VW = LEFT_PAD + N_WHITE * KEY_PITCH - 2 + RIGHT_PAD
  const VH = FACE_B + 24      // small bottom lip of wood below the keys

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
        <rect x={0} y={4} width={VW} height={18} fill="url(#mpk-woodSheen)" rx={4} />
        <rect x={24} y={KB_TOP - 8} width={VW - 48} height={10} fill="#6a1515" rx={3} />
        <rect x={24} y={KB_TOP - 8} width={VW - 48} height={3}  fill="#9a2828" opacity={0.55} rx={3} />

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
            <g key={i}
              onClick={isInteractive ? () => onKeyClick!(chromatic) : undefined}
              style={isInteractive ? { cursor: 'pointer' } : undefined}>
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
              <g key={`${oct}-${rem}`} filter="url(#mpk-bShadow)"
                onClick={isInteractive ? () => onKeyClick!(chromatic) : undefined}
                style={isInteractive ? { cursor: 'pointer' } : undefined}>
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
  const sR   = 576                           // wide staff for two patterns side-by-side
  const tTop = 36                            // leaves room for letter labels above
  const svgW = sR + 16
  const svgH = tTop + 8 * step + 28

  const lineY  = (n: number) => tTop + (5 - n) * 2 * step
  const posToY = (pos: number) => tTop + (10 - pos) * step

  // C major in treble clef: C4 D4 E4 F4 G4 → pos 0,1,2,3,4
  // D major in bass clef:   D3 E3 F♯3 G3 A3 → pos 6,7,8,9,10 (same pos system, bass interpretation)
  const trebleNotes = [{ pos: 0, letter: 'C' }, { pos: 1, letter: 'D' }, { pos: 2, letter: 'E' }, { pos: 3, letter: 'F' }, { pos: 4, letter: 'G' }]
  const bassNotes   = [{ pos: 6, letter: 'D' }, { pos: 7, letter: 'E' }, { pos: 8, letter: 'F♯', acc: true }, { pos: 9, letter: 'G' }, { pos: 10, letter: 'A' }]

  // Layout: [treble clef] [5 treble notes] [barline] [clef change] [5 bass notes]
  // Spacing: 44px between notes; 24px between last treble note and barline;
  // 24px between barline and clef change; 38px from clef change to first bass note.
  const trebleXs = [100, 144, 188, 232, 276]
  const midBarX  = 300
  const clefChangeX = 324
  const bassXs   = [362, 406, 450, 494, 538]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px',
        marginBottom: 4, gap: 20 }}>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: 0 }}>
          <strong style={{ color: MAJ_C }}>C major</strong> — treble
        </p>
        <p style={{ fontFamily: F, fontSize: 12, color: GREY, margin: 0 }}>
          <strong style={{ color: MAJ_C }}>D major</strong> — bass
        </p>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
        style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>

        {/* Staff lines */}
        {[1, 2, 3, 4, 5].map(n => (
          <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
            stroke={DARK} strokeWidth={STROKE_W} />
        ))}
        {/* Left + right borders */}
        <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
        <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />

        {/* Barline before the clef change */}
        <line x1={midBarX} y1={tTop} x2={midBarX} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />

        {/* Initial treble clef */}
        <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
          fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>

        {/* Clef change marker (smaller bass clef) */}
        <text x={clefChangeX} y={tTop + 2 * step + 2} fontFamily="Bravura, serif" fontSize={48}
          fill={DARK} textAnchor="middle" dominantBaseline="auto">{'\uD834\uDD22'}</text>

        {/* Treble notes (C major) — labels above each note */}
        {trebleNotes.map((n, i) => {
          const cx = trebleXs[i]
          const cy = posToY(n.pos)
          return (
            <g key={'t' + i}>
              {n.pos === 0 && (
                <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke={DARK} strokeWidth={STROKE_W} />
              )}
              <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={60}
                fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
              <text x={cx} y={tTop - 16}
                fontFamily={F} fontSize={15} fontWeight={700} fill={MAJ_C}
                textAnchor="middle">{n.letter}</text>
            </g>
          )
        })}

        {/* Bass notes (D major) — labels above each note */}
        {bassNotes.map((n, i) => {
          const cx = bassXs[i]
          const cy = posToY(n.pos)
          return (
            <g key={'b' + i}>
              {n.acc && (
                <text x={cx - 20} y={cy} fontFamily="Bravura, serif" fontSize={48}
                  fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE262'}</text>
              )}
              <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={60}
                fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
              <text x={cx} y={tTop - 16}
                fontFamily={F} fontSize={15} fontWeight={700} fill={MAJ_C}
                textAnchor="middle">{n.letter}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Lesson 9: Minor Five-Finger Patterns (Visual Guide) ──────────────────
// Consolidated teaching card — same interactive keyboard as Lesson 8 but for
// minor patterns (3rd note lowered a half step). Includes a reference staff
// showing a paired G major → G minor conversion.
export function MinorPatternDiagram() {
  const [patternKey, setPatternKey] = useState<MinorKey>('C')
  const p = MINOR_PATTERNS[patternKey]
  const triad = minorTriadFor(patternKey)
  const triadSet = new Set(triad)

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 14, lineHeight: 1.7 }}>
        To turn a <strong style={{ color: DARK }}>major</strong> pattern into a{' '}
        <strong style={{ color: MIN_C }}>minor</strong> pattern, lower the <strong>3rd note</strong>{' '}
        by one half step. Minor patterns follow <strong style={{ color: MIN_C }}>W–H–W–W</strong>{' '}
        — whole steps everywhere except between keys 2 and 3.
      </p>

      {/* Pattern tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['C', 'F', 'G', 'D'] as const).map(k => {
          const isActive = k === patternKey
          return (
            <button key={k} onClick={() => setPatternKey(k)}
              style={{
                padding: '6px 14px', borderRadius: 8,
                background: isActive ? MIN_C : 'transparent',
                border: `1px solid ${isActive ? MIN_C : '#DDD8CA'}`,
                fontFamily: F, fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? 'white' : '#7A7060',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {k} minor
            </button>
          )
        })}
      </div>

      <PatternLegend letters={p.letters} mode="minor" />

      <PatternKeyboard pattern={p.notes} triadSet={triadSet} patternLetters={p.letters} />

      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', margin: '14px 0 10px', lineHeight: 1.7 }}>
        Stack the <strong>1st, 3rd, and 5th</strong> notes to build a{' '}
        <strong style={{ color: MIN_C }}>minor triad</strong>. Notice how the triad&apos;s middle note
        sits a half step lower than in the matching major triad.
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '10px 0', marginBottom: 4 }}>
        <MinorStaffExamples />
      </div>
    </div>
  )
}

// Two paired reference staves: G major | G minor in treble, D major | D minor
// in bass. The viewBox is extended to accommodate both measures side-by-side
// with full note spacing — same note size as everywhere else in the program.
function MinorStaffExamples() {
  const step = 8
  const sL   = 32
  const sR   = 684                  // extended for two measures of 5 notes each
  const tTop = 54
  const svgW = sR + 16
  const svgH = tTop + 8 * step + 54

  const lineY  = (n: number) => tTop + (5 - n) * 2 * step
  const posToY = (pos: number) => tTop + (10 - pos) * step

  type AccType = 'flat' | 'sharp' | 'natural'
  type StaffNote = { pos: number; l: string; acc?: AccType }

  // Treble — G major (pos 4..8): G A B C D  ·  G minor: G A B♭ C D
  // Bass   — D major (pos 6..10): D E F♯ G A · D minor: D E F G A
  const gMajor: StaffNote[] = [{ pos: 4, l: 'G' }, { pos: 5, l: 'A' }, { pos: 6, l: 'B' }, { pos: 7, l: 'C' }, { pos: 8, l: 'D' }]
  const gMinor: StaffNote[] = [{ pos: 4, l: 'G' }, { pos: 5, l: 'A' }, { pos: 6, l: 'B♭', acc: 'flat' }, { pos: 7, l: 'C' }, { pos: 8, l: 'D' }]
  const dMajor: StaffNote[] = [{ pos: 6, l: 'D' }, { pos: 7, l: 'E' }, { pos: 8, l: 'F♯', acc: 'sharp' }, { pos: 9, l: 'G' }, { pos: 10, l: 'A' }]
  const dMinor: StaffNote[] = [{ pos: 6, l: 'D' }, { pos: 7, l: 'E' }, { pos: 8, l: 'F',  acc: 'natural' }, { pos: 9, l: 'G' }, { pos: 10, l: 'A' }]

  // Layout: clef at sL..sL+66, two measures of equal width with a double bar
  // between them.
  const clefEnd = sL + 66
  const midBar  = clefEnd + (sR - clefEnd) / 2
  const m1Start = clefEnd + 4
  const m1End   = midBar - 6
  const m2Start = midBar + 10
  const m2End   = sR - 12
  const spacing = (a: number, b: number, n: number) =>
    Array.from({ length: n }, (_, i) => a + (i + 0.5) * ((b - a) / n))

  const renderAcc = (acc: AccType | undefined, cx: number, cy: number) => {
    if (!acc) return null
    const glyph = acc === 'flat' ? '\uE260' : acc === 'sharp' ? '\uE262' : '\uE261'
    return (
      <text x={cx - 20} y={cy} fontFamily="Bravura, serif" fontSize={48}
        fill={DARK} textAnchor="middle" dominantBaseline="central">{glyph}</text>
    )
  }

  const renderPairStaff = (clef: 'treble' | 'bass',
    majorNotes: StaffNote[], minorNotes: StaffNote[]) => {
    const m1Xs = spacing(m1Start, m1End, majorNotes.length)
    const m2Xs = spacing(m2Start, m2End, minorNotes.length)
    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
        style={{ maxWidth: svgW, display: 'block', margin: '6px auto' }}>
        {[1, 2, 3, 4, 5].map(n => (
          <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
            stroke={DARK} strokeWidth={STROKE_W} />
        ))}
        {/* Left barline */}
        <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
        {/* Double bar between measures */}
        <line x1={midBar - 1} y1={tTop} x2={midBar - 1} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />
        <line x1={midBar + 3} y1={tTop} x2={midBar + 3} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />
        {/* Right-end double barline */}
        <line x1={sR - 6} y1={tTop} x2={sR - 6} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />
        <line x1={sR}     y1={tTop} x2={sR}     y2={lineY(1)} stroke={DARK} strokeWidth={2.5} />

        {clef === 'treble'
          ? <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
              fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
          : <text x={sL + 2} y={tTop + 2 * step + 2} fontFamily="Bravura, serif" fontSize={66}
              fill={DARK} dominantBaseline="auto">{'\uD834\uDD22'}</text>}

        {/* Section captions above each measure */}
        <text x={(m1Start + m1End) / 2} y={tTop - 14}
          fontFamily={F} fontSize={14} fontWeight={700} fill={MAJ_C}
          textAnchor="middle" letterSpacing="1">MAJOR</text>
        <text x={(m2Start + m2End) / 2} y={tTop - 14}
          fontFamily={F} fontSize={14} fontWeight={700} fill={MIN_C}
          textAnchor="middle" letterSpacing="1">MINOR</text>

        {/* Major notes */}
        {majorNotes.map((n, i) => {
          const cy = posToY(n.pos)
          return (
            <g key={`maj-${i}`}>
              {renderAcc(n.acc, m1Xs[i], cy)}
              <text x={m1Xs[i]} y={cy} fontFamily="Bravura, serif" fontSize={60}
                fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
              <text x={m1Xs[i]} y={lineY(1) + 24}
                fontFamily={F} fontSize={14} fontWeight={700} fill={DARK}
                textAnchor="middle">{n.l}</text>
            </g>
          )
        })}

        {/* Minor notes */}
        {minorNotes.map((n, i) => {
          const cy = posToY(n.pos)
          return (
            <g key={`min-${i}`}>
              {renderAcc(n.acc, m2Xs[i], cy)}
              <text x={m2Xs[i]} y={cy} fontFamily="Bravura, serif" fontSize={60}
                fill={DARK} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
              <text x={m2Xs[i]} y={lineY(1) + 24}
                fontFamily={F} fontSize={14} fontWeight={700} fill={DARK}
                textAnchor="middle">{n.l}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  const captionStyle = { fontFamily: F, fontSize: 13, color: DARK, fontWeight: 600,
    textAlign: 'center' as const, marginTop: 8, marginBottom: 2 }

  return (
    <div>
      <p style={captionStyle}>G major → G minor · flat the B</p>
      {renderPairStaff('treble', gMajor, gMinor)}
      <p style={{ ...captionStyle, marginTop: 12 }}>D major → D minor · natural cancels the F♯</p>
      {renderPairStaff('bass', dMajor, dMinor)}
    </div>
  )
}

// ── Lesson 10: Key Signatures ─────────────────────────────────────────────
// One full-width treble staff per key (C, G, F major), matching the standard
// staff geometry used throughout CM Prep. Key-signature accidentals are drawn
// at the proper position (F♯ on the top line; B♭ on the middle line).
export function KeySignatureDiagram() {
  const step = 8
  const sL   = 32
  const sR   = 340
  const tTop = 30
  const svgW = sR + 16
  const svgH = 156    // room below the staff for name + sublabel

  const lineY  = (n: number) => tTop + (5 - n) * 2 * step
  const posToY = (pos: number) => tTop + (10 - pos) * step

  type AccSpec = { pos: number; acc: 'sharp' | 'flat' }
  type KeySig = { name: string; sublabel: string; accidentals: AccSpec[]; accent: string }

  const keySigs: KeySig[] = [
    { name: 'C major', sublabel: 'No sharps or flats',
      accidentals: [], accent: '#7A7060' },
    { name: 'G major', sublabel: 'One sharp: F♯',
      accidentals: [{ pos: 10, acc: 'sharp' }], accent: MAJ_C },    // F♯ on top line (F5)
    { name: 'F major', sublabel: 'One flat: B♭',
      accidentals: [{ pos: 6, acc: 'flat' }],  accent: '#3B6DB5' }, // B♭ on middle line (B4)
  ]

  const renderStaff = (ks: KeySig) => (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
      style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
      {/* Staff lines */}
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE_W} />
      ))}
      {/* Left + right borders */}
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />

      {/* Treble clef — standard size */}
      <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>

      {/* Key-signature accidentals — positioned just after the clef */}
      {ks.accidentals.map((a, i) => {
        const cx = sL + 60 + i * 14
        const cy = posToY(a.pos)
        const glyph = a.acc === 'sharp' ? '\uE262' : '\uE260'
        return (
          <text key={i} x={cx} y={cy} fontFamily="Bravura, serif" fontSize={48}
            fill={ks.accent} textAnchor="middle" dominantBaseline="central">{glyph}</text>
        )
      })}

      {/* Labels beneath the staff */}
      <text x={(sL + sR) / 2} y={lineY(1) + 24}
        fontFamily={SERIF} fontSize={17} fontWeight={600} fill={DARK}
        textAnchor="middle">{ks.name}</text>
      <text x={(sL + sR) / 2} y={lineY(1) + 42}
        fontFamily={F} fontSize={12} fontWeight={600} fill={ks.accent}
        textAnchor="middle" letterSpacing="0.5">{ks.sublabel}</text>
    </svg>
  )

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 12, lineHeight: 1.7 }}>
        A <strong style={{ color: DARK }}>key signature</strong> sits right after the clef and tells
        you which notes are sharp or flat for the whole piece. At the preparatory level, three keys
        cover most of the literature.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {keySigs.map(ks => (
          <div key={ks.name} style={{
            background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
            padding: '8px 0',
          }}>
            {renderStaff(ks)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Lesson 11: Major Scales ────────────────────────────────────────────────
export function MajorScaleDiagram() {
  // Standard CM Prep staff geometry (matches Lesson 10 / key sig diagrams)
  const step = 8
  const sL   = 32
  const sR   = 600
  const tTop = 30
  const svgW = sR + 16
  const svgH = tTop + 8 * step + 64

  const lineY  = (n: number) => tTop + (5 - n) * 2 * step
  const posToY = (pos: number) => tTop + (10 - pos) * step

  // C major scale on treble: pos 0 = C4 (1 ledger below), pos 7 = C5 (space 3)
  const scalePos = [0, 1, 2, 3, 4, 5, 6, 7]
  const scaleNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']
  const scaleSteps = ['W', 'W', 'H', 'W', 'W', 'W', 'H']
  const stepColor = (s: string) => s === 'H' ? '#B5402A' : MAJ_C

  const xStart = sL + 80
  const xEnd   = sR - 20
  const xs = Array.from({ length: 8 }, (_, i) =>
    xStart + (i + 0.5) * ((xEnd - xStart) / 8)
  )

  // Two versions of the same scale — plain, then with step labels between notes.
  const renderScale = (showSteps: boolean) => (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
      style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
      {/* Staff lines */}
      {[1, 2, 3, 4, 5].map(n => (
        <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
          stroke={DARK} strokeWidth={STROKE_W} />
      ))}
      {/* Left + right borders */}
      <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
      <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />
      {/* Treble clef */}
      <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={62}
        fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>

      {/* Notes */}
      {scalePos.map((pos, i) => {
        const cx = xs[i]
        const cy = posToY(pos)
        const isTonic = i === 0 || i === 7
        const color = isTonic ? ACCENT : DARK
        return (
          <g key={i}>
            {pos === 0 && (
              <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy}
                stroke={color} strokeWidth={STROKE_W} />
            )}
            <text x={cx} y={cy} fontFamily="Bravura, serif" fontSize={60}
              fill={color} textAnchor="middle" dominantBaseline="central">{'\uE0A2'}</text>
            {/* Letter label above each note */}
            <text x={cx} y={tTop - 14}
              fontFamily={F} fontSize={15} fontWeight={700} fill={color}
              textAnchor="middle">{scaleNames[i]}</text>
          </g>
        )
      })}

      {/* Step badges between notes (W/H) — placed well below the staff so
          they never share a horizontal line with a notehead */}
      {showSteps && scaleSteps.map((s, i) => {
        const midX = (xs[i] + xs[i + 1]) / 2
        const y = lineY(1) + 46
        return (
          <g key={'step' + i}>
            <circle cx={midX} cy={y} r={11}
              fill={s === 'H' ? 'rgba(181,64,42,0.15)' : 'rgba(42,92,10,0.12)'}
              stroke={stepColor(s)} strokeWidth={1.2} />
            <text x={midX} y={y}
              fontFamily={F} fontSize={12} fontWeight={800}
              fill={stepColor(s)} textAnchor="middle" dominantBaseline="central">{s}</text>
          </g>
        )
      })}
    </svg>
  )

  return (
    <div>
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 12, lineHeight: 1.75 }}>
        Every <strong style={{ color: DARK }}>major scale</strong> is built from{' '}
        <strong style={{ color: DARK }}>eight notes</strong>. It begins and ends on the same letter name —
        its tonic — and it borrows its sharps or flats from the major key signature of the same name.
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '10px 0', marginBottom: 14 }}>
        {renderScale(false)}
      </div>

      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 10, lineHeight: 1.75 }}>
        Whole steps (<strong style={{ color: MAJ_C }}>W</strong>) fall between most adjacent notes. Half
        steps (<strong style={{ color: '#B5402A' }}>H</strong>) sit between notes <strong>3–4</strong>
        {' '}and <strong>7–8</strong>.
      </p>

      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '10px 0 28px' }}>
        {renderScale(true)}
      </div>
      {/* The per-key summary cards (C / F / G) are rendered by the lesson page,
          below the lesson description — see page.tsx. */}
    </div>
  )
}

// ── Lesson 12: Time Signatures ────────────────────────────────────────────
export function TimeSignatureDiagram() {
  // Standard CM Prep staff geometry (matches Lessons 10-11)
  const step = 6                                   // staff line-to-line = 12px

  // ── Section A: mini grand staff with a 4/4 time signature ─────────────
  const gSL  = 32
  const gSR  = 260
  const gTT  = 24
  const gBT  = gTT + 8 * step + 36
  const gBB  = gBT + 8 * step
  const gW   = gSR + 16
  const gH   = gBB + 16

  const tLineY = (n: number) => gTT + (5 - n) * 2 * step
  const bLineY = (n: number) => gBT + (5 - n) * 2 * step

  // Time-sig digits sit centered on lines 4 (top digit) and 2 (bottom digit)
  const tsTopY = (top: number) => top + 2 * step
  const tsBotY = (top: number) => top + 6 * step
  const TS_DIGIT = (d: number) => String.fromCodePoint(0xE080 + d)
  const tsX = gSL + 60

  // ── Section B: notes with counts (counting example in 4/4) ────────────
  const sL   = 32
  const sR   = 600
  const tTop = 30
  const svgW = sR + 16
  const svgH = tTop + 8 * step + 56

  const lineY  = (n: number) => tTop + (5 - n) * 2 * step
  const posToY = (pos: number) => tTop + (10 - pos) * step

  // Bravura pre-composed note glyphs (with stems / flags built in)
  const NOTE_WHOLE   = '\uE1D2'
  const NOTE_HALF_U  = '\uE1D3'
  const NOTE_HALF_D  = '\uE1D4'
  const NOTE_QTR_U   = '\uE1D5'
  const NOTE_QTR_D   = '\uE1D6'
  const NOTE_8TH_U   = '\uE1D7'
  const NOTE_8TH_D   = '\uE1D8'
  const AUG_DOT      = '\uE1E7'
  // Notehead-only glyph (used when we need to draw a custom beam across multiple noteheads)
  const NOTEHEAD_BLACK = '\uE0A4'

  // Measure the note-column x-positions for the counting example (4 quarters,
  // then 8 eighths). Both measures share a single staff; a barline separates them.
  const mStartX = sL + 90
  const mEndX   = sR - 24
  const mMidX   = (mStartX + mEndX) / 2
  const m1Xs = Array.from({ length: 4 }, (_, i) =>
    mStartX + (i + 0.5) * ((mMidX - 14 - mStartX) / 4)
  )
  const m2Xs = Array.from({ length: 8 }, (_, i) =>
    mMidX + 14 + (i + 0.5) * ((mEndX - mMidX - 14) / 8)
  )

  // All notes live on line 2 (G4, pos 4) so stems naturally go up and the
  // beams for the eighth-note measure sit above the staff.
  const NOTE_Y = posToY(4)
  // Stem length that matches Bravura's internal stem on the pre-composed
  // quarter/eighth glyphs rendered at fontSize=36.
  const STEM_LEN = 31
  const BEAM_H = 4

  return (
    <div>
      {/* ── Intro ─────────────────────────────────────────────── */}
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 12, lineHeight: 1.75 }}>
        The <strong style={{ color: DARK }}>time signature</strong>{' '}
        sits at the very beginning of a piece, right after the clef signs, and stays in effect
        throughout. It&apos;s written as two stacked numbers and tells you how the beats are organized.
      </p>

      {/* Grand staff showing 4/4 */}
      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '10px 0', marginBottom: 14 }}>
        <svg viewBox={`0 0 ${gW} ${gH}`} width="100%"
          style={{ maxWidth: gW, display: 'block', margin: '0 auto' }}>
          {/* Staff lines */}
          {[1, 2, 3, 4, 5].map(n => (
            <line key={'t' + n} x1={gSL} y1={tLineY(n)} x2={gSR} y2={tLineY(n)}
              stroke={DARK} strokeWidth={STROKE_W} />
          ))}
          {[1, 2, 3, 4, 5].map(n => (
            <line key={'b' + n} x1={gSL} y1={bLineY(n)} x2={gSR} y2={bLineY(n)}
              stroke={DARK} strokeWidth={STROKE_W} />
          ))}
          <line x1={gSL} y1={gTT} x2={gSL} y2={gBB} stroke={DARK} strokeWidth={1.6} />
          <text x={gSL - 10} y={gBB} fontSize={gBB - gTT}
            fontFamily="Bravura, serif" fill={DARK} textAnchor="middle" dominantBaseline="auto">{'\uE000'}</text>
          <line x1={gSR} y1={gTT} x2={gSR} y2={gBB} stroke={DARK} strokeWidth={STROKE_W} />
          {/* Clefs — sized to match Lesson 1's MissingStaff (gStep=6, fontSize=50) */}
          <text x={gSL + 5} y={gTT + 6 * step} fontFamily="Bravura, serif" fontSize={50}
            fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
          <text x={gSL + 5} y={gBT + 2 * step + 2} fontFamily="Bravura, serif" fontSize={50}
            fill={DARK} dominantBaseline="auto">{'\uD834\uDD22'}</text>
          {/* 4/4 time signature on both staves */}
          <text x={tsX} y={tsTopY(gTT)} fontFamily="Bravura, serif" fontSize={48}
            fill={ACCENT} textAnchor="middle" dominantBaseline="central">{TS_DIGIT(4)}</text>
          <text x={tsX} y={tsBotY(gTT)} fontFamily="Bravura, serif" fontSize={48}
            fill={ACCENT} textAnchor="middle" dominantBaseline="central">{TS_DIGIT(4)}</text>
          <text x={tsX} y={tsTopY(gBT)} fontFamily="Bravura, serif" fontSize={48}
            fill={ACCENT} textAnchor="middle" dominantBaseline="central">{TS_DIGIT(4)}</text>
          <text x={tsX} y={tsBotY(gBT)} fontFamily="Bravura, serif" fontSize={48}
            fill={ACCENT} textAnchor="middle" dominantBaseline="central">{TS_DIGIT(4)}</text>
          {/* Callout arrow + caption */}
          <line x1={tsX + 14} y1={gTT - 6} x2={tsX + 38} y2={gTT - 14}
            stroke={GREY} strokeWidth={1} />
          <text x={tsX + 42} y={gTT - 14}
            fontFamily={F} fontSize={11} fontWeight={700} fill={ACCENT}
            dominantBaseline="central">Time signature</text>
        </svg>
      </div>

      {/* ── Top / bottom number explanation ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{
          background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 10,
          padding: '12px 14px',
        }}>
          <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: ACCENT, margin: '0 0 6px' }}>Top number</p>
          <p style={{ fontFamily: F, fontSize: 13, color: DARK, margin: 0, lineHeight: 1.55 }}>
            How many beats belong in each measure.
          </p>
        </div>
        <div style={{
          background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 10,
          padding: '12px 14px',
        }}>
          <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: ACCENT, margin: '0 0 6px' }}>Bottom number</p>
          <p style={{ fontFamily: F, fontSize: 13, color: DARK, margin: 0, lineHeight: 1.55 }}>
            Which note value counts as one beat (4 = quarter note).
          </p>
        </div>
      </div>

      {/* ── Note-value reference (when the bottom number is 4) ──── */}
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 8, lineHeight: 1.75 }}>
        When the bottom number is <strong style={{ color: DARK }}>4</strong>, the quarter note gets one
        beat and the rest of the note values scale from there:
      </p>
      <div style={{
        background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '14px 12px 12px', marginBottom: 14,
      }}>
        <svg viewBox="0 0 560 110" width="100%" style={{ maxWidth: 560, display: 'block', margin: '0 auto' }}>
          {([
            { label: 'Whole',       beats: '4 beats', glyph: NOTE_WHOLE  },
            { label: 'Dotted half', beats: '3 beats', glyph: NOTE_HALF_U, dot: true },
            { label: 'Half',        beats: '2 beats', glyph: NOTE_HALF_U },
            { label: 'Quarter',     beats: '1 beat',  glyph: NOTE_QTR_U  },
            { label: 'Eighth',      beats: '½ beat',  glyph: NOTE_8TH_U  },
          ]).map((it, i) => {
            const col = 110
            const ox = 30 + i * col
            const cx = ox + 26
            const ny = 44
            return (
              <g key={it.label}>
                <line x1={ox} y1={ny} x2={ox + 56} y2={ny} stroke="#E2DDD0" strokeWidth={1} />
                <text x={cx} y={ny} fontFamily="Bravura, serif" fontSize={30}
                  fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">{it.glyph}</text>
                {it.dot && (
                  <text x={cx + 13} y={ny} fontFamily="Bravura, serif" fontSize={30}
                    fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">{AUG_DOT}</text>
                )}
                <text x={ox + 28} y={82} fontFamily={F} fontSize={11} fontWeight={700}
                  fill={DARK} textAnchor="middle">{it.label}</text>
                <text x={ox + 28} y={98} fontFamily={F} fontSize={11} fontWeight={600}
                  fill={ACCENT} textAnchor="middle">{it.beats}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* ── Counting example: 4/4 with quarters, then 4/4 with eighths ── */}
      <p style={{ fontFamily: F, fontSize: 13, color: '#7A7060', marginBottom: 8, lineHeight: 1.75 }}>
        <strong style={{ color: DARK }}>Counting 4/4.</strong> Every measure starts again at 1.
        Quarter notes get each number; eighth notes split the beat — say <strong>1 + 2 + 3 + 4 +</strong>.
        Beats <strong style={{ color: ACCENT }}>1</strong> and <strong style={{ color: ACCENT }}>3</strong> carry the
        strongest stress in 4/4.
      </p>
      <div style={{ background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 12,
        padding: '10px 0 14px', marginBottom: 14 }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%"
          style={{ maxWidth: svgW, display: 'block', margin: '0 auto' }}>
          {/* Staff */}
          {[1, 2, 3, 4, 5].map(n => (
            <line key={n} x1={sL} y1={lineY(n)} x2={sR} y2={lineY(n)}
              stroke={DARK} strokeWidth={STROKE_W} />
          ))}
          <line x1={sL} y1={tTop} x2={sL} y2={lineY(1)} stroke={DARK} strokeWidth={1.5} />
          {/* Barline between the two measures */}
          <line x1={mMidX} y1={tTop} x2={mMidX} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />
          {/* End double bar */}
          <line x1={sR - 5} y1={tTop} x2={sR - 5} y2={lineY(1)} stroke={DARK} strokeWidth={STROKE_W} />
          <line x1={sR} y1={tTop} x2={sR} y2={lineY(1)} stroke={DARK} strokeWidth={2.5} />
          {/* Treble clef — matches Lesson 1 sizing for step=6 */}
          <text x={sL + 4} y={tTop + 6 * step} fontFamily="Bravura, serif" fontSize={50}
            fill={DARK} dominantBaseline="auto">{'\uD834\uDD1E'}</text>
          {/* 4/4 time signature */}
          <text x={sL + 52} y={tsTopY(tTop)} fontFamily="Bravura, serif" fontSize={48}
            fill={DARK} textAnchor="middle" dominantBaseline="central">{TS_DIGIT(4)}</text>
          <text x={sL + 52} y={tsBotY(tTop)} fontFamily="Bravura, serif" fontSize={48}
            fill={DARK} textAnchor="middle" dominantBaseline="central">{TS_DIGIT(4)}</text>

          {/* Measure 1: four quarter notes on G4 (stems up, pre-composed glyph) */}
          {m1Xs.map((cx) => (
            <text key={'q' + cx} x={cx} y={NOTE_Y} fontFamily="Bravura, serif" fontSize={36}
              fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">{NOTE_QTR_U}</text>
          ))}
          {/* Measure 1 count labels — 1 + 2 + 3 + 4 + under each subdivision */}
          {(() => {
            const subdiv = (m1Xs[1] - m1Xs[0]) / 2
            const labels = ['1', '+', '2', '+', '3', '+', '4', '+']
            return labels.map((label, i) => {
              const x = m1Xs[0] + i * subdiv
              const strong = i === 0 || i === 4
              return (
                <text key={'m1l' + i} x={x} y={lineY(1) + 24}
                  fontFamily={F} fontSize={15} fontWeight={700}
                  fill={strong ? ACCENT : DARK}
                  textAnchor="middle">{label}</text>
              )
            })
          })()}

          {/* Measure 2: eight eighth notes beamed in pairs (stems up) */}
          {m2Xs.map((cx, i) => {
            const stemX = cx + 4.5      // stem attaches at notehead's right edge
            const stemTopY = NOTE_Y - STEM_LEN
            return (
              <g key={'e' + i}>
                <text x={cx} y={NOTE_Y} fontFamily="Bravura, serif" fontSize={36}
                  fill={DARK} textAnchor="middle" dominantBaseline="alphabetic">{NOTEHEAD_BLACK}</text>
                <line x1={stemX} y1={NOTE_Y - 2} x2={stemX} y2={stemTopY}
                  stroke={DARK} strokeWidth={1.4} />
                <text x={cx} y={lineY(1) + 24}
                  fontFamily={F} fontSize={15} fontWeight={700}
                  fill={i === 0 || i === 4 ? ACCENT : DARK}
                  textAnchor="middle">{i % 2 === 0 ? String((i / 2) + 1) : '+'}</text>
              </g>
            )
          })}
          {/* Beams connecting pairs of stems. The rect extends by half the
              stem stroke-width on each side so it fully covers the outer edges
              of the first and last stems, and overlaps the stem tops by 1px so
              the junction reads as one solid shape. */}
          {[0, 2, 4, 6].map(i => {
            const stemX1 = m2Xs[i] + 4.5
            const stemX2 = m2Xs[i + 1] + 4.5
            const STEM_W = 1.4
            const stemTopY = NOTE_Y - STEM_LEN
            return (
              <rect key={'bm' + i}
                x={stemX1 - STEM_W / 2}
                y={stemTopY - BEAM_H + 1}
                width={(stemX2 - stemX1) + STEM_W}
                height={BEAM_H}
                fill={DARK} />
            )
          })}
        </svg>
      </div>

      {/* ── Accent patterns ────────────────────────────────────── */}
      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#7A7060', margin: '0 0 6px' }}>
        Stress patterns
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { ts: '2/4', beats: [true, false] },
          { ts: '3/4', beats: [true, false, false] },
          { ts: '4/4', beats: [true, false, 'mid', false] as (boolean | 'mid')[] },
        ].map((row, idx) => (
          <div key={idx} style={{
            background: '#FDFAF3', border: '1px solid #EDE8DF', borderRadius: 10,
            padding: '10px 12px',
          }}>
            <p style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: DARK, margin: '0 0 6px' }}>
              {row.ts}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {row.beats.map((b, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 14,
                  background: b === true ? ACCENT
                            : b === 'mid' ? 'rgba(186,117,23,0.35)'
                            : '#F0EBDE',
                  color: b === true ? 'white' : b === 'mid' ? DARK : GREY,
                  fontFamily: F, fontWeight: 700, fontSize: 14,
                }}>{i + 1}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
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
