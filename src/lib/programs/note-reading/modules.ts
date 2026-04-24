// Static curriculum config — no DB dependency.
// Progress is tracked separately in Supabase / localStorage.

export type NRTool = 'identify' | 'locate' | 'play'

export interface NRModuleDef {
  id: string
  title: string
  subtitle: string
  description: string
  clef: 'treble' | 'bass' | 'grand'
  notes: string[]          // pitch strings: 'C4', 'F#4', 'Bb3'
  tools: NRTool[]          // ordered — Locate & Play unlock after Identify mastered
  unlockAfter: string[]    // ALL listed module IDs must be complete
  criteria: {
    identifyAccuracy?: number    // 0–1
    locateAccuracy?: number      // 0–1
    playAccuracy?: number        // 0–1
    playAvgResponseMs?: number
    sessions: number             // consecutive passing sessions required
  }
  comingSoon?: boolean
}

export const NOTE_READING_MODULES: NRModuleDef[] = [
  {
    id: 'landmarks',
    title: 'Landmark Notes',
    subtitle: 'Grand staff anchors',
    description:
      'Seven reference points that anchor everything else — Middle C, the open strings of each staff, and the spaces between. Make these automatic before drilling all notes.',
    clef: 'grand',
    notes: ['C4', 'G4', 'B4', 'D5', 'F5', 'B3', 'G3'],
    tools: ['identify', 'locate', 'play'],
    unlockAfter: [],
    criteria: {
      identifyAccuracy: 0.95,
      locateAccuracy: 0.95,
      playAccuracy: 0.95,
      playAvgResponseMs: 4500,
      sessions: 3,
    },
  },
  {
    id: 'treble-basics',
    title: 'Treble Clef — White Keys',
    subtitle: 'E4 through F5',
    description:
      'All natural notes on the treble staff from E4 (bottom line) to F5 (top line). Build automatic recognition of each line and space.',
    clef: 'treble',
    notes: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'],
    tools: ['identify', 'locate', 'play'],
    unlockAfter: ['landmarks'],
    criteria: { identifyAccuracy: 0.95, locateAccuracy: 0.95, playAccuracy: 0.95, playAvgResponseMs: 4000, sessions: 3 },
  },
  {
    id: 'bass-basics',
    title: 'Bass Clef — White Keys',
    subtitle: 'G2 through A3',
    description:
      'All natural notes on the bass staff from G2 (bottom line) to A3 (top line). Solidify bass reading as independent from treble.',
    clef: 'bass',
    notes: ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3'],
    tools: ['identify', 'locate', 'play'],
    unlockAfter: ['landmarks'],
    criteria: { identifyAccuracy: 0.95, locateAccuracy: 0.95, playAccuracy: 0.95, playAvgResponseMs: 4000, sessions: 3 },
  },
  {
    id: 'grand-integration',
    title: 'Grand Staff Integration',
    subtitle: 'Both clefs, drawn randomly',
    description:
      'Both clefs, drawn randomly. Train your ability to switch between treble and bass reading on the fly.',
    clef: 'grand',
    notes: [
      'E4','F4','G4','A4','B4','C5','D5','E5','F5',  // treble
      'G2','A2','B2','C3','D3','E3','F3','G3','A3',  // bass
    ],
    tools: ['identify', 'locate', 'play'],
    unlockAfter: ['treble-basics', 'bass-basics'],
    criteria: { identifyAccuracy: 0.95, locateAccuracy: 0.95, playAccuracy: 0.95, playAvgResponseMs: 3500, sessions: 3 },
  },
  {
    id: 'ledger-lines',
    title: 'Ledger Lines',
    subtitle: 'Above, below, and in between',
    description:
      'Notes outside the staff — up to three ledger lines above treble and below bass. Learn to count intervals from landmarks rather than memorizing positions.',
    clef: 'grand',
    notes: [
      // Above treble (up to 3 ledger lines)
      'A5','B5','C6','D6','E6',
      // Overlap / middle-C zone
      'B3','C4','D4','A3',
      // Below bass (up to 3 ledger lines)
      'F2','E2','D2','C2','B1',
    ],
    tools: ['identify', 'locate', 'play'],
    unlockAfter: ['grand-integration'],
    criteria: { identifyAccuracy: 0.95, locateAccuracy: 0.95, playAccuracy: 0.95, playAvgResponseMs: 4500, sessions: 3 },
  },
  {
    id: 'accidentals',
    title: 'Accidentals in Context',
    subtitle: 'Sharps, flats, and naturals on the grand staff',
    description:
      'Notes with sharps, flats, and naturals. Read the accidental and the letter as a single recognition, not two steps.',
    clef: 'grand',
    notes: [
      // Treble sharps
      'F#4','G#4','A#4','C#5','D#5','F#5','C#6',
      // Treble flats
      'Eb4','Gb4','Ab4','Bb4','Db5','Eb5','Gb5','Bb5',
      // Bass sharps
      'F#2','G#2','C#3','D#3','F#3','G#3','A#3',
      // Bass flats
      'Ab2','Bb2','Db3','Eb3','Gb3','Ab3','Bb3',
      // Overlap-zone accidentals
      'Db4','D#4',
    ],
    tools: ['identify', 'locate', 'play'],
    unlockAfter: ['ledger-lines'],
    criteria: { identifyAccuracy: 0.95, locateAccuracy: 0.95, playAccuracy: 0.95, playAvgResponseMs: 4500, sessions: 3 },
  },
  {
    id: 'speed-drills',
    title: 'Full Range Speed Drills',
    subtitle: "Everything you've learned, at speed",
    description:
      "Everything you've learned, at speed. Master criteria: 95% accuracy at 1.5 seconds or faster per note.",
    clef: 'grand',
    notes: [
      // Treble naturals
      'E4','F4','G4','A4','B4','C5','D5','E5','F5',
      // Bass naturals
      'G2','A2','B2','C3','D3','E3','F3','G3','A3',
      // Ledger zones
      'A5','B5','C6','D6','E6',
      'B3','C4','D4',
      'F2','E2','D2','C2','B1',
      // Common accidentals
      'F#4','Bb4','Eb4','C#5','F#5','Ab4','G#4','D#5',
      'F#3','C#3','Bb3','Eb3','Ab3','G#2','A#3','Db4',
    ],
    tools: ['identify', 'locate', 'play'],
    unlockAfter: ['accidentals'],
    criteria: { identifyAccuracy: 0.95, locateAccuracy: 0.95, playAccuracy: 0.95, playAvgResponseMs: 1500, sessions: 3 },
  },
  {
    id: 'melodic-fragments',
    title: 'Melodic Fragments',
    subtitle: 'Multi-note phrases',
    description:
      'Read 3–5 note phrases as a unit. Play each note in sequence — feedback after the phrase.',
    clef: 'grand',
    notes: [],
    tools: ['play'],
    unlockAfter: ['speed-drills'],
    criteria: { playAccuracy: 0.85, sessions: 3 },
    comingSoon: true,
  },
]

