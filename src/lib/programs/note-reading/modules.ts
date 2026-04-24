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
      'All natural notes on the treble staff, from E4 on the first line to F5 on the top line. No ledger lines, no accidentals — just the five lines and four spaces.',
    clef: 'treble',
    notes: ['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'],
    tools: ['identify', 'play'],
    unlockAfter: ['landmarks'],
    criteria: { identifyAccuracy: 0.9, playAccuracy: 0.9, playAvgResponseMs: 4000, sessions: 2 },
  },
  {
    id: 'bass-basics',
    title: 'Bass Clef — White Keys',
    subtitle: 'G2 through A3',
    description:
      'All natural notes on the bass staff, from G2 on the first line to A3 on the fifth line. The mirror image of the treble — build fluency before combining the staves.',
    clef: 'bass',
    notes: ['G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3'],
    tools: ['identify', 'play'],
    unlockAfter: ['landmarks'],
    criteria: { identifyAccuracy: 0.9, playAccuracy: 0.9, playAvgResponseMs: 4000, sessions: 2 },
  },
  {
    id: 'grand-integration',
    title: 'Grand Staff Integration',
    subtitle: 'Both staves at once',
    description:
      'Treble and bass notes mixed unpredictably. The clef switches without warning — you must identify the staff first, then the note. Requires both treble and bass mastery.',
    clef: 'grand',
    notes: [
      'E4','F4','G4','A4','B4','C5','D5','E5','F5',  // treble
      'G2','A2','B2','C3','D3','E3','F3','G3','A3',  // bass
    ],
    tools: ['play'],
    unlockAfter: ['treble-basics', 'bass-basics'],
    criteria: { playAccuracy: 0.9, playAvgResponseMs: 3500, sessions: 3 },
  },
  {
    id: 'ledger-lines',
    title: 'Ledger Lines',
    subtitle: 'Above, below, and in between',
    description:
      'Notes that require ledger lines — one line above and below each staff, plus the critical middle-C overlap zone shared by treble and bass.',
    clef: 'grand',
    notes: [
      // Above treble
      'G5','A5','B5',
      // Below treble (middle C zone)
      'D4','C4',
      // Above bass
      'C4','D4',
      // Below bass
      'F2','E2',
    ],
    tools: ['identify', 'play'],
    unlockAfter: ['grand-integration'],
    criteria: { identifyAccuracy: 0.9, playAccuracy: 0.9, playAvgResponseMs: 4000, sessions: 2 },
  },
  {
    id: 'accidentals',
    title: 'Accidentals in Context',
    subtitle: 'Sharps and flats on the grand staff',
    description:
      'Sharps and flats layered onto the notes you already know. The staff position is the same — but now you must read the accidental too. Enharmonic precision required.',
    clef: 'grand',
    notes: [
      'F#4','Bb4','Eb4','C#5','F#5',
      'Ab3','Bb3','F#3','Eb3','C#3',
    ],
    tools: ['identify', 'play'],
    unlockAfter: ['ledger-lines'],
    criteria: { identifyAccuracy: 0.88, playAccuracy: 0.88, sessions: 2 },
  },
  {
    id: 'speed-drills',
    title: 'Full Range Speed Drills',
    subtitle: 'Everything, fast',
    description:
      'The entire note pool — white keys, accidentals, all ledger line zones. Target: under 2.5 seconds per note. Three passing sessions to complete.',
    clef: 'grand',
    notes: [
      // Treble
      'E4','F4','G4','A4','B4','C5','D5','E5','F5',
      'F#4','Bb4','Eb4','C#5','F#5',
      'G5','A5','B5',
      'C4','D4',
      // Bass
      'G2','A2','B2','C3','D3','E3','F3','G3','A3',
      'Ab3','Bb3','F#3','Eb3','C#3',
      'F2','E2',
    ],
    tools: ['play'],
    unlockAfter: ['accidentals'],
    criteria: { playAccuracy: 0.88, playAvgResponseMs: 2500, sessions: 3 },
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
