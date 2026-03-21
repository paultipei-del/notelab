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
  wholeRest: '\uE4F4',
  halfRest: '\uE4F5',
  quarterRest: '\uE4E5',
  eighthRest: '\uE4E6',
  sixteenthRest: '\uE4E7',

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
} as const

export type BravuraSymbol = keyof typeof B