export function getNRModule(id: string): NRModuleDef | undefined {
  return NOTE_READING_MODULES.find(m => m.id === id)
}

// SM-2 style weighted note pool.
// Weak notes (low accuracy) appear more frequently; strong notes less.
// noteStats is keyed by full pitch string ('C4', 'F#4').
// All notes not in noteStats are treated as 'unseen'.
export function buildWeightedPool(
  notePool: string[],
  noteStats: import('./types').NoteStats[],
  sessionLength = 20,
): string[] {
  const WEIGHTS: Record<string, number> = { unseen: 3, weak: 4, developing: 2, strong: 1 }

  const unique = [...new Set(notePool)]
  const weighted: string[] = []
  for (const note of unique) {
    const stats = noteStats.find(s => s.noteId === note)
    const level = stats?.masteryLevel ?? 'unseen'
    const w = WEIGHTS[level]
    for (let i = 0; i < w; i++) weighted.push(note)
  }

  // Fisher-Yates shuffle
  for (let i = weighted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[weighted[i], weighted[j]] = [weighted[j], weighted[i]]
  }

  // Allow repeats to reach sessionLength
  const result = [...weighted]
  while (result.length < sessionLength) {
    result.push(...weighted.slice(0, sessionLength - result.length))
  }

  return result.slice(0, sessionLength)
}
