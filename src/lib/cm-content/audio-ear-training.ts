import { Card } from '../types'

// All chromatic notes across two octaves (C3–C5 range for intervals)
const ROOTS = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4']

// Semitone offsets for each interval
const INTERVALS: Record<string, number> = {
  'Minor 2nd': 1,
  'Major 2nd': 2,
  'Minor 3rd': 3,
  'Major 3rd': 4,
  'Perfect 4th': 5,
  'Tritone': 6,
  'Perfect 5th': 7,
  'Minor 6th': 8,
  'Major 6th': 9,
  'Minor 7th': 10,
  'Major 7th': 11,
  'Octave': 12,
}

// Convert note + semitones to Tone.js note name
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

const INTERVAL_DESCRIPTIONS: Record<string, string> = {
  'Minor 2nd': '1 half step — tense, dissonant',
  'Major 2nd': '2 half steps — whole step',
  'Minor 3rd': '3 half steps — dark, introspective',
  'Major 3rd': '4 half steps — bright, stable',
  'Perfect 4th': '5 half steps — open, stable',
  'Tritone': '6 half steps — tense, unstable',
  'Perfect 5th': '7 half steps — open, consonant',
  'Minor 6th': '8 half steps — somewhat dark',
  'Major 6th': '9 half steps — warm, open',
  'Minor 7th': '10 half steps — bluesy, unresolved',
  'Major 7th': '11 half steps — tense, wants to resolve',
  'Octave': '12 half steps — same note, higher register',
}

// Generate cards with random roots — shuffle for variety
function makeIntervalCards(): Card[] {
  const entries = Object.entries(INTERVALS)
  // Shuffle roots assignment
  const shuffledRoots = [...ROOTS].sort(() => Math.random() - 0.5)

  return entries.map(([name, semitones], i) => {
    const root = shuffledRoots[i % shuffledRoots.length]
    const top = addSemitones(root, semitones)
    return {
      id: i + 1,
      type: 'audio' as const,
      front: 'interval',
      back: `${name} — ${INTERVAL_DESCRIPTIONS[name]}`,
      audioNotes: [root, top],
      audioPattern: 'ascending' as const,
      audioLabel: 'What interval is this?',
      audioHint: 'Ascending',
    }
  }).sort(() => Math.random() - 0.5)
}

export const EAR_TRAINING_INTERVALS: Card[] = makeIntervalCards()

export const EAR_TRAINING_TRIADS: Card[] = [
  { id: 1, type: 'audio', front: 'triad', back: 'Major triad — bright, stable — major 3rd on bottom, minor 3rd on top', audioNotes: ['C4', 'E4', 'G4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position triad', audioDuration: '2n' },
  { id: 2, type: 'audio', front: 'triad', back: 'Minor triad — dark, somber — minor 3rd on bottom, major 3rd on top', audioNotes: ['C4', 'Eb4', 'G4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position triad', audioDuration: '2n' },
  { id: 3, type: 'audio', front: 'triad', back: 'Major triad — G major', audioNotes: ['G3', 'B3', 'D4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position triad', audioDuration: '2n' },
  { id: 4, type: 'audio', front: 'triad', back: 'Minor triad — a minor', audioNotes: ['A3', 'C4', 'E4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position triad', audioDuration: '2n' },
  { id: 5, type: 'audio', front: 'triad', back: 'Major triad — F major', audioNotes: ['F3', 'A3', 'C4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position triad', audioDuration: '2n' },
  { id: 6, type: 'audio', front: 'triad', back: 'Minor triad — e minor', audioNotes: ['E3', 'G3', 'B3'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position triad', audioDuration: '2n' },
  { id: 7, type: 'audio', front: 'triad', back: 'Diminished triad — tense, unstable — two minor 3rds', audioNotes: ['B3', 'D4', 'F4'], audioPattern: 'harmonic', audioLabel: 'What triad quality?', audioHint: 'Root position triad', audioDuration: '2n' },
  { id: 8, type: 'audio', front: 'triad', back: 'Augmented triad — tense, expanded — two major 3rds', audioNotes: ['C4', 'E4', 'Ab4'], audioPattern: 'harmonic', audioLabel: 'What triad quality?', audioHint: 'Root position triad', audioDuration: '2n' },
]

export const EAR_TRAINING_CADENCES: Card[] = [
  {
    id: 1, type: 'audio', front: 'cadence',
    back: 'Authentic cadence — V to I — the strongest, most final cadence',
    audioChords: [['G3','B3','D4','F4'], ['C3','E4','G4']],
    audioPattern: 'cadence',
    audioLabel: 'What cadence type?',
    audioHint: 'C major',
  },
  {
    id: 2, type: 'audio', front: 'cadence',
    back: 'Half cadence — ends on V — sounds unfinished, like a question',
    audioChords: [['C3','E4','G4'], ['G3','B3','D4','F4']],
    audioPattern: 'cadence',
    audioLabel: 'What cadence type?',
    audioHint: 'C major',
  },
  {
    id: 3, type: 'audio', front: 'cadence',
    back: 'Plagal cadence — IV to I — the "Amen" cadence, softer feeling of rest',
    audioChords: [['F3','A3','C4'], ['C3','E4','G4']],
    audioPattern: 'cadence',
    audioLabel: 'What cadence type?',
    audioHint: 'C major',
  },
  {
    id: 4, type: 'audio', front: 'cadence',
    back: 'Deceptive cadence — V to vi — unexpected resolution, creates surprise',
    audioChords: [['G3','B3','D4','F4'], ['A3','C4','E4']],
    audioPattern: 'cadence',
    audioLabel: 'What cadence type?',
    audioHint: 'C major',
  },
]

export const EAR_TRAINING_SCALES: Card[] = [
  { id: 1, type: 'audio', front: 'scale', back: 'Major scale — W W H W W W H — bright, stable sound', audioNotes: ['C4','D4','E4','F4','G4','A4','B4','C5'], audioPattern: 'scale', audioLabel: 'Which scale?', audioHint: 'Ascending' },
  { id: 2, type: 'audio', front: 'scale', back: 'Natural minor scale — W H W W H W W — darker sound', audioNotes: ['A3','B3','C4','D4','E4','F4','G4','A4'], audioPattern: 'scale', audioLabel: 'Which scale?', audioHint: 'Ascending' },
  { id: 3, type: 'audio', front: 'scale', back: 'Harmonic minor scale — raised 7th — exotic, tense sound', audioNotes: ['A3','B3','C4','D4','E4','F4','Ab4','A4'], audioPattern: 'scale', audioLabel: 'Which scale?', audioHint: 'Ascending' },
  { id: 4, type: 'audio', front: 'scale', back: 'Melodic minor scale (ascending) — raised 6th and 7th', audioNotes: ['A3','B3','C4','D4','E4','F#4','G#4','A4'], audioPattern: 'scale', audioLabel: 'Which scale?', audioHint: 'Ascending' },
]
