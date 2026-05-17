// Single source of truth for the /tools page. Categories drive the
// page's vertical sections + colour stripe on each ToolCard.
//
// Three tools (Metronome, Tap Tempo Finder, Click Counter) live in the
// `dashboard` category and are promoted into the top instrument-panel
// strip. They are NOT also rendered in Practice — promoted, not
// duplicated. Practice therefore has 3 cards, not 6.

export type ToolCategory =
  | 'dashboard'
  | 'drills'
  | 'theory'
  | 'practice'
  | 'reference'

export type ToolStatus = 'free' | 'pro' | 'free-pro' | 'none'

export interface Tool {
  id: string
  href: string
  category: ToolCategory
  status: ToolStatus
  name: string
  pitch: string
  ctaVerb: string
  /** Caption beneath the gauge readout — only used for dashboard cards. */
  gaugeLabel?: string
  /** Small italic note rendered under the tool name on dashboard cards. */
  gaugeNote?: string
}

export const TOOLS: Tool[] = [
  // ─────────────── DASHBOARD (always-at-hand) ───────────────
  {
    id: 'metronome',
    href: '/metronome',
    category: 'dashboard',
    status: 'free',
    name: 'Metronome',
    pitch: 'Keep a steady pulse with keyboard and slider control.',
    ctaVerb: 'Play',
    gaugeLabel: 'BPM',
    gaugeNote: 'last tempo',
  },
  {
    id: 'tap-tempo',
    href: '/tap-tempo',
    category: 'dashboard',
    status: 'free',
    name: 'Tap Tempo Finder',
    pitch: 'Tap in time. Read the BPM and Italian marking instantly.',
    ctaVerb: 'Tap',
    gaugeLabel: 'tap to start',
    gaugeNote: 'find a tempo',
  },
  {
    id: 'click-counter',
    href: '/click-counter',
    category: 'dashboard',
    status: 'free',
    name: 'Click Counter',
    pitch: 'Track reps and sets during practice with targets and undo.',
    ctaVerb: 'Count',
    gaugeLabel: 'reps',
    gaugeNote: 'last session',
  },

  // ─────────────── DRILLS ───────────────
  // Staff Recognition + Note Identification were consolidated into
  // /sight-reading during the Phase 1-2 rebuild — both old hubs now
  // redirect there. One card replaces both.
  {
    id: 'sight-reading',
    href: '/sight-reading',
    category: 'drills',
    status: 'none',
    name: 'Sight Reading',
    pitch: 'Read notes one at a time. Letters, full piano, or real piano via mic.',
    ctaVerb: 'Practice',
  },
  {
    id: 'rhythm-trainer',
    href: '/rhythm',
    category: 'drills',
    status: 'free',
    name: 'Rhythm Trainer',
    pitch: 'Tap along to rhythmic patterns or follow the notation in real time.',
    ctaVerb: 'Practice',
  },

  // ─────────────── THEORY ───────────────
  {
    id: 'key-signatures',
    href: '/key-signatures',
    category: 'theory',
    status: 'free',
    name: 'Key Signatures',
    pitch: 'Circle of fifths explorer, staff drill, historical Affekt, key ID quiz.',
    ctaVerb: 'Explore',
  },
  {
    id: 'scale-builder',
    href: '/scale-builder',
    category: 'theory',
    status: 'free',
    name: 'Scale Builder',
    pitch: 'Build major and minor scales from any root using whole and half steps.',
    ctaVerb: 'Build',
  },
  {
    id: 'chord-id',
    href: '/tools/chord-id',
    category: 'theory',
    status: 'free',
    name: 'Chord Identifier',
    pitch: 'Play any chord on a MIDI or computer keyboard. See its name, Roman numeral, and grand-staff spelling in any key.',
    ctaVerb: 'Identify',
  },

  // ─────────────── PRACTICE ───────────────
  {
    id: 'scale-fingerings',
    href: '/scale-fingerings',
    category: 'practice',
    status: 'free',
    name: 'Scale Fingerings',
    pitch: 'Two-octave major and minor fingerings for both hands.',
    ctaVerb: 'Study',
  },
  {
    id: 'note-chord-generator',
    href: '/note-chord-generator',
    category: 'practice',
    status: 'free',
    name: 'Note & Chord Generator',
    pitch: 'Random notes and chord qualities with timing controls and filters.',
    ctaVerb: 'Start',
  },
  {
    id: 'order-of-practice',
    href: '/order-of-practice',
    category: 'practice',
    status: 'free',
    name: 'Order of Practice',
    pitch: 'Practice ideas and progressions through harmonic cycles in sequence.',
    ctaVerb: 'Run',
  },

  // ─────────────── REFERENCE ───────────────
  {
    id: 'glossary',
    href: '/glossary',
    category: 'reference',
    status: 'free',
    name: 'Glossary',
    pitch: 'Searchable reference of musical terms. French, German, Italian, abbreviations.',
    ctaVerb: 'Browse',
  },
  {
    id: 'repertoire',
    href: '/repertoire',
    category: 'reference',
    status: 'pro',
    name: 'Repertoire Browser',
    pitch: 'Graded piano repertoire by level. Search composer and title across the full CM Syllabus catalog.',
    ctaVerb: 'Browse',
  },
]

export const DASHBOARD_TOOLS = TOOLS.filter(t => t.category === 'dashboard')
export const DRILL_TOOLS = TOOLS.filter(t => t.category === 'drills')
export const THEORY_TOOLS = TOOLS.filter(t => t.category === 'theory')
export const PRACTICE_TOOLS = TOOLS.filter(t => t.category === 'practice')
export const REFERENCE_TOOLS = TOOLS.filter(t => t.category === 'reference')

export interface CategoryMeta {
  id: Exclude<ToolCategory, 'dashboard' | 'reference'>
  label: string
  blurb: string
  /** CSS custom-property name set on each section root. */
  cssVar: string
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    id: 'drills',
    label: 'Drills',
    blurb: 'Identify, respond, and stay sharp. Real-time exercises.',
    cssVar: '--tool-drills',
  },
  {
    id: 'theory',
    label: 'Theory',
    blurb: 'Build the structures. Key signatures, scales, and the rules behind them.',
    cssVar: '--tool-theory',
  },
  {
    id: 'practice',
    label: 'Practice',
    blurb: 'Utilities for the practice room. Work fingerings, run cycles, drill order.',
    cssVar: '--tool-practice',
  },
]

/** Storage keys consumed by `useDashboardGauges`. Defined here so the
 *  Metronome and Click Counter pages import the same constants when
 *  writing their last-known state. */
export const STORAGE_KEYS = {
  metronomeBpm: 'notelab-metronome-bpm',
  clickCounterState: 'notelab-clickcounter-state',
} as const
