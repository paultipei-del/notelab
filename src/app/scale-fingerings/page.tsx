'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  MAJOR_FINGERINGS, MAJOR_SCALE_NOTES, SCALE_ORDER, SCALE_DISPLAY,
  NATURAL_MINOR_FINGERINGS, MINOR_SCALE_NOTES, MINOR_SCALE_ORDER, MINOR_SCALE_DISPLAY,
  type Fingering,
} from '@/lib/scale-fingerings'

const F = 'var(--font-jost), sans-serif'
const SERIF = 'var(--font-cormorant), serif'

// ── Piano keyboard constants ────────────────────────────────────────────────
const WW = 28   // white key width
const WH = 90   // white key height
const BW = 18   // black key width
const BH = 56   // black key height

// White key indices within octave: C=0,D=1,E=2,F=3,G=4,A=5,B=6
const WHITE_INDICES = [0,2,4,5,7,9,11]  // semitone offsets of white keys
const BLACK_OFFSETS: Record<number, number> = { 1:0.6, 3:1.6, 6:3.6, 8:4.6, 10:5.6 }

function isBlack(semi: number) { return [1,3,6,8,10].includes(semi % 12) }

function midiToKeyX(midi: number, startMidi: number): number {
  const diff = midi - startMidi
  const octave = Math.floor(diff / 12)
  const semi = diff % 12
  if (isBlack(semi)) {
    const blackOffset = BLACK_OFFSETS[semi] ?? 0
    return (octave * 7 + blackOffset) * WW - BW / 2
  }
  const whiteIdx = WHITE_INDICES.indexOf(semi)
  return (octave * 7 + whiteIdx) * WW
}

// Count white keys in a scale
function countWhiteKeys(notes: number[], startMidi: number): number {
  const endMidi = notes[notes.length - 1]
  let count = 0
  for (let m = startMidi; m <= endMidi; m++) {
    if (!isBlack(m)) count++
  }
  return count
}

