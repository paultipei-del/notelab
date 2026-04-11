'use client'

import { useState } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import {
  MAJOR_FINGERINGS, MAJOR_SCALE_NOTES,
  NATURAL_MINOR_FINGERINGS, HARMONIC_MINOR_FINGERINGS, MELODIC_MINOR_FINGERINGS,
  MINOR_SCALE_NOTES, MINOR_SCALE_DISPLAY,
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
  // Extend display to nearest C below start and C above end for context
  const displayStart = startMidi - (startMidi % 12)  // nearest C below
  const displayEnd = endMidi + (12 - (endMidi % 12)) % 12  // nearest C above
  // whiteCount calculated after allKeys is built below
  const H = WH + 32  // extra space for finger numbers

  // Build all keys between start and end
  const allKeys: number[] = []
  for (let m = displayStart; m <= displayEnd; m++) allKeys.push(m)
  const whiteCount = allKeys.filter(m => !isBlackMidi(m)).length
  const W = whiteCount * WW + 4
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
    const diff = midi - displayStart
    // count white keys before this
    let whites = 0
    for (let m = displayStart; m < midi; m++) {
      if (!isBlackMidi(m)) whites++
    }
    if (isBlackMidi(midi)) {
      // position between surrounding white keys
      return whites * WW - BW / 2
    }
    return whites * WW
  }

  const totalWhites = chrWhite.length
  const svgW = totalWhites * WW + 4

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${H}`} style={{ display: 'block' }} preserveAspectRatio="xMinYMin meet">
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

// ── Staff positions (matches StaffCard.tsx exactly) ──────────────────────────
const step = 6

// Treble: pos 0 = F5 (top line), pos 8 = E4 (bottom line)
const TREBLE_POS: Record<string, number> = {
  'C7':-12,'B6':-11,'A6':-10,'G6':-9,'F6':-8,'E6':-7,'D6':-6,'C6':-5,'B5':-4,'A5':-3,'G5':-2,'F5':-1,
  'E5':0,'D5':1,'C5':2,'B4':3,'A4':4,'G4':5,'F4':6,'E4':7,'D4':8,'C4':9,'B3':10,'A3':11,'G3':12,'F3':13,'E3':14,'D3':15,'C3':16,
}
const BASS_POS: Record<string, number> = {
  'E4':-4,'D4':-3,'C4':-2,'B3':-1,
  'A3':0,'G3':1,'F3':2,'E3':3,'D3':4,'C3':5,'B2':6,'A2':7,'G2':8,'F2':9,'E2':10,'D2':11,'C2':12,
  'B1':13,'A1':14,
}

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLAT_NAMES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

function midiToNoteName(midi: number): string {
  const oct = Math.floor(midi / 12) - 1
  return NOTE_NAMES[midi % 12] + oct
}

function midiToPos(midi: number, clef: 'treble' | 'bass'): number | undefined {
  const name = midiToNoteName(midi)
  const pos = clef === 'treble' ? TREBLE_POS[name] : BASS_POS[name]
  if (pos !== undefined) return pos
  // Try flat enharmonic
  const flatName = FLAT_NAMES[midi % 12] + Math.floor(midi / 12 - 1)
  return clef === 'treble' ? TREBLE_POS[flatName] : BASS_POS[flatName]
}

function isBlackMidi(m: number) { return [1,3,6,8,10].includes(m % 12) }

const ACCIDENTAL_MAP_MIDI: Record<string, string> = {
  'C#':'sharp','Db':'flat','D#':'sharp','Eb':'flat',
  'F#':'sharp','Gb':'flat','G#':'sharp','Ab':'flat','A#':'sharp','Bb':'flat',
}

function StaffView({ notes, fingering, clef, hand }: {
  notes: number[]
  fingering: Fingering
  clef: 'treble' | 'bass'
  hand: 'rh' | 'lh'
}) {
  const staffTop = 72
  const noteSpacing = 40
  const leftPad = 60
  const W = leftPad + notes.length * noteSpacing + 24
  const svgH = staffTop + 8 * step + 72
  const showAbove = hand === 'rh'

  const clefY = clef === 'treble' ? staffTop + 36 : staffTop + 12

  return (
    <svg width={W} height={svgH} style={{ maxWidth: '100%', display: 'block' }}>
      {/* Staff lines */}
      {[0,2,4,6,8].map(p => (
        <line key={p} x1={8} y1={staffTop + p * step} x2={W - 4} y2={staffTop + p * step}
          stroke="#D3D1C7" strokeWidth={1} />
      ))}
      {/* Clef */}
      <text x={10} y={clefY} fontSize={clef === 'treble' ? 52 : 50}
        fontFamily="Bravura, serif" fill="#1A1A18" dominantBaseline="auto">
        {clef === 'treble' ? '𝄞' : '𝄢'}
      </text>
      {/* Notes */}
      {notes.map((midi, i) => {
        const x = leftPad + i * noteSpacing
        const pos = midiToPos(midi, clef)
        if (pos === undefined) return null
        const noteY = staffTop + pos * step
        const stemUp = pos >= 4
        const finger = fingering[i]
        const isThumb = finger === 1
        const noteColor = isThumb ? '#BA7517' : '#1A1A18'
        const fingerY = showAbove ? noteY - 28 : noteY + 28

        // Accidental
        const noteName = NOTE_NAMES[midi % 12]
        const accType = ACCIDENTAL_MAP_MIDI[noteName]
        const accGlyph = accType === 'sharp' ? String.fromCodePoint(0xE262) : accType === 'flat' ? String.fromCodePoint(0xE260) : null

        // Ledger lines
        const ledgers: number[] = []
        if (pos < 0) for (let p = -2; p >= pos - (pos % 2); p -= 2) if (p % 2 === 0) ledgers.push(p)
        if (pos > 8) for (let p = 10; p <= pos + (pos % 2); p += 2) if (p % 2 === 0) ledgers.push(p)

        return (
          <g key={i}>
            {ledgers.map(p => (
              <line key={p} x1={x - 12} y1={staffTop + p * step} x2={x + 12} y2={staffTop + p * step}
                stroke="#1A1A18" strokeWidth={1.2} />
            ))}
            {accGlyph && (
              <text x={x - 16} y={noteY} fontSize={36} fontFamily="Bravura, serif"
                fill={noteColor} textAnchor="middle" dominantBaseline="central">
                {accGlyph}
              </text>
            )}
            {/* Note head — Bravura filled notehead U+E0A4 */}
            <text x={x} y={noteY} fontSize={46} fontFamily="Bravura, serif"
              fill={noteColor} textAnchor="middle" dominantBaseline="central">
              {String.fromCodePoint(0xE0A4)}
            </text>
            {/* Stem */}
            <line
              x1={stemUp ? x + 6 : x - 6} y1={noteY}
              x2={stemUp ? x + 6 : x - 6} y2={stemUp ? noteY - 38 : noteY + 38}
              stroke={noteColor} strokeWidth={1.6} />
            {/* Finger number */}
            {finger && (
              <text x={x} y={fingerY} textAnchor="middle" dominantBaseline="middle"
                fontSize={12} fontFamily={F}
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
      <div style={{ overflowX: 'auto' }}>
        <KeyboardSVG notes={notes} fingering={fingering} hand={hand} />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type ScaleType = 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'

// Circle of fifths order: flats ← C → sharps
// Major: Gb - Db - Ab - Eb - Bb - F - C - G - D - A - E - B - Fs
const MAJOR_COF = ['Gb','Db','Ab','Eb','Bb','F','C','G','D','A','E','B','Fs']
// Minor: Ebm - Bbm - Fm - Cm - Gm - Dm - Am - Em - Bm - Fsm - Csm - Gsm
const MINOR_COF = ['Ebm','Bbm','Fm','Cm','Gm','Dm','Am','Em','Bm','Fsm','Csm','Gsm']

// Single-name display (no enharmonic slash combos)
const MAJOR_DISPLAY: Record<string, string> = {
  Gb:'G♭', Db:'D♭', Ab:'A♭', Eb:'E♭', Bb:'B♭',
  F:'F', C:'C', G:'G', D:'D', A:'A', E:'E', B:'B', Fs:'F♯',
}

// Center key for each type
const MAJOR_CENTER = 'C'
const MINOR_CENTER = 'Am'

export default function ScaleFingeringsPage() {
  const router = useRouter()
  const [scaleType, setScaleType] = useState<ScaleType>('major')
  const [selectedKey, setSelectedKey] = useState('C')
  const [direction, setDirection] = useState<'asc'|'desc'>('asc')

  const isMajor = scaleType === 'major'
  const showDirection = scaleType === 'melodic_minor'
  const displayMap = isMajor ? MAJOR_DISPLAY : MINOR_SCALE_DISPLAY
  const cofKeys = isMajor ? MAJOR_COF : MINOR_COF
  const centerKey = isMajor ? MAJOR_CENTER : MINOR_CENTER

  // Resolve raw fingering
  const fingeringRaw = isMajor
    ? MAJOR_FINGERINGS[selectedKey]
    : scaleType === 'harmonic_minor'
      ? HARMONIC_MINOR_FINGERINGS[selectedKey]
      : scaleType === 'melodic_minor'
        ? MELODIC_MINOR_FINGERINGS[selectedKey]
        : NATURAL_MINOR_FINGERINGS[selectedKey]

  // Natural minor descending = ascending reversed (same scale, played downward)
  // Melodic minor descending = natural minor ascending (the classical rule)
  const fingering: { rh: Fingering; lh: Fingering } | null = (() => {
    if (!fingeringRaw) return null
    if (scaleType === 'melodic_minor') {
      const f = fingeringRaw as any
      if (direction === 'asc') return { rh: f.rh_asc, lh: f.lh_asc }
      // Descending = natural minor ascending fingering
      const nat = NATURAL_MINOR_FINGERINGS[selectedKey]
      return nat ? { rh: nat.rh, lh: nat.lh } : { rh: f.rh_asc, lh: f.lh_asc }
    }
    if (scaleType === 'natural_minor') {
      const f = fingeringRaw as { rh: Fingering; lh: Fingering }
      if (direction === 'asc') return { rh: f.rh, lh: f.lh }
      return { rh: [...f.rh].reverse() as Fingering, lh: [...f.lh].reverse() as Fingering }
    }
    return fingeringRaw as { rh: Fingering; lh: Fingering }
  })()

  const ascNotes = isMajor ? MAJOR_SCALE_NOTES[selectedKey] : MINOR_SCALE_NOTES[selectedKey]

  // Melodic minor ascending: raise 6th (idx 5,12) and 7th (idx 6,13) by one semitone
  // Melodic minor descending: natural minor ascending (unchanged)
  const notes = (scaleType === 'melodic_minor' && direction === 'asc' && ascNotes)
    ? ascNotes.map((n, i) => ([5, 6, 12, 13].includes(i) ? n + 1 : n))
    : ascNotes
  const rhNotes = notes
  const lhNotes = notes?.map(m => m - 12)

  if (!fingering || !notes) return null

  const scaleLabel = scaleType === 'major' ? 'Major'
    : scaleType === 'natural_minor' ? 'Natural Minor'
    : scaleType === 'harmonic_minor' ? 'Harmonic Minor'
    : 'Melodic Minor'

  const segBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: '20px', border: 'none',
    background: active ? '#1A1A18' : 'transparent',
    color: active ? 'white' : '#888780',
    fontFamily: F, fontSize: '13px', fontWeight: 300,
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' as const,
  })

  const keyBtn = (active: boolean, isCenter: boolean): React.CSSProperties => ({
    width: '46px', flexShrink: 0, padding: '6px 0', borderRadius: '8px',
    border: '1px solid ' + (active ? '#1A1A18' : isCenter ? '#888780' : '#D3D1C7'),
    background: active ? '#1A1A18' : 'white',
    color: active ? 'white' : '#1A1A18',
    fontFamily: SERIF, fontSize: '17px', fontWeight: isCenter ? 400 : 300,
    cursor: 'pointer', textAlign: 'center' as const,
    transition: 'all 0.15s',
  })

  function changeScaleType(t: ScaleType) {
    setScaleType(t)
    setDirection('asc')
    setSelectedKey(t === 'major' ? 'C' : 'Am')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px) 80px' }}>

        {/* Back + title */}
        <button onClick={() => router.push('/tools')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', padding: 0, marginBottom: '24px', display: 'block' }}>← Back</button>
        <h1 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '36px', color: '#1A1A18', marginBottom: '6px' }}>Scale Fingerings</h1>
        <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 300, color: '#888780', margin: '0 0 28px', lineHeight: 1.6 }}>
          Two-octave piano fingerings for both hands. Thumb crossings highlighted in amber.
        </p>

        {/* Scale type — centered segmented control */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', background: '#E8E5DF', borderRadius: '24px', padding: '3px', gap: '2px', flexWrap: 'wrap' as const }}>
            {([
              ['major','Major'],
              ['natural_minor','Natural Minor'],
              ['harmonic_minor','Harmonic Minor'],
              ['melodic_minor','Melodic Minor'],
            ] as [ScaleType, string][]).map(([t, label]) => (
              <button key={t} onClick={() => changeScaleType(t)} style={segBtn(scaleType === t)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Circle of fifths key selector */}
        <div style={{ marginBottom: '28px' }}>
          {/* ♭ / ♯ edge labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#555350', letterSpacing: '0.04em' }}>♭ Flats</span>
            <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: '#555350', letterSpacing: '0.04em' }}>Sharps ♯</span>
          </div>
          {/* Fixed 13-slot row — C (major) and Am (minor) sit at slot 6 (center) */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'nowrap' as const }}>
              {/* Minor gets one empty spacer on the right to stay at 13 slots */}
              {(isMajor ? cofKeys : [...cofKeys, null]).map((k, i) =>
                k === null
                  ? <div key="spacer" style={{ width: '46px', flexShrink: 0 }} />
                  : <button key={k} onClick={() => setSelectedKey(k)} style={keyBtn(selectedKey === k, k === centerKey)}>
                      {displayMap[k]}
                    </button>
              )}
            </div>
          </div>
        </div>

        {/* Scale title + direction toggle */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 300, fontSize: '30px', color: '#1A1A18', margin: 0 }}>
              {displayMap[selectedKey]} {scaleLabel}
            </h2>
            {showDirection && (
              <div style={{ display: 'inline-flex', background: '#E8E5DF', borderRadius: '20px', padding: '3px', gap: '2px' }}>
                {(['asc','desc'] as const).map(d => (
                  <button key={d} onClick={() => setDirection(d)}
                    style={{ padding: '5px 14px', borderRadius: '20px', border: 'none', background: direction === d ? '#1A1A18' : 'transparent', color: direction === d ? 'white' : '#888780', fontFamily: F, fontSize: '12px', fontWeight: 300, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {d === 'asc' ? '↑ Ascending' : '↓ Descending'}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: '#888780', marginTop: '6px' }}>
            2 octaves · <span style={{ color: '#BA7517', fontWeight: 400 }}>●</span> thumb (1)
          </p>
        </div>

        {/* Right Hand */}
        <HandPanel label="Right Hand" notes={rhNotes} fingering={fingering.rh} clef="treble" />

        {/* Left Hand */}
        <HandPanel label="Left Hand" notes={lhNotes} fingering={fingering.lh} clef="bass" />

      </div>
    </div>
  )
}
