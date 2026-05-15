'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

// ── Pattern data ─────────────────────────────────────────────────────────────
type PatternId = 'chromatic' | 'whole-tone' | 'minor-3rds' | 'major-3rds' | 'fourths' | 'tritone' | 'fifths'

const PATTERN_OPTIONS: { id: PatternId; label: string }[] = [
  { id: 'chromatic',   label: 'Chromatic'  },
  { id: 'whole-tone',  label: 'Whole-tone' },
  { id: 'minor-3rds',  label: 'Minor 3rds' },
  { id: 'major-3rds',  label: 'Major 3rds' },
  { id: 'fourths',     label: '4ths'       },
  { id: 'tritone',     label: 'Tritone'    },
  { id: 'fifths',      label: '5ths'       },
]

const PATTERN_CALLOUTS: Record<PatternId, string> = {
  chromatic:   'Twelve keys, ascending by half-step. The most exhaustive cycle.',
  'whole-tone': 'Six keys per loop, ascending by whole step. Two non-overlapping loops cover all twelve.',
  'minor-3rds': 'Four keys per loop, ascending by minor third. Three non-overlapping loops cover all twelve.',
  'major-3rds': 'Three keys per loop, ascending by major third. Four non-overlapping loops cover all twelve.',
  fourths:     'Twelve keys, ascending by perfect fourth. Equivalent to descending by fifth.',
  tritone:     'Two keys per loop, separated by six half-steps. Six non-overlapping loops cover all twelve.',
  fifths:      'Twelve keys, ascending by perfect fifth. Equivalent to descending by fourth.',
}

const START_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const SHARP_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLAT_NAMES  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

const LETTERS = ['C','D','E','F','G','A','B']
const LETTER_PC: Record<string, number> = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 }

function pcOf(name: string): number {
  const s = SHARP_NAMES.indexOf(name)
  if (s >= 0) return s
  const f = FLAT_NAMES.indexOf(name)
  if (f >= 0) return f
  // Handle # / b / ##/ bb spellings outside the canonical sharp/flat sets
  const letter = name[0]
  const acc = name.slice(1)
  let pc = LETTER_PC[letter] ?? 0
  if (acc === '#') pc = (pc + 1) % 12
  else if (acc === '##') pc = (pc + 2) % 12
  else if (acc === 'b') pc = (pc + 11) % 12
  else if (acc === 'bb') pc = (pc + 10) % 12
  return pc
}

function parseNote(name: string): { letterIdx: number; pc: number } {
  const letter = name[0]
  const acc = name.slice(1)
  let pc = LETTER_PC[letter] ?? 0
  if (acc === '#') pc = (pc + 1) % 12
  else if (acc === '##') pc = (pc + 2) % 12
  else if (acc === 'b') pc = (pc + 11) % 12
  else if (acc === 'bb') pc = (pc + 10) % 12
  return { letterIdx: LETTERS.indexOf(letter), pc }
}

// Canonical chromatic spelling (matches the conventional pedagogical mix:
// flats on the way up except F# at the tritone).
const C_CHROMATIC = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B','C']

// Non-coprime cycles — closed routes keyed on the canonical "first member"
// of each cycle class. Each route includes the start at both ends.
const CANONICAL_NON_COPRIME: Record<'whole-tone' | 'minor-3rds' | 'major-3rds' | 'tritone', string[][]> = {
  'whole-tone': [
    ['C', 'D', 'E', 'F#', 'Ab', 'Bb', 'C'],
    ['Db', 'Eb', 'F', 'G', 'A', 'B', 'Db'],
  ],
  'minor-3rds': [
    ['C', 'Eb', 'F#', 'A', 'C'],
    ['Db', 'E', 'G', 'Bb', 'Db'],
    ['D', 'F', 'Ab', 'B', 'D'],
  ],
  'major-3rds': [
    ['C', 'E', 'Ab', 'C'],
    ['Db', 'F', 'A', 'Db'],
    ['D', 'F#', 'Bb', 'D'],
    ['Eb', 'G', 'B', 'Eb'],
  ],
  tritone: [
    ['C', 'F#', 'C'],
    ['Db', 'G', 'Db'],
    ['D', 'Ab', 'D'],
    ['Eb', 'A', 'Eb'],
    ['E', 'Bb', 'E'],
    ['F', 'B', 'F'],
  ],
}

function rotateNonCoprime(pattern: keyof typeof CANONICAL_NON_COPRIME, start: string): string[] {
  const routes = CANONICAL_NON_COPRIME[pattern]
  const startPc = pcOf(start)
  for (const route of routes) {
    const unique = route.slice(0, -1)
    const idx = unique.findIndex(n => pcOf(n) === startPc)
    if (idx >= 0) {
      const rotated = [...unique.slice(idx), ...unique.slice(0, idx)]
      rotated[0] = start
      return [...rotated, start]
    }
  }
  return [start, start]
}

