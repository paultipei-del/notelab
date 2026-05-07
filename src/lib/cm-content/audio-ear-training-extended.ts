import { Card } from '../types'

// ── Tonicization helpers ────────────────────────────────────────────────────
// All Solfège / Pitch-in-Context cards use C major. The tonic chord is played
// before the test note to establish key context. Two tonicization patterns
// give variety: ascending (C-E-G-C) and descending (G-E-C).

const TONIC_ASC: string[] = ['C4', 'E4', 'G4', 'C5']
const TONIC_DESC: string[] = ['G4', 'E4', 'C4']

// ── Solfège I — Scale Degrees (14 cards) ────────────────────────────────────
// Cards 1-7: ascending tonicization, all 7 diatonic notes in C major.
// Cards 8-14: descending tonicization, same 7 notes — listening variety.
// Multiple-choice answer: solfège syllable + degree number, e.g. "do (1)".

const SOLFEGE_NAMES: { syllable: string; deg: number; pitch: string }[] = [
  { syllable: 'do',  deg: 1, pitch: 'C4' },
  { syllable: 're',  deg: 2, pitch: 'D4' },
  { syllable: 'mi',  deg: 3, pitch: 'E4' },
  { syllable: 'fa',  deg: 4, pitch: 'F4' },
  { syllable: 'sol', deg: 5, pitch: 'G4' },
  { syllable: 'la',  deg: 6, pitch: 'A4' },
  { syllable: 'ti',  deg: 7, pitch: 'B4' },
]

export const EAR_TRAINING_SOLFEGE_I: Card[] = [
  ...SOLFEGE_NAMES.map((s, i): Card => ({
    id: i + 1,
    type: 'audio',
    front: 'scale degree',
    back: `${s.syllable} (${s.deg}) — ${describeDegree(s.deg)}`,
    audioNotes: [s.pitch],
    audioChords: [TONIC_ASC],
    audioPattern: 'tonicized-note',
    audioLabel: 'What scale degree is this?',
    audioHint: 'In C major',
    symbolName: `${s.syllable} (${s.deg})`,
  })),
  ...SOLFEGE_NAMES.map((s, i): Card => ({
    id: i + 8,
    type: 'audio',
    front: 'scale degree',
    back: `${s.syllable} (${s.deg}) — ${describeDegree(s.deg)}`,
    audioNotes: [s.pitch],
    audioChords: [TONIC_DESC],
    audioPattern: 'tonicized-note',
    audioLabel: 'What scale degree is this?',
    audioHint: 'In C major — descending tonicization',
    symbolName: `${s.syllable} (${s.deg})`,
  })),
]

function describeDegree(deg: number): string {
  switch (deg) {
    case 1: return 'tonic — home, the resting tone'
    case 2: return 'supertonic — one step above home'
    case 3: return 'mediant — defines major or minor'
    case 4: return 'subdominant — pull back to home'
    case 5: return 'dominant — strongest tension toward home'
    case 6: return 'submediant — relative-minor color'
    case 7: return 'leading tone — pulls upward to tonic'
    default: return ''
  }
}

// ── Solfège II — Tonic Triads (8 cards) ────────────────────────────────────
// Hear an ascending arpeggio of a diatonic triad rooted on each scale degree.
// Card 8 is "1 (do, octave higher)" — return-to-tonic up an octave.
// Multiple-choice answer: scale-degree number with syllable.

const TRIADS: { degree: number; label: string; quality: string; arp: string[] }[] = [
  { degree: 1, label: '1 (do)',                quality: 'C major',     arp: ['C4', 'E4', 'G4'] },
  { degree: 2, label: '2 (re)',                quality: 'D minor',     arp: ['D4', 'F4', 'A4'] },
  { degree: 3, label: '3 (mi)',                quality: 'E minor',     arp: ['E4', 'G4', 'B4'] },
  { degree: 4, label: '4 (fa)',                quality: 'F major',     arp: ['F4', 'A4', 'C5'] },
  { degree: 5, label: '5 (sol)',               quality: 'G major',     arp: ['G4', 'B4', 'D5'] },
  { degree: 6, label: '6 (la)',                quality: 'A minor',     arp: ['A4', 'C5', 'E5'] },
  { degree: 7, label: '7 (ti)',                quality: 'B diminished', arp: ['B4', 'D5', 'F5'] },
  { degree: 1, label: '1 (do, higher octave)', quality: 'C major (8va)', arp: ['C5', 'E5', 'G5'] },
]

