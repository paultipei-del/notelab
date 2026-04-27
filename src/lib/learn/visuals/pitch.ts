/**
 * Pitch utilities local to the /learn primitive system.
 *
 * Staff position convention: integer half-line steps from the top line,
 * increasing downward. Top line = 0, top space = 1, ..., bottom line = 8.
 * Treble: F5=0, E5=1, D5=2, C5=3, B4=4, A4=5, G4=6, F4=7, E4=8.
 * Bass:   A3=0, G3=1, F3=2, E3=3, D3=4, C3=5, B2=6, A2=7, G2=8.
 */

import type { LearnTokens } from './tokens'

export type Accidental = '#' | 'b' | 'n' | '##' | 'bb' | null
export type Clef = 'treble' | 'bass'

export interface ParsedPitch {
  letter: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  accidental: Accidental
  octave: number
  midi: number
}

const LETTER_TO_SEMI: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}

export function parsePitch(pitch: string): ParsedPitch | null {
  const m = pitch.match(/^([A-G])(##|bb|#|b|n)?(-?\d+)$/)
  if (!m) return null
  const [, letter, accStr, octStr] = m
  const accidental = (accStr ?? null) as Accidental
  const octave = parseInt(octStr, 10)
  const semi = LETTER_TO_SEMI[letter]
    + (accidental === '#' ? 1 : accidental === 'b' ? -1
      : accidental === '##' ? 2 : accidental === 'bb' ? -2 : 0)
  const midi = (octave + 1) * 12 + semi
  return { letter: letter as ParsedPitch['letter'], accidental, octave, midi }
}

export function staffPosition(p: ParsedPitch, clef: Clef): number {
  const stepIdx = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(p.letter)
  const totalSteps = p.octave * 7 + stepIdx
  const anchor = clef === 'treble' ? 38 : 26
  return anchor - totalSteps
}

export function pitchToPos(pitch: string, clef: Clef): number | null {
  const p = parsePitch(pitch)
  return p ? staffPosition(p, clef) : null
}

export function preferredClef(pitch: string): Clef {
  const p = parsePitch(pitch)
  if (!p) return 'treble'
  return p.midi >= 60 ? 'treble' : 'bass'
}

export function midiToPitch(midi: number): string {
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midi / 12) - 1
  return `${NAMES[midi % 12]}${octave}`
}

export function ledgerLinePositions(pos: number): number[] {
  const lines: number[] = []
  if (pos < 0) {
    for (let p = -2; p >= pos; p -= 2) lines.push(p)
  } else if (pos > 8) {
    for (let p = 10; p <= pos; p += 2) lines.push(p)
  }
  return lines
}

export interface NoteBounds {
  top: number
  bottom: number
}

export function noteBounds(
  pitch: string,
  staffTop: number,
  clef: Clef,
  T: LearnTokens,
): NoteBounds | null {
  const parsed = parsePitch(pitch)
  if (!parsed) return null
  const pos = staffPosition(parsed, clef)
  const noteY = staffTop + pos * T.step
  const stemUp = pos > 4
  const stemTailY = stemUp ? noteY - T.stemLength : noteY + T.stemLength
  const noteheadTopY = noteY - T.noteheadHalfHeight
  const noteheadBottomY = noteY + T.noteheadHalfHeight
  const ledgerYs = ledgerLinePositions(pos).map(lp => staffTop + lp * T.step)
  return {
    top: Math.min(noteheadTopY, stemTailY, ...ledgerYs),
    bottom: Math.max(noteheadBottomY, stemTailY, ...ledgerYs),
  }
}

export interface AggregateBounds {
  top: number
  bottom: number
  staffTop: number
  staffBottom: number
}

export function aggregateBounds(
  pitches: string[],
  staffTop: number,
  clef: Clef,
  T: LearnTokens,
): AggregateBounds {
  const staffBottom = staffTop + 8 * T.step
  let top = staffTop
  let bottom = staffBottom
  for (const p of pitches) {
    const b = noteBounds(p, staffTop, clef, T)
    if (!b) continue
    top = Math.min(top, b.top)
    bottom = Math.max(bottom, b.bottom)
  }
  return { top, bottom, staffTop, staffBottom }
}
