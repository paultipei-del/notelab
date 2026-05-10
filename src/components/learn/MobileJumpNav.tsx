'use client'

import { useEffect, useRef } from 'react'
import type { Part } from '@/app/learn/_data/parts'
import styles from './learn.module.css'

interface MobileJumpNavProps {
  parts: Part[]
  activeIndex: number
  onJump: (i: number) => void
}

/**
 * Horizontal Roman-numeral pill row, sticky beneath the global site
 * header on mobile. Twelve pills don't fit at 390px viewport so the
 * row scrolls horizontally; the active pill auto-centers when the
 * active change came from scroll-spy. Tap-driven changes skip the
 * auto-center for ~500ms so the user's manual choice doesn't bounce
 * back to the middle.
 */
export function MobileJumpNav({ parts, activeIndex, onJump }: MobileJumpNavProps) {
  const navRef = useRef<HTMLElement>(null)
  // True for ~500ms after a tap. While true, skip the auto-center
  // effect so the user's chosen pill doesn't get yanked to the middle.
  const userTappedRef = useRef(false)

  useEffect(() => {
    if (userTappedRef.current) {
      const t = window.setTimeout(() => {
        userTappedRef.current = false
      }, 500)
      return () => window.clearTimeout(t)
    }
    const nav = navRef.current
    if (!nav) return
    const activePill = nav.querySelector<HTMLElement>(`[data-pill-index="${activeIndex}"]`)
    activePill?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [activeIndex])

  function handleClick(i: number) {
    userTappedRef.current = true
    onJump(i)
    // Direct scrollTop on the .nl-page-scroll wrapper instead of
    // scrollIntoView — on iOS Safari, scrollIntoView triggers a
    // visual-viewport adjustment that pushes the SiteHeader up under
    // the status bar even though body has overflow: hidden. scrollTo
    // on a specific scroll container doesn't trigger that.
    const part = document.getElementById(`part-${i}`)
    const scrollEl = document.querySelector<HTMLElement>('.nl-page-scroll')
    if (!part || !scrollEl) return
    const partRect = part.getBoundingClientRect()
    const scrollRect = scrollEl.getBoundingClientRect()
    // 70px clearance for the sticky pill nav at the top of the wrapper.
    const target = partRect.top - scrollRect.top + scrollEl.scrollTop - 70
    scrollEl.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }

  return (
    <nav
      ref={navRef}
      className={styles.mobileJumpNav}
      aria-label="Jump to part"
    >
      {parts.map((p, i) => {
        const isActive = activeIndex === i
        return (
          <button
            key={p.slug}
            type="button"
            data-pill-index={i}
            className={`${styles.mobilePill} ${isActive ? styles.mobilePillActive : ''}`}
            onClick={() => handleClick(i)}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`Part ${p.num}: ${p.title}`}
          >
            {p.num}
          </button>
        )
      })}
    </nav>
  )
}
