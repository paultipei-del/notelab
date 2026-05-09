'use client'

import type { StudyMode } from '@/lib/types'

/**
 * Modes addressable from the mobile tab row. Superset of StudyMode +
 * 'quiz' (separate engine on desktop) + 'browse' (separate viewMode on
 * desktop). On mobile, all six are first-class tabs so the user is
 * never trapped inside one engine.
 */
export type MobileTabMode = StudyMode | 'quiz' | 'browse'

export interface MobileTab {
  id: MobileTabMode
  /** Full label rendered inside the pill. Use '✦' for icon-only. */
  label: string
  /** When true, paint with the brick-red Quiz treatment. */
  quizStyle?: boolean
  /** When true, render at icon-only width (used for play). */
  iconOnly?: boolean
}

export interface MobileStudyChromeProps {
  /** Currently active tab — drives the active-pill highlight. */
  activeTab: MobileTabMode
  tabs: MobileTab[]
  onTabClick: (mode: MobileTabMode) => void
  onBack: () => void
  deckName: string
  /** Right-aligned metric in the compact strip. */
  meta: React.ReactNode
}

/**
 * Compact one-row session strip + single-row mode-tab bar. Replaces the
 * desktop two-row topbar + two-row mode toolbar on mobile. Scoped to
 * mobile only via JS conditional render (parent) — CSS classes also
 * have @media (max-width: 767.98px) flex-chain overrides for per-mode
 * scroll containers.
 */
export default function MobileStudyChrome({
  activeTab,
  tabs,
  onTabClick,
  onBack,
  deckName,
  meta,
}: MobileStudyChromeProps) {
  return (
    <>
      <header className="nl-study-mobile-strip">
        <button
          type="button"
          className="nl-study-mobile-strip__back"
          onClick={onBack}
        >
          ← Back
        </button>
        <div className="nl-study-mobile-strip__deck">{deckName}</div>
        <div className="nl-study-mobile-strip__meta">{meta}</div>
      </header>
      <div role="tablist" aria-label="Study mode" className="nl-study-mobile-tabs">
        {tabs.map(t => {
          const cls = [
            'nl-study-mobile-tab',
            activeTab === t.id ? 'nl-study-mobile-tab--active' : '',
            t.quizStyle ? 'nl-study-mobile-tab--quiz' : '',
            t.iconOnly ? 'nl-study-mobile-tab--play' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={cls}
              onClick={() => onTabClick(t.id)}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
