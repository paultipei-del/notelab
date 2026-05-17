/**
 * Pure VexFlow grand-staff renderer.
 *
 * No React, no DOM lookups, no global state — just takes a container and
 * an input, paints SVG into the container. The React wrapper coalesces
 * MIDI updates with requestAnimationFrame and calls this on every paint.
 *
 * Accidentals are computed manually rather than via VexFlow's
 * `Accidental.applyAccidentals` because VexFlow's auto-accidental logic
 * misses the "implied-by-key-signature" case (e.g. F# in G major should
 * not display the sharp glyph because the key signature already has it).
 */

import {
  Renderer, Stave, StaveNote, Formatter, Voice, Accidental, StaveConnector,
} from 'vexflow'

export type StaffNote = {
  key: string                 // VexFlow key e.g. "c/4", "f#/5"
  accidental: string | null   // "#" | "b" | "##" | "bb" | null
  letter: string              // chord-detection letter, e.g. "C", "F#" — used to compute display accidentals
}

export type StaffRenderInput = {
  trebleNotes: StaffNote[]
  bassNotes: StaffNote[]
  /** VexFlow-compatible key signature string: "C", "G", "Bb", "F#m", "Am", ... */
  keySignature: string
  width: number
  height: number
}

// ── Key-signature accidental lookup (used to decide whether a played note
//    actually needs an accidental glyph or is already implied by the key) ─
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'] as const
const FLAT_ORDER  = ['B', 'E', 'A', 'D', 'G', 'C', 'F'] as const
const SHARP_KEY_COUNT: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
}
const FLAT_KEY_COUNT: Record<string, number> = {
  F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7,
}
const MINOR_TO_MAJOR: Record<string, string> = {
  A: 'C',  E: 'G',  B: 'D',  'F#': 'A', 'C#': 'E', 'G#': 'B', 'D#': 'F#', 'A#': 'C#',
  D: 'F',  G: 'Bb', C: 'Eb', F: 'Ab',   Bb: 'Db',  Eb: 'Gb',  Ab: 'Cb',
}

function impliedAccidentals(keySig: string): Record<string, string> {
  // Strip trailing "m" for minor keys, then map to relative major.
  const isMinor = /m$/.test(keySig) && keySig !== 'Cm' ? false : keySig.endsWith('m')
  const tonic = isMinor ? keySig.slice(0, -1) : keySig
  const majorRoot = isMinor ? (MINOR_TO_MAJOR[tonic] ?? 'C') : tonic
  const out: Record<string, string> = {}
  if (SHARP_KEY_COUNT[majorRoot] !== undefined) {
    for (let i = 0; i < SHARP_KEY_COUNT[majorRoot]; i++) out[SHARP_ORDER[i]] = '#'
  } else if (FLAT_KEY_COUNT[majorRoot] !== undefined) {
    for (let i = 0; i < FLAT_KEY_COUNT[majorRoot]; i++) out[FLAT_ORDER[i]] = 'b'
  }
  return out
}

/** Decide what accidental glyph to display on a played note given the key sig. */
function displayAccidental(note: StaffNote, implied: Record<string, string>): string | null {
  const letterRoot = note.letter[0].toUpperCase()
  const played = note.accidental ?? ''            // "" | "#" | "b" | "##" | "bb"
  const inKey  = implied[letterRoot] ?? ''         // "" | "#" | "b"
  if (played === inKey) return null                // already implied → render nothing
  if (played === '') return 'n'                    // played natural, key has #/b on this letter → show ♮
  return played                                    // explicit accidental that differs from key
}

function buildVoice(notes: StaffNote[], clef: 'treble' | 'bass', implied: Record<string, string>): Voice {
  const voice = new Voice({ numBeats: 4, beatValue: 4 })
  if (notes.length === 0) {
    // Whole rest, positioned per clef. VexFlow whole rests use the b/4 key
    // in treble and d/3 in bass to sit at the correct staff position.
    const restKey = clef === 'treble' ? 'b/4' : 'd/3'
    const rest = new StaveNote({ keys: [restKey], duration: 'wr', clef })
    voice.addTickables([rest])
    return voice
  }

  const chord = new StaveNote({
    keys: notes.map(n => n.key),
    duration: 'w',
    clef,
  })

  notes.forEach((n, i) => {
    const glyph = displayAccidental(n, implied)
    if (glyph) chord.addModifier(new Accidental(glyph), i)
  })

  voice.addTickables([chord])
  return voice
}

export function renderStaff(container: HTMLElement, input: StaffRenderInput): void {
  // Clear prior render so the next paint replaces it atomically.
  container.innerHTML = ''

  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(input.width, input.height)
  const context = renderer.getContext()

  // Treble + bass staves
  const trebleY = 10
  const bassY = 100
  const staveWidth = input.width - 20

  const trebleStave = new Stave(10, trebleY, staveWidth)
  trebleStave.addClef('treble').addKeySignature(input.keySignature)
  trebleStave.setContext(context).draw()

  const bassStave = new Stave(10, bassY, staveWidth)
  bassStave.addClef('bass').addKeySignature(input.keySignature)
  bassStave.setContext(context).draw()

  // Brace + connecting lines
  new StaveConnector(trebleStave, bassStave).setType('brace').setContext(context).draw()
  new StaveConnector(trebleStave, bassStave).setType('singleLeft').setContext(context).draw()
  new StaveConnector(trebleStave, bassStave).setType('singleRight').setContext(context).draw()

  // Manual accidental decisions per played note
  const implied = impliedAccidentals(input.keySignature)
  const trebleVoice = buildVoice(input.trebleNotes, 'treble', implied)
  const bassVoice   = buildVoice(input.bassNotes,   'bass',   implied)

  // Format each voice independently against its own stave width (subtract
  // the clef + key-signature glyph width so the chord doesn't crowd the
  // left edge).
  const formatWidth = Math.max(60, staveWidth - 80)
  new Formatter().joinVoices([trebleVoice]).format([trebleVoice], formatWidth)
  new Formatter().joinVoices([bassVoice]).format([bassVoice], formatWidth)

  trebleVoice.draw(context, trebleStave)
  bassVoice.draw(context, bassStave)
}
