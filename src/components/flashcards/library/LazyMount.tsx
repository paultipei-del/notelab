'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

export interface LazyMountProps {
  /** Reserved space until the section enters the viewport. */
  minHeight: number
  /** IntersectionObserver rootMargin — start mounting before fully visible. */
  rootMargin?: string
  children: ReactNode
}

/**
 * Defers rendering of expensive children until the placeholder enters
 * (or nears) the viewport. Once the children mount, they stay mounted —
 * scrolling back up doesn't trigger a re-mount.
 *
 * Unlike `content-visibility: auto`, this approach uses no paint
 * containment, so absolutely-positioned descendants (e.g. the museum
 * placard) can render outside the section's box without being clipped.
 */
export default function LazyMount({
  minHeight,
  rootMargin = '300px',
  children,
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, visible])

  if (visible) return <>{children}</>
  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />
}