export const EAR_TRAINING_SOLFEGE_II: Card[] = TRIADS.map((t, i): Card => ({
  id: i + 1,
  type: 'audio',
  front: 'tonic triad',
  back: `${t.label} — ${t.quality} triad`,
  audioNotes: t.arp,
  audioChords: [TONIC_ASC],
  audioPattern: 'tonicized-arpeggio',
  audioLabel: 'Which scale degree is this triad rooted on?',
  audioHint: 'In C major',
  symbolName: t.label,
}))

// ── Pitch in Context I — Diatonic (7 cards) ────────────────────────────────
// Like Solfège I but answer is the scale-degree NUMBER only.
// Test-note ordering randomized for freshness vs. Solfège I.

const PITCH_I_ORDER: { num: number; pitch: string }[] = [
  { num: 5, pitch: 'G4' },
  { num: 1, pitch: 'C4' },
  { num: 4, pitch: 'F4' },
  { num: 3, pitch: 'E4' },
  { num: 6, pitch: 'A4' },
  { num: 2, pitch: 'D4' },
  { num: 7, pitch: 'B4' },
]

export const EAR_TRAINING_PITCH_IN_CONTEXT_I: Card[] = PITCH_I_ORDER.map((p, i): Card => ({
  id: i + 1,
  type: 'audio',
  front: 'scale degree',
  back: `${p.num} — ${describeDegree(p.num)}`,
  audioNotes: [p.pitch],
  audioChords: [TONIC_ASC],
  audioPattern: 'tonicized-note',
  audioLabel: 'Which scale degree?',
  audioHint: 'In C major',
  symbolName: String(p.num),
}))

// ── Pitch in Context II — Chromatic (12 cards) ─────────────────────────────
// Mix of diatonic and chromatic notes. Multiple-choice options use the full
// chromatic syllable set so distractors come from this same deck.
// Note: Card.symbolName is the correct answer string. Pool of 12 unique
// answers gives plenty of distractor variety.

const PITCH_II_CARDS: { pitch: string; label: string; desc: string }[] = [
  { pitch: 'C4',  label: '1 (do)',   desc: 'tonic — diatonic 1' },
  { pitch: 'C#4', label: '♯1 (di)',  desc: 'chromatic between 1 and 2 — pulls upward to re' },
  { pitch: 'Eb4', label: '♭3 (me)',  desc: 'lowered 3rd — minor color' },
  { pitch: 'F4',  label: '4 (fa)',   desc: 'subdominant — diatonic 4' },
  { pitch: 'F#4', label: '♯4 (fi)',  desc: 'chromatic raised 4 — pulls upward to sol' },
  { pitch: 'G4',  label: '5 (sol)',  desc: 'dominant — diatonic 5' },
  { pitch: 'Ab4', label: '♭6 (le)',  desc: 'lowered 6 — minor / dark color' },
  { pitch: 'A4',  label: '6 (la)',   desc: 'submediant — diatonic 6' },
  { pitch: 'Bb4', label: '♭7 (te)',  desc: 'lowered 7 — bluesy, minor-mixture' },
  { pitch: 'B4',  label: '7 (ti)',   desc: 'leading tone — diatonic 7' },
  { pitch: 'D4',  label: '2 (re)',   desc: 'supertonic — diatonic 2' },
  { pitch: 'E4',  label: '3 (mi)',   desc: 'mediant — diatonic 3' },
]

export const EAR_TRAINING_PITCH_IN_CONTEXT_II: Card[] = PITCH_II_CARDS.map((c, i): Card => ({
  id: i + 1,
  type: 'audio',
  front: 'scale degree',
  back: `${c.label} — ${c.desc}`,
  audioNotes: [c.pitch],
  audioChords: [TONIC_ASC],
  audioPattern: 'tonicized-note',
  audioLabel: 'Which scale degree? (Including chromatic)',
  audioHint: 'In C major',
  symbolName: c.label,
}))

// ── Melodic Patterns (12 cards) ────────────────────────────────────────────
// 3-5 note melodic fragment in C major after tonicization. MC options are
// short labels like "do-re-mi" — distractors come from other cards in the
// same deck (so each card needs unique labels for distractor variety).

