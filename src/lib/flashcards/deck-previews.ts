import { DeckPreview } from '../types'
import { B } from '../bravura'

/**
 * Deck tile content previews — shown in place of the deck description so tiles
 * read as visually differentiated at a glance.
 *
 * Kinds:
 * - 'text'     plain body font, for words/abbreviations/roman numerals
 * - 'glyphs'   SMuFL codepoints rendered in Bravura (dynamics, accidentals, notes)
 * - 'notation' inline SVG (staves + clefs + notes) — assigned in Phase 3
 *
 * Decks not present in this map fall back to the deck's `description` field.
 */
export const DECK_PREVIEWS: Record<string, DeckPreview> = {
  // ── TIER 1 — Notation & Terms ─────────────────────────────────────
  // tempo: canonical tempo markings across the speed range.
  tempo: { kind: 'text', content: 'Largo · Andante · Allegro · Presto' },

  // ── TIER 1 — Music symbols (glyph previews via Bravura) ───────────
  'symbols-dynamics': {
    kind: 'glyphs',
    codepoints: [B.pp, B.p, B.mf, B.f, B.ff],
    ariaLabel: 'Preview: pianissimo, piano, mezzo-forte, forte, fortissimo',
  },
  'symbols-articulation': {
    kind: 'glyphs',
    codepoints: [B.staccatoAbove, B.tenutoAbove, B.accentAbove, B.fermataAbove, B.staccatissimoAbove],
    ariaLabel: 'Preview: staccato, tenuto, accent, fermata, staccatissimo',
  },
  'symbols-accidentals': {
    kind: 'glyphs',
    codepoints: [B.sharp, B.flat, B.natural, B.doubleSharp, B.doubleFlat],
    ariaLabel: 'Preview: sharp, flat, natural, double sharp, double flat',
  },
  'symbols-note-values': {
    kind: 'glyphs',
    codepoints: [B.wholeNote, B.halfNoteUp, B.quarterNoteUp, B.eighthNoteUp],
    ariaLabel: 'Preview: whole note, half note, quarter note, eighth note',
  },
  'symbols-repeats': {
    kind: 'glyphs',
    codepoints: [B.repeatBarlineLeft, B.repeatBarlineRight, 'D.C.'],
    ariaLabel: 'Preview: begin repeat, end repeat, D.C.',
  },
  'symbols-clefs': {
    kind: 'glyphs',
    codepoints: [B.trebleClef, B.bassClef, B.altoClef],
    ariaLabel: 'Preview: treble clef, bass clef, alto clef',
  },

  // ── TIER 1 — Rhythm & Meter ───────────────────────────────────────
  'simple-meters':   { kind: 'text', content: '2/4    3/4    4/4' },
  'compound-meters': { kind: 'text', content: '6/8    9/8    12/8' },

  // ── TIER 2 — Pitch & Harmony (text previews) ──────────────────────
  'circle-of-fifths':      { kind: 'text', content: 'C → G → D → A → E →…' },
  modes:                   { kind: 'text', content: 'Ionian · Dorian · Phrygian …' },
  'other-scales':          { kind: 'text', content: 'Pentatonic · Blues · Whole tone' },
  'enharmonic-intervals':  { kind: 'text', content: 'F♯ = G♭' },

  // ── TIER 2 — Notation & Terms (terminology) ───────────────────────
  'tempo-terms-core':         { kind: 'text', content: 'Adagio · Andante · Allegro · Presto' },
  'tempo-terms-extended':     { kind: 'text', content: 'Larghetto · Sostenuto · Con moto …' },
  'character-terms-core':     { kind: 'text', content: 'dolce · cantabile · legato · staccato' },
  'character-terms-extended': { kind: 'text', content: 'scherzando · maestoso · appassionato …' },
  'tempo-modifications':      { kind: 'text', content: 'accel. · rit. · stringendo · morendo' },
  'modifying-words':          { kind: 'text', content: 'poco · molto · sempre · subito' },

  // ── TIER 3 — Music symbols (glyph + text) ─────────────────────────
  'symbols-ornaments': {
    kind: 'glyphs',
    codepoints: [B.trill, B.mordentUpper, B.mordentLower, B.turnSymbol],
    ariaLabel: 'Preview: trill, upper mordent, lower mordent, turn',
  },
  // TODO: verify preview — Ped. / ✱ glyphs aren't in bravura.ts yet; using
  // literal text as a pragmatic stand-in. Upgrade to glyph kind if the
  // SMuFL pedal codepoints (E650 / E655) are added to the font map.
  'pedal-markings': { kind: 'text', content: 'Ped.    ✱' },

  'piano-specific-symbols': { kind: 'text', content: 'm.d. · m.s. · 8va · loco' },

  // ── TIER 3 — Pitch & Harmony ──────────────────────────────────────
  'roman-numerals': { kind: 'text', content: 'I · IV · V⁷ · vi' },
  'figured-bass':   { kind: 'text', content: '6    6/4    6/5    4/2' },

  // ── TIER 3 — Form & Structure ─────────────────────────────────────
  'binary-ternary-forms': { kind: 'text', content: 'A  B   ·   A  B  A' },
  'sonata-form':          { kind: 'text', content: 'Exp. · Dev. · Recap.' },
  'fugal-terminology':    { kind: 'text', content: 'Subject · Answer · Countersubject' },
  'phrase-structure':     { kind: 'text', content: 'antecedent → consequent' },

  // ── TIER 3 — Notation & Terms (other languages) ───────────────────
  'german-directions': { kind: 'text', content: 'langsam · lebhaft · mit Ausdruck' },
  'french-directions': { kind: 'text', content: 'doux · vif · avec mouvement' },
}
