import { Card } from '../types'

const ROOTS = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4']

const INTERVALS: { name: string; abbrev: string; semitones: number; desc: string }[] = [
  { name: 'Minor 2nd', abbrev: 'm2', semitones: 1, desc: '1 half step — tense, dissonant' },
  { name: 'Major 2nd', abbrev: 'M2', semitones: 2, desc: '2 half steps — whole step' },
  { name: 'Minor 3rd', abbrev: 'm3', semitones: 3, desc: '3 half steps — dark, introspective' },
  { name: 'Major 3rd', abbrev: 'M3', semitones: 4, desc: '4 half steps — bright, stable' },
  { name: 'Perfect 4th', abbrev: 'P4', semitones: 5, desc: '5 half steps — open, stable' },
  { name: 'Tritone', abbrev: 'TT', semitones: 6, desc: '6 half steps — tense, unstable' },
  { name: 'Perfect 5th', abbrev: 'P5', semitones: 7, desc: '7 half steps — open, consonant' },
  { name: 'Minor 6th', abbrev: 'm6', semitones: 8, desc: '8 half steps — somewhat dark' },
  { name: 'Major 6th', abbrev: 'M6', semitones: 9, desc: '9 half steps — warm, open' },
  { name: 'Minor 7th', abbrev: 'm7', semitones: 10, desc: '10 half steps — bluesy, unresolved' },
  { name: 'Major 7th', abbrev: 'M7', semitones: 11, desc: '11 half steps — tense, wants to resolve' },
  { name: 'Octave', abbrev: 'P8', semitones: 12, desc: '12 half steps — same note, higher register' },
]

