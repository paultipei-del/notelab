'use client'

import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query. Returns `false` during SSR and the first
 * client paint to avoid hydration mismatches; the real value lands on the
 * effect after mount. Callers that need a hard layout decision (mobile vs
 * desktop) should accept this one-frame default and render the desktop
 * variant first if that's the safer fallback.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * Convenience: returns true when the viewport is below the desktop
 * breakpoint (768px). Mirrors Tailwind's `md` cutoff and is the natural
 * line where the desktop sidebar+scroll pattern becomes too cramped.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767.98px)')
}
