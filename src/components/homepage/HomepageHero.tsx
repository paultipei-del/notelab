'use client'

import { ReactNode } from 'react'
import s from '@/components/flashcards/library/library.module.css'
import { useAuth } from '@/hooks/useAuth'
import ShelfHero from './ShelfHero'
import ContinueCardHero from './ContinueCardHero'
import ProgramHero from './ProgramHero'
import TwoPaneHero from './TwoPaneHero'
import NewUserHero from './NewUserHero'
import ShortcutsRow from './ShortcutsRow'
import { useHomepageState } from './useHomepageState'

export interface HomepageHeroProps {
  /** Rendered when the user's state isn't yet specialized. */
  fallback: ReactNode
}

/**
 * Top-level homepage dispatcher. All four states (`flashcards-only`,
 * `program-only`, `both`, `new`) now have specialized heroes. The
 * `fallback` (legacy homepage) is reachable only as a last-resort
 * safety net for the `loading` state and any future state mismatches —
 * scheduled for removal one ship cycle after Phase 4 lands cleanly.
 */
export default function HomepageHero({ fallback }: HomepageHeroProps) {
  const { user } = useAuth()
  const { state, ctx } = useHomepageState(user)

  const displayName: string =
    (user?.user_metadata?.display_name as string | undefined)?.split(' ')[0] ??
    (user?.email ? user.email.split('@')[0] : 'there')

  if (state === 'flashcards-only' && ctx.featured) {
    return (
      <>
        <div className={s.desktopOnly}>
          <ShelfHero ctx={ctx} displayName={displayName} />
        </div>
        <div className={s.mobileOnly}>
          <ContinueCardHero ctx={ctx} displayName={displayName} />
        </div>
        <ShortcutsRow state={state} />
      </>
    )
  }

  if (state === 'program-only' && ctx.program) {
    return (
      <>
        <ProgramHero ctx={ctx} displayName={displayName} />
        <ShortcutsRow state={state} />
      </>
    )
  }

  if (state === 'both' && ctx.program && ctx.featured) {
    return (
      <>
        <TwoPaneHero ctx={ctx} displayName={displayName} />
        <ShortcutsRow state={state} />
      </>
    )
  }

  if (state === 'new') {
    return (
      <>
        <NewUserHero displayName={displayName} />
        <ShortcutsRow state={state} />
      </>
    )
  }

  return <>{fallback}</>
}