function addSemitones(note: string, semitones: number): string {
  const noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  const match = note.match(/^([A-G]#?)(\d)$/)
  if (!match) return note
  const [, name, octStr] = match
  const oct = parseInt(octStr)
  const idx = noteNames.indexOf(name)
  const newIdx = idx + semitones
  const newOct = oct + Math.floor(newIdx / 12)
  const newName = noteNames[((newIdx % 12) + 12) % 12]
  return `${newName}${newOct}`
}

function makeIntervalCards(): Card[] {
  const shuffledRoots = [...ROOTS].sort(() => Math.random() - 0.5)
  return INTERVALS.map((interval, i) => {
    const root = shuffledRoots[i % shuffledRoots.length]
    const top = addSemitones(root, interval.semitones)
    return {
      id: i + 1,
      type: 'audio' as const,
      front: 'interval',
      back: `${interval.name} (${interval.abbrev}) — ${interval.desc}`,
      audioNotes: [root, top],
      audioPattern: 'interval-ascending' as const,
      audioLabel: 'What interval is this?',
      audioHint: 'Ascending',
      symbolName: `${interval.name} — ${interval.abbrev}`,
    }
  })
}

export const EAR_TRAINING_INTERVALS: Card[] = makeIntervalCards()

// ── Intervals II — Compound intervals (9th through double octave) ──────────────

const COMPOUND_ROOTS = ['C3','D3','E3','F3','G3','A3','B3','C4']

const COMPOUND_INTERVALS: { name: string; abbrev: string; semitones: number; desc: string }[] = [
  { name: 'Minor 9th',    abbrev: 'm9',  semitones: 13, desc: '13 semitones — octave + minor 2nd' },
  { name: 'Major 9th',    abbrev: 'M9',  semitones: 14, desc: '14 semitones — octave + major 2nd' },
  { name: 'Minor 10th',   abbrev: 'm10', semitones: 15, desc: '15 semitones — octave + minor 3rd' },
  { name: 'Major 10th',   abbrev: 'M10', semitones: 16, desc: '16 semitones — octave + major 3rd' },
  { name: 'Perfect 11th', abbrev: 'P11', semitones: 17, desc: '17 semitones — octave + perfect 4th' },
  { name: 'Aug. 11th / Dim. 12th', abbrev: 'A11', semitones: 18, desc: '18 semitones — octave + tritone' },
  { name: 'Perfect 12th', abbrev: 'P12', semitones: 19, desc: '19 semitones — octave + perfect 5th' },
  { name: 'Minor 13th',   abbrev: 'm13', semitones: 20, desc: '20 semitones — octave + minor 6th' },
  { name: 'Major 13th',   abbrev: 'M13', semitones: 21, desc: '21 semitones — octave + major 6th' },
  { name: 'Minor 14th',   abbrev: 'm14', semitones: 22, desc: '22 semitones — octave + minor 7th' },
  { name: 'Major 14th',   abbrev: 'M14', semitones: 23, desc: '23 semitones — octave + major 7th' },
  { name: 'Double Octave',abbrev: 'P15', semitones: 24, desc: '24 semitones — two octaves' },
]

function makeCompoundIntervalCards(): Card[] {
  const shuffledRoots = [...COMPOUND_ROOTS].sort(() => Math.random() - 0.5)
  return COMPOUND_INTERVALS.map((interval, i) => {
    const root = shuffledRoots[i % shuffledRoots.length]
    const top = addSemitones(root, interval.semitones)
    return {
      id: i + 1,
      type: 'audio' as const,
      front: 'interval',
      back: `${interval.name} (${interval.abbrev}) — ${interval.desc}`,
      audioNotes: [root, top],
      audioPattern: 'interval-ascending' as const,
      audioLabel: 'What interval is this?',
      audioHint: 'Ascending — compound',
      symbolName: `${interval.name} — ${interval.abbrev}`,
    }
  })
}

export const EAR_TRAINING_INTERVALS_II: Card[] = makeCompoundIntervalCards()

// ── Intervals III — All intervals m2–P15, ascending AND descending, random roots ─

const ALL_INTERVALS = [...INTERVALS, ...COMPOUND_INTERVALS]
const ALL_ROOTS = ['C3','D3','E3','F3','G3','A3','C4']

function makeAdvancedIntervalCards(): Card[] {
  // Use a stable-ish root assignment so ascending and descending of the same
  // interval get different roots (more varied ear training).
  const rootsAsc  = [...ALL_ROOTS].sort(() => Math.random() - 0.5)
  const rootsDesc = [...ALL_ROOTS].sort(() => Math.random() - 0.5)
  const ascending: Card[] = ALL_INTERVALS.map((interval, i) => {
    const root = rootsAsc[i % rootsAsc.length]
    const top  = addSemitones(root, interval.semitones)
    return {
      id: i + 1,
      type: 'audio' as const,
      front: 'interval',
      back: `${interval.name} (${interval.abbrev}) — ${interval.desc}`,
      audioNotes: [root, top],
      audioPattern: 'interval-ascending' as const,
      audioLabel: 'What interval is this?',
      audioHint: 'Ascending',
      symbolName: `${interval.name} — ${interval.abbrev}`,
    }
  })
  const descending: Card[] = ALL_INTERVALS.map((interval, i) => {
    const root = rootsDesc[i % rootsDesc.length]
    const top  = addSemitones(root, interval.semitones)
    return {
      id: ALL_INTERVALS.length + i + 1,
      type: 'audio' as const,
      front: 'interval',
      back: `${interval.name} (${interval.abbrev}) — ${interval.desc}`,
      audioNotes: [root, top],
      audioPattern: 'interval-descending' as const,
      audioLabel: 'What interval is this?',
      audioHint: 'Descending',
      symbolName: `${interval.name} — ${interval.abbrev}`,
    }
  })
  return [...ascending, ...descending]
}

export const EAR_TRAINING_INTERVALS_III: Card[] = makeAdvancedIntervalCards()

export const EAR_TRAINING_TRIADS: Card[] = [
  { id: 1, type: 'audio', front: 'triad', back: 'Major triad — bright, stable', audioNotes: ['C4','E4','G4'], audioPattern: 'chord-cascade', audioLabel: 'What triad quality?', audioHint: 'Root position', symbolName: 'Major' },
  { id: 2, type: 'audio', front: 'triad', back: 'Minor triad — dark, somber', audioNotes: ['C4','Eb4','G4'], audioPattern: 'chord-cascade', audioLabel: 'What triad quality?', audioHint: 'Root position', symbolName: 'Minor' },
  { id: 3, type: 'audio', front: 'triad', back: 'Major triad — G major', audioNotes: ['G3','B3','D4'], audioPattern: 'chord-cascade', audioLabel: 'What triad quality?', audioHint: 'Root position', symbolName: 'Major' },
  { id: 4, type: 'audio', front: 'triad', back: 'Minor triad — a minor', audioNotes: ['A3','C4','E4'], audioPattern: 'chord-cascade', audioLabel: 'What triad quality?', audioHint: 'Root position', symbolName: 'Minor' },
  { id: 5, type: 'audio', front: 'triad', back: 'Major triad — F major', audioNotes: ['F3','A3','C4'], audioPattern: 'chord-cascade', audioLabel: 'What triad quality?', audioHint: 'Root position', symbolName: 'Major' },
  { id: 6, type: 'audio', front: 'triad', back: 'Minor triad — e minor', audioNotes: ['E3','G3','B3'], audioPattern: 'chord-cascade', audioLabel: 'What triad quality?', audioHint: 'Root position', symbolName: 'Minor' },
  { id: 7, type: 'audio', front: 'triad', back: 'Diminished triad — tense, unstable', audioNotes: ['B3','D4','F4'], audioPattern: 'chord-cascade', audioLabel: 'What triad quality?', audioHint: 'Root position', symbolName: 'Diminished' },
  { id: 8, type: 'audio', front: 'triad', back: 'Augmented triad — tense, expanded', audioNotes: ['C4','E4','Ab4'], audioPattern: 'chord-cascade', audioLabel: 'What triad quality?', audioHint: 'Root position', symbolName: 'Augmented' },
]

// ── Triads — Inversions (major and minor only) ─────────────────────────────────

export const EAR_TRAINING_TRIADS_INVERSIONS: Card[] = [
  // Major — 1st inversion (3rd in bass)
  { id: 1,  type: 'audio', front: 'triad', back: 'Major — 1st inversion — 3rd in bass', audioNotes: ['E4','G4','C5'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'C major', symbolName: 'Major — 1st inv.' },
  { id: 2,  type: 'audio', front: 'triad', back: 'Major — 1st inversion — 3rd in bass', audioNotes: ['B3','D4','G4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'G major', symbolName: 'Major — 1st inv.' },
  { id: 3,  type: 'audio', front: 'triad', back: 'Major — 1st inversion — 3rd in bass', audioNotes: ['A3','C4','F4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'F major', symbolName: 'Major — 1st inv.' },
  // Major — 2nd inversion (5th in bass)
  { id: 4,  type: 'audio', front: 'triad', back: 'Major — 2nd inversion — 5th in bass', audioNotes: ['G3','C4','E4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'C major', symbolName: 'Major — 2nd inv.' },
  { id: 5,  type: 'audio', front: 'triad', back: 'Major — 2nd inversion — 5th in bass', audioNotes: ['D4','G4','B4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'G major', symbolName: 'Major — 2nd inv.' },
  { id: 6,  type: 'audio', front: 'triad', back: 'Major — 2nd inversion — 5th in bass', audioNotes: ['C4','F4','A4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'F major', symbolName: 'Major — 2nd inv.' },
  // Minor — 1st inversion (3rd in bass)
  { id: 7,  type: 'audio', front: 'triad', back: 'Minor — 1st inversion — 3rd in bass', audioNotes: ['C4','E4','A4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'A minor', symbolName: 'Minor — 1st inv.' },
  { id: 8,  type: 'audio', front: 'triad', back: 'Minor — 1st inversion — 3rd in bass', audioNotes: ['G3','B3','E4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'E minor', symbolName: 'Minor — 1st inv.' },
  { id: 9,  type: 'audio', front: 'triad', back: 'Minor — 1st inversion — 3rd in bass', audioNotes: ['F3','A3','D4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'D minor', symbolName: 'Minor — 1st inv.' },
  // Minor — 2nd inversion (5th in bass)
  { id: 10, type: 'audio', front: 'triad', back: 'Minor — 2nd inversion — 5th in bass', audioNotes: ['E4','A4','C5'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'A minor', symbolName: 'Minor — 2nd inv.' },
  { id: 11, type: 'audio', front: 'triad', back: 'Minor — 2nd inversion — 5th in bass', audioNotes: ['B3','E4','G4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'E minor', symbolName: 'Minor — 2nd inv.' },
  { id: 12, type: 'audio', front: 'triad', back: 'Minor — 2nd inversion — 5th in bass', audioNotes: ['A3','D4','F4'], audioPattern: 'chord-cascade', audioLabel: 'What inversion?', audioHint: 'D minor', symbolName: 'Minor — 2nd inv.' },
]

// ── 7th Chords — Root position ─────────────────────────────────────────────────

export const EAR_TRAINING_SEVENTH_CHORDS: Card[] = [
  { id: 1, type: 'audio', front: 'chord', back: 'Minor 7th (m7) — minor triad + minor 7th — soft, bluesy', audioNotes: ['C4','Eb4','G4','Bb4'], audioPattern: 'chord-cascade', audioLabel: 'What 7th chord quality?', audioHint: 'Root position', symbolName: 'Minor 7th — m7' },
  { id: 2, type: 'audio', front: 'chord', back: 'Minor-major 7th (mM7) — minor triad + major 7th — tense, bittersweet', audioNotes: ['A3','C4','E4','G#4'], audioPattern: 'chord-cascade', audioLabel: 'What 7th chord quality?', audioHint: 'Root position', symbolName: 'Minor-major 7th — mM7' },
  { id: 3, type: 'audio', front: 'chord', back: 'Major 7th (maj7) — major triad + major 7th — lush, dreamy', audioNotes: ['F3','A3','C4','E4'], audioPattern: 'chord-cascade', audioLabel: 'What 7th chord quality?', audioHint: 'Root position', symbolName: 'Major 7th — maj7' },
  { id: 4, type: 'audio', front: 'chord', back: 'Dominant 7th (dom7) — major triad + minor 7th — tense, wants to resolve', audioNotes: ['G3','B3','D4','F4'], audioPattern: 'chord-cascade', audioLabel: 'What 7th chord quality?', audioHint: 'Root position', symbolName: 'Dominant 7th — dom7' },
  { id: 5, type: 'audio', front: 'chord', back: 'Half-diminished (ø7) — diminished triad + minor 7th — dark, unresolved', audioNotes: ['B3','D4','F4','A4'], audioPattern: 'chord-cascade', audioLabel: 'What 7th chord quality?', audioHint: 'Root position', symbolName: 'Half-diminished — ø7' },
  { id: 6, type: 'audio', front: 'chord', back: 'Fully diminished (°7) — diminished triad + diminished 7th — very tense, unstable', audioNotes: ['B3','D4','F4','Ab4'], audioPattern: 'chord-cascade', audioLabel: 'What 7th chord quality?', audioHint: 'Root position', symbolName: 'Fully diminished — °7' },
]

export const EAR_TRAINING_CADENCES: Card[] = [
  { id: 1, type: 'audio', front: 'cadence', back: 'Authentic cadence — V to I — strongest, most final', audioChords: [['G3','B3','D4','F4'],['C3','E4','G4']], audioPattern: 'cadence', audioLabel: 'What cadence type?', audioHint: 'C major', symbolName: 'Authentic' },
  { id: 2, type: 'audio', front: 'cadence', back: 'Half cadence — ends on V — sounds unfinished', audioChords: [['C3','E4','G4'],['G3','B3','D4','F4']], audioPattern: 'cadence', audioLabel: 'What cadence type?', audioHint: 'C major', symbolName: 'Half' },
  { id: 3, type: 'audio', front: 'cadence', back: 'Plagal cadence — IV to I — the Amen cadence', audioChords: [['F3','A3','C4'],['C3','E4','G4']], audioPattern: 'cadence', audioLabel: 'What cadence type?', audioHint: 'C major', symbolName: 'Plagal' },
  { id: 4, type: 'audio', front: 'cadence', back: 'Deceptive cadence — V to vi — unexpected resolution', audioChords: [['G3','B3','D4','F4'],['A3','C4','E4']], audioPattern: 'cadence', audioLabel: 'What cadence type?', audioHint: 'C major', symbolName: 'Deceptive' },
]

export const EAR_TRAINING_SCALES: Card[] = [
  { id: 1, type: 'audio', front: 'scale', back: 'Major scale — W W H W W W H — bright, stable', audioNotes: ['C4','D4','E4','F4','G4','A4','B4','C5'], audioPattern: 'scale', audioLabel: 'Which scale?', audioHint: 'Ascending', symbolName: 'Major' },
  { id: 2, type: 'audio', front: 'scale', back: 'Natural minor scale — W H W W H W W — darker', audioNotes: ['A3','B3','C4','D4','E4','F4','G4','A4'], audioPattern: 'scale', audioLabel: 'Which scale?', audioHint: 'Ascending', symbolName: 'Natural minor' },
  { id: 3, type: 'audio', front: 'scale', back: 'Harmonic minor — raised 7th — exotic, tense', audioNotes: ['A3','B3','C4','D4','E4','F4','Ab4','A4'], audioPattern: 'scale', audioLabel: 'Which scale?', audioHint: 'Ascending', symbolName: 'Harmonic minor' },
  { id: 4, type: 'audio', front: 'scale', back: 'Melodic minor (ascending) — raised 6th and 7th', audioNotes: ['A3','B3','C4','D4','E4','F#4','G#4','A4'], audioPattern: 'scale', audioLabel: 'Which scale?', audioHint: 'Ascending', symbolName: 'Melodic minor' },
]

export const EAR_TRAINING_TRIADS_BROWSE: Card[] = [
  { id: 1, type: 'audio', front: 'triad', back: 'Major — bright, stable. M3 + P5 above root', audioNotes: ['C4','E4','G4'], audioPattern: 'harmonic', audioLabel: 'Major', audioDuration: '2n', symbolName: 'Major' },
  { id: 2, type: 'audio', front: 'triad', back: 'Minor — dark, somber. m3 + P5 above root', audioNotes: ['C4','Eb4','G4'], audioPattern: 'harmonic', audioLabel: 'Minor', audioDuration: '2n', symbolName: 'Minor' },
  { id: 3, type: 'audio', front: 'triad', back: 'Diminished — tense, unstable. m3 + d5 above root', audioNotes: ['C4','Eb4','Gb4'], audioPattern: 'harmonic', audioLabel: 'Diminished', audioDuration: '2n', symbolName: 'Diminished' },
  { id: 4, type: 'audio', front: 'triad', back: 'Augmented — bright, tense. M3 + A5 above root', audioNotes: ['C4','E4','Ab4'], audioPattern: 'harmonic', audioLabel: 'Augmented', audioDuration: '2n', symbolName: 'Augmented' },
]
