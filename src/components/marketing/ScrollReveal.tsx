'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Wraps children in a div that fades+slides up as it enters the
 * viewport. Uses IntersectionObserver with rootMargin: 100px so the
 * reveal triggers slightly before the section hits the fold. Only
 * fires once; no re-trigger on scroll-up.
 *
 * The animation class (.nl-reveal / .is-visible) lives in globals.css
 * and is disabled under prefers-reduced-motion automatically.
 */
export default function ScrollReveal({
  children,
  /** Extra per-element delay in ms — useful for staggered grids. */
  delayMs = 0,
  as: Tag = 'div',
  className,
  style,
}: {
  children: ReactNode
  delayMs?: number
  as?: 'div' | 'section' | 'li' | 'article'
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // SSR-safe: bail if IO isn't supported.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            // Small per-element delay so staggered groups feel natural.
            const t = window.setTimeout(() => setVisible(true), delayMs)
            io.disconnect()
            return () => window.clearTimeout(t)
          }
        }
      },
      { rootMargin: '100px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delayMs])

  const classes = ['nl-reveal', visible ? 'is-visible' : '', className].filter(Boolean).join(' ')

  return (
    // @ts-expect-error dynamic element tag with ref is fine at runtime
    <Tag ref={ref} className={classes} style={style}>
      {children}
    </Tag>
  )
}
