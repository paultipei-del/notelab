'use client'

import { useEffect, useState } from 'react'

interface UseScrollSpyOptions {
  /** rootMargin for the IntersectionObserver. Default targets a band
   *  20-60% from the top of the viewport, which feels right for long
   *  scrolling content where users read in the upper third. */
  rootMargin?: string
  /** Distance from the bottom of the document where the LAST id is
   *  forced active even if its top has scrolled out of the IO band.
   *  Without this, scrolling all the way to the bottom of a short
   *  final section drops the active highlight. */
  bottomThreshold?: number
}

/**
 * Subscribe to which DOM section is currently in view. Returns the
 * index of the active id and a manual setter (used by click handlers
 * to update active state instantly without waiting for the next IO
 * tick — jumps smooth-scroll, but the highlight should land first).
 *
 * SSR-safe: returns 0 during the initial render and updates on the
 * effect after mount.
 */
export function useScrollSpy(
  ids: string[],
  options: UseScrollSpyOptions = {},
): { activeIndex: number; setActiveIndex: (i: number) => void } {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const idsKey = ids.join('|')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (ids.length === 0) return

    const elements = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    // Track the last-known intersection ratio per id so we can pick the
    // most-visible section across multiple IO callbacks.
    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }

        // Pick the id with the highest ratio. On ties, document order
        // wins (the first matching id is preferred), which keeps a
        // long section active until the next one becomes more visible.
        let bestId: string | null = null
        let bestRatio = 0
        for (const id of ids) {
          const r = ratios.get(id) ?? 0
          if (r > bestRatio) {
            bestRatio = r
            bestId = id
          }
        }
        if (bestId) {
          const idx = ids.indexOf(bestId)
          if (idx >= 0) setActiveIndex(idx)
        }
      },
      {
        rootMargin: options.rootMargin ?? '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      },
    )

    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, options.rootMargin])

  // Bottom-of-document edge case. If the user scrolls past the IO band
  // for the last section (e.g. a short final part whose top has left
  // the active zone), the IO callback fires with isIntersecting: false
  // and the active highlight would otherwise drop to whatever the
  // previous section was. Force the last index active when the scroll
  // container is within `bottomThreshold` px of its scroll end.
  //
  // The scroll container is .nl-page-scroll (layout-level wrapper),
  // not the window — body is locked to viewport height. Fall back to
  // window scroll for routes that don't render inside the wrapper.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (ids.length === 0) return
    const bottomThreshold = options.bottomThreshold ?? 80

    const scrollEl = document.querySelector<HTMLElement>('.nl-page-scroll')

    function checkBottom() {
      if (scrollEl) {
        if (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - bottomThreshold) {
          setActiveIndex(ids.length - 1)
        }
        return
      }
      const scrollPos = window.scrollY + window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      if (scrollPos >= docHeight - bottomThreshold) {
        setActiveIndex(ids.length - 1)
      }
    }

    const target: EventTarget = scrollEl ?? window
    target.addEventListener('scroll', checkBottom, { passive: true })
    checkBottom()
    return () => target.removeEventListener('scroll', checkBottom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, options.bottomThreshold])

  return { activeIndex, setActiveIndex }
}
