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


// ── BASS CLEF LEVELS ──
const BASS_NOTES_DESC: Record<string, string> = {
  'G4': 'Above bass staff — two ledger lines above',
  'F4': 'Above bass staff — ledger line space above',
  'E4': 'Above bass staff — first ledger line above',
  'D4': 'Above bass staff — space above',
  'C4': 'Middle C — ledger line above bass staff',
  'B3': 'First space above bass staff',
  'A3': 'Fifth line of bass staff',
  'G3': 'Fourth space of bass staff',
  'F3': 'Fourth line of bass staff',
  'E3': 'Third space of bass staff',
  'D3': 'Third line of bass staff',
  'C3': 'Second space of bass staff',
  'B2': 'Second line of bass staff',
  'A2': 'First space of bass staff',
  'G2': 'First line of bass staff',
  'F2': 'Below bass staff — first space below',
  'E2': 'Below bass staff — first ledger line below',
  'D2': 'Below bass staff — space below first ledger line',
  'C2': 'Below bass staff — second ledger line below',
  'B1': 'Below bass staff — third ledger line area',
  'A1': 'Below bass staff — third ledger line below',
}

const BASS_CHROMATIC_DESC: Record<string, string> = {
  'C#4': 'Sharp C above bass staff', 'Db4': 'Flat D above bass staff',
  'D#4': 'Sharp D above bass staff', 'Eb4': 'Flat E above bass staff',
  'C#3': 'Sharp C — second space', 'Db3': 'Flat D — third line area',
  'D#3': 'Sharp D — third line area', 'Eb3': 'Flat E — third space area',
  'F#3': 'Sharp F — fourth line area', 'Gb3': 'Flat G — fourth space area',
  'G#3': 'Sharp G — fourth space area', 'Ab3': 'Flat A — fifth line area',
  'A#3': 'Sharp A — fifth line area', 'Bb3': 'Flat B — above staff area',
  'C#2': 'Sharp C below bass staff', 'Db2': 'Flat D below bass staff',
  'D#2': 'Sharp D below bass staff', 'Eb2': 'Flat E — first ledger line area',
  'F#2': 'Sharp F below staff', 'Gb2': 'Flat G — first line area',
  'G#2': 'Sharp G — first line area', 'Ab2': 'Flat A — first space area',
  'A#2': 'Sharp A — first space area', 'Bb2': 'Flat B — second line area',
  'F#4': 'Sharp F above bass staff', 'Gb4': 'Flat G above bass staff',
  'G#4': 'Sharp G above bass staff', 'Ab4': 'Flat A above bass staff',
  'A#1': 'Sharp A below bass staff', 'Bb1': 'Flat B below bass staff',
  'G#1': 'Sharp G below bass staff', 'Ab1': 'Flat A below bass staff',
}

function bassLevelCards(notes: string[], idOffset = 0) {
  return notes.map((note, i) => ({
    id: idOffset + i + 1,
    type: 'staff' as const,
    front: note,
    back: BASS_NOTES_DESC[note] ?? note,
    note,
    clef: 'bass' as const,
  }))
}

function bassChromaticCards(notes: string[], idOffset = 0) {
  return notes.map((note, i) => ({
    id: idOffset + i + 1,
    type: 'staff' as const,
    front: note,
    back: BASS_CHROMATIC_DESC[note] ?? note,
    note,
    clef: 'bass' as const,
  }))
}

function mergeBass(natural: string[], chromatic: string[]) {
  return [...bassLevelCards(natural), ...bassChromaticCards(chromatic, natural.length)]
}

// Bass natural note sets
const BL1 = ['C4','F3']
const BL2 = ['C4','B3','A3','G3','F3']
const BL3 = ['C4','B3','A3','G3','F3','E3','D3','C3']
const BL4 = ['C4','B3','A3','G3','F3','E3','D3','C3','B2','A2','G2','F2','E2']
const BL5 = ['E4','D4','C4','B3','A3','G3','F3','E3','D3','C3','B2','A2','G2','F2','E2','D2','C2']
const BL10 = ['G4','F4','E4','D4','C4','B3','A3','G3','F3','E3','D3','C3','B2','A2','G2','F2','E2','D2','C2','B1','A1']

// Bass chromatic sets
const BC6 = ['F#3','Gb3','G#3','Ab3','A#3','Bb3','C#4','Db4']
const BC7 = [...BC6,'D#3','Eb3','C#3','Db3']
const BC8 = [...BC7,'F#2','Gb2','G#2','Ab2','A#2','Bb2','C#2','Db2']
const BC9 = [...BC8,'D#2','Eb2','D#4','Eb4','F#4','Gb4']
const BC10 = [...BC9,'G#4','Ab4','A#1','Bb1','G#1','Ab1']

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
  // ── BASS PRO LEVELS ──
  {
    id: 'sight-read-bass-1',
    title: 'Level 1',
    description: 'C4 and F3 — the two anchor notes.',
    tag: 'free',
    cards: repeatCards(bassLevelCards(BL1), 4, 2),
  },
  {
    id: 'sight-read-bass-2',
    title: 'Level 2',
    description: 'C4 through F3 — five notes.',
    tag: 'free',
    cards: repeatCards(bassLevelCards(BL2), 3, 1),
  },
  {
    id: 'sight-read-bass-3',
    title: 'Level 3',
    description: 'C4 through C3 — one full octave.',
    tag: 'free',
    cards: repeatCards(bassLevelCards(BL3), 2, 1),
  },
  {
    id: 'sight-read-bass-4',
    title: 'Level 4',
    description: 'C4 through E2 — extended range.',
    tag: 'free',
    cards: bassLevelCards(BL4),
  },
  {
    id: 'sight-read-bass-5',
    title: 'Level 5',
    description: 'E4 through C2 — full bass range.',
    tag: 'free',
    cards: bassLevelCards(BL5),
  },
  {
    id: 'sight-read-bass-6',
    title: 'Level 6',
    description: 'C4 through F3 — with sharps and flats.',
    tag: 'free',
    cards: repeatCards(mergeBass(BL2, BC6), 2, 1),
  },
  {
    id: 'sight-read-bass-7',
    title: 'Level 7',
    description: 'C4 through C3 — with sharps and flats.',
    tag: 'free',
    cards: repeatCards(mergeBass(BL3, BC7), 2, 1),
  },
  {
    id: 'sight-read-bass-8',
    title: 'Level 8',
    description: 'C4 through E2 — with sharps and flats.',
    tag: 'free',
    cards: mergeBass(BL4, BC8),
  },
  {
    id: 'sight-read-bass-9',
    title: 'Level 9',
    description: 'E4 through C2 — with sharps and flats.',
    tag: 'free',
    cards: mergeBass(BL5, BC9),
  },
  {
    id: 'sight-read-bass-10',
    title: 'Level 10',
    description: 'Full range G4–A1 — all chromatic notes.',
    tag: 'free',
    cards: mergeBass(BL10, BC10),
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
  'sight-read-bass-1',
  'sight-read-bass-2',
  'sight-read-bass-3',
  'sight-read-bass-4',
  'sight-read-bass-5',
  'sight-read-bass-6',
  'sight-read-bass-7',
  'sight-read-bass-8',
  'sight-read-bass-9',
  'sight-read-bass-10',
]
