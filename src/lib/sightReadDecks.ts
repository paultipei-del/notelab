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
    cards: trebleCards(L1),
  },
  {
    id: 'sight-read-treble-2',
    title: 'Level 2',
    description: 'C4 through G4 — five notes.',
    tag: 'free',
    cards: trebleCards(L2),
  },
  {
    id: 'sight-read-treble-3',
    title: 'Level 3',
    description: 'C4 through C5 — one full octave.',
    tag: 'free',
    cards: trebleCards(L3),
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
]

export const SIGHT_READ_PRO_IDS = [
  'sight-read-treble-1',
  'sight-read-treble-2',
  'sight-read-treble-3',
  'sight-read-treble-4',
  'sight-read-treble-5',
]