function generateChromaticFrom(start: string): string[] {
  if (start === 'C') return [...C_CHROMATIC]
  const startPc = pcOf(start)
  // Rotate C_CHROMATIC to start at startPc
  const unique = C_CHROMATIC.slice(0, -1)
  const idx = unique.findIndex(n => pcOf(n) === startPc)
  if (idx >= 0) {
    const rotated = [...unique.slice(idx), ...unique.slice(0, idx)]
    rotated[0] = start
    return [...rotated, start]
  }
  // Fallback to flat/sharp preference
  const useFlats = start.endsWith('b') || start === 'F'
  const names = useFlats ? FLAT_NAMES : SHARP_NAMES
  const seq: string[] = [start]
  for (let i = 1; i <= 12; i++) seq.push(names[(startPc + i) % 12])
  seq[seq.length - 1] = start
  return seq
}

// Build a diatonic half-cycle from a start, stepping by `interval` semitones
// and advancing the letter name by `letterStep` each step. Falls back to a
// simple enharmonic when the strict diatonic spelling would require a
// double-accidental (e.g., F## → G).
function diatonicSteps(start: string, interval: number, letterStep: number, steps: number, fallback: 'sharp' | 'flat'): string[] {
  const { letterIdx, pc } = parseNote(start)
  const seq: string[] = [start]
  let curLetter = letterIdx
  let curPc = pc
  for (let i = 1; i <= steps; i++) {
    const nextLetter = (curLetter + letterStep) % 7
    const nextPc = (curPc + interval) % 12
    const naturalPc = LETTER_PC[LETTERS[nextLetter]]
    const diff = ((nextPc - naturalPc) % 12 + 12) % 12
    let spelling: string
    let resolvedLetter = nextLetter
    if (diff === 0) spelling = LETTERS[nextLetter]
    else if (diff === 1) spelling = LETTERS[nextLetter] + '#'
    else if (diff === 11) spelling = LETTERS[nextLetter] + 'b'
    else {
      spelling = fallback === 'flat' ? FLAT_NAMES[nextPc] : SHARP_NAMES[nextPc]
      resolvedLetter = LETTERS.indexOf(spelling[0])
    }
    seq.push(spelling)
    curLetter = resolvedLetter
    curPc = nextPc
  }
  return seq
}

// 4ths and 5ths produce a 12-note coprime cycle. Spelled diatonically up
// to the tritone (position 6), then closed by approaching the start from
// the reverse direction for positions 7–12. This is the canonical
// "circle of fifths" pedagogical spelling: sharp side first half, flat
// side second half (or vice versa for 4ths). Mirror identity holds:
// reverse(5ths from C) === 4ths from C.
function generateCoprime(pattern: 'fourths' | 'fifths', start: string): string[] {
  const interval = pattern === 'fourths' ? 5 : 7
  const letterStep = pattern === 'fourths' ? 3 : 4
  const revInterval = 12 - interval
  const revLetterStep = 7 - letterStep
  const fwdFallback: 'sharp' | 'flat' = pattern === 'fifths' ? 'sharp' : 'flat'
  const bwdFallback: 'sharp' | 'flat' = pattern === 'fifths' ? 'flat' : 'sharp'

  const fwd = diatonicSteps(start, interval, letterStep, 6, fwdFallback)
  const bwdRaw = diatonicSteps(start, revInterval, revLetterStep, 5, bwdFallback)
  const bwd = bwdRaw.slice(1).reverse()
  return [...fwd, ...bwd, start]
}

function generateCycle(pattern: PatternId, start: string): string[] {
  if (pattern === 'chromatic') return generateChromaticFrom(start)
  if (pattern === 'fourths' || pattern === 'fifths') return generateCoprime(pattern, start)
  return rotateNonCoprime(pattern as keyof typeof CANONICAL_NON_COPRIME, start)
}

