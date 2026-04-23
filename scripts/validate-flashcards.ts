/**
 * Flashcards expansion validation — walks every deck in DECKS and asserts:
 * - Backfilled decks have tier + tierOrder + category set
 * - Every card has id, front, back, type
 * - No duplicate card ids within a deck
 * - Every tag (deck + card) uses an allowed namespace
 * - No user-facing CM / exam framing in new decks' copy (spec §0.5)
 *
 * Run: npx tsx scripts/validate-flashcards.ts
 */

import { DECKS } from '../src/lib/decks'
import type { Deck } from '../src/lib/types'

// Allowed tag namespaces per spec §2.2 (no level:, no tier:).
const ALLOWED_NAMESPACES = new Set(['era', 'topic', 'type', 'lang'])

// Decks that must have tier + tierOrder + category set (§2.3 + all new).
// Anything else is out of scope and left untagged.
const TIERED_PREFIXES_OR_IDS = [
  'tempo', 'intervals',
  'symbols-dynamics', 'symbols-articulation', 'symbols-accidentals',
  'symbols-note-values', 'symbols-repeats', 'symbols-clefs', 'symbols-ornaments',
  'major-key-signatures', 'minor-key-signatures', 'circle-of-fifths',
  'major-scale-construction', 'minor-scales', 'modes', 'other-scales',
  'interval-inversions', 'enharmonic-intervals', 'compound-intervals',
  'triad-qualities', 'triad-inversions', 'seventh-chord-qualities', 'seventh-chord-inversions',
  'staff-anatomy', 'treble-clef-notes', 'bass-clef-notes', 'middle-c-across-clefs',
  'dotted-and-tied-notes', 'simple-meters', 'compound-meters', 'tuplets',
  'tempo-terms-core', 'tempo-terms-extended', 'character-terms-core',
  'character-terms-extended', 'tempo-modifications', 'modifying-words',
  'baroque-ornament-execution', 'classical-romantic-ornament-execution',
  'roman-numerals', 'figured-bass', 'non-chord-tones', 'cadences',
  'binary-ternary-forms', 'sonata-form', 'fugal-terminology', 'phrase-structure',
  'german-directions', 'french-directions',
  'pedal-markings', 'fingering-conventions', 'piano-specific-symbols',
]

// Spec §0.5 — new user-facing copy must not reference CM or exam framing.
// Existing CM-tagged decks (cm-prep, cm-level1, etc.) are exempt because that's
// deliberate product framing.
const CM_FRAMING_PATTERNS = [
  /\bcertificate of merit\b/i,
  /\bexam\b/i,
  /\bexam prep\b/i,
  /\bsyllabus\b/i,
  /\bCM\s*level\b/i,
  /\bcm-\d/i,
]

type Problem = { deckId: string; where: string; msg: string }
const problems: Problem[] = []
const report = (deckId: string, where: string, msg: string) =>
  problems.push({ deckId, where, msg })

function validateTag(tag: string): string | null {
  const colon = tag.indexOf(':')
  if (colon < 0) return `missing namespace`
  const ns = tag.slice(0, colon)
  if (!ALLOWED_NAMESPACES.has(ns)) return `namespace "${ns}" not allowed`
  return null
}

function isTiered(deck: Deck): boolean {
  return TIERED_PREFIXES_OR_IDS.includes(deck.id)
}

function checkCmFraming(deck: Deck) {
  // Only check decks with `tag !== 'cm'` (new/expansion decks) —
  // existing CM-tagged decks are allowed to reference CM.
  if (deck.tag === 'cm') return
  const texts: string[] = [deck.title, deck.description]
  for (const c of deck.cards) {
    if (typeof c.front === 'string') texts.push(c.front)
    if (typeof c.back === 'string') texts.push(c.back)
    if (typeof c.symbolName === 'string') texts.push(c.symbolName)
  }
  for (const t of texts) {
    for (const pat of CM_FRAMING_PATTERNS) {
      if (pat.test(t)) {
        report(deck.id, 'cm-framing', `matches ${pat} in "${t.slice(0, 80)}"`)
      }
    }
  }
}

for (const deck of DECKS) {
  // Tier / tierOrder / category checks for in-scope decks only.
  if (isTiered(deck)) {
    if (!deck.tier) report(deck.id, 'deck', 'missing tier')
    if (deck.tierOrder === undefined) report(deck.id, 'deck', 'missing tierOrder')
    if (!deck.category) report(deck.id, 'deck', 'missing category')
  }

  // Deck-level tag sanity — must be array of strings with allowed namespaces.
  if (deck.tags) {
    for (const tag of deck.tags) {
      const err = validateTag(tag)
      if (err) report(deck.id, `deck.tags`, `${tag}: ${err}`)
    }
  } else if (isTiered(deck)) {
    report(deck.id, 'deck', 'missing tags')
  }

  // Card-level checks.
  const seenIds = new Set<number>()
  for (const card of deck.cards) {
    if (card.id === undefined || card.id === null) {
      report(deck.id, 'card', 'missing id')
    } else if (seenIds.has(card.id)) {
      report(deck.id, `card#${card.id}`, 'duplicate card id')
    } else {
      seenIds.add(card.id)
    }
    if (!card.front || typeof card.front !== 'string') {
      report(deck.id, `card#${card.id}`, `missing/invalid front`)
    }
    if (!card.back || typeof card.back !== 'string') {
      report(deck.id, `card#${card.id}`, `missing/invalid back`)
    }
    if (!card.type) {
      report(deck.id, `card#${card.id}`, `missing type`)
    }
    // Card-level tag validation, if any.
    if (card.tags) {
      for (const tag of card.tags) {
        const err = validateTag(tag)
        if (err) report(deck.id, `card#${card.id}.tags`, `${tag}: ${err}`)
      }
    }
  }

  checkCmFraming(deck)
}

// Summary.
const total = DECKS.length
const tiered = DECKS.filter(isTiered).length
const totalCards = DECKS.reduce((n, d) => n + d.cards.length, 0)

console.log(`Decks: ${total} total, ${tiered} in /flashcards scope`)
console.log(`Cards: ${totalCards} total`)
console.log(``)

if (problems.length === 0) {
  console.log(`✓ All checks passed`)
  process.exit(0)
}

console.log(`✗ ${problems.length} problem(s):`)
for (const p of problems) {
  console.log(`  - [${p.deckId}] ${p.where}: ${p.msg}`)
}
process.exit(1)