const MELODIC_PATTERNS: { name: string; pitches: string[] }[] = [
  { name: 'do-re-mi (stepwise up)',          pitches: ['C4', 'D4', 'E4'] },
  { name: 'do-mi-sol (arpeggio up)',         pitches: ['C4', 'E4', 'G4'] },
  { name: 'sol-mi-do (arpeggio down)',       pitches: ['G4', 'E4', 'C4'] },
  { name: 'do-re-mi-fa-sol (5-note up)',     pitches: ['C4', 'D4', 'E4', 'F4', 'G4'] },
  { name: 'sol-fa-mi-re-do (5-note down)',   pitches: ['G4', 'F4', 'E4', 'D4', 'C4'] },
  { name: 'do-mi-do-mi-do (alternating)',    pitches: ['C4', 'E4', 'C4', 'E4', 'C4'] },
  { name: 'do-sol-mi-do (leap then descend)', pitches: ['C4', 'G4', 'E4', 'C4'] },
  { name: 'do-re-mi-do (return to tonic)',   pitches: ['C4', 'D4', 'E4', 'C4'] },
  { name: 'la-sol-mi-do (mixed descent)',    pitches: ['A4', 'G4', 'E4', 'C4'] },
  { name: 'do-fa-mi-re-do (with subdominant)', pitches: ['C4', 'F4', 'E4', 'D4', 'C4'] },
  { name: 'sol-do-mi-do (rising-turning)',   pitches: ['G4', 'C5', 'E5', 'C5'] },
  { name: 'do-re-mi-fa-sol-fa-mi-re-do (arch)', pitches: ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4'] },
]

export const EAR_TRAINING_MELODIC_PATTERNS: Card[] = MELODIC_PATTERNS.map((p, i): Card => ({
  id: i + 1,
  type: 'audio',
  front: 'melodic pattern',
  back: `${p.name} — ${p.pitches.length} notes in C major`,
  audioNotes: p.pitches,
  audioChords: [TONIC_ASC],
  audioPattern: 'tonicized-pattern',
  audioLabel: 'Which melodic pattern is this?',
  audioHint: 'In C major',
  symbolName: p.name,
}))

// ── Rhythm Patterns (12 cards) ─────────────────────────────────────────────
// Sequence of durations played on a fixed pitch (D4) at quarter = 92.
// MC label uses musical glyphs as a compact visual ("♩ ♩ ♩ ♩").
// Glyph map: ♩=quarter, ♪=eighth, 𝅗𝅥=half, 𝅗𝅥•=dotted half, ♩•=dotted quarter,
// 𝆺=quarter rest. Two-bar patterns separated by " | ".

const RHYTHM_PATTERNS: { label: string; beats: number[] }[] = [
  { label: '♩ ♩ ♩ ♩',                         beats: [1, 1, 1, 1] },
  { label: '♩ ♪♪ ♩ ♩',                        beats: [1, 0.5, 0.5, 1, 1] },
  { label: '♩ ♩ ♪♪ 𝅗𝅥',                       beats: [1, 1, 0.5, 0.5, 2] },
  { label: '♪♪♪♪ ♩ ♩',                        beats: [0.5, 0.5, 0.5, 0.5, 1, 1] },
  { label: '♩• ♪ ♩ ♩',                        beats: [1.5, 0.5, 1, 1] },
  { label: '♩ 𝆺 ♪♪ ♩',                       beats: [1, -1, 0.5, 0.5, 1] },
  { label: '♪♪♪♪ ♪♪♪♪',                     beats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { label: '𝅗𝅥 ♩ ♩',                          beats: [2, 1, 1] },
  { label: '♩ ♪♪ ♩• ♪',                      beats: [1, 0.5, 0.5, 1.5, 0.5] },
  { label: '♩ ♩ ♩ ♩  |  𝅗𝅥 𝅗𝅥',                beats: [1, 1, 1, 1, 2, 2] },
  { label: '♩ ♪♪ ♩ ♩  |  ♩ ♪♪ 𝅗𝅥',           beats: [1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 2] },
  { label: '♩• ♪ ♩• ♪  |  𝅗𝅥 𝅗𝅥',            beats: [1.5, 0.5, 1.5, 0.5, 2, 2] },
]

// Negative beats represent rests (no note played, but cursor advances).
// Encode as ABS value with a flag — simpler: rhythm-pattern handler in
// AudioCard treats `b > 0` as note, `b <= 0` as rest of length |b|.

export const EAR_TRAINING_RHYTHM_PATTERNS: Card[] = RHYTHM_PATTERNS.map((r, i): Card => ({
  id: i + 1,
  type: 'audio',
  front: 'rhythm pattern',
  back: `${r.label} — ${countBeats(r.beats)} beats total`,
  audioRhythm: r.beats,  // negative = rest of |b| beats
  audioPitch: 'D4',
  audioBpm: 92,
  audioPattern: 'rhythm-pattern',
  audioLabel: 'Which rhythm pattern is this?',
  audioHint: '4/4 — quarter = 92',
  symbolName: r.label,
}))

function countBeats(beats: number[]): number {
  return beats.reduce((a, b) => a + Math.abs(b), 0)
}
