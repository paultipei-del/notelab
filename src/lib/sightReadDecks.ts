import { Deck } from './types'

function n(id: number, note: string, clef: 'treble' | 'bass', back: string) {
  return { id, type: 'staff' as const, front: note, back, note, clef }
}

const TREBLE_NOTES: Record<string, string> = {
  'A3': 'Below the staff — ledger line space',
  'B3': 'Below the staff — ledger line',
  'C4': 'Middle C — ledger line below treble staff',
  'D4': 'Just above middle C',
  'E4': 'First line of treble staff',
  'F4': 'First space of treble staff',
  'G4': 'Second line of treble staff',
  'A4': 'Second space of treble staff',
  'B4': 'Third line of treble staff',
  'C5': 'Third space of treble staff',
  'D5': 'Fourth line of treble staff',
  'E5': 'Fourth space of treble staff',
  'F5': 'Fifth line of treble staff',
  'G5': 'First space above the staff',
  'A5': 'First ledger line above the staff',
  'B5': 'Above first ledger line',
  'C6': 'Second ledger line above the staff',
}

const BASS_NOTES: Record<string, string> = {
  'E2': 'Below bass staff — ledger line',
  'F2': 'Below bass staff — first space',
  'G2': 'First line of bass staff',
  'A2': 'First space of bass staff',
  'B2': 'Second line of bass staff',
  'C3': 'Second space of bass staff',
  'D3': 'Third line of bass staff',
  'E3': 'Third space of bass staff',
  'F3': 'Fourth line of bass staff',
  'G3': 'Fourth space of bass staff',
  'A3': 'Fifth line of bass staff',
  'B3': 'First space above bass staff',
  'C4': 'Middle C — ledger line above bass staff',
  'D4': 'Above middle C ledger line',
  'E4': 'Two ledger lines above bass staff',
}

function trebleCards(notes: string[], idOffset = 0) {
  return notes.map((note, i) => n(idOffset + i + 1, note, 'treble', TREBLE_NOTES[note] ?? note))
}

function bassCards(notes: string[], idOffset = 0) {
  return notes.map((note, i) => n(idOffset + i + 1, note, 'bass', BASS_NOTES[note] ?? note))
}

const FREE_TREBLE = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5']
const FREE_BASS   = ['G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4']

const L1 = ['C4','G4']
const L2 = ['C4','D4','E4','F4','G4']
const L3 = ['C4','D4','E4','F4','G4','A4','B4','C5']
const L4 = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5']
const L5 = ['A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6']
const L10 = ['F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6','D6','E6']

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function repeatCards(cards: ReturnType<typeof trebleCards>, times: number, maxConsecutive = 1) {
  // Build pool
  const pool: typeof cards = []
  for (let i = 0; i < times; i++) pool.push(...cards)

  // Place cards one by one, always picking from available cards
  // that don't violate the maxConsecutive constraint
  const result: typeof cards = []
  const remaining = [...pool]

  while (remaining.length > 0) {
    const lastNote = result.length > 0 ? result[result.length - 1].note : null
    const lastLastNote = result.length > 1 ? result[result.length - 2].note : null

    // Determine forbidden note (if we've hit maxConsecutive)
    let forbidden: string | null = null
    if (maxConsecutive === 1 && lastNote) {
      forbidden = lastNote
    } else if (maxConsecutive === 2 && lastNote && lastNote === lastLastNote) {
      forbidden = lastNote
    }

    // Get eligible cards
    const eligible = forbidden
      ? remaining.filter(c => c.note !== forbidden)
      : remaining

    // Pick randomly from eligible (or all if none eligible)
    const pool2 = eligible.length > 0 ? eligible : remaining
    const pick = pool2[Math.floor(Math.random() * pool2.length)]
    const idx = remaining.findIndex(c => c === pick)
    remaining.splice(idx, 1)
    result.push({ ...pick, id: result.length + 1 })
  }

  return result
}


// Chromatic helper
const TREBLE_CHROMATIC: Record<string, string> = {
  'C#4': 'Sharp C — between C and D', 'Db4': 'Flat D — between C and D',
  'D#4': 'Sharp D — between D and E', 'Eb4': 'Flat E — between D and E',
  'F#4': 'Sharp F — between F and G', 'Gb4': 'Flat G — between F and G',
  'G#4': 'Sharp G — between G and A', 'Ab4': 'Flat A — between G and A',
  'A#4': 'Sharp A — between A and B', 'Bb4': 'Flat B — between A and B',
  'C#5': 'Sharp C — between C and D', 'Db5': 'Flat D — between C and D',
  'D#5': 'Sharp D — between D and E', 'Eb5': 'Flat E — between D and E',
  'F#5': 'Sharp F — between F and G', 'Gb5': 'Flat G — between F and G',
  'G#5': 'Sharp G — between G and A', 'Ab5': 'Flat A — between G and A',
  'A#5': 'Sharp A — between A and B', 'Bb5': 'Flat B — between A and B',
  'C#3': 'Sharp C — between C and D', 'Db3': 'Flat D — between C and D',
  'D#3': 'Sharp D — between D and E', 'Eb3': 'Flat E — between D and E',
}

