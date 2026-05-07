// Bravura SMuFL font symbol map
// Font loaded via @font-face in layout.tsx

export const B = {
  // ── Clefs ──
  trebleClef: '\uE050',
  bassClef: '\uE062',

  // ── Noteheads ──
  wholeNoteHead: '\uE0A2',
  hollowNoteHead: '\uE0A3',
  filledNoteHead: '\uE0A4',

  // ── Notes (with stems) ──
  wholeNote: '\uE1D2',
  halfNoteUp: '\uE1D3',
  halfNoteDown: '\uE1D4',
  quarterNoteUp: '\uE1D5',
  quarterNoteDown: '\uE1D6',
  eighthNoteUp: '\uE1D7',
  eighthNoteDown: '\uE1D8',
  sixteenthNoteUp: '\uE1D9',
  sixteenthNoteDown: '\uE1DA',
  thirtySecondNoteUp: '\uE1DB',
  thirtySecondNoteDown: '\uE1DC',

  // ── Rests ──
  // SMuFL canonical: rests live at U+E4E3 (whole) onward. Earlier
  // wholeRest / halfRest values (U+E4F4 / U+E4F5) were not allocated
  // to rests in SMuFL; Rest.tsx always used the correct codepoints
  // and this map now matches it.
  wholeRest: '\uE4E3',
  halfRest: '\uE4E4',
  quarterRest: '\uE4E5',
  eighthRest: '\uE4E6',
  sixteenthRest: '\uE4E7',
  thirtySecondRest: '\uE4E8',

  // ── Accidentals ──
  flat: '\uE260',
  natural: '\uE261',
  sharp: '\uE262',
  doubleSharp: '\uE263',
  doubleFlat: '\uE264',

  // ── Articulations ──
  accentAbove: '\uE4A0',
  accentBelow: '\uE4A1',
  staccatoAbove: '\uE4A2',
  staccatoBelow: '\uE4A3',
  tenutoAbove: '\uE4A4',
  tenutoBelow: '\uE4A5',
  fermataAbove: '\uE4C0',
  fermataBelow: '\uE4C1',

  // ── Dynamics ──
  p: '\uE520',
  m: '\uE521',
  f: '\uE522',
  r: '\uE523',
  s: '\uE524',
  z: '\uE525',
  n: '\uE526',
  mf: '\uE52D',
  mp: '\uE52C',
  ff: '\uE52F',
  pp: '\uE52B',
  fff: '\uE530',
  ppp: '\uE52A',
  sfz: '\uE539',
  fp: '\uE534',
  cresc: '\uE53E',
  decresc: '\uE53F',
  hairpin: '\uE540',

  // ── Ornaments ──
  trill: '\uE566',
  mordentUpper: '\uE56C',
  mordentLower: '\uE56D',
  turnSymbol: '\uE567',

  // ── Repeat & Structure ──
  repeatBarlineLeft: '\uE040',
  repeatBarlineRight: '\uE041',
  segno: '\uE047',
  coda: '\uE048',

  // ── Time Signatures ──
  commonTime: '\uE08A',
  cutTime: '\uE08B',

  // ── Additional Clefs ──
  altoClef: '\uE05C',
  tenorClef: '\uE05E',
  percussionClef: '\uE069',

  // ── Additional Articulations ──
  marcatoAbove: '\uE4AC',
  staccatissimoAbove: '\uE4A8',

  // ── Pedal markings (Bravura keyboard range) ──
  pedalPed: '\uE650',          // Ped. — sustain-pedal engage marking
  pedalUp: '\uE655',           // ✱   — sustain-pedal release marking
} as const

export type BravuraSymbol = keyof typeof B

// ── Articulation glyphs grouped by direction (above/below the staff) ───
// Re-export of the inline ARTIC_GLYPHS map that used to live in
// MusicalExample.tsx. The renderer picks above-vs-below per stem direction.
export const ARTIC_GLYPHS = {
  accent:        { above: '\uE4A0', below: '\uE4A1' },
  staccato:      { above: '\uE4A2', below: '\uE4A3' },
  tenuto:        { above: '\uE4A4', below: '\uE4A5' },
  staccatissimo: { above: '\uE4A6', below: '\uE4A7' },
  marcato:       { above: '\uE4AC', below: '\uE4AD' },
  fermata:       { above: '\uE4C0', below: '\uE4C1' },
} as const

// ── Ornament glyphs ───────────────────────────────────────────────────
// Common-practice ornaments. Glyphs sit ABOVE the notehead.
export const ORNAMENT_GLYPHS = {
  trill:           '\uE566',
  mordent:         '\uE56C',
  invertedMordent: '\uE56D',
  turn:            '\uE567',
} as const

// ── Dynamic-letter glyphs ─────────────────────────────────────────────
// Bravura supplies pre-composed combos (pp, mf, etc.) at distinct
// codepoints — they're NOT regular text rendered with Bravura. Use
// fontFamily=Bravura when rendering these.
export const DYNAMIC_GLYPHS = {
  pp:  '\uE52B',
  p:   '\uE520',
  mp:  '\uE52C',
  mf:  '\uE52D',
  f:   '\uE522',
  ff:  '\uE52F',
  sfz: '\uE539',
  fz:  '\uE535',
} as const

// ── Pedal-marking glyphs ──────────────────────────────────────────────
// Sustain-pedal engage / release glyphs. Sit BELOW the bass staff.
export const PEDAL_GLYPHS = {
  ped: '\uE650',
  pedRelease: '\uE655',
} as const

// ── Metronome-mark glyphs ─────────────────────────────────────────────
// SMuFL provides a dedicated range for inline metronome notation: note
// glyphs sized to align with surrounding text. The full musical note
// glyphs at U+E1D5+ are designed as standalone musical glyphs and are
// too tall to sit inline with text — these met-range variants are the
// correct choice for "♩ = 120" style markings.
export const METRONOME_GLYPHS = {
  half:            '\uECA0',  // metNoteHalfUp
  quarter:         '\uECA2',  // metNoteQuarterUp
  eighth:          '\uECA3',  // metNote8thUp
  sixteenth:       '\uECA5',  // metNote16thUp
  augmentationDot: '\uECB7',  // metAugmentationDot
} as const

