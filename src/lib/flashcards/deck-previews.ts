import { DeckPreview } from '../types'

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

  // ── TIER 1 — Music symbols ────────────────────────────────────────
  'symbols-dynamics':    { kind: 'text', content: 'p · f · mf · ff · pp' },
  'symbols-articulation': { kind: 'text', content: 'staccato · tenuto · accent · fermata' },
  'symbols-accidentals': { kind: 'text', content: 'sharp · flat · natural · double sharp' },
  'symbols-note-values': { kind: 'text', content: 'whole · half · quarter · eighth' },
  'symbols-repeats':     { kind: 'text', content: 'D.C. · D.S. · Coda · Fine' },
  'symbols-clefs':       { kind: 'text', content: 'treble · bass · alto · tenor' },

  // ── TIER 1 — Rhythm & Meter ───────────────────────────────────────
  'simple-meters':   { kind: 'text', content: '2/4    3/4    4/4' },
  'compound-meters': { kind: 'text', content: '6/8    9/8    12/8' },
  'rhythm-patterns': { kind: 'text', content: 'syncopation · hemiola · swing' },

  // ── TIER 2 — Pitch & Harmony (text previews) ──────────────────────
  'circle-of-fifths':      { kind: 'text', content: 'C → G → D → A → E →…' },
  modes:                   { kind: 'text', content: 'Ionian · Dorian · Phrygian …' },
  'other-scales':          { kind: 'text', content: 'Pentatonic · Blues · Whole tone' },
  'enharmonic-intervals':  { kind: 'text', content: 'F♯ = G♭' },
  'solfege-and-scale-degrees':    { kind: 'text', content: 'do · re · mi · tonic · dominant' },
  'interval-song-associations':   { kind: 'text', content: "'Here Comes the Bride' · P4 ascending" },

  // ── TIER 2 — Notation & Terms (terminology) ───────────────────────
  'tempo-terms-core':         { kind: 'text', content: 'Adagio · Andante · Allegro · Presto' },
  'tempo-terms-extended':     { kind: 'text', content: 'Larghetto · Sostenuto · Con moto …' },
  'character-terms-core':     { kind: 'text', content: 'dolce · cantabile · legato · staccato' },
  'character-terms-extended': { kind: 'text', content: 'scherzando · maestoso · appassionato …' },
  'tempo-modifications':      { kind: 'text', content: 'accel. · rit. · stringendo · morendo' },
  'modifying-words':          { kind: 'text', content: 'poco · molto · sempre · subito' },

  // ── TIER 3 — Music symbols ────────────────────────────────────────
  'symbols-ornaments': { kind: 'text', content: 'trill · mordent · turn · grace note' },
  'pedal-markings':    { kind: 'text', content: 'Ped.    ✱' },

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
  'transposing-instruments': { kind: 'text', content: 'B♭ · F · E♭ transpositions' },

  // ── TIER 4 — Application & Review ────────────────────────────────
  'identify-and-explain':      { kind: 'text', content: 'key · cadence · form in one question' },
  'build-and-transform':       { kind: 'text', content: 'build a scale, transpose, invert' },
  'score-reading-quickfire':   { kind: 'text', content: "clef · key · dynamic · what's happening" },
  'ear-to-paper':              { kind: 'text', content: 'hear it · identify it · write it' },
}
