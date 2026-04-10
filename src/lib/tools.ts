export type ToolCard = {
  href: string
  title: string
  desc: string
  badge: string
  cta: string
}

export const TOOLS: ToolCard[] = [
  {
    href: '/sight-read',
    title: 'Staff Recognition',
    desc: 'Play notes on your piano as they appear on the staff. Treble, bass, and grand staff.',
    badge: 'Free + Pro',
    cta: 'Practice →',
  },
  {
    href: '/note-id',
    title: 'Note Identification',
    desc: 'Identify notes by name using letter buttons or a piano keyboard.',
    badge: 'Free + Pro',
    cta: 'Practice →',
  },
  {
    href: '/key-signatures',
    title: 'Key Signatures',
    desc: 'Circle of fifths explorer, staff drill, historical Affekt, and key ID quiz.',
    badge: 'Free',
    cta: 'Explore →',
  },
  {
    href: '/scale-builder',
    title: 'Scale Builder',
    desc: 'Build major and minor scales from any root using whole and half steps.',
    badge: 'Free',
    cta: 'Build →',
  },
  {
    href: '/scale-fingerings',
    title: 'Scale Fingerings',
    desc: 'Two-octave major and minor scale fingerings for both hands, with keyboard and staff views.',
    badge: 'Free',
    cta: 'Study →',
  },
  {
    href: '/glossary',
    title: 'Glossary',
    desc: 'Searchable reference of musical terms — French, German, Italian, abbreviations.',
    badge: 'Free',
    cta: 'Browse →',
  },
  {
    href: '/repertoire',
    title: 'CM Repertoire',
    desc: 'Browse the complete CM repertoire lists by level — Preparatory through Advanced. Search across all levels.',
    badge: 'Pro',
    cta: 'Browse →',
  },
]
