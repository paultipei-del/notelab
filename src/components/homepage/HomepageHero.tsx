'use client'

import { ReactNode } from 'react'
import s from '@/components/flashcards/library/library.module.css'
import { useAuth } from '@/hooks/useAuth'
import ShelfHero from './ShelfHero'
import ContinueCardHero from './ContinueCardHero'
import ShortcutsRow from './ShortcutsRow'
import { useHomepageState } from './useHomepageState'

export interface HomepageHeroProps {
  /** Rendered when the user's state isn't yet specialized. */
  fallback: ReactNode
}

/**
 * Top-level homepage dispatcher. Phase 1 specializes only the
 * `flashcards-only` state — all others (and the loading transition)
 * fall through to `fallback` (the legacy homepage). Subsequent phases
 * will branch on `program-only`, `both`, and `new`.
 */
export default function HomepageHero({ fallback }: HomepageHeroProps) {
  const { user } = useAuth()
  const { state, ctx } = useHomepageState(user)

  // displayName mirrors the legacy homepage's derivation so the
  // greeting reads identically when we swap layouts.
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

  return <>{fallback}</>
}