// Render a key label with accidentals at a slightly smaller size so the
// glyphs line up with cap-letter height.
function renderNote(name: string, accSize = '0.78em'): React.ReactNode {
  return name.split(/([#b])/).map((part, i) => {
    if (part === '#' || part === 'b') {
      const glyph = part === '#' ? '♯' : '♭'
      return <span key={i} style={{ fontSize: accSize, lineHeight: 1 }}>{glyph}</span>
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

export default function OrderOfPracticePage() {
  const [pattern, setPattern] = useState<PatternId>('chromatic')
  const [start, setStart] = useState<string>('C')
  const [direction, setDirection] = useState<'forward' | 'reverse'>('forward')
  const [openPopover, setOpenPopover] = useState<null | 'pattern' | 'start'>(null)
  const controlsRef = useRef<HTMLDivElement | null>(null)

  // Click-outside / Escape dismissal for popovers
  useEffect(() => {
    if (!openPopover) return
    function onDocPointer(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null
      if (controlsRef.current && target && !controlsRef.current.contains(target)) {
        setOpenPopover(null)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenPopover(null)
    }
    document.addEventListener('mousedown', onDocPointer)
    document.addEventListener('touchstart', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocPointer)
      document.removeEventListener('touchstart', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [openPopover])

  const cycle = useMemo(() => generateCycle(pattern, start), [pattern, start])
  const displayed = useMemo(() => (direction === 'reverse' ? [...cycle].reverse() : cycle), [cycle, direction])

  const patternLabel = PATTERN_OPTIONS.find(p => p.id === pattern)?.label ?? ''
  const patternIdx = PATTERN_OPTIONS.findIndex(p => p.id === pattern)
  const startIdx = START_NOTES.indexOf(start)
  const stepCount = cycle.length - 1
  const calloutCopy = PATTERN_CALLOUTS[pattern]

  function stepPattern(delta: 1 | -1) {
    const next = (patternIdx + delta + PATTERN_OPTIONS.length) % PATTERN_OPTIONS.length
    setPattern(PATTERN_OPTIONS[next].id)
  }
  function stepStart(delta: 1 | -1) {
    const next = (startIdx + delta + START_NOTES.length) % START_NOTES.length
    setStart(START_NOTES[next])
  }

  return (
    <div className="nl-order-of-practice-page">
      <div className="nl-order-of-practice-inner">
        <Link href="/tools" className="nl-order-of-practice-back">← Back to tools</Link>

        <header className="nl-order-of-practice-hero">
          <p className="nl-order-of-practice-hero__eyebrow">Order of Practice</p>
          <h1 className="nl-order-of-practice-hero__title">Order of <em>Practice.</em></h1>
          <p className="nl-order-of-practice-hero__sub">
            Run your ideas, voicings, and progressions through every key.
          </p>
        </header>

        {/* Desktop config bar */}
        <div className="nl-order-of-practice-config" role="group" aria-label="Cycle configuration">
          <div className="nl-order-of-practice-config__group">
            <span className="nl-order-of-practice-config__label">Pattern</span>
            <select
              className="nl-order-of-practice-select"
              value={pattern}
              onChange={e => setPattern(e.target.value as PatternId)}
            >
              {PATTERN_OPTIONS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <span className="nl-order-of-practice-config__divider" aria-hidden />

          <div className="nl-order-of-practice-config__group">
            <span className="nl-order-of-practice-config__label">Start</span>
            <select
              className="nl-order-of-practice-select"
              value={start}
              onChange={e => setStart(e.target.value)}
            >
              {START_NOTES.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <span className="nl-order-of-practice-config__divider" aria-hidden />

          <div
            className="nl-order-of-practice-direction"
            role="group"
            aria-label="Direction"
            data-direction={direction}
          >
            <span className="nl-order-of-practice-direction__pill" aria-hidden />
            <button
              type="button"
              className={'nl-order-of-practice-direction__btn' + (direction === 'forward' ? ' is-active' : '')}
              aria-pressed={direction === 'forward'}
              onClick={() => setDirection('forward')}
            >
              <span className="nl-order-of-practice-direction__arrow" aria-hidden>↑</span>
              Forward
            </button>
            <button
              type="button"
              className={'nl-order-of-practice-direction__btn' + (direction === 'reverse' ? ' is-active' : '')}
              aria-pressed={direction === 'reverse'}
              onClick={() => setDirection('reverse')}
            >
              <span className="nl-order-of-practice-direction__arrow" aria-hidden>↓</span>
              Reverse
            </button>
          </div>
        </div>

        {/* Mobile stacked controls */}
        <div className="nl-order-of-practice-controls" ref={controlsRef}>
          <div className="nl-order-of-practice-controls__row">
            <span className="nl-order-of-practice-controls__label">Pattern</span>
            <div className="nl-order-of-practice-stepper">
              <button
                type="button"
                className="nl-order-of-practice-stepper__btn"
                onClick={() => stepPattern(-1)}
                aria-label="Previous pattern"
              >−</button>
              <button
                type="button"
                className="nl-order-of-practice-stepper__value is-wide"
                onClick={() => setOpenPopover(openPopover === 'pattern' ? null : 'pattern')}
                aria-haspopup="listbox"
                aria-expanded={openPopover === 'pattern'}
              >
                {patternLabel}
                <span className="nl-order-of-practice-stepper__chev" aria-hidden>▾</span>
              </button>
              <button
                type="button"
                className="nl-order-of-practice-stepper__btn"
                onClick={() => stepPattern(1)}
                aria-label="Next pattern"
              >+</button>
              {openPopover === 'pattern' && (
                <div className="nl-order-of-practice-popover" role="listbox">
                  <div className="nl-order-of-practice-popover__patterns-list">
                    {PATTERN_OPTIONS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        aria-selected={pattern === p.id}
                        className={'nl-order-of-practice-popover__option' + (pattern === p.id ? ' is-active' : '')}
                        onClick={() => {
                          setPattern(p.id)
                          setOpenPopover(null)
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="nl-order-of-practice-controls__row">
            <span className="nl-order-of-practice-controls__label">Start</span>
            <div className="nl-order-of-practice-stepper">
              <button
                type="button"
                className="nl-order-of-practice-stepper__btn"
                onClick={() => stepStart(-1)}
                aria-label="Previous starting note"
              >−</button>
              <button
                type="button"
                className="nl-order-of-practice-stepper__value"
                onClick={() => setOpenPopover(openPopover === 'start' ? null : 'start')}
                aria-haspopup="listbox"
                aria-expanded={openPopover === 'start'}
              >
                {renderNote(start)}
                <span className="nl-order-of-practice-stepper__chev" aria-hidden>▾</span>
              </button>
              <button
                type="button"
                className="nl-order-of-practice-stepper__btn"
                onClick={() => stepStart(1)}
                aria-label="Next starting note"
              >+</button>
              {openPopover === 'start' && (
                <div className="nl-order-of-practice-popover nl-order-of-practice-popover--notes" role="listbox">
                  <div className="nl-order-of-practice-popover__notes-grid">
                    {START_NOTES.map(n => (
                      <button
                        key={n}
                        type="button"
                        role="option"
                        aria-selected={start === n}
                        className={'nl-order-of-practice-popover__option' + (start === n ? ' is-active' : '')}
                        onClick={() => {
                          setStart(n)
                          setOpenPopover(null)
                        }}
                      >
                        {renderNote(n)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="nl-order-of-practice-controls__row">
            <span className="nl-order-of-practice-controls__label">Direction</span>
            <div
              className="nl-order-of-practice-direction nl-order-of-practice-direction--mobile"
              role="group"
              aria-label="Direction"
              data-direction={direction}
            >
              <span className="nl-order-of-practice-direction__pill" aria-hidden />
              <button
                type="button"
                className={'nl-order-of-practice-direction__btn' + (direction === 'forward' ? ' is-active' : '')}
                aria-pressed={direction === 'forward'}
                onClick={() => setDirection('forward')}
              >
                <span className="nl-order-of-practice-direction__arrow" aria-hidden>↑</span>
                Forward
              </button>
              <button
                type="button"
                className={'nl-order-of-practice-direction__btn' + (direction === 'reverse' ? ' is-active' : '')}
                aria-pressed={direction === 'reverse'}
                onClick={() => setDirection('reverse')}
              >
                <span className="nl-order-of-practice-direction__arrow" aria-hidden>↓</span>
                Reverse
              </button>
            </div>
          </div>
        </div>

        {/* Desktop horizontal sequence */}
        <div className="nl-order-of-practice-sequence" aria-label="Practice sequence">
          {displayed.map((note, i) => {
            const isAnchor = i === 0 || i === displayed.length - 1
            return (
              <React.Fragment key={`${note}-${i}`}>
                <span className="nl-order-of-practice-sequence__cell">
                  <span className={'nl-order-of-practice-sequence__note' + (isAnchor ? ' is-anchor' : '')}>
                    {renderNote(note)}
                  </span>
                </span>
                {i < displayed.length - 1 && (
                  <span className="nl-order-of-practice-sequence__sep" aria-hidden>→</span>
                )}
              </React.Fragment>
            )
          })}
        </div>

        <p className="nl-order-of-practice-callout">{calloutCopy}</p>

        {/* Mobile wrapped-horizontal sequence */}
        <section className="nl-order-of-practice-vseq" aria-label="Practice sequence">
          <header className="nl-order-of-practice-vseq__head">
            <h2 className="nl-order-of-practice-vseq__title">
              {renderNote(start)} <em>{patternLabel.toLowerCase()}.</em>
            </h2>
            <p className="nl-order-of-practice-vseq__meta">
              {stepCount} step{stepCount === 1 ? '' : 's'} · {direction}
            </p>
          </header>
          <div className="nl-order-of-practice-vseq__flow">
            {displayed.map((note, i) => {
              const isAnchor = i === 0 || i === displayed.length - 1
              return (
                <React.Fragment key={`${note}-${i}`}>
                  <span className={'nl-order-of-practice-vseq__cell' + (isAnchor ? ' is-anchor' : '')}>
                    {renderNote(note)}
                  </span>
                  {i < displayed.length - 1 && (
                    <span className="nl-order-of-practice-vseq__sep" aria-hidden>→</span>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </section>

        <p className="nl-order-of-practice-callout nl-order-of-practice-callout--mobile">{calloutCopy}</p>
      </div>
    </div>
  )
}
