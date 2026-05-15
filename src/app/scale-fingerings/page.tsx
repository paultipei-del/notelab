'use client'

import { useState } from 'react'
import React from 'react'
import Link from 'next/link'
import SlidingPills from '@/components/SlidingPills'
import {
  MAJOR_FINGERINGS, MAJOR_SCALE_NOTES,
  NATURAL_MINOR_FINGERINGS, HARMONIC_MINOR_FINGERINGS, MELODIC_MINOR_FINGERINGS,
  MINOR_SCALE_NOTES, MINOR_SCALE_DISPLAY,
  type Fingering,
} from '@/lib/scale-fingerings'

const MONO = 'var(--font-jetbrains-mono), "JetBrains Mono", ui-monospace, monospace'

// ── Piano keyboard constants ────────────────────────────────────────────────
const WW = 28   // white key width
const WH = 90   // white key height
const BW = 18   // black key width
const BH = 56   // black key height

function isBlackMidi(m: number) { return [1,3,6,8,10].includes(m % 12) }

// ── Keyboard SVG ─────────────────────────────────────────────────────────────
function KeyboardSVG({ notes, fingering, displayFrom, displayTo }: {
  notes: number[]
  fingering: Fingering
  displayFrom?: number
  displayTo?: number
}) {
  const startMidi = notes[0]
  const endMidi = notes[notes.length - 1]
  const displayStart = displayFrom ?? (startMidi - (startMidi % 12))
  const displayEnd   = displayTo   ?? (endMidi + (12 - (endMidi % 12)) % 12)
  const H = WH + 32

  const allKeys: number[] = []
  for (let m = displayStart; m <= displayEnd; m++) allKeys.push(m)
  const chrWhite = allKeys.filter(m => !isBlackMidi(m))
  const chrBlack = allKeys.filter(m => isBlackMidi(m))

  const noteSet = new Set(notes)
  const noteFingerMap: Record<number, number> = {}
  notes.forEach((m, i) => { noteFingerMap[m] = fingering[i] ?? 0 })

  function keyX(midi: number): number {
    let whites = 0
    for (let m = displayStart; m < midi; m++) {
      if (!isBlackMidi(m)) whites++
    }
    if (isBlackMidi(midi)) return whites * WW - BW / 2
    return whites * WW
  }

  const totalWhites = chrWhite.length
  const svgW = totalWhites * WW + 4

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${H}`} className="nl-scale-fingerings-keyboard-svg" preserveAspectRatio="xMinYMin meet">
      {/* White keys */}
      {chrWhite.map(m => {
        const x = keyX(m)
        const active = noteSet.has(m)
        const finger = noteFingerMap[m]
        const isThumb = finger === 1
        const fill = active ? (isThumb ? 'var(--oxblood)' : 'var(--scale-key-tint)') : 'var(--cream-key)'
        const textFill = isThumb ? '#fff' : 'var(--ink)'
        return (
          <g key={m}>
            <rect
              x={x + 1} y={0} width={WW - 2} height={WH} rx={3}
              fill={fill}
              stroke="var(--brown-faint)"
              strokeWidth={1}
            />
            {active && finger && (
              <text
                x={x + WW / 2} y={WH - 10}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={11}
                fontFamily={MONO}
                fontWeight={isThumb ? 600 : 500}
                fill={textFill}
                className="nl-scale-fingerings-finger"
              >
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
        const fill = isThumb ? 'var(--oxblood)' : 'var(--ink)'
        const stroke = active && !isThumb ? 'var(--scale-key-tint)' : 'var(--ink)'
        const strokeWidth = active && !isThumb ? 2.5 : 1
        return (
          <g key={m}>
            <rect
              x={x} y={0} width={BW} height={BH} rx={2}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            {active && finger && (
              <text
                x={x + BW / 2} y={BH - 10}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={11}
                fontFamily={MONO}
                fontWeight={isThumb ? 600 : 500}
                fill="#fff"
                className="nl-scale-fingerings-finger"
              >
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
function HandPanel({ label, notes, fingering, displayFrom, displayTo }: {
  label: string
  notes: number[]
  fingering: Fingering
  displayFrom?: number
  displayTo?: number
}) {
  return (
    <section className="nl-scale-fingerings-hand-card">
      <p className="nl-scale-fingerings-hand-label">{label}</p>
      <div className="nl-scale-fingerings-keyboard-scroll">
        <KeyboardSVG notes={notes} fingering={fingering} displayFrom={displayFrom} displayTo={displayTo} />
      </div>
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type ScaleType = 'major' | 'natural_minor' | 'harmonic_minor' | 'melodic_minor'

const MAJOR_COF = ['Gb','Db','Ab','Eb','Bb','F','C','G','D','A','E','B','Fs']
const MINOR_COF = ['Ebm','Bbm','Fm','Cm','Gm','Dm','Am','Em','Bm','Fsm','Csm','Gsm','Dsm']

const KEY_ALIAS: Record<string, string> = { Dsm: 'Ebm' }

const MAJOR_DISPLAY: Record<string, string> = {
  Gb:'G♭', Db:'D♭', Ab:'A♭', Eb:'E♭', Bb:'B♭',
  F:'F', C:'C', G:'G', D:'D', A:'A', E:'E', B:'B', Fs:'F♯',
}
const MINOR_DISPLAY: Record<string, string> = { ...MINOR_SCALE_DISPLAY, Dsm: 'D♯' }

export default function ScaleFingeringsPage() {
  const [scaleType, setScaleType] = useState<ScaleType>('major')
  const [selectedKey, setSelectedKey] = useState('C')
  const [direction, setDirection] = useState<'asc'|'desc'>('asc')

  const isMajor = scaleType === 'major'
  const showDirection = scaleType === 'melodic_minor'
  const displayMap = isMajor ? MAJOR_DISPLAY : MINOR_DISPLAY
  const cofKeys = isMajor ? MAJOR_COF : MINOR_COF

  const dataKey = KEY_ALIAS[selectedKey] ?? selectedKey

  const fingeringRaw = isMajor
    ? MAJOR_FINGERINGS[dataKey]
    : scaleType === 'harmonic_minor'
      ? HARMONIC_MINOR_FINGERINGS[dataKey]
      : scaleType === 'melodic_minor'
        ? MELODIC_MINOR_FINGERINGS[dataKey]
        : NATURAL_MINOR_FINGERINGS[dataKey]

  const fingering: { rh: Fingering; lh: Fingering } | null = (() => {
    if (!fingeringRaw) return null
    if (scaleType === 'melodic_minor') {
      const f = fingeringRaw as { rh_asc: Fingering; lh_asc: Fingering }
      if (direction === 'asc') return { rh: f.rh_asc, lh: f.lh_asc }
      const nat = NATURAL_MINOR_FINGERINGS[dataKey]
      return nat ? { rh: nat.rh, lh: nat.lh } : { rh: f.rh_asc, lh: f.lh_asc }
    }
    if (scaleType === 'natural_minor') {
      const f = fingeringRaw as { rh: Fingering; lh: Fingering }
      if (direction === 'asc') return { rh: f.rh, lh: f.lh }
      return { rh: [...f.rh].reverse() as Fingering, lh: [...f.lh].reverse() as Fingering }
    }
    return fingeringRaw as { rh: Fingering; lh: Fingering }
  })()

  const ascNotes = isMajor ? MAJOR_SCALE_NOTES[dataKey] : MINOR_SCALE_NOTES[dataKey]

  const notes = (scaleType === 'melodic_minor' && direction === 'asc' && ascNotes)
    ? ascNotes.map((n, i) => ([5, 6, 12, 13].includes(i) ? n + 1 : n))
    : ascNotes
  const rhNotes = notes
  const lhNotes = notes?.map(m => m - 12)

  if (!fingering || !notes || !lhNotes) return null

  const needsCushion = (isMajor && dataKey === 'C') || (!isMajor && dataKey === 'Cm')
  const rhDisplayFrom = needsCushion ? 53 : undefined
  const rhDisplayTo   = needsCushion ? 89 : undefined
  const lhDisplayFrom = needsCushion ? 41 : undefined
  const lhDisplayTo   = needsCushion ? 77 : undefined

  const scaleLabel = scaleType === 'major' ? 'Major'
    : scaleType === 'natural_minor' ? 'Natural Minor'
    : scaleType === 'harmonic_minor' ? 'Harmonic Minor'
    : 'Melodic Minor'

  function renderKeyLabel(name: string, accSize = '0.78em'): React.ReactNode {
    return name.split(/(♭|♯)/).map((part, i) =>
      (part === '♭' || part === '♯')
        ? <span key={i} className="nl-scale-fingerings-chip__accidental" style={{ fontSize: accSize }}>{part}</span>
        : <React.Fragment key={i}>{part}</React.Fragment>
    )
  }

  function changeScaleType(t: ScaleType) {
    setScaleType(t)
    setDirection('asc')
    setSelectedKey(t === 'major' ? 'C' : 'Am')
  }

  // Mobile chip split: flats territory + naturals on row 1; naturals + sharps on row 2.
  // 13 chips total. Row 1 = first 7 of cofKeys, Row 2 = remaining 6 + one empty slot.
  const mobileRow1 = cofKeys.slice(0, 7)
  const mobileRow2 = cofKeys.slice(7)

  return (
    <div className="nl-scale-fingerings-page">
      <div className="nl-scale-fingerings-inner">
        <Link href="/tools" className="nl-scale-fingerings-back">← Back to tools</Link>

        <header className="nl-scale-fingerings-hero">
          <p className="nl-scale-fingerings-hero__eyebrow">Scale Fingerings</p>
          <h1 className="nl-scale-fingerings-hero__title">The <em>standard</em> fingerings.</h1>
          <p className="nl-scale-fingerings-hero__sub">
            Two-octave piano fingerings for both hands. Thumb crossings in red.
          </p>
        </header>

        {/* Scale type segmented control */}
        <div className="nl-scale-fingerings-tabs-row">
          <SlidingPills
            className="nl-scale-fingerings-tabs"
            options={[
              { value: 'major' as ScaleType, label: 'Major', shortLabel: 'Major' },
              { value: 'natural_minor' as ScaleType, label: 'Natural Minor', shortLabel: 'Nat. Min' },
              { value: 'harmonic_minor' as ScaleType, label: 'Harmonic Minor', shortLabel: 'Harm. Min' },
              { value: 'melodic_minor' as ScaleType, label: 'Melodic Minor', shortLabel: 'Mel. Min' },
            ]}
            value={scaleType}
            onChange={changeScaleType}
          />
        </div>

        {/* Root chip row */}
        <div className="nl-scale-fingerings-chip-frame">
          <span className="nl-scale-fingerings-flats-label" aria-hidden>
            <span className="nl-scale-fingerings-flats-label__glyph">♭</span> Flats
          </span>
          <div className="nl-scale-fingerings-chips">
            {cofKeys.map(k => (
              <button
                key={k}
                type="button"
                className={'nl-scale-fingerings-chip' + (selectedKey === k ? ' is-active' : '')}
                onClick={() => setSelectedKey(k)}
              >
                {renderKeyLabel(displayMap[k])}
              </button>
            ))}
          </div>
          <span className="nl-scale-fingerings-sharps-label" aria-hidden>
            Sharps <span className="nl-scale-fingerings-sharps-label__glyph">♯</span>
          </span>
        </div>

        {/* Mobile chip rows (two-row layout) */}
        <div className="nl-scale-fingerings-chip-frame--mobile">
          <div className="nl-scale-fingerings-mobile-strip">
            <span className="nl-scale-fingerings-mobile-strip__label nl-scale-fingerings-mobile-strip__label--start">
              <span className="nl-scale-fingerings-mobile-strip__glyph">♭</span> Flats
            </span>
            <span className="nl-scale-fingerings-mobile-strip__label nl-scale-fingerings-mobile-strip__label--end">
              Naturals
            </span>
          </div>
          <div className="nl-scale-fingerings-chips nl-scale-fingerings-chips--mobile">
            {mobileRow1.map(k => (
              <button
                key={k}
                type="button"
                className={'nl-scale-fingerings-chip' + (selectedKey === k ? ' is-active' : '')}
                onClick={() => setSelectedKey(k)}
              >
                {renderKeyLabel(displayMap[k])}
              </button>
            ))}
          </div>
          <div className="nl-scale-fingerings-mobile-strip">
            <span className="nl-scale-fingerings-mobile-strip__label nl-scale-fingerings-mobile-strip__label--start">
              Naturals
            </span>
            <span className="nl-scale-fingerings-mobile-strip__label nl-scale-fingerings-mobile-strip__label--end">
              Sharps <span className="nl-scale-fingerings-mobile-strip__glyph">♯</span>
            </span>
          </div>
          <div className="nl-scale-fingerings-chips nl-scale-fingerings-chips--mobile">
            {mobileRow2.map(k => (
              <button
                key={k}
                type="button"
                className={'nl-scale-fingerings-chip' + (selectedKey === k ? ' is-active' : '')}
                onClick={() => setSelectedKey(k)}
              >
                {renderKeyLabel(displayMap[k])}
              </button>
            ))}
            {mobileRow2.length < 7 && Array.from({ length: 7 - mobileRow2.length }).map((_, i) => (
              <span key={`spacer-${i}`} className="nl-scale-fingerings-chip is-spacer" aria-hidden />
            ))}
          </div>
        </div>

        {/* Scale title */}
        <div className="nl-scale-fingerings-title-row">
          <h2 className="nl-scale-fingerings-scale-name">
            {renderKeyLabel(displayMap[selectedKey])} {scaleLabel}
          </h2>
        </div>
        <p className="nl-scale-fingerings-meta">
          2 octaves
          <span className="nl-scale-fingerings-meta__sep" aria-hidden>·</span>
          <span className="nl-scale-fingerings-meta__dot" aria-hidden />
          thumb (1)
        </p>

        {showDirection && (
          <div
            className="nl-scale-fingerings-direction"
            role="group"
            aria-label="Scale direction"
            data-direction={direction === 'asc' ? 'ascending' : 'descending'}
          >
            <span className="nl-scale-fingerings-direction__pill" aria-hidden />
            <button
              type="button"
              className={'nl-scale-fingerings-direction__btn' + (direction === 'asc' ? ' is-active' : '')}
              aria-pressed={direction === 'asc'}
              onClick={() => setDirection('asc')}
            >
              <span className="nl-scale-fingerings-direction__arrow" aria-hidden>↑</span>
              Ascending
            </button>
            <button
              type="button"
              className={'nl-scale-fingerings-direction__btn' + (direction === 'desc' ? ' is-active' : '')}
              aria-pressed={direction === 'desc'}
              onClick={() => setDirection('desc')}
            >
              <span className="nl-scale-fingerings-direction__arrow" aria-hidden>↓</span>
              Descending
            </button>
          </div>
        )}

        <HandPanel label="Right Hand" notes={rhNotes} fingering={fingering.rh} displayFrom={rhDisplayFrom} displayTo={rhDisplayTo} />
        <HandPanel label="Left Hand" notes={lhNotes} fingering={fingering.lh} displayFrom={lhDisplayFrom} displayTo={lhDisplayTo} />

      </div>
    </div>
  )
}
