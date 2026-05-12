'use client'

import { TOOLS, CATEGORY_META } from '@/lib/toolsCatalog'

/**
 * Page hero for /tools. Eyebrow + serif title + intro + meta line.
 * Meta line counts categories from CATEGORY_META plus the Reference
 * shelf (one extra section) — so "4 categories" stays accurate as
 * tools shift around.
 */
export default function ToolsHero() {
  const total = TOOLS.length
  // 4 user-facing categories: 3 in CATEGORY_META (drills/theory/practice)
  // plus the Reference shelf. Dashboard is a treatment, not a section.
  const categoryCount = CATEGORY_META.length + 1

  return (
    <section className="nl-tool-hero">
      <span className="nl-tool-hero__eyebrow">Tools</span>
      <h1 className="nl-tool-hero__title">
        Interactive exercises and<br />
        <em>reference tools</em>
      </h1>
      <p className="nl-tool-hero__lead">
        Tap, drill, build, and look things up. Some you&rsquo;ll keep open in a
        side tab; others you&rsquo;ll reach for once and remember. The
        practice-room basics live at the top so they&rsquo;re always at hand.
      </p>
      <p className="nl-tool-hero__meta">
        {total} tools across {categoryCount} categories · all free, some with Pro upgrades
      </p>
    </section>
  )
}