function chromaticCards(notes: string[], idOffset = 0) {
  return notes.map((note, i) => n(idOffset + i + 1, note, 'treble', TREBLE_CHROMATIC[note] ?? note))
}

function mergeNatural(natural: string[], chromatic: string[]) {
  return [...trebleCards(natural), ...chromaticCards(chromatic, natural.length)]
}

// Chromatic note sets per level range
const L6_CHROMATIC = ['C#4','Db4','D#4','Eb4','F#4','Gb4','G#4','Ab4']
const L7_CHROMATIC = [...L6_CHROMATIC, 'A#4','Bb4','C#5','Db5','D#5','Eb5']
const L8_CHROMATIC = [...L7_CHROMATIC, 'F#5','Gb5','G#5','Ab5','A#5','Bb5']
const L9_CHROMATIC = [...L8_CHROMATIC, 'A#3','Bb3']
const L10_CHROMATIC = [
  // Octave 3 chromatics (F3-B3 range)
  'F#3','Gb3','G#3','Ab3','A#3','Bb3',
  // Octave 4 chromatics
  'C#4','Db4','D#4','Eb4','F#4','Gb4','G#4','Ab4','A#4','Bb4',
  // Octave 5 chromatics
  'C#5','Db5','D#5','Eb5','F#5','Gb5','G#5','Ab5','A#5','Bb5',
  // Octave 6 chromatics (C6-E6 range)
  'C#6','Db6','D#6','Eb6',
]

export const SIGHT_READ_DECKS: Deck[] = [
  {
    id: 'sight-read-treble-free',
    title: 'Treble Clef',
    description: 'Read notes on the treble staff — C4 to F5.',
    tag: 'free',
    cards: trebleCards(FREE_TREBLE),
  },
  {
    id: 'sight-read-bass-free',
    title: 'Bass Clef',
    description: 'Read notes on the bass staff — G2 to C4.',
    tag: 'free',
    cards: bassCards(FREE_BASS),
  },
  {
    id: 'sight-read-treble-1',
    title: 'Level 1',
    description: 'C4 and G4 only — the two anchor notes.',
    tag: 'free',
    cards: repeatCards(trebleCards(L1), 4, 2),
  },
  {
    id: 'sight-read-treble-2',
    title: 'Level 2',
    description: 'C4 through G4 — five notes.',
    tag: 'free',
    cards: repeatCards(trebleCards(L2), 3, 1),
  },
  {
    id: 'sight-read-treble-3',
    title: 'Level 3',
    description: 'C4 through C5 — one full octave.',
    tag: 'free',
    cards: repeatCards(trebleCards(L3), 2, 1),
  },
  {
    id: 'sight-read-treble-4',
    title: 'Level 4',
    description: 'C4 through A5 — extended range.',
    tag: 'free',
    cards: trebleCards(L4),
  },
  {
    id: 'sight-read-treble-5',
    title: 'Level 5',
    description: 'A3 through C6 — full treble range.',
    tag: 'free',
    cards: trebleCards(L5),
  },
  {
    id: 'sight-read-treble-6',
    title: 'Level 6',
    description: 'C4 through G4 — with sharps and flats.',
    tag: 'free',
    cards: repeatCards(mergeNatural(L2, L6_CHROMATIC), 2, 1),
  },
  {
    id: 'sight-read-treble-7',
    title: 'Level 7',
    description: 'C4 through C5 — with sharps and flats.',
    tag: 'free',
    cards: repeatCards(mergeNatural(L3, L7_CHROMATIC), 2, 1),
  },
  {
    id: 'sight-read-treble-8',
    title: 'Level 8',
    description: 'C4 through A5 — with sharps and flats.',
    tag: 'free',
    cards: mergeNatural(L4, L8_CHROMATIC),
  },
  {
    id: 'sight-read-treble-9',
    title: 'Level 9',
    description: 'A3 through C6 — with sharps and flats.',
    tag: 'free',
    cards: mergeNatural(L5, L9_CHROMATIC),
  },
  {
    id: 'sight-read-treble-10',
    title: 'Level 10',
    description: 'Full range F3–E6 — all chromatic notes.',
    tag: 'free',
    cards: mergeNatural(L10, L10_CHROMATIC),
  },
]

export const SIGHT_READ_PRO_IDS = [
  'sight-read-treble-1',
  'sight-read-treble-2',
  'sight-read-treble-3',
  'sight-read-treble-4',
  'sight-read-treble-5',
  'sight-read-treble-6',
  'sight-read-treble-7',
  'sight-read-treble-8',
  'sight-read-treble-9',
  'sight-read-treble-10',
]
