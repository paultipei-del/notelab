export type ToolCard = {
  href: string
  title: string
  desc: string
  badge: string
  cta: string
  group: 'Drills' | 'Theory' | 'Reference'
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
    group: 'Theory',
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
    title: 'Repertoire Lists',
    desc: 'Browse graded repertoire lists by level and exam board — CM, RCM, and more.',
    badge: 'Pro',
    cta: 'Browse →',
    group: 'Reference',
  },
]

export const TOOL_GROUPS: { label: 'Drills' | 'Theory' | 'Reference'; description: string }[] = [
  { label: 'Drills', description: 'Interactive exercises — identify and respond in real time.' },
  { label: 'Theory', description: 'Build and explore music theory concepts hands-on.' },
  { label: 'Reference', description: 'Look things up — terms, fingerings, repertoire.' },
]
