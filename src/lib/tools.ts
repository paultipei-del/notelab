export type ToolCard = {
  href: string
  title: string
  desc: string
  badge: string
  cta: string
  group: 'Drills' | 'Theory' | 'Practice' | 'Reference'
}

export const TOOLS: ToolCard[] = [
  {
    href: '/sight-read',
    title: 'Staff Recognition',
    desc: 'Play notes on your piano as they appear on the staff. Treble, bass, and grand staff.',
    badge: 'Free + Pro',
    cta: 'Practice →',
    group: 'Drills',
  },
  {
    href: '/note-id',
    title: 'Note Identification',
    desc: 'Identify notes by name using letter buttons or a piano keyboard.',
    badge: 'Free + Pro',
    cta: 'Practice →',
    group: 'Drills',
  },
  {
    href: '/key-signatures',
    title: 'Key Signatures',
    desc: 'Circle of fifths explorer, staff drill, historical Affekt, and key ID quiz.',
    badge: 'Free',
    cta: 'Explore →',
    group: 'Theory',
  },
  {
    href: '/scale-builder',
    title: 'Scale Builder',
    desc: 'Build major and minor scales from any root using whole and half steps.',
    badge: 'Free',
    cta: 'Build →',
    group: 'Theory',
  },
  {
    href: '/scale-fingerings',
    title: 'Scale Fingerings',
    desc: 'Two-octave major and minor scale fingerings for both hands, with keyboard and staff views.',
    badge: 'Free',
    cta: 'Study →',
    group: 'Practice',
  },
  {
    href: '/tap-tempo',
    title: 'Tap Tempo Finder',
    desc: 'Tap or press a key in time — read the BPM and the matching Italian tempo marking instantly.',
    badge: 'Free',
    cta: 'Tap →',
    group: 'Practice',
  },
  {
    href: '/metronome',
    title: 'Metronome',
    desc: 'Adjust tempo from 20–400 BPM and keep a steady pulse with keyboard and slider control.',
    badge: 'Free',
    cta: 'Play →',
    group: 'Practice',
  },
  {
    href: '/note-chord-generator',
    title: 'Note & Chord Generator',
    desc: 'Generate random notes and chord qualities with timing controls, notation modes, and filters.',
    badge: 'Free',
    cta: 'Start →',
    group: 'Practice',
  },
  {
    href: '/click-counter',
    title: 'Click Counter',
    desc: 'Track reps and sets during practice with targets, undo, and session summaries.',
    badge: 'Free',
    cta: 'Count →',
    group: 'Practice',
  },
  {
    href: '/order-of-practice',
    title: 'Order of Practice',
    desc: 'Practice ideas and progressions through harmonic cycles in a structured sequence.',
    badge: 'Free',
    cta: 'Run →',
    group: 'Practice',
  },
  {
    href: '/rhythm',
    title: 'Rhythm Trainer',
    desc: 'Practice rhythmic patterns with a guided play-along — tap along to the beat or follow the notation.',
    badge: 'Free',
    cta: 'Practice →',
    group: 'Drills',
  },
  {
    href: '/glossary',
    title: 'Glossary',
    desc: 'Searchable reference of musical terms — French, German, Italian, abbreviations.',
    badge: 'Free',
    cta: 'Browse →',
    group: 'Reference',
  },
  {
    href: '/repertoire',
    title: 'Repertoire Browser',
    desc: 'Browse graded repertoire lists by level and exam board — CM, RCM, and more.',
    badge: 'Pro',
    cta: 'Browse →',
    group: 'Reference',
  },
]

export const TOOL_GROUPS: { label: 'Drills' | 'Theory' | 'Practice' | 'Reference'; description: string }[] = [
  { label: 'Drills', description: 'Interactive exercises — identify and respond in real time.' },
  { label: 'Theory', description: 'Build and explore music theory concepts hands-on.' },
  { label: 'Practice', description: 'Utilities for the practice room — keep time, find tempos, work fingerings.' },
  { label: 'Reference', description: 'Look things up — terms, fingerings, repertoire.' },
]