// ── Keyboard SVG ─────────────────────────────────────────────────────────────
function KeyboardSVG({ notes, fingering, hand }: {
  notes: number[]
  fingering: Fingering
  hand: 'rh' | 'lh'
}) {
  const startMidi = notes[0]
  const endMidi = notes[notes.length - 1]
  const whiteCount = countWhiteKeys(notes, startMidi)
  const W = whiteCount * WW + 2
  const H = WH + 32  // extra space for finger numbers

  // Build all keys between start and end
  const allKeys: number[] = []
  for (let m = startMidi; m <= endMidi; m++) allKeys.push(m)
  const whiteKeys = allKeys.filter(m => !isBlack(m - startMidi + (startMidi % 12 === 0 ? 0 : 0)))
  
  // Simpler: track white/black based on chromatic position
  const chrWhite = allKeys.filter(m => !isBlackMidi(m))
  const chrBlack = allKeys.filter(m => isBlackMidi(m))

  function isBlackMidi(m: number) { return [1,3,6,8,10].includes(m % 12) }

  const noteSet = new Set(notes)
  const noteFingerMap: Record<number, number> = {}
  notes.forEach((m, i) => { noteFingerMap[m] = fingering[i] ?? 0 })

  // x position per midi
  function keyX(midi: number): number {
    const diff = midi - startMidi
    // count white keys before this
    let whites = 0
    for (let m = startMidi; m < midi; m++) {
      if (!isBlackMidi(m)) whites++
    }
    if (isBlackMidi(midi)) {
      // position between surrounding white keys
      return whites * WW - BW / 2
    }
    return whites * WW
  }

  const totalWhites = chrWhite.length
  const svgW = totalWhites * WW + 2

  return (
    <svg width={svgW} height={H} style={{ maxWidth: '100%', display: 'block' }}>
      {/* White keys */}
      {chrWhite.map(m => {
        const x = keyX(m)
        const active = noteSet.has(m)
        const finger = noteFingerMap[m]
        const isThumb = finger === 1
        return (
          <g key={m}>
            <rect x={x + 1} y={0} width={WW - 2} height={WH} rx={3}
              fill={active ? (isThumb ? '#BA7517' : '#E8F0FB') : '#FAFAF8'}
              stroke="#D3D1C7" strokeWidth={1} />
            {active && finger && (
              <text x={x + WW / 2} y={WH - 10} textAnchor="middle" dominantBaseline="middle"
                fontSize={isThumb ? 13 : 12} fontFamily={F}
                fontWeight={isThumb ? '500' : '400'}
                fill={isThumb ? 'white' : '#1A1A18'}>
                {finger}
              </text>
            )}
          </g>
        )
      })}
      {/* Black keys */}
      {chrBlack.map(m => {
        const x = keyX(m)
        const active = noteSet.has(m)
        const finger = noteFingerMap[m]
        const isThumb = finger === 1
        return (
          <g key={m}>
            <rect x={x} y={0} width={BW} height={BH} rx={2}
              fill={active ? (isThumb ? '#BA7517' : '#3A5A9B') : '#1A1A18'}
              stroke="#1A1A18" strokeWidth={1} />
            {active && finger && (
              <text x={x + BW / 2} y={BH - 10} textAnchor="middle" dominantBaseline="middle"
                fontSize={11} fontFamily={F} fontWeight={isThumb ? '500' : '400'}
                fill="white">
                {finger}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Staff view ────────────────────────────────────────────────────────────────
const TREBLE_POSITIONS: Record<number, number> = {
  // pos 0 = top line, pos 8 = bottom line, step = 6px
  // MIDI to staff position for treble clef
  84:0, 83:1, 81:1, 80:2, 79:2, 77:3, 76:3, 74:4, 72:4, 71:5, 69:5, 67:6,
  66:6, 65:6, 64:7, 62:7, 60:8, 59:8, 57:9, 55:9,
  // extended
  86:0, 88:-1, 90:-2,
}

function StaffView({ notes, fingering, clef, hand }: {
  notes: number[]
  fingering: Fingering
  clef: 'treble' | 'bass'
  hand: 'rh' | 'lh'
}) {
  const step = 6
  const staffTop = 48
  const svgH = 160
  const noteSpacing = 36
  const leftPad = 56
  const W = leftPad + notes.length * noteSpacing + 24
  const showAbove = hand === 'rh'  // finger numbers above for RH, below for LH

  // Map MIDI to vertical position
  function midiToY(midi: number): number {
    // Treble: E4(64)=pos8*step, each semitone up = ~0.5 step
    // Simplified: use diatonic position
    const refMidi = clef === 'treble' ? 64 : 43  // E4 or G2
    const refPos = clef === 'treble' ? 8 : 8
    // Approximate: each whole step = 1 position
    const semiPerStep = 1
    const pos = refPos - (midi - refMidi) / 2
    return staffTop + pos * step
  }

  function isBlackMidi(m: number) { return [1,3,6,8,10].includes(m % 12) }
  function accidental(midi: number): string | null {
    if (!isBlackMidi(midi)) return null
    // use sharps for sharp keys, flats for flat keys — simplified: always sharp
    return '♯'
  }

  const clefGlyph = clef === 'treble' ? '𝄞' : '𝄢'
  const clefY = clef === 'treble' ? staffTop + 36 : staffTop + 12

  return (
    <svg width={W} height={svgH} style={{ maxWidth: '100%', display: 'block' }}>
      {/* Staff lines */}
      {[0,1,2,3,4].map(i => (
        <line key={i} x1={8} y1={staffTop + i*2*step} x2={W-4} y2={staffTop + i*2*step}
          stroke="#D3D1C7" strokeWidth={1} />
      ))}
      {/* Clef */}
      <text x={10} y={clefY} fontSize={clef === 'treble' ? 52 : 50}
        fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">{clefGlyph}</text>
      {/* Notes */}
      {notes.map((midi, i) => {
        const x = leftPad + i * noteSpacing
        const y = midiToY(midi)
        const finger = fingering[i]
        const isThumb = finger === 1
        const acc = accidental(midi)
        const fingerY = showAbove ? y - 22 : y + 22

        return (
          <g key={i}>
            {/* Ledger lines */}
            {y <= staffTop - step && (
              <line x1={x-10} y1={staffTop} x2={x+10} y2={staffTop} stroke="#1A1A18" strokeWidth={1} />
            )}
            {y >= staffTop + 8*step + step && (
              <line x1={x-10} y1={staffTop+8*step} x2={x+10} y2={staffTop+8*step} stroke="#1A1A18" strokeWidth={1} />
            )}
            {/* Accidental */}
            {acc && (
              <text x={x - 12} y={y} fontSize={14} fontFamily="Bravura, serif"
                fill="#888780" textAnchor="middle" dominantBaseline="central">{acc}</text>
            )}
            {/* Note head */}
            <ellipse cx={x} cy={y} rx={7} ry={5} fill={isThumb ? '#BA7517' : '#1A1A18'} />
            {/* Stem */}
            <line x1={x + 7} y1={y} x2={x + 7} y2={y - 28} stroke={isThumb ? '#BA7517' : '#1A1A18'} strokeWidth={1.5} />
            {/* Finger number */}
            {finger && (
              <text x={x} y={fingerY} textAnchor="middle" dominantBaseline="middle"
                fontSize={11} fontFamily={F}
                fontWeight={isThumb ? '600' : '400'}
                fill={isThumb ? '#BA7517' : '#1A1A18'}>
                {finger}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Hand Panel ────────────────────────────────────────────────────────────────
function HandPanel({ label, notes, fingering, clef }: {
  label: string
  notes: number[]
  fingering: Fingering
  clef: 'treble' | 'bass'
}) {
  const hand = clef === 'treble' ? 'rh' : 'lh'
  return (
    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #D3D1C7', padding: '24px', marginBottom: '16px' }}>
      <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '16px' }}>{label}</p>
      <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
        <KeyboardSVG notes={notes} fingering={fingering} hand={hand} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <StaffView notes={notes} fingering={fingering} clef={clef} hand={hand} />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type ScaleType = 'major' | 'natural_minor'

export default function ScaleFingeringsPage() {
  const router = useRouter()
  const [scaleType, setScaleType] = useState<ScaleType>('major')
  const [selectedKey, setSelectedKey] = useState('C')

  const isMajor = scaleType === 'major'
  const keys = isMajor ? SCALE_ORDER : MINOR_SCALE_ORDER
  const displayMap = isMajor ? SCALE_DISPLAY : MINOR_SCALE_DISPLAY

  const fingering = isMajor
    ? MAJOR_FINGERINGS[selectedKey]
    : NATURAL_MINOR_FINGERINGS[selectedKey]

  const notes = isMajor
    ? MAJOR_SCALE_NOTES[selectedKey]
    : MINOR_SCALE_NOTES[selectedKey]

  // Split into RH (treble) and LH (bass) — offset by octave
  const rhNotes = notes
  const lhNotes = notes.map(m => m - 12)  // one octave lower for LH

  if (!fingering || !notes) return null

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #D3D1C7', background: '#F5F2EC', position: 'sticky' as const, top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780' }}>← Back</button>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '22px', color: '#1A1A18' }}>Scale Fingerings</h1>
        <div style={{ width: '60px' }} />
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Scale type toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const }}>
          {([['major','Major'],['natural_minor','Natural Minor']] as [ScaleType,string][]).map(([t, label]) => (
            <button key={t} onClick={() => { setScaleType(t); setSelectedKey(t === 'major' ? 'C' : 'Am') }}
              style={{ padding: '8px 20px', borderRadius: '20px', border: '1px solid ' + (scaleType === t ? '#1A1A18' : '#D3D1C7'), background: scaleType === t ? '#1A1A18' : 'white', color: scaleType === t ? 'white' : '#888780', fontFamily: F, fontSize: '13px', fontWeight: 300, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
          <span style={{ fontFamily: F, fontSize: '11px', color: '#B8B5AD', alignSelf: 'center', marginLeft: '8px' }}>Harmonic &amp; Melodic — coming soon</span>
        </div>

        {/* Key selector */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#888780', marginBottom: '12px' }}>Key</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
            {keys.map(k => (
              <button key={k} onClick={() => setSelectedKey(k)}
                style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid ' + (selectedKey === k ? '#1A1A18' : '#D3D1C7'), background: selectedKey === k ? '#1A1A18' : 'white', color: selectedKey === k ? 'white' : '#1A1A18', fontFamily: SERIF, fontSize: '18px', fontWeight: 300, cursor: 'pointer', minWidth: '44px', textAlign: 'center' as const }}>
                {displayMap[k]}
              </button>
            ))}
          </div>
        </div>

        {/* Scale title */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '32px', color: '#1A1A18' }}>
            {displayMap[selectedKey]} {scaleType === 'major' ? 'Major' : 'Minor'}
          </h2>
          <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', marginTop: '4px' }}>
            2 octaves · <span style={{ color: '#BA7517', fontWeight: 400 }}>●</span> thumb (1)
          </p>
        </div>

        {/* Right Hand */}
        <HandPanel
          label="Right Hand"
          notes={rhNotes}
          fingering={fingering.rh}
          clef="treble"
        />

        {/* Left Hand */}
        <HandPanel
          label="Left Hand"
          notes={lhNotes}
          fingering={fingering.lh}
          clef="bass"
        />

      </div>
    </div>
  )
}
