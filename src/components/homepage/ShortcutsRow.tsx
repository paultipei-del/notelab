'use client'

import Link from 'next/link'
import s from '@/components/flashcards/library/library.module.css'
import type { HomepageState } from './useHomepageState'

interface Shortcut {
  href: string
  label: string
  name: string
  meta: string
  emphasize?: boolean
}

const STATE_3_SHORTCUTS: Shortcut[] = [
  {
    href: '/programs',
    label: 'Curriculum · Try one',
    name: 'Programs',
    meta: 'CM, Reading, Rhythm',
    emphasize: true,
  },
  {
    href: '/flashcards',
    label: 'All flashcards',
    name: 'Library',
    meta: '37 sets · browse all',
  },
  {
    href: '/ear-training',
    label: 'Listening',
    name: 'Ear Training',
    meta: 'Real piano audio',
  },
  {
    href: '/learn',
    label: 'Reference',
    name: 'Learn',
    meta: '11-part guide',
  },
]

const SHORTCUTS_BY_STATE: Record<HomepageState, Shortcut[]> = {
  loading: STATE_3_SHORTCUTS,
  new: STATE_3_SHORTCUTS,
  'flashcards-only': STATE_3_SHORTCUTS,
  'program-only': STATE_3_SHORTCUTS,
  both: STATE_3_SHORTCUTS,
}

export interface ShortcutsRowProps {
  state: HomepageState
}

/**
 * Constant secondary-navigation row below the hero. 4-column on
 * desktop, 2-column on mobile (CSS-driven so both DOM trees coexist
 * but only the right one shows). One shortcut can be marked
 * `emphasize` for a slightly stronger treatment — used in State 3 to
 * nudge flashcard users toward Programs.
 */
export default function ShortcutsRow({ state }: ShortcutsRowProps) {
  const shortcuts = SHORTCUTS_BY_STATE[state] ?? STATE_3_SHORTCUTS

  return (
    <section
      style={{
        maxWidth: 1240,
        margin: '0 auto',
        padding: '8px 36px 56px',
        borderTop: '1px solid rgba(139, 105, 20, 0.18)',
        marginTop: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jost), system-ui, sans-serif',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#a0381c',
          opacity: 0.85,
          padding: '24px 0 16px',
        }}
      >
        Or take a different turn
      </div>

      {/* Desktop — 4 cols */}
      <div className={s.desktopOnly}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}
        >
          {shortcuts.map(sc => (
            <ShortcutCard key={sc.href} shortcut={sc} />
          ))}
        </div>
      </div>

      {/* Mobile — 2 cols */}
      <div className={s.mobileOnly}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            margin: '0 -16px',
          }}
        >
          {shortcuts.map(sc => (
            <ShortcutCard key={sc.href} shortcut={sc} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ShortcutCard({ shortcut }: { shortcut: Shortcut }) {
  return (
    <Link
      href={shortcut.href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '14px 16px',
        borderRadius: 4,
        background: shortcut.emphasize
          ? 'rgba(255, 250, 238, 0.7)'
          : 'rgba(255, 250, 238, 0.4)',
        border: shortcut.emphasize
          ? '1px solid rgba(160, 56, 28, 0.3)'
          : '1px solid rgba(139, 105, 20, 0.18)',
        textDecoration: 'none',
        color: 'inherit',
        minHeight: 64,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jost), system-ui, sans-serif',
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: shortcut.emphasize ? '#a0381c' : '#8a7560',
          fontWeight: 700,
          opacity: shortcut.emphasize ? 1 : 0.9,
        }}
      >
        {shortcut.label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 18,
          fontWeight: 500,
          color: '#1a1208',
          lineHeight: 1.15,
          letterSpacing: '-0.005em',
        }}
      >
        {shortcut.name}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontStyle: 'italic',
          fontSize: 12,
          color: '#8a7560',
        }}
      >
        {shortcut.meta}
      </div>
    </Link>
  )
}
