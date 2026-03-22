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
      audioPattern: 'ascending' as const,
      audioLabel: 'What interval is this?',
      audioHint: 'Ascending',
      symbolName: `${interval.name} — ${interval.abbrev}`,
    }
  }) // No shuffle here — browse shows in order; useStudySession shuffles for study
}

export const EAR_TRAINING_INTERVALS: Card[] = makeIntervalCards()

export const EAR_TRAINING_TRIADS: Card[] = [
  { id: 1, type: 'audio', front: 'triad', back: 'Major triad — bright, stable', audioNotes: ['C4','E4','G4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position', audioDuration: '2n', symbolName: 'Major' },
  { id: 2, type: 'audio', front: 'triad', back: 'Minor triad — dark, somber', audioNotes: ['C4','Eb4','G4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position', audioDuration: '2n', symbolName: 'Minor' },
  { id: 3, type: 'audio', front: 'triad', back: 'Major triad — G major', audioNotes: ['G3','B3','D4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position', audioDuration: '2n', symbolName: 'Major' },
  { id: 4, type: 'audio', front: 'triad', back: 'Minor triad — a minor', audioNotes: ['A3','C4','E4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position', audioDuration: '2n', symbolName: 'Minor' },
  { id: 5, type: 'audio', front: 'triad', back: 'Major triad — F major', audioNotes: ['F3','A3','C4'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position', audioDuration: '2n', symbolName: 'Major' },
  { id: 6, type: 'audio', front: 'triad', back: 'Minor triad — e minor', audioNotes: ['E3','G3','B3'], audioPattern: 'harmonic', audioLabel: 'Major or minor?', audioHint: 'Root position', audioDuration: '2n', symbolName: 'Minor' },
  { id: 7, type: 'audio', front: 'triad', back: 'Diminished triad — tense, unstable', audioNotes: ['B3','D4','F4'], audioPattern: 'harmonic', audioLabel: 'What triad quality?', audioHint: 'Root position', audioDuration: '2n', symbolName: 'Diminished' },
  { id: 8, type: 'audio', front: 'triad', back: 'Augmented triad — tense, expanded', audioNotes: ['C4','E4','Ab4'], audioPattern: 'harmonic', audioLabel: 'What triad quality?', audioHint: 'Root position', audioDuration: '2n', symbolName: 'Augmented' },
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
