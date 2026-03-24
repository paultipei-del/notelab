import { Deck } from './types'

function n(id: number, note: string, back: string) {
  return { id, type: 'staff' as const, front: note, back, note, clef: 'grand' as const }
}

function grandCards(notes: string[], idOffset = 0) {
  return notes.map((note, i) => n(idOffset + i + 1, note, note))
}

function repeatCards(cards: ReturnType<typeof grandCards>, times: number, maxConsecutive = 1) {
  const pool: typeof cards = []
  for (let i = 0; i < times; i++) pool.push(...cards)
  const result: typeof cards = []
  const remaining = [...pool]
  while (remaining.length > 0) {
    const lastNote = result.length > 0 ? result[result.length - 1].note : null
    const lastLastNote = result.length > 1 ? result[result.length - 2].note : null
    let forbidden: string | null = null
    if (maxConsecutive === 1 && lastNote) forbidden = lastNote
    else if (maxConsecutive === 2 && lastNote && lastNote === lastLastNote) forbidden = lastNote
    const eligible = forbidden ? remaining.filter(c => c.note !== forbidden) : remaining
    const pool2 = eligible.length > 0 ? eligible : remaining
    const pick = pool2[Math.floor(Math.random() * pool2.length)]
    const idx = remaining.findIndex(c => c === pick)
    remaining.splice(idx, 1)
    result.push({ ...pick, id: result.length + 1 })
  }
  return result
}

function mergeGrand(natural: string[], chromatic: string[]) {
  return [...grandCards(natural), ...grandCards(chromatic, natural.length)]
}

const GL_FREE = ['F3', 'C4', 'G4']
const GL1 = ['F3', 'C4', 'G4']
const GL2 = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5']
const GL3 = ['F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5']
const GL4 = ['C2','D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6']

const GC6 = ['F#3','Gb3','G#3','Ab3','A#3','Bb3','C#4','Db4','D#4','Eb4','F#4','Gb4']
const GC7 = [...GC6,'C#3','Db3','D#3','Eb3','G#4','Ab4','A#4','Bb4','C#5','Db5']
const GC8 = [...GC7,'F#2','Gb2','G#2','Ab2','A#2','Bb2','C#2','Db2','D#5','Eb5','F#5','Gb5']
const GC9 = [...GC8,'D#2','Eb2','G#5','Ab5','A#5','Bb5']
const GC10 = [...GC9,'C#6','Db6','D#6','Eb6']

export const GRAND_STAFF_DECKS: Deck[] = [
  {
    id: 'sight-read-grand-free',
    title: 'Grand Staff',
    description: 'F3, Middle C, and G4 — the three landmark notes.',
    tag: 'free',
    cards: repeatCards(grandCards(GL_FREE), 4, 2),
  },
  {
    id: 'sight-read-grand-1',
    title: 'Level 1',
    description: 'F3, Middle C, and G4 — anchor notes across both staves.',
    tag: 'free',
    cards: repeatCards(grandCards(GL1), 4, 2),
  },
  {
    id: 'sight-read-grand-2',
    title: 'Level 2',
    description: 'C3 through C5 — one octave each direction from Middle C.',
    tag: 'free',
    cards: repeatCards(grandCards(GL2), 2, 1),
  },
  {
    id: 'sight-read-grand-3',
    title: 'Level 3',
    description: 'F2 through G5 — extended grand staff range.',
    tag: 'free',
    cards: grandCards(GL3),
  },
  {
    id: 'sight-read-grand-4',
    title: 'Level 4',
    description: 'C2 through C6 — full grand staff range.',
    tag: 'free',
    cards: grandCards(GL4),
  },
  {
    id: 'sight-read-grand-5',
    title: 'Level 5',
    description: 'C2 through C6 — all natural notes.',
    tag: 'free',
    cards: grandCards(GL4),
  },
  {
    id: 'sight-read-grand-6',
    title: 'Level 6',
    description: 'C3 through C5 — with sharps and flats.',
    tag: 'free',
    cards: mergeGrand(GL2, GC6),
  },
  {
    id: 'sight-read-grand-7',
    title: 'Level 7',
    description: 'F2 through G5 — with sharps and flats.',
    tag: 'free',
    cards: mergeGrand(GL3, GC7),
  },
  {
    id: 'sight-read-grand-8',
    title: 'Level 8',
    description: 'C2 through C6 — with sharps and flats.',
    tag: 'free',
    cards: mergeGrand(GL4, GC8),
  },
  {
    id: 'sight-read-grand-9',
    title: 'Level 9',
    description: 'C2 through C6 — extended chromatic range.',
    tag: 'free',
    cards: mergeGrand(GL4, GC9),
  },
  {
    id: 'sight-read-grand-10',
    title: 'Level 10',
    description: 'C2 through C6 — full chromatic grand staff.',
    tag: 'free',
    cards: mergeGrand(GL4, GC10),
  },
]

export const GRAND_STAFF_PRO_IDS = [
  'sight-read-grand-1',
  'sight-read-grand-2',
  'sight-read-grand-3',
  'sight-read-grand-4',
  'sight-read-grand-5',
  'sight-read-grand-6',
  'sight-read-grand-7',
  'sight-read-grand-8',
  'sight-read-grand-9',
  'sight-read-grand-10',
]
